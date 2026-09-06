// 콘텐츠 번역 구현(2026-09-06, 채팅 지시) — 기존 적재분(KR 15건 + US 53건) 소급 번역.
// 앞으로 새로 들어오는 행은 channel_reports AFTER INSERT 트리거(pg_net)가 자동 처리한다
// (supabase/migrations/20260906_channel_reports_translate_trigger.sql) — 이 스크립트는 트리거가
// 생기기 전에 이미 있던 행, 또는 실패해서 재시도가 필요한 행만 다룬다. 일회성 실행 — 크론 아님.
//
// 사용: npx tsx scripts/backfill-channel-report-translations.ts [--force] [--base-url=http://localhost:3333]
import { createAdminClient } from "../lib/supabase/admin";

const SECRET = process.env.CHANNEL_REPORT_TRANSLATE_SECRET;
if (!SECRET) { console.error("CHANNEL_REPORT_TRANSLATE_SECRET 없음(.env.local 확인)"); process.exit(1); }

const args = process.argv.slice(2);
const force = args.includes("--force");
const baseUrlArg = args.find((a) => a.startsWith("--base-url="));
const baseUrl = baseUrlArg ? baseUrlArg.split("=")[1] : "https://earthticker.app";

async function main() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("channel_reports")
    .select("id, source_lang")
    .order("id", { ascending: true });
  if (error) { console.error(error); process.exit(1); }
  const rows = (data ?? []) as { id: number; source_lang: string }[];
  const targets = rows.filter((r) => r.source_lang === "ko" || r.source_lang === "en");
  console.log(`대상 ${targets.length}건(전체 ${rows.length}건 중 ko/en만) — force=${force} base=${baseUrl}`);

  let ok = 0, skipped = 0, failed = 0;
  for (const row of targets) {
    try {
      const res = await fetch(`${baseUrl}/api/internal/translate-channel-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-translate-secret": SECRET! },
        body: JSON.stringify({ report_id: row.id, force }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) { ok++; console.log(`  #${row.id} ok (${j.target_lang})`); }
      else if (j.skipped) { skipped++; console.log(`  #${row.id} skip: ${j.reason}`); }
      else { failed++; console.error(`  #${row.id} 실패:`, j); }
    } catch (e) {
      failed++;
      console.error(`  #${row.id} 예외:`, String(e));
    }
    await new Promise((r) => setTimeout(r, 300)); // OpenAI 레이트리밋 여유
  }
  console.log(`완료: ok=${ok} skipped=${skipped} failed=${failed}`);
}
main();
