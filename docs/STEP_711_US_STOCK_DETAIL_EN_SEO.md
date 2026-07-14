<!-- 2026-07-14 -->
# STEP 711 — 종목상세 페이지 영어 SEO (US 풀뎁스 P0)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(locale 인지 메타데이터 + hreflang + 영어 JSON-LD + **ko byte 동일** 제약 — 판단 필요. `/clear` 후 시작.)
**목표:** `/en/stock/{symbol}`이 **영어** title·description·keywords·OG(en_US)·hreflang·영어 JSON-LD로 뜨게. `/stock/{symbol}`(ko)은 **byte 동일 유지**(SEO 무회귀). US가 영어 홈 시장인데 종목 SEO만 한국어였던 유일한 실질 갭.
**전제:** i18n 3단계 완료(HEAD `14c1813`·문서 감사분 `3ab7d74`). 이번엔 US 풀뎁스 감사 결과 P0.
**대상 파일:** `app/[locale]/stock/[symbol]/page.tsx` **한 파일만.**

---

## 배경 (감사 결과)
US는 이미 KR와 동급/더 깊음(렌즈 백분위·공시 심각도·link_hub 139). **유일한 실질 갭 = 종목상세 영어 SEO.** 현재 `generateMetadata`(17-54)·`StockPage`(56-93)가 `params`에서 `locale`을 안 읽어 → `/en/stock/AAPL`이 **한국어 title·OG ko_KR·한국어 breadcrumb**로 뜸. 홈/레이아웃(`app/[locale]/page.tsx`·`layout.tsx`)은 이미 locale 인지 메타데이터를 함 → **그 패턴을 종목상세에 복사.**

## ⚠️ 핵심 제약 3가지
1. **ko byte 동일**: `/stock/{KR·JP·CN·VN·GB symbol}`의 title·description·keywords·OG·breadcrumb 출력이 **지금과 100% 동일**해야 함(한국어 SEO는 이미 완성돼 있음 — 건드리면 회귀). 한국어 분기 = **현재 문자열 그대로** 재현.
2. **VN 분기 보존**: `isVN`이면 "공시" 없이 "뉴스"만(title·description·keywords). 이 조건을 **양쪽 로케일에** 유지.
3. **hreflang 패턴은 복사**: `alternates.languages`는 **`app/[locale]/page.tsx`의 generateMetadata에 이미 있는 패턴을 그대로 복사**(canonical + ko/en/x-default·`as-needed` 프리픽스 처리 포함). 직접 하드코딩하지 말 것(프리픽스 틀리기 쉬움). 경로만 `/stock/{symbol}`로 적응.

## 구현 방식 = 인라인 locale 분기 (메시지 카탈로그 아님)
- SEO 템플릿은 조건부(VN·hasName·en·공시유무)라 ICU 메시지로 빼면 지저분 → **`const isEn = locale === 'en'` 인라인 분기**로 ko/en 문자열 직접 구성. (i18n UI 문자열 규칙과 무관 — 이건 서버 SEO 템플릿. ko.json/en.json·messages.test 안 건드림.)

## 작업
### A. `generateMetadata` (17-54)
1. `params`를 **`{ locale, symbol }`** 로 받기(현재 `{ symbol }`만).
2. `const isEn = locale === 'en';`
3. **title** — ko(현재 그대로): `isVN ? \`${label} 주가·TR-AI 렌즈·뉴스\` : \`${label} 주가·TR-AI 렌즈·뉴스·공시\``. en:
   - 非VN: `\`${label} Stock Price · TR-AI Lens · News · Filings\``
   - VN: `\`${label} Stock Price · TR-AI Lens · News\``
4. **description** — ko 현재 그대로. en(브랜드 보이스 잠금·축약형 금지):
   - 非VN: `\`${name}${idPart} stock price with proven-method lenses (momentum, value, quality, F-Score) and the latest news and filings at a glance. Not a buy or sell signal — material for you to judge for yourself.\``
   - VN: `\`${name}${idPart} stock price with proven-method lenses (momentum, value, quality, F-Score) and the latest news at a glance. Not a buy or sell signal — material for you to judge for yourself.\``
5. **keywords** — ko 현재 그대로. en: `hasName ? [name, \`${name} stock\`, \`${name} forecast\`, \`${name} news\`, ...(isVN ? [] : [\`${name} filings\`]), ...(en ? [en] : []), ticker, "AI Lens", "Trillion"] : [ticker, "stock", "AI Lens", "Trillion"]`.
6. **openGraph.locale**: `isEn ? "en_US" : "ko_KR"`.
7. **alternates**: 홈 패턴 복사 → `canonical`(현 로케일 경로) + `languages`(ko:`/stock/${symbol}`·en:`/en/stock/${symbol}`·x-default). 홈이 `routing.locales`로 만드는 방식 그대로.
8. openGraph.title·twitter.title의 `| Trillion` 접미어는 유지(브랜드).

### B. `StockPage` JSON-LD (56-80)
1. `params`를 **`{ locale, symbol }`** 로.
2. breadcrumb 라벨 locale화: `홈`→en `"Home"`, `주식`→en `"Stocks"`(ko는 현재 그대로).
3. (선택) 그래프에 `inLanguage: isEn ? "en" : "ko"` 추가(홈 JSON-LD와 정합). Corporation 노드의 `name`은 데이터라 그대로.

## ⚠️ 함정
- **Turbopack**: 서버 컴포넌트(page.tsx) 변경은 HMR 안 됨 → **클린 재시작** `pkill -f "next dev"; rm -rf .next && npm run dev`(§5 gotcha).
- `symbol` 인코딩: 현재 canonical `/stock/${symbol}`(decoded) 그대로 — 점 든 코드(`7203.T`) 동일 처리.
- ko 분기는 **오타·중점(·)·띄어쓰기까지** 현재와 동일해야 함.

## 검증
1. `npm run build` + tsc 0 + vitest.
2. **ko 무회귀**(dev 3333): `/stock/005930`(삼성전자) 등 — `<title>`·description·OG `ko_KR`·breadcrumb "홈"/"주식"이 **변경 전과 동일**(curl로 before/after 대조 권장).
3. **en 신규**: `/en/stock/AAPL` — `<title>` 영어(Stock Price · TR-AI Lens · News · Filings)·`og:locale` **en_US**·`<link rel="alternate" hreflang>` **ko·en·x-default 존재**·JSON-LD breadcrumb **"Home"/"Stocks"**·description 영어.
4. VN: `/en/stock/VIC.VN` = "News"만(Filings 없음), `/stock/VIC.VN` ko="뉴스"만.
5. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "US P0: 종목상세 generateMetadata·JSON-LD locale 인지화 (영어 title·OG en_US·hreflang·영어 breadcrumb·ko byte 동일·VN 분기 보존)" && git push
```

## 다음 (US 잔여 — 선택)
P1 통화기호($·`StockLensClient` 상세 `<h1>`/가격을 `formatPrice`로) · P2 US IPO 구조화 피드·ETN 서브탭 · (보류) 인라인 증권사 광고=수익화.
