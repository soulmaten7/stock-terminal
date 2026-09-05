<!-- 2026-07-01 -->
# STEP 474 (A) — KR 종목 딜레이 제거: 크론 미리계산 + DB 스냅샷 서빙

## ▶ 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
Claude Code에 붙여넣기:
```
@docs/STEP_474_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
KR '종목·상품' 초기 로딩 ~10초 → **1~2초**. 원인 = `krx/ranking`·`kr-performance`가 `force-dynamic` + 인메모리 캐시(서버리스 콜드스타트마다 소멸)라 **매 접속 KRX 전종목(~2,600) 라이브 fetch**. → **US `us_stock_perf` 패턴 미러**: 크론이 미리 계산해 `kr_stock_snapshot`에 저장, 화면 라우트는 그 테이블만 즉시 SELECT.

## 📌 전제
- **`kr_stock_snapshot` 테이블은 이미 생성됨**(Cowork가 Supabase MCP로 생성, 아래 스키마). 마이그레이션 불필요.
- admin 클라이언트 = `@/lib/supabase/admin`의 `createAdminClient()`(SERVICE_ROLE·RLS 우회) — `lib/usPerf.ts`와 동일.
- KRX 로직은 기존 `krx/ranking`·`kr-performance` 라우트에서 검증된 것을 그대로 이식.
- ⚠️ 라우트 신규/수정 → **클린 재시작** 필요(맨 아래).

<details><summary>참고: 이미 생성된 테이블 스키마</summary>

```sql
CREATE TABLE kr_stock_snapshot (
  symbol text PRIMARY KEY, name text NOT NULL, market text,
  price numeric, change_percent numeric, volume bigint,
  trade_amount numeric, market_cap numeric,
  r1w numeric, r1m numeric, r3m numeric, r6m numeric, r1y numeric,
  bas_dd text, updated_at timestamptz NOT NULL DEFAULT now()
);
```
</details>

---

## 1) 신규 `lib/krSnapshot.ts` (전체 생성)

```ts
// KR 전종목 스냅샷 미리계산 → kr_stock_snapshot upsert.
// krx/ranking(현재가·거래대금 등) + kr-performance(1주~1년) 로직을 합쳐 한 번에 저장.
// 크론(/api/cron/kr-perf)이 호출. 화면 라우트는 이 테이블만 즉시 SELECT.
import { createAdminClient } from "./supabase/admin";

const BASE = "http://data-dbg.krx.co.kr/svc/apis/sto";
const EP = { kospi: `${BASE}/stk_bydd_trd`, kosdaq: `${BASE}/ksq_bydd_trd` } as const;

