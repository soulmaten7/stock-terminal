import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blockWrite } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔴 2026-09-08 실측 발견 — 여기가 예전 "room"(리딩방 슬롯, 폐기됨) 값을 그대로
// 갖고 있었다. 폼(components/advertise/AdInquiryForm.tsx)·페이지(app/[locale]/
// advertise/page.tsx)는 이미 "feed"로 바뀐 지 오래인데 여기만 안 맞아서, 사용자가
// "콘텐츠 피드"를 선택해 보내도 이 목록에 없어 조용히 "other"로 잘못 기록되고
// 있었다. 세 곳(폼·페이지·여기)의 slot 값 목록은 항상 같이 맞춘다.
const SLOTS = ["broker", "feed", "other"];

export async function POST(req: NextRequest) {
  // STEP 829 §6: PII 저장 폼 — 봇·스크립트 대량 삽입 차단(제출은 드무므로 낮게).
  if (blockWrite(req, "adinquiry", 4, 20)) return NextResponse.json({ error: "too many requests" }, { status: 429 });
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

  // 🔴 2026-09-08 신설 — 이전엔 ad_inquiries에 저장만 되고 아무도 알림받지
  // 못했다(관리자가 /admin을 직접 열어봐야만 발견). 이미 검증된 발신 도메인
  // (email-brief 크론과 동일 brief@earthticker.app)으로 signal.kr.biz@gmail.com에
  // 알림 메일을 보낸다 — 실패해도 문의 저장 자체는 이미 끝났으므로 응답을 막지 않는다.
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: "EarthTicker <brief@earthticker.app>",
          to: "signal.kr.biz@gmail.com",
          subject: `[광고 문의] ${company}`,
          text: `슬롯: ${slot}\n회사명: ${company}\n담당자: ${contact_name ?? "-"}\n이메일: ${email}\n연락처: ${phone}\n메시지: ${message ?? "-"}`,
        }),
      });
    }
  } catch {
    // 알림 실패는 무시 — 문의는 이미 저장됐고, /admin에서도 확인 가능하다.
  }

  return NextResponse.json({ ok: true });
}
