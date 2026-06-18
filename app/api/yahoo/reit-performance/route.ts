import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 주요 국내 리츠 (전부 yahoo .KS 확인). 단일 소스 — 현재가·1일·기간 수익률 모두 yahoo 시세에서 계산.
const UNIVERSE: { sym: string; name: string }[] = [
  { sym: "088980", name: "맥쿼리인프라" },
  { sym: "330590", name: "롯데리츠" },
  { sym: "293940", name: "신한알파리츠" },
  { sym: "395400", name: "SK리츠" },
  { sym: "448730", name: "삼성FN리츠" },
  { sym: "451800", name: "한화리츠" },
  { sym: "432320", name: "KB스타리츠" },
  { sym: "094800", name: "맵스리얼티1" },
  { sym: "404990", name: "신한서부티엔디리츠" },
  { sym: "365550", name: "ESR켄달스퀘어리츠" },
  { sym: "357120", name: "코람코라이프인프라리츠" },
  { sym: "400760", name: "NH올원리츠" },
  { sym: "377190", name: "디앤디플랫폼리츠" },
  { sym: "348950", name: "제이알글로벌리츠" },
  { sym: "088260", name: "이리츠코크렙" },
  { sym: "140910", name: "에이리츠" },
  { sym: "145270", name: "케이탑리츠" },
  { sym: "334890", name: "이지스밸류리츠" },
  { sym: "350520", name: "이지스레지던스리츠" },
  { sym: "396690", name: "미래에셋글로벌리츠" },
  { sym: "338100", name: "NH프라임리츠" },
  { sym: "357430", name: "마스턴프리미어리츠" },
  { sym: "417310", name: "코람코더원리츠" },
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
        const ch = await yf.chart(`${e.sym}.KS`, { period1, interval: "1d" });
        const closes = ((ch.quotes ?? []) as Array<{ close: number | null }>)
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        return {
          symbol: e.sym,
          name: e.name,
          price: closes[closes.length - 1],
          changePercent: ret(closes, 1) ?? 0,
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