type KrxRow = Record<string, string>;

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function ymd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function toShort(code: string): string {
  const c = (code || "").trim();
  return c.length === 12 ? c.slice(3, 9) : c;
}
async function fetchOne(url: string, basDd: string, key: string): Promise<KrxRow[]> {
  try {
    const res = await fetch(`${url}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.OutBlock_1 ?? j.output ?? j.block1 ?? []) as KrxRow[];
  } catch {
    return [];
  }
}
// target 이하 가장 가까운 거래일의 시장별 원본 행
async function rawForDate(target: Date, key: string): Promise<{ kospi: KrxRow[]; kosdaq: KrxRow[]; basDd: string }> {
  for (let i = 0; i < 12; i++) {
    const d = new Date(target);
    d.setDate(target.getDate() - i);
    const basDd = ymd(d);
    const [a, b] = await Promise.all([fetchOne(EP.kospi, basDd, key), fetchOne(EP.kosdaq, basDd, key)]);
    if (a.length + b.length > 0) return { kospi: a, kosdaq: b, basDd };
  }
  return { kospi: [], kosdaq: [], basDd: "" };
}
function closeMap(rows: KrxRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const sym = toShort(String(r.ISU_CD || ""));
    const close = num(r.TDD_CLSPRC);
    if (sym && close > 0) m.set(sym, close);
  }
  return m;
}
function pct(now: number, past: number | undefined): number | null {
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

export async function computeKrSnapshot(): Promise<{ ok: true; computed: number; basDd: string }> {
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) throw new Error("no KRX_API_KEY");

  const today = new Date();
  const day = 86400000;

  const base = await rawForDate(today, key);
  if (base.kospi.length + base.kosdaq.length === 0) throw new Error("krx empty");

  const [d1w, d1m, d3m, d6m, d1y] = await Promise.all([
    rawForDate(new Date(today.getTime() - 7 * day), key),
    rawForDate(new Date(today.getTime() - 30 * day), key),
    rawForDate(new Date(today.getTime() - 91 * day), key),
    rawForDate(new Date(today.getTime() - 182 * day), key),
    rawForDate(new Date(today.getTime() - 365 * day), key),
  ]);
  const m1w = closeMap([...d1w.kospi, ...d1w.kosdaq]);
  const m1m = closeMap([...d1m.kospi, ...d1m.kosdaq]);
  const m3m = closeMap([...d3m.kospi, ...d3m.kosdaq]);
  const m6m = closeMap([...d6m.kospi, ...d6m.kosdaq]);
  const m1y = closeMap([...d1y.kospi, ...d1y.kosdaq]);

  const build = (rows: KrxRow[], market: string) =>
    rows
      .map((r) => {
        const symbol = toShort(String(r.ISU_CD || ""));
        const close = num(r.TDD_CLSPRC);
        return {
          symbol,
          name: String(r.ISU_NM || "").trim(),
          market,
          price: close,
          change_percent: num(r.FLUC_RT),
          volume: num(r.ACC_TRDVOL),
          trade_amount: num(r.ACC_TRDVAL),
          market_cap: num(r.MKTCAP),
          r1w: pct(close, m1w.get(symbol)),
          r1m: pct(close, m1m.get(symbol)),
          r3m: pct(close, m3m.get(symbol)),
          r6m: pct(close, m6m.get(symbol)),
          r1y: pct(close, m1y.get(symbol)),
          bas_dd: base.basDd,
          updated_at: new Date().toISOString(),
        };
      })
      .filter((s) => s.symbol && s.price > 0);

  const payload = [...build(base.kospi, "kospi"), ...build(base.kosdaq, "kosdaq")];

  const sb = createAdminClient();
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("kr_stock_snapshot").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }
  return { ok: true, computed: payload.length, basDd: base.basDd };
}
```

## 2) 신규 `app/api/cron/kr-perf/route.ts` (전체 생성 — us-perf 미러)

```ts
import { NextResponse } from "next/server";
import { computeKrSnapshot } from "@/lib/krSnapshot";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await computeKrSnapshot();
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

## 3) `app/api/krx/ranking/route.ts` — 스냅샷 우선 서빙

**3-A. 파일 최상단 import 추가** (다른 import 아래):
```ts
import { createAdminClient } from "@/lib/supabase/admin";
```

**3-B. `GET` 안에서 아래를 찾아** (라이브 fetch 시작부):
```ts
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ stocks: [], source: "krx", error: "no_key" });

  try {
    const { rows: mapped, basDd } = await loadMapped(market, key);
```
**앞에 스냅샷 블록을 삽입** → 이렇게 바꾼다:
```ts
  // ── 스냅샷 우선(크론 미리계산) — 즉시 서빙, 딜레이 없음 ──
  try {
    const sb = createAdminClient();
    let q = sb
      .from("kr_stock_snapshot")
      .select("symbol,name,market,price,change_percent,volume,trade_amount,market_cap");
    if (market === "kospi" || market === "kosdaq") q = q.eq("market", market);
    const col =
      sort === "volume" ? "volume" : sort === "cap" ? "market_cap" : sort === "up" || sort === "down" ? "change_percent" : "trade_amount";
    const asc = sort === "down";
    const { data, error } = await q.order(col, { ascending: asc, nullsFirst: false }).limit(limit);
    if (!error && data && data.length > 0) {
      const stocks = data.map((s, i) => ({
        rank: i + 1,
        symbol: s.symbol,
        name: s.name,
        price: Number(s.price) || 0,
        changePercent: Number(s.change_percent) || 0,
        volume: Number(s.volume) || 0,
        tradeAmount: Number(s.trade_amount) || 0,
        marketCap: Number(s.market_cap) || 0,
      }));
      return NextResponse.json({ stocks, source: "kr_snapshot" });
    }
  } catch {
    /* 스냅샷 실패 → 아래 라이브 fallback */
  }

  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ stocks: [], source: "krx", error: "no_key" });

  try {
    const { rows: mapped, basDd } = await loadMapped(market, key);
```
> 나머지 라이브 코드(loadMapped·정렬·응답)는 그대로 둔다 = 스냅샷 비었을 때 fallback.

## 4) `app/api/krx/kr-performance/route.ts` — 스냅샷 우선

**4-A. 최상단 import 추가:**
```ts
import { createAdminClient } from "@/lib/supabase/admin";
```

**4-B. `export async function GET() {` 바로 다음 3줄을 찾아:**
```ts
export async function GET() {
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ items: [], error: "no_key" });
  if (cache && Date.now() - cache.at < TTL) return NextResponse.json(cache.data);
```
**앞에 스냅샷 블록 삽입 → 이렇게:**
```ts
export async function GET() {
  // ── 스냅샷 우선(크론 미리계산) ──
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("kr_stock_snapshot")
      .select("symbol,r1w,r1m,r3m,r6m,r1y")
      .limit(5000);
    if (!error && data && data.length > 0) return NextResponse.json({ items: data });
  } catch {
    /* 스냅샷 실패 → 라이브 fallback */
  }

  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ items: [], error: "no_key" });
  if (cache && Date.now() - cache.at < TTL) return NextResponse.json(cache.data);
