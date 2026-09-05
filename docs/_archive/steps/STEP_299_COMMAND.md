<!-- 2026-06-20 -->
# STEP 299 — [V7 ⑤-c] 로그인 루프 수정: Supabase 세션 미들웨어 추가

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_299_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 297(`94c2a13`). 빌드 ✓.

---

## 🎯 목표 / 원인

**증상**: 로그인 후에도 로그인이 안 잡히고 계속 로그인 화면으로 돌아옴(루프).
**원인**: `@supabase/ssr`는 **매 요청마다 세션을 갱신하고 쿠키를 응답에 다시 써주는 미들웨어**가 필수인데, 프로젝트에 `middleware.ts`가 **없음**. → 세션이 유지·전파되지 않아 로그아웃으로 인식됨. (카카오·구글 공통)

**해결**: 프로젝트 루트에 표준 Supabase 미들웨어 추가.

> 신규 파일 1개. 기존 콜백·클라이언트는 그대로(정상).

---

## 📄 파일 (신규 생성) — `middleware.ts` (프로젝트 루트, `app/`와 같은 위치)

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신(중요). 이 호출이 만료 토큰을 리프레시하고 쿠키를 응답에 다시 씀.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 정적 파일·이미지 제외한 모든 경로
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (`middleware.ts` 인식되는지 — 빌드 로그에 `ƒ Middleware` 같은 표시).

개발 서버(`npm run dev`, 포트 3333):
1. `/auth/login` → **카카오 또는 구글로 로그인** → 동의 → 돌아왔을 때 **로그인 상태 유지**(헤더 우측이 프로필로 바뀜, 로그인 화면으로 안 튕김).
2. 새로고침해도 로그인 유지.
3. (구글은 구글 콘솔 "테스트 사용자"에 본인 이메일 추가돼 있어야 함.)

> 로그인 되면 리딩방 탭에서 ♡·신고도 실제로 눌러서 DB에 쌓이는지 확인 가능.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "fix(auth): Supabase 세션 미들웨어 추가 — 로그인 루프 해결 (STEP 299)" && git push
```

---

> **한 줄 요약**: `@supabase/ssr` 필수 미들웨어(`middleware.ts`)가 없어 세션이 유지 안 되던 로그인 루프를 표준 미들웨어 추가로 해결.
