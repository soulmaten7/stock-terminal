<!-- 2026-07-07 -->
# STEP 635 — SEO ① 종목페이지 SSR 메타데이터 + 회사명 주입 + JSON-LD

> **문제(봇 시점 실측)**: `onetrillion.app/stock/005930.KS` 원시 HTML에 **회사명이 없음** — `<title>`·`<h1>`이 "005930"(코드)만. "삼성전자"는 JS 실행 후에야 뜸 → 구글이 "삼성전자 주가"로 못 찾음. 게다가 **모든 종목 메타가 루트 공통값**이라 구글 눈엔 수천 종목이 전부 같은 페이지(중복). JSON-LD도 0개.
>
> **해결**: `/stock/[symbol]`을 **서버 컴포넌트**로 전환.
> 1. `generateMetadata` — 종목명 기반 **유니크** title/description/canonical/OG (예: `삼성전자 (005930) 주가·AI 렌즈·뉴스·공시 | Trillion`).
> 2. 서버에서 이름 해석(`lib/stockName.ts`) → `<h1>`에 **initialName 주입** → 원시 HTML에 "삼성전자"가 박힘(봇이 봄).
> 3. **JSON-LD**(BreadcrumbList + Corporation·tickerSymbol) — 구글이 종목 정보 페이지로 이해.
>
> **Cowork이 이미 함** (tsc EXIT=0):
> - `lib/stockName.ts` (신규) — 심볼→표시명. KR=`kr_stock_snapshot` 조회, US/JP/CN/VN/GB=번들 JSON. 네트워크 최소.
> - `app/stock/[symbol]/page.tsx` (재작성) — 서버 컴포넌트. generateMetadata + JSON-LD + `<StockLensClient initialName={...} />`.
> - `app/stock/[symbol]/StockLensClient.tsx` (신규·기존 page.tsx 본문 이동) — `'use client'` 그대로. h1 폴백에 `initialName` 추가한 것 외 로직 동일.
>
> **전제**: STEP 634(`def0ba4`) 이후. 이 STEP은 **빌드 + 커밋만**.

## 0) 빌드 (제일 중요 — 서버/클라 분리가 깨지면 여기서 잡힘)
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error|/stock" | head -20
```
- ✅ 기대: `Compiled successfully`. `/stock/[symbol]`이 **ƒ (Dynamic)** 로 뜨면 정상(서버 렌더).
- ❌ `useParams`/`use client` 관련 에러가 나면 멈추고 알려줘.

## 1) 변경 파일 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "stockName|stock/\[symbol\]"
```
- 기대: `M app/stock/[symbol]/page.tsx` · `?? app/stock/[symbol]/StockLensClient.tsx` · `?? lib/stockName.ts`

## 2) 커밋 + push (이 4파일만 — 다른 미추적 파일은 건드리지 말 것)
```bash
cd ~/stock-terminal && git add lib/stockName.ts "app/stock/[symbol]/page.tsx" "app/stock/[symbol]/StockLensClient.tsx" docs/STEP_635_COMMAND.md && git commit -m "seo(stock): 종목페이지 SSR 전환 — 종목명 기반 generateMetadata + h1 이름주입 + JSON-LD(Breadcrumb·Corporation)" && git push
```

## 3) (배포 후) Cowork이 라이브 검증 — STEP 638에서
- 원시 HTML `<title>`·`<h1>`에 회사명(삼성전자·Apple 등) 뜨는지 · canonical · JSON-LD 존재.
- 화면 동작(렌즈 카드·브리핑) 그대로인지.

## ✅ 완료 시 → SEO ② STEP 636: **sitemap 전 종목 확장**(봇이 수천 종목 페이지를 발견하도록).
