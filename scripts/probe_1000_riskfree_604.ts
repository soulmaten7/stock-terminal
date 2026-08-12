// STEP 1000 §1 — riskfree만 FRED DGS10으로 교체 시 604 전수 영향(계산만, DB 쓰기 0).
// 999의 20종목 표본을 전수로 확장 — 985·998에서 소표본에 두 번 속은 전례 재발 방지.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { assembleWacc } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

const ERP = 0.0446;
const RISKFREE_DAMODARAN = 0.0395; // damodaran_global_inputs.riskfree_rate(as_of 2026-01-05)
const RISKFREE_FRED = 0.0465; // FRED DGS10(999에서 실측한 2026-08-07 값 그대로 재사용 — 일관성)
const REVDCF_DEFAULT_MAX_YEARS = 25;

type Row = {
  symbol: string; verdict: string; gap_years: number | null; wacc: number; beta_unlevered: number; de_ratio: number;
  share_price: number; shares: number; debt: number; non_operating_assets: number;
  sales_growth: number; operating_margin: number; starting_margin: number; tax_rate: number;
  fixed_capital_rate: number; working_capital_rate: number; starting_sales: number | null; sector: string | null;
};

function deriveCreditSpread(row: Row): number {
  const releveredBeta = row.beta_unlevered * (1 + (1 - row.tax_rate) * row.de_ratio);
  const costOfEquity = RISKFREE_DAMODARAN + releveredBeta * ERP;
  const debtWeight = row.de_ratio / (1 + row.de_ratio);
  const equityWeight = 1 / (1 + row.de_ratio);
  if (debtWeight === 0) return 0;
  const atCoD = (row.wacc - costOfEquity * equityWeight) / debtWeight;
  return atCoD / (1 - row.tax_rate) - RISKFREE_DAMODARAN;
}

function kind(v: { kind: string }): string {
  return v.kind;
}

function stats(nums: number[]) {
  if (nums.length === 0) return { n: 0, median: 0, p90: 0, max: 0, min: 0, avg: 0 };
  const s = [...nums].sort((a, b) => a - b);
  return {
    n: s.length,
    median: s[Math.floor(s.length / 2)],
    p90: s[Math.min(s.length - 1, Math.floor(s.length * 0.9))],
    max: s[s.length - 1],
    min: s[0],
    avg: s.reduce((a, b) => a + b, 0) / s.length,
  };
}

