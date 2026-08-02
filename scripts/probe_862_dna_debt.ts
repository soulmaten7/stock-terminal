/**
 * STEP 862 — D&A 우선체인 회수율 + 합계≈분리 검산 + 부채 무차입/결측 분리. 🔴 읽기전용 SEC fetch.
 * 실행: npx tsx scripts/probe_862_dna_debt.ts
 */
import fs from "node:fs";
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
type Gaap = Record<string, { units?: Record<string, Fact[]> }>;
const YS = [2020, 2021, 2022, 2023, 2024];
const INV = [2021, 2022, 2023, 2024]; // marginal이 실제 쓰는 해
const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));
function annualMap(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const arr = g[tag]?.units?.[unit]; const by: Record<number, { val: number; filed: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; if (!e.end) continue; }
    const y = calYear(e.end); const p = by[y]; if (!p || String(e.filed) > String(p.filed)) by[y] = { val: e.val, filed: String(e.filed) };
  }
  const o: Record<number, number> = {}; for (const y of Object.keys(by)) o[+y] = by[+y].val; return o;
}
const coalesce = (g: Gaap, tags: string[], k: "flow" | "stock", u = "USD") => { const v: Record<number, number> = {}; for (const t of tags) { const m = annualMap(g, t, k, u); for (const y of Object.keys(m)) if (v[+y] == null) v[+y] = m[+y]; } return v; };
const has5 = (m: Record<number, number>) => YS.every((y) => m[y] != null);
const hasInv = (m: Record<number, number>) => INV.every((y) => m[y] != null);
const latest = (m: Record<number, number>) => { for (let i = YS.length - 1; i >= 0; i--) if (m[YS[i]] != null) return m[YS[i]]; return null; };

const DNA_TOTAL = ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndDepletion", "DepreciationAmortizationAndAccretionNet"];
const DEPR = ["Depreciation"], AMORT = ["AmortizationOfIntangibleAssets"];
const CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"];
const DEBT_SINGLE = ["DebtAndCapitalLeaseObligations"], DEBT_LT = ["LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations"], DEBT_CUR = ["LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"], FIN_LEASE = ["FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent"];

function dnaChain(g: Gaap) {
  const tot = coalesce(g, DNA_TOTAL, "flow"), dp = coalesce(g, DEPR, "flow"), am = coalesce(g, AMORT, "flow");
  const dna: Record<number, number> = {}; let src = "none";
  for (const y of YS) { if (tot[y] != null) { dna[y] = tot[y]; if (src === "none") src = "total"; } else if (dp[y] != null && am[y] != null) { dna[y] = dp[y] + am[y]; src = src === "total" ? "mixed" : "split"; } }
  return { dna, src, tot, dp, am };
}

async function main() {
  const ciks: number[] = JSON.parse(fs.readFileSync("/tmp/847_ciks.json", "utf8"));
  let fetched = 0, fail = 0;
  const c: Record<string, number> = {}; const add = (k: string) => (c[k] = (c[k] ?? 0) + 1);
  const relErrs: number[] = []; let bothYears = 0;
  let lastCall = 0; const thr = async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };
  for (const cik of ciks) {
    await thr();
    let g: Gaap = {};
    try { const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) }); if (!r.ok) { fail++; continue; } g = (await r.json()).facts?.["us-gaap"] ?? {}; } catch { fail++; continue; }
    fetched++;
    const { dna, src, tot, dp, am } = dnaChain(g);
    if (has5(dna)) add("dna5"); if (hasInv(dna)) add("dnaInv");
    add("src_" + src);
    // capex도 있어야 marginal 성립
    const capex = coalesce(g, CAPEX, "flow"); if (hasInv(capex) && hasInv(dna)) add("marginalMaterial");
    // §1.2 검산: 합계와 분리 둘 다 있는 해에서 합계 ≈ 감가+무형
    for (const y of YS) if (tot[y] != null && dp[y] != null && am[y] != null && tot[y] !== 0) { bothYears++; relErrs.push(Math.abs(tot[y] - (dp[y] + am[y])) / Math.abs(tot[y])); }
    // §2 부채: 태그 유무 → 무차입 vs 결측
    const single = annualMap(g, DEBT_SINGLE[0], "stock");
    const debtMap = latest(single) != null ? single : (() => { const s: Record<number, number> = {}; for (const y of YS) { let v: number | null = null; for (const t of [...DEBT_LT, ...DEBT_CUR, ...FIN_LEASE]) { const m = annualMap(g, t, "stock"); if (m[y] != null) v = (v ?? 0) + m[y]; } if (v != null) s[y] = v; } return s; })();
    if (latest(debtMap) != null) add("debt_present");
    else { const iMap = annualMap(g, "InterestExpense", "flow"); const iLy = latest(iMap); if (iLy != null && Math.abs(iLy) > 0) add("debt_missingReal"); else add("debt_zero"); }
    if (fetched % 100 === 0) console.log(`  ...${fetched}/${ciks.length}`);
  }
  const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) * p)] : NaN; };
  console.log(`\n=== §1 D&A 회수 (fetch ${fetched}/${ciks.length} · fail ${fail}) ===`);
  console.log(`  D&A 5년 확보: ${c.dna5 ?? 0}/${fetched} = ${((c.dna5 ?? 0) / fetched * 100).toFixed(1)}% (결측 ${((1 - (c.dna5 ?? 0) / fetched) * 100).toFixed(1)}%) [861: 78.3%확보/21.7%결측]`);
  console.log(`  D&A INV(2021~24) 확보: ${c.dnaInv ?? 0}/${fetched} = ${((c.dnaInv ?? 0) / fetched * 100).toFixed(1)}%`);
  console.log(`  소스: total ${c.src_total ?? 0} · split(분리합) ${c.src_split ?? 0} · mixed ${c.src_mixed ?? 0} · none ${c.src_none ?? 0}`);
  console.log(`  capex∩D&A INV 둘다(marginal 재료): ${c.marginalMaterial ?? 0}/${fetched} = ${((c.marginalMaterial ?? 0) / fetched * 100).toFixed(1)}%`);
  console.log(`\n=== §1.2 검산: 합계 ≈ 감가+무형 (둘 다 보고한 ${bothYears} 연도-종목) ===`);
  if (relErrs.length) console.log(`  상대오차 중앙 ${(q(relErrs, .5) * 100).toFixed(2)}% · p90 ${(q(relErrs, .9) * 100).toFixed(2)}% · ≤10% 비율 ${(relErrs.filter((e) => e <= 0.10).length / relErrs.length * 100).toFixed(1)}% · ≤1% ${(relErrs.filter((e) => e <= 0.01).length / relErrs.length * 100).toFixed(1)}%`);
  console.log(`\n=== §2 부채 분리 ===`);
  console.log(`  부채 있음(present): ${c.debt_present ?? 0} · 무차입(zero·값0정상): ${c.debt_zero ?? 0} · 진짜 결측(이자비용 있는데 태그부재): ${c.debt_missingReal ?? 0}`);
  fs.writeFileSync("docs/probe_862_output.json", JSON.stringify(c, null, 1));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
