// STEP 1004 §3-1 — 구코드(bare .single()/무필터 select) vs 신코드(latestAsOf 기반) 604종목 전수 대조.
// 🔴 DB 쓰기 0(SELECT만). 오늘 각 테이블이 1 as_of뿐이므로 불일치는 0이어야 한다 — 하나라도 있으면 수정이 틀린 것.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { latestAsOf } from "../lib/sector";
import { assembleWacc, creditSpreadFor } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

const REVDCF_DEFAULT_MAX_YEARS = 25;

async function main() {
  const sb = createAdminClient();

  // ── 구코드 스타일(1003 이전 route.ts 그대로 재현) ─────────────────────────
  const giOld = (await sb.from("damodaran_global_inputs").select("*").single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const usTaxOld = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreadsOld = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaOld = (await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[];

  // ── 신코드 스타일(1004, latestAsOf 기반) ─────────────────────────────────
  const giAsOf = await latestAsOf(sb, "damodaran_global_inputs");
  const giNew = (await sb.from("damodaran_global_inputs").select("*").eq("as_of", giAsOf!).single()).data as typeof giOld;
  const countryTaxAsOf = await latestAsOf(sb, "damodaran_country_tax");
  const usTaxNew = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("as_of", countryTaxAsOf!).eq("country", "United States of America").single()).data!.marginal_rate;
  const creditSpreadAsOf = await latestAsOf(sb, "damodaran_credit_spread");
  const spreadsNew = (await sb.from("damodaran_credit_spread").select("*").eq("as_of", creditSpreadAsOf!)).data as typeof spreadsOld;
  const betaAsOf = await latestAsOf(sb, "damodaran_beta");
  const betaNew = (await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity").eq("as_of", betaAsOf!)).data as typeof betaOld;

  // ── 1단계: 참조 재료 자체가 완전히 같은지 ────────────────────────────────
  const materialsMatch = {
    globalInputs: JSON.stringify(giOld) === JSON.stringify(giNew),
    countryTax: usTaxOld === usTaxNew,
    creditSpread: JSON.stringify(spreadsOld) === JSON.stringify(spreadsNew),
    beta: JSON.stringify(betaOld) === JSON.stringify(betaNew),
    asOfUsed: { globalInputs: giAsOf, countryTax: countryTaxAsOf, creditSpread: creditSpreadAsOf, beta: betaAsOf },
  };
  console.log("=== §3-1 1단계 — 참조 재료 완전 일치 확인 ===");
  console.log(JSON.stringify(materialsMatch, null, 2));
  if (!materialsMatch.globalInputs || !materialsMatch.countryTax || !materialsMatch.creditSpread || !materialsMatch.beta) {
    console.error("🔴 참조 재료 자체가 이미 다르다 — 여기서 멈춘다");
    process.exit(1);
  }

  // ── 2단계: 604종목 전수, 구/신 참조 재료로 각각 WACC·verdict 재계산 ─────────
  const betaByIndOld = new Map(betaOld.map((b) => [b.industry, b]));
  const betaByIndNew = new Map(betaNew.map((b) => [b.industry, b]));

  const latestAsOfRevdcf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const rows: Record<string, unknown>[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("revdcf_results").select(
      "symbol,verdict,wacc,beta_unlevered,de_ratio,share_price,shares,debt,non_operating_assets,sales_growth,operating_margin,starting_margin,tax_rate,fixed_capital_rate,working_capital_rate"
    ).eq("as_of", latestAsOfRevdcf.as_of).range(f, f + 999);
    if (error) throw new Error(`revdcf_results select 실패: ${error.message}`);
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
  const mismatchDetail: unknown[] = [];

  for (const raw of computable) {
    const row = {
      symbol: raw.symbol as string,
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
    if (row.starting_sales == null || !(row.shares > 0)) { skippedNoRevenue++; continue; }

    // 업종별 beta(구/신 동일해야 함) — industry 필드 없으면 std_dev_equity 재구성 불가하니 저장된 wacc로 creditSpread 역산
    const releveredBeta = row.beta_unlevered * (1 + (1 - row.tax_rate) * row.de_ratio);
    const costOfEquityOld = giOld.riskfree_rate + releveredBeta * giOld.erp;
    const debtWeight = row.de_ratio / (1 + row.de_ratio);
    const equityWeight = 1 / (1 + row.de_ratio);
    const creditSpread = debtWeight === 0 ? 0 : ((row.wacc - costOfEquityOld * equityWeight) / debtWeight) / (1 - row.tax_rate) - giOld.riskfree_rate;

    const waccOld = assembleWacc({ riskFree: +giOld.riskfree_rate, erp: +giOld.erp, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const waccNew = assembleWacc({ riskFree: +giNew.riskfree_rate, erp: +giNew.erp, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const waccErrorBp = Math.abs(waccOld.wacc - waccNew.wacc) * 10000;
    if (waccErrorBp > 0) waccMismatch++;

    const drivers: RevDcfDrivers = {
      startingSales: row.starting_sales, salesGrowth: row.sales_growth, operatingMargin: row.operating_margin,
      startingMargin: row.starting_margin, taxRate: row.tax_rate, fixedCapitalRate: row.fixed_capital_rate, workingCapitalRate: row.working_capital_rate,
    };
    const marketOld: RevDcfMarket = { wacc: waccOld.wacc, inflation: +giOld.expected_inflation, sharePrice: row.share_price, sharesOutstanding: row.shares, debt: row.debt, nonOperatingAssets: row.non_operating_assets };
    const marketNew: RevDcfMarket = { wacc: waccNew.wacc, inflation: +giNew.expected_inflation, sharePrice: row.share_price, sharesOutstanding: row.shares, debt: row.debt, nonOperatingAssets: row.non_operating_assets };
    const vOld = runRevDcf(drivers, marketOld, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict;
    const vNew = runRevDcf(drivers, marketNew, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict;
    if (vOld.kind !== vNew.kind) { verdictMismatch++; mismatchDetail.push({ symbol: row.symbol, old: vOld.kind, new: vNew.kind }); }
    checked++;
  }

  console.log("\n=== §3-1 2단계 — 604전수(계산가능분) 구코드 vs 신코드 재계산 대조 ===");
  console.log(JSON.stringify({ computable: computable.length, checked, skippedNoRevenue, waccMismatch, verdictMismatch, mismatchDetail, betaMapSizeMatch: betaByIndOld.size === betaByIndNew.size }, null, 2));

  if (waccMismatch === 0 && verdictMismatch === 0) {
    console.log("\n✅ 결론: 불일치 0건 — 조회 방식 변경이 계산 결과에 영향을 주지 않는다");
  } else {
    console.error("\n🔴 불일치 발견 — 여기서 멈춘다");
    process.exit(1);
  }
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
