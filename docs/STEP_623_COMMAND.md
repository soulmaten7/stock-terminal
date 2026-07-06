<!-- 2026-07-06 -->
# STEP 623 — 베트남 탭 배관 (Country+VN · 토글 · 피드 vi · 통화 VND)

> **목표**: 국가 토글에 🇻🇳 베트남 추가 → link_hub 49행(이미 라이브)이 화면에 뜨고, 모아보기 피드(news/analysis/research/etf/ipo)가 베트남어(vi) Google News→한국어 번역으로 붙음. **종목보드(market 탭)는 아직 없으니 "준비 중" Placeholder**(다음 STEP에서 vnstock 유니버스+야후 .VN).
> **플레이북**: §2 touch-point 전수 미러(CN 있는 곳=VN). §4-1 피드 배선.
> **전제**: STEP 622(문서) 이후. 코드 변경 5파일. **DB(link_hub VN 49행)는 Cowork이 이미 insert함.**
> 🔴 실행: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (표준 Sonnet)

## 편집 (5파일 · 정확히 아래대로)

### 1) `stores/countryStore.ts` — Country 유니언 +VN
```
찾기:   export type Country = 'KR' | 'US' | 'JP' | 'CN';
바꾸기: export type Country = 'KR' | 'US' | 'JP' | 'CN' | 'VN';
```

### 2) `components/toolbox/ToolboxClient.tsx` — 4곳
**(a) COUNTRIES 배열** — CN 다음에 VN 추가:
```
찾기:
  { code: 'CN', label: '🇨🇳 중국' },
];
바꾸기:
  { code: 'CN', label: '🇨🇳 중국' },
  { code: 'VN', label: '🇻🇳 베트남' },
];
```
**(b) FEED_COUNTRY_SUPPORT** — news/analysis/research/etf/ipo에 'VN' 추가(disclosure·macro는 그대로):
```
찾기:
  news: ['KR', 'US', 'JP', 'CN'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP', 'CN'], research: ['KR', 'US', 'JP', 'CN'], etf: ['KR', 'US', 'JP', 'CN'], ipo: ['KR', 'US', 'JP', 'CN'],
바꾸기:
  news: ['KR', 'US', 'JP', 'CN', 'VN'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP', 'CN', 'VN'], research: ['KR', 'US', 'JP', 'CN', 'VN'], etf: ['KR', 'US', 'JP', 'CN', 'VN'], ipo: ['KR', 'US', 'JP', 'CN', 'VN'],
```
**(c) feedFor — analysis/research/etf/ipo 각 CN 분기 뒤에 VN 분기 추가** (4곳):
```
찾기:
      : country === 'CN'
      ? <NewsFeed country="CN" query="業績 財報 港股 A股" title="중화권 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
바꾸기:
      : country === 'CN'
      ? <NewsFeed country="CN" query="業績 財報 港股 A股" title="중화권 실적·기업 뉴스" />
      : country === 'VN'
      ? <NewsFeed country="VN" query="kết quả kinh doanh lợi nhuận doanh nghiệp" title="베트남 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
```
```
찾기:
      : country === 'CN'
      ? <NewsFeed country="CN" query="目標價 評級 券商 港股" title="중화권 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
바꾸기:
      : country === 'CN'
      ? <NewsFeed country="CN" query="目標價 評級 券商 港股" title="중화권 애널리스트·리포트 뉴스" />
      : country === 'VN'
      ? <NewsFeed country="VN" query="khuyến nghị cổ phiếu giá mục tiêu" title="베트남 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
```
```
찾기:
      : country === 'CN'
      ? <NewsFeed country="CN" query="ETF 基金 港股 A股" title="중화권 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
바꾸기:
      : country === 'CN'
      ? <NewsFeed country="CN" query="ETF 基金 港股 A股" title="중화권 ETF·펀드 뉴스" />
      : country === 'VN'
      ? <NewsFeed country="VN" query="ETF quỹ đầu tư chứng khoán" title="베트남 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
```
```
찾기:
      : country === 'CN'
      ? <NewsFeed country="CN" query="新股 IPO 上市 港股" title="중화권 IPO·공모 뉴스" />
      : <OfferingsFeed />;
바꾸기:
      : country === 'CN'
      ? <NewsFeed country="CN" query="新股 IPO 上市 港股" title="중화권 IPO·공모 뉴스" />
      : country === 'VN'
      ? <NewsFeed country="VN" query="IPO niêm yết cổ phiếu mới" title="베트남 IPO·공모 뉴스" />
      : <OfferingsFeed />;
```
**(d) market 탭 렌더 — CN을 명시 분기로, VN은 Placeholder**(현재 마지막 `: ( <CnMarketBoard/> )` catch-all이라 VN이 CN보드로 새는 것 방지):
```
찾기:
          ) : country === 'JP' ? (
            <JpMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <CnMarketBoard isLoggedIn={isLoggedIn} />
          )
바꾸기:
          ) : country === 'JP' ? (
            <JpMarketBoard isLoggedIn={isLoggedIn} />
          ) : country === 'CN' ? (
            <CnMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇻🇳" title="베트남 종목·상품 — 준비 중" desc="곧 제공됩니다" />
          )
```

