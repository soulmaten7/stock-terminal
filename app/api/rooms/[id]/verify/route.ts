import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// TODO(auth): 카카오 OAuth·admin 활성화 후 운영자 본인/관리자만 호출하도록 권한 게이팅 추가.
//             현재는 검증 동선 확인용으로 열어둠 (서비스 롤 키는 서버에서만 사용).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const cleanBiz = String(body?.bizNo ?? "").replace(/[^0-9]/g, "");
  if (cleanBiz.length < 10) {
    return NextResponse.json({ ok: false, error: "사업자번호 형식 오류 (숫자 10자리)" }, { status: 400 });
  }

  const sb = createAdminClient();

  const { data: adv } = await sb
    .from("fss_advisors")
    .select("biz_no, company_name, valid_to, status")
    .eq("biz_no", cleanBiz)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);
  const valid = adv && adv.status === "active" && (!adv.valid_to || adv.valid_to >= today);

  if (!valid) {
    return NextResponse.json({ ok: false, verified: false, reason: "금감원 신고목록에서 확인 안 됨" });
  }

  const { error } = await sb
    .from("leading_rooms")
    .update({
      is_certified: true,
      biz_no: cleanBiz,
      fss_biz_no: cleanBiz,
      cert_type: "similar_advisory",
      cert_verified_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    verified: true,
    advisor: { company_name: adv.company_name, valid_to: adv.valid_to },
  });
}
