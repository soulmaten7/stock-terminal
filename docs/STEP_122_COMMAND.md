<!-- 2026-05-31 -->
# STEP 122 — 종목별 뉴스 + 시장 헤드라인 (RSS + Yahoo)

🔴 **Opus 권장** (RSS 파싱 + 신규 API 2개 + 신규 컴포넌트 2개 + 종목명 매칭 로직)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `8535a37` (STEP 120 종목 페이지 마무리)
- 종목 페이지: 좌 정보+차트 / 중 토론 / 우 채팅 — 작동
- 새 홈: 시장 핫 이슈 카드 + HOT 토론 + 채팅 — 작동
- **뉴스 카테고리 없음** = 사용자 통찰 "주식의 본질은 실시간 뉴스" 미해결

## 운종 정체성 강화 — 이 STEP 의 의미

> **운종 = 오르내림 + 대화 + 정보 (뉴스)**

운종 9개 정확 카드 중 원인(이벤트) = 공시 2개뿐. 나머지 7개는 결과(가격·거래량). 
**뉴스가 빠진 게 운종의 큰 결점** (사용자 통찰 동의).

이 STEP 으로 운종 = 진짜 "정보 + 대화 + 허브" 4박자 완성.

## 데이터 소스 결정

**키 필요 X (이번 STEP)**:
- 한경 RSS: `https://www.hankyung.com/feed/all-news`
- 매경 RSS: `https://www.mk.co.kr/rss/30000001/`
- 머니투데이 RSS: `https://rss.mt.co.kr/mt_news.xml`
- 이데일리 RSS: `https://rss.edaily.co.kr/edaily_news_rss.xml`
- 연합뉴스 RSS: `https://www.yna.co.kr/rss/economy.xml`
- Yahoo Finance (yahoo-finance2 패키지 — 이미 사용 중)

**키 필요 (추후 STEP)**:
- 네이버 검색 API: 종목별 정확 매핑 가능, 키 발급 필요 (사용자 직접)

→ 이번 STEP 은 **RSS 통합 + Yahoo Finance** 만으로 시작. 종목별 매핑은 종목명 부분일치로 처리.

## 목표

| 영역 | 변경 |
|------|------|
| **신규 API** | `/api/news/market` — 한국 RSS 5개 통합 + 정렬 + 캐싱 |
| **신규 API** | `/api/news/stock` — 종목명 키워드 RSS 필터 + Yahoo news (미국) |
| **신규 컴포넌트** | `MarketNewsModule` (새 홈) |
| **신규 컴포넌트** | `StockNewsModule` (종목 페이지) |
| **새 홈 변경** | HomeClientV5 에 MarketNewsModule 추가 (중앙 카드 아래) |
| **종목 페이지 변경** | StockPageClient 에 StockNewsModule 추가 (DiscussionBoard 위 또는 옆) |

---

## 작업 디테일

### [1] 신규 API — `app/api/news/market/route.ts`

여러 RSS 통합 + 최신순 정렬 + 10분 캐싱.

