<!-- 2026-05-31 -->
# STEP 125 — 미국 주식 상세 정보 + 검색 ⭐ Watchlist 통합

🟢 **Sonnet 가능** (2개 작은 작업)

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `c0556c4` (STEP 124 토론 댓글)
- 미국 주식 종목 페이지 = 가격·등락률만 (시고저·52주·PER 등 X)
- HeaderSearch 검색 드롭다운 = 선택 시 종목 페이지 이동만, ⭐ 추가 X
- STEP 113 (Watchlist 통합) 미완 — 검색에서 ⭐ 추가 가능하면 사용자 동선 완성

## 목표

| # | 영역 | 변경 |
|---|------|------|
| 1 | **신규 API** | `/api/yahoo/quote-detail` — quoteSummary 시고저·52주·PER·시총 |
| 2 | **StockInfoPanel** | 미국 주식 분기 풍부화 (시세·재무 박스 한국과 동일 구조) |
| 3 | **HeaderSearch** | 드롭다운 항목에 ⭐ 버튼 + watchlistStore add 동작 |

---

## 작업 디테일

### [1] 신규 API — `app/api/yahoo/quote-detail/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

/**
 * GET /api/yahoo/quote-detail?symbol=AAPL
 * Yahoo Finance quoteSummary 로 미국 주식 상세 정보
 * 응답: { name, price, changePct, open, high, low, volume, high52w, low52w, per, pbr, marketCap, dividendYield }
 */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol 필수" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary: any = await yf.quoteSummary(symbol, {
      modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData"],
    });

    const price = summary?.price || {};
    const detail = summary?.summaryDetail || {};
    const key = summary?.defaultKeyStatistics || {};

    return NextResponse.json({
      symbol,
      name: price.longName || price.shortName || symbol,
      price: Number(price.regularMarketPrice?.raw ?? price.regularMarketPrice ?? 0),
      changePct: Number(price.regularMarketChangePercent?.raw ?? price.regularMarketChangePercent ?? 0) * (price.regularMarketChangePercent?.raw !== undefined ? 100 : 1),
      open: Number(detail.regularMarketOpen?.raw ?? detail.regularMarketOpen ?? 0),
      high: Number(detail.regularMarketDayHigh?.raw ?? detail.regularMarketDayHigh ?? 0),
      low: Number(detail.regularMarketDayLow?.raw ?? detail.regularMarketDayLow ?? 0),
      volume: Number(detail.regularMarketVolume?.raw ?? detail.regularMarketVolume ?? 0),
      high52w: Number(detail.fiftyTwoWeekHigh?.raw ?? detail.fiftyTwoWeekHigh ?? 0),
      low52w: Number(detail.fiftyTwoWeekLow?.raw ?? detail.fiftyTwoWeekLow ?? 0),
      per: Number(detail.trailingPE?.raw ?? detail.trailingPE ?? 0),
      pbr: Number(key.priceToBook?.raw ?? key.priceToBook ?? 0),
      marketCap: Number(price.marketCap?.raw ?? price.marketCap ?? 0),
      dividendYield: detail.dividendYield
        ? Number(detail.dividendYield.raw ?? detail.dividendYield) * 100
        : 0,
      currency: price.currency || "USD",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

### [2] StockInfoPanel 미국 분기 풍부화

`components/stock/StockInfoPanel.tsx` 의 미국 주식 로딩 분기 → quote-detail API 호출. 시세·재무 박스 표시.

기존 미국 분기:
```tsx
} else if (/^[A-Z.\-]+$/.test(symbol)) {
  const r = await fetch(`/api/yahoo/quote?symbols=${symbol}`);
  const json = await r.json();
  if (cancelled || !json.items?.[0]) return;
  const it = json.items[0];
  setData({
    name: it.code,
    price: it.price,
    changePct: it.changePct,
    open: 0, high: 0, low: 0, volume: 0,
    high52w: 0, low52w: 0, per: 0, pbr: 0, marketCap: 0,
  });
}
```

변경:
```tsx
} else if (/^[A-Z.\-]+$/.test(symbol)) {
  const r = await fetch(`/api/yahoo/quote-detail?symbol=${symbol}`);
  const json = await r.json();
  if (cancelled || json.error) return;
  setData({
    name: json.name || symbol,
    price: json.price,
    changePct: json.changePct,
    open: json.open || 0,
    high: json.high || 0,
    low: json.low || 0,
    volume: json.volume || 0,
    high52w: json.high52w || 0,
    low52w: json.low52w || 0,
    per: json.per || 0,
    pbr: json.pbr || 0,
    marketCap: json.marketCap || 0,
  });
  setIsUS(true);  // 신규 state
}
```

가격 표시 시 미국은 `$` prefix, 한국은 ₩ 또는 그냥 숫자:

```tsx
const [isUS, setIsUS] = useState(false);

// 가격 표시:
<span className="text-xl font-bold text-unjong-primary tabular-nums">
  {isUS ? `$${data.price.toFixed(2)}` : data.price.toLocaleString()}
</span>
```

시세·재무 박스 — 미국 주식도 표시 가능:

기존 분기:
```tsx
{/^\d{6}$/.test(symbol) && data.open > 0 && (
  <>
    {/* 시세·재무 박스 */}
  </>
)}

{!/^\d{6}$/.test(symbol) && (
  <div>미국 주식 상세 정보 Yahoo Finance 통합 작업 중</div>
)}
```

변경 (한국·미국 동일 구조, 단 단위·통화 다름):
```tsx
{data.open > 0 && (
  <>
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
      <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">시세</h3>
      <Row label="시가" value={formatPrice(data.open)} />
      <Row label="고가" value={formatPrice(data.high)} />
      <Row label="저가" value={formatPrice(data.low)} />
      <Row label="거래량" value={data.volume ? data.volume.toLocaleString() : "—"} />
      <Row label="52주 최고" value={formatPrice(data.high52w)} />
      <Row label="52주 최저" value={formatPrice(data.low52w)} />
    </section>

    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
      <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">재무</h3>
      <Row label="시가총액" value={formatMarketCap(data.marketCap, isUS)} />
      <Row label="PER" value={data.per > 0 ? data.per.toFixed(1) : "—"} />
      <Row label="PBR" value={data.pbr > 0 ? data.pbr.toFixed(1) : "—"} />
    </section>
  </>
)}
```

헬퍼 함수 (StockInfoPanel 내부 또는 별도 utils):
```tsx
function formatPrice(price: number, isUS = false): string {
  if (!price) return "—";
  return isUS ? `$${price.toFixed(2)}` : price.toLocaleString();
}

function formatMarketCap(cap: number, isUS = false): string {
  if (!cap) return "—";
  if (isUS) {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    return `$${cap.toLocaleString()}`;
  }
  // 한국 (원 단위)
  return `${(cap / 100000000).toFixed(1)}조`;
}
```

⚠️ `formatPrice` 호출 시 `isUS` prop 전달 필요. 컴포넌트 안에서 isUS state 참조하도록 또는 인자로 전달.

### [3] HeaderSearch 드롭다운 ⭐ 버튼

`components/header/HeaderSearch.tsx` 에 watchlistStore 통합.

신규 import:
```tsx
import { useWatchlist, type WatchlistItem } from "@/stores/watchlistStore";
import { Star } from "lucide-react";
```

컴포넌트 안:
```tsx
const watchlistItems = useWatchlist((s) => s.items);
const addToWatchlist = useWatchlist((s) => s.add);
const removeFromWatchlist = useWatchlist((s) => s.remove);

const isInWatchlist = (code: string) => watchlistItems.some((i) => i.code === code);

const handleStar = (e: React.MouseEvent, item: SearchResult) => {
  e.stopPropagation();
  const market = inferMarket(item.country, item.market);
  if (isInWatchlist(item.symbol)) {
    removeFromWatchlist(item.symbol);
  } else {
    addToWatchlist({
      code: item.symbol,
      name: item.name,
      market,
    });
  }
};
```

드롭다운 항목 JSX 수정:
```tsx
<li key={item.symbol}>
  <div
    onMouseEnter={() => setActiveIndex(i)}
    className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
      i === activeIndex ? "bg-unjong-background" : "hover:bg-unjong-background"
    }`}
  >
    <button
      type="button"
      onClick={() => handleSelect(item)}
      className="flex items-center gap-2 flex-1 text-left"
    >
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${marketColor}`}>
        {market}
      </span>
      <span className="font-medium text-unjong-primary truncate flex-1">
        {item.name}
      </span>
      <span className="text-[10px] text-unjong-muted font-mono flex-shrink-0">
        {item.symbol}
      </span>
    </button>
    <button
      type="button"
      onClick={(e) => handleStar(e, item)}
      className={`p-1 flex-shrink-0 transition-colors ${
        isInWatchlist(item.symbol)
          ? "text-amber-500"
          : "text-unjong-muted hover:text-amber-500"
      }`}
      aria-label={isInWatchlist(item.symbol) ? "관심종목 제거" : "관심종목 추가"}
      title={isInWatchlist(item.symbol) ? "관심종목에서 제거" : "관심종목에 추가"}
    >
      <Star size={12} fill={isInWatchlist(item.symbol) ? "currentColor" : "none"} />
    </button>
  </div>
</li>
```

### [4] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### [5] 4개 문서 헤더 갱신

### [6] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(us-stock): 미국 주식 상세 정보 (Yahoo quoteSummary) + 검색 ⭐ Watchlist 통합

신규 API:
- /api/yahoo/quote-detail?symbol=AAPL
  - yahoo-finance2 quoteSummary (price·summaryDetail·defaultKeyStatistics·financialData 모듈)
  - 시고저·거래량·52주·PER·PBR·시총·배당수익률 통합
  - .raw 또는 값 둘 다 처리 (Yahoo API 응답 형식 차이)

StockInfoPanel 미국 분기 풍부화:
- /api/yahoo/quote → /api/yahoo/quote-detail 사용
- 시세·재무 박스 한국 주식과 동일 구조로 미국도 표시
- formatPrice·formatMarketCap 헬퍼 (미국 \$/T·B, 한국 원/조)
- '미국 주식 통합 추후' 메시지 완전 제거

HeaderSearch ⭐ Watchlist 통합 (STEP 113 완료):
- 드롭다운 항목에 Star 아이콘 버튼 추가
- 클릭 시 watchlistStore add/remove (토글)
- 이미 관심종목인 경우 amber 채워진 별
- 비로그인도 동작 (localStorage 기반)
- 검색 → 즉시 관심종목 추가 동선 완성"
git push
```

## 검증 (사용자 안내용)

푸시 후 하드 리프레시:

1. `/stock/AAPL` (애플) → 좌측 종목 정보 박스:
   - 가격 `$XXX.XX`
   - 시가·고가·저가·거래량
   - 52주 최고/최저 `$`
   - 시가총액 `$X.XT` (조 → 1조 달러 단위)
   - PER·PBR
2. `/stock/TSLA`, `/stock/NVDA`, `/stock/MSFT` 등도 동일하게
3. 헤더 검색 "삼성" → 드롭다운에 항목 마다 ⭐ 아이콘
4. ⭐ 클릭 → 즉시 amber 채워진 별 + 우측 WatchlistPanel 에 즉시 추가됨
5. 이미 관심종목인 종목 검색 → ⭐ 채워진 상태로 표시
6. 채워진 ⭐ 다시 클릭 → 제거 + 빈 별

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ /api/yahoo/quote-detail 응답
- ✅/❌ StockInfoPanel 미국 분기 풍부화 (스크린샷)
- ✅/❌ HeaderSearch ⭐ 동작
- ✅/❌ 커밋 + 푸시

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| Yahoo quoteSummary 응답 .raw 형식 불일치 | `?.raw ?? value` 둘 다 처리 |
| 미국 주식 시총 단위 (Trillion·Billion) | formatMarketCap 함수 |
| 검색 드롭다운 ⭐ 클릭 시 종목 페이지 이동 같이 발생 | e.stopPropagation() |
| WatchlistPanel ➕ 버튼 중복 | 이번엔 보존, 추후 ➕ 제거 가능 |

## 운종 V5 PC 버전 거의 완성

| | 상태 |
|---|------|
| 구조·카드·청소 | ✅ |
| 인증 코드 (활성화 추후) | ✅ |
| 종목 페이지 + 토론 + 댓글 + 채팅 | ✅ |
| 새 홈 | ✅ |
| 차트 + 미장 가격 | ✅ |
| 뉴스 (시장·종목별) | ✅ |
| UI 일관성 | ✅ |
| **미국 주식 상세 + 검색 ⭐** | 🔵 STEP 125 |
| 큰 시각 변경 (사용자 피드백) | 사용자 |
| 모바일 반응형 | PC 완성 후 |
| Vercel 배포 + 도메인 | 사용자 |
| 카카오 OAuth 활성화 | 도메인 후 |

## 다음 STEP (사용자 결정)

이 STEP 완료 시 운종 V5 **PC 핵심 기능 완성**.
사용자가 브라우저 직접 확인하고 거슬리는 부분 피드백 받으면 다음 작업 결정.

가능한 후속:
- 댓글 좋아요·신고
- 대댓글 (parent_comment_id)
- 큰 시각 디자인 변경 (사용자 시각 피드백 기반)
- 모바일 반응형 (< 1024px)
- Vercel 배포 + unjong.com
- 카카오 OAuth 활성화
- 네이버 검색 API 통합 (종목명 매핑 정확도 ↑)
