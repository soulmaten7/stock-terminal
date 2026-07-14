<!-- 2026-07-14 -->
# STEP 722 — Tier 3: 뉴스브리핑(R3) 영어 (`/api/news-brief`)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(LLM 프롬프트 + **한국어 강제 후처리 게이팅** + 캐시 컬럼 정확성 + KR byte 동일. `/clear` 후.)
**목표:** `/en` 뉴스요약을 **영어 생성 + `summary_en`/`tags_en`에 on-demand 캐시**. ko 경로(프롬프트·후처리·`summary_ko`/`tags`)는 **완전 불변**.
**전제:** STEP 721(`e34fee3`). **news_briefs 스키마 이미 라이브 적용**(MCP·`tags_en` 추가·`summary_ko`+`tags` nullable — 720이 tags_en 누락 + en-first NOT NULL 벽 교정). Claude Code는 기록 파일만.
**대상:** `app/api/news-brief/route.ts`(주) + 클라 fetch 1곳.

---

## 0. 스키마 기록 (이미 라이브·파일만 생성)
`supabase/migrations/20260714_news_briefs_en_columns.sql` 생성(내용):
```sql
-- Tier 3 R3 news-brief en: tags_en 추가(720 누락) + en-first INSERT 위해 ko 컬럼 nullable.
ALTER TABLE public.news_briefs ADD COLUMN IF NOT EXISTS tags_en jsonb;
ALTER TABLE public.news_briefs ALTER COLUMN summary_ko DROP NOT NULL;
ALTER TABLE public.news_briefs ALTER COLUMN tags       DROP NOT NULL;
-- (라이브 적용됨 via Supabase MCP · 이 파일 = repo 기록.)
```

## 🔒 절대 규칙
- **KR byte 동일**: ko 경로 = `summary_ko`/`tags` read/write·ko `SYSTEM`·유저 프롬프트·**후처리 1·2·3 전부 현행**.
- **캐시 컬럼 분리**: en=`summary_en`/`tags_en`, ko=`summary_ko`/`tags`. upsert payload엔 **해당 로케일 컬럼만**(반대 안 지움).
- **on-demand**: en 첫 조회만 생성.

## 작업 — `app/api/news-brief/route.ts`
1. **lang 수용**: `const locale = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko';`
2. **캐시**: en → `.select('summary_en, tags_en')`, `if (hit?.summary_en) return {summary: hit.summary_en, tags: hit.tags_en || [], cached:true}` / ko → 현행(`summary_ko, tags`).
3. **뉴스 fetch(:43~72) 그대로** — 종목 시장 기준 로컬 뉴스 획득(요약 *언어*만 바뀜). US(en 주 케이스)는 이미 영어 뉴스. (로컬 0건 영어 재시도 폴백도 유지.)
4. **프롬프트**: `locale==='en' ? SYSTEM_EN : SYSTEM`(ko 불변). 유저 프롬프트 en판(아래).
5. **⚠️ 후처리 게이팅**:
   - **후처리1**(`:102~120`·비한국어→한국어 번역): **`if (locale === 'ko') { ... }`** 로 감쌈 → en 건너뜀(영어 프롬프트라 이미 영어·재번역 불필요).
   - **후처리2**(`:122~129`·옛 연도 문장 제거): **양쪽 유지**(언어중립 — 문장분리 `[.!?。]`가 영어도 처리·옛기사 재순환 방어는 en도 필요).
   - **후처리3**(`:131~136`·원→엔/위안/동/파운드): **`if (locale === 'ko') { ... }`** 로 감쌈 → en 건너뜀(영어 요약엔 '원' 없음).
6. **upsert**: en → `{ symbol, as_of, summary_en: summary, tags_en: tags, model }` / ko → 현행. onConflict 그대로. (계산 키 or 분기.)
7. 반환 `{ summary, tags, cached }`.

