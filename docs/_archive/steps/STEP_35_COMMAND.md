# STEP 35 — `/stocks/[symbol]` KIS Fallback (테마 드릴스루 복구)

**🚀 실행 명령어 (Sonnet):**

```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

Claude Code 세션에서:

```
@docs/STEP_35_COMMAND.md 파일 내용대로 실행해줘
```

---

## 전제 상태

- 이전 커밋: `8bfbbbb` (STEP 34 테마 큐레이션 + 위젯 실데이터)
- **발견된 문제**: STEP 34에서 추가한 `data/themes.json` 50개 종목 중 **37개가 Supabase `stocks` 테이블에 없음**. 사용자가 `/analysis` ThemeGroups에서 LG화학(051910), 삼성E&A(028050), HD한국조선해양(009540) 등 클릭 → `/stocks/[symbol]` → "종목을 찾을 수 없습니다" 오류.
- 동일 문제: ScreenerClient, WatchlistWidget, NetBuyTop 위젯에서도 Supabase 미수록 종목 클릭 시 404.
- 근본 원인: `/stocks/[symbol]/page.tsx` 와 `/stocks/[symbol]/analysis/page.tsx` 가 Supabase `stocks` 테이블에만 의존. 002 seed는 15개, 스크립트로 upsert되지 않은 상태.

## 목표

`/stocks/[symbol]` 페이지를 **Supabase 의존에서 해방** — 유효한 6자리 한국 종목코드라면 어디서 클릭해도 페이지가 렌더되도록.

전략: Supabase 히트 시 full Stock 객체, 미스 시 KIS `/api/kis/price` 로 기본 정보 구성.

## 변경 사항

### 1. `/api/stocks/resolve` 엔드포인트 신설

파일: `app/api/stocks/resolve/route.ts` (신규)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchKisApi } from '@/lib/kis';

export const runtime = 'nodejs';

// 10분 인메모리 캐시 (KIS fallback 결과만)
interface CachedStock {
  data: unknown;
  cachedAt: number;
}
const fallbackCache = new Map<string, CachedStock>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }

  const sym = symbol.toUpperCase();

  // 1. Supabase 먼저 조회
  const supabase = await createClient();
  const { data: supabaseStock } = await supabase
    .from('stocks')
    .select('id, symbol, name_ko, name_en, market, country, sector, industry, market_cap, is_active, created_at, updated_at')
    .eq('symbol', sym)
    .maybeSingle();

  if (supabaseStock) {
    return NextResponse.json({ stock: supabaseStock, source: 'supabase' });
  }

  // 2. KIS fallback — 6자리 숫자만 한국 종목으로 간주
  if (!/^[0-9]{6}$/.test(sym)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // 캐시 체크
  const cached = fallbackCache.get(sym);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ stock: cached.data, source: 'kis-cache' });
  }

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-price',
      trId: 'FHKST01010100',
      params: { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: sym },
    });
    const o = data.output;
    if (!o || !o.hts_kor_isnm) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    // KIS 응답으로 Stock 형태 합성 — id는 null로 표시 (DB 미수록 의미)
    const syntheticStock = {
      id: null,
      symbol: sym,
      name_ko: o.hts_kor_isnm as string,
      name_en: null,
      market: 'KOSPI', // KIS inquire-price는 시장 구분 미제공 — 기본값
      country: 'KR',
      sector: null,
      industry: null,
      market_cap: o.hts_avls ? parseInt(o.hts_avls, 10) : null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    fallbackCache.set(sym, { data: syntheticStock, cachedAt: Date.now() });
    return NextResponse.json({ stock: syntheticStock, source: 'kis' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

### 2. `types/stock.ts` — `Stock.id` 를 nullable로 완화

파일: `types/stock.ts`

`Stock` 인터페이스의 `id` 타입 수정:

```ts
export interface Stock {
  id: number | null;  // null = Supabase 미수록, KIS fallback만 사용 가능
  symbol: string;
  // ... 나머지 필드 동일
}
```

나머지 인터페이스(`Financial.stock_id` 등)는 그대로 유지 — DB 테이블 FK라 non-null.

### 3. `/stocks/[symbol]/page.tsx` — resolve API 사용

파일: `app/stocks/[symbol]/page.tsx`

`useEffect` 내부의 Supabase 직접 호출을 `/api/stocks/resolve` fetch로 교체:

```tsx
// 기존:
// const supabase = createClient();
// const { data } = await supabase
//   .from('stocks')
//   .select('*')
//   .eq('symbol', symbol.toUpperCase())
//   .single();
// if (data) setStock(data as Stock);

