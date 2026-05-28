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
      .limit(5);

    if (error) throw error;

    type StocksRow = { symbol: string | null; name_ko: string | null };
    type Row = {
      dividend_per_share: number | null;
      dividend_yield: number | null;
      ex_dividend_date: string | null;
      fiscal_year: number | null;
      stocks: StocksRow | StocksRow[] | null;
    };

    const getStock = (stocks: Row["stocks"]): StocksRow | null => {
      if (!stocks) return null;
      return Array.isArray(stocks) ? (stocks[0] ?? null) : stocks;
    };

    const items = (data as unknown as Row[]).map((d) => {
      const stock = getStock(d.stocks);
      const exDate = d.ex_dividend_date
        ? `${d.ex_dividend_date.slice(5, 7)}/${d.ex_dividend_date.slice(8, 10)}`
        : "—";
      const amt = d.dividend_per_share;
      return {
        code: stock?.symbol ?? "",
        name: stock?.name_ko ?? "—",
        yield: Number(d.dividend_yield ?? 0),
        exDate,
        dividend: amt != null ? `${Number(amt).toLocaleString("ko-KR")}원` : "—",
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
