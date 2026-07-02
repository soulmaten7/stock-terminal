// 저변동성 다년 백테스트 — 매월 유니버스를 실현변동성 3분위(저/중/고)로 → 이후 3개월 수익률 + 실현위험 비교.
// 저변동 이례현상: 저변동군이 "위험 대비"(때로 절대) 나은지. 가격만 — 야후 深가격. lib/lowvol 공유.
// npx tsx scripts/backtest_lowvol.ts
import YahooFinance from "yahoo-finance2";
import { realizedVol } from "../lib/lowvol";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

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

const HOLD_DAYS = 91; // ~3개월
const MIN_STOCKS = 15;

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
async function dailySeries(sym: string): Promise<{ t: number; c: number }[]> {
  const ch = await yf.chart(sym, { period1: new Date("2013-01-01"), interval: "1d" });
  return (ch.quotes ?? []).filter((q) => typeof q.close === "number" && (q.close as number) > 0).map((q) => ({ t: new Date(q.date).getTime(), c: q.close as number })).sort((a, b) => a.t - b.t);
}
function volAt(series: { t: number; c: number }[], endT: number): number | null {
  const upto = series.filter((p) => p.t <= endT);
  if (upto.length < 60) return null;
  return realizedVol(upto.map((p) => p.c), 252);
}
function priceAtOrAfter(series: { t: number; c: number }[], t: number): number | null {
  for (const p of series) if (p.t >= t) return p.c;
  return null;
}

async function run() {
  const data: Record<string, { t: number; c: number }[]> = {};
  await mapLimit(UNIVERSE, 6, async (s) => { try { data[s] = await dailySeries(s); } catch { data[s] = []; } });

  // 월말 리밸런스 날짜(2014~2024)
  const dates: number[] = [];
  for (let y = 2014; y <= 2024; y++) for (let m = 0; m < 12; m++) dates.push(new Date(y, m + 1, 0).getTime());

  const low = { ret: [] as number[], vol: [] as number[] }, midg = { ret: [] as number[], vol: [] as number[] }, high = { ret: [] as number[], vol: [] as number[] };
  let rebalances = 0;
  for (const D of dates) {
    const obs: { vol: number; fwd: number }[] = [];
    for (const s in data) {
      const ser = data[s]; if (!ser.length) continue;
      const v = volAt(ser, D);
      const pE = priceAtOrAfter(ser, D), pX = priceAtOrAfter(ser, D + HOLD_DAYS * 864e5);
      if (v == null || pE == null || pX == null || pE <= 0) continue;
      obs.push({ vol: v, fwd: (pX / pE - 1) * 100 });
    }
    if (obs.length < MIN_STOCKS) continue;
    rebalances++;
    obs.sort((a, b) => a.vol - b.vol); // 오름차순: 앞=저변동
    const n = obs.length, t = Math.floor(n / 3);
    for (let i = 0; i < n; i++) { const g = i < t ? low : i >= n - t ? high : midg; g.ret.push(obs[i].fwd); g.vol.push(obs[i].vol); }
  }

  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const fmt = (v: number | null) => (v == null ? "n/a" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%");
  const ann = (v: number | null) => (v == null ? "n/a" : (v >= 0 ? "+" : "") + (v * 4).toFixed(1) + "%");
  console.log(`\n리밸런스 ${rebalances}회 · 보유 ~3개월`);
  console.log(`저변동(하위 3분위): 3M ${fmt(avg(low.ret))} (연 ${ann(avg(low.ret))}) · 실현변동성 ${fmt(avg(low.vol))} · n=${low.ret.length}`);
  console.log(`중위             : 3M ${fmt(avg(midg.ret))} (연 ${ann(avg(midg.ret))}) · 실현변동성 ${fmt(avg(midg.vol))} · n=${midg.ret.length}`);
  console.log(`고변동(상위 3분위): 3M ${fmt(avg(high.ret))} (연 ${ann(avg(high.ret))}) · 실현변동성 ${fmt(avg(high.vol))} · n=${high.ret.length}`);
  const sp = avg(low.ret) != null && avg(high.ret) != null ? (avg(low.ret) as number) - (avg(high.ret) as number) : null;
  console.log(`\n저−고 수익차: 3M ${fmt(sp)} (연 ${ann(sp)}) · 저변동군 위험은 고변동군의 ${avg(low.vol) && avg(high.vol) ? ((avg(low.vol) as number) / (avg(high.vol) as number) * 100).toFixed(0) + "%" : "?"} 수준`);
  console.log("※ 월간 리밸런스(중첩)·생존편향·유니버스~75. 위험대비 관점으로 볼 것.");
}
run();
