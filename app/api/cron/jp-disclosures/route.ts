import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEdinetDocsForDate } from "@/lib/edinet";

export const runtime = "nodejs";
export const maxDuration = 60;

// 매일 최근 N일 EDINET 공시를 긁어 jp_disclosures에 upsert(미리계산).
// EDINET은 회사 필터가 없어 날짜별로 긁어야 함 → 상장사(secCode)만 저장.
// 크론 = days=3(빈틈 보정), 초기 백필 = ?days=45.
export async function GET(req: NextRequest) {
  const key = (process.env.EDINET_API_KEY || "").trim();
  if (!key) return NextResponse.json({ error: "no EDINET_API_KEY" }, { status: 500 });
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days") || 3), 1), 90);

  const rows: Record<string, unknown>[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const docs = await fetchEdinetDocsForDate(date, key);
    for (const doc of docs) {
      rows.push({
        doc_id: doc.docID,
        sec_code: doc.secCode,
        doc_type_code: doc.docTypeCode,
        doc_description: doc.docDescription,
        submit_datetime: doc.submitDateTime ? doc.submitDateTime.replace(" ", "T") + ":00+09:00" : null,
        current_report_reason: doc.currentReportReason,
      });
    }
  }
  if (!rows.length) return NextResponse.json({ ok: true, upserted: 0, days });

  const sb = createAdminClient();
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await sb.from("jp_disclosures").upsert(chunk, { onConflict: "doc_id" });
    if (error) return NextResponse.json({ error: error.message, upserted }, { status: 500 });
    upserted += chunk.length;
  }
  return NextResponse.json({ ok: true, upserted, days });
}
