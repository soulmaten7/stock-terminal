import { NextRequest, NextResponse } from 'next/server';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  published_at: string;
}

// 한경, 매경 등 주요 경제 뉴스 RSS
const KR_FEEDS = [
  { url: 'https://www.hankyung.com/feed/economy', source: '한국경제' },
  { url: 'https://www.mk.co.kr/rss/30100041/', source: '매일경제' },
  { url: 'https://www.sedaily.com/RSS/BC', source: '서울경제' },
  { url: 'https://www.yna.co.kr/rss/economy.xml', source: '연합뉴스' },
  { url: 'https://biz.chosun.com/rss/allnews.xml', source: '조선비즈' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'KR';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    const feeds = country === 'KR' ? KR_FEEDS : KR_FEEDS; // US feeds 추가 가능
    const allNews: NewsItem[] = [];

    await Promise.all(
      feeds.map(async (feed) => {
        try {
          const res = await fetch(feed.url, {
            next: { revalidate: 600 },
            headers: { 'User-Agent': 'StockTerminal/1.0' },
          });

          if (!res.ok) return;

          const xml = await res.text();
          const items = parseRssItems(xml, feed.source);
          allNews.push(...items);
        } catch {
          // 개별 피드 실패 시 무시
        }
      })
    );

    // 날짜 기준 정렬 후 limit 적용
    allNews.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return NextResponse.json({ news: allNews.slice(0, limit) });
  } catch {
    return NextResponse.json({ news: [], error: 'Failed to fetch news' });
  }
}

function parseRssItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Simple XML parser for RSS <item> elements
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');

    if (title && link) {
      items.push({
        title: cleanHtml(title),
        url: link.trim(),
        source,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`);
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1];

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1] : null;
}

function cleanHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
