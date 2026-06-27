import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let body: { biz_no?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const biz_no = String(body.biz_no ?? "").replace(/\D/g, "").slice(0, 10);
  if (biz_no.length !== 10) return NextResponse.json({ error: "사업자번호가 올바르지 않습니다." }, { status: 400 });

  const admin = createAdminClient();
  // 금감원 등록 업체만 클레임 가능
  const { data: biz } = await admin.from("fss_advisors").select("biz_no").eq("biz_no", biz_no).maybeSingle();
  if (!biz) return NextResponse.json({ error: "금감원 등록 명부에 없는 사업자번호입니다." }, { status: 400 });

  // 중복 방지
  const { data: existing } = await admin.from("business_members").select("status").eq("biz_no", biz_no).eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "이미 신청했거나 등록된 업체입니다." }, { status: 409 });

  await admin.from("business_members").insert({ biz_no, user_id: user.id, role: "owner", status: "pending" });
  await admin.from("business_claims").insert({ biz_no, user_id: user.id, method: "doc", status: "pending" });
  return NextResponse.json({ ok: true });
}
