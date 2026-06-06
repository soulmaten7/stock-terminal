import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 폴백 universe — 대표 미국 종목(섹터 분산). screener 실패/빈값 시 등락률 순으로.
const UNIVERSE = [
  "NVDA", "TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "AMD", "NFLX", "AVGO",
  "INTC", "QCOM", "ORCL", "CRM", "ADBE", "MU", "JPM", "BAC", "V", "MA",
  "WMT", "COST", "KO", "PEP", "DIS", "NKE", "BA", "CAT", "XOM", "CVX",
  "JNJ", "UNH", "HD", "MCD", "SBUX", "PYPL", "UBER", "COIN", "PLTR", "SOFI",
];

type Item = { code: string; name: string; price: string; changePct: number; volume: number };

export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get("dir") === "down" ? "down" : "up";
  const count = Math.min(parseInt(request.nextUrl.searchParams.get("count") || "100", 10) || 100, 100);
  const scrId = dir === "down" ? "day_losers" : "day_gainers";

  let items: Item[] = [];

  // 1) screener (전체 시장 — 가장 정확)
  try {
    const result = await yf.screener({ scrIds: scrId, count });
    const quotes = (result.quotes ?? []) as unknown as Array<Record<string, unknown>>;
    items = quotes.slice(0, count).map((q) => ({
      code: String(q.symbol ?? ""),
      name: String(q.shortName ?? q.longName ?? q.symbol ?? ""),
      price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
      changePct: Number(q.regularMarketChangePercent ?? 0),
      volume: Number(q.regularMarketVolume ?? 0),
    }));
  } catch {
    items = [];
  }

  // 2) screener 실패/빈값 → 대표 종목 등락률 순 폴백(항상 데이터 보장)
  if (items.length === 0) {
    try {
      const quotes = await yf.quote(UNIVERSE);
      const arr = Array.isArray(quotes) ? quotes : [quotes];
      items = arr
        .map((q) => ({
          code: String(q.symbol ?? ""),
          name: String(q.shortName ?? q.symbol ?? ""),
          price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
          changePct: Number(q.regularMarketChangePercent ?? 0),
          volume: Number(q.regularMarketVolume ?? 0),
        }))
        .sort((a, b) => (dir === "down" ? a.changePct - b.changePct : b.changePct - a.changePct))
        .slice(0, count);
    } catch {
      items = [];
    }
  }

  return NextResponse.json({ items });
}
