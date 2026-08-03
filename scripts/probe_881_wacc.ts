// STEP 881 — driver6(자본비용) 원전 대조: DB 실측(우리 WACC 분포+구성요소) + 도미노 5단계 분해(시점 vs 방법 분리).
// 읽기만 · DB 쓰기 없음.
// 실행: npx tsx scripts/probe_881_wacc.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync } from "fs";
import { assembleWacc, creditSpreadFor } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

const q = (a: number[], p: number) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))].toFixed(6) : null; };

async function main() {
  const sb = createAdminClient();
  const asOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data!.as_of as string;

  type Row = { symbol: string; wacc: number; beta_unlevered: number; de_ratio: number; flags: { industry?: string } };
  const rows: Row[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("symbol,wacc,beta_unlevered,de_ratio,flags").eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as Row[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] 모집단 n=${rows.length}(515 기대)`);

  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const rfNow = +gi.riskfree_rate, erpNow = +gi.erp;
  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaRows = (await sb.from("damodaran_beta").select("industry, std_dev_equity")).data as { industry: string; std_dev_equity: number }[];
  const stdDevByInd = new Map(betaRows.map((b) => [b.industry, +b.std_dev_equity]));

  // ══════════════════════════ §2-1 우리 WACC 분포 + 도미노 백분위 ══════════════════════════
  const waccs = rows.map((r) => +r.wacc);
  const dominoWacc = 0.05354;
  const wacc_distribution = {
    n: waccs.length, min: q(waccs, 0), p05: q(waccs, 0.05), p25: q(waccs, 0.25), median: q(waccs, 0.5), p75: q(waccs, 0.75), p95: q(waccs, 0.95), max: q(waccs, 1),
    domino_original_wacc: dominoWacc,
    domino_percentile: +(waccs.filter((w) => w < dominoWacc).length / waccs.length).toFixed(4),
    note: "도미노 원전 WACC(0.05354)가 우리 515사 분포에서 차지하는 위치 — 하위 몇 %인지",
  };

  // 구성요소 분해(재계산 — revdcf_results엔 wacc 최종값만 저장, 중간값은 저장 안 됨 → assembleWacc로 재구성)
  const releveredBetas: number[] = [], costsOfEquity: number[] = [], afterTaxCoDs: number[] = [], debtWeights: number[] = [], deRatios: number[] = [], betaUnlevereds: number[] = [];
  let noIndustryMatch = 0;
  for (const r of rows) {
    const ind = r.flags?.industry;
    const sd = ind ? stdDevByInd.get(ind) : undefined;
    if (sd == null) { noIndustryMatch++; continue; }
    const spread = creditSpreadFor(sd, spreads);
    if (spread == null) { noIndustryMatch++; continue; }
    const asm = assembleWacc({ riskFree: rfNow, erp: erpNow, unleveredBetaCashAdj: +r.beta_unlevered, taxRate: usTax, deRatio: +r.de_ratio, creditSpread: spread });
    releveredBetas.push(asm.releveredBeta); costsOfEquity.push(asm.costOfEquity); afterTaxCoDs.push(asm.afterTaxCostOfDebt); debtWeights.push(asm.debtWeight);
    deRatios.push(+r.de_ratio); betaUnlevereds.push(+r.beta_unlevered);
  }
  const dist = (a: number[]) => ({ n: a.length, min: q(a, 0), p25: q(a, 0.25), median: q(a, 0.5), p75: q(a, 0.75), max: q(a, 1) });
  const component_distributions = {
    reconstructedFrom: `${releveredBetas.length}/${rows.length}(industry/spread 매칭 실패 ${noIndustryMatch}건 제외 — revdcf_results엔 중간값 미저장이라 assembleWacc 재실행으로 복원)`,
    beta_unlevered_cash_adj: dist(betaUnlevereds),
    de_ratio: dist(deRatios),
    relevered_beta: dist(releveredBetas),
    cost_of_equity: dist(costsOfEquity),
    after_tax_cost_of_debt: dist(afterTaxCoDs),
    debt_weight: dist(debtWeights),
  };

  // ══════════════════════════ §2-2 도미노 5단계 분해(시점 vs 방법 분리) ══════════════════════════
  // T7 원문 그대로의 자본구조 고정(전 단계 공통 — WACC 가정만 바꾼다): Inputs!C12=39.3·C13=418·C15=4170
  const T7_DEBT = 4170, T7_SHARES = 39.3, T7_PRICE = 418;
  const T7_EQUITY_MV = T7_SHARES * T7_PRICE; // 16427.4 (WACC!F8과 일치)
  const T7_DE = T7_DEBT / T7_EQUITY_MV; // 재레버리지에 쓸 D/E(0.253839...)
  const EQ_W = T7_EQUITY_MV / (T7_DEBT + T7_EQUITY_MV), DEBT_W = T7_DEBT / (T7_DEBT + T7_EQUITY_MV); // T7 WACC!C10/F10과 동치

  const rf0 = 0.0065, erp0 = 0.051, tax0 = 0.165, ytm = 0.04546; // T7 Inputs 그대로
  const taxNow = usTax;
  const rest = (await sb.from("damodaran_beta").select("unlevered_beta_cash_adj, std_dev_equity").eq("industry", "Restaurant/Dining").single()).data as { unlevered_beta_cash_adj: number; std_dev_equity: number };
  const U = +rest.unlevered_beta_cash_adj; // 업종 무차입(현금조정) 베타 — Domino의 실제 산업
  const spreadInd = creditSpreadFor(+rest.std_dev_equity, spreads)!;

  // 도미노 T8 드라이버 그대로(engine.test.ts DPZ_D와 동일 — fixedCapitalRate=0.15는 T8 Inputs!C10 그대로, WACC 실험과 무관하게 고정)
  const baseDrivers = { startingSales: 3618.8, salesGrowth: 0.07, operatingMargin: 0.175, startingMargin: 0.1739, fixedCapitalRate: 0.15, workingCapitalRate: 0.10 };
  const inflation = 0.016; // T8 그대로 — 이 실험은 WACC 가정만 바꾼다(인플레는 STEP 표에 없는 축)
  const gapOf = (wacc: number, taxRate: number) => {
    const D: RevDcfDrivers = { ...baseDrivers, taxRate };
    const M: RevDcfMarket = { wacc, inflation, sharePrice: T7_PRICE, sharesOutstanding: T7_SHARES, debt: T7_DEBT, nonOperatingAssets: 391.9 };
    const r = runRevDcf(D, M, { maxYears: 25 }); // 🔴 859 확정 25년 — production과 동일 지평
    return r.verdict.kind === "years" ? r.verdict.gap : r.verdict.kind === "over_cap" ? `25+(${((r.verdict as { explainedPct: number }).explainedPct * 100).toFixed(1)}%)` : r.verdict.kind;
  };

  const steps: Record<string, unknown>[] = [];

  // 0. 원전 그대로
  {
    const coe = rf0 + 1 * erp0; // beta=1 직접 대입(재레버리지 없음 — T7 WACC!F6 그대로)
    const atCoD = ytm * (1 - tax0);
    const wacc = coe * EQ_W + atCoD * DEBT_W;
    steps.push({ step: 0, label: "원전 그대로", rf: rf0, erp: erp0, betaMethod: "plug(=1)", debtCostMethod: "companyYTM", tax: tax0, costOfEquity: coe, afterTaxCostOfDebt: atCoD, wacc, expectedWacc: 0.05354, matchesExpected: Math.abs(wacc - 0.05354) < 0.0001, gap: gapOf(wacc, tax0), expectedGap: 8 });
  }
  // 1. rf·ERP만 현재로
  {
    const coe = rfNow + 1 * erpNow;
    const atCoD = ytm * (1 - tax0);
    const wacc = coe * EQ_W + atCoD * DEBT_W;
    steps.push({ step: 1, label: "rf·ERP만 현재로", rf: rfNow, erp: erpNow, betaMethod: "plug(=1)", debtCostMethod: "companyYTM(unchanged)", tax: tax0, costOfEquity: coe, afterTaxCostOfDebt: atCoD, wacc, gap: gapOf(wacc, tax0) });
  }
  // 2. + 베타를 우리 방식으로(업종 재레버리지, tax는 아직 0.165)
  {
    const releveredBeta = U * (1 + (1 - tax0) * T7_DE);
    const coe = rfNow + releveredBeta * erpNow;
    const atCoD = ytm * (1 - tax0);
    const wacc = coe * EQ_W + atCoD * DEBT_W;
    steps.push({ step: 2, label: "+베타를 우리 방식으로", rf: rfNow, erp: erpNow, betaMethod: "industryRelever", releveredBeta, debtCostMethod: "companyYTM(unchanged)", tax: tax0, costOfEquity: coe, afterTaxCostOfDebt: atCoD, wacc, gap: gapOf(wacc, tax0) });
  }
  // 3. + 부채비용을 우리 방식으로(합성스프레드, tax는 아직 0.165)
  {
    const releveredBeta = U * (1 + (1 - tax0) * T7_DE);
    const coe = rfNow + releveredBeta * erpNow;
    const preTaxCoD = rfNow + spreadInd;
    const atCoD = preTaxCoD * (1 - tax0);
    const wacc = coe * EQ_W + atCoD * DEBT_W;
    steps.push({ step: 3, label: "+부채비용을 우리 방식으로", rf: rfNow, erp: erpNow, betaMethod: "industryRelever", releveredBeta, debtCostMethod: "syntheticSpread(industry)", creditSpread: spreadInd, tax: tax0, costOfEquity: coe, preTaxCostOfDebt: preTaxCoD, afterTaxCostOfDebt: atCoD, wacc, gap: gapOf(wacc, tax0) });
  }
  // 4. 완전 우리 방식(세율도 0.2563)
  {
    const releveredBeta = U * (1 + (1 - taxNow) * T7_DE);
    const coe = rfNow + releveredBeta * erpNow;
    const preTaxCoD = rfNow + spreadInd;
    const atCoD = preTaxCoD * (1 - taxNow);
    const wacc = coe * EQ_W + atCoD * DEBT_W;
    steps.push({ step: 4, label: "완전 우리 방식", rf: rfNow, erp: erpNow, betaMethod: "industryRelever", releveredBeta, debtCostMethod: "syntheticSpread(industry)", creditSpread: spreadInd, tax: taxNow, costOfEquity: coe, preTaxCostOfDebt: preTaxCoD, afterTaxCostOfDebt: atCoD, wacc, gap: gapOf(wacc, taxNow), referenceFromStep849: { wacc: 0.0719, gap: 23, note: "849는 도미노 실제 2019 SEC 자본구조(debt 4114.4M·shares dei)로 재계산 — 이 실험은 T7 원문 자본구조(debt 4170·shares 39.3)를 끝까지 고정해 'WACC 가정만의 효과'를 격리. 구조가 달라 최종 수치가 849와 정확히 같을 필요는 없다" } });
  }

  const decomposition = {
    fixedStructure: { debt: T7_DEBT, shares: T7_SHARES, price: T7_PRICE, equityMV: T7_EQUITY_MV, deRatioForRelever: T7_DE, debtWeight: DEBT_W, equityWeight: EQ_W, note: "전 5단계 공통 — T7 Inputs!C12/C13/C15 그대로. 인플레(0.016)·드라이버(fixedCapitalRate=0.15 등 T8 그대로)도 고정 — 이 표의 축(rf·ERP·베타·부채비용·세율) 외엔 아무것도 안 바꿈" },
    industryUsed: { industry: "Restaurant/Dining", unlevered_beta_cash_adj: U, std_dev_equity: +rest.std_dev_equity, creditSpread: spreadInd },
    steps,
    note: "각 단계의 wacc·gap 이동폭을 §4 판정에서 해석. 분류(방법 차이 vs 시점 차이) 이동은 여기서 하지 않고 판정 각주에 기록.",
  };

  // 🔴 885 §3-1 — T7 vs T8 4갈래 격리 조합(원래 /tmp/diag881.ts에만 있어 재현 불가였던 것을 이 커밋된 스크립트로 이동).
  //   "8은 T8의 정확한 조합에서만 나오는 knife-edge — 어느 한 값만 바꿔도 7"이 재현되는지 확인.
  function gapAt(wacc: number, shares: number): string | number {
    const D: RevDcfDrivers = { ...baseDrivers, taxRate: tax0 };
    const M: RevDcfMarket = { wacc, inflation, sharePrice: T7_PRICE, sharesOutstanding: shares, debt: T7_DEBT, nonOperatingAssets: 391.9 };
    const r = runRevDcf(D, M, { maxYears: 25 });
    return r.verdict.kind === "years" ? r.verdict.gap : r.verdict.kind;
  }
  const T8_WACC = 0.05357, T8_SHARES = 39.35;
  const T7_WACC_COMPUTED = (steps[0] as { wacc: number }).wacc; // 0단계에서 이미 계산된 T7 정확값(0.053544...)
  const isolationGrid = {
    T8exact_wacc0357_shares3935: gapAt(T8_WACC, T8_SHARES),
    T7exact_wacc053544_shares393: gapAt(T7_WACC_COMPUTED, T7_SHARES),
    T8wacc_T7shares: gapAt(T8_WACC, T7_SHARES),
    T7wacc_T8shares: gapAt(T7_WACC_COMPUTED, T8_SHARES),
    note: "881의 서술(\"두 값 중 하나만 바꿔도 7로 바뀐다 — 8은 T8의 정확한 조합에서만\")을 이 커밋된 스크립트 안에서 재현. 재현 안 되면 이 note를 고치지 않고 실측값을 그대로 남긴다(885 §3 지시).",
  };

  // ══════════════════════════ §2-3 우리 방식 안 두 가지 점검(코드 확인 결과) ══════════════════════════
  const internal_checks = {
    creditSpreadVariable: {
      whatOurCodeUses: "compute.ts:41 creditSpreadFor(stdDev: 주가 표준편차, bands) — damodaran_beta.std_dev_equity(업종 2년 주간수익률 표준편차)로 스프레드 밴드를 고른다",
      damodaranSyntheticRatingMethod: "syntrating.htm(개별기업용) = 이자보상배율(EBIT/이자비용) 기준 — 주가 표준편차 언급 0건(WebFetch 직접 확인)",
      butOurTableSourceIsDifferent: "damodaran_credit_spread는 개별기업 syntrating 표가 아니라 wacc.xls(업종 평균 WACC 데이터셋)에서 옴 — 그 파일 자체가 'Cost of debt = Pre-tax cost of borrowing for sector, estimated based upon the standard deviation of equity'라고 명시(FAQ 시트 row7, data/sources/damodaran/wacc.xls 직접 개봉 확인). std_dev_equity 정의(betas.xls FAQ row11)= 'Simple average across firms of each firm's standard deviation in stock prices in the prior 2 years, using weekly returns'",
      verdict: "문제 없음 — 우리가 참조하는 데이터셋(업종 평균 WACC/베타)의 원저자 자신이 업종 단위에서는 이자보상배율 대신 주가표준편차를 쓴다고 명시했다. 이는 개별기업 syntrating(이자보상배율)과는 다른, 별개의 다모다란 방법론이며 우리는 업종 데이터셋 쪽을 일관되게 쓰고 있다(베타도 업종 평균이므로 정합)",
    },
    cashAdjustedBetaRelever: {
      whatOurCodeDoes: "compute.ts:31 releveredBeta = unleveredBetaCashAdj × (1+(1-tax)×deRatio) — 현금조정 무차입베타를 그대로 재레버리지 공식에 대입, 현금을 되돌리는 항 없음",
      damodaranFormula: "TenQsBottomupBetas.htm — 'Levered Beta = Unlevered beta × (1+(1-taxrate)(D/E))'(현금항 없음) · 'Cash-adjusted beta = Unlevered beta/(1-Cash/FirmValue)'(별도 공식) — 두 공식을 연결해 재레버리지 시 현금을 되돌리라는 서술은 WebFetch 직접 확인 결과 못 찾음",
      verdict: "확정적으로 '문제없음'이라 말할 근거는 부족하나(원문이 이 구체적 시퀀스를 명시하지 않음), 재레버리지 공식 자체가 현금항을 포함하지 않아 '어느 unlevered beta를 쓰든 그대로 대입'하는 구조 — 우리 코드가 원전 공식을 있는 그대로 따른 것이지 임의로 현금항을 뺀 게 아니다. cash_over_firm 업종중앙값 3.5%(p90 9.66%·최대 24.1%) — 되돌림을 안 한 영향이 있다면 최대 그 정도 크기. 🔴 못 찾음(추정 아님) — 재검토 여지로 남긴다",
    },
    companySpecificYtmVsSynthetic: {
      damodaranHierarchy: "실제 거래채권(YTM) > 실제 신용등급 > 합성등급(무등급 전용) — WebSearch 확인(다중 출처 요약, 1차 링크: syntrating.htm)",
      ours: "604종목 전부 업종 합성스프레드 하나로 통일(회사별 YTM 미조달) — 원전(T7)은 도미노 실제 YTM을 직접 씀. 자동화 규모(매일 전종목) 제약상 회사별 YTM 대량 조달 경로 없음(무료 벌크 API 부재) — 실무적 타협이지 다모다란 선호 순서와 일치하진 않음",
    },
    rfErpFrequency: {
      damodaranPractice: "다모다란 본인도 ERP를 '매월 초' 갱신해 그 달 내내 사용(2008-09부터, WebSearch 확인) — 일간이 아니라 월간에 가까운 스냅샷 관행. 우리 damodaran_global_inputs.as_of=2026-01-05(연 1회에 가까운 갱신)는 '일간 FRED'보다 오히려 다모다란 자신의 실제 관행에 더 가깝다(빈도만 더 낮음)",
      openItemStatus: "registry의 'rf 일간 변형' 미결 항목 — 일간 FRED로 바꿀 근거가 약해짐(다모다란도 일간이 아님). 갱신주기 자체(연1회 vs 월1회)는 별개 문제로 남음 — 이번 STEP에서 결론 안 냄",
    },
  };

  const output = { asOf, wacc_distribution, component_distributions, decomposition, internal_checks, isolationGrid };
  writeFileSync("docs/probe_881_wacc.json", JSON.stringify(output, null, 2));
  console.error(JSON.stringify(output, null, 2));

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,887 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
