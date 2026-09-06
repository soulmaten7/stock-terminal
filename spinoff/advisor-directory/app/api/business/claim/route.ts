import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyBusiness } from "@/lib/nts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const biz_no = String(form.get("biz_no") ?? "").replace(/\D/g, "").slice(0, 10);
  const contact = String(form.get("contact") ?? "").trim().slice(0, 100);
  const start_dt = String(form.get("start_dt") ?? "").replace(/\D/g, "").slice(0, 8);
  const file = form.get("file");

  if (biz_no.length !== 10) return NextResponse.json({ error: "사업자번호가 올바르지 않습니다." }, { status: 400 });
  if (start_dt.length !== 8) return NextResponse.json({ error: "개업일자를 입력해주세요." }, { status: 400 });
  if (!contact) return NextResponse.json({ error: "담당자 연락처를 입력해주세요." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "사업자등록증 파일을 첨부해주세요." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "파일은 5MB 이하만 가능합니다." }, { status: 400 });

  const admin = createAdminClient();

  // 금감원 등록 업체만 클레임 가능 (+대표명)
  const { data: biz } = await admin.from("fss_advisors").select("biz_no, representative").eq("biz_no", biz_no).maybeSingle();
  if (!biz) return NextResponse.json({ error: "금감원 등록 명부에 없는 사업자번호입니다." }, { status: 400 });

  // 중복 방지
  const { data: existing } = await admin.from("business_members").select("status").eq("biz_no", biz_no).eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "이미 신청했거나 등록된 업체입니다." }, { status: 409 });

  // 국세청 진위확인 (사업자번호 + 대표명[금감원] + 개업일[입력]) — 명백한 불일치만 차단
  const nts = biz.representative ? await verifyBusiness(biz_no, start_dt, biz.representative as string) : 'unverified';
  if (nts === 'mismatch') {
    return NextResponse.json({ error: "국세청 진위확인 불일치 — 개업일자를 확인해주세요. (대표명 변경 등 사유면 signal.kr.biz@gmail.com 으로 문의)" }, { status: 400 });
  }

  // 서류 업로드 (비공개 버킷 — service role)
  const ext = ((file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)) || "bin";
  const path = `${user.id}/${biz_no}_${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from("business-docs").upload(path, buf, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upErr) return NextResponse.json({ error: "파일 업로드 실패: " + upErr.message }, { status: 500 });

  await admin.from("business_members").insert({ biz_no, user_id: user.id, role: "owner", status: "pending" });
  await admin.from("business_claims").insert({ biz_no, user_id: user.id, method: "doc", doc_url: path, contact, start_dt, nts_valid: nts, status: "pending" });
  return NextResponse.json({ ok: true });
}
