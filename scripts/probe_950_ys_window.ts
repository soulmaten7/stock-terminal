// STEP 950 — lib/revdcf/drivers.ts:12 `const YS = [2020,2021,2022,2023,2024]` 하드코딩 결함의 영향 범위 실측.
// 🔴 조사 전용. drivers.ts는 수정하지 않는다. DB에 쓰지 않는다(읽기만). 크론을 호출하지 않는다.
// 태그 상수·calYear·annualMap 패턴은 drivers.ts를 그대로 복제했다(로직 재현 목적, import 아님 — drivers.ts는 YS에
// 묶여 있어 이 스크립트가 필요로 하는 "YS 밖 임의 연도" 조회를 할 수 없다).
// 실행: npx tsx scripts/probe_950_ys_window.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { computeValuation } from "../lib/valuation";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const YS_MAX = 2024; // drivers.ts:12 YS 배열의 최댓값(하드코딩) — "지금 쓰는 값"

type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
type Gaap = Record<string, { units?: Record<string, Fact[]> }>;

// ── drivers.ts 태그 상수 복제(39~64행) ──────────────────────────────────────
const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
const COST = ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices", "CostOfSales", "CostOfOperatingRevenues", "CostOfRevenues"];
const PRETAX = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"];
const INTEREST = ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestIncomeExpenseNet"];
const DNA_TOTAL = ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndDepletion", "DepreciationAmortizationAndAccretionNet"];
const DEPR_ONLY = ["Depreciation"];
const AMORT_ONLY = ["AmortizationOfIntangibleAssets"];
const NET_INCOME = ["NetIncomeLoss", "ProfitLoss", "NetIncomeLossAvailableToCommonStockholdersBasic"];
const EQUITY = ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest", "CommonStockholdersEquity"];
const DEBT_LT = ["LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations"];
const DEBT_CUR = ["LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"];
const FIN_LEASE = ["FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent"];
const DEBT_TOTAL_SINGLE = ["DebtAndCapitalLeaseObligations"];
const CASH_NONOP = ["CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "CashAndCashEquivalentsAtCarryingValue"];
const SECURITIES = ["ShortTermInvestments", "MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesCurrent", "OtherShortTermInvestments"];

const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));

// drivers.ts의 annualMap과 동일하되 YS 바운드가 없다(latestYear()의 YS 순회가 진짜 제약이었다는 것을 949/950에서 확인) —
// 여기서는 발견된 모든 연도를 그대로 남긴다. end 날짜도 같이 남겨 회계연도 종료월을 알 수 있게 한다.
function annualMapFull(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, { val: number; filed: string; end: string }> {
  const arr = g[tag]?.units?.[unit];
  const by: Record<number, { val: number; filed: string; end: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null || !e.end) continue;
    if (kind === "flow") { if (!e.start) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; }
    const y = calYear(e.end); const prev = by[y];
    if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: String(e.filed), end: e.end };
  }
  return by;
}
function coalesceAt(g: Gaap, tags: string[], kind: "flow" | "stock", year: number): { val: number | null; tag: string | null } {
  for (const t of tags) { const m = annualMapFull(g, t, kind); if (m[year] != null) return { val: m[year].val, tag: t }; }
  return { val: null, tag: null };
}
function trueLatestYear(m: Record<number, { val: number; filed: string; end: string }>): number | null {
  const keys = Object.keys(m).map(Number);
  return keys.length ? Math.max(...keys) : null;
}

async function fetchFacts(cik: number): Promise<Gaap | null> {
  const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) return null;
  const j = (await r.json()) as { facts?: { "us-gaap"?: Gaap } };
  return j.facts?.["us-gaap"] ?? null;
}

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur], cur); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}
let lastCall = 0;
async function throttle() { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); }

type FundRow = { symbol: string; cik: number; fiscal_year: number | null; net_income: number | null; equity: number | null; revenue: number | null; operating_income: number | null; dna: number | null; debt: number | null; non_operating_assets: number | null; shares: number | null };
type ValRow = { symbol: string; market_cap: number | null; per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null };

