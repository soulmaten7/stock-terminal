import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;
const VIEWS = ["fss", "verified", "interest"];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = (sp.get("q") ?? "").trim();
  const q = raw.replace(/[^\p{L}\p{N}\s-]/gu, "").slice(0, 50); // or-필터 인젝션 방지
  const view = VIEWS.includes(sp.get("view") ?? "") ? (sp.get("view") as string) : "fss";
  const dir = sp.get("dir") === "desc" ? "desc" : "asc";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);

  const supabase = await createClient();
  const admin = createAdminClient();

  // 인증 리딩방 뷰 = 운영자 인증(verified)된 biz_no만. 먼저 추려서 필터(현재는 소수).
  let verifiedIds: string[] | null = null;
  if (view === "verified") {
    const { data: vm } = await admin
      .from("business_members").select("biz_no").eq("status", "verified");
    verifiedIds = Array.from(new Set((vm ?? []).map((m: { biz_no: string }) => m.biz_no)));
    if (verifiedIds.length === 0) {
      return NextResponse.json({ results: [], total: 0, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: false });
    }
  }

  let query = supabase
    .from("advisor_directory")
    .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, like_count, report_count, favorite_count, platform, source, intro", { count: "exact" });

  if (verifiedIds) query = query.in("biz_no", verifiedIds);
  if (q) {
    query = query.or(`company_name.ilike.%${q}%,representative.ilike.%${q}%,info_name.ilike.%${q}%`); // 검색=전체(리딩방명 포함)
  }

  if (view === "interest") {
    query = query.order("favorite_count", { ascending: dir === "asc" }).order("company_name", { ascending: true });
  } else {
    query = query.order("company_name", { ascending: dir !== "desc" });
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = { biz_no: string; [k: string]: unknown };
  let rows = (data ?? []) as Row[];

  const { data: { user } } = await supabase.auth.getUser();
  if (user && rows.length) {
    const ids = rows.map((r) => r.biz_no);
    const { data: myLikes } = await supabase
      .from("room_likes").select("target_id").eq("user_id", user.id).in("target_id", ids);
    const likedSet = new Set((myLikes ?? []).map((l: { target_id: string }) => l.target_id));
    rows = rows.map((r) => ({ ...r, liked: likedSet.has(r.biz_no) }));
  } else {
    rows = rows.map((r) => ({ ...r, liked: false }));
  }

  // 업체 제공 링크(공개 active)
  if (rows.length) {
    const ids = rows.map((r) => r.biz_no);
    const { data: bizLinks } = await supabase
      .from("business_links").select("biz_no, type, url, label, is_paid").in("biz_no", ids).eq("status", "active");
    const linkMap: Record<string, { type: string; url: string; label: string | null; is_paid: boolean }[]> = {};
    for (const l of (bizLinks ?? []) as { biz_no: string; type: string; url: string; label: string | null; is_paid: boolean }[]) {
      (linkMap[l.biz_no] ??= []).push({ type: l.type, url: l.url, label: l.label, is_paid: l.is_paid });
    }
    rows = rows.map((r) => ({ ...r, biz_links: linkMap[r.biz_no] ?? [] }));
  }

  // 운영자 인증 플래그(채널명·뱃지 게이팅용)
  if (rows.length) {
    const ids = rows.map((r) => r.biz_no);
    let verifiedSet: Set<string>;
    if (verifiedIds) {
      verifiedSet = new Set(verifiedIds);
    } else {
      const { data: vmembers } = await admin
        .from("business_members").select("biz_no").eq("status", "verified").in("biz_no", ids);
      verifiedSet = new Set((vmembers ?? []).map((m: { biz_no: string }) => m.biz_no));
    }
    rows = rows.map((r) => ({ ...r, verified_owner: verifiedSet.has(r.biz_no) }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });
}
