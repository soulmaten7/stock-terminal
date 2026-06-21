import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("dividends")
      .select("dividend_per_share, dividend_yield, ex_dividend_date, fiscal_year, stocks ( symbol, name_ko )")
      .not("dividend_yield", "is", null)
      .gt("dividend_yield", 0)
      .order("dividend_yield", { ascending: false })
      .limit(60);

    if (error) throw error;

    type StocksRow = { symbol: string | null; name_ko: string | null };
    type Row = {
      dividend_per_share: number | null;
      dividend_yield: number | null;
      ex_dividend_date: string | null;
      fiscal_year: number | null;
      stocks: StocksRow | StocksRow[] | null;
    };
    const getStock = (s: Row["stocks"]): StocksRow | null => (Array.isArray(s) ? s[0] ?? null : s);

    const seen = new Set<string>();
    const items = (data as unknown as Row[])
      .map((d) => {
        const stock = getStock(d.stocks);
        return {
          sym: (stock?.symbol ?? "").trim(),
          name: stock?.name_ko ?? "—",
          y: Number(d.dividend_yield ?? 0),
          ex: d.ex_dividend_date,
          dps: d.dividend_per_share,
        };
      })
      .filter((x) => {
        if (!x.sym || seen.has(x.sym)) return false;
        seen.add(x.sym);
        return true;
      })
      .slice(0, 20)
      .map((x) => ({
        code: x.sym,
        name: x.name,
        yield: x.y,
        exDate: x.ex ? `${x.ex.slice(5, 7)}/${x.ex.slice(8, 10)}` : "—",
        dividend: x.dps != null ? `${Number(x.dps).toLocaleString("ko-KR")}원` : "—",
      }));

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