async function main() {
  const sb = createAdminClient();
  const fundRows: FundRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_fundamentals").select("symbol,cik,fiscal_year,net_income,equity,revenue,operating_income,dna,debt,non_operating_assets,shares").range(f, f + 999);
    const c = (data ?? []) as FundRow[]; fundRows.push(...c); if (c.length < 1000) break;
  }
  const valRows: ValRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_valuation").select("symbol,market_cap,per,pbr,psr,ev_ebitda").range(f, f + 999);
    const c = (data ?? []) as ValRow[]; valRows.push(...c); if (c.length < 1000) break;
  }
  const valBySym = new Map(valRows.map((r) => [r.symbol, r]));
  console.log(`us_fundamentals ${fundRows.length}행 · us_valuation ${valRows.length}행 로드 완료`);

  type ScanResult = {
    symbol: string; cik: number;
    ysWindowLatestYear: number; // 항상 2024(하드코딩)
    actualLatestYear: number | null;
    fyEndMonth: number | null; fyEndDate: string | null;
    missingYears: number; // max(0, actual-2024)
    fetchError: string | null;
  };

  const scanResults: ScanResult[] = await mapLimit(fundRows, 6, async (row) => {
    await throttle();
    try {
      const gaap = await fetchFacts(row.cik);
      if (!gaap) return { symbol: row.symbol, cik: row.cik, ysWindowLatestYear: YS_MAX, actualLatestYear: null, fyEndMonth: null, fyEndDate: null, missingYears: 0, fetchError: "HTTP_NOT_OK" };
      // 매출 태그 통합(coalesce) — 여러 태그의 연도별 map을 병합해 「실제 존재하는 가장 최근 연도」를 구한다.
      const merged: Record<number, { val: number; filed: string; end: string }> = {};
      for (const t of REV) { const m = annualMapFull(gaap, t, "flow"); for (const y of Object.keys(m).map(Number)) { if (!merged[y] || String(m[y].filed) > String(merged[y].filed)) merged[y] = m[y]; } }
      const actualLatestYear = trueLatestYear(merged);
      if (actualLatestYear == null) return { symbol: row.symbol, cik: row.cik, ysWindowLatestYear: YS_MAX, actualLatestYear: null, fyEndMonth: null, fyEndDate: null, missingYears: 0, fetchError: "NO_REVENUE_DATA" };
      const entry = merged[actualLatestYear];
      const fyEndMonth = +entry.end.slice(5, 7);
      return { symbol: row.symbol, cik: row.cik, ysWindowLatestYear: YS_MAX, actualLatestYear, fyEndMonth, fyEndDate: entry.end, missingYears: Math.max(0, actualLatestYear - YS_MAX), fetchError: null };
    } catch (e) {
      return { symbol: row.symbol, cik: row.cik, ysWindowLatestYear: YS_MAX, actualLatestYear: null, fyEndMonth: null, fyEndDate: null, missingYears: 0, fetchError: String((e as Error).message).slice(0, 120) };
    }
  });
  console.log(`1단계 스캔 완료 — ${scanResults.length}건`);

  // ── 2단계: missingYears>=1 종목만 actualLatestYear 시점 값을 재추출해 4축 재계산 ──
  const needRecompute = scanResults.filter((r) => r.missingYears >= 1);
  console.log(`2단계 재계산 대상(missingYears>=1): ${needRecompute.length}건`);

  type RecomputeResult = {
    symbol: string; actualLatestYear: number; missingYears: number;
    currentValuation: ValRow | undefined;
    recomputed: { netIncome: number | null; equity: number | null; revenue: number | null; operatingIncome: number | null; dna: number | null; debt: number | null; nonOperatingAssets: number | null };
    recomputedValuation: ReturnType<typeof computeValuation>;
    relativeDelta: { per: number | null; pbr: number | null; psr: number | null; evEbitda: number | null };
  };

  const recomputeResults: RecomputeResult[] = await mapLimit(needRecompute, 6, async (r) => {
    await throttle();
    const gaap = await fetchFacts(r.cik);
    const val = valBySym.get(r.symbol);
    if (!gaap) return { symbol: r.symbol, actualLatestYear: r.actualLatestYear!, missingYears: r.missingYears, currentValuation: val, recomputed: { netIncome: null, equity: null, revenue: null, operatingIncome: null, dna: null, debt: null, nonOperatingAssets: null }, recomputedValuation: computeValuation({ marketCap: null, netIncome: null, equity: null, revenue: null, operatingIncome: null, dna: null, debt: null, nonOperatingAssets: null }), relativeDelta: { per: null, pbr: null, psr: null, evEbitda: null } };
    const Y = r.actualLatestYear!;
    const revC = coalesceAt(gaap, REV, "flow", Y);
    const niC = coalesceAt(gaap, NET_INCOME, "flow", Y);
    const eqC = coalesceAt(gaap, EQUITY, "stock", Y);
    const oiDirect = coalesceAt(gaap, ["OperatingIncomeLoss"], "flow", Y);
    let operatingIncome = oiDirect.val;
    if (operatingIncome == null) {
      // drivers.ts와 동일한 재구성 체인(매출-총비용 → 세전+이자)
      const caeC = coalesceAt(gaap, ["CostsAndExpenses"], "flow", Y);
      if (revC.val != null && caeC.val != null) operatingIncome = revC.val - caeC.val;
      else { const pretaxC = coalesceAt(gaap, PRETAX, "flow", Y); const interestC = coalesceAt(gaap, INTEREST, "flow", Y); if (pretaxC.val != null && interestC.val != null) operatingIncome = pretaxC.val + Math.abs(interestC.val); }
    }
    let dna: number | null = null;
    const dnaTotC = coalesceAt(gaap, DNA_TOTAL, "flow", Y);
    if (dnaTotC.val != null) dna = dnaTotC.val;
    else { const deprC = coalesceAt(gaap, DEPR_ONLY, "flow", Y); const amortC = coalesceAt(gaap, AMORT_ONLY, "flow", Y); if (deprC.val != null && amortC.val != null) dna = deprC.val + amortC.val; }
    const singleC = coalesceAt(gaap, DEBT_TOTAL_SINGLE, "stock", Y);
    let debt: number | null = singleC.val;
    if (debt == null) { const ltC = coalesceAt(gaap, DEBT_LT, "stock", Y); const curC = coalesceAt(gaap, DEBT_CUR, "stock", Y); const finC = coalesceAt(gaap, FIN_LEASE, "stock", Y); const parts = [ltC.val, curC.val, finC.val].filter((v): v is number => v != null); if (parts.length) debt = parts.reduce((a, b) => a + b, 0); }
    const nonOpCashC = coalesceAt(gaap, CASH_NONOP, "stock", Y);
    const secC = coalesceAt(gaap, SECURITIES, "stock", Y);
    const nonOp = (nonOpCashC.val ?? 0) + (secC.val ?? 0);

    const marketCap = val ? Number(val.market_cap) : null;
    const recomputed = { netIncome: niC.val, equity: eqC.val, revenue: revC.val, operatingIncome, dna, debt, nonOperatingAssets: debt != null ? nonOp : null };
    const recomputedValuation = computeValuation({ marketCap, netIncome: recomputed.netIncome, equity: recomputed.equity, revenue: recomputed.revenue, operatingIncome: recomputed.operatingIncome, dna: recomputed.dna, debt: recomputed.debt, nonOperatingAssets: recomputed.nonOperatingAssets });

    const relDelta = (cur: number | null | undefined, recomp: number | null) => (cur != null && recomp != null && recomp !== 0) ? (Number(cur) - recomp) / recomp : null;
    const relativeDelta = {
      per: relDelta(val?.per, recomputedValuation.per),
      pbr: relDelta(val?.pbr, recomputedValuation.pbr),
      psr: relDelta(val?.psr, recomputedValuation.psr),
      evEbitda: relDelta(val?.ev_ebitda, recomputedValuation.evEbitda),
    };
    return { symbol: r.symbol, actualLatestYear: Y, missingYears: r.missingYears, currentValuation: val, recomputed, recomputedValuation, relativeDelta };
  });
  console.log(`2단계 재계산 완료 — ${recomputeResults.length}건`);

  fs.writeFileSync(
    "/private/tmp/claude-501/-Users-maegbug-stock-terminal/8ac4e594-069c-4a4e-bc10-d6e60c09ac6f/scratchpad/probe950_scan_and_recompute.json",
    JSON.stringify({ scanResults, recomputeResults }),
  );
  console.log("저장 완료");
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
