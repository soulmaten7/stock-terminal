// STEP 1054 §2-1 — 부족분(모집단−캐시) 4,653건 SEC companyfacts 전수 수집.
// 실측 타이밍(probe_1054_population.ts) 기준 예상 ~35분·~6.1GB. DB 쓰기 0.
// 150ms 간격 순차·429 시 즉시 중단(963과 동일 규약).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";

const CACHE_DIR = "docs/probe_951_cache";
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

async function main() {
  const sb = createAdminClient();
  const rows = await fetchAllRows<{ symbol: string; cik: number }>(
    () => sb.from("us_fundamentals").select("symbol, cik"),
    [{ column: "symbol" }]
  );
  const population = rows.filter((r) => r.cik != null);
  const already = new Set(fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
  const toFetch = population.filter((r) => !already.has(r.symbol));
  console.log(`부족분 ${toFetch.length}건 수집 시작 (${new Date().toISOString()})`);

  let fetched = 0, rateLimited = false;
  const errors: { symbol: string; err: string }[] = [];
  const start = Date.now();
  for (let i = 0; i < toFetch.length; i++) {
    const { symbol, cik } = toFetch[i];
    if (rateLimited) break;
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`;
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (res.status === 429) { console.log(`429 at ${symbol} — 중단`); rateLimited = true; errors.push({ symbol, err: "429" }); break; }
      if (!res.ok) { errors.push({ symbol, err: `HTTP_${res.status}` }); await new Promise((r) => setTimeout(r, 150)); continue; }
      const buf = await res.arrayBuffer();
      fs.writeFileSync(`${CACHE_DIR}/${symbol}.json`, Buffer.from(buf));
      fetched++;
    } catch (e) {
      errors.push({ symbol, err: String((e as Error).message).slice(0, 80) });
    }
    if ((i + 1) % 200 === 0) {
      const elapsed = (Date.now() - start) / 1000;
      console.log(`진행 ${i + 1}/${toFetch.length}, 확보 ${fetched}, 오류 ${errors.length}, 경과 ${elapsed.toFixed(0)}초`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  const totalSec = (Date.now() - start) / 1000;
  console.log(`완료: 신규확보 ${fetched}건, 오류 ${errors.length}건, 429중단=${rateLimited}, 총소요 ${totalSec.toFixed(0)}초`);
  fs.writeFileSync(
    "docs/probe_1054_fetch_log.json",
    JSON.stringify({ total: toFetch.length, fetched, errors, rateLimited, totalSec }, null, 2)
  );
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
