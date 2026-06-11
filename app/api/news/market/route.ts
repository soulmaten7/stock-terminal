import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 600; // 10분 캐싱

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  image?: string;
};

const SOURCES = [
  { name: "한경", url: "https://www.hankyung.com/feed/all-news" },
  { name: "매경", url: "https://www.mk.co.kr/rss/30000001/" },
  { name: "머니투데이", url: "https://rss.mt.co.kr/mt_news.xml" },
  { name: "이데일리", url: "https://rss.edaily.co.kr/edaily_news_rss.xml" },
  { name: "연합뉴스", url: "https://www.yna.co.kr/rss/economy.xml" },
];

function extractImage(itemXml: string): string | undefined {
  let m = itemXml.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i);
  if (m) return m[1];
  m = itemXml.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i);
  if (m) return m[1];
  m = itemXml.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (m) return m[1];
  return undefined;
}

function parseRSS(xml: string, publisher: string): NewsItem[] {
  const items: NewsItem[] = [];
  // RSS 2.0 형식 정규식 파싱 (단순)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([^<\]]+?)(?:\]\]>)?<\/title>/;
  const linkRegex = /<link>([^<]+)<\/link>/;
  const dateRegex = /<pubDate>([^<]+)<\/pubDate>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = (itemXml.match(titleRegex) || [])[1];
    const link = (itemXml.match(linkRegex) || [])[1];
    const date = (itemXml.match(dateRegex) || [])[1];
    if (title && link) {
      items.push({
        title: title.trim().replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
        link: link.trim(),
        publisher,
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        image: extractImage(itemXml),
      });
    }
  }
  return items;
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      SOURCES.map(async (src) => {
        const r = await fetch(src.url, {
          headers: { "User-Agent": "Mozilla/5.0 (Unjong Bot)" },
          next: { revalidate: 600 },
        });
        if (!r.ok) return [];
        const xml = await r.text();
        return parseRSS(xml, src.name);
      })
    );

    const all: NewsItem[] = [];
    results.forEach((res) => {
      if (res.status === "fulfilled") all.push(...res.value);
    });

    // 최신순 정렬 + 중복 제거 (제목 기준) + TOP 30
    const seen = new Set<string>();
    const sorted = all
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .filter((item) => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
      })
      .slice(0, 30);

    return NextResponse.json({ items: sorted });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
