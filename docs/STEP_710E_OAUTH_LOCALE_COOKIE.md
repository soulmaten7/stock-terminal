<!-- 2026-07-15 -->
# STEP 710E — OAuth 로케일 쿠키 (로그인 후 언어 유지) · i18n 마지막 항목

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(auth 민감 — 로그인 왕복. `redirectTo`/Supabase 허용목록 근처 절대 금지. 이전 세션 710D에서 로그인 죽인 전례. `/clear` 후 시작.)

**목표:** `/en`에서 구글 로그인 → 콜백이 `/`(한국어 홈)로 떨구는 gap 제거. **로케일을 쿠키로 왕복**시켜 en 로그인은 `/en`, ko 로그인은 `/`로 복귀. → **i18n 100% 완결**(정적 UI + 결정론 데이터 + LLM 산출물 + 로그인 왕복까지 로케일 정합).

**전제:** HEAD `713084c`(726까지 커밋·트리 깨끗). 실패 시 `git reset --hard 713084c`로 롤백.

**설계 권위:** `docs/PARKED_OAUTH_LOCALE_ACTIVATION.md`(✅ 쿠키 접근 / ❌ redirectTo에 `?next=` 붙이는 실패 접근).

---

## 🚫 절대 금지 (710D 로그인 사망 원인)
- `signInWithOAuth`의 **`redirectTo` 문자열 변경 금지.** 지금 그대로 byte 동일 유지:
  - 메인 로그인: `` `${window.location.origin}/auth/callback` ``
  - admin 로그인: `` `${window.location.origin}/auth/callback?next=/admin` ``
- **Supabase 대시보드 Redirect URL 허용목록 건드리지 말 것.** 이 프로젝트 허용목록은 `?next=` 쿼리 변형을 거부 → 로그인 전체가 튕김.
- 로케일은 **오직 쿠키**로만 전달. redirectTo/허용목록은 손대지 않음 → 문제 원천 회피.

---

## 파일 1 (신규) — `lib/authRedirect.ts` : 순수 헬퍼 (유닛테스트 대상)
```ts
// OAuth 콜백 복귀 경로 유틸 (순수 함수 — 유닛테스트 대상).
// - safeNextPath: 오픈 리다이렉트 방지. 내부 절대경로("/...")만 허용, //·외부 URL·상대경로는 "/"로.
// - localizePath: as-needed 로케일 프리픽스. en이면 "/en" 접두, ko는 그대로(프리픽스 없음).

export function safeNextPath(nextRaw: string | null | undefined): string {
  const n = nextRaw ?? "/";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export function localizePath(path: string, loc: "ko" | "en"): string {
  if (loc !== "en") return path;
  // 이미 /en 프리픽스면 중복 방지(방어적)
  if (path === "/en" || path.startsWith("/en/") || path.startsWith("/en?")) return path;
  return path === "/" ? "/en" : `/en${path}`;
}
```

## 파일 2 (신규) — `lib/authRedirect.test.ts` : 유닛테스트
```ts
import { describe, it, expect } from "vitest";
import { safeNextPath, localizePath } from "./authRedirect";

describe("safeNextPath — 오픈 리다이렉트 가드", () => {
  it("내부 절대경로는 통과", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/mypage")).toBe("/mypage");
  });
  it("null/undefined는 /", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
  });
  it("프로토콜-상대(//)·외부 URL·상대경로는 / 로 차단", () => {
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("evil")).toBe("/");
  });
});

describe("localizePath — as-needed 로케일 프리픽스", () => {
  it("en: 루트는 /en, 그 외는 /en 접두", () => {
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/admin", "en")).toBe("/en/admin");
    expect(localizePath("/auth/login?error=no_code", "en")).toBe("/en/auth/login?error=no_code");
  });
  it("en: 이미 /en 프리픽스면 중복 안 붙임", () => {
    expect(localizePath("/en", "en")).toBe("/en");
    expect(localizePath("/en/admin", "en")).toBe("/en/admin");
  });
  it("ko: 프리픽스 없음(그대로)", () => {
    expect(localizePath("/", "ko")).toBe("/");
    expect(localizePath("/admin", "ko")).toBe("/admin");
  });
});
```

## 파일 3 — `app/auth/callback/route.ts` : 쿠키 읽기 + 로케일 프리픽스 + 소비 삭제
**전체를 아래로 교체**(기존 user insert 로직·주석 그대로 보존, 상단 import 2줄 + 로케일/redirect 헬퍼만 추가):
```ts
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
```
**변경 요지:** import 2줄 추가 · `next`를 `safeNextPath()` 경유(가드) · 쿠키에서 `loc` 도출 · `redirect()` 헬퍼가 모든 복귀에 `localizePath` + 쿠키 삭제 적용 · 마지막 `return NextResponse.redirect(...)` → `return redirect(next)`. **user insert 블록·이메일 폴백·닉네임 로직은 1글자도 변경 없음.**

