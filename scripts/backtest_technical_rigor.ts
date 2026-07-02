// 기술(RSI·MA) 신뢰도 백테스트 — 월별 롱숏 t·샤프·FF 알파. lib/technical + lib/backtest_stats.
// 두 신호 각각: ① RSI 평균회귀 = 저RSI(침체) LONG − 고RSI(과열) SHORT 3분위(침체 매수가 통하나) ② 200일선 = 위 LONG − 아래 SHORT.
// point-in-time: 월말까지 일봉으로 RSI(14)·SMA(200) → 1개월 보유 월수익. $5+. French 재사용.
// 예상: RSI 평균회귀 무의미/음(과열이 오히려 우위=모멘텀), 200일선 약한 +(모멘텀의 사촌·Mom에 흡수). ⚠️ 생존편향 잔존.
// npx tsx scripts/backtest_technical_rigor.ts
import fs from "node:fs";
import path from "node:path";
import YahooFinance from "yahoo-finance2";
import { rsi, sma } from "../lib/technical";
import { mean, tStat, sharpe, annualizedMean, annualizedVol, fracPositive, ols } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 500;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);
const MIN_STOCKS = 20;

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0; async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const endOfMonth = (m: number) => new Date(Math.floor(m / 12), (m % 12) + 1, 0).getTime();
async function daily(sym: string): Promise<{ t: number; c: number }[]> {
  const ch = await yf.chart(sym, { period1: new Date("2013-01-01"), interval: "1d" });
  return (ch.quotes ?? []).filter((q) => typeof q.close === "number" && (q.close as number) > 0).map((q) => ({ t: new Date(q.date).getTime(), c: q.close as number })).sort((a, b) => a.t - b.t);
}
function loadFrench(): Record<number, { mktrf: number; smb: number; hml: number; rf: number }> | null {
  const dir = path.join(process.cwd(), "data", "ff"); if (!fs.existsSync(dir)) return null;
  const facF = fs.readdirSync(dir).find((f) => /factors/i.test(f) && /\.csv$/i.test(f)); if (!facF) return null;
  const out: Record<number, { mktrf: number; smb: number; hml: number; rf: number }> = {};
  for (const line of fs.readFileSync(path.join(dir, facF), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(\d{6})\s*,(.+)$/); if (!m) continue;
    const ym = Number(m[1]); const yr = Math.floor(ym / 100), mo = ym % 100; if (mo < 1 || mo > 12) continue;
    const v = m[2].split(",").map((x) => parseFloat(x.trim())); if (v.length < 4 || v.some((x) => !isFinite(x))) continue;
    out[yr * 12 + (mo - 1)] = { mktrf: v[0], smb: v[1], hml: v[2], rf: v[3] };
  }
  return Object.keys(out).length ? out : null;
}

