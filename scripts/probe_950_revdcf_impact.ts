// STEP 950 §3 — YS 고정창이 역DCF verdict를 바꾸는지. 표본 20종목(revdcf_results 심볼 사전순).
// 🔴 조사 전용. drivers.ts·engine.ts·compute.ts는 읽기만(순수 함수 재사용) — 수정하지 않는다. DB에 쓰지 않는다.
// 🔴 격리 범위: 5개 YS의존 드라이버(salesGrowth·operatingMargin·startingMargin·fixedCapitalRate·workingCapitalRate)만
//   창을 이동해 재계산한다. wacc·debt·nonOperatingAssets·shares·sharePrice는 저장값을 그대로 재사용한다
//   (이 값들도 latestYear()가 YS에 묶여 있어 별도로 stale할 수 있으나, 이번 STEP은 "YS창이 verdict를 바꾸는가"만 격리해서 본다).
// 실행: npx tsx scripts/probe_950_revdcf_impact.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";
import { computeGapWithSensitivity } from "../lib/revdcf/compute";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const MAX_YEARS = 25;

type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
type Gaap = Record<string, { units?: Record<string, Fact[]> }>;

const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
const COST = ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices", "CostOfSales", "CostOfOperatingRevenues", "CostOfRevenues"];
const PRETAX = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"];
const INTEREST = ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestIncomeExpenseNet"];
const PPE = ["PropertyPlantAndEquipmentNet", "PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization", "PropertyPlantAndEquipmentExcludingLessorAssetUnderOperatingLeaseAfterAccumulatedDepreciation", "PropertyPlantAndEquipmentOtherNet", "PublicUtilitiesPropertyPlantAndEquipmentNet"];
const CASH_OP = ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"];
const CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"];
const CAPSW = ["PaymentsToDevelopSoftware", "CapitalizedComputerSoftwareAdditions"];
const OTHINV = ["PaymentsForProceedsFromOtherInvestingActivities"];
const ACQ = ["PaymentsToAcquireBusinessesNetOfCashAcquired"];
const DNA_TOTAL = ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndDepletion", "DepreciationAmortizationAndAccretionNet"];
const DEPR_ONLY = ["Depreciation"];
const AMORT_ONLY = ["AmortizationOfIntangibleAssets"];

const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));
function annualMapFull(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const arr = g[tag]?.units?.[unit]; const by: Record<number, { val: number; filed: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null || !e.end) continue;
    if (kind === "flow") { if (!e.start) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; }
    const y = calYear(e.end); const prev = by[y];
    if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: String(e.filed) };
  }
  const o: Record<number, number> = {}; for (const y of Object.keys(by)) o[+y] = by[+y].val; return o;
}
function coalesceMapFull(g: Gaap, tags: string[], kind: "flow" | "stock"): Record<number, number> {
  const vals: Record<number, number> = {};
  for (const t of tags) { const m = annualMapFull(g, t, kind); for (const y of Object.keys(m).map(Number)) if (vals[y] == null) vals[y] = m[y]; }
  return vals;
}
function trueLatestYear(m: Record<number, number>): number | null { const ks = Object.keys(m).map(Number); return ks.length ? Math.max(...ks) : null; }
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

async function fetchFacts(cik: number): Promise<Gaap | null> {
  const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) return null;
  const j = (await r.json()) as { facts?: { "us-gaap"?: Gaap } };
  return j.facts?.["us-gaap"] ?? null;
}
let lastCall = 0;
async function throttle() { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); }

