// STEP 1001 §2 — rf와 ERP를 "짝"으로 함께 교체했을 때 604 전수 영향(계산만, DB 쓰기 0).
// 1000은 rf만 FRED로 바꾸고 ERP는 Damodaran 정적값(짝 안 맞음) — 이 스크립트는 rf·ERP를
// ERPbymonth.xlsx의 같은 행(같은 달)에서 함께 가져와 "짝이 맞으면 전환율이 낮아지는가"를 검증한다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { assembleWacc } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

// OLD = 현재 DB 저장값(damodaran_global_inputs, as_of=2026-01-05) — ERPbymonth.xlsx 2026-01 행과 정확히 일치(1-4 확인)
const RF_OLD = 0.0395; // "$ Riskfree Rate" 2026-01
const ERP_OLD = 0.0446; // "ERP (T12m) with adj riskfree rate" 2026-01

// NEW(C안) = ERPbymonth.xlsx 최신 행(2026-08, "Historical ERP" 시트) — 같은 행에서 짝으로 취득
const RF_NEW_PAIRED = 0.0452; // "$ Riskfree Rate" 2026-08
const ERP_NEW_PAIRED = 0.0445; // "ERP (T12m) with adj riskfree rate" 2026-08

// 참고 비교용 — 1000의 rf만 교체(짝 안 맞음): rf=FRED raw 4.65%, ERP=Damodaran 정적 4.46%(불변)
const RF_1000_MISMATCHED = 0.0465;
const ERP_1000_UNCHANGED = 0.0446;

const REVDCF_DEFAULT_MAX_YEARS = 25;

type Row = {
  symbol: string; verdict: string; wacc: number; beta_unlevered: number; de_ratio: number;
  share_price: number; shares: number; debt: number; non_operating_assets: number;
  sales_growth: number; operating_margin: number; starting_margin: number; tax_rate: number;
  fixed_capital_rate: number; working_capital_rate: number; starting_sales: number | null;
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

  type Result = {
    symbol: string; reconstructionErrorBp: number;
    waccOld: number; waccPaired: number; waccMismatched: number;
    waccDeltaPairedBp: number; waccDeltaMismatchedBp: number;
    kindOld: string; kindPaired: string; kindMismatched: string;
    kindChangedPaired: boolean; kindChangedMismatched: boolean;
    transitionPaired: string | null; transitionMismatched: string | null;
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
    };
    if (row.starting_sales == null || !(row.shares > 0)) { skippedNoRevenue++; continue; }

    const creditSpread = deriveCreditSpread(row);
    const waccOld = assembleWacc({ riskFree: RF_OLD, erp: ERP_OLD, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const waccPaired = assembleWacc({ riskFree: RF_NEW_PAIRED, erp: ERP_NEW_PAIRED, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const waccMismatched = assembleWacc({ riskFree: RF_1000_MISMATCHED, erp: ERP_1000_UNCHANGED, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const reconstructionErrorBp = Math.abs(waccOld.wacc - row.wacc) * 10000;

    const drivers: RevDcfDrivers = {
      startingSales: row.starting_sales, salesGrowth: row.sales_growth, operatingMargin: row.operating_margin,
      startingMargin: row.starting_margin, taxRate: row.tax_rate, fixedCapitalRate: row.fixed_capital_rate, workingCapitalRate: row.working_capital_rate,
    };
    const marketOld: RevDcfMarket = { wacc: waccOld.wacc, inflation: 0.025, sharePrice: row.share_price, sharesOutstanding: row.shares, debt: row.debt, nonOperatingAssets: row.non_operating_assets };
    const marketPaired: RevDcfMarket = { ...marketOld, wacc: waccPaired.wacc };
    const marketMismatched: RevDcfMarket = { ...marketOld, wacc: waccMismatched.wacc };

    const vOld = runRevDcf(drivers, marketOld, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict.kind;
    const vPaired = runRevDcf(drivers, marketPaired, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict.kind;
    const vMismatched = runRevDcf(drivers, marketMismatched, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict.kind;

    results.push({
      symbol: row.symbol, reconstructionErrorBp,
      waccOld: waccOld.wacc, waccPaired: waccPaired.wacc, waccMismatched: waccMismatched.wacc,
      waccDeltaPairedBp: (waccPaired.wacc - waccOld.wacc) * 10000,
      waccDeltaMismatchedBp: (waccMismatched.wacc - waccOld.wacc) * 10000,
      kindOld: vOld, kindPaired: vPaired, kindMismatched: vMismatched,
      kindChangedPaired: vOld !== vPaired, kindChangedMismatched: vOld !== vMismatched,
      transitionPaired: vOld !== vPaired ? `${vOld}→${vPaired}` : null,
      transitionMismatched: vOld !== vMismatched ? `${vOld}→${vMismatched}` : null,
    });
  }

  const pairedChanged = results.filter((r) => r.kindChangedPaired);
  const mismatchedChanged = results.filter((r) => r.kindChangedMismatched);
  const transPaired: Record<string, number> = {};
  for (const r of pairedChanged) transPaired[r.transitionPaired!] = (transPaired[r.transitionPaired!] ?? 0) + 1;
  const transMismatched: Record<string, number> = {};
  for (const r of mismatchedChanged) transMismatched[r.transitionMismatched!] = (transMismatched[r.transitionMismatched!] ?? 0) + 1;

  const summary = {
    universeAsOf: latestAsOf.as_of,
    computable: computable.length,
    skippedNoRevenue,
    analyzed: results.length,
    reconstructionCheck: { maxErrorBp: Math.max(...results.map((r) => r.reconstructionErrorBp)), errorsOver1bp: results.filter((r) => r.reconstructionErrorBp > 1).length },
    inputs: {
      old_2026_01: { riskFree: RF_OLD, erp: ERP_OLD, source: "damodaran_global_inputs(DB저장) = ERPbymonth.xlsx 2026-01 행과 정확 일치(1-4 확인)" },
      new_paired_2026_08: { riskFree: RF_NEW_PAIRED, erp: ERP_NEW_PAIRED, source: "ERPbymonth.xlsx 'Historical ERP' 시트 2026-08 행, 같은 행에서 짝으로 취득" },
      reference_1000_mismatched: { riskFree: RF_1000_MISMATCHED, erp: ERP_1000_UNCHANGED, source: "1000 재현 참고용 — rf만 FRED로 교체, ERP는 정적 유지(짝 안 맞음)" },
    },
    waccDeltaPairedBpStats: stats(results.map((r) => r.waccDeltaPairedBp)),
    waccDeltaMismatchedBpStats: stats(results.map((r) => r.waccDeltaMismatchedBp)),
    kindChangedPaired: { count: pairedChanged.length, total: results.length, pct: +((pairedChanged.length / results.length) * 100).toFixed(1) },
    kindChangedMismatchedReplication: { count: mismatchedChanged.length, total: results.length, pct: +((mismatchedChanged.length / results.length) * 100).toFixed(1) },
    comparisonToStep1000: { step1000_reported_pct: 6.4, thisRun_mismatched_replication_pct: +((mismatchedChanged.length / results.length) * 100).toFixed(1), thisRun_paired_pct: +((pairedChanged.length / results.length) * 100).toFixed(1) },
    transitionMatrixPaired: transPaired,
    transitionMatrixMismatchedReplication: transMismatched,
  };

  console.log("=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log("\n=== PAIRED KIND-CHANGED DETAIL ===");
  console.log(JSON.stringify(pairedChanged, null, 2));
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
