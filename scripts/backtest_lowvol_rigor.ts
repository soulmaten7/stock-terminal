// 저변동성 신뢰도 백테스트 — 월별 롱숏(저변동 매수·고변동 매도 = BAB) t·샤프·거래비용·FF 알파. lib/lowvol + lib/backtest_stats 공유.
// ⚠️ 방향 주의: 모멘텀과 반대 — "저변동이 위험 대비/때로 절대 우위"(이례현상). L-S = 저변동 leg − 고변동 leg.
// 리스크 스토리도 함께: 저변동 leg의 실현변동성이 고변동 leg보다 훨씬 낮은지(방어 자산 성격).
// French CSV는 data/ff/ (STEP 526에서 받음) 재사용. ⚠️ 생존편향·동일가중 잔존 → 수준 과대(방향·위험대비만 신뢰).
// npx tsx scripts/backtest_lowvol_rigor.ts
import fs from "node:fs";
import path from "node:path";
import YahooFinance from "yahoo-finance2";
import { realizedVol } from "../lib/lowvol";
import { mean, tStat, sharpe, annualizedMean, annualizedVol, fracPositive, ols } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 500;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);
const MIN_STOCKS = 20;
const COST_BPS = [10, 30];

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const endOfMonth = (m: number) => new Date(Math.floor(m / 12), (m % 12) + 1, 0).getTime();

async function daily(sym: string): Promise<{ t: number; c: number }[]> {
  const ch = await yf.chart(sym, { period1: new Date("2013-01-01"), interval: "1d" });
  return (ch.quotes ?? []).filter((q) => typeof q.close === "number" && (q.close as number) > 0).map((q) => ({ t: new Date(q.date).getTime(), c: q.close as number })).sort((a, b) => a.t - b.t);
}

function loadFrench(): Record<number, { mktrf: number; smb: number; hml: number; rf: number; mom?: number }> | null {
  const dir = path.join(process.cwd(), "data", "ff");
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const facF = files.find((f) => /factors/i.test(f) && /\.csv$/i.test(f));
  const momF = files.find((f) => /momentum/i.test(f) && /\.csv$/i.test(f));
  if (!facF) return null;
  const out: Record<number, { mktrf: number; smb: number; hml: number; rf: number; mom?: number }> = {};
  for (const line of fs.readFileSync(path.join(dir, facF), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(\d{6})\s*,(.+)$/); if (!m) continue;
    const ym = Number(m[1]); const yr = Math.floor(ym / 100), mo = ym % 100; if (mo < 1 || mo > 12) continue;
    const v = m[2].split(",").map((x) => parseFloat(x.trim()));
    if (v.length < 4 || v.some((x) => !isFinite(x))) continue;
    out[yr * 12 + (mo - 1)] = { mktrf: v[0], smb: v[1], hml: v[2], rf: v[3] };
  }
  if (momF) for (const line of fs.readFileSync(path.join(dir, momF), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(\d{6})\s*,\s*(-?\d+\.?\d*)\s*$/); if (!m) continue;
    const ym = Number(m[1]); const key = Math.floor(ym / 100) * 12 + ((ym % 100) - 1);
    if (out[key]) out[key].mom = parseFloat(m[2]);
  }
  return Object.keys(out).length ? out : null;
}

