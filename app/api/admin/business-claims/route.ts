import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  let body: { id?: string; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");
  if (!id || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { data: claim } = await admin.from("business_claims").select("biz_no, user_id").eq("id", id).maybeSingle();
  if (!claim) return NextResponse.json({ error: "신청을 찾을 수 없음" }, { status: 404 });

  if (action === "approve") {
    await admin.from("business_claims").update({ status: "approved", reviewed_by: user.id }).eq("id", id);
    await admin.from("business_members").update({ status: "verified" }).eq("biz_no", claim.biz_no).eq("user_id", claim.user_id);
  } else {
    await admin.from("business_claims").update({ status: "rejected", reviewed_by: user.id }).eq("id", id);
    await admin.from("business_members").delete().eq("biz_no", claim.biz_no).eq("user_id", claim.user_id);
  }
  return NextResponse.json({ ok: true });
}
