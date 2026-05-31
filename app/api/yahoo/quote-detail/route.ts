import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

/**
 * GET /api/yahoo/quote-detail?symbol=AAPL
 * Yahoo Finance quoteSummary 로 미국 주식 상세 정보
 * 응답: { name, price, changePct, open, high, low, volume, high52w, low52w, per, pbr, marketCap, dividendYield }
 */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol 필수" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary: any = await yf.quoteSummary(symbol, {
      modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData"],
    });

    const price = summary?.price || {};
    const detail = summary?.summaryDetail || {};
    const key = summary?.defaultKeyStatistics || {};

    return NextResponse.json({
      symbol,
      name: price.longName || price.shortName || symbol,
      price: Number(price.regularMarketPrice?.raw ?? price.regularMarketPrice ?? 0),
      changePct: Number(price.regularMarketChangePercent?.raw ?? price.regularMarketChangePercent ?? 0) * (price.regularMarketChangePercent?.raw !== undefined ? 100 : 1),
      open: Number(detail.regularMarketOpen?.raw ?? detail.regularMarketOpen ?? 0),
      high: Number(detail.regularMarketDayHigh?.raw ?? detail.regularMarketDayHigh ?? 0),
      low: Number(detail.regularMarketDayLow?.raw ?? detail.regularMarketDayLow ?? 0),
      volume: Number(detail.regularMarketVolume?.raw ?? detail.regularMarketVolume ?? 0),
      high52w: Number(detail.fiftyTwoWeekHigh?.raw ?? detail.fiftyTwoWeekHigh ?? 0),
      low52w: Number(detail.fiftyTwoWeekLow?.raw ?? detail.fiftyTwoWeekLow ?? 0),
      per: Number(detail.trailingPE?.raw ?? detail.trailingPE ?? 0),
      pbr: Number(key.priceToBook?.raw ?? key.priceToBook ?? 0),
      marketCap: Number(price.marketCap?.raw ?? price.marketCap ?? 0),
      dividendYield: detail.dividendYield
        ? Number(detail.dividendYield.raw ?? detail.dividendYield) * 100
        : 0,
      currency: price.currency || "USD",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
