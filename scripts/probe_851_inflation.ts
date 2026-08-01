// STEP 851 §7-1 — inflation 3안(0 / 0.016 / 0.025) GAP 분포 비교.
// companyfacts 1회 페치→per-cik 입력 캐시(docs/probe_851_cache.json)→3 inflation 엔진 재실행(SEC 없이 즉시).
// 실행: node? 아니오 → npx tsx scripts/probe_851_inflation.ts [--fetch]
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers } from "../lib/revdcf/engine";

const CACHE = "docs/probe_851_cache.json";
const UA = process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const wall = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);
const q = (a: number[], p: number) => { const s = a.slice().sort((x, y) => x - y); return s.length ? +s[Math.floor((s.length - 1) * p)].toFixed(1) : null; };

type Cached = { drivers: RevDcfDrivers; wacc: number; sharePrice: number; shares: number; debt: number; nonOp: number };

async function main() {
  const sb = createAdminClient();
  let cache: Record<string, Cached | { skip: string }> = {};
  if (fs.existsSync(CACHE)) cache = JSON.parse(fs.readFileSync(CACHE, "utf8"));

  if (process.argv.includes("--fetch") || Object.keys(cache).length === 0) {
    const ciks: number[] = JSON.parse(fs.readFileSync("/tmp/847_ciks.json", "utf8"));
    const surv = JSON.parse(fs.readFileSync("docs/probe_survivors.json", "utf8")) as { cik: number; symbol: string }[];
    const symByCik = new Map(surv.map((s) => [s.cik, s.symbol]));
    const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { riskfree_rate: number; erp: number };
    const rf = +gi.riskfree_rate, erp = +gi.erp;
    const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
    const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
    const betaByInd = new Map(((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[]).map((b) => [b.industry, b]));
    const indRows: { ticker_norm: string; industry_group: string }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("damodaran_industry").select("ticker_norm, industry_group").eq("is_us_listed", true).range(f, f + 999); const c = (data ?? []) as typeof indRows; indRows.push(...c); if (c.length < 1000) break; }
    const indByT = new Map(indRows.map((r) => [r.ticker_norm, r.industry_group]));
    const mcapRows: { symbol: string; market_cap: number }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
    const mcapBy = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), +r.market_cap]));
    const todo = ciks.filter((c) => !cache[c]);
    let n = 0;
    for (const cik of todo) {
      const sym = symByCik.get(cik);
      try {
        const r = await wall(fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) }), 30000);
        await sleep(120);
        if (!r.ok) { cache[cik] = { skip: "http" }; }
        else {
          const j = await wall(r.json(), 30000) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
          const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
          const ind = sym ? indByT.get(sym.toUpperCase()) : undefined; const beta = ind ? betaByInd.get(ind) : undefined; const mc = sym ? mcapBy.get(sym.toUpperCase()) : undefined;
          if (!dr.ok || !beta || !mc) { cache[cik] = { skip: !dr.ok ? dr.skipReason : !beta ? "ind" : "mcap" }; }
          else {
            const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio: dr.market.debt / mc, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
            cache[cik] = { drivers: { ...dr.drivers, taxRate: usTax }, wacc: w.wacc, sharePrice: mc / dr.market.shares, shares: dr.market.shares, debt: dr.market.debt, nonOp: dr.market.nonOperatingAssets };
          }
        }
      } catch { cache[cik] = { skip: "ex" }; }
      n++; if (n % 50 === 0) { fs.writeFileSync(CACHE, JSON.stringify(cache)); process.stderr.write(`\r${n}/${todo.length}`); }
    }
    fs.writeFileSync(CACHE, JSON.stringify(cache));
    process.stderr.write(`\nfetch 완료 ${Object.keys(cache).length}\n`);
  }

  const calc = Object.values(cache).filter((v): v is Cached => !("skip" in v));
  const out: Record<string, unknown> = { calculated: calc.length };
  for (const i of [0, 0.016, 0.025]) {
    const dist: Record<string, number> = { years: 0, below_one: 0, over_cap: 0, value_destroying: 0, invalid: 0 };
    const gaps: number[] = [];
    for (const c of calc) {
      const v = runRevDcf(c.drivers, { wacc: c.wacc, inflation: i, sharePrice: c.sharePrice, sharesOutstanding: c.shares, debt: c.debt, nonOperatingAssets: c.nonOp }, { maxYears: 100 }).verdict;
      dist[v.kind]++; if (v.kind === "years") gaps.push(v.gap);
    }
    out[`i=${i}`] = { dist, gap: { median: q(gaps, 0.5), p90: q(gaps, 0.9), n: gaps.length } };
  }
  fs.writeFileSync("docs/probe_851_inflation.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
