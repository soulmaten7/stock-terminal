<!-- 2026-06-25 -->
# STEP 411 — US 기간 백그라운드 미리계산 (크론+DB 조인, 전 기간 정렬, 화살표 개선)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_411_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
미국 주식 표(`UsMarketBoard` 주식 탭)는 지금까지 1주~1년 수익률을 **요청 시점 lazy**(`us-quote`로 보이는 50종목만 야후 chart 호출)로 보강해 와서 → **전 종목 정렬 불가**(긴 기간은 거래대금순 고정), 페이지 넘길 때마다 야후 재호출.

KR 표는 이미 전 종목 1주~1년 수익률을 가지고 **모든 기간 정렬**이 된다. → 미국도 동일하게 만든다:
- **백그라운드 크론**이 하루 1번 전 종목(~6,121) 1주/1개월/3개월/6개월 수익률을 미리 계산해 DB(`us_stock_perf`)에 저장.
- `us-list`가 응답을 만들 때 그 DB 값을 **조인**해서 내려줌 + 1년(`r1y`)은 quote의 `fiftyTwoWeekChangePercent`로 즉시 채움(무료).
- `UsMarketBoard`에서 **lazy 메커니즘 전부 제거** → 주식 행도 ETF 행과 동일 shape(r1w..r1y) → 드롭다운으로 **전 기간 자동 정렬**.
- 정렬 화살표를 더 명확한 lucide 아이콘으로(양쪽 보드 공통: KR·US).

## 전제
- 최신 main. **배포 X(배치)** — 이 STEP은 **로컬 빌드 + 로컬 커밋만**. push·vercel 안 함.
- DB 테이블 **`us_stock_perf` 이미 생성됨**(컬럼: `symbol` PK, `r1w`/`r1m`/`r3m`/`r6m` double precision, `updated_at` / RLS on + public-read 정책). 이 STEP에서 마이그레이션 안 함.
- 환경변수 **`CRON_SECRET`** 필요(이미 fss/youtube 크론에서 사용 중) + `SUPABASE_SERVICE_ROLE_KEY`(admin 클라이언트).
- ⚠️ **첫 배포 직후엔 `us_stock_perf`가 비어 있음** → 1주~6개월은 "—"로 표시(정상). 크론이 한 번 돌아야(또는 수동 트리거) 채워짐. **1일·1년·거래대금은 즉시 동작**(quote에서 옴).

---

## 1단계 — 새 파일 `lib/usPerf.ts` (전종목 기간 미리계산 → DB 일괄 upsert)

> 설계: 동시 12개로 ~6,121 종목 `yf.chart`(약 280일 룩백) → 1주/1개월/3개월/6개월 수익률 계산. **결과를 메모리에 전부 모은 뒤** 마지막에 500개씩 upsert(atomic-ish — 느린 계산 중엔 테이블이 안 바뀌고, 빠른 upsert 구간에서만 새 집합으로 교체). 종목별 실패는 null 처리하고 건너뜀. 동시성 12 → ~6,121 종목이면 약 3분 → 300초 안에 여유.

