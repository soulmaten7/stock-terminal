/**
 * STEP 861 — DoD 항목 2(입력 검증): SEC 필드별 5년 연속 확보 결측률을 순서 무관 독립으로 재측정.
 * 🔴 읽기 전용(SEC fetch + 계산). DB/코드 변경 0. drivers.ts의 헬퍼·태그를 그대로 복사(충실).
 * 결측률 정의 = "YS=[2020..2024] 5년 전부 값 존재(has5)". 파이프라인 단락(short-circuit) 무관 독립 측정.
 * 실행: npx tsx scripts/probe_861_inputs.ts
 */
import fs from "node:fs";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
// ── drivers.ts 그대로 복사 (2026-08-02 판독) ──
type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
type Gaap = Record<string, { units?: Record<string, Fact[]> }>;
const YS = [2020, 2021, 2022, 2023, 2024];
const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));
function annualMap(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const arr = g[tag]?.units?.[unit]; const by: Record<number, { val: number; filed: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; if (!e.end) continue; }
    const y = calYear(e.end); const prev = by[y]; if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: String(e.filed) };
  }
  const o: Record<number, number> = {}; for (const y of Object.keys(by)) o[+y] = by[+y].val; return o;
}
function coalesce(g: Gaap, tags: string[], kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const vals: Record<number, number> = {};
  for (const t of tags) { const m = annualMap(g, t, kind, unit); for (const y of Object.keys(m)) if (vals[+y] == null) vals[+y] = m[+y]; }
  return vals;
}
const has5 = (m: Record<number, number>) => YS.every((y) => m[y] != null);
const latest = (m: Record<number, number>) => { for (let i = YS.length - 1; i >= 0; i--) if (m[YS[i]] != null) return m[YS[i]]; return null; };

const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
const PRETAX = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"];
const INTEREST = ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestIncomeExpenseNet"];
const PPE = ["PropertyPlantAndEquipmentNet", "PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization", "PropertyPlantAndEquipmentExcludingLessorAssetUnderOperatingLeaseAfterAccumulatedDepreciation", "PropertyPlantAndEquipmentOtherNet", "PublicUtilitiesPropertyPlantAndEquipmentNet"];
const CASH_OP = ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"];
const CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"];
const DNA = ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndAccretionNet"];
const SHARES_DIL = ["WeightedAverageNumberOfDilutedSharesOutstanding"];
const SHARES_MORE = ["WeightedAverageNumberOfSharesOutstandingBasic", "CommonStockSharesOutstanding"];
const DEBT_LT = ["LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations"];
const DEBT_CUR = ["LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"];
const FIN_LEASE = ["FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent"];
const DEBT_SINGLE = ["DebtAndCapitalLeaseObligations"];

