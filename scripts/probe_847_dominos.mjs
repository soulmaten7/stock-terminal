/**
 * STEP 847 §5 — 도미노피자(DPZ) 조달 검증: 우리 파이프라인 산출값 vs 원전 T8 Inputs(2020-09 기준).
 * DPZ companyfacts 전체 이력 → FY2015~2019(2020-09 시점의 최근 5년)로 driver 산출.
 * 실행: node scripts/probe_847_dominos.mjs
 */
const UA = process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app";
const DPZ = "0001286681";
const calYear = (end) => { const y = +String(end).slice(0, 4), m = +String(end).slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f) => /^10-K/.test(String(f));

function annualMap(gaap, tags, kind) {
  const out = {};
  for (const t of tags) { const arr = gaap[t]?.units?.USD || gaap[t]?.units?.shares; if (!Array.isArray(arr)) continue;
    for (const e of arr) { if (!isAnnual(e.form) || e.val == null) continue;
      if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
      else { if (e.fp && e.fp !== "FY") continue; }
      const y = calYear(e.end); if (out[y] == null) out[y] = e.val; } }
  return out;
}

const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${DPZ}.json`, { headers: { "User-Agent": UA } });
const j = await r.json();
const g = j.facts["us-gaap"];
const dei = j.facts["dei"] || {};

const rev = annualMap(g, ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax"], "flow");
const oi = annualMap(g, ["OperatingIncomeLoss"], "flow");
const pretax = annualMap(g, ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments"], "flow");
const taxExp = annualMap(g, ["IncomeTaxExpenseBenefit"], "flow");
const cashTax = annualMap(g, ["IncomeTaxesPaidNet", "IncomeTaxesPaid"], "flow");
const interest = annualMap(g, ["InterestExpense", "InterestExpenseNonoperating"], "flow");
const capex = annualMap(g, ["PaymentsToAcquirePropertyPlantAndEquipment"], "flow");
const acq = annualMap(g, ["PaymentsToAcquireBusinessesNetOfCashAcquired"], "flow");
const dna = annualMap(g, ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization"], "flow");
const ar = annualMap(g, ["AccountsReceivableNetCurrent"], "stock");
const inv = annualMap(g, ["InventoryNet"], "stock");
const oca = annualMap(g, ["OtherAssetsCurrent", "PrepaidExpenseAndOtherAssetsCurrent"], "stock");
const ap = annualMap(g, ["AccountsPayableCurrent"], "stock");
const accr = annualMap(g, ["AccruedLiabilitiesCurrent"], "stock");
const ocl = annualMap(g, ["OtherLiabilitiesCurrent", "OtherAccruedLiabilitiesCurrent"], "stock");
const debtLT = annualMap(g, ["LongTermDebtNoncurrent", "LongTermDebt"], "stock");
const debtCur = annualMap(g, ["LongTermDebtCurrent", "DebtCurrent"], "stock");
const cash = annualMap(g, ["CashAndCashEquivalentsAtCarryingValue"], "stock");
const shares = annualMap(dei, ["EntityCommonStockSharesOutstanding"], "stock");

const M = (x) => (x == null ? null : +(x / 1e6).toFixed(2)); // → 백만달러(원전 표기)
const W = [2015, 2016, 2017, 2018, 2019];
const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;

// 매출성장 5yr CAGR (FY2014→2019)
const cagr = rev[2014] && rev[2019] ? (rev[2019] / rev[2014]) ** (1 / 5) - 1 : null;
// 영업이익률 5yr 평균 / 시작
const margins = W.map((y) => (rev[y] && oi[y] != null ? oi[y] / rev[y] : null)).filter((x) => x != null);
const startMargin = rev[2019] && oi[2019] != null ? oi[2019] / rev[2019] : null;
// 현금세율 5yr 평균
const ctrArr = W.map((y) => { if (!oi[y] || !pretax[y]) return null; const bookRate = taxExp[y] / pretax[y]; const unlev = (cashTax[y] || 0) + Math.abs(interest[y] || 0) * bookRate; return unlev / oi[y]; }).filter((x) => x != null);
// 증분고정 5yr 평균
const fixArr = W.slice(1).map((y) => { const dRev = rev[y] - rev[y - 1]; if (!dRev) return null; const net = (Math.abs(capex[y] || 0) + Math.abs(acq[y] || 0)) - Math.abs(dna[y] || 0); return net / dRev; }).filter((x) => x != null);
// 증분운전 5yr 평균
const nwc = (y) => 0.02 * rev[y] + (ar[y] || 0) + (inv[y] || 0) + (oca[y] || 0) - (ap[y] || 0) - (accr[y] || 0) - (ocl[y] || 0);
const wcArr = W.slice(1).map((y) => { const dRev = rev[y] - rev[y - 1]; if (!dRev) return null; return (nwc(y) - nwc(y - 1)) / dRev; }).filter((x) => x != null);

const table = [
  ["매출성장률(5yr CAGR)", "7%", cagr != null ? (cagr * 100).toFixed(1) + "%" : "?"],
  ["영업이익률(5yr 평균)", "17.5%", margins.length ? (avg(margins) * 100).toFixed(1) + "%" : "?"],
  ["시작 영업이익률(FY2019)", "17.39%", startMargin != null ? (startMargin * 100).toFixed(2) + "%" : "?"],
  ["현금세율(5yr 평균)", "16.5%", ctrArr.length ? (avg(ctrArr) * 100).toFixed(1) + "%" : "?"],
  ["증분고정자본율(5yr 평균)", "15%", fixArr.length ? (avg(fixArr) * 100).toFixed(1) + "%" : "?"],
  ["증분운전자본율(5yr 평균)", "10%", wcArr.length ? (avg(wcArr) * 100).toFixed(1) + "%" : "?"],
  ["자본비용(WACC)", "5.357%", "조립필요(rf+β×ERP+부채) — 별도"],
  ["주식수(M)", "39.35", shares[2019] ? M(shares[2019]) : (shares[2020] ? M(shares[2020]) : "?")],
  ["부채(총, FY2019)", "4,170", debtLT[2019] != null ? M((debtLT[2019] || 0) + (debtCur[2019] || 0)) : "?"],
  ["현금·유가증권(FY2019)", "391.9", cash[2019] != null ? M(cash[2019]) : "?"],
];
console.log("=== 도미노 대조표 (원전 T8 2020-09 vs 우리 파이프라인 · FY2015~2019) ===");
for (const [k, o, u] of table) console.log(`${k.padEnd(28)} | 원전 ${String(o).padStart(8)} | 우리 ${u}`);
console.log("\n원자료(백만$):");
console.log("rev:", W.concat(2014).map((y) => `${y}:${M(rev[y])}`).join(" "));
console.log("oi:", W.map((y) => `${y}:${M(oi[y])}`).join(" "));
console.log("cashTax:", W.map((y) => `${y}:${M(cashTax[y])}`).join(" "), "| interest:", W.map((y) => `${y}:${M(interest[y])}`).join(" "));
console.log("capex:", W.map((y) => `${y}:${M(capex[y])}`).join(" "), "| dna:", W.map((y) => `${y}:${M(dna[y])}`).join(" "), "| acq:", W.map((y) => `${y}:${M(acq[y])}`).join(" "));

import fs from "node:fs";
fs.writeFileSync("docs/probe_847_dominos.json", JSON.stringify({ table, rev, oi, cashTax, interest, capex, dna, acq, shares: shares[2019], debt: (debtLT[2019] || 0) + (debtCur[2019] || 0), cash: cash[2019] }, null, 2));
