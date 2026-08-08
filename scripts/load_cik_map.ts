// STEP 947 §1 — data/sources/sec/company_tickers_exchange_20260802.json → us_cik_map 적재.
// 🔴 재취득하지 않는다 — 이미 저장된 원본만 읽는다(⓪-3). 크론이 이 파일을 안 쓰므로 매일 필요한 스크립트가 아니다(수동).
// 실행: npx tsx scripts/load_cik_map.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";

const SOURCE_FILE = "data/sources/sec/company_tickers_exchange_20260802.json";
const AS_OF = "2026-08-02"; // 파일 취득일(파일 자체엔 기준일 필드 없음)

async function upsert(sb: ReturnType<typeof createAdminClient>, rows: Record<string, unknown>[]) {
  let saved = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const { error } = await sb.from("us_cik_map").upsert(rows.slice(i, i + 1000), { onConflict: "symbol" });
    if (error) throw new Error(`us_cik_map batch@${i}: ${error.message}`);
    saved += rows.slice(i, i + 1000).length;
  }
  return saved;
}

async function main() {
  const sb = createAdminClient();
  const raw = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8")) as { fields: string[]; data: (string | number)[][] };
  const fi = raw.fields.indexOf("cik"), ni = raw.fields.indexOf("name"), ti = raw.fields.indexOf("ticker"), ei = raw.fields.indexOf("exchange");
  if (fi < 0 || ni < 0 || ti < 0 || ei < 0) throw new Error(`fields 순서 예상과 다름: ${JSON.stringify(raw.fields)}`);

  // 중복 티커는 첫 등장 채택(원본 내 중복 존재 여부는 미확인 — 발생 시 여기서 카운트).
  const seen = new Set<string>();
  let dupes = 0;
  const rows: Record<string, unknown>[] = [];
  for (const r of raw.data) {
    const ticker = String(r[ti]);
    if (seen.has(ticker)) { dupes++; continue; }
    seen.add(ticker);
    rows.push({
      symbol: ticker,
      cik: Number(r[fi]),
      exchange: r[ei] ? String(r[ei]) : null,
      title: r[ni] ? String(r[ni]) : null,
      source: "sec:company_tickers_exchange",
      as_of: AS_OF,
    });
  }

  const saved = await upsert(sb, rows);
  console.log(`✓ us_cik_map: 원본 ${raw.data.length}행 · 중복 티커 제외 ${dupes}건 · 적재 ${saved}행 (as_of=${AS_OF})`);
  if (saved !== rows.length) throw new Error(`행수 불일치: 준비${rows.length} vs 적재${saved}`);
}

main().catch((e) => { console.error("🔴", e.message); process.exit(1); });
