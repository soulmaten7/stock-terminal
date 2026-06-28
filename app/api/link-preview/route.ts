import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hostOf(u: string): string {
  try { return new URL(u).hostname; } catch { return ""; }
}
// 사설/내부 주소 차단(SSRF 보조)
function isBlockedHost(host: string): boolean {
  if (!host) return true;
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true;
  return false;
}
function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
}
function metaOf(html: string, prop: string): string | null {
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
  const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
  const m = html.match(a) || html.match(b);
  return m ? decodeEntities(m[1]).trim() : null;
}

export async function GET(req: NextRequest) {
  const url = (req.nextUrl.searchParams.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return NextResponse.json({ status: "error" }, { status: 400 });
  if (isBlockedHost(hostOf(url))) return NextResponse.json({ status: "error" }, { status: 400 });

  const admin = createAdminClient();

  // 캐시 먼저
  const { data: cached } = await admin.from("link_previews").select("*").eq("url", url).maybeSingle();
  if (cached) {
    return NextResponse.json({
      title: cached.og_title, image: cached.og_image, description: cached.og_description,
      siteName: cached.site_name, status: cached.status,
    });
  }

  // 우리가 저장한 링크만 크롤 허용 (SSRF 차단)
  const { data: k1 } = await admin.from("advisor_directory").select("biz_no").eq("homepage", url).limit(1);
  let known = (k1?.length ?? 0) > 0;
  if (!known) {
    const { data: k2 } = await admin.from("business_links").select("id").eq("url", url).limit(1);
    known = (k2?.length ?? 0) > 0;
  }
  if (!known) return NextResponse.json({ status: "error" }, { status: 400 });

  // lazy 크롤
  let title: string | null = null, image: string | null = null, description: string | null = null, siteName: string | null = null, status = "empty";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      method: "GET", redirect: "follow", signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrillionBot/1.0; +https://onetrillion.app)", "Accept": "text/html" },
    });
    clearTimeout(t);
    const ctype = res.headers.get("content-type") ?? "";
    if (res.ok && ctype.includes("text/html")) {
      const html = (await res.text()).slice(0, 600000);
      title = metaOf(html, "og:title") || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null);
      if (title) title = decodeEntities(title).trim().slice(0, 200) || null;
      image = metaOf(html, "og:image");
      description = metaOf(html, "og:description") || metaOf(html, "description");
      if (description) description = description.slice(0, 300);
      siteName = metaOf(html, "og:site_name");
      if (image || title) status = "ok";
    } else {
      status = "error";
    }
  } catch {
    status = "error";
  }

  // og:image 상대경로 → 절대 보정
  if (image && !/^https?:\/\//i.test(image)) {
    try { image = new URL(image, url).href; } catch { image = null; }
  }

  await admin.from("link_previews").upsert({
    url, og_title: title, og_image: image, og_description: description, site_name: siteName,
    status, fetched_at: new Date().toISOString(),
  }, { onConflict: "url" });

  return NextResponse.json({ title, image, description, siteName, status });
}
