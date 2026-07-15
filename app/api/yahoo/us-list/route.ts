import { NextResponse } from "next/server";
import symbols from "@/data/us_symbols.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { titleCaseUsName } from "@/lib/stockName";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sym = { sym: string; name: string; type: string };
const ALL_SYMS = (symbols as Sym[]).filter((s) => s.type === "stock");
const NAME_MAP = new Map(ALL_SYMS.map((s) => [s.sym, titleCaseUsName(s.name)]));

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

type PerfRecord = {
  symbol: string;
  price: number | null;
  r1d: number | null;
  r1w: number | null;
  r1m: number | null;
  r3m: number | null;
  r6m: number | null;
  r1y: number | null;
  amount: number | null;
};

let cache: { at: number; data: { items: Item[] } } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 15 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  const sb = createAdminClient();
  const rows: Item[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data } = await sb
      .from("us_stock_perf")
      .select("symbol,price,r1d,r1w,r1m,r3m,r6m,r1y,amount")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const p of data as PerfRecord[]) {
      const price = p.price ?? 0;
      if (!(price > 0)) continue;
      rows.push({
        symbol: p.symbol,
        name: NAME_MAP.get(p.symbol) || p.symbol,
        price,
        changePercent: p.r1d ?? 0,
        r1w: p.r1w,
        r1m: p.r1m,
        r3m: p.r3m,
        r6m: p.r6m,
        r1y: p.r1y,
        amount: p.amount ?? 0,
      });
    }
    if (data.length < 1000) break;
  }

  const items = rows.sort((a, b) => b.amount - a.amount);
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
