<!-- 2026-07-02 -->
# STEP 503 — F-Score 백테스트 검증 (신호가 실제로 유효했나) · F-Score "완성" 관문

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_503_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
과거 시점(point-in-time) F-Score로 종목을 **고(7~9)/중(4~6)/저(0~3)** 그룹으로 나눠 **이후 1년 수익률**을 비교. 고>저면 신호 유효. **실제 엔진(`lib/fscore`) 재사용**(구현과 검증 일치).
- 커밋 없음(검증 스크립트 + 결과). 결과를 Cowork에 공유 → 렌즈에 표시할 "신뢰도 문구" 확정.
- US ~100종목 × 5코호트(FY2019~2023), 보고지연 120일 후 진입 → 1년 보유.
- **한계 명시**: 생존편향(현존 종목)·표본 100·대형주 편중·과거≠미래. 방향성 참고용.

## 1) 백테스트 스크립트 — `scripts/backtest_fscore.ts`
```ts
import YahooFinance from "yahoo-finance2";
import { computeFScore, type FRow } from "../lib/fscore";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// 대표 US 유니버스(대형+중형 다양 섹터, ~100). 생존편향 있음 — 해석 시 감안.
const UNIVERSE = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","AVGO","ORCL","CRM","ADBE","AMD","INTC","CSCO","QCOM","TXN","IBM","MU","AMAT","LRCX",
  "JPM","BAC","WFC","GS","MS","C","AXP","BLK","SCHW","V","MA","PYPL",
  "UNH","JNJ","LLY","PFE","MRK","ABBV","TMO","ABT","DHR","BMY","AMGN","GILD","CVS","MDT",
  "WMT","COST","HD","LOW","TGT","NKE","SBUX","MCD","KO","PEP","PG","CL","KMB","MDLZ","MO","PM",
  "XOM","CVX","COP","SLB","EOG","PSX","MPC","OXY",
  "CAT","DE","BA","GE","HON","MMM","UPS","FDX","LMT","RTX","EMR","ETN",
  "DIS","NFLX","CMCSA","T","VZ","TMUS",
  "GM","F","LULU","TJX","BKNG","MAR","EBAY","ROST","DG","DLTR",
  "LIN","SHW","FCX","NUE","NEM","DOW",
  "SPGI","INTU","NOW","UBER","SNAP","PINS","SQ","SHOP","ZM","DOCU","ROKU","DDOG","NET","CRWD","PLTR",
];

const COHORTS = [2019, 2020, 2021, 2022, 2023];
const LAG_DAYS = 120, HOLD_DAYS = 365;

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}

function priceOnOrAfter(q: { date: Date; close: number }[], target: Date): number | null {
  for (const p of q) if (p.date.getTime() >= target.getTime() && p.close > 0) return p.close;
  return null;
}

const buckets: Record<number, { high: number[]; mid: number[]; low: number[] }> = {};
for (const y of COHORTS) buckets[y] = { high: [], mid: [], low: [] };

await mapLimit(UNIVERSE, 8, async (sym) => {
  try {
    const fts = await yf.fundamentalsTimeSeries(sym, { period1: new Date("2016-01-01"), period2: new Date(), type: "annual", module: "all" });
    type R = FRow & { y: number };
    const rows: R[] = (Array.isArray(fts) ? fts : []).map((r: Record<string, unknown>) => {
      const d = r.date instanceof Date ? r.date : new Date(String(r.date));
      return {
        date: r.date, y: d.getFullYear(),
        totalRevenue: (r.totalRevenue as number) ?? null, grossProfit: (r.grossProfit as number) ?? null, costOfRevenue: (r.costOfRevenue as number) ?? null,
        netIncome: (r.netIncome as number) ?? null, totalAssets: (r.totalAssets as number) ?? null, currentAssets: (r.currentAssets as number) ?? null,
        currentLiabilities: (r.currentLiabilities as number) ?? null, longTermDebt: (r.longTermDebt as number) ?? null,
        operatingCashFlow: (r.operatingCashFlow as number) ?? null, ordinarySharesNumber: (r.ordinarySharesNumber as number) ?? null,
      };
    });
    const ch = await yf.chart(sym, { period1: new Date("2018-06-01"), interval: "1d" });
    const q = (ch.quotes ?? []).filter((x) => typeof x.close === "number" && (x.close as number) > 0).map((x) => ({ date: new Date(x.date), close: x.close as number }));
    for (const y of COHORTS) {
      const cur = rows.find((r) => r.y === y), prev = rows.find((r) => r.y === y - 1);
      if (!cur || !prev) continue;
      const f = computeFScore([prev, cur]);
      if (!f.supported) continue;
      const fyEnd = cur.date instanceof Date ? cur.date : new Date(String(cur.date));
      const entry = new Date(fyEnd.getTime() + LAG_DAYS * 864e5);
      const exit = new Date(entry.getTime() + HOLD_DAYS * 864e5);
      const pE = priceOnOrAfter(q, entry), pX = priceOnOrAfter(q, exit);
      if (pE == null || pX == null) continue;
      const ret = (pX / pE - 1) * 100;
      const g = f.score >= 7 ? "high" : f.score <= 3 ? "low" : "mid";
      buckets[y][g].push(ret);
    }
  } catch { /* skip */ }
});

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const fmt = (v: number | null) => (v == null ? "n/a" : (v >= 0 ? "+" : "") + v.toFixed(1) + "%");
const diff = (a: number | null, b: number | null) => (a == null || b == null ? null : a - b);
let H: number[] = [], M: number[] = [], L: number[] = [];
console.log("\ncohort | high(n) | mid(n) | low(n) | spread(high-low)");
for (const y of COHORTS) {
  const b = buckets[y]; H = H.concat(b.high); M = M.concat(b.mid); L = L.concat(b.low);
  console.log(`${y} | ${fmt(avg(b.high))} (${b.high.length}) | ${fmt(avg(b.mid))} (${b.mid.length}) | ${fmt(avg(b.low))} (${b.low.length}) | ${fmt(diff(avg(b.high), avg(b.low)))}`);
}
console.log(`\nPOOLED | high ${fmt(avg(H))} (${H.length}) | mid ${fmt(avg(M))} (${M.length}) | low ${fmt(avg(L))} (${L.length}) | spread ${fmt(diff(avg(H), avg(L)))}`);
console.log("\n※ 생존편향·표본~100·대형주편중·과거≠미래. 방향성 참고용.");
```

## 2) 실행 (수 분 — 종목당 재무+가격 fetch)
```bash
cd ~/stock-terminal
npx tsx scripts/backtest_fscore.ts
```
> `node`로 안 되면(TS import) 반드시 `npx tsx`. 에러 시 전문 보고.

## 3) 결과 공유 (Cowork에)
- [ ] cohort별 + POOLED 표 전체(특히 **POOLED spread(high−low)**).
- [ ] high 그룹 표본 수(n)가 너무 작지 않은지(0이면 임계값·데이터 확인).
- [ ] 판정: **spread가 +면 신호 유효(방향성)** / 0 근처거나 −면 "이 표본에선 약함" — 어느 쪽이든 그대로.

## ⚠️ 다음
- 결과에 따라 렌즈 페이지 F-Score 카드에 **신뢰도 한 줄** 추가(예: "과거 이 표본 기준 고득점군이 저득점군 대비 연 +X%p — 참고용, 예측 아님"). 정직한 문구.
- 그 후: F-Score를 KR 정식화(DART) 하거나, **다음 기법 1개**로 이동(같은 5단계 반복).
- 이걸로 "기법 1개 완벽 시스템화(정의→데이터→엣지→검증→표현)" 첫 사이클 완료.