async function main() {
  const ciks: number[] = JSON.parse(fs.readFileSync("/tmp/847_ciks.json", "utf8"));
  const N = ciks.length;
  const cnt: Record<string, number> = {}; const add = (k: string) => (cnt[k] = (cnt[k] ?? 0) + 1);
  let fetched = 0, fetchFail = 0;
  // sign check: capex/dna 부호 표본
  const signSample: { cik: number; capex: number | null; dna: number | null }[] = [];
  let lastCall = 0; const throttle = async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };

  for (const cik of ciks) {
    await throttle();
    let g: Gaap = {}, dei: Gaap = {};
    try {
      const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) });
      if (!r.ok) { fetchFail++; continue; }
      const j = await r.json(); g = j.facts?.["us-gaap"] ?? {}; dei = j.facts?.["dei"] ?? {};
    } catch { fetchFail++; continue; }
    fetched++;

    // 독립 has5 (순서 무관)
    if (has5(coalesce(g, REV, "flow"))) add("revenue");
    // OI 합성: 각 연도 OperatingIncomeLoss OR (rev & CostsAndExpenses) OR (pretax & interest)
    const oiMap = annualMap(g, "OperatingIncomeLoss", "flow"), cae = annualMap(g, "CostsAndExpenses", "flow"), rev = coalesce(g, REV, "flow"), px = coalesce(g, PRETAX, "flow"), it = coalesce(g, INTEREST, "flow");
    const oiOk = YS.every((y) => oiMap[y] != null || (rev[y] != null && cae[y] != null) || (px[y] != null && it[y] != null));
    if (oiOk) add("operatingIncome"); if (has5(oiMap)) add("operatingIncome_direct");
    if (has5(annualMap(g, "AssetsCurrent", "stock"))) add("assetsCurrent");
    if (has5(annualMap(g, "LiabilitiesCurrent", "stock"))) add("liabilitiesCurrent");
    if (has5(coalesce(g, CASH_OP, "stock"))) add("cashOp");
    if (has5(coalesce(g, PPE, "stock"))) add("ppe");
    // 주식수(희석 latest OR 폴백 OR dei)
    const shDil = latest(annualMap(g, SHARES_DIL[0], "flow", "shares"));
    const shMore = SHARES_MORE.map((t) => latest(annualMap(g, t, t.startsWith("Weighted") ? "flow" : "stock", "shares"))).find((v) => v != null);
    const shDei = latest(annualMap(dei, "EntityCommonStockSharesOutstanding", "stock", "shares"));
    if (shDil != null) add("sharesDiluted"); if (shDil != null || shMore != null || shDei != null) add("sharesAny");
    // 부채(있으면·0아님) — 단일 OR LT+cur+lease
    const debtSingle = latest(coalesce(g, DEBT_SINGLE, "stock"));
    const debtParts = [DEBT_LT, DEBT_CUR, FIN_LEASE].some((tags) => latest(coalesce(g, tags, "stock")) != null);
    if (debtSingle != null || debtParts) add("debtPresent");
    // marginal capex 재료
    const capexL = latest(coalesce(g, CAPEX, "stock")); const dnaL = latest(coalesce(g, DNA, "flow"));
    if (has5(coalesce(g, CAPEX, "flow"))) add("capex5yr");
    if (has5(coalesce(g, DNA, "flow"))) add("dna5yr");
    if (signSample.length < 8 && (capexL != null || dnaL != null)) signSample.push({ cik, capex: latest(coalesce(g, CAPEX, "flow")), dna: latest(coalesce(g, DNA, "flow")) });
    if (fetched % 100 === 0) console.log(`  ...${fetched}/${N}`);
  }

  console.log(`\n=== §1 SEC 필드 독립 5년 확보율 (분모 = fetch 성공 ${fetched}/${N} · fail ${fetchFail}) ===`);
  const pct = (k: string) => `${cnt[k] ?? 0}/${fetched} = ${((cnt[k] ?? 0) / fetched * 100).toFixed(1)}% 확보 · 결측 ${((1 - (cnt[k] ?? 0) / fetched) * 100).toFixed(1)}%`;
  for (const [label, k] of [["매출(REV union)", "revenue"], ["영업이익(합성:OI/Rev-CAE/Pretax+Int)", "operatingIncome"], ["  └ OperatingIncomeLoss 직접", "operatingIncome_direct"], ["AssetsCurrent", "assetsCurrent"], ["LiabilitiesCurrent", "liabilitiesCurrent"], ["현금(CASH_OP union)", "cashOp"], ["PP&E(union)", "ppe"], ["주식수(희석 직접)", "sharesDiluted"], ["  └ 주식수(희석/기본/dei any)", "sharesAny"], ["부채(있음·비영)", "debtPresent"], ["capex 5년(marginal)", "capex5yr"], ["D&A 5년(marginal)", "dna5yr"]] as [string, string][]) {
    console.log(`  ${label.padEnd(36)} ${pct(k)}`);
  }
  console.log("\n=== §3 capex·D&A 부호 표본 (현금흐름표 부호) ===");
  for (const s of signSample) console.log(`  CIK ${s.cik}: capex=${s.capex} · dna=${s.dna}`);
  fs.writeFileSync("docs/probe_861_output.json", JSON.stringify({ fetched, fetchFail, cnt }, null, 1));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