**새 파일 생성** — `lib/usPerf.ts`:
```ts
// 미국 전종목(~6,121) 1주~6개월 수익률 백그라운드 미리계산 → us_stock_perf 테이블에 일괄 저장.
// us-list가 이 값을 조인해 내려줌(요청 시점 lazy chart 호출 제거). 크론(/api/cron/us-perf)이 하루 1회 호출.
// 상대경로 import: Next 빌드 + 독립 tsx 양쪽 동작(fss.ts와 동일 규칙).
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import symbols from "../data/us_symbols.json";

// yahooSurvey 안내 로그 억제
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// data/us_symbols.json: [{ sym, name, type }] — 주식만(type==='stock') 추림(~6,121)
type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[])
  .filter((s) => s.type === "stock")
  .map((s) => s.sym);

// us-performance와 동일 ret 패턴 — daysAgo 거래일 전 종가 대비 수익률(%)
function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
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

type PerfRow = { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };

export async function computeUsPerf(): Promise<{ ok: true; computed: number; at: string }> {
  // 약 280 달력일 룩백 — 6개월(126 거래일) + 비거래일 버퍼 충분
  const period1 = new Date(Date.now() - 280 * 24 * 60 * 60 * 1000);

  // 동시 12개씩 — ~6,121종목 약 3분(300초 안). 종목별 try/catch→null.
  const results = await mapLimit(STOCK_SYMS, 12, async (sym): Promise<PerfRow | null> => {
    try {
      const ch = await yf.chart(sym, { period1, interval: "1d" });
      const quotes = (ch.quotes ?? []) as Array<{ close: number | null }>;
      const closes = quotes
        .map((q) => q.close)
        .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
      if (closes.length < 6) return null; // 1주(5거래일)도 못 채우면 스킵
      return {
        symbol: sym,
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
      };
    } catch {
      return null; // 종목별 실패는 스킵
    }
  });

  // ── 메모리에 전부 모은 뒤 한 번에 기록(atomic-ish): 느린 계산(~3분) 동안 테이블 불변, 빠른 upsert 구간에서만 교체 ──
  const rows = results.filter((r): r is PerfRow => r !== null);
  const at = new Date().toISOString();
  const payload = rows.map((r) => ({ ...r, updated_at: at }));

  const sb = createAdminClient(); // RLS 우회(쓰기)
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("us_stock_perf").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }

  return { ok: true, computed: payload.length, at };
}
```

---

## 2단계 — 새 파일 `app/api/cron/us-perf/route.ts` (fss-advisors 미러)

**새 파일 생성** — `app/api/cron/us-perf/route.ts`:
```ts
import { NextResponse } from "next/server";
import { computeUsPerf } from "@/lib/usPerf";

export const maxDuration = 300; // ~6,121종목 chart 계산 여유(동시 12 → ~3분)
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await computeUsPerf();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

---

## 3단계 — `vercel.json`에 크론 추가 (기존 2개 유지)

찾기:
```json
{
  "crons": [
    { "path": "/api/cron/fss-advisors", "schedule": "0 19 * * *" },
    { "path": "/api/cron/youtube-refresh", "schedule": "0 0 * * 1" }
  ]
}
```
바꾸기:
```json
{
  "crons": [
    { "path": "/api/cron/fss-advisors", "schedule": "0 19 * * *" },
    { "path": "/api/cron/youtube-refresh", "schedule": "0 0 * * 1" },
    { "path": "/api/cron/us-perf", "schedule": "0 22 * * *" }
  ]
}
```
> `0 22 * * *` = 매일 22:00 UTC(미국 정규장 마감 후). 하루 1회만 ~6,121종목 chart.

---

## 4단계 — `app/api/yahoo/us-list/route.ts` (r1y from quote + us_stock_perf DB 조인)

> 변경 요지: ① quote에서 `fiftyTwoWeekChangePercent`를 `r1y`로(무료, 추가 호출 X) ② 전 종목 quote 빌드 후 `us_stock_perf`를 admin 클라이언트로 한 번 읽어 `Map<symbol,row>` 만들고 `r1w/r1m/r3m/r6m`를 머지(테이블 비면 null → "—"). 15분 캐시·거래대금 내림차순·skip-fail 유지.

### (A) admin import 추가
찾기:
```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import symbols from "@/data/us_symbols.json";
```
바꾸기:
```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import symbols from "@/data/us_symbols.json";
import { createAdminClient } from "@/lib/supabase/admin";
```

### (B) Item 타입에 기간 필드 추가
찾기:
```ts
type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  amount: number; // 거래대금(USD) = 현재가 × 거래량 — 정렬 전용
};
```
바꾸기:
```ts
type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  r1w: number | null; // 1주 — us_stock_perf 조인(크론 미리계산)
  r1m: number | null; // 1개월 — 동
  r3m: number | null; // 3개월 — 동
  r6m: number | null; // 6개월 — 동
  r1y: number | null; // 1년 — quote의 fiftyTwoWeekChangePercent(즉시)
  amount: number; // 거래대금(USD) = 현재가 × 거래량 — 정렬 전용
};
```

### (C) quote 행에 r1w~r1y 채우기(기간은 일단 null, r1y는 quote에서)
찾기:
```ts
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
```
바꾸기:
```ts
        rows.push({
          symbol: (q as { symbol: string }).symbol,
          name:
            (q as { shortName?: string }).shortName ||
            (q as { longName?: string }).longName ||
            (q as { symbol: string }).symbol,
          price,
          changePercent: (q as { regularMarketChangePercent?: number }).regularMarketChangePercent ?? 0,
          r1w: null, // us_stock_perf 조인으로 아래에서 채움
          r1m: null,
          r3m: null,
          r6m: null,
          r1y: (q as { fiftyTwoWeekChangePercent?: number }).fiftyTwoWeekChangePercent ?? null, // 1년(무료)
          amount: price * vol,
        });
