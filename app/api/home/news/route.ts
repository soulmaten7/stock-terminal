import { NextResponse } from 'next/server';

const FEEDS = [
  { source: '한국경제', url: 'https://www.hankyung.com/feed/finance' },
  { source: '매일경제', url: 'https://www.mk.co.kr/rss/30000001/' },
  { source: '이데일리', url: 'https://www.edaily.co.kr/rss/rss-newsflash.asp' },
];

interface NewsItem {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  timeAgo: string;
}

function extractTag(xml: string, tag: string): string {
  // handles <tag>text</tag> and <tag><![CDATA[text]]></tag>
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

// <link> in RSS often has no closing tag — fall back to text after <link>
function extractLink(xml: string): string {
  const withClose = extractTag(xml, 'link');
  if (withClose) return withClose;
  const m = xml.match(/<link>([^<\s]+)/i);
  return m ? m[1].trim() : '';
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

async function fetchFeed(source: string, url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockTerminal/1.0; +https://stock-terminal.io)' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    for (const block of blocks.slice(0, 12)) {
      const raw = block[1];
      const title = extractTag(raw, 'title');
      if (!title) continue;
      const link = extractLink(raw);
      const pubDate = extractTag(raw, 'pubDate');
      items.push({ source, title, link, pubDate, timeAgo: timeAgo(pubDate) });
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f.source, f.url)));

  const all: NewsItem[] = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 30);

  return NextResponse.json(
    { items: all },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
  );
}
