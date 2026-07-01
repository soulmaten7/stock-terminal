import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import symbols from "@/data/jp_symbols.json";
import { createAdminClient } from "@/lib/supabase/admin";

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
  r1w: number | null; // 1주 — jp_stock_perf 조인(크론 미리계산)
  r1m: number | null; // 1개월 — 동
  r3m: number | null; // 3개월 — 동
  r6m: number | null; // 6개월 — 동
  r1y: number | null; // 1년 — quote의 fiftyTwoWeekChangePercent(즉시)
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
          r1w: null, // jp_stock_perf 조인으로 아래에서 채움
          r1m: null,
          r3m: null,
          r6m: null,
          r1y: (q as { fiftyTwoWeekChangePercent?: number }).fiftyTwoWeekChangePercent ?? null, // 1년(무료)
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

  // jp_stock_perf(크론 미리계산) 조인 — 1주~6개월을 종목별로 머지. 테이블 비면 null 유지("—").
  try {
    const sb = createAdminClient();
    const { data: perf } = await sb.from("jp_stock_perf").select("symbol,r1w,r1m,r3m,r6m");
    if (perf && perf.length > 0) {
      const map = new Map<string, { r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null }>();
      for (const p of perf as { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null }[]) {
        map.set(p.symbol, { r1w: p.r1w, r1m: p.r1m, r3m: p.r3m, r6m: p.r6m });
      }
      for (const it of items) {
        const p = map.get(it.symbol);
        if (p) { it.r1w = p.r1w; it.r1m = p.r1m; it.r3m = p.r3m; it.r6m = p.r6m; }
      }
    }
  } catch {
    // 조인 실패해도 quote 기반(현재가·1일·1년·거래대금)은 그대로 — 1주~6개월만 "—"
  }

  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
