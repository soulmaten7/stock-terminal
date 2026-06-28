export type OgResult = { title: string | null; image: string | null; description: string | null; siteName: string | null; status: string };

export function hostOf(u: string): string { try { return new URL(u).hostname; } catch { return ""; } }
export function isBlockedHost(host: string): boolean {
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

export async function fetchOg(url: string): Promise<OgResult> {
  if (isBlockedHost(hostOf(url))) return { title: null, image: null, description: null, siteName: null, status: "error" };
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
      const buf = await res.arrayBuffer();
      let charset = (ctype.match(/charset=["']?([\w-]+)/i)?.[1] ?? "").toLowerCase();
      if (!charset) {
        const head = new TextDecoder("latin1").decode(buf.slice(0, 4096));
        charset = (head.match(/charset=["']?([\w-]+)/i)?.[1] ?? "utf-8").toLowerCase();
      }
      const isKr = /euc-?kr|ks_c|cp949|949/.test(charset);
      let html: string;
      try { html = new TextDecoder(isKr ? "euc-kr" : "utf-8").decode(buf); }
      catch { html = new TextDecoder("utf-8").decode(buf); }
      html = html.slice(0, 600000);
      title = metaOf(html, "og:title") || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null);
      if (title) title = decodeEntities(title).trim().slice(0, 200) || null;
      image = metaOf(html, "og:image");
      description = metaOf(html, "og:description") || metaOf(html, "description");
      if (description) description = decodeEntities(description).slice(0, 300);
      siteName = metaOf(html, "og:site_name");
      if (title && title.includes("�")) title = null;
      if (description && description.includes("�")) description = null;
      if (siteName && siteName.includes("�")) siteName = null;
      if (image || title) status = "ok";
    } else { status = "error"; }
  } catch { status = "error"; }
  if (image && !/^https?:\/\//i.test(image)) { try { image = new URL(image, url).href; } catch { image = null; } }
  return { title, image, description, siteName, status };
}
