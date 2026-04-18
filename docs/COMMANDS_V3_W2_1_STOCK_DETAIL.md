<!-- 2026-04-18 -->
# V3 W2.1 — 종목 상세 페이지 8탭 재구축

> 이 문서는 **Claude Code 가 읽고 실행하기 위한 명령 문서** 이다.
> Cowork 가 설계한 W2 Phase 1 중 첫 번째 단계.

**모델**: Sonnet (기본)
**실행 위치**: `~/Desktop/OTMarketing`

## 🎯 이번 세션 목표

기존 `app/stocks/[symbol]/page.tsx` (다크 테마 + 10탭 + Client + AuthGuard) 를
V3 스펙 (라이트 테마 + 8탭 + Server/Client 분리 + URL 탭 상태 + 비로그인 접근) 으로 전면 재작성.

### 최종 8개 탭 (왼쪽부터)
1. 개요 (overview) — KPI 그리드 + 기업개황 (W2.2 에서 실데이터 연동)
2. 차트 (chart) — 기존 ChartTab 재활용
3. 호가 (orderbook) — 기존 OrderBook + ExecutionList 를 하나의 탭으로 묶음
4. 재무 (financials) — 기존 FinancialsTab 재활용
5. 실적 (earnings) — placeholder (W2.3 에서 실데이터)
6. 뉴스/공시 (news) — 기존 NewsTab + DisclosuresTab 통합
7. 수급 (flow) — 기존 SupplyDemandTab 재활용
8. 비교 (compare) — placeholder (W2.3 에서 구현)

### 제거/숨김 탭 (V3 범위 제외)
- 공매도/신용 (short), 내부자 (insider), 배당 (dividend), 섹터 (sector), 거시경제 (macro)
- 파일은 유지 (`components/stocks/dashboard/*`) — 삭제하지 않음 (추후 개요/재무 탭 서브섹션 활용 가능)
- 라우팅에서만 제외

---

## STEP 0 — 사전 확인

```bash
cd ~/Desktop/OTMarketing && git status && npm run build 2>&1 | tail -20
```

- 빌드 에러 0 확인 후 진행.
- 에러 있으면 먼저 고치고 다시 시도.

---

## STEP 1 — 탭 Key 타입 정의 + 상수 파일

**신규 파일**: `lib/constants/stock-tabs.ts`

```typescript
export const STOCK_TABS = [
  { key: 'overview', label: '개요' },
  { key: 'chart', label: '차트' },
  { key: 'orderbook', label: '호가' },
  { key: 'financials', label: '재무' },
  { key: 'earnings', label: '실적' },
  { key: 'news', label: '뉴스/공시' },
  { key: 'flow', label: '수급' },
  { key: 'compare', label: '비교' },
] as const;

export type StockTabKey = (typeof STOCK_TABS)[number]['key'];

export const DEFAULT_STOCK_TAB: StockTabKey = 'overview';
```

---

## STEP 2 — StockHeader 컴포넌트 (라이트 테마 Server Component)

**신규 파일**: `components/stocks/StockHeader.tsx`

