# STEP 408 — US 주식 전종목(lazy) — 목록 batch quote + 기간 lazy

> 작성: 2026-06-25 · Cowork 설계 → Claude Code 실행
> 목표: US 마켓보드 **주식 탭**을 193종목 큐레이션 리스트 → **미국 상장 전종목(~6,121)** 으로 확장한다. 한 번에 다 계산하면 타임아웃이므로 **lazy 아키텍처**: ① 목록은 batch quote(현재가·1일·거래대금만, 빠름)로 전종목 한 번에, ② 기간 수익률(1주~1년)은 **현재 보이는 50종목만** on-demand로 계산. **ETF 탭·KR(`MarketBoard`)은 절대 건드리지 않는다.**
> 실현 가능성 검증 완료: batch quote 300종목 → 297 ok / 2.3초. (`_probe.mjs`로 측정 — 이 STEP에서 정리 삭제)

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- HEAD: `ae781d4` (STEP 407 — US 하위탭 주식|ETF 2개, ETF 실데이터 ~73, 주식은 `us-performance` 193종목)
- 스택: Next.js 16 App Router (Turbopack, 포트 3333) · Tailwind v4 · `yahoo-finance2` v3.14 · `unjong-*` 식별자 · 한국어 UI
- `data/us_symbols.json` **이미 존재** — `[{ "sym", "name", "type" }]` 6,936개 (stock 6,121 · etf 815). 클래스주는 Yahoo `-` 포맷(`BRK-B` 등). 이름은 종종 placeholder(=티커)지만 **상관없음** — Yahoo가 quote 시점에 진짜 이름을 주므로 목록 라우트는 Yahoo 이름을 쓴다.
- `data/us_symbols_meta.json` 동봉(생성 메타·캐비엇).
- tsconfig `resolveJsonModule: true` 확인됨 → **JSON import 사용** (`import symbols from '@/data/us_symbols.json'`).
- 배포는 배치 — 이 STEP은 **로컬 빌드 + 로컬 커밋만** (push X, vercel X)

## 이번 STEP 범위 (정확히 3파일 + 데이터 2개 add)
1. **신규** `app/api/yahoo/us-list/route.ts` — 전종목 목록(batch quote: 현재가·1일·거래대금).
2. **신규** `app/api/yahoo/us-quote/route.ts` — 보이는 페이지(≤~60종목)의 선택 기간 수익률 lazy 계산.
3. **수정** `components/toolbox/UsMarketBoard.tsx` — 주식 탭만 lazy 모델로 재작업. ETF 탭·KR 불변.
4. `git add` 에 `data/us_symbols.json` · `data/us_symbols_meta.json` 포함(아직 미커밋이면).

> ❗ `MarketBoard`(KR)·`BrokerRanking`·`us-etf-performance`·`us-performance` 라우트는 **건드리지 않는다**. (`us-performance`는 이 STEP 이후 주식 탭에서 미사용이 되지만 **삭제하지 말 것** — 아래 노트 참조.)

---

## (A) 신규 파일 — `app/api/yahoo/us-list/route.ts`

전종목 목록. **batch quote**(`yf.quote(배열)`)로 100개씩 묶어 한 번에 현재가·1일·거래대금만 가져온다(기간 수익률 없음 → 빠름). **skip-fail + 동시성 제한 필수**(61개 청크를 plain `Promise.all`로 한 번에 던지지 말 것 — 반드시 `mapLimit(…,6,…)`). 실패한 청크는 `[]` 반환해 전체를 깨지 않는다. 15분 인메모리 캐시.

아래 **전체 내용**으로 새 파일 생성:

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import symbols from "@/data/us_symbols.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 전종목(~6,121) batch quote를 콜드 캐시 때 부르므로 함수 타임아웃 여유 확보(15분 캐시라 콜드만)
export const maxDuration = 60;

// yahooSurvey 안내 로그 억제(서버 콘솔 깔끔)
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// data/us_symbols.json: [{ sym, name, type }] — 주식만(type==='stock') 추림(~6,121)
type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[])
  .filter((s) => s.type === "stock")
  .map((s) => s.sym);

type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  amount: number; // 거래대금(USD) = 현재가 × 거래량 — 정렬 전용
};

let cache: { at: number; data: { items: Item[] } } | null = null;

