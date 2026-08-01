/**
 * STEP 847 extract — 604 발행사 companyfacts에서 driver 3/4/5 원전 재료를 연도별로 추출(값까지).
 * 재실행 안전(resumable) · 값 추출은 companyfacts(frames 아님). CY2020~2024 · 10-K 계열 · 달력연도 배정.
 * 출력: docs/probe_847_raw.json  (cik → { year → {components} })
 * 실행: node scripts/probe_847_extract.mjs [batch=150]
 */
import fs from "node:fs";
const UA = process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app";
const BATCH = Number(process.argv[2] || 150);
const OUT = "docs/probe_847_raw.json";
const PROG = "/tmp/847_extract_progress.txt";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const YS = [2020, 2021, 2022, 2023, 2024];
const calYear = (end) => { const y = +String(end).slice(0, 4), m = +String(end).slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f) => /^10-K/.test(String(f));

// flow(기간)·stock(시점) 태그 후보 — 값은 coalesce(첫 존재)로.
const FLOW = {
  rev: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"],
  oi: ["OperatingIncomeLoss"],
  pretax: ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"],
  taxExp: ["IncomeTaxExpenseBenefit"],
  cashTax: ["IncomeTaxesPaidNet", "IncomeTaxesPaid"],
  interest: ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestIncomeExpenseNet"],
  capex: ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"],
  capsw: ["PaymentsToDevelopSoftware", "CapitalizedComputerSoftwareAdditions"],
  othinv: ["PaymentsForProceedsFromOtherInvestingActivities"],
  acq: ["PaymentsToAcquireBusinessesNetOfCashAcquired", "PaymentsToAcquireBusinessesGross"],
  dna: ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndAccretionNet"],
};
const STOCK = {
  ar: ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent", "AccountsAndOtherReceivablesNetCurrent"],
  inv: ["InventoryNet", "InventoryFinishedGoodsNetOfReserves"],
  oca: ["OtherAssetsCurrent", "PrepaidExpenseAndOtherAssetsCurrent"],
  dta: ["DeferredIncomeTaxAssetsNet", "DeferredTaxAssetsNetCurrent"],
  ap: ["AccountsPayableCurrent", "AccountsPayableTradeCurrent"],
  accr: ["AccruedLiabilitiesCurrent", "AccruedLiabilitiesCurrentAndNoncurrent"],
  ocl: ["OtherLiabilitiesCurrent", "OtherAccruedLiabilitiesCurrent"],
  assetsCur: ["AssetsCurrent"],
  liabCur: ["LiabilitiesCurrent"],
  cash: ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"],
};

// tag → {calYear: val}. flow=기간(300~400일), stock=시점(fp=FY 우선). 최신 filed 우선.
function annualMap(gaap, tag, kind) {
  const arr = gaap[tag]?.units?.USD;
  if (!Array.isArray(arr)) return null;
  const by = {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") {
      if (!e.start || !e.end) continue;
      const days = (Date.parse(e.end) - Date.parse(e.start)) / 86400000;
      if (days < 300 || days > 400) continue;
    } else {
      if (e.fp && e.fp !== "FY") continue; // 시점은 연차 결산일만
    }
    const y = calYear(e.end);
    const prev = by[y];
    if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: e.filed };
  }
  const o = {};
  for (const y of Object.keys(by)) o[y] = by[y].val;
  return Object.keys(o).length ? o : null;
}
function coalesce(gaap, tags, kind) {
  const out = {}; const usedTag = {};
  for (const t of tags) { const m = annualMap(gaap, t, kind); if (!m) continue; for (const y of Object.keys(m)) if (out[y] == null) { out[y] = m[y]; usedTag[y] = t; } }
  return { vals: out, tags: usedTag };
}

const ciks = JSON.parse(fs.readFileSync("/tmp/847_ciks.json", "utf8"));
let store = { perCik: {} };
if (fs.existsSync(OUT)) { try { store = JSON.parse(fs.readFileSync(OUT, "utf8")); store.perCik = store.perCik || {}; } catch {} }
const todo = ciks.filter((c) => !store.perCik[c]);
fs.writeFileSync(PROG, `시작 ${new Date().toISOString()} 남은 ${todo.length}/${ciks.length}\n`);

const save = () => { store.measuredAt = new Date().toISOString(); store.issuers = ciks.length; store.done = Object.keys(store.perCik).length; fs.writeFileSync(OUT, JSON.stringify(store)); };
const wall = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);

let n = 0;
for (const cik of todo.slice(0, BATCH)) {
  const p = String(cik).padStart(10, "0");
  try {
    const r = await wall(fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${p}.json`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) }), 30000);
    await sleep(120);
    if (!r.ok) { store.perCik[cik] = { _err: r.status }; }
    else {
      const j = await wall(r.json(), 30000);
      const g = j.facts?.["us-gaap"] || {};
      const rec = { comp: {}, tagUsed: {} };
      for (const [k, tags] of Object.entries(FLOW)) { const c = coalesce(g, tags, "flow"); rec.comp[k] = c.vals; rec.tagUsed[k] = c.tags; }
      for (const [k, tags] of Object.entries(STOCK)) { const c = coalesce(g, tags, "stock"); rec.comp[k] = c.vals; rec.tagUsed[k] = c.tags; }
      store.perCik[cik] = rec;
    }
  } catch { store.perCik[cik] = { _err: "EX" }; }
  n++; fs.appendFileSync(PROG, `${n}/${Math.min(BATCH, todo.length)} cik=${cik}\n`);
  if (n % 25 === 0) save();
}
save();
fs.appendFileSync(PROG, `배치완료 ${n} 누적 ${Object.keys(store.perCik).length}/${ciks.length}\n`);
console.log("batch done", n, "total", Object.keys(store.perCik).length, "/", ciks.length, "remaining", todo.length - n);
