// F-Score 신뢰도 백테스트 — 점수 고(≥7)−저(≤3) 월별 롱숏 t·샤프·FF 알파. lib/fscore + lib/edgar + lib/backtest_stats.
// 형성: fy=Y·Y-1 재무로 F-Score(9점) → Y+1 6월말 형성 → 7월~다음6월 월별 보유. 매년 롤.
// 목적: "F-Score가 수익 예측 신호냐"를 엄격히(t·알파) 재확인. 우리 입장=건전성 해석(수익예측 아님) → 유의 미달/음이면 그 입장 공식 확인.
// ⚠️ 은행류는 computeFScore가 자동 미지원(구조상 제외·정상). 생존편향·동일가중 잔존. French는 data/ff 재사용.
// npx tsx scripts/backtest_fscore_rigor.ts
import fs from "node:fs";
import path from "node:path";
import YahooFinance from "yahoo-finance2";
import { edgarRows, type EdgarRow } from "../lib/edgar";
import { computeFScore } from "../lib/fscore";
import { mean, tStat, sharpe, annualizedMean, annualizedVol, fracPositive, ols } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 600; // 확대(400→600): F-Score는 은행 제외+2년 완전재무 요구로 코호트당 지원종목이 적음 → 표본 보강
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);
const MIN_BUCKET = 8;
const COHORTS: number[] = []; for (let y = 2010; y <= 2023; y++) COHORTS.push(y);

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0; async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
async function monthlyCloses(sym: string): Promise<Record<number, number>> {
  const ch = await yf.chart(sym, { period1: new Date("2010-01-01"), interval: "1d" });
  const last: Record<number, { t: number; c: number }> = {};
  for (const q of ch.quotes ?? []) { if (typeof q.close !== "number" || (q.close as number) <= 0) continue; const d = new Date(q.date); const k = monthKey(d); const t = d.getTime(); if (!last[k] || t > last[k].t) last[k] = { t, c: q.close as number }; }
  const out: Record<number, number> = {}; for (const k in last) out[Number(k)] = last[Number(k)].c; return out;
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
  const data: Record<string, { rows: Record<number, EdgarRow>; mc: Record<number, number> }> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (sym) => {
    try {
      const rs = await edgarRows(sym); if (rs.length < 2) return;
      const rows: Record<number, EdgarRow> = {}; for (const r of rs) rows[r.fy] = r;
      const mc = await monthlyCloses(sym); if (!Object.keys(mc).length) return;
      data[sym] = { rows, mc }; ok++;
    } catch { /* skip */ }
  });

  const legRet = (syms: string[], h: number): number | null => {
    const rr: number[] = [];
    for (const s of syms) { const a = data[s]?.mc[h - 1], b = data[s]?.mc[h]; if (a != null && b != null && a > 0) rr.push((b / a - 1) * 100); }
    return rr.length ? mean(rr) : null;
  };

  const lsByMonth: Record<number, number> = {};
  const turnH: number[] = [], turnL: number[] = []; let prevH: Set<string> | null = null, prevL: Set<string> | null = null;
  let supportedTot = 0, cohortsUsed = 0;

  for (const Y of COHORTS) {
    const f = (Y + 1) * 12 + 5;
    // 점수 3분위(상 1/3 vs 하 1/3). 고정 임계(≥7/≤3)는 저점수 버킷이 드물어(생존편향+부실 희소) 표본 극소 → 3분위로 균형 확보.
    const scored: { s: string; score: number }[] = [];
    for (const s in data) {
      const cur = data[s].rows[Y], prev = data[s].rows[Y - 1]; if (!cur || !prev) continue;
      const pF = data[s].mc[f]; if (pF == null || pF < 5) continue;
      const fsc = computeFScore([prev, cur]); if (!fsc.supported) continue;
      supportedTot++;
      scored.push({ s, score: fsc.score });
    }
    if (scored.length < 3 * MIN_BUCKET) continue; // 3분위 각 ≥MIN_BUCKET
    scored.sort((a, b) => a.score - b.score); // 오름차순: 앞=저점수
    const t = Math.floor(scored.length / 3);
    const low = scored.slice(0, t).map((x) => x.s);              // 저 F-Score(하위 3분위)
    const high = scored.slice(scored.length - t).map((x) => x.s); // 고 F-Score(상위 3분위)
    cohortsUsed++;
    if (prevH) turnH.push(high.filter((s) => !prevH!.has(s)).length / high.length);
    if (prevL) turnL.push(low.filter((s) => !prevL!.has(s)).length / low.length);
    prevH = new Set(high); prevL = new Set(low);
    for (let i = 1; i <= 12; i++) { const h = f + i; const hr = legRet(high, h), lr = legRet(low, h); if (hr != null && lr != null) lsByMonth[h] = hr - lr; }
  }

  const keys = Object.keys(lsByMonth).map(Number).sort((a, b) => a - b);
  const ls = keys.map((k) => lsByMonth[k]);
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");

  console.log(`\n[F-Score 신뢰도 · 고−저 점수 3분위 월별 롱숏]`);
  console.log(`종목 ${ok}/${UNIVERSE.length}(EDGAR+가격·은행 자동제외) · 지원 관측 ${supportedTot} · 유효 코호트 ${cohortsUsed} · 월수 ${ls.length}`);
  console.log(`\n연율 ${pct(annualizedMean(ls))} · 변동성 ${pct(annualizedVol(ls))} · t=${num(tStat(ls))} · 샤프 ${num(sharpe(ls))} · 양의 달 ${pct(fracPositive(ls) * 100)}`);
  console.log(`   ← t가 유의 미달/음이면 "F-Score는 수익 예측 신호 아님(건전성 해석)" 공식 확인`);
  const tt = mean(turnH) + mean(turnL);
  console.log(`연1회 리밸런스 · 연 회전율(고+저) ${pct(tt * 100)}`);

  const ff = loadFrench();
  if (ff) {
    const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [];
    for (const k of keys) { const fac = ff[k]; if (!fac) continue; y.push(lsByMonth[k]); mkt.push(fac.mktrf); smb.push(fac.smb); hml.push(fac.hml); }
    const capm = ols(y, [mkt]); const ff3 = ols(y, [mkt, smb, hml]);
    console.log(`CAPM 알파 ${pct(capm.coef[0] * 12)} · t=${num(capm.t[0])}`);
    console.log(`FF3  알파 ${pct(ff3.coef[0] * 12)} · t=${num(ff3.t[0])} | βMkt ${num(ff3.coef[1])} βSMB ${num(ff3.coef[2])} βHML ${num(ff3.coef[3])}`);
  }
  console.log(`\n※ 은행 자동제외(정상). F-Score 원용도=고B/M(가치)주 내 부실 필터(Piotroski) — 넓은 유니버스 수익예측용 아님. 생존편향·동일가중 잔존. 방향·유의만.`);
}
run();
