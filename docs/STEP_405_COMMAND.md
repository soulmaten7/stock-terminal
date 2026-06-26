<!-- 2026-06-25 -->
# STEP 405 — US 종목 탭 (기간 탭형 수익률)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_405_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
미국 종목 표 탭을 신설한다. 국가 토글을 **🇺🇸 미국**으로 바꾸면 **종목·상품** 탭에 미국 주식 표(~190 종목)가 뜬다.
- 데이터: `yahoo-finance2`(`yf.chart`)로 종목별 일봉 → 현재가 + 기간별 수익률(1일/1주/1개월/3개월/6개월/1년) + 거래대금(USD) 계산. 서버 30분 캐시.
- UI: KR `MarketBoard`의 패턴(⭐ 관심종목·페이지네이션 50/페이지·검색·거래대금 정렬·unjong 토큰)을 **복사**해 US 전용 컴포넌트로 격리. **MarketBoard.tsx는 건드리지 않음.**
- 기간은 **탭형**(`[1주][1개월][3개월][6개월][1년]`)으로 5번째 컬럼 1개만 바꿔 보여줌 — 탭 전환 시 재요청 없음(모든 기간이 이미 행 데이터에 있음).

## 전제
- 최신 main. Next.js 16 App Router, Turbopack dev 3333. Tailwind v4. `yahoo-finance2` 기설치.
- **배포 X(배치)**. 본 STEP은 **로컬 빌드 + 로컬 커밋만** (푸시·vercel 없음).
- 코드 식별자 `unjong-*` 유지(리브랜드 무관). UI 한국어.
- DB 변경 없음. ⭐는 기존 `/api/watchlist` 재사용(`onConflict: user_id,symbol,market` 확인됨 → `market:'US'` 값으로 안전 동작, 마이그레이션 불필요).

---

## 1단계 — NEW FILE `app/api/yahoo/us-performance/route.ts`

> `kr-performance/route.ts` 패턴을 그대로 US로 복제. `ret(closes, daysAgo)` 동일, 30분 인메모리 캐시 동일.
> 차이: ① `${sym}.${mkt}` 접미사 없이 **순수 티커**(`yf.chart("AAPL", …)`) ② **거래대금(amount = 마지막 종가 × 마지막 거래량, USD)** 추가 — 정렬 기준 ③ UNIVERSE = 미국 ~190 종목(S&P100 메가캡 + 나스닥100 + 국내개미 선호주).

