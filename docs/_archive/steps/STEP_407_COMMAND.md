# STEP 407 — 미국 ETF 데이터 + 하위탭 미국 기준(주식·ETF) 정리

> 작성: 2026-06-25 · Cowork 설계 → Claude Code 실행
> 목표: US 마켓보드 하위탭을 **미국 시장에 맞게**(주식 | ETF) 재정렬하고, ETF 탭에 실데이터(~75개)를 채운다. STEP 406에서 KR 탭(주식/ETF/ETN/리츠)을 그대로 미러링한 게 시장에 안 맞았던 부분을 교정. **UI 셸은 동일 유지** — 카테고리/콘텐츠만 시장에 맞춤.

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- HEAD: STEP 406 직후 (US `UsMarketBoard`가 KR 미러로 재작성됨 — 하위탭 주식/ETF/ETN/리츠, 주식만 라이브, ETF/ETN/리츠는 "준비 중")
- 스택: Next.js 16 App Router (Turbopack, 포트 3333) · Tailwind v4 · `yahoo-finance2` · `unjong-*` 식별자 · 한국어 UI
- 배포는 배치 — 이 STEP은 **로컬 빌드 + 로컬 커밋만** (push X, vercel X)

## 이번 STEP 범위 (정확히 2파일)
1. **신규** `app/api/yahoo/us-etf-performance/route.ts` — `us-performance` 라우트를 그대로 미러링(동시성 제한 mapLimit 10 · maxDuration 60 · 30분 캐시 · 종목별 try/catch→null · amount=종가×거래량 내림차순), UNIVERSE만 ETF로 교체.
2. **수정** `components/toolbox/UsMarketBoard.tsx` — 하위탭을 **주식 | ETF** 2개로 줄이고, ETF 탭이 실제 fetch 하도록(준비 중 제거). 탭별 별도 캐시 키. 나머지(기간 드롭다운·현재가/1일·⭐·증권사 사이드바·페이지네이션·검색·토큰) 전부 동일.

> ❗ `MarketBoard`(KR)·`BrokerRanking`은 **건드리지 않는다**. 주식 탭 동작은 100% 동일 유지.

---

## (A) 신규 파일 — `app/api/yahoo/us-etf-performance/route.ts`

