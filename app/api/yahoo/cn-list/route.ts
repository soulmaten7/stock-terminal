import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import symbols from "@/data/cn_symbols.json";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// yahooSurvey 안내 로그 억제
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// data/cn_symbols.json: [{ sym, name, market }] — market: hk|ss|sz|etf
type Sym = { sym: string; name: string; market: string };
const ALL_SYMS = symbols as Sym[];
const NAME_MAP = new Map(ALL_SYMS.map((s) => [s.sym, s.name]));

type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  r1w: number | null; // 1주 — cn_stock_perf 조인(크론 미리계산)
  r1m: number | null;
  r3m: number | null;
  r6m: number | null;
  r1y: number | null; // 1년 — quote의 fiftyTwoWeekChangePercent(즉시)
  amount: number; // 거래대금 = 현재가 × 거래량 — 정렬 전용
};

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

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

const cacheByType = new Map<string, { at: number; data: { items: Item[] } }>();

export async function GET(req: Request) {
  // 하위탭 = 시장: hk(홍콩) | ss(상해A) | sz(심천A) | etf(홍콩상장 ETF)
  const market = (new URL(req.url).searchParams.get("market") || "hk").trim();
  const SYMS = ALL_SYMS.filter((s) => s.market === market).map((s) => s.sym);

  // 15분 인메모리 캐시(시장별)
  const hit = cacheByType.get(market);
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) {
    return NextResponse.json(hit.data);
  }

  // 100개씩 묶어 batch quote (현재가·1일·1년·거래대금 라이브)
  const chunks = chunk(SYMS, 100);
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
            NAME_MAP.get((q as { symbol: string }).symbol) ||
            (q as { shortName?: string }).shortName ||
            (q as { longName?: string }).longName ||
            (q as { symbol: string }).symbol,
          price,
          changePercent: (q as { regularMarketChangePercent?: number }).regularMarketChangePercent ?? 0,
          r1w: null, // cn_stock_perf 조인으로 아래에서 채움
          r1m: null,
          r3m: null,
          r6m: null,
          r1y: (q as { fiftyTwoWeekChangePercent?: number }).fiftyTwoWeekChangePercent ?? null,
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

  // cn_stock_perf(크론 미리계산) 조인 — 1주~6개월. 1,000행 제한 없이 페이지네이션으로 전량.
  try {
    const sb = createAdminClient();
    type P = { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };
    const perf: P[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data } = await sb.from("cn_stock_perf").select("symbol,r1w,r1m,r3m,r6m").range(from, from + 999);
      if (!data || data.length === 0) break;
      perf.push(...(data as P[]));
      if (data.length < 1000) break;
    }
    if (perf.length > 0) {
      const map = new Map<string, P>();
      for (const p of perf) map.set(p.symbol, p);
      for (const it of items) {
        const p = map.get(it.symbol);
        if (p) { it.r1w = p.r1w; it.r1m = p.r1m; it.r3m = p.r3m; it.r6m = p.r6m; }
      }
    }
  } catch {
    // 조인 실패해도 quote 기반(현재가·1일·1년·거래대금)은 그대로 — 1주~6개월만 "—"
  }

  const data = { items };
  cacheByType.set(market, { at: Date.now(), data });
  return NextResponse.json(data);
}
