<!-- 2026-07-14 -->
# 🅿️ PARKED — OAuth 로케일 보존 (로그인 후 언어 유지) 활성화 런북

> **상태:** 보류(parked). i18n 3/3(710D)에서 시도했으나 **파트4만 롤백**(`14c1813`). 파트1~3(en→US 디폴트·metadata·youtube)은 라이브. 로그인은 **정상 작동**(단, `/en`에서 로그인하면 한국어 `/`로 복귀하는 사소한 gap만 남음).
> **다음 세션에서 이 파일대로 재시도.**

---

## 증상
`/en`에서 구글 로그인 → 콜백이 `/`(한국어 홈)로 떨굼. 로케일이 로그인 왕복에서 소실.

## ❌ 실패한 접근 (하지 말 것)
`signInWithOAuth`의 **`redirectTo`에 `?next=/en`을 붙이는 방식**. → **Supabase 리다이렉트 허용목록이 쿼리 붙은 콜백 URL을 거부** → 구글 동의화면도 안 뜨고 로그인 자체가 튕김("구글 화면 안 뜨고 `/`로 즉시 복귀"). 파트4 롤백의 직접 원인.
- 교훈: 이 프로젝트 Supabase **Redirect URL 허용목록은 `?next=` 쿼리 변형을 통과시키지 않음.** `redirectTo`/허용목록/Supabase 대시보드는 **건드리지 말 것**(로그인 전체가 죽음).

## ✅ 올바른 접근 — 쿠키로 로케일 전달 (redirectTo 불변)
`redirectTo`를 지금과 **byte 동일**(`${origin}/auth/callback`·쿼리 없음)로 유지 → 허용목록 문제 원천 회피. 로케일은 **쿠키**로 왕복.
1. **로그인 시작 직전**(로그인 버튼 핸들러, `/en/auth/login` 등): `signInWithOAuth` 호출 전에 짧은 수명 쿠키 세팅 — 예 `document.cookie = "post_login_locale=en; path=/; max-age=600; samesite=lax"`. 현재 로케일은 `useLocale()`로.
2. **콜백 라우트**(`app/auth/callback/route.ts`): 코드 교환 후 복귀 경로 정할 때 **쿠키 `post_login_locale` 읽어** 로케일 프리픽스 결정(en→`/en...`, ko→`/...`). 읽은 뒤 쿠키 삭제(`max-age=0`).
3. 기존 `next` 파라미터(앱 내부 상대경로)와 **공존**: `next`가 있으면 그 경로에 로케일 프리픽스만 입힘. `next`는 **반드시 내부 상대경로 화이트리스트**(710D에서 넣은 오픈 리다이렉트 가드 `//evil.com`·외부 URL 차단 유지).

## ⚠️ 주의
- `redirectTo`·Supabase 대시보드 허용목록 **절대 변경 금지**.
- 쿠키는 `SameSite=Lax`(OAuth 리다이렉트가 top-level navigation이라 Lax면 왕복에 실려 감). `Secure`는 프로덕션(https)에서.
- **로그인 end-to-end 실측 필수**(구글 계정 필요 — Claude Code가 못 하는 유일 검증): en에서 로그인→`/en`(영어) 복귀·성공, ko에서 로그인→`/`(한국어) 복귀·성공, admin 로그인(`?next=/admin`) 기존대로 동작.
- 에러 복귀 경로(`/auth/login?error=`)도 로케일 유지.

## 관련 파일
- `app/auth/callback/route.ts` (콜백 — 쿠키 읽기 + 로케일 프리픽스)
- 로그인 버튼 컴포넌트(`signInWithOAuth` 호출부 — 쿠키 쓰기). grep `signInWithOAuth`로 위치 확인.
- 참고: 710C가 `next-intl` redirect를 `@/i18n/navigation`에서 명시적 타입 재export 함(구조분해 시 never-narrowing 깨짐 주의).

## 착수
독립 STEP(예 710E)로. 실패 시 `git reset --hard <해당 커밋 이전>` 후 재시도 — **로그인 반쯤 고친 상태로 두지 말 것.**
