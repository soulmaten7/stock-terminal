import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MANAGERS = 1;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let body: { action?: string; biz_no?: string; type?: string; url?: string; label?: string; intro?: string; id?: string; email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const action = String(body.action ?? "");
  const biz_no = String(body.biz_no ?? "");

  const admin = createAdminClient();
  const { data: me } = await admin.from("business_members").select("role").eq("biz_no", biz_no).eq("user_id", user.id).eq("status", "verified").maybeSingle();
  if (!me) return NextResponse.json({ error: "이 업체의 인증된 담당자가 아닙니다." }, { status: 403 });
  const isOwner = me.role === "owner";

  if (action === "setIntro") {
    const intro = String(body.intro ?? "").trim().slice(0, 200);
    const { error } = await admin.from("business_listing").upsert({ biz_no, intro, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "biz_no" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delLink") {
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });
    const { error } = await admin.from("business_links").delete().eq("id", id).eq("biz_no", biz_no);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // 무료 링크 1개 — 첫 링크는 무료, 2번째부터는 결제 필요(준비 중)
  if (action === "addLink") {
    const FREE_LINKS = 1;
    const type = ["room", "youtube", "site"].includes(String(body.type)) ? String(body.type) : "site";
    const url = String(body.url ?? "").trim().slice(0, 300);
    const label = String(body.label ?? "").trim().slice(0, 60) || null;
    if (!/^https?:\/\//.test(url)) return NextResponse.json({ error: "올바른 링크 주소가 필요해요 (http로 시작)." }, { status: 400 });
    const { count } = await admin.from("business_links").select("id", { count: "exact", head: true }).eq("biz_no", biz_no);
    if ((count ?? 0) >= FREE_LINKS) return NextResponse.json({ error: "추가 링크는 결제가 필요해요 (준비 중)." }, { status: 402 });
    const { error } = await admin.from("business_links").insert({ biz_no, type, url, label, created_by: user.id, is_paid: false, status: "active" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "addManager") {
    if (!isOwner) return NextResponse.json({ error: "소유자만 관리자를 추가할 수 있어요." }, { status: 403 });
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    const { count } = await admin.from("business_members").select("id", { count: "exact", head: true }).eq("biz_no", biz_no).eq("role", "manager");
    if ((count ?? 0) >= MAX_MANAGERS) return NextResponse.json({ error: "관리자는 1명까지 공유할 수 있어요." }, { status: 400 });
    const { data: target } = await admin.from("users").select("id").eq("email", email).maybeSingle();
    if (!target) return NextResponse.json({ error: "해당 이메일로 가입한 사용자가 없어요." }, { status: 400 });
    if (target.id === user.id) return NextResponse.json({ error: "본인은 추가할 수 없어요." }, { status: 400 });
    const { error } = await admin.from("business_members").insert({ biz_no, user_id: target.id, role: "manager", status: "verified", email });
    if (error) return NextResponse.json({ error: "이미 등록된 사용자거나 추가 실패." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  if (action === "removeManager") {
    if (!isOwner) return NextResponse.json({ error: "소유자만 가능해요." }, { status: 403 });
    const id = String(body.id ?? "");
    const { error } = await admin.from("business_members").delete().eq("id", id).eq("biz_no", biz_no).eq("role", "manager");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
