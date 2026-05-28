import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

const WATCH_SYMBOLS = ["NVDA", "TSLA", "AAPL", "MSFT", "META", "AMD", "AMZN", "GOOG"];

function formatVolume(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toString();
}

export async function GET() {
  try {
    const quotes = await yf.quote(WATCH_SYMBOLS);
    const quoteArr = Array.isArray(quotes) ? quotes : [quotes];

    type Item = {
      code: string;
      name: string;
      session: "Pre" | "AH";
      price: string;
      changePct: number;
      volume: string;
    };

    const items: Item[] = [];

    quoteArr.forEach((q) => {
      const sym = String(q.symbol ?? "");
      const name = String(q.shortName ?? sym);

      if (q.preMarketPrice && q.preMarketChangePercent) {
        items.push({
          code: sym,
          name,
          session: "Pre",
          price: `$${Number(q.preMarketPrice).toFixed(2)}`,
          changePct: Number(q.preMarketChangePercent),
          volume: formatVolume(Number(q.preMarketVolume ?? 0)),
        });
      }

      if (q.postMarketPrice && q.postMarketChangePercent) {
        items.push({
          code: sym,
          name,
          session: "AH",
          price: `$${Number(q.postMarketPrice).toFixed(2)}`,
          changePct: Number(q.postMarketChangePercent),
          volume: formatVolume(Number(q.postMarketVolume ?? 0)),
        });
      }
    });

    items.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

    return NextResponse.json({ items: items.slice(0, 6) });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
