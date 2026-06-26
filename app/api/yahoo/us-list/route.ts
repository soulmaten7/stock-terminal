import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import symbols from "@/data/us_symbols.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 전종목(~6,121) batch quote를 콜드 캐시 때 부르므로 함수 타임아웃 여유 확보(15분 캐시라 콜드만)
export const maxDuration = 60;

// yahooSurvey 안내 로그 억제(서버 콘솔 깔끔)
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// data/us_symbols.json: [{ sym, name, type }] — 주식만(type==='stock') 추림(~6,121)
type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[])
  .filter((s) => s.type === "stock")
  .map((s) => s.sym);

type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  amount: number; // 거래대금(USD) = 현재가 × 거래량 — 정렬 전용
};

let cache: { at: number; data: { items: Item[] } } | null = null;

// N개씩 청크
function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// 동시 호출 제한 — 야후 레이트리밋/타임아웃 방지(한 번에 limit개씩만 진행). us-performance와 동일 패턴.
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) {
      const cur = idx++;
      out[cur] = await fn(arr[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

export async function GET() {
  // 15분 인메모리 캐시
  if (cache && Date.now() - cache.at < 15 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  // 100개씩 묶어 batch quote, 동시 6청크까지. (~62 청크 × 6동시 — 야후 부담 최소화)
  const chunks = chunk(STOCK_SYMS, 100);
  const perChunk = await mapLimit(chunks, 6, async (syms): Promise<Item[]> => {
    try {
      const r = await yf.quote(syms);
      const arr = Array.isArray(r) ? r : [r];
      const rows: Item[] = [];
      for (const q of arr) {
        const price = (q as { regularMarketPrice?: number }).regularMarketPrice ?? 0;
        if (!(price > 0)) continue; // 가격 없는/0 종목 제외
        const vol = (q as { regularMarketVolume?: number }).regularMarketVolume ?? 0;
        rows.push({
          symbol: (q as { symbol: string }).symbol,
          name:
            (q as { shortName?: string }).shortName ||
            (q as { longName?: string }).longName ||
            (q as { symbol: string }).symbol,
          price,
          changePercent: (q as { regularMarketChangePercent?: number }).regularMarketChangePercent ?? 0,
          amount: price * vol,
        });
      }
      return rows;
    } catch {
      return []; // skip-fail — 실패 청크가 전체를 깨지 않게
    }
  });

  // 평탄화 후 거래대금 내림차순(최다거래 우선)
  const items = perChunk.flat().sort((a, b) => b.amount - a.amount);
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
