# STEP 59 — /global 페이지 stub 제거 + 실데이터 전환

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표:** `/global` 페이지를 하드코딩 dummy 테이블(`WidgetDetailStub`) 에서 벗어나 Yahoo Finance 실데이터 기반으로 전환한다. 국내/미국/선물/환율/채권/원자재/아시아/유럽 8개 섹션을 Market map 카드로 렌더링하고, 섹션 필터 세그먼트를 추가한다.

**전제 상태 (직전 커밋):** STEP 58 완료 (NetBuyTopWidget + /net-buy TopTab 개선 — commit `90dbdd7`)

---

## 1. 실데이터 API 확장 — `app/api/global/route.ts` (신규)

기존 `/api/home/global` 은 홈 티커바용 9개 심볼만 반환. 풀페이지용으로 30+개 심볼을 섹션별로 묶어 반환하는 전용 API 신설.

**파일:** `app/api/global/route.ts`

```typescript
import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

interface SymbolDef {
  symbol: string;
  label: string;
  section: '국내' | '미국' | '선물' | '환율' | '채권' | '원자재' | '아시아' | '유럽';
}

const SYMBOLS: SymbolDef[] = [
  // 국내
  { symbol: '^KS11',    label: 'KOSPI',        section: '국내' },
  { symbol: '^KS200',   label: 'KOSPI 200',    section: '국내' },
  { symbol: '^KQ11',    label: 'KOSDAQ',       section: '국내' },
  // 미국
  { symbol: '^GSPC',    label: 'S&P 500',      section: '미국' },
  { symbol: '^IXIC',    label: 'NASDAQ',       section: '미국' },
  { symbol: '^DJI',     label: 'DOW',          section: '미국' },
  { symbol: '^RUT',     label: 'Russell 2000', section: '미국' },
  { symbol: '^VIX',     label: 'VIX',          section: '미국' },
  // 선물
  { symbol: 'ES=F',     label: 'S&P 500 선물', section: '선물' },
  { symbol: 'NQ=F',     label: 'NASDAQ 선물',  section: '선물' },
  { symbol: 'YM=F',     label: 'DOW 선물',     section: '선물' },
  { symbol: 'RTY=F',    label: 'Russell 선물', section: '선물' },
  // 환율
  { symbol: 'USDKRW=X', label: 'USD/KRW',      section: '환율' },
  { symbol: 'USDJPY=X', label: 'USD/JPY',      section: '환율' },
  { symbol: 'EURUSD=X', label: 'EUR/USD',      section: '환율' },
  { symbol: 'GBPUSD=X', label: 'GBP/USD',      section: '환율' },
  { symbol: 'CNYKRW=X', label: 'CNY/KRW',      section: '환율' },
  // 채권
  { symbol: '^TNX',     label: '미국채 10Y',   section: '채권' },
  { symbol: '^FVX',     label: '미국채 5Y',    section: '채권' },
  { symbol: '^IRX',     label: '미국채 13W',   section: '채권' },
  { symbol: '^TYX',     label: '미국채 30Y',   section: '채권' },
  // 원자재
  { symbol: 'CL=F',     label: 'WTI 원유',     section: '원자재' },
  { symbol: 'BZ=F',     label: '브렌트유',     section: '원자재' },
  { symbol: 'GC=F',     label: '금 선물',      section: '원자재' },
  { symbol: 'SI=F',     label: '은 선물',      section: '원자재' },
  { symbol: 'NG=F',     label: '천연가스',     section: '원자재' },
  { symbol: 'HG=F',     label: '구리 선물',    section: '원자재' },
  // 아시아
  { symbol: '^N225',    label: '닛케이 225',   section: '아시아' },
  { symbol: '^HSI',     label: '항셍지수',     section: '아시아' },
  { symbol: '000001.SS',label: '상하이종합',   section: '아시아' },
  { symbol: '^TWII',    label: '대만 TAIEX',   section: '아시아' },
  // 유럽
  { symbol: '^GDAXI',   label: 'DAX',          section: '유럽' },
  { symbol: '^FTSE',    label: 'FTSE 100',     section: '유럽' },
  { symbol: '^FCHI',    label: 'CAC 40',       section: '유럽' },
  { symbol: '^STOXX50E',label: 'Euro Stoxx 50',section: '유럽' },
];

interface QuoteItem {
  section: string;
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export async function GET() {
  try {
    const symbols = SYMBOLS.map((s) => s.symbol);
    const quotes = await yahooFinance.quote(symbols);
    const arr = (Array.isArray(quotes) ? quotes : [quotes]) as Array<Record<string, unknown>>;

    const items: QuoteItem[] = SYMBOLS.map((s) => {
      const q = arr.find((r) => r.symbol === s.symbol);
      return {
        section: s.section,
        symbol: s.symbol,
        label: s.label,
        price: (q?.regularMarketPrice as number) ?? 0,
        change: (q?.regularMarketChange as number) ?? 0,
        changePercent: (q?.regularMarketChangePercent as number) ?? 0,
        fiftyTwoWeekHigh: (q?.fiftyTwoWeekHigh as number) ?? null,
        fiftyTwoWeekLow: (q?.fiftyTwoWeekLow as number) ?? null,
      };
    });

    return NextResponse.json(
      { items, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } },
    );
  } catch (e) {
    console.error('[api/global]', e);
    return NextResponse.json({ items: [], error: 'fetch_failed' }, { status: 502 });
  }
}

export const revalidate = 60;
```