// 변경:
async function loadStock() {
  try {
    const res = await fetch(`/api/stocks/resolve?symbol=${symbol.toUpperCase()}`);
    const json = await res.json();
    if (json.stock) setStock(json.stock as Stock);
  } catch {
    // 무시 — stock remains null → 404 UI
  }
  setLoading(false);
}
loadStock();
```

최신가격 로드 로직(`stock_prices` 조회)은 `stock.id !== null` 일 때만 실행하도록 가드 추가:

```tsx
useEffect(() => {
  if (!stock || stock.id === null) return;  // Supabase 미수록은 skip — StockHeader가 KIS 가격 직접 fetch
  async function loadPrice() {
    // 기존 로직 그대로
  }
  loadPrice();
}, [stock]);
```

### 4. `StockHeader.tsx` — KIS 가격 fallback 추가

파일: `components/stocks/StockHeader.tsx`

`currentPrice` props가 null이고 `stock.id === null` (KIS fallback 케이스)일 때, 자체적으로 `/api/kis/price?symbol=XXX` 를 fetch해서 현재가 표시. 기존 props도 그대로 호환.

```tsx
'use client';

import { useEffect, useState } from 'react';
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

export default function StockHeader({ stock, currentPrice: propPrice, priceChange: propChange, priceChangePercent: propPct }: Props) {
  const [kisPrice, setKisPrice] = useState<{ price: number; change: number; changePercent: number } | null>(null);

  useEffect(() => {
    // Supabase id 없을 때만 KIS 직접 조회
    if (stock.id !== null || stock.country !== 'KR') return;
    fetch(`/api/kis/price?symbol=${stock.symbol}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.price) setKisPrice({ price: d.price, change: d.change, changePercent: d.changePercent });
      })
      .catch(() => {});
  }, [stock.id, stock.symbol, stock.country]);

  const currentPrice = propPrice ?? kisPrice?.price ?? null;
  const priceChange = propChange ?? kisPrice?.change ?? null;
  const priceChangePercent = propPct ?? kisPrice?.changePercent ?? null;

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
            {stock.id === null && (
              <p className="text-[10px] text-[#999] mt-1">※ 기본 정보만 표시 (확장 데이터 준비 중)</p>
            )}
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

### 5. `StockDetailTabs.tsx` — Supabase 의존 탭 정직화

파일: `components/stocks/StockDetailTabs.tsx`

`stock.id === null` 일 때 DB 필요 탭(financials, earnings, news, flow)을 disabled로 표시하고 클릭 시 안내. chart / orderbook / compare / overview 는 정상 작동 (KIS/DART API 직접 사용):

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

// DB id가 필요한 탭 (stock.id === null이면 disabled)
const DB_REQUIRED_TABS: StockTabKey[] = ['financials', 'earnings', 'news', 'flow'];

interface Props {
  stock: Stock;
}

export default function StockDetailTabs({ stock }: Props) {
  const params = useSearchParams();
  const raw = params.get('tab');
  const active: StockTabKey = (STOCK_TABS.find((t) => t.key === raw)?.key ?? DEFAULT_STOCK_TAB) as StockTabKey;
  const isDbMissing = stock.id === null;

  function renderTab() {
    // DB 필요 탭인데 id 없으면 안내 UI
    if (isDbMissing && DB_REQUIRED_TABS.includes(active)) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-black font-bold mb-2">이 탭은 확장 데이터 연결 후 이용 가능합니다</p>
          <p className="text-sm text-[#666]">
            종목 기본 정보는 KIS API 실시간 조회 중 (차트 · 호가 · 비교 탭은 정상 작동)
          </p>
        </div>
      );
    }

    switch (active) {
      case 'overview':
        return <OverviewTab stock={stock} />;
      case 'chart':
        return <ChartTab symbol={stock.symbol} market={stock.market} country={stock.country} />;
      case 'orderbook':
        return <OrderbookTab symbol={stock.symbol} country={stock.country || 'KR'} />;
      case 'financials':
        return <FinancialsTab stockId={stock.id!} />;
      case 'earnings':
        return <EarningsTab stockId={stock.id!} symbol={stock.symbol} />;
      case 'news':
        return <NewsDisclosureTab stockId={stock.id!} symbol={stock.symbol} />;
      case 'flow':
        return <SupplyDemandTab stockId={stock.id!} />;
      case 'compare':
        return <CompareTab stock={stock} />;
      default:
        return null;
    }
  }

  return (
    <>
      <div className="border-b border-[#E5E7EB] bg-white px-6 overflow-x-auto sticky top-0 z-[5]">
        <div className="max-w-7xl mx-auto flex gap-1">
          {STOCK_TABS.map((tab) => {
            const href = `?tab=${tab.key}`;
            const isActive = active === tab.key;
            const isDisabled = isDbMissing && DB_REQUIRED_TABS.includes(tab.key as StockTabKey);
            return (
              <Link
                key={tab.key}
                href={href}
                scroll={false}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0ABAB5] text-[#0ABAB5]'
                    : isDisabled
                    ? 'border-transparent text-[#BBB]'
                    : 'border-transparent text-[#666666] hover:text-black'
                }`}
                title={isDisabled ? '확장 데이터 연결 후 사용 가능' : undefined}
              >
                {tab.label}
                {isDisabled && <span className="ml-1 text-[10px]">🔒</span>}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 bg-white min-h-[60vh]">
        {renderTab()}
      </div>
    </>
  );
}
```

### 6. `/stocks/[symbol]/analysis/page.tsx` — 동일하게 resolve 사용

파일: `app/stocks/[symbol]/analysis/page.tsx`

`useEffect` 내부 Supabase 직접 호출 → `/api/stocks/resolve` fetch로 교체. 추가로 `stock.id === null` 시 AI 분석 탭도 안내 UI:

```tsx
useEffect(() => {
  async function loadStock() {
    try {
      const res = await fetch(`/api/stocks/resolve?symbol=${symbol.toUpperCase()}`);
      const json = await res.json();
      if (json.stock) setStock(json.stock as Stock);
    } catch {}
    setLoading(false);
  }
  loadStock();
}, [symbol]);

// ... renderTab에 가드 추가:
function renderTab() {
  if (stock && stock.id === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-dark-800 rounded-lg">
        <p className="text-text-primary font-bold mb-2">AI 분석은 확장 데이터 연결 후 이용 가능합니다</p>
        <Link href={`/stocks/${symbol}`} className="text-accent hover:underline text-sm mt-2">
          종목 대시보드로 돌아가기
        </Link>
      </div>
    );
  }
  // 기존 switch 그대로
}
```

### 7. `/api/stocks/overview` — Supabase 미스 시 KIS fallback

파일: `app/api/stocks/overview/route.ts`

`stock` 조회 실패 시 KIS로 기본 KPI 구성 (marketCap, PER, PBR, 52주 범위):

기존 `if (!stock) return NextResponse.json({ error: 'stock not found' }, { status: 404 });` 를 아래로 교체:

```ts
  if (!stock) {
    // KIS fallback — 6자리 한국 종목만
    if (!/^[0-9]{6}$/.test(symbol.toUpperCase())) {
      return NextResponse.json({ error: 'stock not found' }, { status: 404 });
    }
    try {
      const { fetchKisApi } = await import('@/lib/kis');
      const data = await fetchKisApi({
        endpoint: '/uapi/domestic-stock/v1/quotations/inquire-price',
        trId: 'FHKST01010100',
        params: { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: symbol.toUpperCase() },
      });
      const o = data.output;
      if (!o) return NextResponse.json({ error: 'not found' }, { status: 404 });

      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        name: o.hts_kor_isnm,
        market: 'KOSPI',
        country: 'KR',
        sector: null,
        industry: null,
        kpis: {
          marketCap: o.hts_avls ? formatKRW(parseInt(o.hts_avls, 10) * 100_000_000) : '—',
          per: fmtNum(parseFloat(o.per || '0') || null),
          pbr: fmtNum(parseFloat(o.pbr || '0') || null),
          eps: '—',
          bps: '—',
          roe: '—',
          dividendYield: '—',
          yearRange: o.stck_dryc_hgpr && o.stck_dryc_lwpr
            ? `${parseInt(o.stck_dryc_lwpr, 10).toLocaleString()} ~ ${parseInt(o.stck_dryc_hgpr, 10).toLocaleString()} KRW`
            : '—',
        },
        meta: {
          latestFinancialPeriod: null,
          latestFinancialType: 'KIS-live',
          priceDataPoints: 0,
        },
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }
```

### 8. 빌드 & smoke test

```bash
cd ~/Desktop/OTMarketing && npm run build
```

TypeScript 에러 0개 확인. 특히 `stock.id` nullable 변경으로 인한 파급 에러 있으면 즉시 수정.

런타임 확인 (서버 돌고 있으면):
```bash
# Supabase seed 안에 있는 종목 — Supabase 경로
curl -s http://localhost:3000/api/stocks/resolve?symbol=005930 | jq '.source'
# → "supabase"

# Supabase seed 밖 종목 — KIS fallback
curl -s http://localhost:3000/api/stocks/resolve?symbol=051910 | jq '.source'
# → "kis"
```

브라우저로 `/stocks/051910` (LG화학, Supabase 미수록) 접속 → 페이지가 뜨고 가격/52주 범위/시총 표시되어야 함. 재무/어닝 탭은 🔒 표시.

### 9. 커밋 & 푸시

```bash
git add -A
git commit -m "feat(stocks): KIS fallback for /stocks/[symbol] — unlock theme drillthrough

Problem: STEP 34 themes.json curation added 50 stocks, but only 13 of
them exist in Supabase 'stocks' seed. Users clicking 37 theme stocks
(LG화학, HD한국조선해양, 삼성E&A, etc.) from /analysis ThemeGroups
hit '종목을 찾을 수 없습니다'.

Fix: Decouple /stocks/[symbol] pages from Supabase 'stocks' table.

- New /api/stocks/resolve: tries Supabase first, falls back to KIS
  inquire-price for valid 6-digit KR tickers. 10-min cache. Returns
  synthetic Stock with id=null to signal 'basic data only'.
- Stock.id type: number -> number | null (null = KIS-only).
- /stocks/[symbol]/page.tsx + /stocks/[symbol]/analysis/page.tsx:
  use /api/stocks/resolve instead of direct Supabase query.
- StockHeader: if stock.id === null, fetch /api/kis/price for live
  price display. Shows '기본 정보만 표시' notice.
- StockDetailTabs: financials/earnings/news/flow tabs are DB-only.
  When stock.id === null, shown disabled with 🔒 + explainer panel.
  chart/orderbook/compare/overview work fine (KIS/DART direct).
- /api/stocks/overview: same KIS fallback for kpis (marketCap, PER,
  PBR, 52w range). EPS/BPS/ROE show '—'.

Any valid 6-digit KR ticker now renders a functional stock page.
Supabase seed expansion (scripts/seed-stocks.py) becomes optional
polish rather than blocker."

git push
```

## 세션 종료 체크

Cowork이 4개 문서 헤더 날짜를 2026-04-22로 업데이트 + CHANGELOG 엔트리:
- `CLAUDE.md`
- `docs/CHANGELOG.md`
- `session-context.md`
- `docs/NEXT_SESSION_START.md`

## 다음 STEP 예고

**STEP 36 후보** (Cowork 자동 선택):
- **A. `scripts/seed-stocks.py` 실행 가이드** — Supabase에 전 KOSPI/KOSDAQ 종목 업서트. DB 필요 탭이 많은 종목에 복원됨. 하지만 Python env 세팅이 필요.
- **B. KRX 업종별 지수 스크래핑** (STEP 33 deferred) — `/api/krx/sector` + SectorHeatmap 복원
- **C. /api/themes 캐시 사전 워밍** — Vercel cron으로 10분마다 프리패치, 첫 로드 즉시 응답
- **D. AdColumn 전역 제거 확인** — NEXT_SESSION_START의 잔여 레거시 점검
