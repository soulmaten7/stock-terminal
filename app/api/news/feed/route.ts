import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewsItem = { title: string; link: string; source: string; pubDate: string; image: string | null };
type Parsed = NewsItem & { naver: string };

let cache: { at: number; data: unknown } | null = null;

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

export async function GET() {
  const id = (process.env.NAVER_CLIENT_ID || "").trim();
  const secret = (process.env.NAVER_CLIENT_SECRET || "").trim();
  if (!id || !secret) return NextResponse.json({ items: [], error: "no_key" });

  if (cache && Date.now() - cache.at < 15 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  try {
    const url = "https://openapi.naver.com/v1/search/news.json?query=" + encodeURIComponent("증시") + "&display=20&sort=date";
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

    // 상위 6개 og:image 병렬 수집 (원문 실패 시 네이버 링크로 재시도)
    const TOP = Math.min(6, parsed.length);
    await Promise.all(
      parsed.slice(0, TOP).map(async (it) => {
        let img = await ogImage(it.link);
        if (!img && it.naver && it.naver !== it.link) img = await ogImage(it.naver);
        it.image = img;
      })
    );

    // 대표 = 이미지 있는 첫 기사 (없으면 맨 앞). 그 기사를 맨 앞으로 올림.
    let fi = parsed.findIndex((it) => it.image);
    if (fi < 0) fi = 0;
    const ordered = [parsed[fi], ...parsed.filter((_, i) => i !== fi)];

    const items: NewsItem[] = ordered.map((it) => ({
      title: it.title,
      link: it.link,
      source: it.source,
      pubDate: it.pubDate,
      image: it.image,
    }));

    const data = { items };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
