import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blockWrite } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNDERSTOOD = ["clear", "vague", "unclear"];
const INTENT = ["yes", "maybe", "no"];

// 베타 피드백 삽입 — 비로그인도 허용(지인 베타). 서버 service-role로 저장, 입력 길이 캡.
export async function POST(req: NextRequest) {
  // STEP 829 §6: 봇·스크립트 대량 삽입 차단(폼 제출은 드무므로 낮게). 정상 사용자(가끔 제출)는 안 걸림.
  if (blockWrite(req, "feedback", 4, 20)) return NextResponse.json({ error: "too many requests" }, { status: 429 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }

  const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n) || null;
  const first_impression = s(body.first_impression, 500);
  const trai_understood = UNDERSTOOD.includes(String(body.trai_understood)) ? String(body.trai_understood) : null;
  const most_useful = s(body.most_useful, 1500);
  const bugs = s(body.bugs, 2000);
  const return_intent = INTENT.includes(String(body.return_intent)) ? String(body.return_intent) : null;
  const ratingRaw = Number(body.rating);
  const rating = Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  const contact = s(body.contact, 120);
  const path = s(body.path, 200);

  if (!first_impression && !most_useful && !bugs && !trai_understood && !return_intent && rating == null) {
    return NextResponse.json({ error: "한 가지라도 남겨 주세요" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { error } = await admin.from("feedback").insert({
    first_impression, trai_understood, most_useful, bugs, return_intent, rating, contact, path,
    user_id: user?.id ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
