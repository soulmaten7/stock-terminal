<!-- 2026-06-15 -->
# STEP 262 — ETN 기간 수익률 API (`/api/krx/etn-performance`, KRX 다중 날짜)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_262_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (ETN도 기간 수익률로 — 1단계: 데이터)
ETN을 다른 탭처럼 1일~1년으로 보여주기 위해, **KRX `etn_bydd_trd`를 여러 날짜로 조회**해 같은 ETN의 과거 종가를 비교 → 기간 수익률 계산.
- 오늘·1주 전(7일)·1개월(30)·3개월(90)·6개월(180)·1년(365) 스냅샷 → 종목코드(ISU_CD) 매칭 → `r1w·r1m·r3m·r6m·r1y`.
- 응답 = `{items:[{symbol,name,price,changePercent,tradeAmount,r1w,r1m,r3m,r6m,r1y}]}` (거래대금 상위 80). → `HomePerfRanking`(리츠와 동일 컴포넌트)에 바로 호환.
- `?debug=1` → 각 스냅샷의 기준일·행수 → Cowork가 **1년 전 데이터까지 오는지** 확인.
- UI 변경 없음(route만). 다음 STEP에서 ETN 탭 전환.

## 전제 상태
- 현재 HEAD: STEP 261 적용 후(`227dcf8`). ETN 엔드포인트 `etp/etn_bydd_trd` 정상(구독 완료).
- 변경 **1파일**: `app/api/krx/etn-performance/route.ts` (**신규**)

---

## 작업 1/1 — `app/api/krx/etn-performance/route.ts` (신규)

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EP = "http://data-dbg.krx.co.kr/svc/apis/etp/etn_bydd_trd";

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

// 목표일(daysAgo) 근처에서 데이터 있는 영업일 찾아 스냅샷 (최대 6일 역추적)
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
    .slice(0, 80);

  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```

> 6개 스냅샷 병렬 조회 → 종목코드 매칭 → 기간 수익률. 1일은 KRX `FLUC_RT`(정확한 일등락) 사용. 거래대금 상위 80만(유동성). 30분 캐시. `?debug=1`은 캐시 무시하고 각 스냅샷 기준일·행수 노출.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/krx/etn-performance/route.ts && git commit -m "feat(v7): ETN 기간 수익률 API /api/krx/etn-performance (KRX 다중 날짜 종가 비교) (STEP 262)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작**
- [ ] 그럼 Cowork가 MCP로 `/api/krx/etn-performance?debug=1` 찔러서 **각 기간(특히 1년 전) 데이터 오는지 확인** → 되면 다음 STEP에서 ETN 탭을 기간칩 방식으로 전환

## 주의·예상 이슈
- KRX가 1년 전 ETN 데이터를 안 주면 `r1y`가 대부분 null → 그 기간칩만 '—'(다른 기간은 정상). debug로 먼저 확인.
- 첫 호출은 6개 스냅샷 조회로 수 초 걸릴 수 있음(이후 30분 캐시).
- **문서 TODO**(다음 갱신): STEP 262.

---
> STEP 262 = ETN 기간 수익률 API. 전제 STEP 261(`227dcf8`).
> 다음(263): ETN 탭을 HomePerfRanking(기간칩)로 전환 + /market ETN도 전 기간 합류.
