// 퀄리티(Quality) 팩터 백테스트 — Gross Profitability(GP/A, Novy-Marx 2013) + ROE. lib/edgar + lib/backtest_stats.
// GP/A = 매출총이익/총자산 · ROE = 순이익/자기자본. 고퀄리티(고 GP/A·ROE)가 저퀄리티 대비 이후 우위인지.
// 연1회(6월) EDGAR 형성 → 7월~다음6월 월별 롱숏(고−저). point-in-time·$5+·은행 자동제외(매출총이익 없음).
// ⚠️ 새 데이터 없음 — edgarRows가 이미 grossProfit·totalAssets·netIncome·stockholdersEquity 제공. French는 data/ff 재사용.
// npx tsx scripts/backtest_quality_rigor.ts
import fs from "node:fs";
import path from "node:path";
import YahooFinance from "yahoo-finance2";
import { edgarRows } from "../lib/edgar";
import { mean, tStat, sharpe, annualizedMean, annualizedVol, fracPositive, ols } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 400;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);
const MIN_STOCKS = 20;
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

type Fund = { gp: number | null; ta: number | null; ni: number | null; eq: number | null };

async function run() {
  const data: Record<string, { fund: Record<number, Fund>; mc: Record<number, number> }> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (sym) => {
    try {
      const rows = await edgarRows(sym); if (!rows.length) return;
      const fund: Record<number, Fund> = {};
      for (const r of rows) fund[r.fy] = { gp: r.grossProfit ?? null, ta: r.totalAssets ?? null, ni: r.netIncome ?? null, eq: r.stockholdersEquity ?? null };
      const mc = await monthlyCloses(sym); if (!Object.keys(mc).length) return;
      data[sym] = { fund, mc }; ok++;
    } catch { /* skip */ }
  });

  const legRet = (syms: string[], h: number): number | null => {
    const rs: number[] = [];
    for (const s of syms) { const a = data[s]?.mc[h - 1], b = data[s]?.mc[h]; if (a != null && b != null && a > 0) rs.push((b / a - 1) * 100); }
    return rs.length ? mean(rs) : null;
  };

  const gpaLS: Record<number, number> = {}, roeLS: Record<number, number> = {};
  const gpaTurn: number[] = []; let prevGpaH: Set<string> | null = null, prevGpaL: Set<string> | null = null;

  for (const Y of COHORTS) {
    const f = (Y + 1) * 12 + 5; // Y+1년 6월
    const cand: { sym: string; gpa: number | null; roe: number | null }[] = [];
    for (const s in data) {
      const fu = data[s].fund[Y]; if (!fu) continue;
      const pF = data[s].mc[f]; if (pF == null || pF < 5) continue;
      const gpa = fu.gp != null && fu.ta != null && fu.ta > 0 ? fu.gp / fu.ta : null; // 매출총이익/총자산(은행=gp없음→null 제외)
      const roe = fu.ni != null && fu.eq != null && fu.eq > 0 ? fu.ni / fu.eq : null;
      cand.push({ sym: s, gpa, roe });
    }
    const holdMonths = Array.from({ length: 12 }, (_, i) => f + 1 + i);

    const doMetric = (key: "gpa" | "roe", store: Record<number, number>, prevH: Set<string> | null, prevL: Set<string> | null, turnH: number[]): [Set<string> | null, Set<string> | null] => {
      const arr = cand.filter((c) => c[key] != null).sort((a, b) => (a[key] as number) - (b[key] as number)); // 오름차순: 앞=저퀄리티
      if (arr.length < MIN_STOCKS) return [prevH, prevL];
      const t = Math.floor(arr.length / 3);
      const lowSyms = arr.slice(0, t).map((c) => c.sym);        // 저 GP/A·ROE = 저퀄리티(SHORT)
      const highSyms = arr.slice(arr.length - t).map((c) => c.sym); // 고 = 고퀄리티(LONG)
      if (prevH) turnH.push(highSyms.filter((s) => !prevH.has(s)).length / highSyms.length);
      for (const h of holdMonths) { const hr = legRet(highSyms, h), lr = legRet(lowSyms, h); if (hr != null && lr != null) store[h] = hr - lr; }
      return [new Set(highSyms), new Set(lowSyms)];
    };
    [prevGpaH, prevGpaL] = doMetric("gpa", gpaLS, prevGpaH, prevGpaL, gpaTurn);
    doMetric("roe", roeLS, null, null, []);
  }

  const ff = loadFrench();
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");

  const report = (label: string, store: Record<number, number>, turn?: number[]) => {
    const keys = Object.keys(store).map(Number).sort((a, b) => a - b);
    const ls = keys.map((k) => store[k]);
    console.log(`\n=== ${label} · 월별 롱숏(고−저 퀄리티) ${ls.length}개월 ===`);
    console.log(`연율 ${pct(annualizedMean(ls))} · 변동성 ${pct(annualizedVol(ls))} · t=${num(tStat(ls))} · 샤프 ${num(sharpe(ls))} · 양의 달 ${pct(fracPositive(ls) * 100)}`);
    if (turn && turn.length) console.log(`연 회전율(고 leg) ${pct(mean(turn) * 100)} · 순수익@30bps 연 ${pct(annualizedMean(ls) - mean(turn) * 2 * 0.30)}`);
    if (ff) {
      const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [];
      for (const k of keys) { const fac = ff[k]; if (!fac) continue; y.push(store[k]); mkt.push(fac.mktrf); smb.push(fac.smb); hml.push(fac.hml); }
      const capm = ols(y, [mkt]); const ff3 = ols(y, [mkt, smb, hml]);
      console.log(`CAPM 알파 ${pct(capm.coef[0] * 12)} · t=${num(capm.t[0])}`);
      console.log(`FF3  알파 ${pct(ff3.coef[0] * 12)} · t=${num(ff3.t[0])} | βMkt ${num(ff3.coef[1])} βSMB ${num(ff3.coef[2])} βHML ${num(ff3.coef[3])}`);
    }
  };

  console.log(`\n[퀄리티 신뢰도 · 연형성/월수익 롱숏]`);
  console.log(`종목 ${ok}/${UNIVERSE.length}(EDGAR+가격·은행 GP/A 자동제외) · 코호트 ${COHORTS[0]}~${COHORTS[COHORTS.length - 1]}`);
  report("GP/A (Novy-Marx 총수익성)", gpaLS, gpaTurn);
  report("ROE (자기자본이익률)", roeLS);
  console.log(`\n※ 생존편향·동일가중 잔존 → 수준 과대. 연1회 리밸런스=저비용. 방향·유의만 신뢰. GP/A는 은행 제외(매출총이익 없음).`);
}
run();
