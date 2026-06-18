<!-- 2026-06-18 -->
# STEP 276 — 상품 목록 100개로 확장 (ETF·ETN 거래대금 순 100, 리츠 전체)

## 🔧 실행 (Sonnet — 신규 파일 1 + find/replace 4)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_276_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: `f65eb5d` (STEP 275). 빌드 ✓.
- **결과 커밋 예정**: STEP 276.

---

## 🎯 목표

ETF 15·ETN 20·리츠 14개만 보이던 걸 **주식처럼 거래대금 순 100개**로 확장.

원인: ETF는 인기100 필터+하드코딩 16개, ETN은 80개 중 20개만 slice, 리츠는 하드코딩 14개. 실제로는 KRX에 **ETF 1,140개·ETN 380개** 있음(실측 확인). 리츠는 종목 자체가 ~20개대.

해결: ETN처럼 **KRX 기반 ETF 전용 라우트 신설** → ETF 탭을 ETN/리츠와 동일한 `HomePerfRanking`으로 통일하고, 표시 개수를 100으로.

---

## 📄 파일 1 (신규 생성) — `app/api/krx/etf-performance/route.ts`

> `etn-performance`와 동일 구조, 엔드포인트만 `etf_bydd_trd`, 거래대금 순 **100개**. (필드 TDD_CLSPRC·FLUC_RT·ACC_TRDVAL 동일 확인됨)

아래 내용으로 **새 파일 생성**:
```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EP = "http://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd";

type KrxRow = Record<string, string>;

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
function toShort(code: string): string {
  const c = code.trim();
  return c.length === 12 ? c.slice(3, 9) : c;
}

async function fetchDay(basDd: string, key: string): Promise<KrxRow[]> {
  try {
    const res = await fetch(`${EP}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.OutBlock_1 ?? j.output ?? []) as KrxRow[];
  } catch {
    return [];
  }
}

async function snapshot(daysAgo: number, key: string, now: Date): Promise<{ basDd: string; rows: KrxRow[] }> {
  for (let i = 0; i < 6; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo - i);
    const basDd = ymd(d);
    const rows = await fetchDay(basDd, key);
    if (rows.length > 0) return { basDd, rows };
  }
  return { basDd: "", rows: [] };
}

function closeMap(rows: KrxRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const sym = toShort(String(r.ISU_CD || ""));
    const c = num(r.TDD_CLSPRC);
    if (sym && c > 0) m.set(sym, c);
  }
  return m;
}

function ret(now: number, past: number | undefined): number | null {
  if (!past || past <= 0 || !now) return null;
  return (now / past - 1) * 100;
}

const OFFSETS = { r1w: 7, r1m: 30, r3m: 90, r6m: 180, r1y: 365 };

let cache: { at: number; data: unknown } | null = null;

