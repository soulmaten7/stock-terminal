import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LONGTERM_TYPES = ["정기보고", "감사·재무", "주요사항", "유상증자", "자사주", "합병분할", "배당"];

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("disclosures")
      .select("symbol, title, disclosure_type, published_at, stocks ( name_ko )")
      .in("disclosure_type", LONGTERM_TYPES)
      .order("published_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    type StocksRow = { name_ko: string | null };
    type Row = {
      symbol: string | null;
      title: string;
      disclosure_type: string | null;
      published_at: string;
      stocks: StocksRow | StocksRow[] | null;
    };

    const getName = (stocks: Row["stocks"]): string => {
      if (!stocks) return "—";
      const s = Array.isArray(stocks) ? stocks[0] : stocks;
      return s?.name_ko ?? "—";
    };

    const items = (data as unknown as Row[]).map((d) => {
      const dt = d.published_at ? new Date(d.published_at) : null;
      const time = dt
        ? `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`
        : "—";
      return {
        code: d.symbol ?? "",
        name: getName(d.stocks),
        type: d.disclosure_type ?? d.title ?? "—",
        time,
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
