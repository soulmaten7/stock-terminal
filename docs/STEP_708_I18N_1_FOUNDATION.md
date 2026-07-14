<!-- 2026-07-14 -->
# STEP 708 — i18n 1/3단계: 기반 스캐폴드 (라우팅 X · 겉모습 변화 0)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(next.config의 Sentry 래퍼 합성 + 루트 layout provider를 **기존 배선 안 깨게** 판단해야 함)
**목표:** next-intl **시스템만** 배선. 한국어 고정·라우팅 X·**화면 0 변화.** 이후 문자열을 여기에 담고(2단계), 마지막에 [locale] 라우팅+영어+시장디폴트(3단계).
**전제:** 최신 main. next-intl 미설치. (공식 next-intl v4 문서로 검증한 셋업)

---

## 전체 3단계 계획 (안 깨지게)
- **1단계(이번):** install + `i18n/request.ts`(ko 고정) + `next.config` 플러그인 + 루트 layout provider + `messages/ko.json`. **화면 0 변화.**
- **2단계(STEP 709):** 하드코딩 한국어 문자열을 `messages/ko.json`으로 **점진 이관**(Header·about 등 컴포넌트 그룹별) + `useTranslations`/`getTranslations`. 여전히 한국어·화면 0 변화.
- **3단계(STEP 710·집중 세션):** `i18n/routing.ts`+`proxy.ts`(구 middleware)+`navigation.ts` + **`app/`의 모든 라우트를 `app/[locale]/`로 이동** + `en.json` + 언어 스위처 + **로케일→기본 시장·탭순서 매핑**(en-US→US 디폴트). ← 모든 라우트 건드리는 프로젝트 최대 변경이라 반드시 집중 세션에서.

---

## 1단계 작업 (안전 — 라우팅 절대 X)
> ⚠️ 먼저 `next.config.ts`와 `app/layout.tsx`를 **읽고**, 기존 **Sentry·Vercel Analytics·metadata·`<html lang>`** 배선을 **보존**하며 아래를 합성할 것. 라우트 파일은 하나도 옮기지 마라.

### 1. 설치
```bash
cd ~/stock-terminal && npm install next-intl
```

### 2. `messages/ko.json` (신규 — 스타터 1키만, 실제 이관은 2단계)
```json
{
  "Common": { "appName": "트릴리언" }
}
```

### 3. `i18n/request.ts` (신규 — 프로젝트 루트)
```ts
import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = 'ko'; // 3단계에서 [locale] 세그먼트로 대체
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```
> 경로 주의: 루트 `i18n/request.ts` → `../messages/ko.json`. (next-intl은 루트 `./i18n/request.ts`를 자동 인식)

### 4. `next.config.ts` — next-intl 플러그인 합성 (Sentry **보존**)
현재 export는 `withSentryConfig(nextConfig, {...})` 형태일 것. `createNextIntlPlugin`을 추가하고 **안쪽에** 합성:
```ts
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin(); // 기본 ./i18n/request.ts 인식

// ... 기존 nextConfig 그대로 ...

// 기존: export default withSentryConfig(nextConfig, {...sentry})
// 변경: withNextIntl을 안쪽에 끼움
export default withSentryConfig(withNextIntl(nextConfig), {/* 기존 Sentry 옵션 그대로 */});
```
> 둘 다 `NextConfig`를 받아 `NextConfig`를 반환하는 래퍼라 합성 가능. **기존 Sentry 조건부 래핑·옵션을 그대로 두고** withNextIntl만 안쪽에 추가. (Sentry가 조건부면 그 조건 유지)

### 5. `app/layout.tsx` — 루트 provider
`NextIntlClientProvider`로 `<body>` 안 children을 감싼다. **기존 내용(Analytics·기타)은 그대로.**
```tsx
import {NextIntlClientProvider} from 'next-intl';
// ...
<body className="...기존...">
  <NextIntlClientProvider>
    {/* 기존 body 내부 전체(children·<Analytics/> 등) 그대로 이 안으로 */}
  </NextIntlClientProvider>
</body>
```
> v4는 provider가 request config에서 locale·messages를 **자동 취득**(별도 prop 불필요). `<html lang="ko">` 등 보존.

### 6. 빌드 + 검증 (화면 0 변화여야 함)
```bash
npm run build
```
- 빌드 성공. **문자열 이관을 안 했으니 앱은 이전과 100% 동일**해야 함(라우팅·URL·화면 변화 없음).

### 7. 커밋
```bash
git add -A && git commit -m "i18n(1/3): next-intl 기반 스캐폴드 — request.ts(ko 고정)·next.config 플러그인 합성(Sentry 보존)·루트 provider·messages/ko.json (라우팅 X·겉모습 변화 0)" && git push
```

## 다음
STEP 709(2/3): Header·about 등 문자열을 `messages/ko.json`으로 그룹별 이관 + `useTranslations`. 여전히 한국어·화면 0. → 그 후 STEP 710(3/3, 집중 세션): [locale] 라우팅 + 영어 + 시장 디폴트.