export async function GET(req: NextRequest) {
  const key = (process.env.KRX_API_KEY || "").trim();
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  if (!key) return NextResponse.json({ items: [], error: "no_key" });

  if (!debug && cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  const now = new Date();
  const [base, w, m, m3, m6, y] = await Promise.all([
    snapshot(0, key, now),
    snapshot(OFFSETS.r1w, key, now),
    snapshot(OFFSETS.r1m, key, now),
    snapshot(OFFSETS.r3m, key, now),
    snapshot(OFFSETS.r6m, key, now),
    snapshot(OFFSETS.r1y, key, now),
  ]);

  if (debug) {
    return NextResponse.json({
      snapshots: {
        base: { basDd: base.basDd, n: base.rows.length },
        r1w: { basDd: w.basDd, n: w.rows.length },
        r1m: { basDd: m.basDd, n: m.rows.length },
        r3m: { basDd: m3.basDd, n: m3.rows.length },
        r6m: { basDd: m6.basDd, n: m6.rows.length },
        r1y: { basDd: y.basDd, n: y.rows.length },
      },
    });
  }

  const mW = closeMap(w.rows);
  const mM = closeMap(m.rows);
  const mM3 = closeMap(m3.rows);
  const mM6 = closeMap(m6.rows);
  const mY = closeMap(y.rows);

  const items = base.rows
    .map((r) => {
      const symbol = toShort(String(r.ISU_CD || ""));
      const price = num(r.TDD_CLSPRC);
      return {
        symbol,
        name: String(r.ISU_NM || "").trim(),
        price,
        changePercent: num(r.FLUC_RT),
        tradeAmount: num(r.ACC_TRDVAL),
        r1w: ret(price, mW.get(symbol)),
        r1m: ret(price, mM.get(symbol)),
        r3m: ret(price, mM3.get(symbol)),
        r6m: ret(price, mM6.get(symbol)),
        r1y: ret(price, mY.get(symbol)),
      };
    })
    .filter((x) => x.symbol && x.price > 0)
    .sort((a, b) => b.tradeAmount - a.tradeAmount)
    .slice(0, 100);

  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```

---

## 📄 파일 2 — `app/api/krx/etn-performance/route.ts` (80 → 100)

**찾기:**
```ts
    .sort((a, b) => b.tradeAmount - a.tradeAmount)
    .slice(0, 80);
```
**바꾸기:**
```ts
    .sort((a, b) => b.tradeAmount - a.tradeAmount)
    .slice(0, 100);
```

---

## 📄 파일 3 — `app/api/yahoo/reit-performance/route.ts` (리츠 9개 추가, 전부 Yahoo 검증됨)

**찾기:**
```ts
  { sym: "348950", name: "제이알글로벌리츠" },
];
```
**바꾸기:**
```ts
  { sym: "348950", name: "제이알글로벌리츠" },
  { sym: "088260", name: "이리츠코크렙" },
  { sym: "140910", name: "에이리츠" },
  { sym: "145270", name: "케이탑리츠" },
  { sym: "334890", name: "이지스밸류리츠" },
  { sym: "350520", name: "이지스레지던스리츠" },
  { sym: "396690", name: "미래에셋글로벌리츠" },
  { sym: "338100", name: "NH프라임리츠" },
  { sym: "357430", name: "마스턴프리미어리츠" },
  { sym: "417310", name: "코람코더원리츠" },
];
```

---

## 📄 파일 4 — `components/home-v6/HomePerfRanking.tsx` (limit prop 추가, 기본 100)

### (4-A) 시그니처에 limit 추가
**찾기:**
```tsx
export default function HomePerfRanking({ apiPath, emptyLabel, noChart = false }: { apiPath: string; emptyLabel: string; noChart?: boolean }) {
```
**바꾸기:**
```tsx
export default function HomePerfRanking({ apiPath, emptyLabel, noChart = false, limit = 100 }: { apiPath: string; emptyLabel: string; noChart?: boolean; limit?: number }) {
```

### (4-B) slice 20 → limit
**찾기:**
```tsx
      .sort((a, b) => (b[field] as number) - (a[field] as number))
      .slice(0, 20);
  }, [allRows, field]);
```
**바꾸기:**
```tsx
      .sort((a, b) => (b[field] as number) - (a[field] as number))
      .slice(0, limit);
  }, [allRows, field, limit]);
```

---

## 📄 파일 5 — `components/home-v6/HomeRankingTabs.tsx` (ETF 탭을 HomePerfRanking으로 통일)

### (5-A) HomeEtfRanking import 제거
**찾기:**
```tsx
import HomeEtfRanking from "./HomeEtfRanking";
import HomePerfRanking from "./HomePerfRanking";
```
**바꾸기:**
```tsx
import HomePerfRanking from "./HomePerfRanking";
```

### (5-B) ETF 탭 교체
**찾기:**
```tsx
      {tab === "etf" && <HomeEtfRanking fixedAsset="etf" />}
```
**바꾸기:**
```tsx
      {tab === "etf" && <HomePerfRanking apiPath="/api/krx/etf-performance" emptyLabel="ETF" />}
```
> `components/home-v6/HomeEtfRanking.tsx` 파일은 이제 미사용(고아) — 삭제하지 말고 그대로 둔다(빌드 영향 없음, 추후 정리).

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333) 눈 확인:
1. **ETF 탭** → 약 **100개** 표시(거래대금 순), 기간칩(1일~1년) 전부 동작. ETF 미리보기 차트 정상.
2. **ETN 탭** → 약 **100개** 표시, 미리보기는 차트 없이 종목 토론만(STEP 275 유지).
3. **리츠 탭** → **~23개**(기존 14 + 추가 9) 표시, 차트 정상.
4. 첫 로딩이 약간 느릴 수 있음(KRX 6개 스냅샷, 30분 캐시) — 2회차부터 빠름.

> 빠른 API 확인(선택): `curl -s 'http://localhost:3333/api/krx/etf-performance' | head -c 300` → items 100개 JSON.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat: 상품 목록 거래대금 순 100개 확장 — ETF 전용 KRX 라우트 신설+ETF탭 통일, ETN 100, 리츠 9종 추가 (STEP 276)" && git push
```

---

> **한 줄 요약**: KRX `etf_bydd_trd` 기반 ETF 전용 라우트를 새로 만들어 ETF 탭을 HomePerfRanking으로 통일(거래대금 순 100), ETN 100, 리츠 23종으로 확장.
