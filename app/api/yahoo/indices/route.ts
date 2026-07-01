import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 30초 서버 캐시 — 그리드 + 하단 티커가 같은 데이터 공유, Yahoo 호출 절감
let _cache: { data: unknown; at: number } | null = null;
const _TTL = 30_000;

const INDEX_SYMBOLS = [
  { symbol: "^KS11", name: "KOSPI" },
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "^N225", name: "Nikkei 225" },
  { symbol: "USDKRW=X", name: "USD/KRW" },
  { symbol: "JPY=X", name: "USD/JPY" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^SOX", name: "SOX" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "BTC-USD", name: "Bitcoin" },
];

export async function GET() {
  if (_cache && Date.now() - _cache.at < _TTL) {
    return NextResponse.json(_cache.data);
  }
  try {
    // 심볼별로 현재값(quote) + 스파크라인용 최근 30일 일봉(chart)을 병렬로 가져온다
    const items = await Promise.all(
      INDEX_SYMBOLS.map(async (meta) => {
        const q = await yf.quote(meta.symbol);
        const price = Number(q.regularMarketPrice ?? 0);
        const changePct = Number(q.regularMarketChangePercent ?? 0);
        const change = Number(q.regularMarketChange ?? 0);

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
          changeText: change.toLocaleString("en-US", { maximumFractionDigits: 2, signDisplay: "always" }),
          changePct,
          isUp: changePct >= 0,
          spark,
        };
      })
    );

    const payload = { items: items.filter((x) => x.value !== "0") };
    _cache = { data: payload, at: Date.now() };
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
