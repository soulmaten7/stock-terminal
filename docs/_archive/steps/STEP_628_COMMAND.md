<!-- 2026-07-06 -->
# STEP 628 — 영국 탭 배관 (Country+GB · 토글 · 피드 en-GB · 통화 펜스)

> **목표**: 국가 토글에 영국 추가 → link_hub 46행(라이브)이 뜨고, 모아보기 피드(news/analysis/research/etf/ipo)가 **en-GB Google News**(영어·번역 불필요)로 붙음. 종목보드(market)는 다음 STEP까지 "준비 중" Placeholder.
> **UK = 영어권**: R3 이름테이블·번역 불필요(US 패턴). 통화 = **LSE 펜스(GBp)** → 접미 `p`.
> **전제**: STEP 627(`8228cb0`) 이후. VN 배관(STEP 623)과 동일 구조, GB로 미러. **DB(GB link_hub 46행)는 Cowork이 이미 insert.**
> 🔴 실행: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

## 편집 (5파일)

### 1) `stores/countryStore.ts`
```
찾기:   export type Country = 'KR' | 'US' | 'JP' | 'CN' | 'VN';
바꾸기: export type Country = 'KR' | 'US' | 'JP' | 'CN' | 'VN' | 'GB';
```

### 2) `components/toolbox/ToolboxClient.tsx` — 4곳
**(a) COUNTRIES** — VN 다음에 GB:
```
찾기:
  { code: 'VN', label: '베트남' },
];
바꾸기:
  { code: 'VN', label: '베트남' },
  { code: 'GB', label: '영국' },
];
```
**(b) FEED_COUNTRY_SUPPORT** — 5개 피드에 'GB' 추가:
```
찾기:
  news: ['KR', 'US', 'JP', 'CN', 'VN'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP', 'CN', 'VN'], research: ['KR', 'US', 'JP', 'CN', 'VN'], etf: ['KR', 'US', 'JP', 'CN', 'VN'], ipo: ['KR', 'US', 'JP', 'CN', 'VN'],
바꾸기:
  news: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], research: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], etf: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], ipo: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'],
```
**(c) feedFor — VN 분기 뒤에 GB 분기 추가 (4곳)**:
```
찾기:
      : country === 'VN'
      ? <NewsFeed country="VN" query="kết quả kinh doanh lợi nhuận doanh nghiệp" title="베트남 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
바꾸기:
      : country === 'VN'
      ? <NewsFeed country="VN" query="kết quả kinh doanh lợi nhuận doanh nghiệp" title="베트남 실적·기업 뉴스" />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK stock earnings results company" title="영국 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
```
```
찾기:
      : country === 'VN'
      ? <NewsFeed country="VN" query="khuyến nghị cổ phiếu giá mục tiêu" title="베트남 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
바꾸기:
      : country === 'VN'
      ? <NewsFeed country="VN" query="khuyến nghị cổ phiếu giá mục tiêu" title="베트남 애널리스트·리포트 뉴스" />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK stock analyst rating price target" title="영국 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
```
```
찾기:
      : country === 'VN'
      ? <NewsFeed country="VN" query="ETF quỹ đầu tư chứng khoán" title="베트남 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
바꾸기:
      : country === 'VN'
      ? <NewsFeed country="VN" query="ETF quỹ đầu tư chứng khoán" title="베트남 ETF·펀드 뉴스" />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK ETF fund LSE investment trust" title="영국 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
```
```
찾기:
      : country === 'VN'
      ? <NewsFeed country="VN" query="IPO niêm yết cổ phiếu mới" title="베트남 IPO·공모 뉴스" />
      : <OfferingsFeed />;
바꾸기:
      : country === 'VN'
      ? <NewsFeed country="VN" query="IPO niêm yết cổ phiếu mới" title="베트남 IPO·공모 뉴스" />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK IPO London Stock Exchange listing" title="영국 IPO·공모 뉴스" />
      : <OfferingsFeed />;
```
**(d) market 탭 렌더 — VN 명시 분기로, GB는 Placeholder**:
```
찾기:
          ) : country === 'CN' ? (
            <CnMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <VnMarketBoard isLoggedIn={isLoggedIn} />
          )
바꾸기:
          ) : country === 'CN' ? (
            <CnMarketBoard isLoggedIn={isLoggedIn} />
          ) : country === 'VN' ? (
            <VnMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇬🇧" title="영국 종목·상품 — 준비 중" desc="곧 제공됩니다" />
          )
```

### 3) `components/toolbox/NewsFeed.tsx` — 유니언 +GB, isGb, url 분기
```
찾기:
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' | 'JP' | 'CN' | 'VN' }) {
바꾸기:
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' | 'JP' | 'CN' | 'VN' | 'GB' }) {
```
```
찾기:
  const isVn = country === 'VN';
  const url = isVn
    ? '/api/news/feed?market=VN' + (query ? '&q=' + encodeURIComponent(query) : '')
    : isCn
바꾸기:
  const isVn = country === 'VN';
  const isGb = country === 'GB';
  const url = isGb
    ? '/api/news/feed?market=GB' + (query ? '&q=' + encodeURIComponent(query) : '')
    : isVn
    ? '/api/news/feed?market=VN' + (query ? '&q=' + encodeURIComponent(query) : '')
    : isCn
```

### 4) `app/api/news/feed/route.ts` — VN 분기 뒤에 GB 분기 (en-GB·번역 불필요)
```
찾기:
  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
바꾸기:
  // ── GB 분기(Google News, 영국·영어) — 번역 불필요 ──
  if (market === "GB") {
    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    const key = "GB:" + q;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 15 * 60 * 1000) return NextResponse.json(hit.data);
    try {
      const items = await googleNews(q || "FTSE 100 UK stock market", "en-GB", "GB", "GB:en");
      const data = { items };
      cache.set(key, { at: Date.now(), data });
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }

  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
```

### 5) `lib/currency.ts` — GB(펜스·GBp) 추가
```
찾기:
  VN: { sym: '₫', pos: 'suf', frac: 0, locale: 'vi-VN' },
};
바꾸기:
  VN: { sym: '₫', pos: 'suf', frac: 0, locale: 'vi-VN' },
  GB: { sym: 'p', pos: 'suf', frac: 2, locale: 'en-GB' },
};
```

## 빌드 + 눈검수
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```
- Turbopack: 서버컴포넌트/라우트 변경 → 클린 재시작 `pkill -f "next dev"; rm -rf .next && npm run dev`.
- [ ] 토글에 영국 노출·전환. 영국 탭 링크 컬럼(46행) 뜸.
- [ ] 모아보기 news·analysis·research·etf·ipo 피드가 **영국 기사(FT·Reuters·City AM 등)** 로 뜸.
- [ ] market 탭 = "영국 종목·상품 — 준비 중" Placeholder.

## 커밋
```bash
cd ~/stock-terminal && git add stores/countryStore.ts components/toolbox/ToolboxClient.tsx components/toolbox/NewsFeed.tsx app/api/news/feed/route.ts lib/currency.ts docs/STEP_628_COMMAND.md && git commit -m "feat(gb): 영국 탭 배관 — Country+GB·토글·피드 en-GB·통화 펜스 (link_hub 46 라이브)" && git push
```

## ✅ 완료 시 → 다음 = **③ 영국 종목보드**: FTSE 350 유니버스 + 야후 `.L` 시세(펜스)·수익률 크론 → `GbMarketBoard`.
