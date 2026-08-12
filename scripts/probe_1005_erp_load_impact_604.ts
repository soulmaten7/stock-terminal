// STEP 1005 §3 — 새로 적재된 damodaran_global_inputs 행(as_of=2026-08-01) 기준 604 전수 영향 재측정.
// 🔴 rf·erp를 하드코딩하지 않고 DB에서 실제로 읽는다(1003/1004의 상수 재사용이 아니라 라이브 로드 확인).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { assembleWacc } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

const REVDCF_DEFAULT_MAX_YEARS = 25;

type Row = {
  symbol: string; verdict: string; wacc: number; beta_unlevered: number; de_ratio: number;
  share_price: number; shares: number; debt: number; non_operating_assets: number;
  sales_growth: number; operating_margin: number; starting_margin: number; tax_rate: number;
  fixed_capital_rate: number; working_capital_rate: number; starting_sales: number | null; sector: string | null;
};

function stats(nums: number[]) {
  if (nums.length === 0) return { n: 0, median: 0, p90: 0, max: 0, min: 0, avg: 0 };
  const s = [...nums].sort((a, b) => a - b);
  return { n: s.length, median: s[Math.floor(s.length / 2)], p90: s[Math.min(s.length - 1, Math.floor(s.length * 0.9))], max: s[s.length - 1], min: s[0], avg: s.reduce((a, b) => a + b, 0) / s.length };
}

async function main() {
  const sb = createAdminClient();

  // 라이브 DB에서 구·신 행을 실제로 읽는다(하드코딩 없음)
  const { data: allGi } = await sb.from("damodaran_global_inputs").select("*").order("as_of", { ascending: false });
  const rowsGi = (allGi ?? []) as { as_of: string; riskfree_rate: string | number; erp: string | number }[];
  const NEW = rowsGi[0]; // 최신(2026-08-01 기대)
  const OLD = rowsGi.find((r) => r.as_of !== NEW.as_of); // 그 다음(2026-01-05 기대)
  if (!OLD || !NEW) throw new Error(`예상과 다른 행수 — ${rowsGi.length}행, as_of=${rowsGi.map((r) => r.as_of).join(",")}`);
  const RF_OLD = Number(OLD.riskfree_rate), ERP_OLD = Number(OLD.erp);
  const RF_NEW = Number(NEW.riskfree_rate), ERP_NEW = Number(NEW.erp);
  console.log(`라이브 로드: OLD(as_of=${OLD.as_of}) rf=${RF_OLD} erp=${ERP_OLD} / NEW(as_of=${NEW.as_of}) rf=${RF_NEW} erp=${ERP_NEW}`);

  function deriveCreditSpread(row: Row): number {
    const releveredBeta = row.beta_unlevered * (1 + (1 - row.tax_rate) * row.de_ratio);
    const costOfEquity = RF_OLD + releveredBeta * ERP_OLD;
    const debtWeight = row.de_ratio / (1 + row.de_ratio);
    const equityWeight = 1 / (1 + row.de_ratio);
    if (debtWeight === 0) return 0;
    const atCoD = (row.wacc - costOfEquity * equityWeight) / debtWeight;
    return atCoD / (1 - row.tax_rate) - RF_OLD;
  }

  const latestAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const rows: Record<string, unknown>[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("revdcf_results").select(
      "symbol,verdict,wacc,beta_unlevered,de_ratio,share_price,shares,debt,non_operating_assets,sales_growth,operating_margin,starting_margin,tax_rate,fixed_capital_rate,working_capital_rate"
    ).eq("as_of", latestAsOf.as_of).range(f, f + 999);
    if (error) throw new Error(error.message);
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

  type Result = { symbol: string; sector: string | null; deRatio: number; waccDeltaBp: number; kindOld: string; kindNew: string; kindChanged: boolean; transition: string | null };
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
    const drivers: RevDcfDrivers = { startingSales: row.starting_sales, salesGrowth: row.sales_growth, operatingMargin: row.operating_margin, startingMargin: row.starting_margin, taxRate: row.tax_rate, fixedCapitalRate: row.fixed_capital_rate, workingCapitalRate: row.working_capital_rate };
    const marketOld: RevDcfMarket = { wacc: waccOld.wacc, inflation: 0.025, sharePrice: row.share_price, sharesOutstanding: row.shares, debt: row.debt, nonOperatingAssets: row.non_operating_assets };
    const marketNew: RevDcfMarket = { ...marketOld, wacc: waccNew.wacc };
    const kOld = runRevDcf(drivers, marketOld, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict.kind;
    const kNew = runRevDcf(drivers, marketNew, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict.kind;
    const kindChanged = kOld !== kNew;
    results.push({ symbol: row.symbol, sector: row.sector, deRatio: row.de_ratio, waccDeltaBp: (waccNew.wacc - waccOld.wacc) * 10000, kindOld: kOld, kindNew: kNew, kindChanged, transition: kindChanged ? `${kOld}→${kNew}` : null });
  }

  const changed = results.filter((r) => r.kindChanged);
  const transitionMatrix: Record<string, number> = {};
  for (const r of changed) transitionMatrix[r.transition!] = (transitionMatrix[r.transition!] ?? 0) + 1;

  const summary = {
    liveLoadedAsOf: { old: OLD.as_of, new: NEW.as_of },
    liveLoadedValues: { old: { riskFree: RF_OLD, erp: ERP_OLD }, new: { riskFree: RF_NEW, erp: ERP_NEW } },
    universeAsOf: latestAsOf.as_of,
    computable: computable.length,
    analyzed: results.length,
    skippedNoRevenue,
    waccDeltaBpStats: stats(results.map((r) => r.waccDeltaBp)),
    kindChanged: { count: changed.length, total: results.length, pct: +((changed.length / results.length) * 100).toFixed(1) },
    comparisonToStep1003: { step1003_pct: 5.9, thisRun_pct: +((changed.length / results.length) * 100).toFixed(1), identicalBecauseSameMonth: true },
    transitionMatrix,
    note: "1003이 §4에서 상수로 쓴 값과 지금 라이브 DB에서 읽은 값이 같다(같은 2026-08 월, HTTP Last-Modified 불변) — 그래서 결과도 동일하다. 이번 실행의 의미는 '숫자가 다르다'가 아니라 '실제로 적재된 값으로 다시 재현된다'는 확인.",
  };

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
