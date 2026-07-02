import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const syms = ["NVDA", "JNJ", "JPM"];
const val = (o, k) =>
  o && o[k] != null ? (typeof o[k] === "object" && o[k].raw != null ? o[k].raw : o[k]) : "MISSING";

for (const s of syms) {
  try {
    const r = await yf.quoteSummary(s, {
      modules: ["assetProfile", "incomeStatementHistory", "balanceSheetHistory", "cashflowStatementHistory", "defaultKeyStatistics"],
    });
    const inc = r.incomeStatementHistory?.incomeStatementHistory ?? [];
    const bal = r.balanceSheetHistory?.balanceSheetStatements ?? [];
    const cf = r.cashflowStatementHistory?.cashflowStatements ?? [];
    console.log("\n===== " + s + " | sector: " + (r.assetProfile?.sector) + " | industry: " + (r.assetProfile?.industry));
    console.log("years — income:", inc.length, "balance:", bal.length, "cashflow:", cf.length);
    console.log("income keys :", Object.keys(inc[0] || {}).join(","));
    console.log("balance keys :", Object.keys(bal[0] || {}).join(","));
    console.log("cashflow keys:", Object.keys(cf[0] || {}).join(","));
    for (let y = 0; y < 2; y++) {
      console.log(
        ` [Y${y}] rev=${val(inc[y], "totalRevenue")} gross=${val(inc[y], "grossProfit")} cor=${val(inc[y], "costOfRevenue")} ni=${val(inc[y], "netIncome")}` +
        ` | assets=${val(bal[y], "totalAssets")} curA=${val(bal[y], "totalCurrentAssets")} curL=${val(bal[y], "totalCurrentLiabilities")} ltd=${val(bal[y], "longTermDebt")}` +
        ` | cfo=${val(cf[y], "totalCashFromOperatingActivities")}`
      );
    }
    console.log("sharesOutstanding(now):", r.defaultKeyStatistics?.sharesOutstanding, "| endDates:", inc.map((x) => x.endDate?.fmt || x.endDate).join(" "));
  } catch (e) {
    console.log(s, "ERROR", String(e));
  }
}