async function run() {
  const series: Record<string, { t: number; c: number }[]> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (s) => { try { const d = await daily(s); if (d.length > 260) { series[s] = d; ok++; } } catch { /* skip */ } });

  // 심볼별 월말 종가 + 월말 RSI(14)·SMA(200)·last
  const mc: Record<string, Record<number, number>> = {};
  const ind: Record<string, Record<number, { rsi: number; above: boolean }>> = {};
  let minM = Infinity, maxM = -Infinity;
  for (const s in series) {
    const d = series[s]; mc[s] = {}; ind[s] = {};
    for (const p of d) { const k = monthKey(new Date(p.t)); mc[s][k] = p.c; if (k < minM) minM = k; if (k > maxM) maxM = k; }
    const months = Object.keys(mc[s]).map(Number).sort((a, b) => a - b);
    let j = 0; const closes: number[] = [];
    for (const m of months) {
      const cut = endOfMonth(m);
      while (j < d.length && d[j].t <= cut) { closes.push(d[j].c); j++; }
      const r = rsi(closes, 14), ma = sma(closes, 200); const last = closes[closes.length - 1];
      if (r != null && ma != null && last != null) ind[s][m] = { rsi: r, above: last >= ma };
    }
  }

  const legRet = (syms: string[], h: number): number | null => {
    const rr: number[] = []; for (const s of syms) { const a = mc[s]?.[h - 1], b = mc[s]?.[h]; if (a != null && b != null && a > 0) rr.push((b / a - 1) * 100); } return rr.length ? mean(rr) : null;
  };

  const rsiLS: Record<number, number> = {}, maLS: Record<number, number> = {};
  const rsiTurn: number[] = []; let prevOversold: Set<string> | null = null;
  for (let m = minM; m + 1 <= maxM; m++) {
    const obs: { sym: string; rsi: number; above: boolean }[] = [];
    for (const s in series) { const it = ind[s]?.[m]; const pE = mc[s]?.[m]; if (!it || pE == null || pE < 5) continue; obs.push({ sym: s, rsi: it.rsi, above: it.above }); }
    if (obs.length < MIN_STOCKS) continue;
    // ① RSI 3분위: 저RSI(침체) LONG − 고RSI(과열) SHORT
    const byR = obs.slice().sort((a, b) => a.rsi - b.rsi); const t = Math.floor(byR.length / 3);
    const oversold = byR.slice(0, t).map((o) => o.sym);        // 저RSI=침체(LONG·평균회귀 가정)
    const overbought = byR.slice(byR.length - t).map((o) => o.sym); // 고RSI=과열(SHORT)
    if (prevOversold) rsiTurn.push(oversold.filter((s) => !prevOversold!.has(s)).length / oversold.length);
    prevOversold = new Set(oversold);
    // ② 200일선: 위 − 아래
    const above = obs.filter((o) => o.above).map((o) => o.sym), below = obs.filter((o) => !o.above).map((o) => o.sym);
    const h = m + 1;
    const lo = legRet(oversold, h), ho = legRet(overbought, h); if (lo != null && ho != null) rsiLS[h] = lo - ho;
    if (above.length >= MIN_STOCKS && below.length >= MIN_STOCKS) { const av = legRet(above, h), bl = legRet(below, h); if (av != null && bl != null) maLS[h] = av - bl; }
  }

  const ff = loadFrench();
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");
  const report = (label: string, store: Record<number, number>, extra?: string) => {
    const keys = Object.keys(store).map(Number).sort((a, b) => a - b); const ls = keys.map((k) => store[k]);
    console.log(`\n=== ${label} · 월별 롱숏 ${ls.length}개월 ===`);
    console.log(`연율 ${pct(annualizedMean(ls))} · 변동성 ${pct(annualizedVol(ls))} · t=${num(tStat(ls))} · 샤프 ${num(sharpe(ls))} · 양의 달 ${pct(fracPositive(ls) * 100)}${extra ? " · " + extra : ""}`);
    if (ff) { const y: number[] = [], mk: number[] = [], sm: number[] = [], hm: number[] = []; for (const k of keys) { const f = ff[k]; if (!f) continue; y.push(store[k]); mk.push(f.mktrf); sm.push(f.smb); hm.push(f.hml); } const capm = ols(y, [mk]); const ff3 = ols(y, [mk, sm, hm]); console.log(`CAPM 알파 ${pct(capm.coef[0] * 12)}·t=${num(capm.t[0])} | FF3 알파 ${pct(ff3.coef[0] * 12)}·t=${num(ff3.t[0])}`); }
  };

  console.log(`\n[기술 신뢰도 · 종목 ${ok}/${UNIVERSE.length}]`);
  report("① RSI 평균회귀(저RSI−고RSI)", rsiLS, `월 회전율 ${pct(mean(rsiTurn) * 100)}(높으면 비용 큼)`);
  console.log(`   ← 양(+)·유의면 침체매수 통함 / 음·무의미면 평균회귀 미작동(과열=모멘텀 우위)`);
  report("② 200일선 추세(위−아래)", maLS);
  console.log(`   ← 약한 +이나 Mom에 흡수될 것(모멘텀의 사촌)`);
  console.log(`\n※ 생존편향·동일가중 잔존. RSI는 회전율 높아 비용에 약함. 기술=상태 표시(참고용) 재확인 목적.`);
}
run();
