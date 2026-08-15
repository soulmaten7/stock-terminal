import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "dismissed"];

export async function POST(req: NextRequest) {
  // 관리자만 — 세션 + role 재확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  let body: { id?: number; status?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = Number(body.id);
  const status = String(body.status ?? "");
  if (!id || !STATUSES.includes(status)) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("room_reports").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
