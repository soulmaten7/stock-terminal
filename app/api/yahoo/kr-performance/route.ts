import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 대표 국내 주식 (코드·시장 KS=코스피/KQ=코스닥). yahoo 과거 시세로 기간 수익률 계산.
// 코드/시장 틀리면 자동 제외(self-clean). 거래대금 상위 유니버스와 '심볼'로 병합됨.
const UNIVERSE: { sym: string; mkt: "KS" | "KQ" }[] = [
  { sym: "005930", mkt: "KS" }, // 삼성전자
  { sym: "000660", mkt: "KS" }, // SK하이닉스
  { sym: "373220", mkt: "KS" }, // LG에너지솔루션
  { sym: "207940", mkt: "KS" }, // 삼성바이오로직스
  { sym: "005380", mkt: "KS" }, // 현대차
  { sym: "000270", mkt: "KS" }, // 기아
  { sym: "005490", mkt: "KS" }, // POSCO홀딩스
  { sym: "035420", mkt: "KS" }, // NAVER
  { sym: "035720", mkt: "KS" }, // 카카오
  { sym: "051910", mkt: "KS" }, // LG화학
  { sym: "006400", mkt: "KS" }, // 삼성SDI
  { sym: "105560", mkt: "KS" }, // KB금융
  { sym: "055550", mkt: "KS" }, // 신한지주
  { sym: "086790", mkt: "KS" }, // 하나금융지주
  { sym: "012330", mkt: "KS" }, // 현대모비스
  { sym: "028260", mkt: "KS" }, // 삼성물산
  { sym: "066570", mkt: "KS" }, // LG전자
  { sym: "003670", mkt: "KS" }, // 포스코퓨처엠
  { sym: "015760", mkt: "KS" }, // 한국전력
  { sym: "034730", mkt: "KS" }, // SK
  { sym: "017670", mkt: "KS" }, // SK텔레콤
  { sym: "030200", mkt: "KS" }, // KT
  { sym: "011200", mkt: "KS" }, // HMM
  { sym: "009150", mkt: "KS" }, // 삼성전기
  { sym: "032830", mkt: "KS" }, // 삼성생명
  { sym: "010130", mkt: "KS" }, // 고려아연
  { sym: "018260", mkt: "KS" }, // 삼성에스디에스
  { sym: "010950", mkt: "KS" }, // S-Oil
  { sym: "259960", mkt: "KS" }, // 크래프톤
  { sym: "042700", mkt: "KS" }, // 한미반도체
  { sym: "009540", mkt: "KS" }, // HD한국조선해양
  { sym: "267260", mkt: "KS" }, // HD현대일렉트릭
  { sym: "064350", mkt: "KS" }, // 현대로템
  { sym: "011170", mkt: "KS" }, // 롯데케미칼
  { sym: "096770", mkt: "KS" }, // SK이노베이션
  { sym: "003550", mkt: "KS" }, // LG
  { sym: "247540", mkt: "KQ" }, // 에코프로비엠
  { sym: "086520", mkt: "KQ" }, // 에코프로
  { sym: "196170", mkt: "KQ" }, // 알테오젠
  { sym: "028300", mkt: "KQ" }, // HLB
  { sym: "277810", mkt: "KQ" }, // 레인보우로보틱스
  { sym: "240810", mkt: "KQ" }, // 원익IPS
  { sym: "357780", mkt: "KQ" }, // 솔브레인
  { sym: "058470", mkt: "KQ" }, // 리노공업
  { sym: "066970", mkt: "KQ" }, // 엘앤에프
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
        const ch = await yf.chart(`${e.sym}.${e.mkt}`, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        return {
          symbol: e.sym,
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
