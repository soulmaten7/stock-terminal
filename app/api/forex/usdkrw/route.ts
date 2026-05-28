import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

export async function GET() {
  try {
    const quote = await yf.quote("USDKRW=X");

    const price = Number(quote.regularMarketPrice ?? 0);
    const change = Number(quote.regularMarketChange ?? 0);
    const changePct = Number(quote.regularMarketChangePercent ?? 0);

    return NextResponse.json({
      pair: "USD/KRW",
      price: price.toLocaleString("ko-KR", { maximumFractionDigits: 2 }),
      change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
      changePct,
      isUp: changePct >= 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), price: "1,387.50", changePct: 0.20, isUp: true },
      { status: 200 }
    );
  }
}
