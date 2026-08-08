// STEP 939 — 나스닥 스크리너 + SPDR 섹터 holdings 원본을 Supabase Storage(sources 버킷)에 업로드.
// 다모다란과 동일 관행(scripts/ingest_damodaran.ts): 버킷 sources · {source}/{as_of}/{file} 경로.
// 실행: npx tsx scripts/upload_sources_storage.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();

  const { data: buckets, error: listErr } = await sb.storage.listBuckets();
  if (listErr) { console.error(`🔴 listBuckets 실패: ${listErr.message} — 멈추고 보고`); process.exit(1); }
  if (!buckets?.find((b) => b.name === "sources")) {
    console.error("🔴 버킷 sources 없음 — 만들지 않고 멈추고 보고");
    process.exit(1);
  }

  const targets: { local: string; storagePath: string; contentType: string }[] = [
    {
      local: "data/sources/nasdaq/nasdaq_screener_20260808.json",
      storagePath: "nasdaq/2026-08-08/nasdaq_screener_20260808.json",
      contentType: "application/json",
    },
    {
      local: "data/sources/spdr/spdr_sector_holdings_2026-08-06.json",
      storagePath: "spdr/2026-08-06/spdr_sector_holdings_2026-08-06.json",
      contentType: "application/json",
    },
  ];

  for (const t of targets) {
    if (!fs.existsSync(t.local)) { console.error(`🔴 로컬 파일 없음: ${t.local} — 멈추고 보고`); process.exit(1); }
    const { error } = await sb.storage.from("sources").upload(t.storagePath, fs.readFileSync(t.local), { contentType: t.contentType, upsert: true });
    if (error) { console.error(`🔴 업로드 실패 ${t.storagePath}: ${error.message}`); process.exit(1); }
    console.log(`  ↑ storage: ${t.storagePath} (${path.basename(t.local)})`);
  }
  console.log("\n완료 — 2개 업로드");
}

main();
