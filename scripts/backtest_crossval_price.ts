// 가격 기반 3렌즈 3중 교차검증 — 모멘텀(12-1)·저변동(실현변동성)·기술(200일선 프록시).
// 월별 리밸런스 롱숏(3분위)을 만든 뒤, 전체 기간을 초·중·후반 3구간(fold)으로 나눠 각 구간의 방향·t를 확인.
// 목적: 한 번의 전체 t가 특정 시기 우연인지 검증. 3구간 모두 같은 부호 = 단단(robust) / 부호 뒤집힘 = 취약(등급 하향).
// 투자가능 $5+·동일가중. French로 전체구간 FF3 알파도. 새 데이터 없음(가격만).
// npx tsx scripts/backtest_crossval_price.ts
import fs from "node:fs";
import path from "node:path";
import YahooFinance from "yahoo-finance2";
import { mean, stdev, tStat, annualizedMean, fracPositive, ols } from "../lib/backtest_stats";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
type Sym = { sym: string; name: string; type: string };
const allStocks = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const N = 400;
const stepU = Math.max(1, Math.floor(allStocks.length / N));
const UNIVERSE = allStocks.filter((_, i) => i % stepU === 0).slice(0, N);
const MIN_STOCKS = 24;

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0; async function w() { while (i < arr.length) { const c = i++; await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, w));
}
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
async function monthlyCloses(sym: string): Promise<Record<number, number>> {
  const ch = await yf.chart(sym, { period1: new Date("2009-01-01"), interval: "1d" });
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

type LensDef = { key: string; label: string; longHigh: boolean; signal: (c: Record<number, number>, t: number) => number | null };

// 신호는 '월 t 말 결정 → 월 t+1 보유'. 미래정보 없음(신호는 t 이하만 사용).
const LENSES: LensDef[] = [
  {
    key: "momentum", label: "모멘텀 (12-1)", longHigh: true, // 고모멘텀 롱
    signal: (c, t) => { const a = c[t - 13], b = c[t - 1]; return a != null && b != null && a > 0 ? b / a - 1 : null; },
  },
  {
    key: "lowvol", label: "저변동성", longHigh: false, // 저변동 롱(low-high)
    signal: (c, t) => {
      const rs: number[] = [];
      for (let k = t - 11; k <= t; k++) { const p = c[k - 1], q = c[k]; if (p != null && q != null && p > 0) rs.push(q / p - 1); }
      return rs.length >= 8 ? stdev(rs) : null;
    },
  },
  {
    key: "technical", label: "기술 (200일선≈10개월MA)", longHigh: true, // 추세 위 롱
    signal: (c, t) => {
      const win: number[] = []; for (let k = t - 9; k <= t; k++) if (c[k] != null) win.push(c[k]);
      const now = c[t]; return win.length >= 8 && now != null ? now / mean(win) - 1 : null;
    },
  },
];

async function run() {
  const data: Record<string, Record<number, number>> = {};
  let ok = 0;
  await mapLimit(UNIVERSE, 6, async (sym) => {
    try { const mc = await monthlyCloses(sym); if (Object.keys(mc).length >= 24) { data[sym] = mc; ok++; } } catch { /* skip */ }
  });

  const syms = Object.keys(data);
  const allMonths = new Set<number>(); for (const s of syms) for (const k in data[s]) allMonths.add(Number(k));
  const months = [...allMonths].sort((a, b) => a - b);
  const start = months[0] + 14, end = months[months.length - 1] - 1; // 신호 13개월 + 보유 1개월 여유

  const ff = loadFrench();
  const num = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : "n/a");
  const pct = (v: number) => (isFinite(v) ? (v >= 0 ? "+" : "") + v.toFixed(2) + "%" : "n/a");

  console.log(`\n[가격 3렌즈 · 3중 교차검증(시기 3분할)]  종목 ${ok}/${UNIVERSE.length}`);

  for (const L of LENSES) {
    const series: { m: number; ls: number }[] = [];
    for (let t = start; t <= end; t++) {
      const cand: { sym: string; sig: number; fwd: number }[] = [];
      for (const s of syms) {
        const sig = L.signal(data[s], t);
        const a = data[s][t], b = data[s][t + 1];
        if (sig == null || a == null || b == null || a <= 0 || a < 5) continue; // $5+ 형성월 가격
        cand.push({ sym: s, sig, fwd: (b / a - 1) * 100 });
      }
      if (cand.length < MIN_STOCKS) continue;
      cand.sort((x, y) => x.sig - y.sig); // 오름차순
      const k = Math.floor(cand.length / 3);
      const lowLeg = cand.slice(0, k), highLeg = cand.slice(cand.length - k);
      const lowRet = mean(lowLeg.map((c) => c.fwd)), highRet = mean(highLeg.map((c) => c.fwd));
      const ls = L.longHigh ? highRet - lowRet : lowRet - highRet; // 롱-숏
      series.push({ m: t + 1, ls });
    }
    // 3 fold 시기 분할
    const arr = series.map((s) => s.ls);
    const n = arr.length; const f1 = Math.floor(n / 3), f2 = Math.floor((2 * n) / 3);
    const folds = [arr.slice(0, f1), arr.slice(f1, f2), arr.slice(f2)];
    const foldMonths = [series.slice(0, f1), series.slice(f1, f2), series.slice(f2)];
    const seg = (a: number[], mm: { m: number }[]) => {
      if (!a.length) return "구간 없음";
      const y0 = Math.floor(mm[0].m / 12), y1 = Math.floor(mm[mm.length - 1].m / 12);
      return `${y0}~${y1}: 연 ${pct(annualizedMean(a))}·t ${num(tStat(a))}·양의달 ${pct(fracPositive(a) * 100)}`;
    };
    const signs = folds.map((f) => (f.length ? Math.sign(annualizedMean(f)) : 0));
    const consistent = signs.every((s) => s === signs[0] && s !== 0);
    console.log(`\n=== ${L.label} · ${n}개월 ===`);
    console.log(`전체: 연 ${pct(annualizedMean(arr))} · t ${num(tStat(arr))} · 양의달 ${pct(fracPositive(arr) * 100)}`);
    console.log(`fold1 ${seg(folds[0], foldMonths[0])}`);
    console.log(`fold2 ${seg(folds[1], foldMonths[1])}`);
    console.log(`fold3 ${seg(folds[2], foldMonths[2])}`);
    if (ff) {
      const y: number[] = [], mkt: number[] = [], smb: number[] = [], hml: number[] = [];
      for (const s of series) { const fac = ff[s.m]; if (!fac) continue; y.push(s.ls); mkt.push(fac.mktrf); smb.push(fac.smb); hml.push(fac.hml); }
      const ff3 = ols(y, [mkt, smb, hml]);
      console.log(`FF3 알파 ${pct(ff3.coef[0] * 12)} · t ${num(ff3.t[0])}`);
    }
    console.log(`▶ 3구간 부호 [${signs.join(", ")}] → ${consistent ? "✅ 단단(3/3 동일 방향)" : "⚠️ 취약(구간별 뒤집힘)"}`);
  }
  console.log(`\n※ 판정: 3구간 부호 일치 + 전체 t 유의 = 등급 유지 / 부호 뒤집힘 = 정직 하향. 수익 '수준'은 편향 과대(방향·일관성만).`);
}
run();
