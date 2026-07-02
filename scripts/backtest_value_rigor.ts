// 밸류(가치) 신뢰도 백테스트 — 연1회(6월) EDGAR 재무로 포트폴리오 형성 → 월별 수익률 롱숏(싼−비쌈) 시계열.
// Fama-French 표준: fy=Y 재무 → Y+1 6월말 형성(시총=6월가×fy=Y 주식수) → 7월~다음6월 12개월 월별 보유. 매년 롤.
// 지표 2종: E/P(순이익/시총=1/PER)·B/M(자기자본/시총=1/PBR=HML 정통). 은행 포함. lib/edgar + lib/backtest_stats.
// t·샤프·회전율(연1회=저비용)·FF 알파. ⚠️ FF3는 HML 포함 → 밸류 알파가 HML로 흡수되면 "우리 밸류=학계 가치팩터"(정상).
// ⚠️ 생존편향·동일가중 잔존 → 수준 과대(방향·유의만 신뢰). French는 data/ff 재사용.
// npx tsx scripts/backtest_value_rigor.ts
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

type Fund = { ni: number | null; eq: number | null; sh: number | null };

async function run() {
  const data: Record<string, { fund: Record<number, Fund>; mc: Record<number, number> }> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (sym) => {
    try {
      const rows = await edgarRows(sym); if (!rows.length) return;
      const fund: Record<number, Fund> = {};
      for (const r of rows) fund[r.fy] = { ni: r.netIncome ?? null, eq: r.stockholdersEquity ?? null, sh: r.ordinarySharesNumber ?? null };
      const mc = await monthlyCloses(sym); if (!Object.keys(mc).length) return;
      data[sym] = { fund, mc }; ok++;
    } catch { /* skip */ }
  });

  // 종목 members의 월 h 등가중 수익률(mc[h]/mc[h-1]-1). 없는 종목 제외.
  const legRet = (syms: string[], h: number): number | null => {
    const rs: number[] = [];
    for (const s of syms) { const a = data[s]?.mc[h - 1], b = data[s]?.mc[h]; if (a != null && b != null && a > 0) rs.push((b / a - 1) * 100); }
    return rs.length ? mean(rs) : null;
  };

  const epLS: Record<number, number> = {}, bmLS: Record<number, number> = {};
  const epTurnC: number[] = [], epTurnE: number[] = [], bmTurnC: number[] = [], bmTurnE: number[] = [];
  let prevEPc: Set<string> | null = null, prevEPe: Set<string> | null = null, prevBMc: Set<string> | null = null, prevBMe: Set<string> | null = null;

  for (const Y of COHORTS) {
    const f = (Y + 1) * 12 + 5; // Y+1년 6월(월0=5)
    const cand: { sym: string; ep: number | null; bm: number | null }[] = [];
    for (const s in data) {
      const fu = data[s].fund[Y]; if (!fu) continue;
      const pF = data[s].mc[f]; if (pF == null || pF < 5 || fu.sh == null || fu.sh <= 0) continue;
      const mktcap = pF * fu.sh; if (!(mktcap > 0)) continue;
      cand.push({ sym: s, ep: fu.ni != null ? fu.ni / mktcap : null, bm: fu.eq != null && fu.eq > 0 ? fu.eq / mktcap : null });
    }
    const holdMonths = Array.from({ length: 12 }, (_, i) => f + 1 + i); // 7월~다음6월

    const doMetric = (key: "ep" | "bm", store: Record<number, number>, prevC: Set<string> | null, prevE: Set<string> | null, turnC: number[], turnE: number[]): [Set<string> | null, Set<string> | null] => {
      const arr = cand.filter((c) => c[key] != null).sort((a, b) => (a[key] as number) - (b[key] as number)); // 오름차순: 앞=저지표(비쌈)
      if (arr.length < MIN_STOCKS) return [prevC, prevE];
      const t = Math.floor(arr.length / 3);
      const expSyms = arr.slice(0, t).map((c) => c.sym);       // 저지표=비쌈(SHORT)
      const cheapSyms = arr.slice(arr.length - t).map((c) => c.sym); // 고지표=싼(LONG)
      if (prevC) turnC.push(cheapSyms.filter((s) => !prevC.has(s)).length / cheapSyms.length);
      if (prevE) turnE.push(expSyms.filter((s) => !prevE.has(s)).length / expSyms.length);
      for (const h of holdMonths) { const cr = legRet(cheapSyms, h), er = legRet(expSyms, h); if (cr != null && er != null) store[h] = cr - er; }
      return [new Set(cheapSyms), new Set(expSyms)];
    };
    [prevEPc, prevEPe] = doMetric("ep", epLS, prevEPc, prevEPe, epTurnC, epTurnE);
    [prevBMc, prevBMe] = doMetric("bm", bmLS, prevBMc, prevBMe, bmTurnC, bmTurnE);
  }

  const ff = loadFrench();
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");

  const report = (label: string, store: Record<number, number>, turnC: number[], turnE: number[]) => {
    const keys = Object.keys(store).map(Number).sort((a, b) => a - b);
    const ls = keys.map((k) => store[k]);
    console.log(`\n=== ${label} · 월별 롱숏(싼−비쌈) ${ls.length}개월 ===`);
    console.log(`연율 ${pct(annualizedMean(ls))} · 변동성 ${pct(annualizedVol(ls))} · t=${num(tStat(ls))} · 샤프 ${num(sharpe(ls))} · 양의 달 ${pct(fracPositive(ls) * 100)}`);
    const turnTot = (mean(turnC) + mean(turnE));
    console.log(`연1회 리밸런스 · 연 회전율(싼+비쌈) ${pct(turnTot * 100)} · 순수익@30bps 연 ${pct(annualizedMean(ls) - turnTot * 0.30)}`);
    if (ff) {
      const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [];
      for (const k of keys) { const fac = ff[k]; if (!fac) continue; y.push(store[k]); mkt.push(fac.mktrf); smb.push(fac.smb); hml.push(fac.hml); }
      const capm = ols(y, [mkt]); const ff3 = ols(y, [mkt, smb, hml]);
      console.log(`CAPM 알파 ${pct(capm.coef[0] * 12)} · t=${num(capm.t[0])}`);
      console.log(`FF3  알파 ${pct(ff3.coef[0] * 12)} · t=${num(ff3.t[0])} | βHML ${num(ff3.coef[3])}  ← βHML↑·FF3알파↓면 "우리 밸류=학계 가치팩터"(정상)`);
    }
  };

  console.log(`\n[밸류 신뢰도 · 연형성/월수익 롱숏]`);
  console.log(`종목 ${ok}/${UNIVERSE.length}(EDGAR+가격) · 코호트 ${COHORTS[0]}~${COHORTS[COHORTS.length - 1]}`);
  report("E/P(1/PER)", epLS, epTurnC, epTurnE);
  report("B/M(1/PBR=HML)", bmLS, bmTurnC, bmTurnE);
  console.log(`\n※ 생존편향·동일가중 잔존 → 수준 과대. 은행 포함. 연1회 리밸런스라 회전율·비용 낮음. 방향·유의만 신뢰. CRSP급 데이터는 아님.`);
}
run();
