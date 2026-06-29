import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLOTS = ["broker", "room", "other"];

export async function POST(req: NextRequest) {
  let body: { slot?: string; company?: string; contact_name?: string; email?: string; phone?: string; message?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }

  const company = String(body.company ?? "").trim().slice(0, 100);
  const contact_name = String(body.contact_name ?? "").trim().slice(0, 60) || null;
  const email = String(body.email ?? "").trim().slice(0, 120) || null;
  const phone = String(body.phone ?? "").trim().slice(0, 30) || null;
  const message = String(body.message ?? "").trim().slice(0, 2000) || null;
  const slot = SLOTS.includes(String(body.slot ?? "")) ? String(body.slot) : "other";

  if (!company) return NextResponse.json({ error: "회사명을 입력해 주세요" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "이메일을 입력해 주세요" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "연락처를 입력해 주세요" }, { status: 400 });

  // 광고주는 비로그인일 수 있음 — 로그인 필수 아님. 로그인 상태면 user.id 기록.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { error } = await admin.from("ad_inquiries").insert({
    slot, company, contact_name, email, phone, message, created_by: user?.id ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
