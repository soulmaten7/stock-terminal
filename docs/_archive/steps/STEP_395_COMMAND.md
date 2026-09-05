<!-- 2026-06-25 -->
# STEP 395 — 종목·상품 1주~1년 "—" 박멸 (KRX 전종목 장기수익률)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_395_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
종목·상품 표의 **1주·1개월·3개월·6개월·1년 수익률**이 지금은 야후를 종목당 1회 호출하는 구조라 **코드에 박힌 46종목만** 값이 있고 나머지 ~2,550종목은 "—". → 메인 표가 이미 쓰는 **KRX 공식 OpenAPI `bydd_trd`(일별매매정보)는 날짜만 바꾸면 전종목 시세를 줌**. 기준일 6개(현재+1주/1개월/3개월/6개월/1년 전)를 불러 **전 종목 1주~1년 100% 계산** → "—" 소멸, 야후 의존 제거.

## 전제
- STEP 394(`e6afa23`) + 문서 커밋 이후 최신 main. 빌드 ✓ 상태.
- `.env.local`에 `KRX_API_KEY` 존재(메인 표 현재가가 이걸로 나오는 중 = 키 유효).

---

## 1단계 — 새 라우트 파일 생성
**새 파일**: `app/api/krx/kr-performance/route.ts` — 아래 내용 **그대로** 작성:

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 전종목 장기수익률(1주~1년) — KRX 공식 OpenAPI 일별매매정보(bydd_trd)를
// 기준일 6개(현재 + 1주/1개월/3개월/6개월/1년 전)로 불러 전 종목 수익률 계산.
// 야후 kr-performance(46종목 한정) 대체 → 전 종목 100% 커버.
// 출력 shape = 야후 kr-performance와 동일: { items: [{ symbol, r1w, r1m, r3m, r6m, r1y }] }
const BASE = "http://data-dbg.krx.co.kr/svc/apis/sto";
const EP = { kospi: `${BASE}/stk_bydd_trd`, kosdaq: `${BASE}/ksq_bydd_trd` };

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

// target 이하 가장 가까운 거래일의 전종목 종가맵(symbol → close)
async function closesForDate(target: Date, key: string): Promise<Map<string, number>> {
  for (let i = 0; i < 12; i++) {
    const d = new Date(target);
    d.setDate(target.getDate() - i);
    const basDd = ymd(d);
    const [a, b] = await Promise.all([
      fetchOne(EP.kospi, basDd, key),
      fetchOne(EP.kosdaq, basDd, key),
    ]);
    const rows = [...a, ...b];
    if (rows.length > 0) {
      const map = new Map<string, number>();
      for (const r of rows) {
        const sym = toShort(String(r.ISU_CD || ""));
        const close = num(r.TDD_CLSPRC);
        if (sym && close > 0) map.set(sym, close);
      }
      if (map.size > 0) return map;
    }
  }
  return new Map();
}

function pct(now: number, past: number | undefined): number | null {
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

// 과거 기준일 데이터는 불변 + 현재가 일 1회 갱신 → 30분 캐시면 충분
let cache: { at: number; data: unknown } | null = null;
const TTL = 30 * 60 * 1000;

export async function GET() {
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ items: [], error: "no_key" });
  if (cache && Date.now() - cache.at < TTL) return NextResponse.json(cache.data);

  const today = new Date();
  const day = 86400000;
  const base = await closesForDate(today, key);
  if (base.size === 0) return NextResponse.json({ items: [], error: "empty" });

  const [m1w, m1m, m3m, m6m, m1y] = await Promise.all([
    closesForDate(new Date(today.getTime() - 7 * day), key),
    closesForDate(new Date(today.getTime() - 30 * day), key),
    closesForDate(new Date(today.getTime() - 91 * day), key),
    closesForDate(new Date(today.getTime() - 182 * day), key),
    closesForDate(new Date(today.getTime() - 365 * day), key),
  ]);

  const items = Array.from(base.entries()).map(([symbol, close]) => ({
    symbol,
    r1w: pct(close, m1w.get(symbol)),
    r1m: pct(close, m1m.get(symbol)),
    r3m: pct(close, m3m.get(symbol)),
    r6m: pct(close, m6m.get(symbol)),
    r1y: pct(close, m1y.get(symbol)),
  }));

  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```

## 2단계 — MarketBoard 1줄 교체 (야후 → KRX)
`components/toolbox/MarketBoard.tsx` 에서 아래 한 줄만 교체:

- 찾기: `const j = await (await fetch('/api/yahoo/kr-performance')).json();`
- 바꾸기: `const j = await (await fetch('/api/krx/kr-performance')).json();`

(머지 로직·shape 동일하므로 다른 변경 불필요. 야후 라우트 파일은 **삭제하지 말고 그대로** 둘 것 — 추후 정리.)

## 3단계 — 로컬 검증 (라우트 새 파일 = 클린 재시작 필수)
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; (npm run dev >/tmp/trill_dev.log 2>&1 &) ; sleep 12
echo "=== kr-performance 응답(전종목 + 비-null 비율) ==="
curl -s "http://localhost:3333/api/krx/kr-performance" -o /tmp/krp.json
node -e '
const j=require("/tmp/krp.json");
const it=j.items||[];
const withY=it.filter(x=>x.r1y!=null).length;
const withW=it.filter(x=>x.r1w!=null).length;
console.log("총 종목:", it.length, "| 1주 값 있는 수:", withW, "| 1년 값 있는 수:", withY);
console.log("샘플:", JSON.stringify(it.find(x=>x.symbol==="005930")));
'
```
**기대**: 총 종목 ~2,000+ , 1주·1년 값 있는 수가 대부분(수천). 삼성전자(005930) 샘플에 r1w~r1y 숫자가 보이면 성공.
- ⚠️ 만약 **총 0 / error:"empty"** 또는 1년 값이 전부 null이면 → KRX 과거일 응답 문제. 그 경우 `/tmp/trill_dev.log` 와 위 출력값을 그대로 사용자(Cowork)에게 보고하고 **커밋하지 말 것**.

## 4단계 — 빌드
```bash
pkill -f "next dev" 2>/dev/null; npm run build
```
빌드 에러 없으면 다음. 에러나면 로그 보고 후 중단.

## 5단계 — 커밋 & 푸시
```bash
git add app/api/krx/kr-performance/route.ts components/toolbox/MarketBoard.tsx
git commit -m "feat(STEP 395): 종목·상품 1주~1년 전종목 커버 (KRX bydd_trd 6기준일) — 야후 46종목 한정 대체"
git push
```
푸시 후 Vercel 자동/수동 배포(`vercel --prod`).

---

## 확인 (배포 후)
- `https://onetrillion.app` 종목·상품 표에서 **중·소형주(예: 페이지 2~3)** 의 1주~1년 칸이 "—" 대신 **수익률 숫자**로 채워졌는지.
- 기간 헤더(1년 등) 클릭 정렬 시 전 종목 대상으로 정렬되는지.
- 1년 전 상장 안 된 신규주만 r1y "—"(정상).
