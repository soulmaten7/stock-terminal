import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS = ["욕설·비방", "허위·사실무근", "광고·스팸", "도배·중복", "기타"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: { review_id?: number; reason?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const review_id = Number(body.review_id);
  const reason = String(body.reason ?? "").trim();
  if (!review_id) return NextResponse.json({ error: "review_id 필요" }, { status: 400 });
  if (!REASONS.includes(reason)) return NextResponse.json({ error: "사유를 선택하세요" }, { status: 400 });

  const admin = createAdminClient();
  const { error: insErr } = await admin
    .from("room_review_reports")
    .upsert({ review_id, reporter_user_id: user.id, reason }, { onConflict: "review_id,reporter_user_id", ignoreDuplicates: true });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { count } = await admin
    .from("room_review_reports")
    .select("id", { count: "exact", head: true })
    .eq("review_id", review_id);
  await admin.from("room_reviews").update({ report_count: count ?? 0 }).eq("id", review_id);

  return NextResponse.json({ ok: true });
}