아래 **전체 내용**으로 새 파일 생성. `us-performance/route.ts`와 구조 동일 — `ret()`, `mapLimit(…,10,…)`, `maxDuration=60`, 30분 캐시, 종목별 try/catch→null, `amount = lastClose × lastVolume`, amount 내림차순 정렬, `{ items }` 반환(`{symbol,name,price,changePercent,r1w,r1m,r3m,r6m,r1y,amount}`). ETF는 순수 티커(접미사 없음 — 주식과 동일).

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 미국 대표 ETF (티커·영문 약식명). AUM/거래량 상위 + 국내개미 선호(인컴·레버리지/인버스 포함).
// 순수 Yahoo 심볼(접미사 없음). 주식 라우트(us-performance)와 동일 패턴, UNIVERSE만 ETF.
const UNIVERSE: { sym: string; name: string }[] = [
  // ── 광범위 지수 (브로드 마켓) ──
  { sym: "SPY", name: "SPDR S&P 500 (SPY)" },
  { sym: "VOO", name: "Vanguard S&P 500 (VOO)" },
  { sym: "IVV", name: "iShares S&P 500 (IVV)" },
  { sym: "VTI", name: "Vanguard Total Market (VTI)" },
  { sym: "QQQ", name: "Invesco NASDAQ 100 (QQQ)" },
  { sym: "QQQM", name: "Invesco NASDAQ 100 M (QQQM)" },
  { sym: "DIA", name: "SPDR Dow Jones (DIA)" },
  { sym: "IWM", name: "iShares Russell 2000 (IWM)" },
  { sym: "IJR", name: "iShares Core S&P Small-Cap (IJR)" },
  { sym: "IJH", name: "iShares Core S&P Mid-Cap (IJH)" },
  { sym: "MDY", name: "SPDR S&P MidCap 400 (MDY)" },
  { sym: "RSP", name: "Invesco S&P 500 Equal Weight (RSP)" },
  // ── 스타일 / 팩터 ──
  { sym: "VUG", name: "Vanguard Growth (VUG)" },
  { sym: "VTV", name: "Vanguard Value (VTV)" },
  { sym: "IWF", name: "iShares Russell 1000 Growth (IWF)" },
  { sym: "IWD", name: "iShares Russell 1000 Value (IWD)" },
  { sym: "SCHD", name: "Schwab US Dividend (SCHD)" },
  { sym: "VIG", name: "Vanguard Dividend Appreciation (VIG)" },
  { sym: "DGRO", name: "iShares Core Dividend Growth (DGRO)" },
  { sym: "VYM", name: "Vanguard High Dividend Yield (VYM)" },
  { sym: "MTUM", name: "iShares MSCI USA Momentum (MTUM)" },
  { sym: "QUAL", name: "iShares MSCI USA Quality (QUAL)" },
  // ── 섹터 (SPDR Select) ──
  { sym: "XLK", name: "Technology Sector (XLK)" },
  { sym: "XLF", name: "Financial Sector (XLF)" },
  { sym: "XLE", name: "Energy Sector (XLE)" },
  { sym: "XLV", name: "Health Care Sector (XLV)" },
  { sym: "XLY", name: "Consumer Discretionary (XLY)" },
  { sym: "XLP", name: "Consumer Staples (XLP)" },
  { sym: "XLI", name: "Industrial Sector (XLI)" },
  { sym: "XLU", name: "Utilities Sector (XLU)" },
  { sym: "XLB", name: "Materials Sector (XLB)" },
  { sym: "XLRE", name: "Real Estate Sector (XLRE)" },
  { sym: "XLC", name: "Communication Services (XLC)" },
  // ── 테크 / 반도체 / 테마 ──
  { sym: "SMH", name: "VanEck Semiconductor (SMH)" },
  { sym: "SOXX", name: "iShares Semiconductor (SOXX)" },
  { sym: "VGT", name: "Vanguard Information Tech (VGT)" },
  { sym: "IGV", name: "iShares Expanded Tech-Software (IGV)" },
  { sym: "ARKK", name: "ARK Innovation (ARKK)" },
  { sym: "IBIT", name: "iShares Bitcoin Trust (IBIT)" },
  { sym: "XBI", name: "SPDR S&P Biotech (XBI)" },
  // ── 해외 / 신흥국 ──
  { sym: "VEA", name: "Vanguard Developed Markets (VEA)" },
  { sym: "VWO", name: "Vanguard Emerging Markets (VWO)" },
  { sym: "EFA", name: "iShares MSCI EAFE (EFA)" },
  { sym: "EEM", name: "iShares MSCI Emerging (EEM)" },
  { sym: "IEFA", name: "iShares Core MSCI EAFE (IEFA)" },
  { sym: "IEMG", name: "iShares Core MSCI Emerging (IEMG)" },
  { sym: "VXUS", name: "Vanguard Total Intl Stock (VXUS)" },
  { sym: "INDA", name: "iShares MSCI India (INDA)" },
  { sym: "EWJ", name: "iShares MSCI Japan (EWJ)" },
  { sym: "MCHI", name: "iShares MSCI China (MCHI)" },
  { sym: "FXI", name: "iShares China Large-Cap (FXI)" },
  // ── 채권 ──
  { sym: "BND", name: "Vanguard Total Bond Market (BND)" },
  { sym: "AGG", name: "iShares Core US Aggregate Bond (AGG)" },
  { sym: "TLT", name: "iShares 20+ Year Treasury (TLT)" },
  { sym: "IEF", name: "iShares 7-10 Year Treasury (IEF)" },
  { sym: "SHY", name: "iShares 1-3 Year Treasury (SHY)" },
  { sym: "LQD", name: "iShares Investment Grade Corp (LQD)" },
  { sym: "HYG", name: "iShares High Yield Corp (HYG)" },
  { sym: "TIP", name: "iShares TIPS Bond (TIP)" },
  { sym: "BIL", name: "SPDR 1-3 Month T-Bill (BIL)" },
  { sym: "SGOV", name: "iShares 0-3 Month Treasury (SGOV)" },
  // ── 원자재 / 부동산 ──
  { sym: "GLD", name: "SPDR Gold Shares (GLD)" },
  { sym: "IAU", name: "iShares Gold Trust (IAU)" },
  { sym: "SLV", name: "iShares Silver Trust (SLV)" },
  { sym: "USO", name: "United States Oil Fund (USO)" },
  { sym: "VNQ", name: "Vanguard Real Estate (VNQ)" },
  { sym: "SCHH", name: "Schwab US REIT (SCHH)" },
  // ── 인컴 (커버드콜·배당, 국내개미 선호) ──
  { sym: "JEPI", name: "JPMorgan Equity Premium Income (JEPI)" },
  { sym: "JEPQ", name: "JPMorgan Nasdaq Equity Premium (JEPQ)" },
  { sym: "QYLD", name: "Global X NASDAQ 100 Covered Call (QYLD)" },
  { sym: "DIVO", name: "Amplify CWP Enhanced Dividend (DIVO)" },
  // ── 레버리지 / 인버스 (국내개미 활발 거래) ──
  { sym: "TQQQ", name: "ProShares UltraPro QQQ 3X (TQQQ)" },
  { sym: "SQQQ", name: "ProShares UltraPro Short QQQ 3X (SQQQ)" },
  { sym: "SOXL", name: "Direxion Semiconductor Bull 3X (SOXL)" },
  { sym: "SOXS", name: "Direxion Semiconductor Bear 3X (SOXS)" },
  { sym: "TSLL", name: "Direxion TSLA Bull 2X (TSLL)" },
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

// 콜드 캐시 때 ~75 ETF를 배치로 부르므로 함수 타임아웃 여유 확보
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

  // 동시 10개씩만 — ~75 ETF를 ~8배치로 나눠 야후 부담 최소화(30분 캐시라 콜드로드만)
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

> ETF 유니버스 = **73개** (중복 제거 완료 — SCHD는 스타일/팩터에만 1회). 신규/불확실 티커(IBIT·QQQM·SGOV·TSLL·JEPQ·DIVO·SCHH·IGV)는 Yahoo Finance에 순수 티커로 존재 확인됨.

---

## (B) 수정 파일 — `components/toolbox/UsMarketBoard.tsx`

아래 **find/replace 4곳**. 각 블록의 좌측(찾기)은 현재 파일 그대로이며 그대로 일치해야 함. 우측(바꾸기)으로 교체.

### B-1. 하위탭 타입 + SUBTABS 배열 (4개 → 2개)

**찾기** (22~29행):
```ts
// 하위 카테고리 탭 — KR MarketBoard와 동일 구성. 'stock'만 라이브, 나머지는 '준비 중'.
type SubTab = 'stock' | 'etf' | 'etn' | 'reit';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
  { key: 'etn', label: 'ETN' },
  { key: 'reit', label: '리츠' },
];
```

**바꾸기**:
```ts
// 하위 카테고리 탭 — 미국 시장 기준(주식 | ETF). 둘 다 라이브(각각 별도 라우트 fetch).
type SubTab = 'stock' | 'etf';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
];
```

### B-2. fetchRows — 탭별 엔드포인트 인자화

**찾기** (54~62행):
```ts
async function fetchRows(): Promise<Row[]> {
  try {
    const j = await (await fetch('/api/yahoo/us-performance')).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y, amount: r.amount,
    }));
  } catch { return []; }
}
```

**바꾸기**:
```ts
// 하위탭별 데이터 소스 — 주식/ETF가 각각 별도 라우트 + 별도 캐시 키.
const ENDPOINTS: Record<SubTab, string> = {
  stock: '/api/yahoo/us-performance',
  etf: '/api/yahoo/us-etf-performance',
};
const CACHE_KEYS: Record<SubTab, string> = { stock: 'us-stock', etf: 'us-etf' };

async function fetchRows(tab: SubTab): Promise<Row[]> {
  try {
    const j = await (await fetch(ENDPOINTS[tab])).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y, amount: r.amount,
    }));
  } catch { return []; }
}
```

### B-3. 초기 state + 데이터 로드 useEffect (탭 전환 시 재fetch)

**찾기** (65~85행):
```ts
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('us-stock') ?? []);
  const [loading, setLoading] = useState(() => getCache('us-stock') === undefined);
  const [period, setPeriod] = useState<PeriodKey>('1w');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // 'stock' 탭만 데이터 로드(서버 30분 캐시 + 클라 메모리 캐시 stale-while-revalidate).
  // ETF/ETN/리츠는 fetch 안 함 — '준비 중' 빈 상태로만 노출.
  useEffect(() => {
    if (tab !== 'stock') { setSearch(''); setPage(0); return; }
    let cancelled = false;
    setSearch('');
    setPage(0);
    const cached = getCache<Row[]>('us-stock');
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows().then((r) => { if (!cancelled) { setRows(r); setCache('us-stock', r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);
```

**바꾸기**:
```ts
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>(CACHE_KEYS.stock) ?? []);
  const [loading, setLoading] = useState(() => getCache(CACHE_KEYS.stock) === undefined);
  const [period, setPeriod] = useState<PeriodKey>('1w');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // 탭별 데이터 로드 — 주식/ETF 각각 별도 라우트·캐시 키(서버 30분 캐시 + 클라 메모리 캐시 SWR).
  // 탭 전환 시 해당 탭 캐시를 즉시 표시 후 백그라운드 재검증.
  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    const key = CACHE_KEYS[tab];
    const cached = getCache<Row[]>(key);
    if (cached) { setRows(cached); setLoading(false); } else { setRows([]); setLoading(true); }
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setCache(key, r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);
```

> 변경 핵심: ① `tab !== 'stock'` 단락(준비 중) 제거 — 두 탭 모두 fetch. ② 캐시 키를 `CACHE_KEYS[tab]`로. ③ 캐시 미스 시 `setRows([])`로 이전 탭 데이터 즉시 비움(잔상 방지).

### B-4. 표 본문 — "준비 중" 분기 제거

ETF 탭도 이제 데이터를 가지므로 `tab !== 'stock'` 분기(준비 중)를 제거하고, 페이지네이션 조건의 `tab === 'stock'` 가드도 제거(두 탭 모두 페이지네이션 필요).

**찾기 (B-4a)** — 표 본문 시작 (171~182행, `준비 중` 분기 + loading/empty 분기):
```tsx
        <div className="min-w-0 flex-1 overflow-x-auto">
          {tab !== 'stock' ? (
            <p className="py-16 text-center text-sm text-unjong-muted">준비 중</p>
          ) : loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
```

**바꾸기 (B-4a)**:
```tsx
        <div className="min-w-0 flex-1 overflow-x-auto">
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
```

**찾기 (B-4b)** — 페이지네이션 가드 (231행):
```tsx
          {tab === 'stock' && !loading && sorted.length > PAGE_SIZE && (
```

**바꾸기 (B-4b)**:
```tsx
          {!loading && sorted.length > PAGE_SIZE && (
```

> B-4 이후 `tab` 변수는 SUBTABS 렌더·setTab·useEffect 의존성에서만 쓰이고 dead branch 없음. 빈 데이터(예: 네트워크 실패)는 기존 `sorted.length === 0` 메시지가 처리.

---

## 빌드 + 로컬 커밋 (push X · vercel X)

```bash
pkill -f "next dev" 2>/dev/null; npm run build
```

빌드 성공 시:
```bash
git add app/api/yahoo/us-etf-performance/route.ts components/toolbox/UsMarketBoard.tsx && git commit -m "feat(STEP 407): US ETF 데이터 + 하위탭 미국기준(주식·ETF)으로 정리"
```

> push·vercel **하지 말 것** — 배포는 배치로 일괄 처리.

---

## 확인 체크리스트
- [ ] `npm run build` 에러 0
- [ ] US → 종목·상품 → 하위탭이 **`주식 | ETF`** 2개만 (ETN/리츠 없음)
- [ ] **ETF 탭**에 ~73개 ETF 표시(거래대금 내림차순, SPY/QQQ/TQQQ 등 상위), "준비 중" 사라짐
- [ ] 기간 드롭다운(1주일~1년) · 현재가/1일 컬럼 · 페이지네이션 · 검색 · ⭐(market 'US') 동작
- [ ] **주식 탭** 동작·표시 STEP 406과 동일(영향 없음)
- [ ] 탭 전환 시 데이터/검색/페이지 리셋 정상, 잔상 없음
- [ ] 증권사 사이드바(BrokerRanking) 그대로 유지 — KR `MarketBoard`/`BrokerRanking` 미수정

---

## 설계 노트 / 가정
- **UI 셸 불변**: 레이아웃·컬럼·토큰·증권사 사이드바·바텀시트 전부 동일. 바뀐 건 (1) 하위탭 라벨 집합, (2) ETF 탭이 fetch한다는 점뿐.
- **ETF 행 렌더 = 주식 행과 동일**: 가격 $ 표기, 수익률, amount 정렬. 별도 컬럼 추가 없음(요구사항 일치).
- **탭별 캐시 분리**: `us-stock` / `us-etf` 키로 클라 메모리 캐시를 나눠 탭 전환 시 충돌·잔상 방지. 서버는 각 라우트가 독립 30분 캐시.
- **안정성**: ETF 라우트도 `mapLimit(…,10,…)` + `maxDuration=60` — 전체 `Promise.all` 금지(주식 라우트와 동일 패턴).
- **티커 표기**: name에 `(TICKER)` 병기 — 한국 사용자가 티커·이름 모두 검색 가능(검색은 name·symbol 둘 다 매칭). 일관성 위해 전 항목 동일 포맷.
- **유니버스 73개**: 패딩 없이 AUM/거래량 상위 중심. `SCHD` 1회만(스타일/팩터), 인컴/레버리지/인버스는 국내개미 거래 활발 종목만 선별 포함.
- **`maxDuration` 중복 export 주의**: 한 파일에 `export const maxDuration`은 1회만 — 위 신규 파일은 1회만 선언(주식 라우트와 동일 위치).
