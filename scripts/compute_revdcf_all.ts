// STEP 850 — 역DCF 전 종목(604) 배치: companyfacts → driver → 업종 → WACC 조립 → 3점 GAP → revdcf_results.
// 실행: npx tsx scripts/compute_revdcf_all.ts [batch=60]   (매일 크론 전제 · 재실행 안전 · as_of로 쌓음)
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "../lib/revdcf/compute";
import type { RevDcfMarket, RevDcfVerdict } from "../lib/revdcf/engine";
import { fetchSectorMap, latestAsOf } from "../lib/sector";

const UA = process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app";
const BATCH = Number(process.argv[2] || 60);
const PROG = "/tmp/850_progress.txt";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const wall = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);
// 결정론 as_of: 파일 mtime 아님·오늘 날짜(크론). new Date는 스크립트 컨텍스트라 허용.
// 🔴 STEP 859: 재계산을 새 as_of로 쌓을 때 REVDCF_AS_OF로 덮어쓸 수 있게(과거 행 보존·§1.2). 미지정 시 UTC 오늘.
const AS_OF = process.env.REVDCF_AS_OF || new Date().toISOString().slice(0, 10);

async function main() {
  const sb = createAdminClient();
  const ciks: number[] = JSON.parse(fs.readFileSync("/tmp/847_ciks.json", "utf8"));
  const surv = JSON.parse(fs.readFileSync("docs/probe_survivors.json", "utf8")) as { cik: number; symbol: string }[];
  const symByCik = new Map(surv.map((s) => [s.cik, s.symbol]));

  // 참조 데이터 (DB · 값 코드에 안 박음) — STEP1004: route.ts와 동일하게 최신 as_of로 먼저 좁힘(패턴 통일)
  const giAsOf = await latestAsOf(sb, "damodaran_global_inputs");
  if (!giAsOf) throw new Error("damodaran_global_inputs: as_of 없음(빈 테이블)");
  const gi = (await sb.from("damodaran_global_inputs").select("*").eq("as_of", giAsOf).single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const rf = Number(gi.riskfree_rate), erp = Number(gi.erp), inflation = Number(gi.expected_inflation), damoAsOf = gi.as_of;
  const countryTaxAsOf = await latestAsOf(sb, "damodaran_country_tax");
  if (!countryTaxAsOf) throw new Error("damodaran_country_tax: as_of 없음(빈 테이블)");
  const usTax = Number((await sb.from("damodaran_country_tax").select("marginal_rate").eq("as_of", countryTaxAsOf).eq("country", "United States of America").single()).data!.marginal_rate);
  const creditSpreadAsOf = await latestAsOf(sb, "damodaran_credit_spread");
  const spreads = creditSpreadAsOf
    ? ((await sb.from("damodaran_credit_spread").select("*").eq("as_of", creditSpreadAsOf)).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[])
    : [];
  const betaAsOf = await latestAsOf(sb, "damodaran_beta");
  const betaRows = betaAsOf
    ? ((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity").eq("as_of", betaAsOf)).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[])
    : [];
  const betaByInd = new Map(betaRows.map((b) => [b.industry, b]));
  const { byTicker: indByTicker } = await fetchSectorMap(sb, { field: "industryGroup", source: "damodaran" });
  const mcapRows: { symbol: string; market_cap: number }[] = [];
  for (let from = 0; ; from += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").range(from, from + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapBySym = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), Number(r.market_cap)]));

  // resumable: 오늘 as_of로 이미 저장된 cik 스킵
  const done = new Set<number>();
  for (let from = 0; ; from += 1000) { const { data } = await sb.from("revdcf_results").select("cik").eq("as_of", AS_OF).range(from, from + 999); const c = (data ?? []) as { cik: number }[]; for (const r of c) done.add(r.cik); if (c.length < 1000) break; }
  const todo = ciks.filter((c) => !done.has(c));
  fs.writeFileSync(PROG, `시작 ${AS_OF} 남은 ${todo.length}/${ciks.length} (rf=${rf} erp=${erp} i=${inflation} tax=${usTax})\n`);

  const verdictCols = (v: RevDcfVerdict) => ({
    verdict: v.kind, gap_years: v.kind === "years" ? v.gap : null, explained_pct: v.kind === "over_cap" ? v.explainedPct : null,
  });

  let n = 0, saved = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    const rows: Record<string, unknown>[] = [];
    for (const cik of chunk) {
      const symbol = symByCik.get(cik) ?? null;
      const base: Record<string, unknown> = { as_of: AS_OF, cik, symbol, verdict: "skipped", flags: {}, skip_reason: null };
      try {
        const r = await wall(fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) }), 30000);
        await sleep(120);
        if (!r.ok) { rows.push({ ...base, skip_reason: `HTTP_${r.status}`, flags: { httpErr: r.status } }); n++; continue; }
        const j = await wall(r.json(), 30000) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
        const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
        if (!dr.ok) { rows.push({ ...base, skip_reason: dr.skipReason, flags: { ...dr.flags, damodaranAsOf: damoAsOf } }); n++; continue; }
        // 업종·시총
        const ind = symbol ? indByTicker.get(symbol.toUpperCase()) : undefined;
        const beta = ind ? betaByInd.get(ind) : undefined;
        const mcap = symbol ? mcapBySym.get(symbol.toUpperCase()) : undefined;
        if (!ind || !beta) { rows.push({ ...base, skip_reason: "NO_INDUSTRY", flags: { ...dr.flags, symbol, damodaranAsOf: damoAsOf } }); n++; continue; }
        if (!mcap || !(mcap > 0)) { rows.push({ ...base, skip_reason: "NO_MARKETCAP", flags: { ...dr.flags, industry: ind, damodaranAsOf: damoAsOf } }); n++; continue; }
        const deRatio = dr.market.debt / mcap;
        const spread = creditSpreadFor(Number(beta.std_dev_equity), spreads) ?? 0;
        const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: Number(beta.unlevered_beta_cash_adj), taxRate: usTax, deRatio, creditSpread: spread });
        const sharePrice = mcap / dr.market.shares;
        const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
        // 기본(primary) = level 자본집약도 (dr.drivers.fixedCapitalRate = level)
        // 🔴 STEP 859: 원전 T8 지평 = 25년(PIE C31). over_cap = 원전 "25+"(25년 가치<주가). gnum 100은 band 인코딩 센티넬(연차 아님).
        const sens = computeGapWithSensitivity({ ...dr.drivers, taxRate: usTax }, market, { maxYears: 25 });
        const runRevDcf = (await import("../lib/revdcf/engine")).runRevDcf;
        const eng = runRevDcf({ ...dr.drivers, taxRate: usTax }, market, { maxYears: 25 });
        const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : v.kind === "below_one" ? 0 : v.kind === "over_cap" ? 100 : null);
        // 852: 한계형 자본집약도로도 판정(갈림 노출)
        let verdictMarginal: string | null = null, gapMarginal: number | null = null;
        if (dr.drivers.fixedCapitalRateMarginal != null) {
          const vm = runRevDcf({ ...dr.drivers, taxRate: usTax, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal }, market, { maxYears: 25 }).verdict;
          verdictMarginal = vm.kind; gapMarginal = vm.kind === "years" ? vm.gap : null;
        }
        rows.push({
          ...base, ...verdictCols(sens.base),
          gap_wacc_minus1: gnum(sens.waccMinus1), gap_wacc_plus1: gnum(sens.waccPlus1),
          threshold_margin: eng.thresholdMargin, monotonic: eng.monotonic,
          sales_growth: dr.drivers.salesGrowth, operating_margin: dr.drivers.operatingMargin, starting_margin: dr.drivers.startingMargin,
          tax_rate: usTax, fixed_capital_rate: dr.drivers.fixedCapitalRate, working_capital_rate: dr.drivers.workingCapitalRate,
          fixed_capital_rate_level: dr.drivers.fixedCapitalRateLevel, fixed_capital_rate_marginal: dr.drivers.fixedCapitalRateMarginal,
          verdict_marginal: verdictMarginal, gap_years_marginal: gapMarginal,
          wacc: w.wacc, beta_unlevered: Number(beta.unlevered_beta_cash_adj), de_ratio: deRatio,
          debt: dr.market.debt, non_operating_assets: dr.market.nonOperatingAssets, shares: dr.market.shares, share_price: sharePrice,
          flags: { ...dr.flags, industry: ind, inflationUsed: inflation, damodaranAsOf: damoAsOf, marketCap: mcap },
        });
      } catch (e) { rows.push({ ...base, skip_reason: "EX", flags: { ex: String((e as Error).message).slice(0, 80) } }); }
      n++;
    }
    const { error } = await sb.from("revdcf_results").upsert(rows, { onConflict: "as_of,cik" });
    if (error) { fs.appendFileSync(PROG, `SAVE ERROR @${i}: ${error.message}\n`); throw error; }
    saved += rows.length;
    fs.appendFileSync(PROG, `batch ${i}-${i + chunk.length} 저장 ${rows.length} · 누적 ${saved}\n`);
  }
  fs.appendFileSync(PROG, `완료 처리 ${n} 저장 ${saved}\n`);
  console.log(`DONE as_of=${AS_OF} processed=${n} saved=${saved}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
