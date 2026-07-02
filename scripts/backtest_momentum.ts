// 12-1 모멘텀 다년 백테스트 (Jegadeesh-Titman 횡단면). 가격만 — 야후 深가격.
// 매월 유니버스를 12-1 모멘텀으로 3분위(상/중/하) → 이후 3개월 수익률 비교. lib/momentum 공유.
// npx tsx scripts/backtest_momentum.ts
import YahooFinance from "yahoo-finance2";
import { momentum121 } from "../lib/momentum";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// F-Score 백테스트와 동일 유니버스(비교 위해). 생존편향 있음 — 방향성 참고용.
// 넓은 유니버스: us_symbols(주식)에서 고루 ~250 표본(가격만이라 EDGAR보다 넉넉히).
type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 250;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);

const HOLD_MONTHS = 3;
const MIN_STOCKS = 15; // 분위 형성 최소 종목

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

async function monthlyCloses(sym: string): Promise<Record<number, number>> {
  const ch = await yf.chart(sym, { period1: new Date("2013-01-01"), interval: "1d" });
  const last: Record<number, { t: number; c: number }> = {};
  for (const q of ch.quotes ?? []) {
    if (typeof q.close !== "number" || (q.close as number) <= 0) continue;
    const d = new Date(q.date); const k = monthKey(d); const t = d.getTime();
    if (!last[k] || t > last[k].t) last[k] = { t, c: q.close as number }; // 그 달 마지막 종가
  }
  const out: Record<number, number> = {};
  for (const k in last) out[Number(k)] = last[Number(k)].c;
  return out;
}

async function run() {
  const data: Record<string, Record<number, number>> = {};
  await mapLimit(UNIVERSE, 6, async (s) => { try { data[s] = await monthlyCloses(s); } catch { data[s] = {}; } });

  let minM = Infinity, maxM = -Infinity;
  for (const s in data) for (const k in data[s]) { const n = Number(k); if (n < minM) minM = n; if (n > maxM) maxM = n; }

  const top: number[] = [], mid: number[] = [], bot: number[] = [];
  let rebalances = 0;
  for (let m = minM + 12; m + HOLD_MONTHS <= maxM; m++) {
    const obs: { mom: number; fwd: number }[] = [];
    for (const s in data) {
      const M = data[s];
      const mom = momentum121(M[m - 12] ?? null, M[m - 1] ?? null);
      const pE = M[m], pX = M[m + HOLD_MONTHS];
      if (mom == null || pE == null || pX == null || pE <= 0) continue;
      obs.push({ mom, fwd: (pX / pE - 1) * 100 });
    }
    if (obs.length < MIN_STOCKS) continue;
    rebalances++;
    obs.sort((a, b) => a.mom - b.mom); // 오름차순: 앞=저모멘텀
    const n = obs.length, t = Math.floor(n / 3);
    for (let i = 0; i < n; i++) { const f = obs[i].fwd; if (i < t) bot.push(f); else if (i >= n - t) top.push(f); else mid.push(f); }
  }

  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const fmt = (v: number | null) => (v == null ? "n/a" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%");
  const ann = (v: number | null) => (v == null ? "n/a" : (v >= 0 ? "+" : "") + (v * (12 / HOLD_MONTHS)).toFixed(1) + "%");
  const sp = avg(top) != null && avg(bot) != null ? (avg(top) as number) - (avg(bot) as number) : null;
  console.log(`\n종목 ${Object.values(data).filter((d) => Object.keys(d).length).length}/${UNIVERSE.length} · 리밸런스 ${rebalances}회 · 보유 ${HOLD_MONTHS}개월`);
  console.log(`상위 3분위(고모멘텀): ${HOLD_MONTHS}개월 ${fmt(avg(top))} (연율 ${ann(avg(top))}) · n=${top.length}`);
  console.log(`중위 3분위          : ${HOLD_MONTHS}개월 ${fmt(avg(mid))} (연율 ${ann(avg(mid))}) · n=${mid.length}`);
  console.log(`하위 3분위(저모멘텀): ${HOLD_MONTHS}개월 ${fmt(avg(bot))} (연율 ${ann(avg(bot))}) · n=${bot.length}`);
  console.log(`\n모멘텀 프리미엄 (상−하): ${HOLD_MONTHS}개월 ${fmt(sp)} (연율 ${ann(sp)})`);
  console.log("※ 월간 리밸런스(중첩 보유)·생존편향·유니버스~75. 방향성 참고용.");
}
run();
