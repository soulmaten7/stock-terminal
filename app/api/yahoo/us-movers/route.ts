import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// Fallback: 인기 미국 종목 배열 (screener 실패 시)
const POPULAR_US = ["NVDA", "TSLA", "AAPL", "META", "MSFT", "AMD", "AMZN", "GOOG"];

export async function GET() {
  try {
    // Yahoo Finance day_gainers screener 시도
    let items: { code: string; name: string; price: string; changePct: number }[] = [];

    try {
      const result = await yf.screener({ scrIds: "day_gainers", count: 5 });
      const quotes = result.quotes ?? [];
      items = (quotes as unknown as Array<Record<string, unknown>>).slice(0, 5).map((q) => ({
        code: String(q.symbol ?? ""),
        name: String(q.shortName ?? q.longName ?? q.symbol ?? ""),
        price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
        changePct: Number(q.regularMarketChangePercent ?? 0),
      }));
    } catch {
      // screener 실패 시 인기 종목 quote 로 폴백
      const quotes = await yf.quote(POPULAR_US);
      const quoteArr = Array.isArray(quotes) ? quotes : [quotes];
      items = quoteArr
        .map((q) => ({
          code: String(q.symbol ?? ""),
          name: String(q.shortName ?? q.symbol ?? ""),
          price: `$${Number(q.regularMarketPrice ?? 0).toFixed(2)}`,
          changePct: Number(q.regularMarketChangePercent ?? 0),
        }))
        .filter((x) => x.changePct > 0)
        .sort((a, b) => b.changePct - a.changePct)
        .slice(0, 5);
    }

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