```typescript
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 600; // 10분 캐싱

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};

const SOURCES = [
  { name: "한경", url: "https://www.hankyung.com/feed/all-news" },
  { name: "매경", url: "https://www.mk.co.kr/rss/30000001/" },
  { name: "머니투데이", url: "https://rss.mt.co.kr/mt_news.xml" },
  { name: "이데일리", url: "https://rss.edaily.co.kr/edaily_news_rss.xml" },
  { name: "연합뉴스", url: "https://www.yna.co.kr/rss/economy.xml" },
];

function parseRSS(xml: string, publisher: string): NewsItem[] {
  const items: NewsItem[] = [];
  // RSS 2.0 형식 정규식 파싱 (단순)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?<\/title>/;
  const linkRegex = /<link>([^<]+)<\/link>/;
  const dateRegex = /<pubDate>([^<]+)<\/pubDate>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = (itemXml.match(titleRegex) || [])[1];
    const link = (itemXml.match(linkRegex) || [])[1];
    const date = (itemXml.match(dateRegex) || [])[1];
    if (title && link) {
      items.push({
        title: title.trim().replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
        link: link.trim(),
        publisher,
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
    }
  }
  return items;
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      SOURCES.map(async (src) => {
        const r = await fetch(src.url, {
          headers: { "User-Agent": "Mozilla/5.0 (Unjong Bot)" },
          next: { revalidate: 600 },
        });
        if (!r.ok) return [];
        const xml = await r.text();
        return parseRSS(xml, src.name);
      })
    );

    const all: NewsItem[] = [];
    results.forEach((res) => {
      if (res.status === "fulfilled") all.push(...res.value);
    });

    // 최신순 정렬 + 중복 제거 (제목 기준) + TOP 30
    const seen = new Set<string>();
    const sorted = all
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .filter((item) => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
      })
      .slice(0, 30);

    return NextResponse.json({ items: sorted });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

### [2] 신규 API — `app/api/news/stock/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};

// 한국 RSS 소스 (시장 뉴스 — 종목명 매칭)
const KR_SOURCES = [
  { name: "한경", url: "https://www.hankyung.com/feed/all-news" },
  { name: "매경", url: "https://www.mk.co.kr/rss/30000001/" },
  { name: "머니투데이", url: "https://rss.mt.co.kr/mt_news.xml" },
];

