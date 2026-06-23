import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLATFORMS = ["telegram", "kakao", "naver", "etc"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let body: { room_name?: string; platform?: string; homepage?: string; company_name?: string; biz_no?: string; intro?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const room_name = String(body.room_name ?? "").trim().slice(0, 100);
  const homepage = String(body.homepage ?? "").trim().slice(0, 300);
  const platform = PLATFORMS.includes(String(body.platform)) ? String(body.platform) : "etc";
  const company_name = String(body.company_name ?? "").trim().slice(0, 100) || null;
  const intro = String(body.intro ?? "").trim().slice(0, 200) || null;
  const bizDigits = String(body.biz_no ?? "").replace(/\D/g, "").slice(0, 10);
  const biz_no = bizDigits || null;

  if (!room_name || !/^https?:\/\//.test(homepage)) {
    return NextResponse.json({ error: "리딩방 이름과 올바른 링크(http로 시작)가 필요합니다." }, { status: 400 });
  }

  const admin = createAdminClient();

  // FSS 자동대조: 사업자번호(10자리) 우선, 없으면 업체명 부분일치
  let fss_matched = false;
  let fss_biz_no: string | null = null;
  if (bizDigits.length === 10) {
    const { data } = await admin.from("fss_advisors").select("biz_no").eq("biz_no", bizDigits).maybeSingle();
    if (data) { fss_matched = true; fss_biz_no = data.biz_no; }
  } else if (company_name) {
    const q = company_name.replace(/[%,()]/g, "");
    const { data } = await admin.from("fss_advisors").select("biz_no").ilike("company_name", `%${q}%`).limit(1);
    if (data && data.length) { fss_matched = true; fss_biz_no = data[0].biz_no; }
  }

  const { error } = await admin.from("room_submissions").insert({
    room_name, company_name, biz_no, platform, homepage, intro,
    user_id: user.id, fss_matched, fss_biz_no, status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, fss_matched });
}