```
> 나머지 라이브 코드 그대로.

## 5) `vercel.json` — KR 크론 추가

**찾을 것:**
```json
    { "path": "/api/cron/us-perf", "schedule": "0 22 * * *" }
  ]
```
**바꿀 것:** (KRX EOD 데이터 반영 위해 19:00 KST = 10:00 UTC)
```json
    { "path": "/api/cron/us-perf", "schedule": "0 22 * * *" },
    { "path": "/api/cron/kr-perf", "schedule": "0 10 * * *" }
  ]
```

---

## 6) 빌드 + 클린 재시작
```bash
npm run build
```
성공 시:
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 7) 스냅샷 최초 1회 채우기 (⚠️ 안 하면 테이블 비어서 라이브 fallback으로 계속 느림)
크론은 하루 1회(19:00 KST)라, 지금 바로 한 번 채워야 함. 로컬 dev에서:
```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3333/api/cron/kr-perf
```
> `$CRON_SECRET`은 `.env.local` 값. 안 잡히면 `.env.local`의 CRON_SECRET 값을 직접 넣어 실행.
> 결과 `{"ok":true,"computed":2600...}` 나오면 성공. (KRX 호출 때문에 20~40초 걸릴 수 있음.)

## 8) 라이브 검증 (localhost:3333)
- [ ] 한국 → 종목·상품 **첫 로딩 1~2초 이내**(새로고침해도 빠름).
- [ ] 종목·현재가·1일% + 기간(1주~1년) 정상.
- [ ] 정렬(현재가·거래대금·기간)·검색·페이지네이션 정상.
- [ ] DevTools Network에서 `/api/krx/ranking` 응답 `source:"kr_snapshot"` 확인.

## 9) 커밋 (배포는 사용자 판단)
```bash
git add lib/krSnapshot.ts app/api/cron/kr-perf/route.ts app/api/krx/ranking/route.ts app/api/krx/kr-performance/route.ts vercel.json && git commit -m "perf: KR 종목 크론 미리계산+스냅샷 서빙(kr_stock_snapshot)으로 초기 로딩 10초→즉시 (STEP 474)"
```
> **배포 후 prod에서도 스냅샷 1회 채우기**: `curl -H "Authorization: Bearer <CRON_SECRET>" https://onetrillion.app/api/cron/kr-perf` (또는 Vercel 대시보드 Cron에서 수동 Run). 이후 매일 자동.

## ⚠️ 노트
- ETF/ETN/리츠 탭은 별도 라우트(`etf-performance` 등)라 이번 범위 밖 — 리스트가 작아 상대적으로 빠름. 필요하면 후속 STEP에서 동일 패턴 적용.
- 스냅샷은 EOD(장 마감 일별) 데이터라 장중엔 전일 종가 기준(라이브도 동일). 하루 1회 크론으로 충분.
- 보안: `CRON_SECRET`은 사용자만 취급(.env.local/Vercel). Cowork·이 문서에 값 안 적음.
