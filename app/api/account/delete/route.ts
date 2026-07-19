// 회원 탈퇴 — GDPR·개인정보보호법 + Apple 앱 심사 의무 대응(STEP 762).
// 삭제 순서: ① user_id(또는 reporter_user_id) 소유 행 삭제 → ② public.users 행 삭제 → ③ auth.users 삭제(admin API).
// 순서가 중요 — public.users를 먼저 지우면 이후 admin.deleteUser가 트리거/FK를 다시 건드릴 이유가 없어 안전하고,
// 반대로 auth.users를 먼저 지우면 public.users 트리거 연쇄를 예측하기 어려워진다.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// public 스키마에서 user_id류 컬럼을 가진 테이블 전수(2026-07-19 정보스키마 조회로 확인 — STEP 762).
// feedback은 제외: 콘텐츠 자체는 개인정보가 아니라 삭제 대신 user_id만 null로 익명화(아래 별도 처리).
const USER_OWNED_TABLES: { table: string; column: string }[] = [
  { table: "watchlist", column: "user_id" },
  { table: "room_reports", column: "reporter_user_id" },
  { table: "room_review_reports", column: "reporter_user_id" },
  { table: "room_favorites", column: "user_id" },
  { table: "room_likes", column: "user_id" },
  { table: "room_reviews", column: "user_id" },
  { table: "room_submissions", column: "user_id" },
  { table: "leading_room_votes", column: "user_id" },
  { table: "link_hub_favorites", column: "user_id" },
  { table: "link_hub_clicks", column: "user_id" },
  { table: "discussions", column: "user_id" },
  { table: "discussion_comments", column: "user_id" },
  { table: "discussion_likes", column: "user_id" },
  { table: "platform_discussions", column: "user_id" },
  { table: "platform_discussion_likes", column: "user_id" },
  { table: "business_claims", column: "user_id" },
  { table: "business_members", column: "user_id" },
];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = user.id;
  const admin = createAdminClient();
  let stage = "start";

  try {
    for (const { table, column } of USER_OWNED_TABLES) {
      stage = table;
      const { error } = await admin.from(table).delete().eq(column, uid);
      if (error) throw new Error(error.message);
    }

    stage = "feedback(anonymize)";
    {
      const { error } = await admin.from("feedback").update({ user_id: null }).eq("user_id", uid);
      if (error) throw new Error(error.message);
    }

    stage = "public.users";
    {
      const { error } = await admin.from("users").delete().eq("id", uid);
      if (error) throw new Error(error.message);
    }

    stage = "auth.admin.deleteUser";
    {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    Sentry.captureException(e, { tags: { route: "account/delete", stage }, extra: { userId: uid } });
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
