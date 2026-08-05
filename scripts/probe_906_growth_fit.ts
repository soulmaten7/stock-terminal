// STEP 906 §3 — #42 실측: driver1(salesGrowth)이 5년 중 끝점 2개만 쓴다(drivers.ts:163-165) — 대안(회귀)과 비교.
// 873의 driver1 ③판정은 "원전 대비 전망 vs 과거"만 판정했고, "현행 추정기 자체의 품질"(끝점2개 vs 중간3년 포함)은 열려 있다.
// 측정 전용 · lib/revdcf/** 수정 없음(import만) · DB 쓰기 0 · companyfacts는 866 캐시(/tmp/866_cf) 재사용.
// 실행: npx tsx scripts/probe_906_growth_fit.ts
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
const has5 = (m: Record<number, number>) => YS.every((y) => m[y] != null);
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }
function mean(a: number[]): number { return a.reduce((x, y) => x + y, 0) / a.length; }

// 로그선형 회귀: ln(rev_t) = a + b*t (t=0..4, 5개년 전부 사용) → 연성장률 = exp(b)-1
function logLinearGrowth(revByYear: Record<number, number>): { annualGrowth: number; residuals: Record<number, number>; slope: number } {
  const ts = YS.map((_, i) => i);
  const lns = YS.map((y) => Math.log(revByYear[y]));
  const n = 5, meanT = mean(ts), meanLn = mean(lns);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (ts[i] - meanT) * (lns[i] - meanLn); den += (ts[i] - meanT) ** 2; }
  const b = num / den, a = meanLn - b * meanT;
  const residuals: Record<number, number> = {};
  YS.forEach((y, i) => { residuals[y] = lns[i] - (a + b * ts[i]); });
  return { annualGrowth: Math.exp(b) - 1, residuals, slope: b };
}

