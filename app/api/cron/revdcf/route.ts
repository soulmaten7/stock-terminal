import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDrivers } from "@/lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "@/lib/revdcf/compute";
import { runRevDcf, type RevDcfMarket, type RevDcfVerdict } from "@/lib/revdcf/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// STEP 853 §5 — 역DCF 일일 배치 (Vercel 크론). 300s 예산 내 동시성으로 처리·시간 초과분은 다음 실행이 이어받음(resumable).
// 유니버스 = 직전 as_of의 CIK 집합(로컬 파일 의존 없음). 값 코드에 안 박음(damodaran_* DB).
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const BUDGET_MS = 270_000;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now();
  const sb = createAdminClient();
  const asOf = new Date().toISOString().slice(0, 10);

  // 유니버스 = 직전(최신) as_of의 CIK
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const prevAsOf = latest?.as_of;
  if (!prevAsOf) return NextResponse.json({ error: "no prior universe" }, { status: 400 });
  const univ: { cik: number; symbol: string | null }[] = [];
  for (let from = 0; ; from += 1000) { const { data } = await sb.from("revdcf_results").select("cik, symbol").eq("as_of", prevAsOf).range(from, from + 999); const c = (data ?? []) as typeof univ; univ.push(...c); if (c.length < 1000) break; }
  const done = new Set<number>();
  if (prevAsOf === asOf) { /* 같은 날 재실행 = 전량 재계산이 아니라 이어받기: 이미 오늘 계산된 것 스킵 불가(덮어쓰기). 다른 날이면 today 스킵셋 사용. */ }
  else { for (let from = 0; ; from += 1000) { const { data } = await sb.from("revdcf_results").select("cik").eq("as_of", asOf).range(from, from + 999); const c = (data ?? []) as { cik: number }[]; for (const r of c) done.add(r.cik); if (c.length < 1000) break; } }
  const todo = univ.filter((u) => !done.has(u.cik));

  // 참조 데이터
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const rf = +gi.riskfree_rate, erp = +gi.erp, inflation = +gi.expected_inflation, damoAsOf = gi.as_of;
  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaByInd = new Map(((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[]).map((b) => [b.industry, b]));
  const indRows: { ticker_norm: string; industry_group: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("damodaran_industry").select("ticker_norm, industry_group").eq("is_us_listed", true).range(f, f + 999); const c = (data ?? []) as typeof indRows; indRows.push(...c); if (c.length < 1000) break; }
  const indByT = new Map(indRows.map((r) => [r.ticker_norm, r.industry_group]));
  const mcapRows: { symbol: string; market_cap: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapBy = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), +r.market_cap]));

  let lastCall = 0;
  const throttle = async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };
  const wall = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);
  const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : v.kind === "below_one" ? 0 : v.kind === "over_cap" ? 100 : null);

  async function processOne(u: { cik: number; symbol: string | null }): Promise<Record<string, unknown>> {
    const symbol = u.symbol; const base: Record<string, unknown> = { as_of: asOf, cik: u.cik, symbol, verdict: "skipped", flags: {}, skip_reason: null };
    try {
      await throttle();
      const r = await wall(fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(u.cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) }), 25000);
      if (!r.ok) return { ...base, skip_reason: `HTTP_${r.status}` };
      const j = (await wall(r.json(), 20000)) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
      const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
      if (!dr.ok) return { ...base, skip_reason: dr.skipReason, flags: { ...dr.flags, damodaranAsOf: damoAsOf } };
      const ind = symbol ? indByT.get(symbol.toUpperCase()) : undefined; const beta = ind ? betaByInd.get(ind) : undefined; const mcap = symbol ? mcapBy.get(symbol.toUpperCase()) : undefined;
      if (!ind || !beta) return { ...base, skip_reason: "NO_INDUSTRY", flags: { ...dr.flags, damodaranAsOf: damoAsOf } };
      if (!mcap || !(mcap > 0)) return { ...base, skip_reason: "NO_MARKETCAP", flags: { ...dr.flags, damodaranAsOf: damoAsOf } };
      const deRatio = dr.market.debt / mcap;
      const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
      const sharePrice = mcap / dr.market.shares;
      const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
      // 🔴 STEP 880: driver 5 ③판정 — 주 판정 = 원전식(marginal). level은 근거 부재로 내림(879).
      if (dr.drivers.fixedCapitalRateMarginal == null)
        return { ...base, skip_reason: "NO_MARGINAL_CAPEX", flags: { ...dr.flags, damodaranAsOf: damoAsOf } };
      const drv = { ...dr.drivers, taxRate: usTax, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal };
      // 🔴 STEP 859: 원전 T8 지평 = 25년(PIE C31 LOOKUP D27:AB27). over_cap = "25년 가치 < 주가"(원전 "25+"). 이전 100은 원전 이탈이었음.
      const sens = computeGapWithSensitivity(drv, market, { maxYears: 25 });
      const eng = runRevDcf(drv, market, { maxYears: 25 });
      let vm: string | null = null, gm: number | null = null;
      if (dr.drivers.fixedCapitalRateMarginal != null) { const m = runRevDcf({ ...drv, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal }, market, { maxYears: 25 }).verdict; vm = m.kind; gm = m.kind === "years" ? m.gap : null; }
      return {
        ...base, verdict: sens.base.kind, gap_years: sens.base.kind === "years" ? sens.base.gap : null, explained_pct: sens.base.kind === "over_cap" ? sens.base.explainedPct : null,
        gap_wacc_minus1: gnum(sens.waccMinus1), gap_wacc_plus1: gnum(sens.waccPlus1), threshold_margin: eng.thresholdMargin, monotonic: eng.monotonic,
        sales_growth: dr.drivers.salesGrowth, operating_margin: dr.drivers.operatingMargin, starting_margin: dr.drivers.startingMargin,
        tax_rate: usTax, fixed_capital_rate: drv.fixedCapitalRate, working_capital_rate: dr.drivers.workingCapitalRate,
        fixed_capital_rate_level: dr.drivers.fixedCapitalRateLevel, fixed_capital_rate_marginal: dr.drivers.fixedCapitalRateMarginal, verdict_marginal: vm, gap_years_marginal: gm,
        wacc: w.wacc, beta_unlevered: +beta.unlevered_beta_cash_adj, de_ratio: deRatio, debt: dr.market.debt, non_operating_assets: dr.market.nonOperatingAssets, shares: dr.market.shares, share_price: sharePrice,
        flags: { ...dr.flags, industry: ind, inflationUsed: inflation, damodaranAsOf: damoAsOf, marketCap: mcap },
      };
    } catch (e) { return { ...base, skip_reason: "EX", flags: { ex: String((e as Error).message).slice(0, 80) } }; }
  }

  // 시간 예산 내 동시성 6 워커풀
  let idx = 0, saved = 0;
  const buffer: Record<string, unknown>[] = [];
  const flush = async () => { if (!buffer.length) return; const batch = buffer.splice(0, buffer.length); const { error } = await sb.from("revdcf_results").upsert(batch, { onConflict: "as_of,cik" }); if (!error) saved += batch.length; };
  async function worker() { while (idx < todo.length && Date.now() - t0 < BUDGET_MS) { const u = todo[idx++]; buffer.push(await processOne(u)); if (buffer.length >= 40) await flush(); } }
  await Promise.all(Array.from({ length: 6 }, worker));
  await flush();

  const finished = idx >= todo.length;
  return NextResponse.json({ asOf, universe: univ.length, todoAtStart: todo.length, processed: idx, saved, finished, elapsedMs: Date.now() - t0 });
}
