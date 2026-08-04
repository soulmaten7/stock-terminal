// STEP 893 §3 — 오늘 TTL 필터 효과 = 0 확인(정직). 읽기 전용 · DB 쓰기 0 · 크론 실행 없음.
// 실행: npx tsx scripts/probe_893_ttl_effect.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { writeFileSync } from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";

const MCAP_TTL_DAYS = 7; // app/api/cron/revdcf/route.ts와 동일 상수(복제 — 그쪽이 정본)
const sb = createAdminClient();

async function readAll<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from(table).select(cols).range(from, from + 999);
    const c = (data ?? []) as T[];
    out.push(...c);
    if (c.length < 1000) break;
  }
  return out;
}

(async () => {
  const asOf = new Date().toISOString().slice(0, 10);
  const mcapCutoff = new Date(Date.now() - MCAP_TTL_DAYS * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const mcapAll = await readAll<{ symbol: string; market_cap: number; as_of: string }>("us_market_cap", "symbol, market_cap, as_of");
  const mcapBySym = new Map(mcapAll.map((r) => [r.symbol.toUpperCase(), r]));

  const latestAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const univ: { cik: number; symbol: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("revdcf_results").select("cik, symbol").eq("as_of", latestAsOf!.as_of).range(from, from + 999);
    const c = (data ?? []) as typeof univ;
    univ.push(...c);
    if (c.length < 1000) break;
  }

  let wouldSkipStale = 0, wouldSkipNoMarketcap = 0, ok = 0;
  const staleSymbols: { symbol: string; as_of: string; ageDays: number }[] = [];
  for (const u of univ) {
    const row = u.symbol ? mcapBySym.get(u.symbol.toUpperCase()) : undefined;
    if (!row || !(row.market_cap > 0)) { wouldSkipNoMarketcap++; continue; }
    if (row.as_of < mcapCutoff) {
      wouldSkipStale++;
      const ageDays = Math.round((Date.parse(asOf) - Date.parse(row.as_of)) / 86_400_000);
      staleSymbols.push({ symbol: u.symbol!, as_of: row.as_of, ageDays });
    } else ok++;
  }

  const out = {
    generatedAt: "2026-08-04 (STEP 893 §3)",
    asOf, mcapTtlDays: MCAP_TTL_DAYS, mcapCutoff,
    universeSize: univ.length,
    wouldSkipStale_STALE_MARKETCAP: wouldSkipStale,
    wouldSkipNoMarketcap_unchanged: wouldSkipNoMarketcap,
    okWithinTtl: ok,
    staleSymbolsDetail: staleSymbols,
    expectation: "wouldSkipStale는 0이어야 한다(현재 최고령 07-30 = 오늘 기준 4~5일, TTL 7일보다 짧음). 0이 아니면 필터가 의도보다 넓게 걸린 것 — 중단·보고 대상.",
    conclusion: wouldSkipStale === 0 ? "확인됨 — 오늘 스킵 0건. 이 변경은 오늘 아무것도 바꾸지 않는다(미래 방어)." : "🔴 경고 — 오늘 스킵이 0이 아니다. 적용을 재검토해야 한다.",
  };

  writeFileSync("docs/probe_893_ttl_effect.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();