```tsx
import Link from 'next/link';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import WatchlistToggle from '@/components/stocks/WatchlistToggle';
import type { Stock } from '@/types/stock';

interface Props {
  stock: Stock;
  currentPrice: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
}

export default function StockHeader({ stock, currentPrice, priceChange, priceChangePercent }: Props) {
  const isUp = (priceChange ?? 0) >= 0;
  const currency = stock.country === 'KR' ? 'KRW' : 'USD';

  return (
    <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-black">{stock.name_ko || stock.name_en}</h1>
              <span className="text-[#666666] text-sm font-mono-price">{stock.symbol}</span>
              <span className="px-2 py-0.5 text-xs rounded bg-[#F5F7FA] border border-[#E5E7EB] text-[#666666] font-bold">
                {stock.market}
              </span>
            </div>
            {stock.sector && <p className="text-[#666666] text-sm mt-1">{stock.sector}</p>}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {currentPrice != null && (
            <div className="text-right">
              <p className={`text-2xl font-bold font-mono-price ${isUp ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                {formatCurrency(currentPrice, currency)}
              </p>
              <p className={`text-sm font-mono-price font-bold ${isUp ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                {isUp ? '+' : ''}{formatCurrency(priceChange, currency)} ({formatPercent(priceChangePercent)})
              </p>
            </div>
          )}

          <WatchlistToggle symbol={stock.symbol} country={stock.country || 'KR'} />

          <Link
            href={`/stocks/${stock.symbol}/analysis`}
            className="flex items-center gap-2 px-4 py-2 bg-[#0ABAB5] text-white hover:bg-[#099b96] transition-colors text-sm font-bold rounded"
          >
            <TrendingUp className="w-4 h-4" />
            AI 분석
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 3 — WatchlistToggle 분리 (Client Component)

**신규 파일**: `components/stocks/WatchlistToggle.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/watchlist';

export default function WatchlistToggle({ symbol, country }: { symbol: string; country: string }) {
  const { user } = useAuthStore();
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    if (!user || !symbol) return;
    isInWatchlist(user.id, symbol.toUpperCase()).then(setStarred);
  }, [user, symbol]);

  if (!user) return null;

  const toggle = async () => {
    const sym = symbol.toUpperCase();
    if (starred) {
      await removeFromWatchlist(user.id, sym);
      setStarred(false);
    } else {
      await addToWatchlist(user.id, sym, country);
      setStarred(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`p-2 border rounded ${starred ? 'text-[#C9A96E] border-[#C9A96E]' : 'text-[#666666] border-[#E5E7EB]'} hover:text-[#C9A96E]`}
    >
      <Star className="w-5 h-5" fill={starred ? '#C9A96E' : 'none'} />
    </button>
  );
}
```

---

## STEP 4 — StockDetailTabs (Client Component, URL 탭 상태)

**신규 파일**: `components/stocks/StockDetailTabs.tsx`

```tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { STOCK_TABS, DEFAULT_STOCK_TAB, type StockTabKey } from '@/lib/constants/stock-tabs';
import type { Stock } from '@/types/stock';

import OverviewTab from '@/components/stocks/tabs/OverviewTab';
import ChartTab from '@/components/stocks/dashboard/ChartTab';
import OrderbookTab from '@/components/stocks/tabs/OrderbookTab';
import FinancialsTab from '@/components/stocks/dashboard/FinancialsTab';
import EarningsTab from '@/components/stocks/tabs/EarningsTab';
import NewsDisclosureTab from '@/components/stocks/tabs/NewsDisclosureTab';
import SupplyDemandTab from '@/components/stocks/dashboard/SupplyDemandTab';
import CompareTab from '@/components/stocks/tabs/CompareTab';

interface Props {
  stock: Stock;
}

export default function StockDetailTabs({ stock }: Props) {
  const params = useSearchParams();
  const raw = params.get('tab');
  const active: StockTabKey = (STOCK_TABS.find((t) => t.key === raw)?.key ?? DEFAULT_STOCK_TAB) as StockTabKey;

  function renderTab() {
    switch (active) {
      case 'overview':
        return <OverviewTab stock={stock} />;
      case 'chart':
        return <ChartTab symbol={stock.symbol} market={stock.market} country={stock.country} />;
      case 'orderbook':
        return <OrderbookTab symbol={stock.symbol} country={stock.country || 'KR'} />;
      case 'financials':
        return <FinancialsTab stockId={stock.id} />;
      case 'earnings':
        return <EarningsTab stockId={stock.id} symbol={stock.symbol} />;
      case 'news':
        return <NewsDisclosureTab stockId={stock.id} symbol={stock.symbol} />;
      case 'flow':
        return <SupplyDemandTab stockId={stock.id} />;
      case 'compare':
        return <CompareTab stock={stock} />;
      default:
        return null;
    }
  }

  return (
    <>
      {/* Tab navigation — URL 기반 */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 overflow-x-auto sticky top-0 z-[5]">
        <div className="max-w-7xl mx-auto flex gap-1">
          {STOCK_TABS.map((tab) => {
            const href = `?tab=${tab.key}`;
            const isActive = active === tab.key;
            return (
              <Link
                key={tab.key}
                href={href}
                scroll={false}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0ABAB5] text-[#0ABAB5]'
                    : 'border-transparent text-[#666666] hover:text-black'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 py-6 bg-white min-h-[60vh]">
        {renderTab()}
      </div>
    </>
  );
}
```

---

## STEP 5 — 개요 탭 기본 뼈대 (KPI placeholder, 실데이터는 W2.2)

**신규 파일**: `components/stocks/tabs/OverviewTab.tsx`

```tsx
'use client';

import type { Stock } from '@/types/stock';

export default function OverviewTab({ stock }: { stock: Stock }) {
  // TODO(W2.2): DART /api/dart/company + KIS 가격 데이터로 KPI 채우기
  const KPIS = [
    { label: '시가총액', value: '—' },
    { label: 'PER', value: '—' },
    { label: 'PBR', value: '—' },
    { label: 'EPS', value: '—' },
    { label: 'BPS', value: '—' },
    { label: 'ROE', value: '—' },
    { label: '배당수익률', value: '—' },
    { label: '52주 범위', value: '—' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI 그리드 */}
      <div>
        <h2 className="text-base font-bold text-black mb-3">핵심 지표</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-3"
            >
              <p className="text-[#666666] text-xs font-bold mb-1">{k.label}</p>
              <p className="text-black font-mono-price font-bold text-base">{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 기업개황 */}
      <div>
        <h2 className="text-base font-bold text-black mb-3">기업개황</h2>
        <div className="bg-white border border-[#E5E7EB] rounded p-4 text-sm text-[#666666]">
          <p>
            대표이사, 본사 주소, 홈페이지, 전화번호, 업종, 설립일 등 기업 기본 정보는 W2.2 에서
            DART API 로 연동됩니다.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-bold text-black">종목코드: </span>{stock.symbol}</div>
            <div><span className="font-bold text-black">시장: </span>{stock.market}</div>
            <div><span className="font-bold text-black">섹터: </span>{stock.sector ?? '—'}</div>
            <div><span className="font-bold text-black">국가: </span>{stock.country}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 6 — 호가 탭 (OrderBook + ExecutionList 묶기)

**신규 파일**: `components/stocks/tabs/OrderbookTab.tsx`

```tsx
'use client';

import OrderBook from '@/components/stocks/OrderBook';
import ExecutionList from '@/components/stocks/ExecutionList';

export default function OrderbookTab({ symbol, country }: { symbol: string; country: string }) {
  if (country !== 'KR') {
    return (
      <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
        미국 주식은 호가 데이터를 제공하지 않습니다. 차트 탭을 이용해주세요.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-[#E5E7EB] rounded h-[520px] overflow-hidden">
        <OrderBook symbol={symbol} />
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded h-[520px] overflow-hidden">
        <ExecutionList symbol={symbol} />
      </div>
    </div>
  );
}
```

---

## STEP 7 — 실적 탭 placeholder

**신규 파일**: `components/stocks/tabs/EarningsTab.tsx`

```tsx
'use client';

export default function EarningsTab({ stockId, symbol }: { stockId: string; symbol: string }) {
  return (
    <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
      <p className="font-bold text-black mb-2">실적 탭</p>
      <p className="text-xs">
        분기별 매출/영업이익/순이익 히스토리 + 어닝 서프라이즈/미스 (W2.3 에서 구현 예정).
      </p>
      <p className="text-[10px] mt-3">stockId: {stockId} / symbol: {symbol}</p>
    </div>
  );
}
```

---

## STEP 8 — 뉴스/공시 통합 탭

**신규 파일**: `components/stocks/tabs/NewsDisclosureTab.tsx`

```tsx
'use client';

import { useState } from 'react';
import NewsTab from '@/components/stocks/dashboard/NewsTab';
import DisclosuresTab from '@/components/stocks/dashboard/DisclosuresTab';

export default function NewsDisclosureTab({ stockId, symbol }: { stockId: string; symbol: string }) {
  const [sub, setSub] = useState<'news' | 'disclosures'>('news');

  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {(['news', 'disclosures'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={`px-4 py-2 text-sm font-bold ${
              sub === s ? 'text-[#0ABAB5] border-b-2 border-[#0ABAB5]' : 'text-[#666666] hover:text-black'
            }`}
          >
            {s === 'news' ? '뉴스' : '공시'}
          </button>
        ))}
      </div>
      {sub === 'news' ? (
        <NewsTab stockId={stockId} />
      ) : (
        <DisclosuresTab stockId={stockId} symbol={symbol} />
      )}
    </div>
  );
}
```

---

## STEP 9 — 비교 탭 placeholder

**신규 파일**: `components/stocks/tabs/CompareTab.tsx`

```tsx
'use client';

import type { Stock } from '@/types/stock';

export default function CompareTab({ stock }: { stock: Stock }) {
  return (
    <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
      <p className="font-bold text-black mb-2">종목 비교</p>
      <p className="text-xs">
        {stock.symbol} 와 같은 섹터 Top 5 종목과 KPI 비교 (W2.3 에서 구현 예정).
      </p>
      <p className="text-[10px] mt-3">현재 섹터: {stock.sector ?? '—'}</p>
    </div>
  );
}
```

---

## STEP 10 — `app/stocks/[symbol]/page.tsx` 전면 재작성 (Client + 라이트 테마)

**기존 파일 교체**: `app/stocks/[symbol]/page.tsx`

> 주의: Next.js 16 App Router. Server Component + 내부 Client 조합을 쓰되, 기존
> 가격 fetch 는 Supabase client 기반이므로 이번 세션은 **Client Component 로 유지** 하고
> SSR 전환은 W2.2 에서 DART 연동과 함께 처리.
> AuthGuard 제거, 다크 테마 제거가 이번 단계의 핵심.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stock } from '@/types/stock';
import StockHeader from '@/components/stocks/StockHeader';
import StockDetailTabs from '@/components/stocks/StockDetailTabs';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);

  // 종목 기본 정보
  useEffect(() => {
    async function loadStock() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();
      if (data) setStock(data as Stock);
      setLoading(false);
    }
    loadStock();
  }, [symbol]);

  // 최신 가격
  useEffect(() => {
    if (!stock) return;
    async function loadPrice() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stock_prices')
        .select('close, change, change_percent')
        .eq('stock_id', stock!.id)
        .order('trade_date', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setCurrentPrice(data.close);
        setPriceChange(data.change);
        setPriceChangePercent(data.change_percent);
      }
    }
    loadPrice();
  }, [stock]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white text-black">
        <p className="text-xl mb-4">종목을 찾을 수 없습니다</p>
        <Link href="/stocks" className="text-[#0ABAB5] hover:underline font-bold">
          종목 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <StockHeader
        stock={stock}
        currentPrice={currentPrice}
        priceChange={priceChange}
        priceChangePercent={priceChangePercent}
      />
      <StockDetailTabs stock={stock} />
    </div>
  );
}
```

---

## STEP 11 — 기존 탭 컴포넌트 라이트 테마 일괄 치환

`components/stocks/dashboard/` 안의 10개 파일 중 **유지되는 4개** (ChartTab, FinancialsTab, NewsTab, DisclosuresTab, SupplyDemandTab) 에서 다크 클래스 일괄 치환.

> 주의: 사용되지 않는 ShortSellingTab, InsiderTab, DividendTab, SectorTab, MacroTab 은 **이번 세션에서 건드리지 않음** (파일 보존).

### 치환 대상 5개 파일
- `components/stocks/dashboard/ChartTab.tsx`
- `components/stocks/dashboard/FinancialsTab.tsx`
- `components/stocks/dashboard/NewsTab.tsx`
- `components/stocks/dashboard/DisclosuresTab.tsx`
- `components/stocks/dashboard/SupplyDemandTab.tsx`

### 치환 규칙 (각 파일에서 문자열 교체)

| Before | After |
|---|---|
| `bg-dark-900` | `bg-white` |
| `bg-dark-800` | `bg-white` |
| `bg-dark-700` | `bg-[#F5F7FA]` |
| `bg-dark-600` | `bg-[#F5F7FA]` |
| `border-border` | `border-[#E5E7EB]` |
| `text-text-primary` | `text-black` |
| `text-text-secondary` | `text-[#666666]` |
| `text-accent` | `text-[#0ABAB5]` |
| `border-accent` | `border-[#0ABAB5]` |
| `text-up` | `text-[#FF3B30]` |
| `text-down` | `text-[#007AFF]` |
| `bg-[#0D1117]` | `bg-white` |
| `bg-[#161B22]` | `bg-[#F5F7FA]` |
| `border-[#2D3748]` | `border-[#E5E7EB]` |
| `text-white` (단독 사용일 때) | `text-black` |

**Claude Code 실행 지시**: 각 파일을 Read 후, 위 테이블 순서대로 Edit (replace_all) 적용.
단, `text-white` 는 `bg-[#0ABAB5] text-white` 같이 버튼 내부에 쓰인 경우는 건드리지 말 것.
(이 경우 버튼 배경색이 강조색이라 white text 가 유지돼야 함.)
수동 판단 필요 시 해당 줄만 남기고 나머지는 교체.

---

## STEP 12 — `components/stocks/OrderBook.tsx`, `ExecutionList.tsx` 라이트 테마

이 2개 파일도 다크 테마로 되어 있을 가능성이 높으므로 STEP 11 과 동일 규칙으로 치환.

---

## STEP 13 — 빌드 검증

```bash
cd ~/Desktop/OTMarketing && npm run build 2>&1 | tail -40
```

- **통과 기준**: 0 error
- 경고는 허용 (단, 새로 생긴 경고는 기록)

---

## STEP 14 — dev 서버 구동 + 스모크 테스트

```bash
cd ~/Desktop/OTMarketing && npm run dev
```

**수동 체크리스트** (브라우저 `http://localhost:3000/stocks/005930`):
- [ ] 페이지 로드 시 다크 잔재 0개 (전체 흰 배경)
- [ ] 상단 헤더: 종목명 / 심볼 / 시장 배지 / 섹터 / 현재가 / AI 분석 버튼 정상
- [ ] 8개 탭 순서대로 표시 (개요 / 차트 / 호가 / 재무 / 실적 / 뉴스/공시 / 수급 / 비교)
- [ ] 개요 탭: KPI 8개 placeholder + 기업개황 placeholder 표시
- [ ] 탭 클릭 시 URL 이 `?tab=차트키` 로 변경
- [ ] 뒤로가기 / 앞으로가기 시 탭 상태 유지
- [ ] 비로그인 상태로 접근 → 차단되지 않고 정상 렌더 (AuthGuard 제거됨)
- [ ] 차트 탭: TradingView 차트 로드
- [ ] 호가 탭: 한국 종목 (005930) 은 호가창 + 체결 2분할, 미국 종목 (AAPL) 은 안내문

---

## STEP 15 — git 커밋 (승인 대기)

**커밋 메시지 후보**:
```
feat: stock detail page W2.1 — 8 tabs + light theme + URL tab state + remove AuthGuard

- 8 tabs: 개요/차트/호가/재무/실적/뉴스공시/수급/비교
- StockHeader / StockDetailTabs / WatchlistToggle 분리
- URL ?tab= 기반 탭 상태 (뒤로가기 지원)
- AuthGuard 제거 — 비로그인 접근 허용
- 5개 기존 탭 (ChartTab/FinancialsTab/NewsTab/DisclosuresTab/SupplyDemandTab) 라이트 테마 치환
- OrderBook / ExecutionList 라이트 테마 치환
- ShortSelling/Insider/Dividend/Sector/Macro 탭은 파일 보존 (라우팅에서 제외)
```

**주의**:
- 바로 push 하지 말고 Cowork 에게 돌아와서 Chrome MCP 검증 먼저.
- 사용자가 "응 푸시해" 라고 명시적으로 허락할 때만 `git push`.

---

## 📝 세션 종료 시 (검증 완료 후)

1. 4개 문서 헤더 오늘 날짜 확인
2. `docs/CHANGELOG.md` 에 W2.1 블록 추가
3. `session-context.md` 에 세션 #10 추가
4. `docs/NEXT_SESSION_START.md` 최신화 (다음 작업: W2.2 DART 연동)

**명령어 종료.** 막히면 Cowork 에게 돌아와서 상의.
