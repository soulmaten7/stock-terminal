import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 국내 주식 (코드·이름·시장). 통합 디렉토리용으로 name·price·changePercent도 반환(reit/etf와 동일 shape).
const UNIVERSE: { sym: string; name: string; mkt: "KS" | "KQ" }[] = [
  { sym: "005930", name: "삼성전자", mkt: "KS" },
  { sym: "000660", name: "SK하이닉스", mkt: "KS" },
  { sym: "373220", name: "LG에너지솔루션", mkt: "KS" },
  { sym: "207940", name: "삼성바이오로직스", mkt: "KS" },
  { sym: "005380", name: "현대차", mkt: "KS" },
  { sym: "000270", name: "기아", mkt: "KS" },
  { sym: "005490", name: "POSCO홀딩스", mkt: "KS" },
  { sym: "035420", name: "NAVER", mkt: "KS" },
  { sym: "035720", name: "카카오", mkt: "KS" },
  { sym: "051910", name: "LG화학", mkt: "KS" },
  { sym: "006400", name: "삼성SDI", mkt: "KS" },
  { sym: "105560", name: "KB금융", mkt: "KS" },
  { sym: "055550", name: "신한지주", mkt: "KS" },
  { sym: "086790", name: "하나금융지주", mkt: "KS" },
  { sym: "012330", name: "현대모비스", mkt: "KS" },
  { sym: "028260", name: "삼성물산", mkt: "KS" },
  { sym: "066570", name: "LG전자", mkt: "KS" },
  { sym: "003670", name: "포스코퓨처엠", mkt: "KS" },
  { sym: "015760", name: "한국전력", mkt: "KS" },
  { sym: "034730", name: "SK", mkt: "KS" },
  { sym: "017670", name: "SK텔레콤", mkt: "KS" },
  { sym: "030200", name: "KT", mkt: "KS" },
  { sym: "011200", name: "HMM", mkt: "KS" },
  { sym: "009150", name: "삼성전기", mkt: "KS" },
  { sym: "032830", name: "삼성생명", mkt: "KS" },
  { sym: "010130", name: "고려아연", mkt: "KS" },
  { sym: "018260", name: "삼성에스디에스", mkt: "KS" },
  { sym: "010950", name: "S-Oil", mkt: "KS" },
  { sym: "259960", name: "크래프톤", mkt: "KS" },
  { sym: "042700", name: "한미반도체", mkt: "KS" },
  { sym: "009540", name: "HD한국조선해양", mkt: "KS" },
  { sym: "267260", name: "HD현대일렉트릭", mkt: "KS" },
  { sym: "064350", name: "현대로템", mkt: "KS" },
  { sym: "011170", name: "롯데케미칼", mkt: "KS" },
  { sym: "096770", name: "SK이노베이션", mkt: "KS" },
  { sym: "003550", name: "LG", mkt: "KS" },
  { sym: "247540", name: "에코프로비엠", mkt: "KQ" },
  { sym: "086520", name: "에코프로", mkt: "KQ" },
  { sym: "196170", name: "알테오젠", mkt: "KQ" },
  { sym: "028300", name: "HLB", mkt: "KQ" },
  { sym: "277810", name: "레인보우로보틱스", mkt: "KQ" },
  { sym: "240810", name: "원익IPS", mkt: "KQ" },
  { sym: "357780", name: "솔브레인", mkt: "KQ" },
  { sym: "058470", name: "리노공업", mkt: "KQ" },
  { sym: "066970", name: "엘앤에프", mkt: "KQ" },
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
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  const results = await Promise.all(
    UNIVERSE.map(async (e) => {
      try {
        const ch = await yf.chart(`${e.sym}.${e.mkt}`, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        return {
          symbol: e.sym,
          name: e.name,
          price: closes[closes.length - 1],
          changePercent: ret(closes, 1), // 결측이면 null(0 날조 금지·STEP 804 §1)
          r1w: ret(closes, 5),
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