async function run() {
  const series: Record<string, { t: number; c: number }[]> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (s) => { try { const d = await daily(s); if (d.length > 260) { series[s] = d; ok++; } } catch { /* skip */ } });

  // 심볼별 월말 종가 + 월말까지의 실현변동성(포인터로 O(일봉))
  const monthlyClose: Record<string, Record<number, number>> = {};
  const volAtMonth: Record<string, Record<number, number>> = {};
  let minM = Infinity, maxM = -Infinity;
  for (const s in series) {
    const d = series[s]; monthlyClose[s] = {}; volAtMonth[s] = {};
    for (const p of d) { const k = monthKey(new Date(p.t)); monthlyClose[s][k] = p.c; if (k < minM) minM = k; if (k > maxM) maxM = k; }
    // 각 월말 실현변동성: 그 월말까지 일봉으로
    const months = Object.keys(monthlyClose[s]).map(Number).sort((a, b) => a - b);
    let j = 0; const closes: number[] = [];
    for (const m of months) {
      const cut = endOfMonth(m);
      while (j < d.length && d[j].t <= cut) { closes.push(d[j].c); j++; }
      const v = realizedVol(closes, 252);
      if (v != null && isFinite(v)) volAtMonth[s][m] = v;
    }
  }

  // 매월: 저변동(하위 vol) LONG − 고변동(상위 vol) SHORT. 1개월 보유(비중첩).
  const lsSeries: { earnKey: number; ls: number }[] = [];
  const lowMembers: string[][] = [], highMembers: string[][] = [];
  const lowRet: number[] = [], highRet: number[] = [], lowVolLeg: number[] = [], highVolLeg: number[] = [];
  for (let m = minM; m + 1 <= maxM; m++) {
    const obs: { sym: string; vol: number; ret: number }[] = [];
    for (const s in series) {
      const v = volAtMonth[s]?.[m]; const pE = monthlyClose[s]?.[m], pX = monthlyClose[s]?.[m + 1];
      if (v == null || pE == null || pX == null || pE < 5) continue;
      obs.push({ sym: s, vol: v, ret: (pX / pE - 1) * 100 });
    }
    if (obs.length < MIN_STOCKS) continue;
    obs.sort((a, b) => a.vol - b.vol); // 오름차순: 앞=저변동
    const n = obs.length, t = Math.floor(n / 3);
    const low = obs.slice(0, t), high = obs.slice(n - t); // low=저변동(LONG), high=고변동(SHORT)
    const lr = mean(low.map((o) => o.ret)), hr = mean(high.map((o) => o.ret));
    lowRet.push(lr); highRet.push(hr);
    lowVolLeg.push(mean(low.map((o) => o.vol))); highVolLeg.push(mean(high.map((o) => o.vol)));
    lsSeries.push({ earnKey: m + 1, ls: lr - hr }); // 저−고
    lowMembers.push(low.map((o) => o.sym)); highMembers.push(high.map((o) => o.sym));
  }

  const ls = lsSeries.map((x) => x.ls);
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");

  console.log(`\n[저변동성 신뢰도 · 월별 롱숏(저−고 vol·1개월 보유·동일가중)]`);
  console.log(`종목 ${ok}/${UNIVERSE.length} · 유효 리밸런스 ${ls.length}개월`);
  console.log(`\n── 리스크 스토리(이례현상 핵심) ──`);
  console.log(`저변동 leg: 연율수익 ${pct(annualizedMean(lowRet))} · 평균 실현변동성 ${pct(mean(lowVolLeg))}`);
  console.log(`고변동 leg: 연율수익 ${pct(annualizedMean(highRet))} · 평균 실현변동성 ${pct(mean(highVolLeg))}`);
  console.log(`→ 저변동 leg 위험은 고변동의 ${num((mean(lowVolLeg) / mean(highVolLeg)) * 100, 0)}% 수준`);
  console.log(`\n── 롱숏(저−고) ──`);
  console.log(`연율 ${pct(annualizedMean(ls))} · 변동성 ${pct(annualizedVol(ls))} · t=${num(tStat(ls))} · 샤프 ${num(sharpe(ls))} · 양의 달 ${pct(fracPositive(ls) * 100)}`);

  const turn = (mem: string[][]) => { const r: number[] = []; for (let i = 1; i < mem.length; i++) { const prev = new Set(mem[i - 1]); if (!mem[i].length) continue; r.push(mem[i].filter((s) => !prev.has(s)).length / mem[i].length); } return mean(r); };
  const tLow = turn(lowMembers), tHigh = turn(highMembers), tTot = tLow + tHigh;
  console.log(`\n── 거래비용(회전율) ──`);
  console.log(`월평균 일방 회전율: 저 ${pct(tLow * 100)} · 고 ${pct(tHigh * 100)} · 합 ${pct(tTot * 100)}`);
  for (const bps of COST_BPS) console.log(`순수익 @${bps}bps: 연 ${pct(annualizedMean(ls) - tTot * (bps / 100) * 12)}`);

  const ff = loadFrench();
  if (!ff) { console.log(`\n── FF 알파 ── data/ff/ 없음 → 건너뜀(STEP 526 curl 재실행).`); }
  else {
    const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [];
    for (const row of lsSeries) { const f = ff[row.earnKey]; if (!f) continue; y.push(row.ls); mkt.push(f.mktrf); smb.push(f.smb); hml.push(f.hml); }
    console.log(`\n── 팩터 알파(월 회귀, 정렬 ${y.length}개월) ──`);
    const capm = ols(y, [mkt]);
    console.log(`CAPM 알파 ${pct(capm.coef[0] * 12)} · t=${num(capm.t[0])} | βMkt ${num(capm.coef[1])}  ← 저변동은 βMkt 음(−)이면 방어적(정상)`);
    const ff3 = ols(y, [mkt, smb, hml]);
    console.log(`FF3  알파 ${pct(ff3.coef[0] * 12)} · t=${num(ff3.t[0])} | βMkt ${num(ff3.coef[1])} βSMB ${num(ff3.coef[2])} βHML ${num(ff3.coef[3])}`);
  }
  console.log(`\n※ 생존편향·동일가중 잔존 → 수준 과대. 저변동은 '위험대비 우위'가 핵심(수준보다 위험·샤프·방향). 논문급 방법론이나 CRSP급 데이터는 아님.`);
}
run();
