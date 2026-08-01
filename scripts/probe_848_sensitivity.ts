// STEP 848 §6·§7 — 도미노 기준 민감도(WACC·성장·마진 → GAP) + 25년 컷 초과 조건. 순수 계산.
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";
const D: RevDcfDrivers = { startingSales: 3618.8, salesGrowth: 0.07, operatingMargin: 0.175, startingMargin: 0.1739, taxRate: 0.165, fixedCapitalRate: 0.15, workingCapitalRate: 0.10 };
const M: RevDcfMarket = { wacc: 0.05357, inflation: 0.016, sharePrice: 418, sharesOutstanding: 39.35, debt: 4170, nonOperatingAssets: 391.9 };
const gapOf = (d: RevDcfDrivers, m: RevDcfMarket): string => { const r = runRevDcf(d, m, { maxYears: 100 }); return r.verdict.kind === "years" ? String(r.verdict.gap) : r.verdict.kind === "over_cap" ? `25+(${(r.verdict.explainedPct * 100).toFixed(0)}%)` : r.verdict.kind; };
const base = gapOf(D, M);
console.log(`기준(도미노) GAP = ${base}\n`);

console.log("=== §6 WACC 민감도 (±) ===");
for (const dw of [-0.02, -0.01, -0.005, 0, 0.005, 0.01, 0.02]) console.log(`  WACC ${((M.wacc + dw) * 100).toFixed(3)}% (${dw >= 0 ? "+" : ""}${(dw * 100).toFixed(1)}p) → GAP ${gapOf(D, { ...M, wacc: M.wacc + dw })}`);
console.log("=== 성장률 ±1%p ===");
for (const dg of [-0.01, 0, 0.01]) console.log(`  g ${((D.salesGrowth + dg) * 100).toFixed(1)}% → GAP ${gapOf({ ...D, salesGrowth: D.salesGrowth + dg }, M)}`);
console.log("=== 마진 ±1%p ===");
for (const dm of [-0.01, 0, 0.01]) console.log(`  margin ${((D.operatingMargin + dm) * 100).toFixed(1)}% → GAP ${gapOf({ ...D, operatingMargin: D.operatingMargin + dm }, M)}`);

// driver 영향력 순위 (±1%p 기준 |ΔGAP|; WACC도 ±1%p로 통일)
const num = (s: string) => (/^\d+$/.test(s) ? +s : 100);
const b = num(base);
const impacts = [
  ["WACC", Math.abs(num(gapOf(D, { ...M, wacc: M.wacc + 0.01 })) - b) + Math.abs(num(gapOf(D, { ...M, wacc: M.wacc - 0.01 })) - b)],
  ["성장률", Math.abs(num(gapOf({ ...D, salesGrowth: D.salesGrowth + 0.01 }, M)) - b) + Math.abs(num(gapOf({ ...D, salesGrowth: D.salesGrowth - 0.01 }, M)) - b)],
  ["마진", Math.abs(num(gapOf({ ...D, operatingMargin: D.operatingMargin + 0.01 }, M)) - b) + Math.abs(num(gapOf({ ...D, operatingMargin: D.operatingMargin - 0.01 }, M)) - b)],
].sort((x, y) => (y[1] as number) - (x[1] as number));
console.log("\n=== driver 영향력 순위 (±1%p 총 |ΔGAP|년) ===");
for (const [k, v] of impacts) console.log(`  ${k}: ${v}년`);

console.log("\n=== §7 25년 컷 초과 조건 (성장·마진을 올리면) ===");
for (const g of [0.07, 0.09, 0.11, 0.13, 0.15]) console.log(`  g=${(g * 100).toFixed(0)}% → GAP ${gapOf({ ...D, salesGrowth: g }, M)}`);
for (const mg of [0.175, 0.20, 0.25, 0.30]) console.log(`  margin=${(mg * 100).toFixed(0)}% → GAP ${gapOf({ ...D, operatingMargin: mg }, M)}`);
