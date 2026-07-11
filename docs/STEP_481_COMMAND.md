<!-- 2026-07-01 -->
# STEP 481 — 일본 모아보기 피드 (Google News ja · 뉴스+기업재무+리포트+ETF+공모주)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_481_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (3파일: news route · NewsFeed · ToolboxClient)
일본 탭 5개 피드 탭에 라이브 피드. **STEP 473(미국) 미러 — Google News를 일본어 로케일(`hl=ja&gl=JP`)로.** 기존 US `googleNewsUS`를 로케일 인자 받는 `googleNews`로 일반화해 재사용.
- 적용 탭: 뉴스·기업재무(analysis)·리포트(research)·ETF·공모주(ipo).
- 공시(EDINET)·거시(BOJ)는 별도 통합 → 다음 STEP(현재 일본은 이 탭들에서 링크만).
- ⚠️ **API 라우트 변경 → 클린 재시작 필요.**

---

## 1) `app/api/news/feed/route.ts`

### 1-A. `googleNewsUS` → 로케일 인자 받는 `googleNews`로 일반화
**찾을 것:**
```ts
async function googleNewsUS(query: string): Promise<NewsItem[]> {
  const url =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=en-US&gl=US&ceid=US:en";
```
**바꿀 것:**
```ts
async function googleNews(query: string, hl = "en-US", gl = "US", ceid = "US:en"): Promise<NewsItem[]> {
  const url =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=" + hl + "&gl=" + gl + "&ceid=" + ceid;
```

### 1-B. US 분기의 호출부 함수명 갱신
**찾을 것:**
```ts
      const items = await googleNewsUS(q);
```
**바꿀 것:**
```ts
      const items = await googleNews(q, "en-US", "US", "US:en");
```

### 1-C. JP 분기 추가 (US 분기와 KR 분기 사이)
**찾을 것:**
```ts
  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
```
**바꿀 것:** (앞에 JP 분기 삽입)
```ts
  // ── JP 분기(Google News, 일본어) ──
  if (market === "JP") {
    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    const key = "JP:" + q;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 15 * 60 * 1000) return NextResponse.json(hit.data);
    try {
      const items = await googleNews(q || "日経平均 株式市場 日本株", "ja", "JP", "JP:ja");
      const data = { items };
      cache.set(key, { at: Date.now(), data });
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }

  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
```

---

## 2) `components/toolbox/NewsFeed.tsx`

### 2-A. country prop 타입에 'JP'
**찾을 것:**
```tsx
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' }) {
```
**바꿀 것:**
```tsx
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' | 'JP' }) {
```

### 2-B. isJp + url + cacheKey
**찾을 것:**
```tsx
  const isUs = country === 'US';
  const url = isUs
    ? '/api/news/feed?market=US' + (query ? '&q=' + encodeURIComponent(query) : '')
    : '/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : '');
  const cacheKey = isUs ? 'news:us:' + (query ?? '') : 'news:' + (query ?? '');
```
**바꿀 것:**
```tsx
  const isUs = country === 'US';
  const isJp = country === 'JP';
  const url = isJp
    ? '/api/news/feed?market=JP' + (query ? '&q=' + encodeURIComponent(query) : '')
    : isUs
    ? '/api/news/feed?market=US' + (query ? '&q=' + encodeURIComponent(query) : '')
    : '/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : '');
  const cacheKey = 'news:' + country + ':' + (query ?? '');
```

### 2-C. 출처 푸터에 일본 추가
**찾을 것:**
```tsx
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{isUs ? (query ? '출처: Google News. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : '출처: Yahoo Finance (S&P 500). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.') : '출처: 네이버 뉴스 검색. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.'}</p>
```
**바꿀 것:**
```tsx
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{isJp ? '출처: Google News (일본). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : isUs ? (query ? '출처: Google News. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : '출처: Yahoo Finance (S&P 500). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.') : '출처: 네이버 뉴스 검색. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.'}</p>
```

---

## 3) `components/toolbox/ToolboxClient.tsx`