### 3) `components/toolbox/NewsFeed.tsx` — 유니언 +VN, isVn, url 분기
```
찾기:
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' | 'JP' | 'CN' }) {
  // US는 Yahoo ^GSPC RSS(키리스, query 무시). KR은 네이버 검색(query 사용).
  const isUs = country === 'US';
  const isJp = country === 'JP';
  const isCn = country === 'CN';
  const url = isCn
바꾸기:
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' | 'JP' | 'CN' | 'VN' }) {
  // US는 Yahoo ^GSPC RSS(키리스, query 무시). KR은 네이버 검색(query 사용).
  const isUs = country === 'US';
  const isJp = country === 'JP';
  const isCn = country === 'CN';
  const isVn = country === 'VN';
  const url = isVn
    ? '/api/news/feed?market=VN' + (query ? '&q=' + encodeURIComponent(query) : '')
    : isCn
```

### 4) `app/api/news/feed/route.ts` — CN 블록 뒤에 VN 분기 추가
```
찾기:
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }

  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
바꾸기:
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }

  // ── VN 분기(Google News, 베트남어) — CN과 동일 패턴 + 한국어 번역 ──
  if (market === "VN") {
    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    const key = "VN:" + q;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 15 * 60 * 1000) return NextResponse.json(hit.data);
    try {
      const items = await googleNews(q || "chứng khoán Việt Nam VN-Index", "vi", "VN", "VN:vi");
      const data = { items: await translateTitles(items, "ko") };
      cache.set(key, { at: Date.now(), data });
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }

  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
```

### 5) `lib/currency.ts` — VND(동) 추가
```
찾기:
  CN: { sym: '¥', pos: 'pre', frac: 2, locale: 'zh-CN' },
};
바꾸기:
  CN: { sym: '¥', pos: 'pre', frac: 2, locale: 'zh-CN' },
  VN: { sym: '₫', pos: 'suf', frac: 0, locale: 'vi-VN' },
};
```

## 빌드 + 눈검수
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```
- Turbopack: 서버컴포넌트/라우트 변경이라 dev는 **클린 재시작** `pkill -f "next dev"; rm -rf .next && npm run dev` 후 확인.
- [ ] 국가 토글에 🇻🇳 베트남 노출·클릭 전환.
- [ ] 베트남 탭: chart·news·disclosure·research·analysis·etf·ipo·exchange·community 링크 컬럼 뜸(49행).
- [ ] 모아보기: news·analysis·research·etf·ipo 피드가 베트남 기사(한국어 번역)로 뜸. (disclosure·macro는 VN 미지원이라 링크만.)
- [ ] market 탭 = "베트남 종목·상품 — 준비 중" Placeholder(❌ CN 보드 아님).

## 커밋
```bash
cd ~/stock-terminal && git add stores/countryStore.ts components/toolbox/ToolboxClient.tsx components/toolbox/NewsFeed.tsx app/api/news/feed/route.ts lib/currency.ts docs/STEP_623_COMMAND.md && git commit -m "feat(vn): 베트남 탭 배관 — Country+VN·토글·피드 vi(→ko 번역)·통화 VND (link_hub 49 라이브)" && git push
```

## ✅ 완료 시 → 다음 = **③ 종목보드**: vnstock으로 유니버스+베트남어명(vn_names) 확보(유저 머신) → 야후 .VN 시세·수익률 크론 → `VnMarketBoard`.