## 파일 4 — `app/[locale]/auth/login/page.tsx` : 메인 로그인 쿠키 쓰기 (1줄 추가)
`handleGoogleLogin` 안, `const supabase = createClient();` **바로 위**에 쿠키 세팅 한 줄 추가. `locale`은 이미 `useLocale()`로 스코프에 있음(line 11). **`redirectTo`·`signInWithOAuth` 옵션은 손대지 말 것.**
```ts
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // OAuth 왕복에 로케일 실어보내기(쿠키). redirectTo는 불변 — Supabase 허용목록 안 건드림.
      document.cookie = `post_login_locale=${locale}; path=/; max-age=600; samesite=lax${window.location.protocol === "https:" ? "; secure" : ""}`;
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };
```

## 파일 5 — `app/[locale]/admin/login/page.tsx` : admin 로그인 쿠키 쓰기 (import 1 + 2줄)
admin은 현재 `useLocale`를 안 씀 → import 추가 + `locale` 선언 + `login()`에 쿠키 한 줄. **`redirectTo: ...?next=/admin`은 그대로.**
1. import 줄에 `useLocale` 추가:
```ts
import { useLocale } from "next-intl";
```
2. 컴포넌트 상단(`const router = useRouter();` 근처)에:
```ts
  const locale = useLocale();
```
3. `login` 함수, `const supabase = createClient();` **바로 위**에:
```ts
  const login = async () => {
    setLoading(true);
    // OAuth 왕복에 로케일 실어보내기(쿠키). redirectTo·next는 불변.
    document.cookie = `post_login_locale=${locale}; path=/; max-age=600; samesite=lax${window.location.protocol === "https:" ? "; secure" : ""}`;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
  };
```

---

## ⚠️ 쿠키 스펙 근거 (건드리지 말 것)
- `SameSite=Lax` — OAuth 콜백은 구글→우리 도메인 **top-level GET 내비게이션** → Lax 쿠키가 왕복에 실려 옴(Strict면 안 실림). 파트 설계의 핵심.
- `Secure`는 https(프로덕션)에서만 — 로컬 http dev에서 쿠키 죽지 않게 삼항으로 분기.
- `max-age=600`(10분) — 로그인 왕복용 단명. 콜백이 소비 후 즉시 삭제(`maxAge:0`).

## 검증 — 자동 (Claude Code가 실행)
1. `npx tsc --noEmit` → 0.
2. `NEXT_DIST_DIR=.next-verify npm run build` → 성공(콜백 라우트·로그인 2곳 컴파일). 끝나면 `.next-verify` 삭제.
3. `npx vitest run` → **authRedirect.test.ts 포함 전체 통과**(가드·프리픽스 분기 커버).
4. dev 스모크: `/auth/login`(ko)·`/en/auth/login`(en) 200 로드 · `/admin/login` 200. (실제 구글 로그인은 자동 불가 — 아래 사용자 검증.)
5. `grep -rn "redirectTo" app/[locale]/auth app/[locale]/admin` → 두 문자열이 **전제와 byte 동일**한지 눈으로 확인(변형 0).

## 검증 — 실측 (⚠️ 사용자 = soulmaten7 몫, 구글 계정 필요·Claude Code 불가)
push 후 Vercel 배포되면 **라이브에서** 직접:
1. 로그아웃 상태 → `onetrillion.app/en` → 구글 로그인 → **`/en`(영어)로 복귀 + 로그인 성공** 확인.
2. 로그아웃 → `onetrillion.app/`(한국어) → 구글 로그인 → **`/`(한국어)로 복귀 + 성공** 확인.
3. `/admin/login`(또는 `/en/admin/login`) → 로그인 → `/admin`(또는 `/en/admin`) 복귀 확인.
4. 하나라도 로그인이 **안 뜨거나 튕기면** 즉시 `git reset --hard 713084c && git push`로 롤백(로그인 반쯤 고친 상태 금지) 후 Cowork에 공유.

## 커밋 (자동 검증 통과 후 push → 그 다음 사용자 실측)
```bash
git add -A && git commit -m "i18n(710E): OAuth 로케일 쿠키 — 로그인 후 언어 유지(redirectTo 불변·쿠키 왕복·오픈리다이렉트 가드+유닛테스트) → i18n 100%" && git push
```

## 다음 (사용자 실측 성공 시 — Cowork이 처리)
- `docs/PARKED_OAUTH_LOCALE_ACTIVATION.md` → **활성화 완료(710E)** 로 상태 갱신.
- 세션 종료 문서 4종 + SESSION_BOOT/PLAYBOOK 갱신, **"i18n 100% 완결"** 명시, HEAD 갱신.
- i18n 전체 아크 종료 → 다음 후보: 다크 폴리시 D(죽은 shadow 클래스 정리·저가치) · 클로즈드 베타 초대(사용자 주도) · US 빈 뉴스 명시 UX(저가치).
