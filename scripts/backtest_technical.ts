// 기술(RSI·이동평균) 신호 백테스트 — 야후 深가격. lib/technical 재사용(엔진=검증 일치, 플레이북 §0-3).
// 팩터(횡단면 순위)가 아니라 "상태 신호"라 3분위가 아닌 상태별 이후수익 비교:
//   ① RSI 평균회귀: 침체(<30)가 과열(>70)보다 이후수익 높은가? (mean-reversion edge = 침체−과열 > 0)
//   ② MA 추세: 200일선 위가 아래보다 이후수익 높은가? (trend edge = 위−아래 > 0)
// point-in-time: D시점까지 가격만으로 RSI·MA 계산 → 이후 1M(~30일)·3M(~91일) 수익률. $5+ 필터.
// npx tsx scripts/backtest_technical.ts
import YahooFinance from "yahoo-finance2";
import { rsi, sma } from "../lib/technical";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// 넓은 유니버스: us_symbols(주식)에서 고루 ~250 표본.
type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 250;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);

const H1 = 30, H3 = 91; // 이후 보유일(달력) ~1M·~3M

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
async function dailySeries(sym: string): Promise<{ t: number; c: number }[]> {
  const ch = await yf.chart(sym, { period1: new Date("2013-01-01"), interval: "1d" });
  return (ch.quotes ?? []).filter((q) => typeof q.close === "number" && (q.close as number) > 0).map((q) => ({ t: new Date(q.date).getTime(), c: q.close as number })).sort((a, b) => a.t - b.t);
}
function priceAtOrAfter(series: { t: number; c: number }[], t: number): number | null {
  for (const p of series) if (p.t >= t) return p.c;
  return null;
}

// 버킷: 이후 1M·3M 수익률 누적
type Bucket = { r1: number[]; r3: number[] };
const mk = (): Bucket => ({ r1: [], r3: [] });
const rsiB = { over: mk(), neutral: mk(), under: mk() }; // over=과열(>70)·under=침체(<30)
const maB = { above: mk(), below: mk() };
let tickersOk = 0, stockMonths = 0;

async function run() {
  const data: Record<string, { t: number; c: number }[]> = {};
  await mapLimit(UNIVERSE, 6, async (s) => { try { const d = await dailySeries(s); if (d.length) { data[s] = d; tickersOk++; } } catch { /* skip */ } });

  // 월말 리밸런스 날짜(2014~2024)
  const dates: number[] = [];
  for (let y = 2014; y <= 2024; y++) for (let m = 0; m < 12; m++) dates.push(new Date(y, m + 1, 0).getTime());

  for (const D of dates) {
    for (const s in data) {
      const ser = data[s];
      const upto = ser.filter((p) => p.t <= D);
      if (upto.length < 201) continue; // 200일선 + RSI 필요
      const closes = upto.map((p) => p.c);
      const last = closes[closes.length - 1];
      const pE = priceAtOrAfter(ser, D);
      if (pE == null || pE < 5) continue; // $5+ = 유동성 프록시(다른 기법과 동일 틀)
      const r = rsi(closes, 14);
      const ma200 = sma(closes, 200);
      if (r == null || ma200 == null) continue;

      const p1 = priceAtOrAfter(ser, D + H1 * 864e5), p3 = priceAtOrAfter(ser, D + H3 * 864e5);
      const f1 = p1 != null ? (p1 / pE - 1) * 100 : null;
      const f3 = p3 != null ? (p3 / pE - 1) * 100 : null;
      if (f1 == null && f3 == null) continue;
      stockMonths++;

      const rb = r > 70 ? rsiB.over : r < 30 ? rsiB.under : rsiB.neutral;
      const mb = last >= ma200 ? maB.above : maB.below;
      if (f1 != null) { rb.r1.push(f1); mb.r1.push(f1); }
      if (f3 != null) { rb.r3.push(f3); mb.r3.push(f3); }
    }
  }

  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const fmt = (v: number | null) => (v == null ? "n/a" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%");
  const diff = (a: number | null, b: number | null) => (a == null || b == null ? null : a - b);

  console.log(`\n[데이터 커버리지] 종목 ${tickersOk}/${UNIVERSE.length} · stock-month 관측 ${stockMonths}건 ($5+·200일선+RSI 계산가능만)`);

  console.log(`\n=== ① RSI 평균회귀 (이후 1M / 3M 수익률) ===`);
  console.log(`침체(<30) : 1M ${fmt(avg(rsiB.under.r1))} (n=${rsiB.under.r1.length}) · 3M ${fmt(avg(rsiB.under.r3))} (n=${rsiB.under.r3.length})`);
  console.log(`중립       : 1M ${fmt(avg(rsiB.neutral.r1))} (n=${rsiB.neutral.r1.length}) · 3M ${fmt(avg(rsiB.neutral.r3))} (n=${rsiB.neutral.r3.length})`);
  console.log(`과열(>70) : 1M ${fmt(avg(rsiB.over.r1))} (n=${rsiB.over.r1.length}) · 3M ${fmt(avg(rsiB.over.r3))} (n=${rsiB.over.r3.length})`);
  console.log(`▶ 평균회귀 엣지(침체−과열): 1M ${fmt(diff(avg(rsiB.under.r1), avg(rsiB.over.r1)))} · 3M ${fmt(diff(avg(rsiB.under.r3), avg(rsiB.over.r3)))}  (양수면 침체매수 우위)`);

  console.log(`\n=== ② 200일선 추세 (이후 1M / 3M 수익률) ===`);
  console.log(`200일선 위 : 1M ${fmt(avg(maB.above.r1))} (n=${maB.above.r1.length}) · 3M ${fmt(avg(maB.above.r3))} (n=${maB.above.r3.length})`);
  console.log(`200일선 아래: 1M ${fmt(avg(maB.below.r1))} (n=${maB.below.r1.length}) · 3M ${fmt(avg(maB.below.r3))} (n=${maB.below.r3.length})`);
  console.log(`▶ 추세 엣지(위−아래): 1M ${fmt(diff(avg(maB.above.r1), avg(maB.below.r1)))} · 3M ${fmt(diff(avg(maB.above.r3), avg(maB.below.r3)))}  (양수면 추세추종 우위)`);

  console.log("\n※ 월간 리밸런스(중첩)·생존편향·표본~250·과거≠미래. RSI는 단독 상태신호라 약할 가능성 — 결과 그대로 정직 판정.");
}
run();
