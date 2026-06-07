import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 KR ETF (코드·이름). 과거 시세로 기간 수익률 계산. 코드 틀리면 자동 제외(self-clean).
const UNIVERSE: { sym: string; name: string }[] = [
  { sym: "069500", name: "KODEX 200" },
  { sym: "122630", name: "KODEX 레버리지" },
  { sym: "114800", name: "KODEX 인버스" },
  { sym: "252670", name: "KODEX 200선물인버스2X" },
  { sym: "233740", name: "KODEX 코스닥150레버리지" },
  { sym: "229200", name: "KODEX 코스닥150" },
  { sym: "102110", name: "TIGER 200" },
  { sym: "360750", name: "TIGER 미국S&P500" },
  { sym: "133690", name: "TIGER 미국나스닥100" },
  { sym: "091160", name: "KODEX 반도체" },
  { sym: "091170", name: "KODEX 은행" },
  { sym: "132030", name: "KODEX 골드선물" },
  { sym: "153130", name: "KODEX 단기채권" },
  { sym: "148020", name: "KBSTAR 200" },
  { sym: "278530", name: "KODEX 200TR" },
  { sym: "305720", name: "KODEX 2차전지산업" },
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // ~13개월

  const results = await Promise.all(
    UNIVERSE.map(async (e) => {
      try {
        const ch = await yf.chart(`${e.sym}.KS`, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        const price = closes[closes.length - 1];
        return {
          symbol: e.sym,
          name: e.name,
          price,
          changePercent: ret(closes, 1) ?? 0,
          r1m: ret(closes, 21),
          r3m: ret(closes, 63),
          r6m: ret(closes, 126),
          r1y: ret(closes, 252),
        };
      } catch {
        return null;
      }
    })
  );

  const items = results.filter((x) => x !== null);
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
