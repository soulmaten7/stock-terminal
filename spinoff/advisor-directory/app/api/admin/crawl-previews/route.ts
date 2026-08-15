import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOg } from "@/lib/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "dev only" }, { status: 403 });
  const limit = Math.min(300, parseInt(req.nextUrl.searchParams.get("limit") ?? "120", 10) || 120);
  const admin = createAdminClient();

  const { data: advRows } = await admin.from("advisor_directory").select("homepage").not("homepage", "is", null).neq("homepage", "");
  const allUrls = Array.from(new Set((advRows ?? []).map((r) => r.homepage as string).filter(Boolean)));
  const { data: cachedRows } = await admin.from("link_previews").select("url");
  const cachedSet = new Set((cachedRows ?? []).map((c) => c.url as string));
  const todo = allUrls.filter((u) => !cachedSet.has(u)).slice(0, limit);

  let crawled = 0;
  const conc = 8;
  for (let i = 0; i < todo.length; i += conc) {
    const batch = todo.slice(i, i + conc);
    await Promise.all(batch.map(async (url) => {
      const og = await fetchOg(url);
      await admin.from("link_previews").upsert({
        url, og_title: og.title, og_image: og.image, og_description: og.description, site_name: og.siteName,
        status: og.status, fetched_at: new Date().toISOString(),
      }, { onConflict: "url" });
      crawled++;
    }));
  }
  const remaining = allUrls.filter((u) => !cachedSet.has(u)).length - crawled;
  return NextResponse.json({ total: allUrls.length, crawled, remaining: Math.max(0, remaining) });
}
