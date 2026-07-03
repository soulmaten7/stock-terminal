// 재무 3렌즈 3중 교차검증 — 밸류(E/P)·퀄리티(GP/A)·자산성장(CMA). 연1회(6월) EDGAR 형성 → 월별 롱숏.
// 코호트를 초·중·후반 3그룹(fold)으로 나눠 각 구간에서도 같은 방향인지. 3/3 = 단단 / 뒤집힘 = 정직 하향.
// (F-Score는 '수익 신호 아님·건전성 해석'으로 이미 확정 → 수익 롱숏 교차검증 대상 아님.)
// point-in-time·$5+·동일가중. French로 전체 FF3 알파. 새 데이터 없음(edgarRows 재사용).
// npx tsx scripts/backtest_crossval_fund.ts
import fs from "node:fs";
import path from "node:path";
import YahooFinance from "yahoo-finance2";
import { edgarRows } from "../lib/edgar";
import { mean, tStat, annualizedMean, fracPositive, ols } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 400;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);
const MIN_STOCKS = 20;
const COHORTS: number[] = []; for (let y = 2011; y <= 2023; y++) COHORTS.push(y); // 자산성장 Y-1 필요 → 2011부터

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

type Fund = { ni: number | null; gp: number | null; ta: number | null; sh: number | null };
type Metric = "value" | "quality" | "assetgrowth";
const METRICS: { key: Metric; label: string; longHigh: boolean }[] = [
  { key: "value", label: "밸류 (E/P)", longHigh: true },        // 고 E/P(싼) 롱
  { key: "quality", label: "퀄리티 (GP/A)", longHigh: true },    // 고 GP/A 롱
  { key: "assetgrowth", label: "자산성장 (CMA)", longHigh: false }, // 저성장 롱
];

async function run() {
  const data: Record<string, { fund: Record<number, Fund>; mc: Record<number, number> }> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (sym) => {
    try {
      const rows = await edgarRows(sym); if (!rows.length) return;
      const fund: Record<number, Fund> = {};
      for (const r of rows) fund[r.fy] = { ni: r.netIncome ?? null, gp: r.grossProfit ?? null, ta: r.totalAssets ?? null, sh: r.ordinarySharesNumber ?? null };
      const mc = await monthlyCloses(sym); if (!Object.keys(mc).length) return;
      data[sym] = { fund, mc }; ok++;
    } catch { /* skip */ }
  });

  const legRet = (syms: string[], h: number): number | null => {
    const rs: number[] = [];
    for (const s of syms) { const a = data[s]?.mc[h - 1], b = data[s]?.mc[h]; if (a != null && b != null && a > 0) rs.push((b / a - 1) * 100); }
    return rs.length ? mean(rs) : null;
  };
  const sigOf = (key: Metric, fu: Fund, fuPrev: Fund | undefined, pF: number): number | null => {
    if (key === "value") return fu.ni != null && fu.sh != null && fu.sh > 0 && pF > 0 ? fu.ni / (pF * fu.sh) : null; // E/P = 순이익/시총
    if (key === "quality") return fu.gp != null && fu.ta != null && fu.ta > 0 ? fu.gp / fu.ta : null;
    // assetgrowth
    return fu.ta != null && fuPrev?.ta != null && fuPrev.ta > 0 ? fu.ta / fuPrev.ta - 1 : null;
  };

  const ff = loadFrench();
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");

  console.log(`\n[재무 3렌즈 · 3중 교차검증(코호트 3분할)]  종목 ${ok}/${UNIVERSE.length} · 코호트 ${COHORTS[0]}~${COHORTS[COHORTS.length - 1]}`);

  for (const M of METRICS) {
    const perCohort: { Y: number; ls: number; m: number }[] = [];
    for (const Y of COHORTS) {
      const f = (Y + 1) * 12 + 5;
      const cand: { sym: string; sig: number }[] = [];
      for (const s in data) {
        const fu = data[s].fund[Y]; if (!fu) continue;
        const pF = data[s].mc[f]; if (pF == null || pF < 5) continue;
        const sig = sigOf(M.key, fu, data[s].fund[Y - 1], pF);
        if (sig == null) continue;
        cand.push({ sym: s, sig });
      }
      if (cand.length < MIN_STOCKS) continue;
      cand.sort((a, b) => a.sig - b.sig);
      const k = Math.floor(cand.length / 3);
      const lowLeg = cand.slice(0, k).map((c) => c.sym), highLeg = cand.slice(cand.length - k).map((c) => c.sym);
      for (let i = 0; i < 12; i++) {
        const h = f + 1 + i;
        const lo = legRet(lowLeg, h), hi = legRet(highLeg, h);
        if (lo == null || hi == null) continue;
        perCohort.push({ Y, m: h, ls: M.longHigh ? hi - lo : lo - hi });
      }
    }
    const cohortYs = [...new Set(perCohort.map((p) => p.Y))].sort((a, b) => a - b);
    const g = Math.ceil(cohortYs.length / 3);
    const groups = [cohortYs.slice(0, g), cohortYs.slice(g, 2 * g), cohortYs.slice(2 * g)];
    const foldArr = (grp: number[]) => perCohort.filter((p) => grp.includes(p.Y)).map((p) => p.ls);
    const all = perCohort.map((p) => p.ls);
    const folds = groups.map(foldArr);
    const seg = (a: number[], grp: number[]) => (a.length ? `${grp[0]}~${grp[grp.length - 1]}: 연 ${pct(annualizedMean(a))}·t ${num(tStat(a))}·양의달 ${pct(fracPositive(a) * 100)}` : "구간 없음");
    const signs = folds.map((f) => (f.length ? Math.sign(annualizedMean(f)) : 0));
    const consistent = signs.every((s) => s === signs[0] && s !== 0);
    console.log(`\n=== ${M.label} · ${all.length}개월 ===`);
    console.log(`전체: 연 ${pct(annualizedMean(all))} · t ${num(tStat(all))} · 양의달 ${pct(fracPositive(all) * 100)}`);
    console.log(`fold1 ${seg(folds[0], groups[0])}`);
    console.log(`fold2 ${seg(folds[1], groups[1])}`);
    console.log(`fold3 ${seg(folds[2], groups[2])}`);
    if (ff) {
      const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [];
      for (const p of perCohort) { const fac = ff[p.m]; if (!fac) continue; y.push(p.ls); mkt.push(fac.mktrf); smb.push(fac.smb); hml.push(fac.hml); }
      const ff3 = ols(y, [mkt, smb, hml]);
      console.log(`FF3 알파 ${pct(ff3.coef[0] * 12)} · t ${num(ff3.t[0])} | βHML ${num(ff3.coef[3])}`);
    }
    console.log(`▶ 3구간 부호 [${signs.join(", ")}] → ${consistent ? "✅ 단단(3/3 동일 방향)" : "⚠️ 취약(구간별 뒤집힘)"}`);
  }
  console.log(`\n※ 판정: 3구간 부호 일치 + 전체 방향 = 등급 유지 / 뒤집힘 = 정직 하향. 밸류·자산성장은 이미 '표본 약함'(유의 미달)이라 방향 일관성이 핵심 관전 포인트.`);
}
run();
