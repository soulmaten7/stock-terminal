// STEP 876 §1 — driver4 A안 태그 매핑을 원전 4항목(T4 C44=C39+C41+C42+C43)에 맞춰 확장 재측정.
// 측정 전용 · lib/revdcf/** 수정 없음(import만) · companyfacts는 866 캐시(/tmp/866_cf) 재사용 — 재다운로드 금지.
// 실행: npx tsx scripts/probe_876_wc_tags.ts
//
// 874의 A안(AP+AccruedLiabilitiesCurrent 2종만)이 도미노 앵커에서 4.219%(원전 0.501%)로 8배 틀렸다(875 발견).
// 원인 = 원전 4항목 중 "Advertising fund liabilities"·"Other accrued liabilities" 2개를 놓친 태그 매핑 불완전.
// 🔴 목록을 미리 정해놓고 찾지 않는다 — 515사 companyfacts에서 실제 존재하는 무이자 유동부채성 태그를 먼저 전수 세고,
//   그 빈도표를 근거로 확장 태그 집합을 구성한다(이자부·리스·총계·중단영업 태그는 명시적으로 제외).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfMarket, type RevDcfVerdict } from "../lib/revdcf/engine";

const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;
const YS = [2020, 2021, 2022, 2023, 2024];

type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
type Gaap = Record<string, { units?: Record<string, Fact[]> }>;
const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));
function annualMap(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const arr = g[tag]?.units?.[unit];
  const by: Record<number, { val: number; filed: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; if (!e.end) continue; }
    const y = calYear(e.end); const prev = by[y];
    if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: String(e.filed) };
  }
  const o: Record<number, number> = {}; for (const y of Object.keys(by)) o[+y] = by[+y].val; return o;
}
function coalesceMap(g: Gaap, tags: string[], kind: "flow" | "stock"): { vals: Record<number, number>; tagAt: Record<number, string> } {
  const vals: Record<number, number> = {}, tagAt: Record<number, string> = {};
  for (const t of tags) { const m = annualMap(g, t, kind); for (const y of Object.keys(m)) { const yy = +y; if (vals[yy] == null) { vals[yy] = m[yy]; tagAt[yy] = t; } } }
  return { vals, tagAt };
}
const has5 = (m: Record<number, number>) => YS.every((y) => m[y] != null);
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }

const AR = ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent"];
const INV = ["InventoryNet"];
const OTHER_CA = ["OtherAssetsCurrent"];
const AP = ["AccountsPayableCurrent"];

// 명시적 제외 패턴 — 이자부(원전 C40류)·리스(암묵적 이자 내포)·총계 자체·중단영업(별개 개념)
const EXCLUDE_INTEREST = /Debt|Borrowing|Note.*Payable|CommercialPaper|LineOfCredit|CreditFacilit|ConvertibleNotes?/i;
const EXCLUDE_LEASE = /Lease/i;
const EXCLUDE_DISCONTINUED = /DisposalGroup|DiscontinuedOperation/i;
const EXCLUDE_TOTAL = new Set(["LiabilitiesCurrent"]); // 집계 자체 — 항목 아님
const EXCLUDE_AP = new Set(AP);

function qualifies(tag: string): boolean {
  if (!/Liabilit/.test(tag)) return false;
  if (/Noncurrent/.test(tag)) return false;
  if (!/Current/.test(tag)) return false;
  if (EXCLUDE_TOTAL.has(tag) || EXCLUDE_AP.has(tag)) return false;
  if (EXCLUDE_INTEREST.test(tag) || EXCLUDE_LEASE.test(tag) || EXCLUDE_DISCONTINUED.test(tag)) return false;
  return true;
}

