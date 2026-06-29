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
  const { data: { user } } = await supabase.auth.getUser();

  // ───────────────────────────────────────────────
  // 인증 리딩방 = 채널 단위. 활성 business_links 1개 = 1행(독립).
  // 같은 업체가 채널 N개면 N행(같은 등록업체명, 채널명만 다름). 교차연결 안 함.
  // ───────────────────────────────────────────────
  if (view === "verified") {
    const { data: vm } = await admin.from("business_members").select("biz_no").eq("status", "verified");
    const verifiedIds = Array.from(new Set((vm ?? []).map((m: { biz_no: string }) => m.biz_no)));
    if (!verifiedIds.length) return NextResponse.json({ results: [], total: 0, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });

    const { data: links } = await admin
      .from("business_links")
      .select("id, biz_no, type, platform, url, label, is_paid, expires_at, status")
      .in("biz_no", verifiedIds).eq("status", "active");
    const now = Date.now();
    const chans = (links ?? []).filter((l: { expires_at: string | null }) => !l.expires_at || new Date(l.expires_at).getTime() > now);
    if (!chans.length) return NextResponse.json({ results: [], total: 0, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });

    const factBizNos = Array.from(new Set(chans.map((c: { biz_no: string }) => c.biz_no)));
    const { data: facts } = await supabase
      .from("advisor_directory")
      .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, report_count, favorite_count, platform, source, intro")
      .in("biz_no", factBizNos);
    const factMap: Record<string, Record<string, unknown>> = {};
    for (const f of (facts ?? []) as { biz_no: string }[]) factMap[f.biz_no] = f as Record<string, unknown>;

    type Chan = { id: string; biz_no: string; type: string; platform: string | null; url: string; label: string | null; is_paid: boolean };
    let rows = (chans as Chan[]).map((c) => ({
      ...(factMap[c.biz_no] ?? {}),
      biz_no: c.biz_no,
      channel_id: c.id,
      channel_label: c.label,
      channel_url: c.url,
      channel_type: c.type,
      channel_platform: c.platform,
      channel_is_paid: c.is_paid,
      verified_owner: true,
    } as Record<string, unknown>));

    if (q) {
      const qq = q.toLowerCase();
      rows = rows.filter((r) =>
        String(r.company_name ?? "").toLowerCase().includes(qq) ||
        String(r.representative ?? "").toLowerCase().includes(qq) ||
        String(r.channel_label ?? "").toLowerCase().includes(qq)
      );
    }
    rows.sort((a, b) => {
      const c = String(a.company_name ?? "").localeCompare(String(b.company_name ?? ""), "ko");
      if (c !== 0) return dir === "desc" ? -c : c;
      return String(a.channel_label ?? "").localeCompare(String(b.channel_label ?? ""), "ko");
    });

    const total = rows.length;
    const fromI = (page - 1) * PAGE_SIZE;
    let paged = rows.slice(fromI, fromI + PAGE_SIZE);

    if (user && paged.length) {
      const bizNos = paged.map((r) => r.biz_no as string);
      const { data: myLikes } = await supabase.from("room_likes").select("target_id").eq("user_id", user.id).in("target_id", bizNos);
      const likedSet = new Set((myLikes ?? []).map((l: { target_id: string }) => l.target_id));
      paged = paged.map((r) => ({ ...r, liked: likedSet.has(r.biz_no as string) }));
    } else {
      paged = paged.map((r) => ({ ...r, liked: false }));
    }
    return NextResponse.json({ results: paged, total, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });
  }

  // ───────────────────────────────────────────────
  // 금감원 등록업체 / 관심도순 = 업체 단위(기존). 1업체 1행.
  // ───────────────────────────────────────────────
  let query = supabase
    .from("advisor_directory")
    .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, like_count, report_count, favorite_count, platform, source, intro", { count: "exact" });

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

  if (user && rows.length) {
    const ids = rows.map((r) => r.biz_no);
    const { data: myLikes } = await supabase.from("room_likes").select("target_id").eq("user_id", user.id).in("target_id", ids);
    const likedSet = new Set((myLikes ?? []).map((l: { target_id: string }) => l.target_id));
    rows = rows.map((r) => ({ ...r, liked: likedSet.has(r.biz_no) }));
  } else {
    rows = rows.map((r) => ({ ...r, liked: false }));
  }

  // 업체 제공 링크(공개 active) — 업체 단위 미리보기용
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
    const { data: vmembers } = await admin.from("business_members").select("biz_no").eq("status", "verified").in("biz_no", ids);
    const verifiedSet = new Set((vmembers ?? []).map((m: { biz_no: string }) => m.biz_no));
    rows = rows.map((r) => ({ ...r, verified_owner: verifiedSet.has(r.biz_no) }));
  }

  return NextResponse.json({ results: rows, total: count ?? 0, page, pageSize: PAGE_SIZE, view, dir, searching: !!q, loggedIn: !!user });
}
