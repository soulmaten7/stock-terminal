<!-- 2026-07-14 -->
# STEP 710A — i18n 3/3단계 (a: [locale] 라우팅 구조만 · ko 단일 · 화면 0 변화)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(모든 라우트 물리 이동 + next-intl 버전별 API 대조 판단 — 세션 중 최고 난도. `/clear` 후 시작 권장.)
**목표:** next-intl **i18n 라우팅**(`app/[locale]`)을 도입하되 **로케일은 ko 하나·`localePrefix:'as-needed'`** → **URL·화면 전부 지금과 100% 동일**. 영어는 다음(710B). 이 스텝은 "**아무것도 안 변해야 성공**"인 순수 구조 리팩터.
**전제:** STEP 709F 완료(`fdfb753`). 지금은 next-intl **라우팅 없이**(고정 ko) 돌아가는 상태.

---

## ⚠️ 먼저 — 공식 문서로 정확한 API부터 대조
정확한 함수 시그니처가 버전(next-intl 4.13.x)마다 다름. **추측 금지.** 먼저 확인:
- next-intl 공식 "App Router · **i18n routing** setup"(defineRouting / createNavigation / createMiddleware / `[locale]/layout` / generateStaticParams / setRequestLocale).
- 우리 버전 `package.json`의 next-intl 버전에 맞는 문서. (WebSearch/문서 조회로 4.x App-Router-with-routing 예제 확인 후 그대로.)

## 만들/고칠 것 (구조)
1. **`i18n/routing.ts`** (신규): `defineRouting({ locales: ['ko'], defaultLocale: 'ko', localePrefix: 'as-needed' })`. ← **en은 710B에서 추가**. as-needed + 기본 ko라 ko엔 프리픽스 없음 = 기존 URL 그대로.
2. **`i18n/navigation.ts`** (신규): `createNavigation(routing)` → `Link`·`redirect`·`usePathname`·`useRouter`·`getPathname` export.
3. **`i18n/request.ts`** (수정): 고정 `'ko'` 제거 → `requestLocale` 기반(`hasLocale(routing.locales, …)` 폴백 `defaultLocale`). 메시지 import는 그대로.
4. **`proxy.ts`** (수정 — Next 16에서 middleware.ts의 새 이름): `createMiddleware(routing)` export + `config.matcher`. **matcher가 반드시 제외**: `/api/*`, `/_next/*`, `/_vercel/*`, 확장자 있는 정적파일, 그리고 기존 `sitemap`·`robots`·`og`·JSON-LD 관련 경로. (공식 matcher 예제 기반.)
5. **라우트 물리 이동**: `app/`의 **페이지 라우트 전부** → `app/[locale]/` 아래로. 
   - **그대로 두는 것(옮기지 말 것):** `app/api/*`, `app/globals.css`, `favicon`/`og.png` 등 정적 자산, `sitemap.ts`·`robots.ts` 등 메타 라우트(공식 가이드 따름).
   - **루트 레이아웃 처리:** next-intl 라우팅 패턴대로 `<html lang={locale}>`·`NextIntlClientProvider`·**Sentry/Vercel Analytics 배선**을 `app/[locale]/layout.tsx`로. `generateStaticParams`(routing.locales) + `setRequestLocale(locale)`로 **정적 렌더 유지**. 루트 `app/layout.tsx`는 공식 가이드가 지시하는 형태로(중복 `<html>` 금지).

## ⚠️ 이 스텝의 절대 성공 기준 = "안 변함"
- **URL 동일**: 모든 페이지가 지금과 **똑같은 경로**에서 200 (`/`, `/about`, `/stock/xxx`, `/advertise`, `/mypage`, `/auth/login`, `/coin`, `/favorites` …). **`/ko/` 프리픽스가 절대 안 붙어야** 함(as-needed).
- **화면 동일**: 육안 100% 그대로(한국어).
- **API 무손상**: `/api/advisors`·`/api/krx/ranking`·`/api/lens` 등 200 유지(라우트 이동 대상 아님).
- **SEO 무손상**: og·sitemap·robots 그대로.
- 빌드 green(정적 생성 페이지 수 유지), tsc 0, `IntlError` 0.

## ⚠️ 링크 churn 최소화 (중요)
ko 단독 + as-needed면 기존 `next/link`의 `href="/about"`은 **같은 URL로 그대로 해석됨**. → **이번엔 전체 Link를 `i18n/navigation`으로 바꾸지 말 것**(불필요한 대량 변경 = 리스크). 라우팅이 실제로 로케일을 요구하는 최소 지점만 조정. 나머지 링크 스왑은 710B/C(영어 켤 때)로.

## 작업 순서
1. `/clear` 후 시작. `package.json`에서 next-intl 버전 확인 → 그 버전 App-Router-**routing** 공식 예제 조회.
2. routing.ts·navigation.ts 신규, request.ts·proxy.ts 수정.
3. `app/` 페이지 라우트 → `app/[locale]/`로 이동(api·정적·메타 라우트 제외), 레이아웃 재배치(html/Provider/Sentry/Analytics + generateStaticParams + setRequestLocale).
4. `npm run build` → 정적 페이지 수·경로 확인. tsc 0.
5. dev(3333)로 **주요 경로 전수 클릭**: 홈·about·advertise·mypage·login·coin·favorites·stock 상세·정보탭(유사투자자문사)·6개국 보드 토글 — **URL에 `/ko` 안 붙고 화면 동일**, `IntlError` 0, `/api/*` 200.
6. 커밋:
```bash
git add -A && git commit -m "i18n(3/3a): app/[locale] 라우팅 구조 도입 (ko 단일·as-needed·URL/화면 0 변화·api/메타 라우트 유지)" && git push
```

## ⚠️ 실패 시
루트 레이아웃 `<html>` 중복, matcher가 `/api` 못 거름, generateStaticParams 누락(동적 렌더로 전락), proxy.ts 이름/위치 문제 등이 흔한 함정. 안 풀리면 **바로 롤백**(`git reset --hard fdfb753`) 후 원인 좁혀서 재시도 — 반쯤 옮긴 상태로 두지 말 것.

## 다음
- **710B:** `routing.ts`에 `'en'` 추가 + `messages/en.json`(ko 전 키 영어) → `/en/…` 영어 렌더 확인.
- **710C:** 언어 스위처(헤더) + en→US 시장 디폴트 정렬 + `generateMetadata`(709F에서 넘긴 title/JSON-LD 로컬라이즈).
