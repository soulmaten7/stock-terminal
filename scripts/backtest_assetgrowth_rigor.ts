// 자산성장(Asset Growth·투자팩터) 백테스트 — 총자산 전년比 증가율. Cooper-Gulen-Schill 2008 / FF5 CMA.
// 저성장(보수적 투자)이 고성장(공격적 투자) 대비 이후 우위인지. LONG 저성장 − SHORT 고성장 = CMA(양의 프리미엄 기대).
// 연1회(6월) EDGAR 형성 → 7월~다음6월 월별 롱숏(저−고). point-in-time·$5+.
// ⚠️ 새 데이터 없음 — edgarRows가 이미 totalAssets 제공(전년도와 비교). French는 data/ff 재사용.
// 핵심 검증: CMA는 FF3(Mkt·SMB·HML)에 없는 별도 팩터 → FF3 알파가 살아있어야 "독립 프리미엄". (밸류·주주환원과 대조)
// npx tsx scripts/backtest_assetgrowth_rigor.ts
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
const COHORTS: number[] = []; for (let y = 2011; y <= 2023; y++) COHORTS.push(y); // Y-1 필요 → 2011부터

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
  const data: Record<string, { ta: Record<number, number>; mc: Record<number, number> }> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (sym) => {
    try {
      const rows = await edgarRows(sym); if (!rows.length) return;
      const ta: Record<number, number> = {};
      for (const r of rows) if (r.totalAssets != null && r.totalAssets > 0) ta[r.fy] = r.totalAssets;
      if (Object.keys(ta).length < 2) return; // 성장률에 최소 2년
      const mc = await monthlyCloses(sym); if (!Object.keys(mc).length) return;
      data[sym] = { ta, mc }; ok++;
    } catch { /* skip */ }
  });

  const legRet = (syms: string[], h: number): number | null => {
    const rs: number[] = [];
    for (const s of syms) { const a = data[s]?.mc[h - 1], b = data[s]?.mc[h]; if (a != null && b != null && a > 0) rs.push((b / a - 1) * 100); }
    return rs.length ? mean(rs) : null;
  };

  const agLS: Record<number, number> = {};
  const agTurn: number[] = []; let prevLoH: Set<string> | null = null; // 저성장(LONG) leg 추적

  for (const Y of COHORTS) {
    const f = (Y + 1) * 12 + 5; // Y+1년 6월
    const cand: { sym: string; ag: number }[] = [];
    for (const s in data) {
      const taY = data[s].ta[Y], taP = data[s].ta[Y - 1];
      if (taY == null || taP == null || taP <= 0) continue;
      const pF = data[s].mc[f]; if (pF == null || pF < 5) continue;
      cand.push({ sym: s, ag: taY / taP - 1 }); // 총자산 전년比 증가율
    }
    if (cand.length < MIN_STOCKS) continue;
    const holdMonths = Array.from({ length: 12 }, (_, i) => f + 1 + i);
    const arr = cand.sort((a, b) => a.ag - b.ag); // 오름차순: 앞=저성장
    const t = Math.floor(arr.length / 3);
    const lowSyms = arr.slice(0, t).map((c) => c.sym);            // 저성장(보수적 투자) = LONG
    const highSyms = arr.slice(arr.length - t).map((c) => c.sym); // 고성장(공격적 투자) = SHORT
    if (prevLoH) agTurn.push(lowSyms.filter((s) => !prevLoH!.has(s)).length / lowSyms.length);
    prevLoH = new Set(lowSyms);
    for (const h of holdMonths) { const lo = legRet(lowSyms, h), hi = legRet(highSyms, h); if (lo != null && hi != null) agLS[h] = lo - hi; } // CMA = 저−고
  }

  const ff = loadFrench();
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");

  const report = (label: string, store: Record<number, number>, turn?: number[]) => {
    const keys = Object.keys(store).map(Number).sort((a, b) => a - b);
    const ls = keys.map((k) => store[k]);
    console.log(`\n=== ${label} · 월별 롱숏(저−고 성장) ${ls.length}개월 ===`);
    console.log(`연율 ${pct(annualizedMean(ls))} · 변동성 ${pct(annualizedVol(ls))} · t=${num(tStat(ls))} · 샤프 ${num(sharpe(ls))} · 양의 달 ${pct(fracPositive(ls) * 100)}`);
    if (turn && turn.length) console.log(`연 회전율(저 leg) ${pct(mean(turn) * 100)} · 순수익@30bps 연 ${pct(annualizedMean(ls) - mean(turn) * 2 * 0.30)}`);
    if (ff) {
      const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [];
      for (const k of keys) { const fac = ff[k]; if (!fac) continue; y.push(store[k]); mkt.push(fac.mktrf); smb.push(fac.smb); hml.push(fac.hml); }
      const capm = ols(y, [mkt]); const ff3 = ols(y, [mkt, smb, hml]);
      console.log(`CAPM 알파 ${pct(capm.coef[0] * 12)} · t=${num(capm.t[0])}`);
      console.log(`FF3  알파 ${pct(ff3.coef[0] * 12)} · t=${num(ff3.t[0])} | βMkt ${num(ff3.coef[1])} βSMB ${num(ff3.coef[2])} βHML ${num(ff3.coef[3])}`);
    }
  };

  console.log(`\n[자산성장 신뢰도 · 연형성/월수익 롱숏]`);
  console.log(`종목 ${ok}/${UNIVERSE.length}(EDGAR+가격) · 코호트 ${COHORTS[0]}~${COHORTS[COHORTS.length - 1]}`);
  report("Asset Growth (총자산 증가율·저−고)", agLS, agTurn);
  console.log(`\n※ 핵심: CMA는 FF3에 없는 별도 팩터 → FF3 알파 살면=독립 프리미엄(밸류·주주환원과 대조). 생존편향·동일가중 → 수준 과대(방향·유의만). 금융주 포함(주의: 은행 자산성장은 성격 다름 — 유의하면 ex-금융 재확인 여지).`);
}
run();
