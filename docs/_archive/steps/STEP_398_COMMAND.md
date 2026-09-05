<!-- 2026-06-25 -->
# STEP 398 — middleware.ts 추가 (Supabase 세션 토큰 자동 리프레시)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_398_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
루트에 `middleware.ts`가 **없어서** Supabase 세션 토큰이 만료(기본 1시간) 후 자동 갱신되지 않음 → 새로고침 시 서버 컴포넌트가 비로그인으로 인식, 즐겨찾기/관심 깜빡임·로그아웃처럼 보임. `@supabase/ssr` 표준 **`updateSession` 미들웨어**를 추가해 모든 라우트에서 토큰 리프레시.

## 전제
- `lib/supabase/server.ts`가 `@supabase/ssr createServerClient` + getAll/setAll 쿠키 패턴 사용 중(동일 패턴 사용).
- 배포 X (배치). 빌드 + 로컬 로그인 확인 + 로컬 커밋까지.

---

## 1단계 — 새 파일 생성
**새 파일**: `middleware.ts` (프로젝트 루트, `app/`과 같은 레벨) — 아래 그대로:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Supabase 세션 토큰을 모든 요청에서 리프레시(@supabase/ssr 권장 패턴).
// 없으면 access token 만료 후 서버 렌더가 로그아웃 상태로 인식됨.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // env 누락 시 안전 통과

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 토큰 리프레시(쿠키 갱신 트리거). 결과는 사용 안 함.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 정적 자원·이미지 제외 전 라우트
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

## 2단계 — 빌드 + 로컬 로그인 확인
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; (npm run dev >/tmp/trill_dev.log 2>&1 &) ; sleep 12
echo "→ localhost:3333 에서 구글 로그인 → 우상단 아바타 뜨는지 + 새로고침해도 로그인 유지되는지 확인"
echo "→ 콘솔/네트워크 에러 없는지 (특히 무한 리다이렉트 없어야 함)"
```
⚠️ 만약 **로그인이 안 되거나 무한 리다이렉트**가 나면 middleware 충돌 — `/tmp/trill_dev.log`와 증상 보고하고 **커밋하지 말 것**. (이 패턴은 표준이라 거의 문제 없음.)

빌드도 확인:
```bash
pkill -f "next dev" 2>/dev/null; npm run build
```

## 3단계 — 로컬 커밋 (푸시·배포 X)
```bash
git add middleware.ts
git commit -m "feat(STEP 398): middleware.ts 세션 토큰 리프레시(@supabase/ssr) — 로그인 깜빡임 해소"
```

## 확인
- 로그인 후 새로고침·탭 이동에도 로그인 유지(아바타 유지).
- 1시간 뒤(토큰 만료 후)에도 자동 갱신되어 로그아웃 안 됨(즉시 검증은 어려우나 코드상 보장).
