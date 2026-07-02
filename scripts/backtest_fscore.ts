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

(async () => {
await mapLimit(UNIVERSE, 8, async (sym) => {
  try {
    const fts = await yf.fundamentalsTimeSeries(sym, { period1: new Date("2016-01-01"), period2: new Date(), type: "annual", module: "all" });
    type R = FRow & { y: number };
    const rows: R[] = (Array.isArray(fts) ? (fts as unknown[]) : []).map((r) => {
      const rec = r as Record<string, unknown>;
      const d = rec.date instanceof Date ? rec.date : new Date(String(rec.date));
      return {
        date: rec.date, y: d.getFullYear(),
        totalRevenue: (rec.totalRevenue as number) ?? null, grossProfit: (rec.grossProfit as number) ?? null, costOfRevenue: (rec.costOfRevenue as number) ?? null,
        netIncome: (rec.netIncome as number) ?? null, totalAssets: (rec.totalAssets as number) ?? null, currentAssets: (rec.currentAssets as number) ?? null,
        currentLiabilities: (rec.currentLiabilities as number) ?? null, longTermDebt: (rec.longTermDebt as number) ?? null,
        operatingCashFlow: (rec.operatingCashFlow as number) ?? null, ordinarySharesNumber: (rec.ordinarySharesNumber as number) ?? null,
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
})();
