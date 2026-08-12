// STEP 1003 §4 — ERPbymonth.xlsx 최신 월(오늘 기준) 값으로 604 전수 재측정(계산만, DB 쓰기 0).
// 1001과 같은 방법론(rf·ERP를 같은 행에서 짝으로 취득), 이번엔 섹터·부채4분위 분해까지 추가(1000 패턴 재사용).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { assembleWacc } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

// OLD = 현재 DB 저장값(damodaran_global_inputs, as_of=2026-01-05) — ERPbymonth.xlsx 2026-01행과 정확일치(1001 확인)
const RF_OLD = 0.0395;
const ERP_OLD = 0.0446;

// NEW(paired) = ERPbymonth.xlsx 'Historical ERP' 시트 최신 행(오늘 기준 재확인, 2026-08-01, Last-Modified 불변)
const RF_NEW = 0.0452; // "$ Riskfree Rate" 열D
const ERP_NEW = 0.0445; // "ERP (T12m) with adj riskfree rate" 열K
const LATEST_MONTH = "2026-08-01";

const REVDCF_DEFAULT_MAX_YEARS = 25;

type Row = {
  symbol: string; verdict: string; wacc: number; beta_unlevered: number; de_ratio: number;
  share_price: number; shares: number; debt: number; non_operating_assets: number;
  sales_growth: number; operating_margin: number; starting_margin: number; tax_rate: number;
  fixed_capital_rate: number; working_capital_rate: number; starting_sales: number | null; sector: string | null;
};

function deriveCreditSpread(row: Row): number {
  const releveredBeta = row.beta_unlevered * (1 + (1 - row.tax_rate) * row.de_ratio);
  const costOfEquity = RF_OLD + releveredBeta * ERP_OLD;
  const debtWeight = row.de_ratio / (1 + row.de_ratio);
  const equityWeight = 1 / (1 + row.de_ratio);
  if (debtWeight === 0) return 0;
  const atCoD = (row.wacc - costOfEquity * equityWeight) / debtWeight;
  return atCoD / (1 - row.tax_rate) - RF_OLD;
}

function stats(nums: number[]) {
  if (nums.length === 0) return { n: 0, median: 0, p90: 0, max: 0, min: 0, avg: 0 };
  const s = [...nums].sort((a, b) => a - b);
  return { n: s.length, median: s[Math.floor(s.length / 2)], p90: s[Math.min(s.length - 1, Math.floor(s.length * 0.9))], max: s[s.length - 1], min: s[0], avg: s.reduce((a, b) => a + b, 0) / s.length };
}

