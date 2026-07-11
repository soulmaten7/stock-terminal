<!-- 2026-07-01 -->
# STEP 491 — 중국·홍콩 탭 배관 (국가 토글 CN 추가 + 링크허브 노출 + 중화권 뉴스피드 + 지수바)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_491_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (5파일)
JP와 동일한 국가탭 플레이북으로 **중국(CN) 탭**을 켠다. link_hub CN 59행은 이미 삽입됨(Cowork). 이 STEP은 배관만:
1. `stores/countryStore.ts` — Country 유니온에 'CN'
2. `components/toolbox/ToolboxClient.tsx` — 토글·라벨·피드지원·feedFor·마켓렌더
3. `components/toolbox/NewsFeed.tsx` — CN 로케일
4. `app/api/news/feed/route.ts` — CN 분기(Google News 중화권 + 한국어 번역)
5. `app/api/yahoo/indices/route.ts` — 하단 지수바에 항셍·CSI300·USD/CNY
- **종목보드는 STEP 492**에서. 이 STEP은 마켓 탭에 "준비 중" 플레이스홀더.
- ⚠️ API 라우트 수정 → 클린 재시작 필수.

---

## 1) `stores/countryStore.ts`
**찾을 것:**
```ts
export type Country = 'KR' | 'US' | 'JP';
```
**바꿀 것:**
```ts
export type Country = 'KR' | 'US' | 'JP' | 'CN';
```

---

## 2) `components/toolbox/ToolboxClient.tsx` (5곳)

**2-A. 국가 토글.** 찾을 것:
```tsx
  { code: 'JP', label: '🇯🇵 일본' },
];
```
**바꿀 것:**
```tsx
  { code: 'JP', label: '🇯🇵 일본' },
  { code: 'CN', label: '🇨🇳 중국' },
];
```

**2-B. 피드 지원 국가.** 찾을 것:
```tsx
  news: ['KR', 'US', 'JP'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP'], research: ['KR', 'US', 'JP'], etf: ['KR', 'US', 'JP'], ipo: ['KR', 'US', 'JP'],
```
**바꿀 것:**
```tsx
  news: ['KR', 'US', 'JP', 'CN'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP', 'CN'], research: ['KR', 'US', 'JP', 'CN'], etf: ['KR', 'US', 'JP', 'CN'], ipo: ['KR', 'US', 'JP', 'CN'],
```

**2-C. feedFor — analysis.** 찾을 것:
```tsx
      : country === 'JP'
      ? <NewsFeed country="JP" query="決算 業績 日本株" title="일본 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
```
**바꿀 것:**
```tsx
      : country === 'JP'
      ? <NewsFeed country="JP" query="決算 業績 日本株" title="일본 실적·기업 뉴스" />
      : country === 'CN'
      ? <NewsFeed country="CN" query="業績 財報 港股 A股" title="중화권 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
```

**2-D. feedFor — research.** 찾을 것:
```tsx
      : country === 'JP'
      ? <NewsFeed country="JP" query="アナリスト 目標株価 レーティング" title="일본 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
```
**바꿀 것:**
```tsx
      : country === 'JP'
      ? <NewsFeed country="JP" query="アナリスト 目標株価 レーティング" title="일본 애널리스트·리포트 뉴스" />
      : country === 'CN'
      ? <NewsFeed country="CN" query="目標價 評級 券商 港股" title="중화권 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
```

**2-E. feedFor — etf.** 찾을 것:
```tsx
      : country === 'JP'
      ? <NewsFeed country="JP" query="ETF 投資信託 日本" title="일본 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
```
**바꿀 것:**
```tsx
      : country === 'JP'
      ? <NewsFeed country="JP" query="ETF 投資信託 日本" title="일본 ETF·펀드 뉴스" />
      : country === 'CN'
      ? <NewsFeed country="CN" query="ETF 基金 港股 A股" title="중화권 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
```

**2-F. feedFor — ipo.** 찾을 것:
```tsx
      : country === 'JP'
      ? <NewsFeed country="JP" query="IPO 新規上場 日本" title="일본 IPO·공모 뉴스" />
      : <OfferingsFeed />;
```
**바꿀 것:**
```tsx
      : country === 'JP'
      ? <NewsFeed country="JP" query="IPO 新規上場 日本" title="일본 IPO·공모 뉴스" />
      : country === 'CN'
      ? <NewsFeed country="CN" query="新股 IPO 上市 港股" title="중화권 IPO·공모 뉴스" />
      : <OfferingsFeed />;
```

**2-G. countryLabel.** 찾을 것:
```tsx
  const countryLabel = ({ KR: '한국', US: '미국', JP: '일본' } as Record<Country, string>)[country];
```
**바꿀 것:**
```tsx
  const countryLabel = ({ KR: '한국', US: '미국', JP: '일본', CN: '중국' } as Record<Country, string>)[country];
```

**2-H. 마켓 렌더(종목보드 STEP 492 전까지 플레이스홀더).** 찾을 것:
```tsx
          ) : country === 'US' ? (
            <UsMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <JpMarketBoard isLoggedIn={isLoggedIn} />
          )
```
**바꿀 것:**
```tsx
          ) : country === 'US' ? (
            <UsMarketBoard isLoggedIn={isLoggedIn} />
          ) : country === 'JP' ? (
            <JpMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇨🇳" title="중국·홍콩 종목보드 — 준비 중" desc="곧 제공됩니다" />
          )
```

