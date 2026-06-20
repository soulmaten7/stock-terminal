import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  // 로그인 필수 — 작성자 기록(악의적 익명 도배 방지 + 본인 철회 가능)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 중복 방지: 같은 사용자가 같은 대상에 대기 중 신고가 이미 있으면 막음
  if (target_id) {
    const { data: dups } = await admin
      .from("room_reports")
      .select("id")
      .eq("reporter_user_id", user.id)
      .eq("target_id", target_id)
      .eq("status", "pending")
      .limit(1);
    if (dups && dups.length) {
      return NextResponse.json({ error: "이미 접수된 신고가 있어요 (검토 중)" }, { status: 409 });
    }
  }

  const { error } = await admin.from("room_reports").insert({
    target_type,
    target_id,
    target_name,
    reason,
    content: content || null,
    reporter_user_id: user.id,
    // status 는 DB 기본값 'pending'
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
