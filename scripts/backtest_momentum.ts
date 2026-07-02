// 12-1 모멘텀 백테스트 v2 — 신뢰도 강화(월별 롱숏 시계열·t값·샤프·확대표본). Jegadeesh-Titman.
// 방법: 매월 12-1 모멘텀으로 정렬 → 상/하위 3분위 동일가중 → **1개월 보유**(비중첩) 롱숏(상−하) 월수익 시계열
//        → 연율수익·연율변동성·**t값(유의성)**·**샤프(위험대비)**·양(+)의 달 비율. lib/momentum + lib/backtest_stats 공유.
// ⚠️ 생존편향(현존 종목만·상장폐지 미포함) 잔존 = 무료 데이터의 근본 한계. 표본 N은 확대했으나 전체 유니버스는 아님.
//    → "논문급 방법론"에 근접(유의성·위험대비까지)하되 "논문급 데이터 정합성(CRSP)"은 아님. 정직하게 표기.
// npx tsx scripts/backtest_momentum.ts
import YahooFinance from "yahoo-finance2";
import { momentum121 } from "../lib/momentum";
import { tertileLongShort, annualizedMean, annualizedVol, tStat, sharpe, mean, fracPositive } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 500; // 확대 표본(기존 250 → 500). ⚠️ 생존편향 잔존·전체 유니버스 아님. 더 키우려면 이 값만 상향.
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);

const MIN_STOCKS = 20; // 분위 형성 최소 종목/월

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
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (s) => { try { const d = await monthlyCloses(s); if (Object.keys(d).length) { data[s] = d; ok++; } } catch { /* skip */ } });

  let minM = Infinity, maxM = -Infinity;
  for (const s in data) for (const k in data[s]) { const n = Number(k); if (n < minM) minM = n; if (n > maxM) maxM = n; }

  // 매월: signal=12-1 모멘텀, ret=1개월 보유 수익률(비중첩). $5+ 유동성 필터.
  const months: { signal: number; ret: number }[][] = [];
  for (let m = minM + 12; m + 1 <= maxM; m++) {
    const obs: { signal: number; ret: number }[] = [];
    for (const s in data) {
      const M = data[s];
      const mom = momentum121(M[m - 12] ?? null, M[m - 1] ?? null);
      const pE = M[m], pX = M[m + 1];
      if (mom == null || pE == null || pX == null || pE < 5) continue;
      obs.push({ signal: mom, ret: (pX / pE - 1) * 100 });
    }
    months.push(obs);
  }

  const { ls, hi, lo, kept } = tertileLongShort(months, 1 / 3, MIN_STOCKS);

  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");

  console.log(`\n[모멘텀 v2 · 월별 롱숏(1개월 보유·동일가중·3분위)]`);
  console.log(`종목 ${ok}/${UNIVERSE.length}(표본 N=${N}) · 유효 리밸런스 ${kept}개월`);
  console.log(`상위 3분위(고모멘텀) 연율: ${pct(annualizedMean(hi))}`);
  console.log(`하위 3분위(저모멘텀) 연율: ${pct(annualizedMean(lo))}`);
  console.log(`─────────────────────────────`);
  console.log(`롱숏(상−하) 월평균: ${pct(mean(ls))}`);
  console.log(`롱숏 연율 수익 : ${pct(annualizedMean(ls))}`);
  console.log(`롱숏 연율 변동성: ${pct(annualizedVol(ls))}`);
  console.log(`▶ t값(H0:평균=0): ${num(tStat(ls))}   ← |t|>2면 5% 유의(방향성 근거 격상)`);
  console.log(`▶ 샤프(연율)    : ${num(sharpe(ls))}   ← 위험대비 수익`);
  console.log(`▶ 양(+)의 달 비율: ${pct(fracPositive(ls) * 100)} (${kept}개월 중)`);
  console.log(`\n※ 1개월 보유=비중첩(t값 정직). 생존편향 잔존(현존 종목만)·표본 N=${N}(전체 아님). 논문급 '방법론' 근접이나 CRSP급 '데이터'는 아님. French 알파·거래비용은 STEP 526.`);
}
run();
