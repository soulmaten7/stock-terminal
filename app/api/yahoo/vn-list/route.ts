import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import symbols from "@/data/vn_symbols.json";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; market: string };
const ALL_SYMS = symbols as Sym[];
const NAME_MAP = new Map(ALL_SYMS.map((s) => [s.sym, s.name]));

type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  r1w: number | null;
  r1m: number | null;
  r3m: number | null;
  r6m: number | null;
  r1y: number | null;
  amount: number;
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

let cache: { at: number; data: { items: Item[] } } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 15 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  const SYMS = ALL_SYMS.map((s) => s.sym);
  const chunks = chunk(SYMS, 100);
  const perChunk = await mapLimit(chunks, 6, async (syms): Promise<Item[]> => {
    try {
      const r = await yf.quote(syms);
      const arr = Array.isArray(r) ? r : [r];
      const rows: Item[] = [];
      for (const q of arr) {
        const price = (q as { regularMarketPrice?: number }).regularMarketPrice ?? 0;
        if (!(price > 0)) continue;
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
          r1w: null,
          r1m: null,
          r3m: null,
          r6m: null,
          r1y: (q as { fiftyTwoWeekChangePercent?: number }).fiftyTwoWeekChangePercent ?? null,
          amount: price * vol,
        });
      }
      return rows;
    } catch {
      return [];
    }
  });

  const items = perChunk.flat().sort((a, b) => b.amount - a.amount);

  try {
    const sb = createAdminClient();
    type P = { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };
    const perf: P[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data } = await sb.from("vn_stock_perf").select("symbol,r1w,r1m,r3m,r6m").range(from, from + 999);
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
    // 조인 실패해도 quote 기반은 그대로
  }

  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