**아래 전체 내용으로 파일 생성:**

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 미국 대표 종목 (티커·영문 약식명). S&P100 메가캡 + 나스닥100 + 국내개미 선호주.
// 주식만(ETF/ETN 제외 — 이번 라운드 보류). 티커는 Yahoo 순수 심볼(접미사 없음).
const UNIVERSE: { sym: string; name: string }[] = [
  // ── 메가캡 테크 ──
  { sym: "AAPL", name: "Apple" },
  { sym: "MSFT", name: "Microsoft" },
  { sym: "NVDA", name: "NVIDIA" },
  { sym: "GOOGL", name: "Alphabet (A)" },
  { sym: "GOOG", name: "Alphabet (C)" },
  { sym: "AMZN", name: "Amazon" },
  { sym: "META", name: "Meta Platforms" },
  { sym: "TSLA", name: "Tesla" },
  { sym: "AVGO", name: "Broadcom" },
  { sym: "ORCL", name: "Oracle" },
  { sym: "NFLX", name: "Netflix" },
  { sym: "ADBE", name: "Adobe" },
  { sym: "CRM", name: "Salesforce" },
  { sym: "CSCO", name: "Cisco" },
  { sym: "AMD", name: "AMD" },
  { sym: "INTC", name: "Intel" },
  { sym: "QCOM", name: "Qualcomm" },
  { sym: "TXN", name: "Texas Instruments" },
  { sym: "IBM", name: "IBM" },
  { sym: "NOW", name: "ServiceNow" },
  { sym: "INTU", name: "Intuit" },
  { sym: "AMAT", name: "Applied Materials" },
  { sym: "MU", name: "Micron" },
  { sym: "LRCX", name: "Lam Research" },
  { sym: "KLAC", name: "KLA" },
  { sym: "ADI", name: "Analog Devices" },
  { sym: "NXPI", name: "NXP Semiconductors" },
  { sym: "MRVL", name: "Marvell" },
  { sym: "SNPS", name: "Synopsys" },
  { sym: "CDNS", name: "Cadence" },
  { sym: "PANW", name: "Palo Alto Networks" },
  { sym: "FTNT", name: "Fortinet" },
  { sym: "ANET", name: "Arista Networks" },
  { sym: "DELL", name: "Dell" },
  { sym: "HPQ", name: "HP" },
  { sym: "MCHP", name: "Microchip" },
  // ── 반도체/AI 인기주 (국내개미) ──
  { sym: "SMCI", name: "Super Micro" },
  { sym: "ARM", name: "Arm Holdings" },
  { sym: "TSM", name: "TSMC" },
  { sym: "ASML", name: "ASML" },
  { sym: "PLTR", name: "Palantir" },
  { sym: "SNOW", name: "Snowflake" },
  { sym: "NET", name: "Cloudflare" },
  { sym: "CRWD", name: "CrowdStrike" },
  { sym: "DDOG", name: "Datadog" },
  { sym: "ZS", name: "Zscaler" },
  { sym: "MDB", name: "MongoDB" },
  { sym: "U", name: "Unity Software" },
  { sym: "SHOP", name: "Shopify" },
  { sym: "SQ", name: "Block" },
  { sym: "PYPL", name: "PayPal" },
  { sym: "COIN", name: "Coinbase" },
  { sym: "HOOD", name: "Robinhood" },
  { sym: "SOFI", name: "SoFi" },
  { sym: "MSTR", name: "MicroStrategy" },
  { sym: "ROKU", name: "Roku" },
  { sym: "RBLX", name: "Roblox" },
  { sym: "DOCU", name: "DocuSign" },
  { sym: "TWLO", name: "Twilio" },
  { sym: "TEAM", name: "Atlassian" },
  { sym: "WDAY", name: "Workday" },
  { sym: "DASH", name: "DoorDash" },
  { sym: "ABNB", name: "Airbnb" },
  { sym: "UBER", name: "Uber" },
  { sym: "LYFT", name: "Lyft" },
  { sym: "SPOT", name: "Spotify" },
  { sym: "PINS", name: "Pinterest" },
  { sym: "SNAP", name: "Snap" },
  { sym: "DKNG", name: "DraftKings" },
  // ── EV / 우주 / 미래모빌리티 (국내개미) ──
  { sym: "RIVN", name: "Rivian" },
  { sym: "LCID", name: "Lucid" },
  { sym: "NIO", name: "NIO" },
  { sym: "XPEV", name: "XPeng" },
  { sym: "LI", name: "Li Auto" },
  { sym: "JOBY", name: "Joby Aviation" },
  { sym: "RKLB", name: "Rocket Lab" },
  { sym: "ACHR", name: "Archer Aviation" },
  { sym: "PLUG", name: "Plug Power" },
  { sym: "ENPH", name: "Enphase Energy" },
  { sym: "FSLR", name: "First Solar" },
  { sym: "RUN", name: "Sunrun" },
  // ── 통신/미디어 ──
  { sym: "TMUS", name: "T-Mobile" },
  { sym: "VZ", name: "Verizon" },
  { sym: "T", name: "AT&T" },
  { sym: "CMCSA", name: "Comcast" },
  { sym: "DIS", name: "Disney" },
  { sym: "WBD", name: "Warner Bros. Discovery" },
  { sym: "PARA", name: "Paramount" },
  { sym: "EA", name: "Electronic Arts" },
  { sym: "TTWO", name: "Take-Two" },
  // ── 금융 ──
  { sym: "BRK-B", name: "Berkshire Hathaway (B)" },
  { sym: "JPM", name: "JPMorgan Chase" },
  { sym: "BAC", name: "Bank of America" },
  { sym: "WFC", name: "Wells Fargo" },
  { sym: "GS", name: "Goldman Sachs" },
  { sym: "MS", name: "Morgan Stanley" },
  { sym: "C", name: "Citigroup" },
  { sym: "SCHW", name: "Charles Schwab" },
  { sym: "BLK", name: "BlackRock" },
  { sym: "AXP", name: "American Express" },
  { sym: "V", name: "Visa" },
  { sym: "MA", name: "Mastercard" },
  { sym: "SPGI", name: "S&P Global" },
  { sym: "CB", name: "Chubb" },
  { sym: "PGR", name: "Progressive" },
  { sym: "USB", name: "U.S. Bancorp" },
  { sym: "PNC", name: "PNC Financial" },
  // ── 헬스케어 ──
  { sym: "LLY", name: "Eli Lilly" },
  { sym: "UNH", name: "UnitedHealth" },
  { sym: "JNJ", name: "Johnson & Johnson" },
  { sym: "ABBV", name: "AbbVie" },
  { sym: "MRK", name: "Merck" },
  { sym: "PFE", name: "Pfizer" },
  { sym: "TMO", name: "Thermo Fisher" },
  { sym: "ABT", name: "Abbott" },
  { sym: "DHR", name: "Danaher" },
  { sym: "AMGN", name: "Amgen" },
  { sym: "GILD", name: "Gilead Sciences" },
  { sym: "BMY", name: "Bristol-Myers Squibb" },
  { sym: "VRTX", name: "Vertex Pharma" },
  { sym: "REGN", name: "Regeneron" },
  { sym: "ISRG", name: "Intuitive Surgical" },
  { sym: "MDT", name: "Medtronic" },
  { sym: "CVS", name: "CVS Health" },
  { sym: "CI", name: "Cigna" },
  { sym: "ELV", name: "Elevance Health" },
  { sym: "MRNA", name: "Moderna" },
  { sym: "BIIB", name: "Biogen" },
  // ── 소비재 / 리테일 ──
  { sym: "WMT", name: "Walmart" },
  { sym: "COST", name: "Costco" },
  { sym: "HD", name: "Home Depot" },
  { sym: "LOW", name: "Lowe's" },
  { sym: "PG", name: "Procter & Gamble" },
  { sym: "KO", name: "Coca-Cola" },
  { sym: "PEP", name: "PepsiCo" },
  { sym: "MCD", name: "McDonald's" },
  { sym: "SBUX", name: "Starbucks" },
  { sym: "NKE", name: "Nike" },
  { sym: "TGT", name: "Target" },
  { sym: "MDLZ", name: "Mondelez" },
  { sym: "CL", name: "Colgate-Palmolive" },
  { sym: "MO", name: "Altria" },
  { sym: "PM", name: "Philip Morris" },
  { sym: "CMG", name: "Chipotle" },
  { sym: "BKNG", name: "Booking Holdings" },
  { sym: "MAR", name: "Marriott" },
  { sym: "LULU", name: "Lululemon" },
  { sym: "ORLY", name: "O'Reilly Automotive" },
  { sym: "MNST", name: "Monster Beverage" },
  { sym: "KDP", name: "Keurig Dr Pepper" },
  { sym: "KHC", name: "Kraft Heinz" },
  { sym: "GM", name: "General Motors" },
  { sym: "F", name: "Ford" },
  // ── 산업재 / 에너지 / 소재 ──
  { sym: "CAT", name: "Caterpillar" },
  { sym: "BA", name: "Boeing" },
  { sym: "GE", name: "GE Aerospace" },
  { sym: "HON", name: "Honeywell" },
  { sym: "RTX", name: "RTX" },
  { sym: "LMT", name: "Lockheed Martin" },
  { sym: "DE", name: "Deere" },
  { sym: "UPS", name: "UPS" },
  { sym: "UNP", name: "Union Pacific" },
  { sym: "MMM", name: "3M" },
  { sym: "GD", name: "General Dynamics" },
  { sym: "EMR", name: "Emerson Electric" },
  { sym: "ETN", name: "Eaton" },
  { sym: "XOM", name: "Exxon Mobil" },
  { sym: "CVX", name: "Chevron" },
  { sym: "COP", name: "ConocoPhillips" },
  { sym: "SLB", name: "Schlumberger" },
  { sym: "EOG", name: "EOG Resources" },
  { sym: "OXY", name: "Occidental" },
  { sym: "PSX", name: "Phillips 66" },
  { sym: "MPC", name: "Marathon Petroleum" },
  { sym: "LIN", name: "Linde" },
  { sym: "FCX", name: "Freeport-McMoRan" },
  { sym: "NEM", name: "Newmont" },
  { sym: "NUE", name: "Nucor" },
  // ── 유틸리티 / 부동산 ──
  { sym: "NEE", name: "NextEra Energy" },
  { sym: "DUK", name: "Duke Energy" },
  { sym: "SO", name: "Southern Company" },
  { sym: "AMT", name: "American Tower" },
  { sym: "PLD", name: "Prologis" },
  { sym: "EQIX", name: "Equinix" },
  // ── 기타 메가/대형 ──
  { sym: "ACN", name: "Accenture" },
  { sym: "PDD", name: "PDD Holdings" },
  { sym: "BABA", name: "Alibaba" },
  { sym: "JD", name: "JD.com" },
  { sym: "MELI", name: "MercadoLibre" },
  { sym: "GEV", name: "GE Vernova" },
  { sym: "APP", name: "AppLovin" },
  { sym: "CEG", name: "Constellation Energy" },
  { sym: "VST", name: "Vistra" },
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

// 콜드 캐시 때 ~190종목을 배치로 부르므로 함수 타임아웃 여유 확보
export const maxDuration = 60;

// 동시 호출 제한 — 야후 레이트리밋/타임아웃 방지(한 번에 limit개씩만 진행)
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) {
      const cur = idx++;
      out[cur] = await fn(arr[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  // 동시 10개씩만 — 193종목을 ~20배치로 나눠 야후 부담 최소화(30분 캐시라 콜드로드만)
  const results = await mapLimit(UNIVERSE, 10, async (e) => {
      try {
        const ch = await yf.chart(e.sym, { period1, interval: "1d" });
        const quotes = (ch.quotes ?? []) as Array<{ close: number | null; volume: number | null }>;
        const closes = quotes
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        // 거래대금(USD) = 마지막 종가 × 마지막 유효 거래량 — 정렬 기준
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

---

## 2단계 — NEW FILE `components/toolbox/UsMarketBoard.tsx`

> `MarketBoard`의 토큰/패턴 미러링 + US 특화. **MarketBoard.tsx는 수정 금지** — 본 컴포넌트로 US 로직 격리.
> 핵심 차이: ① 기간 **탭형** 행(5번째 컬럼만 선택 기간으로) — 탭 전환 시 **재요청 없음** ② USD 가격(`$`) ③ 거래대금 정렬(표시는 안 함, 정렬 전용) ④ 행 클릭 → Yahoo Finance 새 탭(증권사 시트는 보류) ⑤ ⭐는 기존 `/api/watchlist`에 `market:'US'`로 재사용.
> 로고: `StockLogo`는 US 티커를 안전 처리(`etfBrand` 분기는 `isKrxCode` 가드라 US 미발동 → `logoUrl`이 logo.dev 티커 엔드포인트로 실로고, 실패 시 레터 아바타). 그대로 재사용.

**아래 전체 내용으로 파일 생성:**

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';

type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  amount?: number; // 거래대금(USD) — 정렬 전용(표시 X)
};

// 기간 탭: 5번째 컬럼 1개를 선택 기간으로 보여줌(1일 컬럼은 고정).
type PeriodKey = '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1w', label: '1주', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m' },
  { key: '3m', label: '3개월', field: 'r3m' },
  { key: '6m', label: '6개월', field: 'r6m' },
  { key: '1y', label: '1년', field: 'r1y' },
];

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}
function usd(v?: number | null): string {
  if (v == null || !v) return '—';
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

async function fetchRows(): Promise<Row[]> {
  try {
    const j = await (await fetch('/api/yahoo/us-performance')).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y, amount: r.amount,
    }));
  } catch { return []; }
}

export default function UsMarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('us-stock') ?? []);
  const [loading, setLoading] = useState(() => getCache('us-stock') === undefined);
  const [period, setPeriod] = useState<PeriodKey>('1w');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // 데이터 로드 (서버 30분 캐시 + 클라 메모리 캐시 stale-while-revalidate)
  useEffect(() => {
    let cancelled = false;
    const cached = getCache<Row[]>('us-stock');
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows().then((r) => { if (!cancelled) { setRows(r); setCache('us-stock', r); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // 관심종목 동기화 (로그인 시) — KR과 동일하게 symbol 집합으로 관리
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.watchlist) setWatchSet(new Set((j.watchlist as { symbol: string }[]).map((w) => w.symbol)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const toggleWatch = (r: Row) => {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    const add = !watchSet.has(r.symbol);
    setWatchSet((prev) => { const n = new Set(prev); add ? n.add(r.symbol) : n.delete(r.symbol); return n; });
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: r.symbol, name_ko: r.name, market: 'US', country: 'US', add }),
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(r.symbol) : n.add(r.symbol); return n; });
    });
  };

  const PAGE_SIZE = 50;
  // 거래대금(amount) 내림차순 고정 + 검색 필터(티커·이름)
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    return [...base].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }, [rows, search]);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'r1w';
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '1주';

  function pageNumbers(): (number | '…')[] {
    const out: (number | '…')[] = [];
    const cur = page + 1;
    const win = 2;
    const start = Math.max(1, cur - win);
    const end = Math.min(totalPages, cur + win);
    if (start > 1) { out.push(1); if (start > 2) out.push('…'); }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages) { if (end < totalPages - 1) out.push('…'); out.push(totalPages); }
    return out;
  }

  return (
    <section className="min-w-0">
      {/* 컨트롤 줄: 좌=기간 탭 / 우=검색 */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors sm:py-1.5 ${period === p.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="티커·종목명 검색"
              className="w-32 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent sm:w-48"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="shrink-0 text-xs text-unjong-muted hover:text-unjong-accent">초기화</button>}
          </div>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto">
        {loading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-unjong-muted">{search ? `"${search}" 검색 결과 없음` : '데이터가 없습니다. 잠시 후 다시 시도해 주세요.'}</p>
        ) : (
          <table className="w-full min-w-[320px] table-fixed text-sm sm:min-w-[600px]">
            <thead>
              <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">#</th>
                <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목</th>
                <th className="w-[96px] whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                <th className="w-[72px] whitespace-nowrap px-2 py-2.5 text-right font-medium">1일</th>
                <th className="w-[80px] whitespace-nowrap px-2 py-2.5 text-right font-medium">{periodLabel}</th>
                <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => (
                <tr
                  key={r.symbol}
                  onClick={() => window.open(`https://finance.yahoo.com/quote/${r.symbol}`, '_blank', 'noopener,noreferrer')}
                  className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
                >
                  <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                  <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <StockLogo code={r.symbol} name={r.name} size={24} />
                      <span className="min-w-0">
                        <span className="font-bold text-unjong-primary">{r.symbol}</span>
                        <span title={r.name} className="ml-1.5 truncate text-xs text-unjong-muted">{r.name}</span>
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{usd(r.price)}</td>
                  <td className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(r.changePercent)}`}>{pct(r.changePercent)}</td>
                  <td className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(r[periodField] as number | null | undefined)}`}>{pct(r[periodField] as number | null | undefined)}</td>
                  <td className="w-9 px-1 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                      aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                      className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                    >
                      <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} className="mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* 페이지네이션 — 숫자 페이지 (MarketBoard와 동일 방식) */}
        {!loading && sorted.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-center gap-1 border-t border-unjong-border px-2 py-3 text-xs">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">←</button>
            {pageNumbers().map((n, i) =>
              n === '…' ? (
                <span key={`e${i}`} className="px-1 text-unjong-muted">…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage((n as number) - 1)}
                  className={`h-7 min-w-[1.75rem] rounded px-1 tabular-nums transition-colors ${page === (n as number) - 1 ? 'bg-unjong-primary font-bold text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
                >
                  {n}
                </button>
              )
            )}
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">→</button>
            <span className="ml-2 text-unjong-muted">총 {sorted.length.toLocaleString()} 종목</span>
          </div>
        )}
      </div>
    </section>
  );
}
```

---

## 3단계 — EDIT `components/toolbox/ToolboxClient.tsx` (3곳)

### (A) import 추가 — `MarketBoard` 바로 아래
찾기:
```tsx
import MarketBoard from './MarketBoard';
```
바꾸기:
```tsx
import MarketBoard from './MarketBoard';
import UsMarketBoard from './UsMarketBoard';
```

### (B) `market` 탭을 미국에도 노출 (현재 특수탭은 KR 전용으로 게이팅됨)
찾기:
```tsx
  const tabs = TAB_ORDER.map((slug) => {
    const special = SPECIAL_LABELS[slug];
    if (special) return country === 'KR' ? { slug, label: special } : null;
    const c = categories.find((cat) => cat.slug === slug);
    const hasLinks = !!c && c.links.some((l) => l.country === country);
    return hasLinks ? { slug, label: c!.label } : null;
  }).filter((t): t is { slug: string; label: string } => t !== null);
```
바꾸기:
```tsx
  const tabs = TAB_ORDER.map((slug) => {
    const special = SPECIAL_LABELS[slug];
    if (special) {
      // market(종목·상품)은 미국도 라이브 데이터(Yahoo) 제공 → KR/US 모두 노출.
      // youtube·room은 한국 전용 데이터라 KR만.
      if (slug === 'market') return { slug, label: special };
      return country === 'KR' ? { slug, label: special } : null;
    }
    const c = categories.find((cat) => cat.slug === slug);
    const hasLinks = !!c && c.links.some((l) => l.country === country);
    return hasLinks ? { slug, label: c!.label } : null;
  }).filter((t): t is { slug: string; label: string } => t !== null);
```

### (C) US일 때 `market` 탭에서 `<UsMarketBoard/>` 렌더 (KR은 그대로 `<MarketBoard/>`)
찾기:
```tsx
        {activeTab === 'market' ? (
          country === 'KR' ? (
            <MarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇺🇸" title="미국 종목·상품 — 준비 중" />
          )
        ) : activeTab === 'youtube' ? (
```
바꾸기:
```tsx
        {activeTab === 'market' ? (
          country === 'KR' ? (
            <MarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <UsMarketBoard isLoggedIn={isLoggedIn} />
          )
        ) : activeTab === 'youtube' ? (
```

---

## 4단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add app/api/yahoo/us-performance/route.ts components/toolbox/UsMarketBoard.tsx components/toolbox/ToolboxClient.tsx
git commit -m "feat(STEP 405): US 종목 탭 — 기간 탭형 수익률(1일~1년)·페이지네이션·검색"
```
> **NO push, NO vercel.** 배포는 배치로 묶음.

## 확인
- [ ] 빌드 통과(타입 에러 없음).
- [ ] 국가 토글 **🇺🇸 미국** → **종목·상품** 탭이 노출됨(KR 전용 게이팅 풀림).
- [ ] 표에 ~190 종목, **현재가($)**·**1일(%)** 표시, 거래대금 내림차순 정렬.
- [ ] 기간 탭 `[1주][1개월][3개월][6개월][1년]` 전환 시 5번째 컬럼 라벨·값만 바뀜(재요청·로딩 없음).
- [ ] 상·하락 색(`unjong-up`/`unjong-down`), `+/-`·`%` 표기.
- [ ] 페이지네이션(50/페이지, `← 1 2 3 … N →`, `총 N 종목`)·검색(티커·이름) 동작.
- [ ] ⭐: 로그인 상태에서 토글 → 새로고침 후 유지(`market:'US'`). 로그아웃 시 클릭 → 로그인 이동.
- [ ] 행 클릭 → Yahoo Finance 새 탭(`finance.yahoo.com/quote/{ticker}`).
- [ ] **KR 표 영향 없음**(MarketBoard 미변경 — 종목·상품 KR 토글 시 기존과 동일).

## 스킵 / 보류 (이번 라운드 NOT)
- **주식만(~190)** — 전체 미국 주식 X, ETF/ETN/상품 X(다음 라운드).
- **증권사 바로가기 시트** — US는 행 클릭 시 Yahoo 새 탭만. 브로커 링크는 별도 후속 STEP에서 매핑(parked).
- **상장이후(상장 후 누적 수익률)** 컬럼 보류 — 1일~1년만.
- **거래대금 표시** 보류 — 정렬 전용(USD 단위·표시 클러터 방지). 필요 시 후속에 `$1.2B` 압축 표기 추가.
- **하위탭(주식/ETF/ETN/리츠)** US는 없음 — 단일 주식 표만. KR `SUBTABS`는 KR 전용 유지.

## 가정 / 결정 기록
- **⭐ watchlist `market:'US'` 포함** — `app/api/watchlist/route.ts`의 upsert가 `onConflict: 'user_id,symbol,market'`이고 delete도 `symbol`+`market`로 키잉 → `market` 값에 `'US'`를 넣어도 DB 스키마/마이그레이션 변경 없이 안전. KR(`market:'KRX'`)과 키가 달라 충돌 없음.
- **티커 = Yahoo 순수 심볼**(접미사 없음) — `BRK-B`(클래스 B는 하이픈), `GOOGL`/`GOOG` 양쪽 포함. 레거시/개명 티커 회피(`FB→META`, `SQ`는 현행 유효). JOBY는 NYSE지만 Yahoo는 순수 티커로 조회되므로 접미사 불필요.
- **로고** — 신규 유틸 없이 `StockLogo` 재사용. US 티커는 `isKrxCode` 가드 덕에 ETF/레버리지 분기를 타지 않고 `logoUrl`(logo.dev 티커 엔드포인트)로 실로고, 토큰/매칭 실패 시 레터 아바타 폴백. KRX 로직과 충돌 없음.
- **기간 탭은 재요청 없음** — 모든 기간(`r1w`~`r1y`)이 한 번의 `/api/yahoo/us-performance` 응답에 포함 → 탭은 표시 필드만 스위칭(서버 부하 0).