---

## 2. 클라이언트 컴포넌트 — `components/global/GlobalPageClient.tsx` (신규)

**파일:** `components/global/GlobalPageClient.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface QuoteItem {
  section: string;
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

const SECTIONS = ['전체', '국내', '미국', '선물', '환율', '채권', '원자재', '아시아', '유럽'] as const;
type Section = (typeof SECTIONS)[number];

function fmt(n: number | null, digits = 2): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: digits });
  return n.toFixed(digits);
}

function isYield(symbol: string): boolean {
  return ['^TNX', '^FVX', '^IRX', '^TYX'].includes(symbol);
}

export default function GlobalPageClient() {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [section, setSection] = useState<Section>('전체');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/global');
        if (!res.ok) throw new Error('load fail');
        const d = await res.json();
        if (cancelled) return;
        setItems(d.items ?? []);
        setUpdatedAt(d.updatedAt ?? '');
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const filtered = section === '전체' ? items : items.filter((i) => i.section === section);

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">글로벌 지수</h1>
        <p className="text-sm text-[#666]">
          전 세계 주요 지수·환율·선물·채권·원자재 실시간. Yahoo Finance v2 · 60초 갱신.
          {updatedAt && <span className="ml-2 text-[#999]">최종 {new Date(updatedAt).toLocaleTimeString('ko-KR')}</span>}
        </p>
      </div>

      {/* 섹션 필터 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white flex-wrap">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={`text-xs font-bold px-3 py-2 transition-colors ${
                section === s
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="px-4 py-2.5 text-left w-20">구분</th>
                <th className="px-4 py-2.5 text-left">지수/종목</th>
                <th className="px-4 py-2.5 text-right w-28">현재가</th>
                <th className="px-4 py-2.5 text-right w-24">등락</th>
                <th className="px-4 py-2.5 text-right w-24">등락률</th>
                <th className="px-4 py-2.5 text-right w-28">52주 고가</th>
                <th className="px-4 py-2.5 text-right w-28">52주 저가</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#FF3B30]">데이터를 불러오지 못했습니다</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">데이터 없음</td></tr>
              )}
              {!loading && !error && filtered.map((r) => {
                const up = r.changePercent >= 0;
                const yieldSym = isYield(r.symbol);
                return (
                  <tr key={r.symbol} className="border-t border-[#F0F0F0] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-2.5 text-[#888] text-xs">{r.section}</td>
                    <td className="px-4 py-2.5 text-black font-bold">{r.label}</td>
                    <td className="px-4 py-2.5 text-right text-[#333] tabular-nums">
                      {yieldSym ? `${fmt(r.price, 3)}%` : fmt(r.price)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {up ? '+' : ''}{fmt(r.change, yieldSym ? 3 : 2)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {up ? '+' : ''}{r.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#666] tabular-nums">
                      {yieldSym ? (r.fiftyTwoWeekHigh !== null ? `${fmt(r.fiftyTwoWeekHigh, 3)}%` : '—') : fmt(r.fiftyTwoWeekHigh)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#666] tabular-nums">
                      {yieldSym ? (r.fiftyTwoWeekLow !== null ? `${fmt(r.fiftyTwoWeekLow, 3)}%` : '—') : fmt(r.fiftyTwoWeekLow)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. 페이지 교체 — `app/global/page.tsx`

기존 stub 삭제, Client 컴포넌트 호출만 남김:

```typescript
import type { Metadata } from 'next';
import GlobalPageClient from '@/components/global/GlobalPageClient';

export const metadata: Metadata = { title: '글로벌 지수 — StockTerminal' };

export default function GlobalPage() {
  return <GlobalPageClient />;
}
```

---

## 4. 검증

```bash
cd ~/Desktop/OTMarketing
npm run build
```

에러 없으면 커밋 + push:

```bash
git add -A
git commit -m "feat(global): stub → Yahoo Finance 실데이터 + 섹션 필터 세그먼트

- /api/global route 신설 (35개 심볼, 8개 섹션)
- GlobalPageClient 컴포넌트 — 섹션 필터 세그먼트 + 60초 자동갱신
- 52주 고가/저가 컬럼, 채권 yield 포맷 구분 (%)
- app/global/page.tsx stub 제거

STEP 59 / REFERENCE_PLATFORM_MAPPING.md P1"
git push
```

---

## 5. 다음 STEP

완료 후 `@docs/STEP_60_COMMAND.md 파일 내용대로 실행해줘` 로 /briefing 페이지 리팩토링 진행.
