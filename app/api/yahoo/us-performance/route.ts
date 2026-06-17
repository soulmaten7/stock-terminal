import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 미국 종목 (us-movers 폴백 유니버스와 동일). 티커 접미사 없음.
const UNIVERSE = [
  "NVDA", "TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "AMD", "NFLX", "AVGO",
  "INTC", "QCOM", "ORCL", "CRM", "ADBE", "MU", "JPM", "BAC", "V", "MA",
  "WMT", "COST", "KO", "PEP", "DIS", "NKE", "BA", "CAT", "XOM", "CVX",
  "JNJ", "UNH", "HD", "MCD", "SBUX", "PYPL", "UBER", "COIN", "PLTR", "SOFI",
];

const NAMES: Record<string, string> = {
  NVDA: "NVIDIA", TSLA: "Tesla", AAPL: "Apple", MSFT: "Microsoft", AMZN: "Amazon",
  GOOGL: "Alphabet", META: "Meta", AMD: "AMD", NFLX: "Netflix", AVGO: "Broadcom",
  INTC: "Intel", QCOM: "Qualcomm", ORCL: "Oracle", CRM: "Salesforce", ADBE: "Adobe",
  MU: "Micron", JPM: "JPMorgan", BAC: "Bank of America", V: "Visa", MA: "Mastercard",
  WMT: "Walmart", COST: "Costco", KO: "Coca-Cola", PEP: "PepsiCo", DIS: "Disney",
  NKE: "Nike", BA: "Boeing", CAT: "Caterpillar", XOM: "Exxon Mobil", CVX: "Chevron",
  JNJ: "Johnson & Johnson", UNH: "UnitedHealth", HD: "Home Depot", MCD: "McDonald's",
  SBUX: "Starbucks", PYPL: "PayPal", UBER: "Uber", COIN: "Coinbase", PLTR: "Palantir", SOFI: "SoFi",
};

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  const results = await Promise.all(
    UNIVERSE.map(async (sym) => {
      try {
        const ch = await yf.chart(sym, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        const price = closes[closes.length - 1];
        return {
          symbol: sym,
          name: NAMES[sym] ?? sym,
          price,
          changePercent: ret(closes, 1) ?? 0,
          r1w: ret(closes, 5),
          r1m: ret(closes, 21),
          r3m: ret(closes, 63),
          r6m: ret(closes, 126),
          r1y: ret(closes, 252),
        };
      } catch {
        return null;
      }
    })
  );

  const items = results.filter((x) => x !== null);
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
