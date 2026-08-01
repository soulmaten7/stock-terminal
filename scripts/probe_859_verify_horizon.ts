/** STEP 859 §3 — TS 엔진(runRevDcf·maxYears=25)이 T8 정답지(probe_859_oracle.json)와 일치하나. 일회성. */
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "@/lib/revdcf/engine";

const DOM = { startingSales: 3618.8, g: 0.07, opMargin: 0.175, startMargin: 0.1739, tax: 0.165, fixedRate: 0.15, workRate: 0.10, wacc: 0.05357, inflation: 0.016, price: 418, shares: 39.35, debt: 4170, nonOp: 391.9 };

function run(k: typeof DOM) {
  const d: RevDcfDrivers = { startingSales: k.startingSales, salesGrowth: k.g, operatingMargin: k.opMargin, startingMargin: k.startMargin, taxRate: k.tax, fixedCapitalRate: k.fixedRate, workingCapitalRate: k.workRate };
  const m: RevDcfMarket = { wacc: k.wacc, inflation: k.inflation, sharePrice: k.price, sharesOutstanding: k.shares, debt: k.debt, nonOperatingAssets: k.nonOp };
  const r = runRevDcf(d, m, { maxYears: 25 });
  const v = r.verdict;
  const verdict = v.kind === "over_cap" ? "25+" : v.kind === "below_one" ? "<1" : v.kind;
  const gap = v.kind === "years" ? v.gap : null;
  const explained = v.kind === "over_cap" ? v.explainedPct : null;
  const ps25 = r.years[25]?.perShare;
  return { verdict, gap, explained, ps25 };
}

const cases: [string, typeof DOM][] = [
  ["정상(도미노 8년)", DOM],
  ["25+ 유발(WACC 0.15)", { ...DOM, wacc: 0.15 }],
  ["<1 유발(주가 50)", { ...DOM, price: 50 }],
];

// T8 정답지 (파이썬 재구현 · 캐시 도미노 앵커 오차 0)
const oracle: Record<string, { verdict: string; gap: number | null; explained: number | null }> = {
  "정상(도미노 8년)": { verdict: "years", gap: 8, explained: null },
  "25+ 유발(WACC 0.15)": { verdict: "25+", gap: null, explained: 0.1294 },
  "<1 유발(주가 50)": { verdict: "<1", gap: null, explained: null },
};

console.log("=== §3 TS 엔진(maxYears=25) vs T8 정답지 ===");
let allPass = true;
for (const [name, k] of cases) {
  const g = run(k);
  const o = oracle[name];
  const vOk = g.verdict === o.verdict;
  const gOk = g.gap === o.gap;
  const eOk = o.explained == null ? g.explained == null : g.explained != null && Math.abs(g.explained - o.explained) < 0.001;
  const pass = vOk && gOk && eOk;
  allPass = allPass && pass;
  const ex = g.explained != null ? (g.explained * 100).toFixed(2) + "%" : "—";
  console.log(`  ${pass ? "✅" : "❌"} ${name}: TS verdict=${g.verdict} gap=${g.gap} explained=${ex} 25년가치=$${g.ps25?.toFixed(2)} | 정답 ${o.verdict}/${o.gap}/${o.explained ?? "—"}`);
}
console.log(allPass ? "\n🟢 3케이스 전부 일치 — 통과" : "\n🔴 불일치 — 커밋 금지·원인 규명");
process.exit(allPass ? 0 : 1);