// drivers.ts §213-231을 임의 5년 창(YSw)에 대해 재현 — YS 상수 대신 파라미터로 받는다(규칙 5-2 y=f(x) 취지 자체 실험).
function recomputeDrivers(gaap: Gaap, YSw: number[]) {
  const firstY = YSw[0], lastY = YSw[YSw.length - 1];
  const revAll = coalesceMapFull(gaap, REV, "flow");
  const oiDirect = coalesceMapFull(gaap, ["OperatingIncomeLoss"], "flow");
  const cae = coalesceMapFull(gaap, ["CostsAndExpenses"], "flow");
  const pretax = coalesceMapFull(gaap, PRETAX, "flow"), interest = coalesceMapFull(gaap, INTEREST, "flow");
  const oi: Record<number, number> = {};
  for (const y of YSw) {
    if (oiDirect[y] != null) oi[y] = oiDirect[y];
    else if (revAll[y] != null && cae[y] != null) oi[y] = revAll[y] - cae[y];
    else if (pretax[y] != null && interest[y] != null) oi[y] = pretax[y] + Math.abs(interest[y]);
  }
  const ppe = coalesceMapFull(gaap, PPE, "stock");
  const capex = coalesceMapFull(gaap, CAPEX, "flow");
  const dnaTot = coalesceMapFull(gaap, DNA_TOTAL, "flow");
  const depr = coalesceMapFull(gaap, DEPR_ONLY, "flow"), amort = coalesceMapFull(gaap, AMORT_ONLY, "flow");
  const dna: Record<number, number> = {};
  for (const y of YSw) { if (dnaTot[y] != null) dna[y] = dnaTot[y]; else if (depr[y] != null && amort[y] != null) dna[y] = depr[y] + amort[y]; }
  const acq = coalesceMapFull(gaap, ACQ, "flow"), capsw = coalesceMapFull(gaap, CAPSW, "flow"), othinv = coalesceMapFull(gaap, OTHINV, "flow");
  const assetsCur = coalesceMapFull(gaap, ["AssetsCurrent"], "stock"), liabCur = coalesceMapFull(gaap, ["LiabilitiesCurrent"], "stock");
  const cashOp = coalesceMapFull(gaap, CASH_OP, "stock");

  const haveRevAll = YSw.every((y) => revAll[y] != null && revAll[y] > 0);
  const haveOiAll = YSw.every((y) => oi[y] != null);
  if (!haveRevAll || !haveOiAll) return null; // 이 창에선 5년 전부가 안 채워짐 — 재계산 불가(정직히 null)

  const nSpan = lastY - firstY;
  const salesGrowth = nSpan > 0 && revAll[firstY] > 0 ? (revAll[lastY] / revAll[firstY]) ** (1 / nSpan) - 1 : 0;
  const operatingMargin = mean(YSw.filter((y) => revAll[y] > 0).map((y) => oi[y] / revAll[y]));
  const startingMargin = revAll[lastY] > 0 ? oi[lastY] / revAll[lastY] : operatingMargin;
  const fixedCapitalRateLevel = ppe && YSw.every((y) => ppe[y] != null) ? mean(YSw.filter((y) => revAll[y] > 0).map((y) => ppe[y] / revAll[y])) : null;
  let fixedCapitalRateMarginal: number | null = null;
  const invYears = YSw.slice(1);
  if (invYears.every((y) => capex[y] != null && dna[y] != null)) {
    let cumNet = 0; for (const y of invYears) cumNet += Math.abs(capex[y]) + Math.abs(acq[y] ?? 0) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0) - Math.abs(dna[y]);
    const cumDRev = revAll[lastY] - revAll[firstY];
    if (cumDRev !== 0) fixedCapitalRateMarginal = cumNet / cumDRev;
  }
  const workingCapitalRate = assetsCur && liabCur && cashOp && YSw.every((y) => assetsCur[y] != null && liabCur[y] != null && cashOp[y] != null)
    ? mean(YSw.filter((y) => revAll[y] > 0).map((y) => (assetsCur[y] - cashOp[y] - liabCur[y]) / revAll[y])) : null;

  return { salesGrowth, operatingMargin, startingMargin, fixedCapitalRateLevel, fixedCapitalRateMarginal, workingCapitalRate, startingSales: revAll[lastY] };
}

