import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatMarketCap(cap: number): string {
  if (cap >= 1_000_000_000_000) return `${(cap / 1_000_000_000_000).toFixed(1)}조`;
  if (cap >= 100_000_000) return `${(cap / 100_000_000).toFixed(0)}억`;
  return cap.toLocaleString("ko-KR");
}

export async function GET() {
  try {
    const supabase = await createClient();

    // 시총 1조+ 종목의 최근 252일 가격 데이터 조회
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const { data: largeCaps, error: lcErr } = await supabase
      .from("stocks")
      .select("id, symbol, name_ko, market_cap")
      .gte("market_cap", 1_000_000_000_000)
      .eq("is_active", true)
      .order("market_cap", { ascending: false })
      .limit(30);

    if (lcErr) throw lcErr;
    if (!largeCaps || largeCaps.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const stockIds = largeCaps.map((s) => s.id);

    const { data: prices, error: pErr } = await supabase
      .from("stock_prices")
      .select("stock_id, trade_date, close")
      .in("stock_id", stockIds)
      .gte("trade_date", cutoffStr)
      .order("trade_date", { ascending: false });

    if (pErr) throw pErr;

    // 종목별 최근가 + 52주 최저가 계산
    const byStock = new Map<number, number[]>();
    for (const p of prices ?? []) {
      if (!byStock.has(p.stock_id)) byStock.set(p.stock_id, []);
      byStock.get(p.stock_id)!.push(Number(p.close));
    }

    type LargeCap = { id: number; symbol: string; name_ko: string | null; market_cap: number | null };
    const candidates = (largeCaps as LargeCap[])
      .map((s) => {
        const closes = byStock.get(s.id);
        if (!closes || closes.length < 5) return null;
        const current = closes[0];
        const low52 = Math.min(...closes);
        const high52 = Math.max(...closes);
        if (current <= 0 || low52 <= 0) return null;
        const aboveLowPct = ((current - low52) / low52) * 100;
        if (aboveLowPct > 15) return null; // 52주 저가 115% 초과는 제외
        return {
          code: s.symbol,
          name: s.name_ko ?? s.symbol,
          price: current.toLocaleString("ko-KR"),
          lowPct: Math.round(-aboveLowPct),
          marketCap: formatMarketCap(Number(s.market_cap ?? 0)),
          grade: "우량" as const,
          _aboveLow: aboveLowPct,
          _high52: high52,
          _low52: low52,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a._aboveLow - b._aboveLow)
      .slice(0, 5)
      .map(({ _aboveLow: _a, _high52: _h, _low52: _l, ...rest }) => rest);

    return NextResponse.json({ items: candidates });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
