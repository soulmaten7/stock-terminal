import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath, localizePath } from "@/lib/authRedirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errParam = searchParams.get("error");
  const next = safeNextPath(searchParams.get("next")); // 오픈 리다이렉트 가드(내부 절대경로만)

  // 로그인 시작 시 심어둔 로케일 쿠키(없으면 ko). redirectTo는 불변 — 로케일은 쿠키로만 왕복.
  const localeCookie = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)post_login_locale=([^;]+)/)?.[1];
  const loc: "ko" | "en" = localeCookie === "en" ? "en" : "ko";

  // 모든 복귀 경로에 로케일 프리픽스 + 소비한 쿠키 삭제
  const redirect = (path: string) => {
    const res = NextResponse.redirect(`${origin}${localizePath(path, loc)}`);
    res.cookies.set("post_login_locale", "", { maxAge: 0, path: "/" });
    return res;
  };

  if (errParam) {
    return redirect(`/auth/login?error=provider_${errParam}`);
  }

  if (!code) {
    return redirect("/auth/login?error=no_code");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return redirect("/auth/login?error=exchange_failed");
  }

  // DB 트리거(handle_new_user, 마이그레이션 016)가 users 행을 자동 생성하지만,
  // 트리거 미적용 환경 대비 폴백 insert (ON CONFLICT 격 — 존재 시 skip).
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!existingUser) {
    const meta = data.user.user_metadata ?? {};
    const nickname =
      meta.name ||
      meta.nickname ||
      meta.full_name ||
      data.user.email?.split("@")[0] ||
      `트레이더-${data.user.id.slice(0, 4)}`;

    await supabase.from("users").insert({
      id: data.user.id,
      email: data.user.email ?? `${data.user.id}@unjong.local`,
      nickname,
      role: "free",
    });
  }

  return redirect(next);
}
