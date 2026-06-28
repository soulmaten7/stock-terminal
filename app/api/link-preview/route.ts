import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOg, hostOf, isBlockedHost } from "@/lib/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = (req.nextUrl.searchParams.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ status: "error" }, { status: 400 });
  if (isBlockedHost(hostOf(url))) return NextResponse.json({ status: "error" }, { status: 400 });

  const admin = createAdminClient();

  // 캐시 먼저
  const { data: cached } = await admin.from("link_previews").select("*").eq("url", url).maybeSingle();
  if (cached) {
    return NextResponse.json({ title: cached.og_title, image: cached.og_image, description: cached.og_description, siteName: cached.site_name, status: cached.status });
  }

  // 우리가 저장한 링크만 크롤 허용 (SSRF 차단)
  const { data: k1 } = await admin.from("advisor_directory").select("biz_no").eq("homepage", url).limit(1);
  let known = (k1?.length ?? 0) > 0;
  if (!known) {
    const { data: k2 } = await admin.from("business_links").select("id").eq("url", url).limit(1);
    known = (k2?.length ?? 0) > 0;
  }
  if (!known) return NextResponse.json({ status: "error" }, { status: 400 });

  const og = await fetchOg(url);
  await admin.from("link_previews").upsert({
    url, og_title: og.title, og_image: og.image, og_description: og.description, site_name: og.siteName,
    status: og.status, fetched_at: new Date().toISOString(),
  }, { onConflict: "url" });

  return NextResponse.json({ title: og.title, image: og.image, description: og.description, siteName: og.siteName, status: og.status });
}
