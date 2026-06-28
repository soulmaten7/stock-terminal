import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ businesses: [] }, { status: 401 });

  const admin = createAdminClient();
  const { data: members } = await admin.from("business_members").select("biz_no, role").eq("user_id", user.id).eq("status", "verified");
  const myRole: Record<string, string> = {};
  const bizNos: string[] = [];
  for (const m of members ?? []) { const b = m.biz_no as string; myRole[b] = m.role as string; if (!bizNos.includes(b)) bizNos.push(b); }
  if (bizNos.length === 0) return NextResponse.json({ businesses: [] });

  // 금감원 검증 사실 (advisor_directory 뷰에 대표·주소·신고기간·홈페이지·신고수 전부 있음)
  const { data: fss } = await admin.from("advisor_directory")
    .select("biz_no, company_name, representative, address, valid_from, valid_to, homepage, report_count")
    .in("biz_no", bizNos);
  const info: Record<string, Record<string, unknown>> = {};
  for (const f of fss ?? []) info[f.biz_no as string] = f as Record<string, unknown>;

  const { data: listings } = await admin.from("business_listing").select("biz_no, intro").in("biz_no", bizNos);
  const introMap: Record<string, string> = {};
  for (const l of listings ?? []) introMap[l.biz_no as string] = (l.intro as string) ?? "";

  const { data: links } = await admin.from("business_links").select("id, biz_no, type, url, label, status, is_paid").in("biz_no", bizNos).order("created_at", { ascending: true });
  const linksMap: Record<string, unknown[]> = {};
  for (const l of links ?? []) (linksMap[l.biz_no as string] ??= []).push(l);

  const { data: mgrs } = await admin.from("business_members").select("id, biz_no, email, status").in("biz_no", bizNos).eq("role", "manager");
  const mgrMap: Record<string, unknown[]> = {};
  for (const m of mgrs ?? []) (mgrMap[m.biz_no as string] ??= []).push({ id: m.id, email: (m.email as string) ?? "", status: m.status });

  const businesses = bizNos.map((b) => {
    const i = info[b] ?? {};
    return {
      biz_no: b,
      company_name: (i.company_name as string) ?? b,
      representative: (i.representative as string) ?? null,
      address: (i.address as string) ?? null,
      valid_from: (i.valid_from as string) ?? null,
      valid_to: (i.valid_to as string) ?? null,
      homepage: (i.homepage as string) ?? null,
      report_count: (i.report_count as number) ?? 0,
      intro: introMap[b] ?? "",
      links: linksMap[b] ?? [],
      myRole: myRole[b],
      managers: mgrMap[b] ?? [],
    };
  });
  return NextResponse.json({ businesses });
}
