// STEP 940 — 나스닥 스크리너 + SPDR holdings 로컬 원본(939 보존)을 Postgres로 적재.
// 🔴 재취득하지 않는다 — 939가 저장한 스냅샷과 DB가 일치해야 한다(로컬 원본만 읽는다).
// 실행: npx tsx scripts/ingest_us_sector.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";

const NASDAQ_FILE = "data/sources/nasdaq/nasdaq_screener_20260808.json";
const SPDR_FILE = "data/sources/spdr/spdr_sector_holdings_2026-08-06.json";
const NASDAQ_AS_OF = "2026-08-08"; // 취득일(registry.ts asOfPolicy — 나스닥은 기준일을 안 줌)

// ⓙ 판정(2026-08-08 장은태): E-mini 섹터 선물 11 + CONTRA 1 = 12건 제외. ECHO/FDXF/HONA/MRSH는 실회사라 제외 대상 아님(Damodaran 미등재일 뿐).
const SPDR_EXCLUDE_TICKERS = new Set([
  "IXTU6", "IXAU6", "IXCU6", "IXPU6", "IXIU6", "IXYU6", "IXRU6", "IXSU6", "IXDU6", "XARU6", "XASU6", // E-mini 섹터 선물 11개
  "2602335D", // CONTRA HOLOGIC INCORPO
]);

async function upsert(sb: ReturnType<typeof createAdminClient>, table: string, rows: Record<string, unknown>[], onConflict: string) {
  if (rows.length === 0) return 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + 1000), { onConflict });
    if (error) throw new Error(`${table} batch@${i}: ${error.message}`);
  }
  return rows.length;
}

async function main() {
  const sb = createAdminClient();

  // ── 나스닥 ────────────────────────────────────────────────────────────
  const nasdaq = JSON.parse(fs.readFileSync(NASDAQ_FILE, "utf8")) as {
    _meta: { rows: number };
    data: { symbol: string; sector: string; industry: string; country: string; ipoyear: string; marketCap: string }[];
  };
  const nasdaqRows = nasdaq.data.map((r) => ({
    as_of: NASDAQ_AS_OF,
    symbol: r.symbol,
    sector: r.sector || null, // 빈 문자열 → null
    industry: r.industry || null,
    country: r.country || null,
    ipo_year: r.ipoyear || null,
    market_cap: r.marketCap ? Number(r.marketCap) : null,
  }));
  const nasdaqEmptySector = nasdaq.data.filter((r) => !r.sector).length;
  const nasdaqInserted = await upsert(sb, "us_sector_nasdaq", nasdaqRows, "as_of,symbol");
  console.log(`✓ us_sector_nasdaq: 원본 ${nasdaq._meta.rows}행 · 적재 ${nasdaqInserted}행 · 빈 sector→null ${nasdaqEmptySector}건`);
  if (nasdaqInserted !== nasdaq._meta.rows) throw new Error(`나스닥 행수 불일치: 원본${nasdaq._meta.rows} vs 적재${nasdaqInserted}`);

  // ── SPDR ──────────────────────────────────────────────────────────────
  const spdr = JSON.parse(fs.readFileSync(SPDR_FILE, "utf8")) as {
    _meta: { asOf: string; rows: number };
    data: { ticker: string; name: string; etf: string; sector: string }[];
  };
  const spdrExcluded = spdr.data.filter((r) => SPDR_EXCLUDE_TICKERS.has(r.ticker));
  const spdrKept = spdr.data.filter((r) => !SPDR_EXCLUDE_TICKERS.has(r.ticker));
  const spdrRows = spdrKept.map((r) => ({ as_of: spdr._meta.asOf, symbol: r.ticker, sector: r.sector, etf: r.etf }));
  const spdrInserted = await upsert(sb, "us_sector_gics", spdrRows, "as_of,symbol");
  console.log(`✓ us_sector_gics: 원본 ${spdr._meta.rows}행 · ⓙ 제외 ${spdrExcluded.length}건 · 적재 ${spdrInserted}행`);
  console.log(`  제외 목록(ⓙ 판정): ${spdrExcluded.map((r) => `${r.ticker}(${r.name.trim()})`).join(" · ")}`);
  if (spdrInserted !== spdr._meta.rows - spdrExcluded.length) throw new Error("SPDR 행수 불일치");
  if (spdrExcluded.length !== SPDR_EXCLUDE_TICKERS.size) console.warn(`🔴 ⓙ 제외 목록 12건 중 ${spdrExcluded.length}건만 매치 — 확인 필요`);

  console.log("\n완료");
}

main().catch((e) => { console.error("🔴", e.message); process.exit(1); });
