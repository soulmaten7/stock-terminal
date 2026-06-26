import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewsItem = { title: string; link: string; source: string; pubDate: string; image: string | null };
type Parsed = NewsItem & { naver: string };

const cache = new Map<string, { at: number; data: unknown }>();

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'")
    .trim();
}
function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
function absUrl(src: string, base: string): string {
  try { return new URL(src, base).href; } catch { return src; }
}

async function ogImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const cand =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[name="twitter:image:src"]').attr("content") ||
      $('link[rel="image_src"]').attr("href");
    if (!cand) return null;
    return absUrl(cand.trim(), url);
  } catch {
    return null;
  }
}

const US_RSS = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC&region=US&lang=en-US";

function unCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (m ? m[1] : s)
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'")
    .trim();
}

// US: Yahoo ^GSPC RSS(키리스). <item>의 title(CDATA)/link/pubDate를 정규식으로 추출 → KR과 동일 shape.
async function usNews(): Promise<NewsItem[]> {
  const res = await fetch(US_RSS, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("yahoo_" + res.status);
  const xml = await res.text();

  const items: NewsItem[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/g) ?? [];
  for (const b of blocks) {
    const title = unCdata((b.match(/<title>([\s\S]*?)<\/title>/) ?? ["", ""])[1]);
    const link = ((b.match(/<link>([\s\S]*?)<\/link>/) ?? ["", ""])[1]).trim();
    const pubDate = ((b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? ["", ""])[1]).trim();
    if (!title || !link) continue;
    items.push({ title, link, source: hostOf(link), pubDate, image: null });
  }
  // 최신순 정렬 후 상위 20
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return items.slice(0, 20);
}

export async function GET(req: Request) {
  const market = (new URL(req.url).searchParams.get("market") || new URL(req.url).searchParams.get("country") || "").trim().toUpperCase();

  // ── US 분기(Yahoo ^GSPC RSS, 키리스) ──
  if (market === "US") {
    const hit = cache.get("US");
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
      return NextResponse.json(hit.data);
    }
    try {
      const items = await usNews();
      const data = { items };
      cache.set("US", { at: Date.now(), data });
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }

  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
  const id = (process.env.NAVER_CLIENT_ID || "").trim();
  const secret = (process.env.NAVER_CLIENT_SECRET || "").trim();
  if (!id || !secret) return NextResponse.json({ items: [], error: "no_key" });

  const q = (new URL(req.url).searchParams.get("q") || "증시").trim();

  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) {
    return NextResponse.json(hit.data);
  }

  try {
    const url = "https://openapi.naver.com/v1/search/news.json?query=" + encodeURIComponent(q) + "&display=20&sort=date";
    const res = await fetch(url, {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ items: [], error: "naver_" + res.status });
    const j = await res.json();

    const parsed: Parsed[] = ((j.items ?? []) as Record<string, string>[])
      .map((it) => {
        const orig = it.originallink || it.link || "";
        return {
          title: stripHtml(it.title || ""),
          link: orig,
          naver: it.link || "",
          source: hostOf(orig),
          pubDate: it.pubDate || "",
          image: null as string | null,
        };
      })
      .filter((x) => x.title && x.link);

    const TOP = Math.min(3, parsed.length); // og:image 스크래핑 대상 축소(6→3) — 느린 외부 fetch 줄이기, 없으면 image:null로 안전 fallback
    await Promise.all(
      parsed.slice(0, TOP).map(async (it) => {
        const tries: string[] = [];
        if (it.naver && /n\.news\.naver\.com/.test(it.naver)) tries.push(it.naver);
        if (it.link) tries.push(it.link);
        if (it.naver && !tries.includes(it.naver)) tries.push(it.naver);
        for (const u of tries) {
          const img = await ogImage(u);
          if (img) { it.image = img; break; }
        }
      })
    );

    let fi = parsed.findIndex((it) => it.image);
    if (fi < 0) fi = 0;
    const ordered = [parsed[fi], ...parsed.filter((_, i) => i !== fi)];

    const items: NewsItem[] = ordered.map((it) => ({
      title: it.title, link: it.link, source: it.source, pubDate: it.pubDate, image: it.image,
    }));

    const data = { items };
    cache.set(q, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
