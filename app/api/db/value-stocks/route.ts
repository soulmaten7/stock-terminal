import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    // 최근 스냅샷 기준 저평가 종목 (value_pct 상위 + per/roe 기준)
    const { data, error } = await supabase
      .from("quant_factors")
      .select("per, pbr, roe, value_pct, composite_pct, snapshot_date, stocks ( symbol, name_ko )")
      .not("per", "is", null)
      .not("roe", "is", null)
      .gte("value_pct", 60)
      .order("snapshot_date", { ascending: false })
      .order("value_pct", { ascending: false })
      .limit(20);

    if (error) throw error;

    type StocksRow = { symbol: string | null; name_ko: string | null };
    type Row = {
      per: number | null;
      pbr: number | null;
      roe: number | null;
      value_pct: number | null;
      composite_pct: number | null;
      stocks: StocksRow | StocksRow[] | null;
    };

    const getStock = (stocks: Row["stocks"]): StocksRow | null => {
      if (!stocks) return null;
      return Array.isArray(stocks) ? (stocks[0] ?? null) : stocks;
    };

    // 종목 중복 제거 (최신 스냅샷 우선)
    const seen = new Set<string>();
    const items = (data as unknown as Row[])
      .filter((d) => {
        const sym = getStock(d.stocks)?.symbol;
        if (!sym || seen.has(sym)) return false;
        seen.add(sym);
        return true;
      })
      .slice(0, 5)
      .map((d) => {
        const stock = getStock(d.stocks);
        const per = Number(d.per ?? 0);
        const roe = Number(d.roe ?? 0);
        const score = per <= 7 && roe >= 12 ? "A+" : per <= 10 && roe >= 10 ? "A" : "B+";
        return {
          code: stock?.symbol ?? "",
          name: stock?.name_ko ?? "—",
          per,
          pbr: Number(d.pbr ?? 0),
          roe,
          score,
        };
      });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