---

## 3) `components/toolbox/NewsFeed.tsx` (3곳)

**3-A. prop 타입.** 찾을 것:
```tsx
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' | 'JP' }) {
```
**바꿀 것:**
```tsx
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' | 'JP' | 'CN' }) {
```

**3-B. URL 구성.** 찾을 것:
```tsx
  const isUs = country === 'US';
  const isJp = country === 'JP';
  const url = isJp
    ? '/api/news/feed?market=JP' + (query ? '&q=' + encodeURIComponent(query) : '')
    : isUs
    ? '/api/news/feed?market=US' + (query ? '&q=' + encodeURIComponent(query) : '')
    : '/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : '');
```
**바꿀 것:**
```tsx
  const isUs = country === 'US';
  const isJp = country === 'JP';
  const isCn = country === 'CN';
  const url = isCn
    ? '/api/news/feed?market=CN' + (query ? '&q=' + encodeURIComponent(query) : '')
    : isJp
    ? '/api/news/feed?market=JP' + (query ? '&q=' + encodeURIComponent(query) : '')
    : isUs
    ? '/api/news/feed?market=US' + (query ? '&q=' + encodeURIComponent(query) : '')
    : '/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : '');
```

**3-C. 출처 안내문.** 찾을 것:
```tsx
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{isJp ? '출처: Google News (일본). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : isUs ?
```
**바꿀 것:**
```tsx
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{isCn ? '출처: Google News (중화권). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : isJp ? '출처: Google News (일본). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : isUs ?
```

---

## 4) `app/api/news/feed/route.ts` — CN 분기 추가
**찾을 것:**
```ts
  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
```
**바꿀 것(앞에 CN 블록 삽입):**
```ts
  // ── CN 분기(Google News, 중화권·번체) — JP와 동일 패턴 + 한국어 번역 ──
  if (market === "CN") {
    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    const key = "CN:" + q;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 15 * 60 * 1000) return NextResponse.json(hit.data);
    try {
      const items = await googleNews(q || "港股 恒生指數 A股 中國股市", "zh-HK", "HK", "HK:zh-Hant");
      const data = { items: await translateTitles(items, "ko") };
      cache.set(key, { at: Date.now(), data });
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }

  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
```

---

## 5) `app/api/yahoo/indices/route.ts` — 하단 지수바에 중화권 추가
**찾을 것:**
```ts
  { symbol: "JPY=X", name: "USD/JPY" },
```
**바꿀 것:**
```ts
  { symbol: "JPY=X", name: "USD/JPY" },
  { symbol: "^HSI", name: "Hang Seng" },
  { symbol: "000300.SS", name: "CSI 300" },
  { symbol: "CNY=X", name: "USD/CNY" },
```

---

## 6) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 7) 검증 (localhost:3333)
```bash
# CN 뉴스 피드(번역) — items 20개, title이 한국어로 오는지
curl -s "http://localhost:3333/api/news/feed?market=CN" | python3 -c "import sys,json; d=json.load(sys.stdin); its=d.get('items',[]); print('CN news', len(its)); [print('-', x['title'][:40], '|', x['source']) for x in its[:5]]"
# 지수바에 항셍/CSI300/USDCNY 들어왔는지
curl -s "http://localhost:3333/api/yahoo/indices" | python3 -c "import sys,json; d=json.load(sys.stdin); print([x['name'] for x in d['items']])"
```
- [ ] 🇨🇳 중국 토글 노출 → 클릭 시 뉴스·차트·분석·공시·리서치·거시·ETF·IPO·거래소·커뮤니티 탭에 CN 링크(東方財富·雪球·AAStocks·HKEX 등) 표시.
- [ ] 뉴스·분석·리서치·ETF·IPO 탭 우측 모아보기 = 중화권 기사가 **한국어로 번역**되어 표시(리스트 이름은 원문 유지).
- [ ] 종목·상품 탭 = "중국·홍콩 종목보드 — 준비 중" 플레이스홀더(정상 — STEP 492 예정).
- [ ] 하단 지수바에 Hang Seng·CSI 300·USD/CNY 카드 추가.
- [ ] 한국·미국·일본 탭 회귀 없음(기존 동작 그대로).

## 8) 커밋
```bash
git add stores/countryStore.ts components/toolbox/ToolboxClient.tsx components/toolbox/NewsFeed.tsx app/api/news/feed/route.ts app/api/yahoo/indices/route.ts && git commit -m "feat(cn): 중국·홍콩 탭 배관 — 국가토글 CN + 링크허브 노출 + 중화권 뉴스피드(번역) + 지수바 항셍·CSI300·USDCNY (STEP 491)" && git push
```

## ⚠️ 노트
- link_hub CN 59행은 Cowork이 Supabase에 이미 삽입(즉시 라이브). page.tsx가 국가필터 없이 전체 로드 → CN 링크 자동 노출.
- 뉴스 로케일 = 홍콩판(zh-HK/HK) — 홍콩+본토(A股) 모두 커버, 안정적. 번역은 기존 translation_cache 재사용.
- 다음: **STEP 492 CnMarketBoard** — 홍콩(.HK)+상해(.SS)+심천(.SZ) 종목보드 + jp-list류 라우트 + perf 크론(현재가 라이브 + 1주~6개월). 매매 가능(홍콩 직접 + 후강퉁·선강퉁) 종목 기준.