// N개씩 청크
function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// 동시 호출 제한 — 야후 레이트리밋/타임아웃 방지(한 번에 limit개씩만 진행). us-performance와 동일 패턴.
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
  // 15분 인메모리 캐시
  if (cache && Date.now() - cache.at < 15 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  // 100개씩 묶어 batch quote, 동시 6청크까지. (~62 청크 × 6동시 — 야후 부담 최소화)
  const chunks = chunk(STOCK_SYMS, 100);
  const perChunk = await mapLimit(chunks, 6, async (syms): Promise<Item[]> => {
    try {
      const r = await yf.quote(syms);
      const arr = Array.isArray(r) ? r : [r];
      const rows: Item[] = [];
      for (const q of arr) {
        const price = (q as { regularMarketPrice?: number }).regularMarketPrice ?? 0;
        if (!(price > 0)) continue; // 가격 없는/0 종목 제외
        const vol = (q as { regularMarketVolume?: number }).regularMarketVolume ?? 0;
        rows.push({
          symbol: (q as { symbol: string }).symbol,
          name:
            (q as { shortName?: string }).shortName ||
            (q as { longName?: string }).longName ||
            (q as { symbol: string }).symbol,
          price,
          changePercent: (q as { regularMarketChangePercent?: number }).regularMarketChangePercent ?? 0,
          amount: price * vol,
        });
      }
      return rows;
    } catch {
      return []; // skip-fail — 실패 청크가 전체를 깨지 않게
    }
  });

  // 평탄화 후 거래대금 내림차순(최다거래 우선)
  const items = perChunk.flat().sort((a, b) => b.amount - a.amount);
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```

> **JSON import vs fs read**: tsconfig `resolveJsonModule: true`라 `import symbols from "@/data/us_symbols.json"` 사용(`@/*` alias 확인됨). fs 폴백 불필요.
> **검증**: `yf.quote(['AAPL','BRK-B','NVDA'])` → 배열 반환, `shortName`/`longName`/`regularMarketPrice`/`regularMarketChangePercent`/`regularMarketVolume` 모두 존재 확인. batch 300종목 → 297 ok / 2.3초(probe).

---

## (B) 신규 파일 — `app/api/yahoo/us-quote/route.ts`

**보이는 페이지(≤~60종목)** 의 선택 기간 수익률만 lazy 계산. 각 심볼을 `yf.chart()`로 부르되 동시 10개로 제한. `${sym}|${period}` 키로 ~30분 인메모리 캐시 → 같은 페이지/기간 재방문 시 즉시. `{ rets: { [sym]: number|null } }` 반환.

아래 **전체 내용**으로 새 파일 생성:

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 보이는 50종목 chart를 콜드 때 부르므로 여유(대부분 캐시 히트)
export const maxDuration = 60;

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Period = "1w" | "1m" | "3m" | "6m" | "1y";

// 기간 → daysAgo(거래일 기준)
const DAYS_AGO: Record<Period, number> = { "1w": 5, "1m": 21, "3m": 63, "6m": 126, "1y": 252 };
// 기간 → period1 lookback(달력일 — 비거래일 버퍼 포함)
const LOOKBACK_DAYS: Record<Period, number> = { "1w": 25, "1m": 55, "3m": 150, "6m": 300, "1y": 480 };

// us-performance와 동일 ret 패턴
function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

// `${sym}|${period}` → { at, value } 인메모리 캐시(~30분)
const cache = new Map<string, { at: number; value: number | null }>();
const TTL = 30 * 60 * 1000;

// 동시 호출 제한 — us-performance와 동일 패턴
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "1w") as Period;
  const daysAgo = DAYS_AGO[period] ?? DAYS_AGO["1w"];
  const lookback = LOOKBACK_DAYS[period] ?? LOOKBACK_DAYS["1w"];

  const raw = (searchParams.get("syms") || "").trim();
  // 콤마 리스트 → 중복 제거(보통 ≤~60)
  const syms = Array.from(new Set(raw.split(",").map((s) => s.trim()).filter(Boolean)));
  if (syms.length === 0) return NextResponse.json({ rets: {} });

  const period1 = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);
  const now = Date.now();

  const pairs = await mapLimit(syms, 10, async (sym): Promise<[string, number | null]> => {
    const key = `${sym}|${period}`;
    const hit = cache.get(key);
    if (hit && now - hit.at < TTL) return [sym, hit.value];
    try {
      const ch = await yf.chart(sym, { period1, interval: "1d" });
      const quotes = (ch.quotes ?? []) as Array<{ close: number | null }>;
      const closes = quotes
        .map((q) => q.close)
        .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
      const value = ret(closes, daysAgo);
      cache.set(key, { at: now, value });
      return [sym, value];
    } catch {
      return [sym, null]; // 종목별 실패는 null
    }
  });

  const rets: Record<string, number | null> = {};
  for (const [s, v] of pairs) rets[s] = v;
  return NextResponse.json({ rets });
}
```

> period1 lookback에 달력일 버퍼를 둔 이유: 1y=252 거래일을 확보하려면 ~365일+주말/공휴일/휴장 버퍼가 필요 → 480일. 짧은 기간도 동일 논리(1w=5거래일 ⇢ 25달력일).

---

## (C) 수정 파일 — `components/toolbox/UsMarketBoard.tsx`

**주식 탭만 lazy로 재작업, ETF 탭은 100% 불변.** 아래 **find/replace 7곳**. 각 블록 좌측(찾기)은 **현재 파일(STEP 407 직후) 그대로**이며 그대로 일치해야 함. 우측(바꾸기)으로 교체.

### 동작 요약(읽고 시작)
- **주식 탭**: `/api/yahoo/us-list` 1회 fetch(캐시 키 `us-stock-list`) → 전종목 `items`(현재가·1일·거래대금) 저장. 검색(티커·이름) + 50/페이지 페이지네이션은 전부 **클라이언트**(KR `MarketBoard` 미러).
- **주식 기간 컬럼 = lazy**: 검색+페이지 적용 후 **보이는 50종목의 sym**을 계산. 이 sym 집합 또는 선택 기간이 바뀌면 `GET /api/yahoo/us-quote?syms=<50>&period=<sel>` → `periodMap`(`{[sym]: number|null}`)에 머지. 로딩 중 셀은 `…`, 로딩되면 % + 상승/하락 색. periodMap은 클라 캐시 → 같은 페이지/기간 재방문 시 재fetch 없음.
- **ETF 탭 = 불변**: 여전히 `us-etf-performance` fetch → 행에 `r1w..r1y` 포함 → 기간 셀이 행 필드를 직접 읽음(동기).
- **기간 셀 통합 렌더**: ETF 행은 선택 기간 필드(`r[field]`)가 있으면 그걸, 없으면(주식 lazy) `periodMap[sym]`, 둘 다 없으면 `…`.

---

### C-1. Row 타입 — lazy 표식 주석(선택). (변경 최소 — 타입은 그대로 두되 의미 명확화)

**찾기** (9~20행):
```ts
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
```

**바꾸기**:
```ts
// ETF 행은 r1w..r1y를 가짐(us-etf-performance가 한 번에 줌, 동기).
// 주식 행은 us-list가 현재가·1일·amount만 줌 → 기간 수익률은 periodMap으로 lazy 보강.
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
```

### C-2. 엔드포인트 — 주식만 us-list로 교체 + 별도 캐시 키

**찾기** (52~67행):
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

**바꾸기**:
```ts
// 하위탭별 데이터 소스 — 주식=전종목 목록(us-list, batch quote / 기간은 lazy), ETF=us-etf-performance(기간 포함).
const ENDPOINTS: Record<SubTab, string> = {
  stock: '/api/yahoo/us-list',
  etf: '/api/yahoo/us-etf-performance',
};
const CACHE_KEYS: Record<SubTab, string> = { stock: 'us-stock-list', etf: 'us-etf' };

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

> us-list는 `r1w..r1y`를 주지 않으므로 주식 행에선 undefined로 들어옴 → 기간 셀이 `periodMap`으로 폴백. ETF는 그대로 r필드 포함.

### C-3. periodMap state 추가

**찾기** (70~77행):
```ts
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>(CACHE_KEYS.stock) ?? []);
  const [loading, setLoading] = useState(() => getCache(CACHE_KEYS.stock) === undefined);
  const [period, setPeriod] = useState<PeriodKey>('1w');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
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
  // 주식 기간 수익률 lazy 캐시 — `${sym}|${period}` 키. 보이는 페이지 50종목만 채움. ETF는 미사용.
  const [periodMap, setPeriodMap] = useState<Record<string, number | null>>(
    () => getCache<Record<string, number | null>>('us-stock-periodmap') ?? {}
  );
  const [periodLoading, setPeriodLoading] = useState(false);
```

### C-4. paginated 계산 직후 — 보이는 50종목 lazy fetch useEffect 추가

기존 `periodField` 계산 라인 바로 **앞**에 lazy effect를 삽입한다.

**찾기** (124~127행):
```ts
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'r1w';
```

**바꾸기**:
```ts
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'r1w';

  // 보이는 페이지의 sym 목록(검색+페이지 반영). 의존성 키로 쓰려고 문자열로 고정.
  const visibleSyms = paginated.map((r) => r.symbol);
  const visibleKey = visibleSyms.join(',');

  // 주식 탭 전용 기간 lazy: 보이는 50종목 중 `${sym}|${period}` 미캐시분만 us-quote로 요청 → periodMap 머지.
  // visibleKey 또는 period가 바뀌면 재평가. ETF 탭은 이 effect를 건너뜀(행이 r필드를 직접 가짐).
  useEffect(() => {
    if (tab !== 'stock') return;
    if (visibleSyms.length === 0) return;
    const need = visibleSyms.filter((s) => periodMap[`${s}|${period}`] === undefined);
    if (need.length === 0) return; // 전부 캐시됨 → 재fetch 없음
    let cancelled = false;
    setPeriodLoading(true);
    fetch(`/api/yahoo/us-quote?syms=${encodeURIComponent(need.join(','))}&period=${period}`)
      .then((r) => r.json())
      .then((j: { rets?: Record<string, number | null> }) => {
        if (cancelled) return;
        setPeriodMap((prev) => {
          const next = { ...prev };
          for (const s of need) next[`${s}|${period}`] = (j.rets?.[s] ?? null);
          setCache('us-stock-periodmap', next);
          return next;
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPeriodLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, visibleKey, period]);

  // 기간 셀 값 통합: ETF 행은 r필드, 주식 행은 periodMap. undefined면 아직 로딩 중(…)·null이면 데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    if (tab === 'etf') return r[periodField] as number | null | undefined;
    return periodMap[`${r.symbol}|${period}`];
  }
```

### C-5. 기간 셀 렌더 — 통합 함수 사용(로딩 중 `…`)

**찾기** (217행):
```tsx
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums ${pctColor(r[periodField] as number | null | undefined)}`}>{pct(r[periodField] as number | null | undefined)}</td>
```

**바꾸기**:
```tsx
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums ${pctColor(periodCell(r))}`}>{periodCell(r) === undefined ? <span className="text-unjong-muted">…</span> : pct(periodCell(r))}</td>
```

> `pctColor(undefined)` → `text-unjong-muted`(기존 동작), 셀 내용만 `…`로. 로딩 끝나면 number(% 색) 또는 null(`—`).

### C-6. 기간 드롭다운 라벨 — 로딩 표식(선택, 미세 UX)

**찾기** (194~198행):
```tsx
                  <th className="w-[88px] whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium">
                    <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className="rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none">
                      {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </th>
```

**바꾸기**:
```tsx
                  <th className="w-[88px] whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium">
                    <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className={`rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none ${tab === 'stock' && periodLoading ? 'opacity-60' : ''}`}>
                      {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </th>
```

### C-7. 바텀시트 기간 표기는 불필요 — 변경 없음

> 바텀시트는 현재가·1일만 노출(기간 미표시) → 손댈 것 없음. C-7은 "확인만" 항목.

---

## 빌드 + 정리 + 로컬 커밋 (push X · vercel X)

```bash
rm -f _probe.mjs
pkill -f "next dev" 2>/dev/null; npm run build
```

빌드 성공 시:
```bash
git add app/api/yahoo/us-list/route.ts app/api/yahoo/us-quote/route.ts components/toolbox/UsMarketBoard.tsx data/us_symbols.json data/us_symbols_meta.json
git commit -m "feat(STEP 408): US 주식 전종목(lazy) — 목록 batch quote + 기간 lazy"
```

> push·vercel **하지 말 것** — 배포는 배치로 일괄 처리.
> `_probe.mjs`(검증용 임시 파일)는 빌드 전에 `rm -f`로 정리 — 커밋에 들어가지 않게.

---

## 확인 체크리스트
- [ ] `npm run build` 에러 0 (`_probe.mjs` 삭제 후)
- [ ] US → 종목·상품 → **주식 탭**: 종목 수 **수천 개**(하단 "총 N 종목"이 ~6,000대), 거래대금 내림차순(AAPL·NVDA·TSLA 등 상위)
- [ ] 주식 **현재가/1일** 즉시 표시(us-list batch quote)
- [ ] 주식 **기간 컬럼**: 페이지 진입 시 잠깐 `…` → 곧 % 표시(상승 민트/하락 빨강). 드롭다운 1주일↔1년 바꾸면 보이는 50종목만 다시 계산
- [ ] 같은 페이지/기간 재방문(페이지 왕복) 시 기간 셀 **즉시**(periodMap 캐시 — 재fetch 없음)
- [ ] 검색(티커·종목명) 클라 필터 정상, 페이지네이션 50/페이지 정상
- [ ] **ETF 탭** STEP 407과 100% 동일(여전히 ~73개, 기간 셀 동기 표시) — 회귀 없음
- [ ] ⭐(market 'US') · 증권사 사이드바(BrokerRanking) · 바텀시트 그대로
- [ ] KR(`MarketBoard`) 무영향
- [ ] 서버 콘솔에 yahooSurvey 안내 로그 없음(suppressNotices)

---

## 스킵 / 보류 (이번 STEP 범위 외)
- **유니버스 밖 OTC search-on-demand**: us_symbols.json에 없는 티커(소형 OTC 등)를 검색창에서 즉석 조회 → **보류**. 현재는 전종목 목록 내 클라 검색만.
- **ETF 유니버스 확장**: us_symbols.json의 etf(815개)는 A–C 슬라이스+allowlist라 불완전(메타 캐비엇 참조). ETF 탭은 당분간 큐레이션 ~73개 유지 → 확장 **보류**.
- **"상장 이후" 기간**: 1y 초과 장기 수익률 컬럼 → **보류**(드롭다운 1주~1년 유지).
- **us-performance 라우트**: 주식 탭이 us-list로 옮겨가며 **미사용**이 되지만 **삭제하지 않음**(롤백 안전망 + 다른 곳 참조 가능성). 차기 STEP에서 정리 여부 판단.

---

## 설계 노트 / 가정
- **왜 2-라우트 lazy인가**: 6,121종목 × 5기간을 한 번에 chart 호출하면 분 단위 타임아웃. 분리 → ① 목록은 batch quote(100개/콜)로 수초, ② 기간은 화면에 실제 보이는 50종목만 chart. 사용자가 보는 것만 계산 = 비용·지연 최소.
- **batch quote vs chart**: `yf.quote(배열)`은 한 번에 다수 종목의 현재가·1일변동·거래량을 줌(기간 수익률 X). 기간 수익률은 종가 시계열이 필요 → 종목별 `yf.chart()`(us-quote). 그래서 목록=quote, 기간=chart로 역할 분리.
- **이름은 Yahoo 것 사용**: us_symbols.json 이름은 placeholder가 많음 → 목록 라우트가 `shortName||longName||symbol`로 덮어씀. 클래스주는 이미 `-` 포맷(BRK-B)이라 Yahoo와 호환.
- **skip-fail 필수**: us-list는 62청크를 `mapLimit(…,6,…)`로 — 한 청크 실패해도 `[]` 반환해 나머지 표시. plain `Promise.all` 금지(요구사항).
- **캐시 3중**: ① us-list 서버 15분, ② us-quote 서버 30분(`sym|period`), ③ 클라 periodMap(`getCache`/`setCache`, 세션 메모리). 페이지 왕복·기간 토글이 즉각 반응.
- **periodMap 키 = `sym|period`**: 같은 종목이라도 기간별 별도 저장 → 1주↔1년 전환 시 이미 본 값은 캐시 히트. `undefined`=미요청(…), `null`=요청했으나 데이터 없음(—), `number`=값.
- **ETF 격리**: 기간 셀 통합 함수 `periodCell(r)`가 `tab==='etf'`면 행 r필드, 아니면 periodMap. ETF 경로는 lazy effect도, periodMap도 안 탐 → STEP 407 동작 보존.
- **`maxDuration` 중복 주의**: 신규 두 파일 각각 `export const maxDuration = 60` 1회만.
- **의존성 배열**: lazy effect는 `[tab, visibleKey, period]`로만 트리거(`periodMap` 제외 — 머지가 무한루프 안 되게). `visibleKey`=보이는 sym join 문자열이라 검색/페이지 변화가 정확히 반영됨.
- **검증 근거(probe)**: `_probe.mjs` 결과 300종목 batch quote → 297 ok / 2.3초. 전종목(~6,121)은 62청크 × 동시6 → 콜드 캐시 한 번만 수초 내 완료 예상(15분 캐시).
