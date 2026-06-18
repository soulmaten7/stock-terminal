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

  const intervalRaw = req.nextUrl.searchParams.get("interval") || "1d";
  const interval = (["5m", "30m", "1d"].includes(intervalRaw) ? intervalRaw : "1d") as "5m" | "30m" | "1d";
  const intraday = interval !== "1d";
  const key = `${symbol}|${interval}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
    return NextResponse.json({ candles: hit.candles });
  }

  // 국내 6자리는 .KS→.KQ 순으로 시도, 그 외(미국 등)는 티커 그대로
  const isKr = isKrxCode(symbol);
  const tickers = isKr ? [`${symbol}.KS`, `${symbol}.KQ`] : [symbol];
  const lookbackDays = interval === "1d" ? 400 : interval === "30m" ? 14 : 8;
  const period1 = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  for (const t of tickers) {
    try {
      const ch = await yf.chart(t, { period1, interval });
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
            time: intraday ? d.toISOString().slice(0, 16) : d.toISOString().slice(0, 10),
            open: Number(q.open),
            high: Number(q.high ?? q.close),
            low: Number(q.low ?? q.close),
            close: Number(q.close),
            volume: Number(q.volume ?? 0),
          };
        });
      if (candles.length >= 2) {
        cache.set(key, { at: Date.now(), candles });
        return NextResponse.json({ candles });
      }
    } catch {
      /* 다음 티커 시도 */
    }
  }
  return NextResponse.json({ candles: [] });
}