```

### (D) 평탄화·정렬 직후 us_stock_perf 조인
찾기:
```ts
  // 평탄화 후 거래대금 내림차순(최다거래 우선)
  const items = perChunk.flat().sort((a, b) => b.amount - a.amount);
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
```
바꾸기:
```ts
  // 평탄화 후 거래대금 내림차순(최다거래 우선)
  const items = perChunk.flat().sort((a, b) => b.amount - a.amount);

  // us_stock_perf(크론 미리계산) 조인 — 1주~6개월을 종목별로 머지. 테이블 비면 null 유지("—").
  try {
    const sb = createAdminClient();
    const { data: perf } = await sb.from("us_stock_perf").select("symbol,r1w,r1m,r3m,r6m");
    if (perf && perf.length > 0) {
      const map = new Map<string, { r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null }>();
      for (const p of perf as { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null }[]) {
        map.set(p.symbol, { r1w: p.r1w, r1m: p.r1m, r3m: p.r3m, r6m: p.r6m });
      }
      for (const it of items) {
        const p = map.get(it.symbol);
        if (p) { it.r1w = p.r1w; it.r1m = p.r1m; it.r3m = p.r3m; it.r6m = p.r6m; }
      }
    }
  } catch {
    // 조인 실패해도 quote 기반(현재가·1일·1년·거래대금)은 그대로 — 1주~6개월만 "—"
  }

  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
