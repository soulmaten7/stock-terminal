import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { isKrxCode } from "@/lib/code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };
const cache = new Map<string, { at: number; candles: Candle[] }>();

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ candles: [] });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
    return NextResponse.json({ candles: hit.candles });
  }

  // 국내 6자리는 .KS→.KQ 순으로 시도, 그 외(미국 등)는 티커 그대로
  const isKr = isKrxCode(symbol);
  const tickers = isKr ? [`${symbol}.KS`, `${symbol}.KQ`] : [symbol];
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  for (const t of tickers) {
    try {
      const ch = await yf.chart(t, { period1, interval: "1d" });
      const quotes = (ch.quotes ?? []) as Array<{
        date?: Date | string;
        open: number | null;
        high: number | null;
        low: number | null;
        close: number | null;
        volume: number | null;
      }>;
      const candles: Candle[] = quotes
        .filter((q) => q && q.close != null && q.open != null)
        .map((q) => {
          const d = q.date instanceof Date ? q.date : new Date(String(q.date));
          return {
            time: d.toISOString().slice(0, 10),
            open: Number(q.open),
            high: Number(q.high ?? q.close),
            low: Number(q.low ?? q.close),
            close: Number(q.close),
            volume: Number(q.volume ?? 0),
          };
        });
      if (candles.length >= 2) {
        cache.set(symbol, { at: Date.now(), candles });
        return NextResponse.json({ candles });
      }
    } catch {
      /* 다음 티커 시도 */
    }
  }
  return NextResponse.json({ candles: [] });
}