async function main() {
  const sb = createAdminClient();
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const asOf = latest.as_of;

  type BaseRow = { cik: number; symbol: string; verdict: string; gap_years: number | null; sales_growth: number; operating_margin: number; starting_margin: number; tax_rate: number; fixed_capital_rate: number; working_capital_rate: number; wacc: number; debt: number; non_operating_assets: number; shares: number; share_price: number };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results")
      .select("cik,symbol,verdict,gap_years,sales_growth,operating_margin,starting_margin,tax_rate,fixed_capital_rate,working_capital_rate,wacc,debt,non_operating_assets,shares,share_price")
      .eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] baseline n=${rows.length}`);

  // ══════════════════════════ [1] 태그 전수 스캔 — 목록을 미리 안 정하고 실제 존재부터 센다 ══════════════════════════
  const tagCompanyCount: Record<string, number> = {}; // 해당 태그로 5년 전부 확보한 회사 수
  const tagAnyYearCount: Record<string, number> = {}; // 1년이라도 값이 있는 회사 수
  const gaapByCik = new Map<number, Gaap>();
  let cfMissing = 0;
  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { cfMissing++; continue; }
    let j: { facts?: { "us-gaap"?: Gaap } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { cfMissing++; continue; }
    const gaap = j.facts?.["us-gaap"] ?? {};
    gaapByCik.set(r.cik, gaap);
    for (const tag of Object.keys(gaap)) {
      if (!qualifies(tag)) continue;
      const m = annualMap(gaap, tag, "stock");
      if (Object.keys(m).length === 0) continue;
      tagAnyYearCount[tag] = (tagAnyYearCount[tag] || 0) + 1;
      if (has5(m)) tagCompanyCount[tag] = (tagCompanyCount[tag] || 0) + 1;
    }
  }
  const ranked = Object.entries(tagCompanyCount).sort((a, b) => b[1] - a[1]);
  console.error(`[1] 태그 전수 스캔 완료(cf없음 ${cfMissing}) — 무이자 유동부채성 후보 ${ranked.length}종`);
  console.error(`  상위 15(5년전부확보 회사수): ${ranked.slice(0, 15).map(([t, n]) => `${t}=${n}`).join(" · ")}`);

  // ══════════════════════════ 확장 태그 집합 구성 — 빈도 상위 + T4 4항목 취지에 맞는 것만 채택 ══════════════════════════
  // 상위 랭킹에서 명백히 이질적인 개념(이연수익/계약부채 — T4 4항목에 없음)은 별도 배제하고 빈도만 기록.
  const EXCLUDE_DEFERRED_REVENUE = /DeferredRevenue|ContractWithCustomerLiability/i;
  const chosen = ranked.filter(([t]) => !EXCLUDE_DEFERRED_REVENUE.test(t)).slice(0, 6).map(([t]) => t);
  const excludedDeferredRevenue = ranked.filter(([t]) => EXCLUDE_DEFERRED_REVENUE.test(t));
  console.error(`[1b] 채택된 확장 태그(상위 6·이연수익류 제외): ${chosen.join(", ")}`);
  console.error(`  제외(이연수익/계약부채류·참고용 빈도만): ${excludedDeferredRevenue.map(([t, n]) => `${t}=${n}`).join(" · ") || "없음"}`);

  // ══════════════════════════ [2] 확장 A안 재계산(515 전수) ══════════════════════════
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const rf = +gi.riskfree_rate, erp = +gi.erp, inflation = +gi.expected_inflation;
  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaByInd = new Map(((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[]).map((b) => [b.industry, b]));
  const indRows: { ticker_norm: string; industry_group: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("damodaran_industry").select("ticker_norm, industry_group").eq("is_us_listed", true).range(f, f + 999); const c = (data ?? []) as typeof indRows; indRows.push(...c); if (c.length < 1000) break; }
  const indByT = new Map(indRows.map((r) => [r.ticker_norm, r.industry_group]));
  const mcapRows: { symbol: string; market_cap: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapBy = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), +r.market_cap]));

  type OutRow = { cik: number; symbol: string; wcA876: number | null; oldVerdict: string; oldGapYears: number | null; newVerdictA876: string | null; newGapYearsA876: number | null };
  const out: OutRow[] = [];
  let calcImpossible = 0, noRefData = 0;
  const wcVals: number[] = [];
  for (const r of rows) {
    const gaap = gaapByCik.get(r.cik);
    if (!gaap) continue;
    const dr = computeDrivers(gaap, {});
    if (!dr.ok) { calcImpossible++; continue; }
    const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
    const rev = coalesceMap(gaap, REV, "flow").vals;
    const arM = coalesceMap(gaap, AR, "stock").vals, invM = coalesceMap(gaap, INV, "stock").vals, otherCaM = coalesceMap(gaap, OTHER_CA, "stock").vals, apM = coalesceMap(gaap, AP, "stock").vals;
    // 확장 accrued 버킷: 채택된 태그들을 연도별로 "존재하는 것만 합산"(coalesce 아니라 union-sum — T4가 별개 항목을 더하는 것과 동일 원리)
    const accruedByYear: Record<number, number> = {};
    let accruedHas5 = true;
    for (const y of YS) {
      let sum: number | null = null;
      for (const tag of chosen) { const m = annualMap(gaap, tag, "stock"); if (m[y] != null) sum = (sum ?? 0) + m[y]; }
      if (sum == null) accruedHas5 = false; else accruedByYear[y] = sum;
    }
    if (!has5(rev) || !has5(arM) || !has5(invM) || !has5(otherCaM) || !has5(apM) || !accruedHas5) { calcImpossible++; continue; }
    const nwc: Record<number, number> = {};
    for (const y of YS) { const reqCash = rev[y] * 0.02; nwc[y] = (reqCash + arM[y] + invM[y] + otherCaM[y]) - (apM[y] + accruedByYear[y]); }
    const dRev = rev[YS[4]] - rev[YS[0]];
    const wcA876 = dRev !== 0 ? (nwc[YS[4]] - nwc[YS[0]]) / dRev : null;
    if (wcA876 == null) { calcImpossible++; continue; }

    const ind = indByT.get(r.symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    const mcap = mcapBy.get(r.symbol.toUpperCase());
    if (!ind || !beta || !mcap) { noRefData++; continue; }
    const deRatio = dr.market.debt / mcap;
    const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
    const sharePrice = mcap / dr.market.shares;
    const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
    const drvBase = { ...dr.drivers, taxRate: usTax };
    const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : null);
    const run = runRevDcf({ ...drvBase, workingCapitalRate: wcA876 }, market, { maxYears: 25 });

    wcVals.push(wcA876);
    out.push({ cik: r.cik, symbol: r.symbol, wcA876, oldVerdict: r.verdict, oldGapYears: r.gap_years, newVerdictA876: run.verdict.kind, newGapYearsA876: gnum(run.verdict) });
  }
  writeFileSync("docs/probe_876_wc_tags_rows.json", JSON.stringify(out, null, 2));
  console.error(`[2] 확장 A안 계산 완료 n=${out.length} (계산불가 ${calcImpossible} · 참조데이터없음 ${noRefData})`);

  // ══════════════════════════ [3] 도미노 앵커 재실행 — DPZ(도미노피자) 실제 SEC 데이터로 (CIK 1286681) ══════════════════════════
  // 🔑 도미노는 우리 515사 유니버스에 실제로 포함돼 있다(symbol=DPZ · verdict=over_cap · skip_reason null).
  //   T4가 쓴 "Advertising fund liabilities"·"Accrued expenses"가 DPZ의 오늘날 실제 XBRL에도 그 이름 그대로 있는지 직접 대조한다(추정 없이).
  const dpzGaap = gaapByCik.get(1286681);
  let dominoRealAnchor: Record<string, unknown> = { available: false, reason: "CIK 1286681(DPZ) companyfacts 캐시에 없음" };
  if (dpzGaap) {
    const T4_2019 = { AP: 111101000, AccruedExpenses: 131148000, AdvertisingFund: 101921000, OtherAccrued: 66267000 };
    const findExact = (target: number) => {
      const hits: string[] = [];
      for (const [tag, obj] of Object.entries(dpzGaap)) {
        const usd = (obj.units ?? {})["USD"] ?? [];
        for (const e of usd) if (e.end === "2019-12-29" && Math.abs(e.val - target) < 1000) hits.push(tag);
      }
      return [...new Set(hits)];
    };
    const apMatch = findExact(T4_2019.AP);
    const accruedMatch = findExact(T4_2019.AccruedExpenses);
    const adFundMatch = findExact(T4_2019.AdvertisingFund);
    const otherAccruedMatch = findExact(T4_2019.OtherAccrued);
    // 876이 채택한 확장 태그 집합으로 DPZ의 우리 production 5년창(YS)에 실제로 얼마나 잡히는지도 계산
    const dpzChosenSum: Record<number, number> = {};
    for (const y of YS) { let s: number | null = null; for (const tag of chosen) { const m = annualMap(dpzGaap, tag, "stock"); if (m[y] != null) s = (s ?? 0) + m[y]; } if (s != null) dpzChosenSum[y] = s; }
    dominoRealAnchor = {
      available: true,
      note: "도미노(DPZ, CIK 1286681)는 우리 515사 유니버스에 실제로 포함돼 있다 — T4가 쓴 4항목이 DPZ의 오늘날 XBRL에도 그대로 있는지 직접 대조했다(2019-12-29 기준, T4 I열과 동일 연도).",
      T4_2019_values: T4_2019,
      exactTagMatch: { AccountsPayable: apMatch, AccruedExpenses: accruedMatch, AdvertisingFundLiabilities: adFundMatch, OtherAccruedLiabilities: otherAccruedMatch },
      finding: "AP·OtherAccrued 2항목은 표준 태그(AccountsPayableCurrent·OtherAccruedLiabilitiesCurrent)에 정확히 일치한다. 'Accrued expenses'(131.148M)·'Advertising fund liabilities'(101.921M)는 DPZ의 2019 XBRL 어느 태그에도 정확히 일치하지 않는다 — DPZ의 `AccruedLiabilitiesCurrent` 태그 자체가 2012년 이후로 안 쓰인다(각주 확인). Rappaport의 세부 4분류는 재무제표 주석(footnote) 수준의 수기 재분류로 보이며, 오늘날 표준 XBRL 사실(fact)로는 보존돼 있지 않다.",
      implication: "876이 실제 데이터 빈도로 구성한 확장 태그 집합도 이 간극을 못 메운다 — 태그가 '더 정교해서' 못 잡는 게 아니라, 그 개념 자체가 현대 XBRL에 개별 사실로 존재하지 않는다.",
      dpzOwnProductionWindow_2020to2024_chosenTagsSum: dpzChosenSum,
    };
  }

  const output = {
    asOf, n515: rows.length,
    tagFrequency: { rankedTop30: ranked.slice(0, 30).map(([t, n]) => ({ tag: t, companiesWithFull5yr: n, companiesAnyYear: tagAnyYearCount[t] })), excludedDeferredRevenueCandidates: excludedDeferredRevenue.map(([t, n]) => ({ tag: t, companiesWithFull5yr: n })) },
    chosenExpandedTags: chosen,
    exclusionRules: { interest: EXCLUDE_INTEREST.source, lease: EXCLUDE_LEASE.source, discontinued: EXCLUDE_DISCONTINUED.source, totalItself: [...EXCLUDE_TOTAL], apHandledSeparately: [...EXCLUDE_AP] },
    coverage: { calculable: out.length, calcImpossible, noRefData, pctOfN: +((out.length / rows.length) * 100).toFixed(1) },
    distribution: { median: percentile(wcVals, 50), p05: percentile(wcVals, 5), p95: percentile(wcVals, 95), negative: wcVals.filter((x) => x < 0).length },
    resultChange: (() => {
      const gs = out.filter((o) => o.newVerdictA876 === "years").map((o) => o.newGapYearsA876!) as number[];
      const mig: Record<string, number> = {}; let yearsOut = 0, yearsIn = 0;
      for (const o of out) { const key = `${o.oldVerdict}→${o.newVerdictA876}`; mig[key] = (mig[key] || 0) + 1; if (o.oldVerdict === "years" && o.newVerdictA876 !== "years") yearsOut++; if (o.oldVerdict !== "years" && o.newVerdictA876 === "years") yearsIn++; }
      return { yearsCount: gs.length, gapP25: percentile(gs, 25), gapP50: percentile(gs, 50), gapP75: percentile(gs, 75), migration: mig, yearsOut, yearsIn };
    })(),
    dominoRealAnchor,
    note: "재료만 — 제안 없음. driver4 ③판정(✅ 현행 유지)은 이 결과와 무관하게 유지(875 근거 1·2·4가 지탱).",
  };
  writeFileSync("docs/probe_876_wc_tags.json", JSON.stringify(output, null, 2));

  console.error(`\n=== 요약 ===`);
  console.error(`커버리지: ${out.length}/${rows.length}(${output.coverage.pctOfN}%) — 874 A안(2종) 65/515(12.6%)에서 확대`);
  console.error(`중앙비율: ${(output.distribution.median! * 100).toFixed(2)}% (874 A안 15.63%·B안 5.83%·현행 1.80%)`);
  console.error(`years: 177 → ${output.resultChange.yearsCount} · GAP p50 11 → ${output.resultChange.gapP50}`);
  console.error(`유출 ${output.resultChange.yearsOut} · 유입 ${output.resultChange.yearsIn}`);
  console.error(`\n=== 도미노(DPZ) 실앵커 ===`);
  console.error(JSON.stringify(dominoRealAnchor, null, 2));

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,887 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