async function main() {
  const sb = createAdminClient();
  const latestAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const rows: Record<string, unknown>[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select(
      "symbol,verdict,wacc,beta_unlevered,de_ratio,share_price,shares,debt,non_operating_assets,sales_growth,operating_margin,starting_margin,tax_rate,fixed_capital_rate,working_capital_rate"
    ).eq("as_of", latestAsOf.as_of).range(f, f + 999);
    const c = (data ?? []) as Record<string, unknown>[];
    rows.push(...c);
    if (c.length < 1000) break;
  }
  const computable = rows.filter((r) => r.verdict !== "skipped" && r.wacc != null && r.beta_unlevered != null && r.de_ratio != null);

  const symbols = computable.map((r) => r.symbol as string);
  const fundBySym = new Map<string, number>();
  for (let f = 0; f < symbols.length; f += 500) {
    const chunk = symbols.slice(f, f + 500);
    const { data } = await sb.from("us_fundamentals").select("symbol, revenue").in("symbol", chunk);
    for (const r of (data ?? []) as { symbol: string; revenue: number | null }[]) if (r.revenue != null) fundBySym.set(r.symbol, r.revenue);
  }
  const sectorBySym = new Map<string, string>();
  for (let f = 0; f < symbols.length; f += 500) {
    const chunk = symbols.slice(f, f + 500);
    const { data } = await sb.from("us_sector_relative").select("symbol, sector").eq("as_of", "2026-08-09").in("symbol", chunk);
    for (const r of (data ?? []) as { symbol: string; sector: string | null }[]) if (r.sector) sectorBySym.set(r.symbol, r.sector);
  }

  type Result = {
    symbol: string; sector: string | null; deRatio: number; reconstructionErrorBp: number;
    waccOld: number; waccNew: number; waccDeltaBp: number;
    kindOld: string; kindNew: string; kindChanged: boolean; transition: string | null;
  };
  const results: Result[] = [];
  let skippedNoRevenue = 0;

  for (const raw of computable) {
    const row: Row = {
      symbol: raw.symbol as string, verdict: raw.verdict as string,
      wacc: Number(raw.wacc), beta_unlevered: Number(raw.beta_unlevered), de_ratio: Number(raw.de_ratio),
      share_price: Number(raw.share_price), shares: Number(raw.shares), debt: Number(raw.debt), non_operating_assets: Number(raw.non_operating_assets),
      sales_growth: Number(raw.sales_growth), operating_margin: Number(raw.operating_margin), starting_margin: Number(raw.starting_margin),
      tax_rate: Number(raw.tax_rate), fixed_capital_rate: Number(raw.fixed_capital_rate), working_capital_rate: Number(raw.working_capital_rate),
      starting_sales: fundBySym.get(raw.symbol as string) ?? null,
      sector: sectorBySym.get(raw.symbol as string) ?? null,
    };
    if (row.starting_sales == null || !(row.shares > 0)) { skippedNoRevenue++; continue; }

    const creditSpread = deriveCreditSpread(row);
    const waccOld = assembleWacc({ riskFree: RF_OLD, erp: ERP_OLD, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const waccNew = assembleWacc({ riskFree: RF_NEW, erp: ERP_NEW, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const reconstructionErrorBp = Math.abs(waccOld.wacc - row.wacc) * 10000;

    const drivers: RevDcfDrivers = {
      startingSales: row.starting_sales, salesGrowth: row.sales_growth, operatingMargin: row.operating_margin,
      startingMargin: row.starting_margin, taxRate: row.tax_rate, fixedCapitalRate: row.fixed_capital_rate, workingCapitalRate: row.working_capital_rate,
    };
    const marketOld: RevDcfMarket = { wacc: waccOld.wacc, inflation: 0.025, sharePrice: row.share_price, sharesOutstanding: row.shares, debt: row.debt, nonOperatingAssets: row.non_operating_assets };
    const marketNew: RevDcfMarket = { ...marketOld, wacc: waccNew.wacc };

    const kOld = runRevDcf(drivers, marketOld, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict.kind;
    const kNew = runRevDcf(drivers, marketNew, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict.kind;
    const kindChanged = kOld !== kNew;

    results.push({
      symbol: row.symbol, sector: row.sector, deRatio: row.de_ratio, reconstructionErrorBp,
      waccOld: waccOld.wacc, waccNew: waccNew.wacc, waccDeltaBp: (waccNew.wacc - waccOld.wacc) * 10000,
      kindOld: kOld, kindNew: kNew, kindChanged, transition: kindChanged ? `${kOld}→${kNew}` : null,
    });
  }

  const changed = results.filter((r) => r.kindChanged);
  const transitionMatrix: Record<string, number> = {};
  for (const r of changed) transitionMatrix[r.transition!] = (transitionMatrix[r.transition!] ?? 0) + 1;

  const bySector: Record<string, { n: number; kindChanged: number; avgWaccDeltaBp: number }> = {};
  for (const r of results) {
    const key = r.sector ?? "NO_SECTOR";
    bySector[key] ??= { n: 0, kindChanged: 0, avgWaccDeltaBp: 0 };
    bySector[key].n++;
    if (r.kindChanged) bySector[key].kindChanged++;
    bySector[key].avgWaccDeltaBp += r.waccDeltaBp;
  }
  for (const k of Object.keys(bySector)) bySector[k].avgWaccDeltaBp = +(bySector[k].avgWaccDeltaBp / bySector[k].n).toFixed(2);

  const sortedByDe = [...results].sort((a, b) => a.deRatio - b.deRatio);
  const q = Math.floor(sortedByDe.length / 4);
  const debtQuartiles = [
    { label: "Q1(최저부채)", rows: sortedByDe.slice(0, q) },
    { label: "Q2", rows: sortedByDe.slice(q, 2 * q) },
    { label: "Q3", rows: sortedByDe.slice(2 * q, 3 * q) },
    { label: "Q4(최고부채)", rows: sortedByDe.slice(3 * q) },
  ].map((g) => ({
    label: g.label, n: g.rows.length,
    deRatioRange: [g.rows[0]?.deRatio, g.rows[g.rows.length - 1]?.deRatio],
    avgWaccDeltaBp: +(g.rows.reduce((a, r) => a + r.waccDeltaBp, 0) / g.rows.length).toFixed(2),
    kindChangedPct: +((g.rows.filter((r) => r.kindChanged).length / g.rows.length) * 100).toFixed(1),
  }));

  const summary = {
    latestMonth: LATEST_MONTH,
    inputs: { old: { riskFree: RF_OLD, erp: ERP_OLD }, new: { riskFree: RF_NEW, erp: ERP_NEW } },
    universeAsOf: latestAsOf.as_of,
    computable: computable.length,
    skippedNoRevenue,
    analyzed: results.length,
    reconstructionCheck: { maxErrorBp: Math.max(...results.map((r) => r.reconstructionErrorBp)), errorsOver1bp: results.filter((r) => r.reconstructionErrorBp > 1).length },
    waccDeltaBpStats: stats(results.map((r) => r.waccDeltaBp)),
    kindChanged: { count: changed.length, total: results.length, pct: +((changed.length / results.length) * 100).toFixed(1) },
    comparisonToStep1001: { step1001_pct: 5.9, thisRun_pct: +((changed.length / results.length) * 100).toFixed(1), sameMonth: true },
    transitionMatrix,
    bySector,
    byDebtQuartile: debtQuartiles,
  };

  console.log("=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log("\n=== KIND-CHANGED DETAIL ===");
  console.log(JSON.stringify(changed, null, 2));
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
