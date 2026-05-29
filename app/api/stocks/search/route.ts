import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const limit = Math.min(parseInt(sp.get("limit") || "10", 10), 30);

  if (!q || q.length < 1) {
    return NextResponse.json({ items: [] });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ items: [], error: "Supabase 미설정" }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const qLike = `%${q}%`;

    const { data, error } = await supabase
      .from("stocks")
      .select("symbol, name_ko, name_en, market, country, market_cap")
      .eq("is_active", true)
      .or(`name_ko.ilike.${qLike},name_en.ilike.${qLike},symbol.ilike.${qLike}`)
      .order("market_cap", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 200 });
    }

    const items = (data || []).map((row) => ({
      symbol: row.symbol,
      name: row.name_ko || row.name_en || row.symbol,
      market: row.market,
      country: row.country,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
