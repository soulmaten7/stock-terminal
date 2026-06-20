import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("q") ?? "").trim();
  // PostgREST or-필터 인젝션 방지: 한글·영숫자·공백·하이픈만 허용
  const q = raw.replace(/[^\p{L}\p{N}\s-]/gu, "").slice(0, 50);

  const supabase = await createClient();
  let query = supabase
    .from("fss_advisors")
    .select("biz_no, company_name, representative, valid_from, valid_to, homepage, phone, address", { count: "exact" });

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,representative.ilike.%${q}%`);
  }

  const { data, count, error } = await query
    .order("valid_from", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data ?? [], total: count ?? 0, q });
}