### 🔒 SYSTEM_EN (그대로 — 가드레일 잠금·한국어판과 대칭)
```
You pick ONLY concrete events/facts that actually happened from a stock's recent news headlines and convey them to individual investors.
Eligible events: earnings releases (revenue/profit figures, earnings surprises), new product/service launches, contracts/orders/partnerships signed, M&A, executive/board changes, litigation/regulatory decisions, filing/submission facts.
【ABSOLUTELY FORBIDDEN — do not include a single word of the following in summary, even if it is in a headline】: (A) Analyst/brokerage opinions: target price, price target, fair value, rating, investment opinion, upgrade, downgrade, overweight, buy/sell recommendation, neutral. (B) Valuation judgments: overvalued, undervalued, fair value, expensive, cheap, premium. (C) Price/direction forecasts: will rise or fall, upside/downside outlook, bullish/bearish outlook, "expected to," "likely to," "anticipated." (D) News with only investor-sentiment or institutional-position changes: a report that an institution bought or sold shares (position only, without an earnings/filing event).
Ignore headlines that contain only the above types. Do not stitch or causally link content from different articles or companies — write each fact exactly as confirmed in its individual headline (omit uncertain links). If there is not a single concrete event, leave summary as an empty string ("").
Write summary in English — even if headlines are Korean, Japanese, or Chinese, render them into English. Plain professional English, 2-3 sentences. Tags in English too. Tags = event topics only (e.g., earnings, product, contract, personnel, litigation, regulation) — no stock-price, target-price, outlook, or investor-interest tags. Render company/product names in standard English. Keep currency and units as in the source.
Output JSON only: {"summary":"...","tags":["...","..."]}
```
### 유저 프롬프트 en (`:85` 대응)
```
Today is ${today}. Below are news headlines for ${label}. Rules: (1) summary and tags must be in English (render Korean/Japanese/Chinese headlines into English). (2) Only recent events (within ~2 months) — exclude old content with explicit past years (e.g., 2023) such as stale earnings/figures. (3) If there is no concrete event, leave summary empty.

${headlines}
```

## 클라
`app/[locale]/stock/[symbol]/StockLensClient.tsx`의 `StockNewsBrief` fetch(`/api/news-brief?symbol=...`·~`:719`)에 `&lang=${locale}`(`useLocale()` 이미 있음).

## ⚠️ 함정
- **후처리1·3을 안 감싸면** en 요약이 한국어로 재번역되거나(1) 훼손 → 영어 안 나옴. 반드시 ko 게이팅.
- upsert가 반대 컬럼(summary_ko/tags) null 안 만드는지 실측(721 교훈·컬럼 독립).
- Turbopack API 변경 → `NEXT_DIST_DIR=.next-verify npm run build`(dev 보호).

## 검증 (양쪽·3중)
1. `tsc` 0 · `NEXT_DIST_DIR=.next-verify npm run build` · vitest.
2. **KR 무회귀**(dev): `/stock/005930` 뉴스요약 = 한국어(기존 `summary_ko` 히트·현행 동일)·태그 한국어.
3. **en 신규**: `/en/stock/MU` 뉴스요약 = **영어** 생성·태그 영어·재조회 `cached:true`(summary_en 히트)·가드레일(목표가·전망·투자의견 없음). DB에 `summary_en`/`tags_en` 채워지고 `summary_ko`/`tags`는 독립 유지.
4. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "i18n(Tier3·R3): /api/news-brief 영어(영어 프롬프트+summary_en/tags_en+한국어 강제 후처리 ko 게이팅·KR byte 동일·컬럼 독립)" && git push
```

## 다음
- **723**: 공시요약(R1) 6라우트(`events/summary`·`kr/jp/cn/gb/vn-events/summary`) 영어 프롬프트 + `filing_summaries.summary_en`. ⚠️ **`filing_summaries.summary_ko`는 아직 NOT NULL** → DROP NOT NULL 먼저(721·722와 동일 벽).
- 그 후 = Tier 3 완결 → `/en` 로고 빼고 100% 영어. 문서 동기화(Cowork).
