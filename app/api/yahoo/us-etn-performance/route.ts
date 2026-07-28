import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const yf = new YahooFinance();

// US ETN 후보 유니버스(티커=식별자만). US ETN은 니치·상당수 상폐 → Yahoo quote로 live만 필터,
// 실명도 Yahoo가 제공(하드코딩 X). 살아있는 것만 화면에. (VXX 변동성·AMJ MLP·DJP 원자재·FNGU 레버리지 등.)
const UNIVERSE = [
  "VXX", "VXZ", "AMJ", "AMJB", "DJP", "FNGU", "FNGD", "FNGS", "BULZ",
  "PFFL", "SMHB", "HDLB", "BDCX", "DVHL", "CEFD", "MLPB",
  "BAL", "JO", "NIB", "SGG", "JJC", "JJG", "JJN", "GRN", "OIL", "USOI", "GLDI", "SLVO",
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

let cache: { at: number; data: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) return NextResponse.json(cache.data);

  // 1) quote 배치 → 실명 + live 필터(현재가 있는 것만) + 현재가/거래량
  let quotes: any[] = [];
  try {
    const q = await yf.quote(UNIVERSE);
    quotes = (Array.isArray(q) ? q : [q]).filter((x) => x && typeof x.regularMarketPrice === "number" && x.regularMarketPrice > 0);
  } catch {
    quotes = [];
  }

  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
  const results = await mapLimit(quotes, 8, async (q: any) => {
    const sym = q.symbol as string;
    try {
      const ch = await yf.chart(sym, { period1, interval: "1d" });
      const qs = (ch.quotes ?? []) as Array<{ close: number | null }>;
      const closes = qs.map((x) => x.close).filter((c): c is number => typeof c === "number" && c > 0);
      if (closes.length < 22) return null;
      const name = q.longName || q.shortName || sym;
      const price = q.regularMarketPrice as number;
      const vol = (q.regularMarketVolume as number) ?? 0;
      return {
        symbol: sym,
        name: `${name} (${sym})`,
        price,
        changePercent: (q.regularMarketChangePercent as number) ?? ret(closes, 1), // 결측이면 null(STEP 804 §1)
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
        r1y: ret(closes, 252),
        amount: price * vol,
      };
    } catch {
      return null;
    }
  });

  const items = results.filter((x) => x !== null);
  items.sort((a, b) => (b!.amount ?? 0) - (a!.amount ?? 0)); // 거래대금 순
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
