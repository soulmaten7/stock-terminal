// F-Score 다년 백테스트 — SEC EDGAR(深재무) + 야후(深가격). 실제 엔진 lib/fscore 재사용.
// point-in-time: fy=Y 재무로 F-Score → 다음해 6월말 진입 → 1년 보유 수익률. 고(7~9)/중(4~6)/저(0~3) 비교.
// npx tsx scripts/backtest_edgar.ts
import YahooFinance from "yahoo-finance2";
import { computeFScore } from "../lib/fscore";
import { edgarRows } from "../lib/edgar";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// 대표 US ~75(대형+중형+가치·경기민감 섞음). 생존편향 있음 — 방향성 참고용.
const UNIVERSE = [
  "AAPL","MSFT","NVDA","GOOGL","META","AMZN","AVGO","ORCL","CSCO","INTC","AMD","QCOM","TXN","MU","IBM","HPQ",
  "JPM","BAC","WFC","GS","C","AXP",
  "JNJ","PFE","MRK","ABBV","LLY","UNH","BMY","GILD","AMGN","CVS",
  "WMT","COST","HD","LOW","TGT","NKE","SBUX","MCD","KO","PEP","PG","CL","KHC","MO",
  "CAT","DE","BA","GE","HON","MMM","UPS","FDX","LMT","RTX",
  "XOM","CVX","COP","SLB","OXY",
  "LIN","FCX","NUE","NEM","DOW",
  "DIS","NFLX","CMCSA","T","VZ",
  "GM","F","M","KSS","GPS","BBY",
];

const COHORTS = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const HOLD_DAYS = 365;

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
function priceOnOrAfter(q: { date: Date; close: number }[], t: Date): number | null {
  for (const p of q) if (p.date.getTime() >= t.getTime() && p.close > 0) return p.close;
  return null;
}

const buckets: Record<number, { high: number[]; mid: number[]; low: number[] }> = {};
for (const y of COHORTS) buckets[y] = { high: [], mid: [], low: [] };
let scored = 0, tickersOk = 0;

async function run() {
  await mapLimit(UNIVERSE, 4, async (sym) => {
    try {
      const rows = await edgarRows(sym);
      if (rows.length < 2) return;
      tickersOk++;
      const ch = await yf.chart(sym, { period1: new Date("2013-06-01"), interval: "1d" });
      const q = (ch.quotes ?? []).filter((x) => typeof x.close === "number" && (x.close as number) > 0).map((x) => ({ date: new Date(x.date), close: x.close as number }));
      for (const Y of COHORTS) {
        const cur = rows.find((r) => r.fy === Y), prev = rows.find((r) => r.fy === Y - 1);
        if (!cur || !prev) continue;
        const f = computeFScore([prev, cur]);
        if (!f.supported) continue;
        const entry = new Date(Y + 1, 5, 30); // fy=Y 보고 후(다음해 6월말) 진입 → 미래훔쳐보기 방지
        const exit = new Date(entry.getTime() + HOLD_DAYS * 864e5);
        const pE = priceOnOrAfter(q, entry), pX = priceOnOrAfter(q, exit);
        if (pE == null || pX == null) continue;
        const ret = (pX / pE - 1) * 100;
        const g = f.score >= 7 ? "high" : f.score <= 3 ? "low" : "mid";
        buckets[Y][g].push(ret);
        scored++;
      }
    } catch { /* skip */ }
  });

  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const fmt = (v: number | null) => (v == null ? "n/a" : (v >= 0 ? "+" : "") + v.toFixed(1) + "%");
  const diff = (a: number | null, b: number | null) => (a == null || b == null ? null : a - b);
  let H: number[] = [], M: number[] = [], L: number[] = [];
  console.log(`\n종목 ${tickersOk}/${UNIVERSE.length} · 관측 ${scored}건`);
  console.log("cohort | high(n) | mid(n) | low(n) | spread(high-low)");
  for (const y of COHORTS) {
    const b = buckets[y]; H = H.concat(b.high); M = M.concat(b.mid); L = L.concat(b.low);
    console.log(`${y} | ${fmt(avg(b.high))} (${b.high.length}) | ${fmt(avg(b.mid))} (${b.mid.length}) | ${fmt(avg(b.low))} (${b.low.length}) | ${fmt(diff(avg(b.high), avg(b.low)))}`);
  }
  console.log(`\nPOOLED | high ${fmt(avg(H))} (${H.length}) | mid ${fmt(avg(M))} (${M.length}) | low ${fmt(avg(L))} (${L.length}) | spread(high-low) ${fmt(diff(avg(H), avg(L)))}`);
  console.log("※ 생존편향·표본~75·대형주편중·과거≠미래. 방향성 참고용.");
}
run();
