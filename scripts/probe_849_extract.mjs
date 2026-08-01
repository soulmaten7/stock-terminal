/**
 * STEP 849 — 604 발행사 companyfacts에서 부채·주식수·현금+유가증권 추출(연도별). 재실행 안전.
 * 출력: docs/probe_849_raw.json  (cik → {year → {debtCore, debtWithLease, sharesDei, sharesGaap, sharesDilutedWavg, cash, securities}})
 * 실행: node scripts/probe_849_extract.mjs [batch=700]
 */
import fs from "node:fs";
const UA = process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app";
const BATCH = Number(process.argv[2] || 700);
const OUT = "docs/probe_849_raw.json";
const PROG = "/tmp/849_extract_progress.txt";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const YS = [2019, 2020, 2021, 2022, 2023, 2024]; // 2019 포함(도미노 4170 재현)
const calYear = (end) => { const y = +String(end).slice(0, 4), m = +String(end).slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f) => /^10-K/.test(String(f));

function annualStock(units, tags, unit = "USD") {
  const out = {};
  for (const t of tags) { const arr = units?.[t]?.units?.[unit]; if (!Array.isArray(arr)) continue;
    for (const e of arr) { if (!isAnnual(e.form) || e.val == null) continue; if (e.fp && e.fp !== "FY") continue; const y = calYear(e.end); if (out[y] == null) out[y] = e.val; } }
  return out;
}
function annualFlow(units, tags, unit = "USD") {
  const out = {};
  for (const t of tags) { const arr = units?.[t]?.units?.[unit]; if (!Array.isArray(arr)) continue;
    for (const e of arr) { if (!isAnnual(e.form) || e.val == null || !e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; const y = calYear(e.end); if (out[y] == null) out[y] = e.val; } }
  return out;
}
const sumMaps = (...maps) => { const o = {}; for (const y of YS) { let s = null; for (const m of maps) if (m[y] != null) s = (s || 0) + m[y]; if (s != null) o[y] = s; } return o; };

const DEBT_LT = ["LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations"];
const DEBT_CUR = ["LongTermDebtCurrent", "DebtCurrent"];
const LEASE = ["OperatingLeaseLiabilityNoncurrent", "OperatingLeaseLiabilityCurrent", "FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent"];
const CASH = ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"];
const SEC = ["ShortTermInvestments", "MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesCurrent", "OtherShortTermInvestments"];

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
      const dei = j.facts?.["dei"] || {};
      const debtLt = annualStock(g, DEBT_LT), debtCur = annualStock(g, DEBT_CUR), lease = annualStock(g, LEASE);
      const debtCore = sumMaps(debtLt, debtCur);
      const debtWithLease = sumMaps(debtLt, debtCur, lease);
      const cash = annualStock(g, CASH), sec = annualStock(g, SEC);
      store.perCik[cik] = {
        debtCore, debtWithLease,
        sharesDei: annualStock(dei, ["EntityCommonStockSharesOutstanding"], "shares"),
        sharesGaap: annualStock(g, ["CommonStockSharesOutstanding"], "shares"),
        sharesDilutedWavg: annualFlow(g, ["WeightedAverageNumberOfDilutedSharesOutstanding"], "shares"),
        cash, securities: sec, cashPlusSec: sumMaps(cash, sec),
      };
    }
  } catch { store.perCik[cik] = { _err: "EX" }; }
  n++; fs.appendFileSync(PROG, `${n}/${Math.min(BATCH, todo.length)} cik=${cik}\n`);
  if (n % 25 === 0) save();
}
save();
fs.appendFileSync(PROG, `배치완료 ${n} 누적 ${Object.keys(store.perCik).length}/${ciks.length}\n`);
console.log("batch done", n, "total", Object.keys(store.perCik).length, "/", ciks.length);
