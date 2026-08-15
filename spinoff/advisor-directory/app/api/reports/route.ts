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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const admin = createAdminClient();

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
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 내 신고 목록
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ reports: [] });
  const admin = createAdminClient();
  const { data } = await admin
    .from("room_reports")
    .select("id, target_name, reason, status, created_at")
    .eq("reporter_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json({ reports: data ?? [] });
}

// 본인 신고 철회 (확인된 신고는 불가)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: { id?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { data: rep } = await admin.from("room_reports").select("reporter_user_id, status").eq("id", id).single();
  if (!rep || rep.reporter_user_id !== user.id) return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  if (rep.status === "confirmed") return NextResponse.json({ error: "확인된 신고는 철회할 수 없습니다" }, { status: 409 });

  const { error } = await admin.from("room_reports").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
