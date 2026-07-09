import { NextResponse } from "next/server";
import symbols from "@/data/cn_symbols.json";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sym = { sym: string; name: string; market: string; type?: string };
const ALL_SYMS = symbols as Sym[];
const NAME_MAP = new Map(ALL_SYMS.map((s) => [s.sym, s.name]));
const MKT = new Map(ALL_SYMS.map((s) => [s.sym, s.market]));

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
  cur: string;
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

const cacheByType = new Map<string, { at: number; data: { items: Item[] } }>();

export async function GET(req: Request) {
  const market = (new URL(req.url).searchParams.get("market") || "hk").trim();
  const SYMS = new Set(
    ALL_SYMS.filter((s) =>
      market === "etf" ? s.type === "etf" : s.market === market && s.type !== "etf"
    ).map((s) => s.sym)
  );

  const hit = cacheByType.get(market);
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) {
    return NextResponse.json(hit.data);
  }

  const sb = createAdminClient();
  const rows: Item[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data } = await sb
      .from("cn_stock_perf")
      .select("symbol,price,r1d,r1w,r1m,r3m,r6m,r1y,amount")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const p of data as PerfRecord[]) {
      if (!SYMS.has(p.symbol)) continue;
      const price = p.price ?? 0;
      if (!(price > 0)) continue;
      const mkt = MKT.get(p.symbol) ?? "";
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
        cur: mkt === "ss" || mkt === "sz" ? "CN" : "HK",
      });
    }
    if (data.length < 1000) break;
  }

  const items = rows.sort((a, b) => b.amount - a.amount);
  const data = { items };
  cacheByType.set(market, { at: Date.now(), data });
  return NextResponse.json(data);
}
