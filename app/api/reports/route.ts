import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS = ["허위·과장 수익률", "환불 거부", "미등록·사칭 의심", "리딩방 먹튀(잠적)", "불법 추천·미신고 자문", "기타"];

export async function POST(req: NextRequest) {
  let body: { target_type?: string; target_id?: string; target_name?: string; reason?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const target_name = String(body.target_name ?? "").trim().slice(0, 200);
  const reason = String(body.reason ?? "").trim();
  const content = String(body.content ?? "").trim().slice(0, 2000);
  const target_id = String(body.target_id ?? "").trim().slice(0, 100) || null;
  const target_type = String(body.target_type ?? "fss_advisor").trim().slice(0, 40);

  if (!target_name || !REASONS.includes(reason)) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("room_reports").insert({
    target_type,
    target_id,
    target_name,
    reason,
    content: content || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
