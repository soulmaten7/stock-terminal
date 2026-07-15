<!-- 2026-07-15 -->
# STEP 727 — 정적 페이지 메타 타이틀 로케일화 (`/en` 탭·SEO 타이틀 한글 잔재 제거)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(기계적 패턴·정확한 before/after 제공. Sonnet. `/clear` 후.)

**목표:** 라이브 QA 스윕에서 발견 — `/en`의 유틸리티 페이지 6종이 **본문은 영어인데 브라우저 탭/SEO `<title>`만 한글**. 원인 = `export const metadata = { title: "한글" }` **정적 하드코딩**이 로케일을 안 따라감(710D/711의 generateMetadata 로케일화가 홈·종목상세만 커버했음). STEP 711 선례(인라인 로케일 분기 = "SEO 템플릿이라 메시지 카탈로그 아님")대로 `generateMetadata`로 전환.

**전제:** HEAD `a572923`(문서) 또는 그 이후. 코드 HEAD = `6bccc45`(710E). 실패 시 해당 파일만 `git checkout`.

**대상 6개(본문 `getTranslations` 사용=영어화됨):** `about`·`advertise`·`feedback`·`favorites`·`business`·`coin`.
**제외(의도적 한글 유지·건드리지 말 것):** `privacy`·`terms`(법률문서 번역 제외)·`admin`(admin i18n 제외).

---

## 🔑 방식 — STEP 711 패턴(인라인 로케일 분기·ko byte 동일)
`export const metadata = {...}` → `export async function generateMetadata({ params })`로 바꿔 **en만 영어, ko는 기존 문자열 그대로**(byte 동일). 메시지 카탈로그(ko.json/en.json) **건드리지 않음**(SEO 타이틀은 711처럼 인라인).

### 1) `app/[locale]/about/page.tsx` (line 4)
```ts
// 삭제
export const metadata = { title: "서비스 소개" };
// 추가
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "en" ? "About" : "서비스 소개" };
}
```

### 2) `app/[locale]/feedback/page.tsx` (line 6~9 · **robots noindex 보존**)
```ts
// 삭제
export const metadata: Metadata = {
  title: "베타 피드백",
  robots: { index: false, follow: false },
};
// 추가 (import type { Metadata } 는 그대로 둠)
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Beta feedback" : "베타 피드백",
    robots: { index: false, follow: false },
  };
}
```

### 3) `app/[locale]/favorites/page.tsx` (line 7)
```ts
// 삭제
export const metadata = { title: '즐겨찾기' };
// 추가
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "en" ? "Favorites" : "즐겨찾기" };
}
```

### 4) `app/[locale]/advertise/page.tsx` (line 7)
```ts
// 삭제
export const metadata: Metadata = { title: "광고 안내·문의" };
// 추가 (import type { Metadata } 그대로)
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "en" ? "Advertising · Inquiries" : "광고 안내·문의" };
}
```

### 5) `app/[locale]/business/page.tsx` (line 8)
```ts
// 삭제
export const metadata = { title: "리딩방 등록·관리 — 트릴리언" };
// 추가 (BusinessPage()는 params 안 받지만 generateMetadata는 자체 params 받음 — 페이지 본문 불변)
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "en" ? "Advisory registration · management" : "리딩방 등록·관리 — 트릴리언" };
}
```

### 6) `app/[locale]/coin/page.tsx` (line 4)
```ts
// 삭제
export const metadata = { title: "코인 — 트릴리언 (준비 중)" };
// 추가
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "en" ? "Coin (coming soon)" : "코인 — 트릴리언 (준비 중)" };
}
```

## ⚠️ 주의
- **각 페이지에 `export const metadata`와 `generateMetadata`가 동시에 있으면 안 됨** — 반드시 기존 `metadata` 줄/블록을 **삭제**하고 함수로 교체.
- `export const dynamic = "force-dynamic"`·`export const runtime`·본문(default export)·`getTranslations`·`setRequestLocale`·`import` 전부 **그대로**.
- **ko 타이틀 문자열은 기존과 1글자도 다르지 않게**(byte 동일 — 위 코드에 이미 원문 그대로 넣음). en만 새로.
- **privacy·terms·admin·그 외 페이지는 손대지 말 것.**
- `import type { Metadata }` 있는 파일(feedback·advertise)은 반환타입 `: Promise<Metadata>` 유지, 없는 파일은 타입 생략(추론).

## 검증
1. `npx tsc --noEmit` → 0.
2. `NEXT_DIST_DIR=.next-verify npm run build` → 성공(6개 라우트 컴파일·메타 충돌 에러 없음). 끝나면 `.next-verify` 삭제.
3. `npx vitest run` → 전체 통과(49/49 유지·메시지 패리티 무영향).
4. dev 스모크(포트 3000/3333):
   - `/en/about` `<title>` = **About | Trillion**(영어) · `/about` = **서비스 소개 | Trillion**(byte 동일).
   - `/en/favorites`=**Favorites | Trillion** · `/en/advertise`=**Advertising · Inquiries | Trillion** · `/en/feedback`=**Beta feedback | Trillion** · `/en/coin`=**Coin (coming soon) | Trillion** · `/en/business`=**Advisory registration · management | Trillion**.
   - ko 각각 = 기존 한글 타이틀 그대로.
   - `/en/terms`·`/en/privacy` = **여전히 한글**(의도적·불변) 확인.
   - `curl -s http://localhost:3000/about | grep -o '<title>[^<]*'` 로 ko byte 대조(변형 0).
5. `IntlError`·빌드 경고 0.

## 커밋
```bash
git add -A && git commit -m "i18n(727): 정적 페이지 6종 메타 타이틀 로케일화 — about·advertise·feedback·favorites·business·coin generateMetadata(en 영어·ko byte 동일·711 패턴)·robots 보존·terms/privacy/admin 제외" && git push
```

## 배경 (QA 스윕 발견)
2026-07-15 출시 전 라이브 QA 스윕(브라우저 8페이지 전수)에서 유일하게 나온 실이슈. 나머지(홈·종목상세 6개국·about 본문·KR 전면·로그인 왕복·통화·title-case)는 전부 클린. 교훈 = **i18n 로케일화 시 `export const metadata` 정적 export도 `generateMetadata`로 전환해야 함**(710D/711이 홈·종목만 해서 유틸 페이지 누락). `docs/LENS_DEV_PLAYBOOK.md` 후보 교훈.

## 다음 (쭉)
- 727 후 = i18n 잔재 0 재확인(라이브 /en 유틸 페이지 타이틀). 그 다음 = 다크 폴리시 D(죽은 shadow 정리) · US 시장 뎁스(P2) · 클로즈드 베타.
