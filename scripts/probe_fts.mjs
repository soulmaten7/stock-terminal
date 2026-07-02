import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const syms = ["NVDA", "JNJ", "JPM"];
const p1 = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
const p2 = new Date();

// F-Score 9개 기준에 필요한 후보 필드(정규화 키 — 실제 이름은 keys 덤프로 확인)
const CAND = [
  "totalRevenue", "costOfRevenue", "grossProfit", "netIncome",
  "totalAssets", "currentAssets", "currentLiabilities", "longTermDebt", "totalDebt",
  "operatingCashFlow", "cashFlowFromContinuingOperatingActivities",
  "shareIssued", "ordinarySharesNumber", "basicAverageShares",
];

for (const s of syms) {
  try {
    const r = await yf.fundamentalsTimeSeries(s, { period1: p1, period2: p2, type: "annual", module: "all" });
    const rows = Array.isArray(r) ? r : [];
    console.log("\n===== " + s + " | rows:", rows.length);
    if (rows.length) {
      console.log("dates:", rows.map((x) => (x.date instanceof Date ? x.date.toISOString().slice(0, 10) : x.date)).join(" "));
      // 최신 행의 전체 키(실제 필드명 확인용)
      console.log("ALL KEYS:", Object.keys(rows[rows.length - 1]).join(","));
      // 최근 2년 F-Score 후보 필드 값
      for (const row of rows.slice(-2)) {
        const d = row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date;
        console.log(" [" + d + "] " + CAND.map((k) => k + "=" + (row[k] != null ? row[k] : "·")).join(" "));
      }
    }
  } catch (e) {
    console.log(s, "ERROR", String(e));
  }
}
