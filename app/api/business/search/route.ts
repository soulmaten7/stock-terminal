import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 금감원 명부(fss_advisors)에서 업체명/사업자번호로 검색 → 클레임 후보 반환
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const admin = createAdminClient();
  const digits = q.replace(/\D/g, "");
  let query = admin
    .from("fss_advisors")
    .select("biz_no, company_name, representative, phone, valid_from, valid_to, address");
  if (digits.length >= 10) query = query.eq("biz_no", digits.slice(0, 10));
  else query = query.ilike("company_name", `%${q.replace(/[%,()]/g, "")}%`);
  const { data, error } = await query.limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data ?? [] });
}