async function main() {
  const sb = createAdminClient();
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const asOf = latest.as_of;

  type BaseRow = { cik: number; symbol: string; verdict: string; gap_years: number | null };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("cik,symbol,verdict,gap_years").eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] 계산가능 baseline n=${rows.length} (as_of=${asOf})`);

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

  const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];

  type OutRow = {
    cik: number; symbol: string; oldVerdict: string; oldGapYears: number | null;
    cagr: number; regressionGrowth: number; diff: number;
    endpointIrregularityRatio: number | null; signFlip: boolean;
    newVerdict: string | null; newGapYears: number | null;
  };
  const out: OutRow[] = [];
  let calcImpossible = 0, noRefData = 0;

  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { calcImpossible++; continue; }
    let j: { facts?: { "us-gaap"?: Gaap; dei?: Gaap } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { calcImpossible++; continue; }
    const gaap = j.facts?.["us-gaap"] ?? {};
    const dr = computeDrivers(gaap, {});
    if (!dr.ok) { calcImpossible++; continue; }

    const rev: Record<number, number> = {};
    for (const t of REV) { const m = annualMap(gaap, t, "flow"); for (const y of YS) if (rev[y] == null && m[y] != null) rev[y] = m[y]; }
    if (!has5(rev) || !(rev[2020] > 0) || !(rev[2024] > 0)) { calcImpossible++; continue; }

    const cagr = (rev[2024] / rev[2020]) ** (1 / 4) - 1; // drivers.ts:165과 동일 공식
    const fit = logLinearGrowth(rev);
    const diff = fit.annualGrowth - cagr;
    const signFlip = (cagr >= 0) !== (fit.annualGrowth >= 0);

    const endpointAbs = mean([Math.abs(fit.residuals[2020]), Math.abs(fit.residuals[2024])]);
    const middleAbs = mean([Math.abs(fit.residuals[2021]), Math.abs(fit.residuals[2022]), Math.abs(fit.residuals[2023])]);
    const endpointIrregularityRatio = middleAbs > 1e-9 ? endpointAbs / middleAbs : null;

    const ind = indByT.get(r.symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    const mcap = mcapBy.get(r.symbol.toUpperCase());
    let newVerdict: string | null = null, newGapYears: number | null = null;
    if (ind && beta && mcap) {
      const deRatio = dr.market.debt / mcap;
      const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
      const sharePrice = mcap / dr.market.shares;
      const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
      const drvBase = { ...dr.drivers, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal ?? dr.drivers.fixedCapitalRateLevel, taxRate: usTax };
      const run: RevDcfVerdict = runRevDcf({ ...drvBase, salesGrowth: fit.annualGrowth }, market, { maxYears: 25 }).verdict;
      newVerdict = run.kind; newGapYears = run.kind === "years" ? run.gap : null;
    } else noRefData++;

    out.push({ cik: r.cik, symbol: r.symbol, oldVerdict: r.verdict, oldGapYears: r.gap_years, cagr, regressionGrowth: fit.annualGrowth, diff, endpointIrregularityRatio, signFlip, newVerdict, newGapYears });
  }

  writeFileSync("docs/probe_906_growth_fit_rows.json", JSON.stringify(out, null, 2));
  const comparable = out.filter((o) => o.newVerdict != null);
  const diffs = out.map((o) => o.diff);
  const cagrs = out.map((o) => o.cagr), regs = out.map((o) => o.regressionGrowth);

  const mig: Record<string, number> = {};
  let outFlowComparable = 0, inFlowComparable = 0;
  for (const o of comparable) { const key = `${o.oldVerdict}→${o.newVerdict}`; mig[key] = (mig[key] || 0) + 1; if (o.oldVerdict === "years" && o.newVerdict !== "years") outFlowComparable++; if (o.oldVerdict !== "years" && o.newVerdict === "years") inFlowComparable++; }
  const uncomputable = out.filter((o) => o.newVerdict == null);
  const outFlowIncl = outFlowComparable + uncomputable.filter((o) => o.oldVerdict === "years").length;

  const irregRatios = out.map((o) => o.endpointIrregularityRatio).filter((x): x is number => x != null);
  const thresholds = [1.5, 2, 3];
  const irregTable = thresholds.map((t) => {
    const flagged = out.filter((o) => o.endpointIrregularityRatio != null && o.endpointIrregularityRatio >= t);
    const flaggedDiffs = flagged.map((o) => Math.abs(o.diff));
    const restDiffs = out.filter((o) => o.endpointIrregularityRatio != null && o.endpointIrregularityRatio < t).map((o) => Math.abs(o.diff));
    return { threshold: t, flaggedCount: flagged.length, pctOfN: +((flagged.length / out.length) * 100).toFixed(1), medianAbsDiff_flagged_pp: (percentile(flaggedDiffs, 50) ?? NaN) * 100, medianAbsDiff_rest_pp: (percentile(restDiffs, 50) ?? NaN) * 100 };
  });
  const signFlipCount = out.filter((o) => o.signFlip).length;

  // ══════ 도미노 앵커 — 정정: STEP 906 원문은 "T3에서 셀로 확인"이라 했으나, T3.xlsx는 마진 튜토리얼이다(매출성장 아님).
  //   906이 직접 개봉해 확인: T3 = "How Do You Calculate A Company's Operating Profit Margin?"(margin), 매출성장 없음.
  //   매출성장 원전 절 = Tutorial 02("How Do I Project Future Sales Growth Rates?") — data/sources엔 HTML만 있고 계산 스프레드시트 없음.
  //   도미노 DCF의 성장률(7%)은 T8.xlsx Inputs!C6에 있다 — 906이 직접 개봉(data_only=False)해 formula 아닌 리터럴(0.07, data_type='n')임을 확인.
  const REV_D = { 2015: 2216.528, 2016: 2472.61, 2017: 2787.979, 2018: 3432.844, 2019: 3618.77 }; // T3.xlsx 'Margins' 시트 row5(=Tutorial 3 row37과 동일값) 그대로 전사
  const YS_D = [2015, 2016, 2017, 2018, 2019] as const;
  const cagrDomino = (REV_D[2019] / REV_D[2015]) ** (1 / 4) - 1;
  const fitDomino = (() => {
    const ts = YS_D.map((_, i) => i), lns = YS_D.map((y) => Math.log(REV_D[y]));
    const n = 5, meanT = mean(ts), meanLn = mean(lns);
    let num = 0, den = 0; for (let i = 0; i < n; i++) { num += (ts[i] - meanT) * (lns[i] - meanLn); den += (ts[i] - meanT) ** 2; }
    const b = num / den; return Math.exp(b) - 1;
  })();

  const dominoAnchor = {
    stepInstructionError906: "STEP 906 §3-5는 'T3에서 셀로 확인'이라 했으나, T3.xlsx를 직접 개봉하니 제목이 'How Do You Calculate A Company's Operating Profit Margin?'이다 — driver3(마진) 튜토리얼이지 driver1(매출성장) 튜토리얼이 아니다. 매출성장 원전 절은 Tutorial 02('How Do I Project Future Sales Growth Rates?', 이미 873 각주가 인용)인데 data/sources/text/EI_tutorial_02_sales.html만 있고 계산 스프레드시트(T2.xlsx)는 애초에 존재하지 않는다(공개 자료 자체에 없음 — 872가 이미 '튜토리얼 8개' 전수에서 확인한 범위와 일치).",
    where7PercentActuallyIs: "도미노 DCF의 성장률 7%는 T8.xlsx 'Inputs' 시트 C6('Sales growth rate')에 있다. 906이 직접 개봉(openpyxl data_only=False)해 셀 타입을 확인 — formula(data_type='f')가 아니라 리터럴 숫자(0.07, data_type='n')다. 5년 매출 이력에서 계산되는 셀 참조·수식이 전혀 없다.",
    implication: "7%는 CAGR도 회귀도 아닌 서사적 가정(narrative assumption)이다 — 873의 driver1 ③판정이 이미 확립한 것과 같은 구조('원전은 전망[가이던스·Value Line·컨센서스]을 쓰고 우리는 과거를 쓴다'). 따라서 'CAGR과 회귀 중 어느 쪽이 7%에 더 가까운가'라는 앵커 테스트는 성립하지 않는다 — 7%는 애초에 두 추정기 중 어느 것으로도 재현되도록 설계된 값이 아니다.",
    referenceOnly_cagrVsRegressionOnDominosOwnData: {
      window: "2015-2019(T3.xlsx 'Margins' 시트 row5 매출 그대로 — Tutorial 3 본문 표 row37과 동일값)",
      cagr_endpoints2015to2019: cagrDomino, cagr_pct: (cagrDomino * 100).toFixed(2) + "%",
      regression_5yr: fitDomino, regression_pct: (fitDomino * 100).toFixed(2) + "%",
      note: "7%와 비교하는 값이 아니다(위 참조) — 도미노의 실제 5년 매출로도 두 추정기가 서로 얼마나 다른 값을 내는지 보여주는 참고 수치일 뿐. 두 값 다 T8의 7%와 다르다(둘 다 역사적 추정이고 7%는 서사적 가정이므로 애초에 일치를 기대할 근거가 없다).",
    },
  };

  const output = {
    asOf, n: out.length, comparableForVerdict: comparable.length,
    coverage: { calcImpossible, noRefData },
    estimatorComparison: {
      cagr_median: percentile(cagrs, 50), cagr_p25: percentile(cagrs, 25), cagr_p75: percentile(cagrs, 75),
      regression_median: percentile(regs, 50), regression_p25: percentile(regs, 25), regression_p75: percentile(regs, 75),
      diff_median_pp: percentile(diffs, 50)! * 100, diff_p25_pp: percentile(diffs, 25)! * 100, diff_p75_pp: percentile(diffs, 75)! * 100,
      signFlipCount, signFlipPct: +((signFlipCount / out.length) * 100).toFixed(1),
    },
    endpointOutlierAnalysis: { irregularityRatioMedian: percentile(irregRatios, 50), irregularityRatioP75: percentile(irregRatios, 75), irregularityRatioP90: percentile(irregRatios, 90), thresholdTable: irregTable, note: "endpointIrregularityRatio = mean(|resid[2020]|,|resid[2024]|) / mean(|resid[2021..2023]|), resid=로그선형회귀 잔차. 1보다 크면 끝점이 중간3년보다 추세에서 더 벗어나 있다는 뜻. threshold별로 '끝점이 이상치인' 종목의 |CAGR-회귀| 차이가 나머지보다 큰지 대조." },
    verdictMovement: { migration: mig, outflow_comparableOnly: outFlowComparable, inflow_comparableOnly: inFlowComparable, outflow_includingUncomputable: outFlowIncl },
    dominoAnchor,
    note: "재료만 — 판정 없음. driver1 ③판정(✅ 현행 유지·원전 미채택, 873)은 이 결과와 무관하게 유지. 이 STEP은 driver1이 다루지 않은 잔여 질문(추정기 자체 품질)만 측정한다.",
  };
  writeFileSync("docs/probe_906_growth_fit.json", JSON.stringify(output, null, 2));

  console.error(`\n=== 요약 ===`);
  console.error(`n=${out.length} · CAGR중앙 ${(output.estimatorComparison.cagr_median! * 100).toFixed(2)}% vs 회귀중앙 ${(output.estimatorComparison.regression_median! * 100).toFixed(2)}%`);
  console.error(`차이 중앙 ${output.estimatorComparison.diff_median_pp.toFixed(2)}%p · 부호갈림 ${signFlipCount}건(${output.estimatorComparison.signFlipPct}%)`);
  console.error(`끝점이상치비율 중앙 ${output.endpointOutlierAnalysis.irregularityRatioMedian?.toFixed(2)} · p90 ${output.endpointOutlierAnalysis.irregularityRatioP90?.toFixed(2)}`);
  console.error(`threshold table: ${JSON.stringify(irregTable)}`);
  console.error(`유출(비교가능) ${outFlowComparable} / 유입(비교가능) ${inFlowComparable}`);
  console.error(`\n도미노: CAGR=${dominoAnchor.referenceOnly_cagrVsRegressionOnDominosOwnData.cagr_pct} · 회귀=${dominoAnchor.referenceOnly_cagrVsRegressionOnDominosOwnData.regression_pct} · T8 7%는 리터럴(수식아님)`);

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,888 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
