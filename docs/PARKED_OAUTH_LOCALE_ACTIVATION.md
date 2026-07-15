<!-- 2026-07-15 -->
# ✅ ACTIVATED — OAuth 로케일 보존 (로그인 후 언어 유지) — 완료(STEP 710E)

> **상태:** ✅ **활성화 완료(STEP 710E · `6bccc45` · 2026-07-15).** 쿠키 방식으로 구현·**라이브 실측 성공** — 실제 구글 로그인(`soulmaten7@gmail.com`·JWT 발급 3분 내)이 `/en`에서 `/en`(영어)로 복귀·세션 활성 확인. **redirectTo/Supabase 허용목록 byte 불손상.** → **i18n 100% 완결.**
>
> **구현 요약**: 신규 `lib/authRedirect.ts`(`safeNextPath` 오픈리다이렉트 가드 + `localizePath` as-needed 프리픽스) + 유닛테스트(vitest 49/49) · `app/auth/callback/route.ts`가 요청 헤더에서 `post_login_locale` 읽어 모든 복귀 경로에 로케일 프리픽스 + 소비 후 쿠키 삭제 · 로그인 2곳(`app/[locale]/auth/login`·`admin/login`)이 `signInWithOAuth` 직전 `document.cookie = "post_login_locale=<locale>; path=/; max-age=600; samesite=lax; [secure]"` 세팅.
>
> **검증/교훈**: 브라우저 격리 테스트로 `post_login_locale=en`이 `NEXT_LOCALE=ko`인데도 `/en` 구동함을 증명(쿠키가 독립 구동인자). 다만 next-intl `NEXT_LOCALE` 쿠키도 로케일을 독립 구동(둘 다 Lax·실사용에서 일치)해 실제 왕복은 둘이 보강 — `post_login_locale`은 콜백 **자체 리다이렉트**를 옳게 만들어 미들웨어 재프리픽스에 비의존(더 견고). 소비 후 쿠키는 값이 빈 문자열로 비워지고 max-age=0으로 곧 사라짐(무해).
>
> 아래는 착수 전 런북 원문(설계 근거 보존).

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