function parseRSS(xml: string, publisher: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?<\/title>/;
  const linkRegex = /<link>([^<]+)<\/link>/;
  const dateRegex = /<pubDate>([^<]+)<\/pubDate>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = (itemXml.match(titleRegex) || [])[1];
    const link = (itemXml.match(linkRegex) || [])[1];
    const date = (itemXml.match(dateRegex) || [])[1];
    if (title && link) {
      items.push({
        title: title.trim().replace(/&amp;/g, "&"),
        link: link.trim(),
        publisher,
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
    }
  }
  return items;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const symbol = sp.get("symbol");
  if (!symbol) return NextResponse.json({ items: [], error: "symbol 필수" });

  try {
    // 1) 종목명 가져오기 (한국: stocks DB, 미국: 그대로)
    let stockName = symbol;
    let market: "KR" | "US" = "KR";

    if (/^[A-Z.\-]+$/.test(symbol)) {
      market = "US";
      stockName = symbol;
    } else if (/^\d{6}$/.test(symbol)) {
      // stocks DB 에서 한국 종목명
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("stocks")
        .select("name_ko")
        .eq("symbol", symbol)
        .limit(1)
        .maybeSingle();
      if (data?.name_ko) stockName = data.name_ko;
    }

    if (market === "US") {
      // Yahoo Finance 뉴스
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const search: any = await yf.search(symbol, { newsCount: 10 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const news = (search?.news || []).map((n: any) => ({
        title: n.title,
        link: n.link,
        publisher: n.publisher || "Yahoo Finance",
        publishedAt: n.providerPublishTime
          ? new Date(n.providerPublishTime * 1000).toISOString()
          : new Date().toISOString(),
      }));
      return NextResponse.json({ items: news, source: "yahoo" });
    }

    // 한국: RSS 통합 + 종목명 키워드 매칭
    const results = await Promise.allSettled(
      KR_SOURCES.map(async (src) => {
        const r = await fetch(src.url, {
          headers: { "User-Agent": "Mozilla/5.0 (Unjong Bot)" },
          next: { revalidate: 600 },
        });
        if (!r.ok) return [];
        const xml = await r.text();
        return parseRSS(xml, src.name);
      })
    );

    const all: NewsItem[] = [];
    results.forEach((res) => {
      if (res.status === "fulfilled") all.push(...res.value);
    });

    // 종목명이 제목에 포함된 것만 필터
    const filtered = all
      .filter((item) => item.title.includes(stockName))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    return NextResponse.json({ items: filtered, source: "rss", stockName });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

### [3] 신규 컴포넌트 — `components/home-v5/MarketNewsModule.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};

export default function MarketNewsModule() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/news/market");
        const json = await r.json();
        setItems((json.items || []).slice(0, 10));
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // 5분 갱신
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-unjong-primary">
          📰 시장 헤드라인
        </h2>
        <span className="text-[10px] text-unjong-muted italic">한경·매경·머니투데이·이데일리·연합</span>
      </header>

      {loading ? (
        <div className="text-center text-xs text-unjong-muted py-4">⏳ 로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-xs text-unjong-muted py-4">뉴스 로딩 실패</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-unjong-background rounded p-2 hover:border-unjong-accent border border-transparent transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 flex-shrink-0">
                    {item.publisher}
                  </span>
                  <span className="text-[10px] text-unjong-muted">
                    {new Date(item.publishedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-unjong-primary leading-snug flex items-start gap-1">
                  <span className="flex-1">{item.title}</span>
                  <ExternalLink size={10} className="flex-shrink-0 mt-0.5 text-unjong-muted" />
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

### [4] 신규 컴포넌트 — `components/stock/StockNewsModule.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};

type Props = { symbol: string };

export default function StockNewsModule({ symbol }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockName, setStockName] = useState<string>(symbol);
  const [source, setSource] = useState<"yahoo" | "rss" | "">("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/news/stock?symbol=${symbol}`);
        const json = await r.json();
        setItems(json.items || []);
        setSource(json.source || "");
        if (json.stockName) setStockName(json.stockName);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10 * 60 * 1000); // 10분 갱신
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-4 mb-4">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-unjong-primary">
          📰 {stockName} 뉴스
        </h2>
        <span className="text-[10px] text-unjong-muted italic">
          {source === "yahoo" ? "Yahoo Finance" : source === "rss" ? "RSS 매칭" : ""}
        </span>
      </header>

      {loading ? (
        <div className="text-center text-xs text-unjong-muted py-3">⏳ 로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-xs text-unjong-muted py-3">
          {stockName} 관련 최근 뉴스가 없습니다.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item, i) => (
            <li key={i}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-unjong-background rounded p-2 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-unjong-muted">
                    {item.publisher}
                  </span>
                  <span className="text-[10px] text-unjong-muted">
                    {new Date(item.publishedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-unjong-primary leading-snug flex items-start gap-1">
                  <span className="flex-1">{item.title}</span>
                  <ExternalLink size={10} className="flex-shrink-0 mt-0.5 text-unjong-muted" />
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

### [5] 새 홈 통합 — `components/home-v5/HomeClientV5.tsx`

가운데 메인 영역, "시장 핫 이슈" 카드 4종 다음에 `<MarketNewsModule />` + `<HotDiscussionsModule />`:

```tsx
import MarketNewsModule from "./MarketNewsModule";

// 가운데 main 안:
<main className="space-y-4">
  <section>
    <h2 className="text-base font-semibold text-unjong-primary mb-3">🔥 시장 핫 이슈</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MoversCard />
      <VolumeCard />
      <NetBuyBrokerCard />
      <DisclosureCard />
    </div>
  </section>

  <MarketNewsModule />

  <HotDiscussionsModule />
</main>
```

### [6] 종목 페이지 통합 — `components/stock/StockPageClient.tsx`

가운데 메인 안 `<DiscussionBoard />` 위에 `<StockNewsModule />`:

```tsx
import StockNewsModule from "./StockNewsModule";

<main>
  <StockNewsModule symbol={code} />
  <DiscussionBoard symbol={code} />
</main>
```

### [7] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

체크:
- TypeScript 에러 0
- RSS 파싱 정규식 정상 (런타임 검증은 브라우저에서)
- yahoo-finance2 search() 사용 부분 타입 OK

### [8] 4개 문서 헤더 갱신 + 로그

### [9] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(news): 시장 헤드라인 + 종목별 뉴스 (RSS + Yahoo)

신규 API:
- /api/news/market — 한경·매경·머니투데이·이데일리·연합 RSS 5개 통합
  - revalidate 600 (10분 캐싱)
  - 정규식 RSS 2.0 파싱 (xml2js 미사용, 의존성 ↓)
  - 최신순 + 제목 중복 제거 + TOP 30
- /api/news/stock?symbol= — 종목별 뉴스
  - 한국 주식 (6자리): stocks DB 에서 name_ko 조회 → KR RSS 3개에서 종목명 포함 제목 필터
  - 미국 주식 (티커): Yahoo Finance search.news (yahoo-finance2)

신규 컴포넌트:
- components/home-v5/MarketNewsModule.tsx — 새 홈 시장 헤드라인 (10건, 5분 갱신, 외부 새 탭)
- components/stock/StockNewsModule.tsx — 종목 페이지 종목별 뉴스 (5건, 10분 갱신)

통합:
- HomeClientV5 가운데 메인: 시장 핫 이슈 + MarketNewsModule + HotDiscussionsModule
- StockPageClient 가운데 메인: StockNewsModule + DiscussionBoard

운종 정체성 강화:
- '운종 = 오르내림 + 대화 + 정보 (뉴스)' 4박자 완성
- 정보 (실시간 RSS 5개 통합) + 대화 (토론·채팅) + 허브 (외부 정확한 곳으로 연결) + 신뢰 (검증된 언론사만)

추후 STEP — 네이버 검색 API 통합 (사용자 직접 키 발급 필요):
- 종목별 매핑 정확도 ↑ (현재 RSS 종목명 부분일치)
- 종목명 동의어 처리 (예: '삼성전자' = '삼전' = 'Samsung Electronics')"
git push
```

## 검증 (사용자 안내용)

푸시 후 하드 리프레시:

1. `/` 새 홈 → 가운데에 **"📰 시장 헤드라인"** 모듈 (한경·매경·머니투데이·이데일리·연합 통합)
2. 뉴스 클릭 → 외부 새 탭으로 이동
3. 5분마다 자동 갱신
4. `/stock/005930` (삼성전자) → 가운데에 **"📰 삼성전자 뉴스"** 모듈 (RSS 제목에 '삼성전자' 포함된 것만)
5. `/stock/AAPL` (애플) → "📰 AAPL 뉴스" (Yahoo Finance)
6. 종목별 뉴스 없으면 "관련 최근 뉴스가 없습니다" 안내

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ /api/news/market 응답 (curl 테스트)
- ✅/❌ /api/news/stock?symbol=005930 응답
- ✅/❌ MarketNewsModule + StockNewsModule 렌더링
- ✅/❌ 커밋 + 푸시

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| RSS XML 형식이 표준과 다른 경우 (CDATA 위치 등) | 정규식 유연하게 작성 + 일부 실패 무시 (Promise.allSettled) |
| 일부 언론사가 RSS 제공 중단 | 5개 중 일부 실패 → 다른 소스로 대체, 0건이면 빈 결과 |
| Yahoo Finance search() 타입 불일치 | any 타입으로 우회 + eslint-disable |
| 종목명 동의어 미처리 ('삼전' 검색 시 0건) | 추후 네이버 검색 API 또는 동의어 매핑 |
| RSS XML 인코딩 (EUC-KR 등) | fetch 자동 처리 (UTF-8 기본). 인코딩 문제 시 iconv-lite 추가 |
| 한경 RSS 가 robots.txt 차단 | User-Agent 명시. 차단되면 다른 소스 활용 |

## 다음 STEP

- **STEP 123** — UI 다듬기 (사용자 시각 확인 후)
- 모바일 반응형 — PC 완성 후
- Vercel 배포 — 사용자 도메인 결정 후
- 네이버 검색 API 통합 — 키 발급 후
