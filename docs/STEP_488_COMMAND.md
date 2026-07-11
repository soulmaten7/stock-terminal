<!-- 2026-07-01 -->
# STEP 488 — 미국 리츠(REIT) 서브탭 추가

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_488_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
미국 종목·상품에 **리츠(REIT) 서브탭** 추가 (현재 주식·ETF만). 개별 US REIT(Realty Income·Prologis·American Tower 등). US ETF 탭엔 이미 레버리지·인버스(TQQQ·SOXL·SQQQ)·REIT ETF(VNQ) 포함돼 있으므로 그건 건드리지 않음.
- 방식: `us-etf-performance` 라우트와 동일 구조의 `us-reit-performance` 신설(REIT UNIVERSE) + UsMarketBoard 서브탭.
- ⚠️ API 라우트 신설 → 클린 재시작 필요.

---

## 1) 신규 `app/api/yahoo/us-reit-performance/route.ts` (전체 생성)
```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const yf = new YahooFinance();

// 미국 대표 개별 REIT (티커·약식명). 시총/거래량 상위. us-etf-performance와 동일 계산.
const UNIVERSE: { sym: string; name: string }[] = [
  { sym: "PLD", name: "Prologis (PLD)" },
  { sym: "AMT", name: "American Tower (AMT)" },
  { sym: "EQIX", name: "Equinix (EQIX)" },
  { sym: "WELL", name: "Welltower (WELL)" },
  { sym: "O", name: "Realty Income (O)" },
  { sym: "SPG", name: "Simon Property Group (SPG)" },
  { sym: "PSA", name: "Public Storage (PSA)" },
  { sym: "DLR", name: "Digital Realty (DLR)" },
  { sym: "CCI", name: "Crown Castle (CCI)" },
  { sym: "VICI", name: "VICI Properties (VICI)" },
  { sym: "EXR", name: "Extra Space Storage (EXR)" },
  { sym: "AVB", name: "AvalonBay Communities (AVB)" },
  { sym: "EQR", name: "Equity Residential (EQR)" },
  { sym: "IRM", name: "Iron Mountain (IRM)" },
  { sym: "VTR", name: "Ventas (VTR)" },
  { sym: "ARE", name: "Alexandria Real Estate (ARE)" },
  { sym: "INVH", name: "Invitation Homes (INVH)" },
  { sym: "MAA", name: "Mid-America Apartment (MAA)" },
  { sym: "SUI", name: "Sun Communities (SUI)" },
  { sym: "UDR", name: "UDR (UDR)" },
  { sym: "ESS", name: "Essex Property Trust (ESS)" },
  { sym: "KIM", name: "Kimco Realty (KIM)" },
  { sym: "WPC", name: "W. P. Carey (WPC)" },
  { sym: "CPT", name: "Camden Property Trust (CPT)" },
  { sym: "BXP", name: "BXP (BXP)" },
  { sym: "DOC", name: "Healthpeak Properties (DOC)" },
  { sym: "GLPI", name: "Gaming and Leisure (GLPI)" },
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  const results = await mapLimit(UNIVERSE, 10, async (e) => {
    try {
      const ch = await yf.chart(e.sym, { period1, interval: "1d" });
      const quotes = (ch.quotes ?? []) as Array<{ close: number | null; volume: number | null }>;
      const closes = quotes.map((q) => q.close).filter((c): c is number => typeof c === "number" && c > 0);
      if (closes.length < 22) return null;
      const lastClose = closes[closes.length - 1];
      let lastVolume = 0;
      for (let i = quotes.length - 1; i >= 0; i--) {
        const v = quotes[i].volume;
        if (typeof v === "number" && v > 0) { lastVolume = v; break; }
      }
      return {
        symbol: e.sym,
        name: e.name,
        price: lastClose,
        changePercent: ret(closes, 1) ?? 0,
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
        r1y: ret(closes, 252),
        amount: lastClose * lastVolume,
      };
    } catch {
      return null;
    }
  });

  const items = results.filter((x) => x !== null);
  items.sort((a, b) => (b!.amount ?? 0) - (a!.amount ?? 0));
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```

## 2) `components/toolbox/UsMarketBoard.tsx` — 리츠 서브탭 추가

**2-A. SubTab 타입.** 찾을 것:
```tsx
type SubTab = 'stock' | 'etf';
```
바꿀 것:
```tsx
type SubTab = 'stock' | 'etf' | 'reit';
```

**2-B. SUBTABS.** 찾을 것:
```tsx
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
];
```
바꿀 것:
```tsx
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
  { key: 'reit', label: '리츠' },
];
```

**2-C. ENDPOINTS.** 찾을 것:
```tsx
const ENDPOINTS: Record<SubTab, string> = {
  stock: '/api/yahoo/us-list',
  etf: '/api/yahoo/us-etf-performance',
};
```
바꿀 것:
```tsx
const ENDPOINTS: Record<SubTab, string> = {
  stock: '/api/yahoo/us-list',
  etf: '/api/yahoo/us-etf-performance',
  reit: '/api/yahoo/us-reit-performance',
};
```

**2-D. CACHE_KEYS.** 찾을 것:
```tsx
const CACHE_KEYS: Record<SubTab, string> = { stock: 'us-stock-list', etf: 'us-etf' };
```
바꿀 것:
```tsx
const CACHE_KEYS: Record<SubTab, string> = { stock: 'us-stock-list', etf: 'us-etf', reit: 'us-reit' };
```

---

## 3) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 4) 검증 (localhost:3333)
- [ ] 🇺🇸 미국 → 종목·상품에 **주식 / ETF / 리츠** 3개 서브탭.
- [ ] 리츠 탭: Realty Income·Prologis·American Tower 등 시세·수익률·거래대금 정상.
- [ ] ETF 탭엔 기존대로 레버리지(TQQQ 3X 배지)·인컴 등 그대로.

## 5) 커밋
```bash
git add app/api/yahoo/us-reit-performance/route.ts components/toolbox/UsMarketBoard.tsx && git commit -m "feat(us): 개별 리츠(REIT) 서브탭 추가 (Realty Income·Prologis 등) (STEP 488)" && git push
```

## ⚠️ 자산군 정리 (각국 기준)
- 🇰🇷 한국: 주식·ETF·ETN·리츠
- 🇺🇸 미국: 주식·ETF(레버리지·인버스·REIT ETF·인컴·섹터·채권 포함)·**리츠**(이 STEP). ETN은 미국서 니치라 별도 탭 불요.
- 🇯🇵 일본: 종목·ETF(레버리지·인버스)·리츠 (STEP 486/487)
