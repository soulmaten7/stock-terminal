const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// F-Score 필드 → us-gaap 태그 후보(회사·연도별 편차 대비 여러 개)
const CONCEPTS = {
  netIncome: ["NetIncomeLoss"],
  totalAssets: ["Assets"],
  operatingCashFlow: ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"],
  totalRevenue: ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"],
  costOfRevenue: ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold"],
  grossProfit: ["GrossProfit"],
  currentAssets: ["AssetsCurrent"],
  currentLiabilities: ["LiabilitiesCurrent"],
  longTermDebt: ["LongTermDebtNoncurrent", "LongTermDebt"],
  shares: ["CommonStockSharesOutstanding", "WeightedAverageNumberOfSharesOutstandingBasic"],
};

function annualByFY(facts, tags) {
  for (const tag of tags) {
    const node = (facts["us-gaap"] && facts["us-gaap"][tag]) || (facts["dei"] && facts["dei"][tag]);
    if (!node || !node.units) continue;
    const arr = node.units.USD || node.units.shares || Object.values(node.units)[0] || [];
    const byFy = {};
    for (const e of arr) {
      if (e.form && String(e.form).startsWith("10-K") && e.fp === "FY" && e.fy) {
        if (!byFy[e.fy] || String(e.filed) > String(byFy[e.fy].filed)) byFy[e.fy] = e;
      }
    }
    const keys = Object.keys(byFy);
    if (keys.length) return { tag, byVal: Object.fromEntries(keys.map((fy) => [fy, byFy[fy].val])) };
  }
  return null;
}

async function main() {
  // ticker → CIK
  const tj = await (await fetch("https://www.sec.gov/files/company_tickers.json", { headers: UA })).json();
  const cikBy = {};
  for (const k in tj) cikBy[String(tj[k].ticker).toUpperCase()] = String(tj[k].cik_str).padStart(10, "0");

  for (const s of ["NVDA", "JNJ", "WMT", "MU"]) {
    const cik = cikBy[s];
    if (!cik) { console.log(s, "→ CIK 없음"); continue; }
    try {
      const cf = await (await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: UA })).json();
      console.log("\n===== " + s + " (CIK " + cik + ")");
      const got = {};
      for (const field in CONCEPTS) {
        const r = annualByFY(cf.facts, CONCEPTS[field]);
        got[field] = r;
        console.log(` ${field}: ${r ? "tag=" + r.tag + " | years=" + Object.keys(r.byVal).map(Number).sort((a,b)=>a-b).join(",") : "MISSING"}`);
      }
      const years = [...new Set(Object.values(got).filter(Boolean).flatMap((r) => Object.keys(r.byVal)))].map(Number).filter((y) => y >= 2014).sort((a, b) => a - b);
      for (const y of years) {
        const v = (f) => (got[f] && got[f].byVal[y] != null ? got[f].byVal[y] : "·");
        console.log(`  FY${y}: ni=${v("netIncome")} assets=${v("totalAssets")} cfo=${v("operatingCashFlow")} rev=${v("totalRevenue")} gross=${v("grossProfit")} cor=${v("costOfRevenue")} curA=${v("currentAssets")} curL=${v("currentLiabilities")} ltd=${v("longTermDebt")} sh=${v("shares")}`);
      }
    } catch (e) {
      console.log(s, "ERROR", String(e));
    }
    await sleep(400); // rate limit 여유
  }
}
main();
