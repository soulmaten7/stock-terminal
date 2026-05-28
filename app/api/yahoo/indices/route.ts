import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

const INDEX_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^DJI", name: "Dow" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "VIX" },
];

export async function GET() {
  try {
    const symbols = INDEX_SYMBOLS.map((i) => i.symbol);
    const quotes = await yf.quote(symbols);
    const quoteArr = Array.isArray(quotes) ? quotes : [quotes];

    const items = quoteArr
      .map((q, i) => {
        const meta = INDEX_SYMBOLS[i];
        const price = Number(q.regularMarketPrice ?? 0);
        const changePct = Number(q.regularMarketChangePercent ?? 0);
        return {
          name: meta.name,
          value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          changePct,
          isUp: changePct >= 0,
        };
      })
      .filter((x) => x.value !== "0");

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
