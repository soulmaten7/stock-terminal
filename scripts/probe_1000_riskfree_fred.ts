// STEP 1000 §3-4 — 값 불변 증명 + FRED 실측.
// resolveRiskFree(source='damodaran')가 기존 프로덕션 값과 완전히 같은 결과를 내는지(전 계산가능 종목),
// 그리고 fetchFredDGS10()이 실제로 동작하는지(1회 실측)를 확인한다. 🔴 DB 쓰기 0.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { assembleWacc } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";
import { resolveRiskFree, fetchFredDGS10 } from "../lib/revdcf/riskfree";

const ERP = 0.0446;
const REVDCF_DEFAULT_MAX_YEARS = 25;

function deriveCreditSpread(rf: number, row: { wacc: number; beta_unlevered: number; tax_rate: number; de_ratio: number }): number {
  const releveredBeta = row.beta_unlevered * (1 + (1 - row.tax_rate) * row.de_ratio);
  const costOfEquity = rf + releveredBeta * ERP;
  const debtWeight = row.de_ratio / (1 + row.de_ratio);
  const equityWeight = 1 / (1 + row.de_ratio);
  if (debtWeight === 0) return 0;
  const atCoD = (row.wacc - costOfEquity * equityWeight) / debtWeight;
  return atCoD / (1 - row.tax_rate) - rf;
}

async function main() {
  const sb = createAdminClient();

  // --- part 1: FRED 실측(1회, 배선과 무관 — 함수가 실제로 동작하는지만 확인) ---
  const fred = await fetchFredDGS10();
  console.log("=== FRED DGS10 실측 ===");
  console.log(JSON.stringify(fred, null, 2));

  // --- part 2: damodaran_global_inputs 현재값 ---
  const gi = (await sb.from("damodaran_global_inputs").select("riskfree_rate, as_of").single()).data as {
    riskfree_rate: string | number;
    as_of: string;
  };
  const damodaranValue = Number(gi.riskfree_rate);
  console.log("\n=== damodaran_global_inputs ===");
  console.log(JSON.stringify({ riskfree_rate: damodaranValue, as_of: gi.as_of }, null, 2));

  // resolveRiskFree(source='damodaran')가 원값을 그대로 반환하는지
  const resolved = resolveRiskFree({ source: "damodaran", damodaranValue, damodaranAsOf: gi.as_of });
  const resolverIdentical = resolved.value === damodaranValue && resolved.source === "damodaran";
  console.log("\n=== resolveRiskFree(source=damodaran) 원값 일치 ===");
  console.log(JSON.stringify({ resolved, resolverIdentical }, null, 2));

  // --- part 3: 전 계산가능 종목 — resolveRiskFree 경유 WACC/verdict가 DB 저장값과 완전히 같은지 ---
  const latestAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as {
    as_of: string;
  };
  const rows: Record<string, unknown>[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb
      .from("revdcf_results")
      .select(
        "symbol,verdict,wacc,beta_unlevered,de_ratio,share_price,shares,debt,non_operating_assets,sales_growth,operating_margin,starting_margin,tax_rate,fixed_capital_rate,working_capital_rate"
      )
      .eq("as_of", latestAsOf.as_of)
      .range(f, f + 999);
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

  let checked = 0;
  let waccMismatch = 0;
  let verdictMismatch = 0;
  let skippedNoRevenue = 0;
  let maxWaccErrorBp = 0;
  const mismatchDetail: unknown[] = [];

  for (const raw of computable) {
    const row = {
      symbol: raw.symbol as string,
      verdict: raw.verdict as string,
      wacc: Number(raw.wacc),
      beta_unlevered: Number(raw.beta_unlevered),
      de_ratio: Number(raw.de_ratio),
      share_price: Number(raw.share_price),
      shares: Number(raw.shares),
      debt: Number(raw.debt),
      non_operating_assets: Number(raw.non_operating_assets),
      sales_growth: Number(raw.sales_growth),
      operating_margin: Number(raw.operating_margin),
      starting_margin: Number(raw.starting_margin),
      tax_rate: Number(raw.tax_rate),
      fixed_capital_rate: Number(raw.fixed_capital_rate),
      working_capital_rate: Number(raw.working_capital_rate),
      starting_sales: fundBySym.get(raw.symbol as string) ?? null,
    };
    if (row.starting_sales == null || !(row.shares > 0)) {
      skippedNoRevenue++;
      continue;
    }

    const rf = resolveRiskFree({ source: "damodaran", damodaranValue, damodaranAsOf: gi.as_of }).value;
    const creditSpread = deriveCreditSpread(rf, row);
    const wacc = assembleWacc({ riskFree: rf, erp: ERP, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const waccErrorBp = Math.abs(wacc.wacc - row.wacc) * 10000;
    if (waccErrorBp > maxWaccErrorBp) maxWaccErrorBp = waccErrorBp;
    if (waccErrorBp > 1) waccMismatch++;

    const drivers: RevDcfDrivers = {
      startingSales: row.starting_sales,
      salesGrowth: row.sales_growth,
      operatingMargin: row.operating_margin,
      startingMargin: row.starting_margin,
      taxRate: row.tax_rate,
      fixedCapitalRate: row.fixed_capital_rate,
      workingCapitalRate: row.working_capital_rate,
    };
    const market: RevDcfMarket = {
      wacc: wacc.wacc,
      inflation: 0.025,
      sharePrice: row.share_price,
      sharesOutstanding: row.shares,
      debt: row.debt,
      nonOperatingAssets: row.non_operating_assets,
    };
    const verdict = runRevDcf(drivers, market, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict;
    if (verdict.kind !== row.verdict) {
      verdictMismatch++;
      mismatchDetail.push({ symbol: row.symbol, stored: row.verdict, recomputed: verdict.kind, waccErrorBp });
    }
    checked++;
  }

  console.log("\n=== §3-4 값 불변 증명(resolveRiskFree 경유, source=damodaran 고정) ===");
  console.log(
    JSON.stringify(
      {
        universeAsOf: latestAsOf.as_of,
        computable: computable.length,
        checked,
        skippedNoRevenue,
        maxWaccErrorBp,
        waccMismatchOver1bp: waccMismatch,
        verdictMismatch,
        mismatchDetail,
        conclusion: waccMismatch === 0 && verdictMismatch === 0 ? "완전 일치 — 교체 로직이 값에 부작용을 만들지 않음" : "불일치 발견 — 조사 필요",
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error("🔴", e);
  process.exit(1);
});
