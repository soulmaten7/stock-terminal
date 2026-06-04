import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// Fallback: 인기 미국 종목 (screener 실패 시)
const POPULAR_US = ["NVDA", "TSLA", "AAPL", "META", "MSFT", "AMD", "AMZN", "GOOG"];

export async function GET(request: NextRequest) {
  const dir = request.nextUrl.searchParams.get("dir") === "down" ? "down" : "up";
  const count = Math.min(parseInt(request.nextUrl.searchParams.get("count") || "100", 10) || 100, 100);
  const scrId = dir === "down" ? "day_losers" : "day_gainers";

  try {
    let items: { code: string; name: string; price: string; changePct: number; volume: number }[] = [];

    try {
      const result = await yf.screener({ scrIds: scrId, count });
      const quotes = result.quotes ?? [];
      items = (quotes as unknown as Array<Record<string, unknown>>).slice(0, count).map((q) => ({
        code: String(q.symbol ?? ""),
        name: String(q.shortName ?? q.longName ?? q.symbol ?? ""),
        price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
        changePct: Number(q.regularMarketChangePercent ?? 0),
        volume: Number(q.regularMarketVolume ?? 0),
      }));
    } catch {
      // screener 실패 시 인기 종목 quote 폴백
      const quotes = await yf.quote(POPULAR_US);
      const quoteArr = Array.isArray(quotes) ? quotes : [quotes];
      items = quoteArr
        .map((q) => ({
          code: String(q.symbol ?? ""),
          name: String(q.shortName ?? q.symbol ?? ""),
          price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
          changePct: Number(q.regularMarketChangePercent ?? 0),
          volume: Number(q.regularMarketVolume ?? 0),
        }))
        .filter((x) => (dir === "down" ? x.changePct < 0 : x.changePct > 0))
        .sort((a, b) => (dir === "down" ? a.changePct - b.changePct : b.changePct - a.changePct))
        .slice(0, count);
    }

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