async function main() {
  const sb = createAdminClient();

  const latestAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const rows: Record<string, unknown>[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select(
      "symbol,verdict,gap_years,wacc,beta_unlevered,de_ratio,share_price,shares,debt,non_operating_assets,sales_growth,operating_margin,starting_margin,tax_rate,fixed_capital_rate,working_capital_rate"
    ).eq("as_of", latestAsOf.as_of).range(f, f + 999);
    const c = (data ?? []) as Record<string, unknown>[];
    rows.push(...c);
    if (c.length < 1000) break;
  }
  console.log(`revdcf_results as_of=${latestAsOf.as_of} 전체 ${rows.length}건`);

  // 계산 가능(verdict != skipped, wacc/beta_unlevered/de_ratio 존재)한 것만 대상
  const computable = rows.filter((r) => r.verdict !== "skipped" && r.wacc != null && r.beta_unlevered != null && r.de_ratio != null);
  console.log(`계산가능(skipped 제외) ${computable.length}건`);

  const symbols = computable.map((r) => r.symbol as string);

  // us_fundamentals에서 revenue(startingSales)
  const fundBySym = new Map<string, number>();
  for (let f = 0; f < symbols.length; f += 500) {
    const chunk = symbols.slice(f, f + 500);
    const { data } = await sb.from("us_fundamentals").select("symbol, revenue").in("symbol", chunk);
    for (const r of (data ?? []) as { symbol: string; revenue: number | null }[]) if (r.revenue != null) fundBySym.set(r.symbol, r.revenue);
  }

  // us_sector_relative(as_of=2026-08-09, 08-10은 오염) 섹터
  const sectorBySym = new Map<string, string>();
  for (let f = 0; f < symbols.length; f += 500) {
    const chunk = symbols.slice(f, f + 500);
    const { data } = await sb.from("us_sector_relative").select("symbol, sector").eq("as_of", "2026-08-09").in("symbol", chunk);
    for (const r of (data ?? []) as { symbol: string; sector: string | null }[]) if (r.sector) sectorBySym.set(r.symbol, r.sector);
  }

  type Result = {
    symbol: string; sector: string | null; deRatio: number; storedVerdictKind: string;
    waccOld: number; waccNew: number; waccDeltaBp: number;
    verdictOldKind: string; verdictNewKind: string; kindChanged: boolean; transition: string | null;
    reconstructionErrorBp: number; skippedNoRevenue: boolean;
  };
  const results: Result[] = [];
  let skippedNoRevenue = 0;

  for (const raw of computable) {
    const row: Row = {
      symbol: raw.symbol as string, verdict: raw.verdict as string, gap_years: raw.gap_years as number | null,
      wacc: Number(raw.wacc), beta_unlevered: Number(raw.beta_unlevered), de_ratio: Number(raw.de_ratio),
      share_price: Number(raw.share_price), shares: Number(raw.shares), debt: Number(raw.debt), non_operating_assets: Number(raw.non_operating_assets),
      sales_growth: Number(raw.sales_growth), operating_margin: Number(raw.operating_margin), starting_margin: Number(raw.starting_margin),
      tax_rate: Number(raw.tax_rate), fixed_capital_rate: Number(raw.fixed_capital_rate), working_capital_rate: Number(raw.working_capital_rate),
      starting_sales: fundBySym.get(raw.symbol as string) ?? null,
      sector: sectorBySym.get(raw.symbol as string) ?? null,
    };

    if (row.starting_sales == null || !(row.shares > 0)) {
      skippedNoRevenue++;
      continue;
    }

    const creditSpread = deriveCreditSpread(row);
    const waccOld = assembleWacc({ riskFree: RISKFREE_DAMODARAN, erp: ERP, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const waccNew = assembleWacc({ riskFree: RISKFREE_FRED, erp: ERP, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const reconstructionErrorBp = Math.abs(waccOld.wacc - row.wacc) * 10000;

    const drivers: RevDcfDrivers = {
      startingSales: row.starting_sales, salesGrowth: row.sales_growth, operatingMargin: row.operating_margin,
      startingMargin: row.starting_margin, taxRate: row.tax_rate, fixedCapitalRate: row.fixed_capital_rate, workingCapitalRate: row.working_capital_rate,
    };
    const marketOld: RevDcfMarket = { wacc: waccOld.wacc, inflation: 0.025, sharePrice: row.share_price, sharesOutstanding: row.shares, debt: row.debt, nonOperatingAssets: row.non_operating_assets };
    const marketNew: RevDcfMarket = { ...marketOld, wacc: waccNew.wacc };

    const verdictOld = runRevDcf(drivers, marketOld, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict;
    const verdictNew = runRevDcf(drivers, marketNew, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict;
    const kOld = kind(verdictOld), kNew = kind(verdictNew);
    const kindChanged = kOld !== kNew;

    results.push({
      symbol: row.symbol, sector: row.sector, deRatio: row.de_ratio, storedVerdictKind: row.verdict,
      waccOld: waccOld.wacc, waccNew: waccNew.wacc, waccDeltaBp: (waccNew.wacc - waccOld.wacc) * 10000,
      verdictOldKind: kOld, verdictNewKind: kNew, kindChanged, transition: kindChanged ? `${kOld}→${kNew}` : null,
      reconstructionErrorBp, skippedNoRevenue: false,
    });
  }

  console.log(`재현오차>1bp 건수: ${results.filter((r) => r.reconstructionErrorBp > 1).length}/${results.length}`);
  console.log(`revenue없어 스킵: ${skippedNoRevenue}건`);

  const waccDeltas = results.map((r) => r.waccDeltaBp);
  const kindChangedResults = results.filter((r) => r.kindChanged);
  const transitionCounts: Record<string, number> = {};
  for (const r of kindChangedResults) transitionCounts[r.transition!] = (transitionCounts[r.transition!] ?? 0) + 1;

  // 1-3: 섹터별·부채수준별
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
    universeAsOf: latestAsOf.as_of,
    totalRows: rows.length,
    computable: computable.length,
    skippedNoRevenue,
    analyzed: results.length,
    reconstructionCheck: { maxErrorBp: Math.max(...results.map((r) => r.reconstructionErrorBp)), errorsOver1bp: results.filter((r) => r.reconstructionErrorBp > 1).length },
    waccDeltaBpStats: stats(waccDeltas),
    kindChanged: { count: kindChangedResults.length, total: results.length, pct: +((kindChangedResults.length / results.length) * 100).toFixed(1) },
    transitionMatrix: transitionCounts,
    comparisonToStep999Sample: { sampleN: 20, sampleKindChangedPct: 5, fullN: results.length, fullKindChangedPct: +((kindChangedResults.length / results.length) * 100).toFixed(1) },
    bySector,
    byDebtQuartile: debtQuartiles,
  };

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));

  // 상세 결과는 별도 라인으로(카테고리 전환된 것만, 지면 절약)
  console.log("\n=== KIND-CHANGED DETAIL ===");
  console.log(JSON.stringify(kindChangedResults, null, 2));
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
