// STEP 963 §3 — 1,127종목 전량 SEC companyfacts 확보(캐시 우선). DB 쓰기 없음, 조회만.
// 🔴 150ms 간격·순차(동시성1, 상한2 이내)·429 시 즉시 중단.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";

const CACHE_DIR = "docs/probe_951_cache";
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

async function main() {
  const sb = createAdminClient();
  const val = await fetchAllRows<{ symbol: string }>(
    () => sb.from("us_valuation").select("symbol").eq("as_of", "2026-08-08"),
    [{ column: "symbol" }]
  );
  const cikRows = await fetchAllRows<{ symbol: string; cik: number }>(
    () => sb.from("us_cik_map").select("symbol, cik"),
    [{ column: "symbol" }]
  );
  const cikBySym = new Map(cikRows.map((r) => [r.symbol, r.cik]));
  const rows = val.map((v) => ({ symbol: v.symbol, cik: cikBySym.get(v.symbol) })).filter((r): r is { symbol: string; cik: number } => r.cik != null);

  console.log(`대상 ${rows.length}종목`);
  const already = new Set(fs.readdirSync(CACHE_DIR));
  const toFetch = rows.filter((r) => !already.has(`${r.symbol}.json`));
  console.log(`캐시 재사용 ${rows.length - toFetch.length}건, 신규 조회 ${toFetch.length}건`);

  let fetched = 0, rateLimited = false;
  const errors: { symbol: string; err: string }[] = [];
  for (const { symbol, cik } of toFetch) {
    if (rateLimited) break;
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`;
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
      if (res.status === 429) { console.log(`429 at ${symbol} — 중단`); rateLimited = true; errors.push({ symbol, err: "429" }); break; }
      if (!res.ok) { errors.push({ symbol, err: `HTTP_${res.status}` }); await new Promise((r) => setTimeout(r, 150)); continue; }
      const buf = await res.arrayBuffer();
      fs.writeFileSync(`${CACHE_DIR}/${symbol}.json`, Buffer.from(buf));
      fetched++;
    } catch (e) {
      errors.push({ symbol, err: String((e as Error).message).slice(0, 80) });
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log(`신규 확보 ${fetched}건, 오류 ${errors.length}건, 429중단=${rateLimited}`);
  fs.writeFileSync("/tmp/step963_fetch_log.json", JSON.stringify({ total: rows.length, alreadyCached: rows.length - toFetch.length, fetched, errors, rateLimited }, null, 2));
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