async function main() {
  const sb = createAdminClient();
  const { data } = await sb.from("revdcf_results").select("symbol,cik,verdict,gap_years,wacc,tax_rate,debt,non_operating_assets,shares,share_price,fixed_capital_rate_marginal,fixed_capital_rate,starting_margin,operating_margin,sales_growth,working_capital_rate")
    .eq("as_of", "2026-08-08").order("symbol").limit(20);
  const rows = (data ?? []) as { symbol: string; cik: number; verdict: string; gap_years: number | null; wacc: number | null; tax_rate: number | null; debt: number | null; non_operating_assets: number | null; shares: number | null; share_price: number | null; fixed_capital_rate_marginal: number | null; fixed_capital_rate: number | null; starting_margin: number | null; operating_margin: number | null; sales_growth: number | null; working_capital_rate: number | null }[];
  console.log(`표본 20종목(사전순): ${rows.map((r) => r.symbol).join(",")}`);

  const inflation = 0.025; // damodaran_global_inputs.expected_inflation(직접 조회 확정치)

  const results = await Promise.all(rows.map(async (row) => {
    await throttle();
    if (row.verdict === "skipped" || row.wacc == null) {
      return { symbol: row.symbol, status: "SKIPPED_IN_DB", note: "이미 skip 상태 — 드라이버 값이 DB에 없어 YS 이동 효과를 격리할 재료 자체가 없음(전체 게이트 재실행은 범위 밖)" };
    }
    const gaap = await fetchFacts(row.cik);
    if (!gaap) return { symbol: row.symbol, status: "FETCH_FAIL" };
    const revAll = coalesceMapFull(gaap, REV, "flow");
    const actualLatestYear = trueLatestYear(revAll);
    if (actualLatestYear == null) return { symbol: row.symbol, status: "NO_REVENUE_DATA" };
    const missingYears = Math.max(0, actualLatestYear - 2024);
    if (missingYears === 0) return { symbol: row.symbol, status: "NO_GAP", actualLatestYear, missingYears: 0 };

    const YSw = [actualLatestYear - 4, actualLatestYear - 3, actualLatestYear - 2, actualLatestYear - 1, actualLatestYear];
    const recomputed = recomputeDrivers(gaap, YSw);
    if (!recomputed || recomputed.fixedCapitalRateMarginal == null) return { symbol: row.symbol, status: "RECOMPUTE_INCOMPLETE", actualLatestYear, missingYears, note: "이동된 창에서 5년 전부를 못 채움(재료 결측) — 재현 불가, 이것도 결과다" };

    const drv: RevDcfDrivers = {
      startingSales: recomputed.startingSales, salesGrowth: recomputed.salesGrowth, operatingMargin: recomputed.operatingMargin, startingMargin: recomputed.startingMargin,
      taxRate: Number(row.tax_rate), fixedCapitalRate: recomputed.fixedCapitalRateMarginal, workingCapitalRate: recomputed.workingCapitalRate!,
    };
    const market: RevDcfMarket = { wacc: Number(row.wacc), inflation, sharePrice: Number(row.share_price), sharesOutstanding: Number(row.shares), debt: Number(row.debt), nonOperatingAssets: Number(row.non_operating_assets) };
    const sens = computeGapWithSensitivity(drv, market, { maxYears: MAX_YEARS });
    const eng = runRevDcf(drv, market, { maxYears: MAX_YEARS });

    const newVerdict = sens.base.kind;
    const newGapYears = sens.base.kind === "years" ? sens.base.gap : null;
    const verdictChanged = newVerdict !== row.verdict;
    const gapYearsChanged = newGapYears !== row.gap_years;

    return {
      symbol: row.symbol, status: "RECOMPUTED", actualLatestYear, missingYears,
      before: { verdict: row.verdict, gap_years: row.gap_years, fixed_capital_rate_marginal: row.fixed_capital_rate_marginal, starting_margin: row.starting_margin, operating_margin: row.operating_margin, sales_growth: row.sales_growth, working_capital_rate: row.working_capital_rate },
      after: { verdict: newVerdict, gap_years: newGapYears, fixed_capital_rate_marginal: recomputed.fixedCapitalRateMarginal, starting_margin: recomputed.startingMargin, operating_margin: recomputed.operatingMargin, sales_growth: recomputed.salesGrowth, working_capital_rate: recomputed.workingCapitalRate, threshold_margin: eng.thresholdMargin, monotonic: eng.monotonic },
      verdictChanged, gapYearsChanged,
    };
  }));

  fs.writeFileSync(
    "/private/tmp/claude-501/-Users-maegbug-stock-terminal/8ac4e594-069c-4a4e-bc10-d6e60c09ac6f/scratchpad/probe950_revdcf_impact.json",
    JSON.stringify({ sampleSize: 20, note: "표본이다. 604종목 전수가 아니다.", results }, null, 2),
  );
  console.log("저장 완료");
  console.log(results.map((r) => `${r.symbol}: ${r.status}${"verdictChanged" in r ? ` verdictChanged=${r.verdictChanged}` : ""}`).join("\n"));
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
