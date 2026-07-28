import { NextResponse } from "next/server";
import symbols from "@/data/gb_symbols.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { tonesFor, type LensScoreRow } from "@/lib/lensTones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sym = { sym: string; name: string };
const ALL_SYMS = symbols as Sym[];
const NAME_MAP = new Map(ALL_SYMS.map((s) => [s.sym, s.name]));

type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number | null;
  r1w: number | null;
  r1m: number | null;
  r3m: number | null;
  r6m: number | null;
  r1y: number | null;
  amount: number | null;
  lens?: { pos: number; warn: number; flat: number } | null;
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

// STEP 757: 응답 심볼의 렌즈 톤 배치 조회 — 추가 쿼리 1회. 선계산 없으면 null(호출부가 '—'/무표시 처리).
async function fetchLensMap(sb: ReturnType<typeof createAdminClient>, market: string, symbols: string[]): Promise<Map<string, { pos: number; warn: number; flat: number }>> {
  const out = new Map<string, { pos: number; warn: number; flat: number }>();
  // .in()에 심볼 수천 개를 한 번에 넣으면 URL이 너무 길어져 400(Bad Request)로 조용히 실패(data=null) →
  // 1000개씩 청크로 나눠 호출(실측: 1500 ok·2000+ 실패). STEP 757 발견·수정.
  for (let i = 0; i < symbols.length; i += 1000) {
    const chunk = symbols.slice(i, i + 1000);
    if (chunk.length === 0) continue;
    const { data } = await sb
      .from("lens_scores")
      .select("symbol, momentum_state, technical_state, valuation_state, lowvol_state, quality_state, assetgrowth_state, fscore_state")
      .eq("market", market)
      .in("symbol", chunk);
    for (const r of (data ?? []) as (LensScoreRow & { symbol: string })[]) {
      const tones = tonesFor(r);
      if (tones) out.set(r.symbol, tones);
    }
  }
  return out;
}

export async function GET() {
  if (cache && Date.now() - cache.at < 15 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  const sb = createAdminClient();
  const rows: Item[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data } = await sb
      .from("gb_stock_perf")
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
        changePercent: p.r1d,
        r1w: p.r1w,
        r1m: p.r1m,
        r3m: p.r3m,
        r6m: p.r6m,
        r1y: p.r1y,
        amount: p.amount,
      });
    }
    if (data.length < 1000) break;
  }

  const sorted = rows.sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity));
  const lensMap = await fetchLensMap(sb, "GB", sorted.map((r) => r.symbol));
  const items = sorted.map((r) => ({ ...r, lens: lensMap.get(r.symbol) ?? null }));
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
