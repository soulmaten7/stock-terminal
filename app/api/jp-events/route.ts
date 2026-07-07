import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { secCodeOf } from "@/lib/edinet";

export const runtime = "nodejs";
export const maxDuration = 20;

// JP 종목 최근 중대 공시(EDINET·미리계산 jp_disclosures). US /api/events·KR /api/kr-events의 JP 짝.
// docType → 한국어 라벨. 여기 없는 코드(대량보유 등 노이즈)는 material 아니면 제외.
const JP_TYPE_KO: Record<string, string> = {
  "120": "사업보고서(有報)", "130": "정정 사업보고서",
  "140": "분기보고서", "150": "정정 분기보고서",
  "160": "반기보고서", "170": "정정 반기보고서",
  "350": "임시보고서", "360": "정정 임시보고서",
  "030": "증권신고서", "043": "발행등록 추보서류", "220": "자기주식 취득상황",
};
const KEEP = new Set(Object.keys(JP_TYPE_KO));

const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const sec = secCodeOf(symbol);
  if (!sec) return NextResponse.json({ symbol, events: [] });

  const hit = cache.get(sec);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  const sb = createAdminClient();
  const { data, error } = await sb
    .from("jp_disclosures")
    .select("doc_id, doc_type_code, doc_description, submit_datetime, current_report_reason")
    .eq("sec_code", sec)
    .order("submit_datetime", { ascending: false })
    .limit(40);

  let events: unknown[] = [];
  if (!error && data) {
    events = (data as Record<string, string | null>[])
      .filter((r) => r.current_report_reason != null || (r.doc_type_code != null && KEEP.has(r.doc_type_code)))
      .slice(0, 8)
      .map((r) => ({
        doc_id: r.doc_id,
        title: (r.doc_type_code && JP_TYPE_KO[r.doc_type_code]) || r.doc_description || "공시",
        date: r.submit_datetime,
        reason: r.current_report_reason,
        material: r.current_report_reason != null,
        type_code: r.doc_type_code,
      }));
  }
  const out = { symbol, sec_code: sec, events };
  cache.set(sec, { at: Date.now(), data: out });
  return NextResponse.json(out);
}
