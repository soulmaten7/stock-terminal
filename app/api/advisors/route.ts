import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;
// 리딩방·카페 판별: 메신저/커뮤니티 링크 패턴
const ROOM_PATTERNS = ["t.me", "telegram", "cafe.naver", "naver.me", "band.us"];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = (sp.get("q") ?? "").trim();
  const q = raw.replace(/[^\p{L}\p{N}\s-]/gu, "").slice(0, 50); // or-필터 인젝션 방지
  const mode = sp.get("mode") === "all" ? "all" : "rooms";
  const sort = sp.get("sort") === "name_desc" ? "name_desc" : "name_asc";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("fss_advisors")
    .select("biz_no, company_name, representative, valid_from, valid_to, homepage, phone, address", { count: "exact" });

  if (mode === "rooms") {
    query = query.or(ROOM_PATTERNS.map((p) => `homepage.ilike.%${p}%`).join(","));
  }
  if (q) {
    query = query.or(`company_name.ilike.%${q}%,representative.ilike.%${q}%`);
  }

  query = query.order("company_name", { ascending: sort === "name_asc" });

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ results: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE, mode, sort });
}