```

---

## 5단계 — `components/toolbox/UsMarketBoard.tsx` (lazy 메커니즘 제거 → 전 기간 정렬)

> 변경 요지: 주식 행이 이제 us-list에서 r1w..r1y를 전부 가짐(ETF 행과 동일 shape). → lazy `periodMap` state·`periodLoading`·`us-quote` fetch effect·`periodCell()` lazy 분기를 전부 제거. 기간 셀은 두 탭 모두 `row[periodField]`를 직접 읽음. 드롭다운 선택 시 전 기간 자동 정렬(데이터가 있으니). ⭐·페이지네이션·검색·사이드바·하위탭·통화 유지.

### (A) 주석/타입 정리 — 주식도 전 기간 보유
찾기:
```ts
// ETF 행은 r1w..r1y를 가짐(us-etf-performance가 한 번에 줌, 동기).
// 주식 행은 us-list가 현재가·1일·amount만 줌 → 기간 수익률은 periodMap으로 lazy 보강.
type Row = {
```
바꾸기:
```ts
// 주식·ETF 행 모두 r1w..r1y를 가짐 — 주식은 us-list가 us_stock_perf(크론 미리계산) 조인 + r1y(quote),
// ETF는 us-etf-performance가 한 번에 줌. 두 탭 동일 shape → 전 기간 정렬 가능.
type Row = {
```

### (B) 기간 드롭다운 주석 — lazy 설명 제거
찾기:
```ts
// 기간 드롭다운: 현재가 다음 단일 컬럼을 선택 기간으로 표시(1일부터). 1일=changePercent(리스트 행에 있음·non-lazy), 1주일~1년=lazy(periodMap).
type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
```
바꾸기:
```ts
// 기간 드롭다운: 현재가 다음 단일 컬럼을 선택 기간으로 표시(1일부터). 모든 기간이 행에 직접 있음(주식=us-list 조인, ETF=etf-performance).
type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
```

### (C) 데이터 소스 주석 — lazy 제거
찾기:
```ts
// 하위탭별 데이터 소스 — 주식=전종목 목록(us-list, batch quote / 기간은 lazy), ETF=us-etf-performance(기간 포함).
const ENDPOINTS: Record<SubTab, string> = {
```
바꾸기:
```ts
// 하위탭별 데이터 소스 — 주식=전종목 목록(us-list, batch quote + us_stock_perf 조인 / 전 기간 포함), ETF=us-etf-performance(기간 포함).
const ENDPOINTS: Record<SubTab, string> = {
```

### (D) lazy state 2개 제거
찾기:
```ts
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 기본 1일
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 1일 정렬 방향 토글(긴 기간은 amount 고정이라 무영향)
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
바꾸기:
```ts
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 기본 1일
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 선택 기간 정렬 방향 토글(전 기간 적용)
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
```

### (E) 정렬 로직 — 전 기간 정렬(amount 고정 분기 제거)
찾기:
```ts
  const PAGE_SIZE = 50;
  // 기본=거래대금(amount) 내림차순(최다거래 우선). 드롭다운 '1일' 선택 시 changePercent 정렬(데이터가 리스트 행에 있음).
  // '1주일~1년'은 lazy(periodMap)라 전 행이 안 채워져 정렬 불가 → amount-desc 유지(옵션 A). 검색 필터(티커·이름) 공통.
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    if (period === '1d') {
      const dir = sortDir === 'desc' ? -1 : 1;
      return [...base].sort((a, b) => ((a.changePercent ?? 0) - (b.changePercent ?? 0)) * dir);
    }
    return [...base].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }, [rows, search, period, sortDir]);
```
바꾸기:
```ts
  const PAGE_SIZE = 50;
  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'changePercent';
  // 선택 기간으로 전 종목 정렬(1일~1년 모두 행에 데이터 있음). null은 항상 뒤로. 검색 필터(티커·이름) 공통.
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    return [...base].sort((a, b) => {
      const av = a[periodField] as number | null | undefined;
      const bv = b[periodField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [rows, search, periodField, sortDir]);
```

### (F) 중복 `periodField`·lazy effect·`periodCell` 제거
찾기:
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
    if (period === '1d') return; // 1일은 리스트 행 changePercent 사용 — lazy fetch 불필요
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

  // 기간 셀 값 통합: 1일=changePercent(리스트 행, non-lazy). ETF 긴 기간=r필드, 주식 긴 기간=periodMap(lazy). undefined=로딩 중(…)·null=데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    if (period === '1d') return r.changePercent;
    if (tab === 'etf') return r[periodField] as number | null | undefined;
    return periodMap[`${r.symbol}|${period}`];
  }

  function pageNumbers(): (number | '…')[] {
```
바꾸기:
```ts
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  // 기간 셀 값: 선택 기간 필드를 행에서 직접 읽음(주식=us-list 조인, ETF=etf-performance). null=데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    return r[periodField] as number | null | undefined;
  }

  function pageNumbers(): (number | '…')[] {
```

### (G) 드롭다운 헤더 — periodLoading opacity 제거 + 화살표 토글 항상 활성(전 기간) + 아이콘 개선
찾기:
```tsx
                  {/* 기간 드롭다운(1일부터) — '1일'은 자동 정렬(changePercent), 긴 기간은 표시만(lazy, amount 정렬 유지). KR 미러 */}
                  <th className="w-[116px] whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-medium sm:pr-4">
                    <span className="inline-flex items-center justify-end gap-0.5">
                      <select value={period} onChange={(e) => { setPeriod(e.target.value as PeriodKey); setSortDir('desc'); setPage(0); }} className={`rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none ${tab === 'stock' && periodLoading ? 'opacity-60' : ''}`}>
                        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => { if (period === '1d') setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); }}
                        aria-label="선택 기간으로 정렬"
                        title={period === '1d' ? '1일 등락순 정렬' : '긴 기간은 거래대금순 고정(표시만)'}
                        className={`ml-1.5 shrink-0 hover:text-unjong-primary ${period === '1d' ? 'text-unjong-accent' : 'cursor-default text-unjong-border'}`}
                      >
                        {period === '1d' ? (sortDir === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />) : <ArrowUpDown size={16} />}
                      </button>
                    </span>
                  </th>
```
바꾸기:
```tsx
                  {/* 기간 드롭다운(1일부터) — 선택 기간으로 전 종목 자동 정렬 + 옆 토글로 오름/내림. KR 미러 */}
                  <th className="w-[116px] whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-medium sm:pr-4">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <select value={period} onChange={(e) => { setPeriod(e.target.value as PeriodKey); setSortDir('desc'); setPage(0); }} className="rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none">
                        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                        aria-label={`선택 기간 ${sortDir === 'desc' ? '오름차순' : '내림차순'}으로 정렬`}
                        title="선택 기간순 정렬(클릭 시 오름/내림 전환)"
                        className="shrink-0 text-unjong-accent transition-colors hover:text-unjong-primary"
                      >
                        {sortDir === 'desc' ? <ChevronDown size={18} strokeWidth={2.5} /> : <ChevronUp size={18} strokeWidth={2.5} />}
                      </button>
                    </span>
                  </th>
```
> US는 이제 항상 선택 기간으로 정렬(데이터 상존)이므로 토글이 항상 의미 있음 → 화살표 상시 accent. `ArrowUpDown`은 이 컴포넌트에서 더 이상 안 쓰이지만 import는 그대로 둬도 빌드는 통과(미사용 경고만). 깔끔히 하려면 (H)로 제거.

### (H) (선택·권장) 미사용 import 정리
찾기:
```ts
import { Star, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
```
바꾸기:
```ts
import { Star, X, ChevronUp, ChevronDown } from 'lucide-react';
```
> `getCache`/`setCache`는 여전히 rows 캐시에 쓰이므로 유지(제거 금지). `ArrowUpDown`만 제거.

---

## 6단계 — `components/toolbox/MarketBoard.tsx` (정렬 화살표 개선 — US와 동일하게)

> KR도 기존엔 inactive일 때 `ArrowUpDown`(작고 muted)이었음. US와 시각 일관성 위해 동일 규격(active=ChevronDown/Up 18px accent, inactive=ArrowUpDown 18px muted, 간격 gap-1.5).

찾기:
```tsx
                    <span className="inline-flex items-center justify-end gap-0.5">
                      <select value={mobilePeriod} onChange={(e) => { const k = e.target.value as PeriodKey; setMobilePeriod(k); setSortKey(k); setSortDir('desc'); setPage(0); }} className="rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none">
                        {DROPDOWN_PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label="선택 기간으로 정렬"
                        title="선택 기간순 정렬"
                        className={`ml-1.5 shrink-0 hover:text-unjong-primary ${sortKey === mobilePeriod ? 'text-unjong-accent' : 'text-unjong-muted'}`}
                      >
                        {sortKey === mobilePeriod ? (sortDir === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />) : <ArrowUpDown size={16} />}
                      </button>
                    </span>
```
바꾸기:
```tsx
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <select value={mobilePeriod} onChange={(e) => { const k = e.target.value as PeriodKey; setMobilePeriod(k); setSortKey(k); setSortDir('desc'); setPage(0); }} className="rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none">
                        {DROPDOWN_PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label={sortKey === mobilePeriod ? `선택 기간 ${sortDir === 'desc' ? '오름차순' : '내림차순'}으로 정렬` : '선택 기간으로 정렬'}
                        title="선택 기간순 정렬(클릭 시 오름/내림 전환)"
                        className={`shrink-0 transition-colors hover:text-unjong-primary ${sortKey === mobilePeriod ? 'text-unjong-accent' : 'text-unjong-muted'}`}
                      >
                        {sortKey === mobilePeriod ? (sortDir === 'desc' ? <ChevronDown size={18} strokeWidth={2.5} /> : <ChevronUp size={18} strokeWidth={2.5} />) : <ArrowUpDown size={18} />}
                      </button>
                    </span>
```
> `ArrowUpDown`은 inactive 상태에 여전히 쓰이므로 KR import는 그대로 유지(제거 금지).

---

## 7단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add lib/usPerf.ts app/api/cron/us-perf/route.ts vercel.json app/api/yahoo/us-list/route.ts components/toolbox/UsMarketBoard.tsx components/toolbox/MarketBoard.tsx
git commit -m "feat(STEP 411): US 기간 백그라운드 미리계산 — 크론+DB조인, 전기간 정렬, 화살표 개선"
```
**push·vercel 안 함**(다음 배치 배포 때 함께).

---

## 확인
- [ ] `npm run build` 타입·빌드 통과.
- [ ] 새 파일 2개 생성: `lib/usPerf.ts`(`computeUsPerf` export), `app/api/cron/us-perf/route.ts`(`maxDuration=300`·Bearer CRON_SECRET).
- [ ] `vercel.json` 크론 3개(fss·youtube·us-perf), us-perf = `0 22 * * *`.
- [ ] `us-list` 응답 item shape = `{symbol,name,price,changePercent,r1w,r1m,r3m,r6m,r1y,amount}`. r1y는 즉시 채워짐, r1w~r6m은 테이블 있으면 채워지고 없으면 null.
- [ ] `UsMarketBoard` 주식 탭에서 드롭다운으로 **모든 기간 정렬** 동작(데이터가 채워진 후) + 화살표 클릭 시 오름/내림 토글. ETF 탭·⭐·페이지네이션·검색·증권사 사이드바·통화 정상.
- [ ] KR 표(`MarketBoard`) 정렬 화살표가 더 큼·명확(18px, active=accent). 정렬 동작 기존과 동일.

## ⚠️ 첫 배포 후 주의(중요)
- **이 STEP은 로컬 커밋까지만** — 실제 배포(push/vercel) 후에야 크론이 등록됨.
- 배포 후 **크론이 한 번 돌아야**(매일 22:00 UTC) `us_stock_perf`가 채워짐 → 그 전엔 미국 표 **1주~6개월이 "—"**(정상). **1일·1년·거래대금은 즉시 동작**(quote에서 옴).
- 즉시 채우려면 배포 후 수동 트리거:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://<배포도메인>/api/cron/us-perf
  ```
  (`{ ok:true, computed:N, at:... }` 응답 → 약 3분 소요. 응답 후 표 새로고침하면 전 기간 채워짐.)

## 스킵/보류
- `app/api/yahoo/us-quote/route.ts`는 이제 **미사용**(lazy 경로 제거됨) — 이번엔 **그대로 둠**(삭제 안 함, 후속 정리 후보).
- 클라 캐시 키 `us-stock-periodmap`은 더 이상 안 씀(자연 만료) — 별도 정리 불필요.
- DB 마이그레이션·RLS 정책 작업 없음(`us_stock_perf` 이미 생성·public-read).

## 리스크 메모
- **야후 부하**: 하루 1회 ~6,121종목 chart(동시 12) ≈ 3분. us-performance/us-list와 동일한 비공식 야후 엔드포인트 의존 — 레이트리밋/일시 차단 시 일부 종목만 null로 빠지고 다음날 재시도로 자연 복구(테이블은 직전 성공분 유지, 부분 상태 노출 없음).
- **첫 실행 전 빈 테이블**: 위 "첫 배포 후 주의" 그대로 — graceful(null→"—").
- **300초 한도**: 동시성 12 기준 여유. 야후가 느려지면 상향 여지 없음(Vercel 함수 상한) → 그 경우 동시성 ↑ 또는 종목 분할 검토(후속).
