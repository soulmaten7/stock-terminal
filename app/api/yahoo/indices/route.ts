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
    // 심볼별로 현재값(quote) + 스파크라인용 최근 30일 일봉(chart)을 병렬로 가져온다
    const items = await Promise.all(
      INDEX_SYMBOLS.map(async (meta) => {
        const q = await yf.quote(meta.symbol);
        const price = Number(q.regularMarketPrice ?? 0);
        const changePct = Number(q.regularMarketChangePercent ?? 0);

        // 스파크라인: 최근 약 30일 일봉 종가 배열 (실패해도 카드는 그대로 표시)
        let spark: number[] = [];
        try {
          const ch = await yf.chart(meta.symbol, {
            period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            interval: "1d",
          });
          spark = ch.quotes
            .map((c) => c.close)
            .filter((n): n is number => typeof n === "number");
        } catch {
          spark = [];
        }

        return {
          name: meta.name,
          value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          changePct,
          isUp: changePct >= 0,
          spark,
        };
      })
    );

    return NextResponse.json({ items: items.filter((x) => x.value !== "0") });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