### 3-A. `FEED_COUNTRY_SUPPORT` — 5탭에 'JP' 추가
**찾을 것:**
```tsx
  news: ['KR', 'US'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US'], research: ['KR', 'US'], etf: ['KR', 'US'], ipo: ['KR', 'US'],
```
**바꿀 것:** (공시·거시는 KR/US 유지 — EDINET·BOJ 다음 STEP)
```tsx
  news: ['KR', 'US', 'JP'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP'], research: ['KR', 'US', 'JP'], etf: ['KR', 'US', 'JP'], ipo: ['KR', 'US', 'JP'],
```

### 3-B. `feedFor` — 일본 가드 제거 + JP 분기 추가
**찾을 것:**
```tsx
function feedFor(tab: string, country: Country) {
  if (country === 'JP') return null; // 일본 피드는 후속 STEP
  switch (tab) {
```
**바꿀 것:**
```tsx
function feedFor(tab: string, country: Country) {
  switch (tab) {
```

**찾을 것 (analysis):**
```tsx
    case 'analysis': return country === 'US'
      ? <NewsFeed country="US" query="US stock company earnings results" title="미국 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
```
**바꿀 것:**
```tsx
    case 'analysis': return country === 'US'
      ? <NewsFeed country="US" query="US stock company earnings results" title="미국 실적·기업 뉴스" />
      : country === 'JP'
      ? <NewsFeed country="JP" query="決算 業績 日本株" title="일본 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
```

**찾을 것 (research):**
```tsx
    case 'research': return country === 'US'
      ? <NewsFeed country="US" query="stock analyst rating price target upgrade downgrade" title="미국 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
```
**바꿀 것:**
```tsx
    case 'research': return country === 'US'
      ? <NewsFeed country="US" query="stock analyst rating price target upgrade downgrade" title="미국 애널리스트·리포트 뉴스" />
      : country === 'JP'
      ? <NewsFeed country="JP" query="アナリスト 目標株価 レーティング" title="일본 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
```

**찾을 것 (etf):**
```tsx
    case 'etf': return country === 'US'
      ? <NewsFeed country="US" query="ETF fund inflows stock market" title="미국 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
```
**바꿀 것:**
```tsx
    case 'etf': return country === 'US'
      ? <NewsFeed country="US" query="ETF fund inflows stock market" title="미국 ETF·펀드 뉴스" />
      : country === 'JP'
      ? <NewsFeed country="JP" query="ETF 投資信託 日本" title="일본 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
```

**찾을 것 (ipo):**
```tsx
    case 'ipo': return country === 'US'
      ? <NewsFeed country="US" query="IPO stock market debut listing" title="미국 IPO·공모 뉴스" />
      : <OfferingsFeed />;
```
**바꿀 것:**
```tsx
    case 'ipo': return country === 'US'
      ? <NewsFeed country="US" query="IPO stock market debut listing" title="미국 IPO·공모 뉴스" />
      : country === 'JP'
      ? <NewsFeed country="JP" query="IPO 新規上場 日本" title="일본 IPO·공모 뉴스" />
      : <OfferingsFeed />;
```

---

## 4) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 5) 검증 (localhost:3333)
- [ ] 🇯🇵 일본 → **뉴스** 탭: 일본어 시장 뉴스(日経·各紙) 모아보기 표시.
- [ ] **기업·재무 / 리포트 / ETF·펀드 / 공모주·배당**: 각각 일본어 토픽 뉴스(決算·目標株価·ETF·IPO) 표시.
- [ ] 공시·신용 / 거시경제 = 아직 링크만(다음 STEP).

## 6) 커밋
```bash
git add app/api/news/feed/route.ts components/toolbox/NewsFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(jp): 일본 모아보기 피드 — Google News 일본어(뉴스+기업재무+리포트+ETF+공모주) (STEP 481)" && git push
```

## ⚠️ 다음 (일본 완성까지)
- **공시(EDINET) 피드** + **거시(BOJ/e-Stat) 피드** — 각 전용 라우트/컴포넌트(SecFeed·MacroFeed 미러).
- **인덱스 티커 닛케이225(`^N225`)** 추가 · 마감 점검.
