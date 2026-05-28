import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

const M7 = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOG", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
];

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  return `$${cap.toLocaleString("en-US")}`;
}

export async function GET() {
  try {
    const symbols = M7.map((m) => m.symbol);
    const quotes = await yf.quote(symbols);
    const quoteArr = Array.isArray(quotes) ? quotes : [quotes];

    const items = quoteArr.map((q, i) => {
      const meta = M7[i];
      const price = Number(q.regularMarketPrice ?? 0);
      const changePct = Number(q.regularMarketChangePercent ?? 0);
      const marketCap = Number(q.marketCap ?? 0);
      return {
        code: meta.symbol,
        name: meta.name,
        price: `$${price.toFixed(2)}`,
        changePct,
        marketCap: formatMarketCap(marketCap),
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
