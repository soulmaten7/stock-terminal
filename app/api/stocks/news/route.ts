import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/stocks/news?symbol=005930&limit=30
 *
 * Google News RSS 를 종목명으로 쿼리해 실시간 뉴스 피드 반환.
 * 외부 키 불요. Rate-limit 는 Google 쪽 정책에 의존.
 * 정교한 전문 검색이 아니므로 일부 무관 결과 포함될 수 있음.
 */

type NewsItem = {
  title: string;
  link: string;
  pubDate: string; // RFC 1123 형식
  publishedAt: string | null; // ISO 8601
  source: string;
};

function stripCdataAndHtml(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseRssItems(xml: string): NewsItem[] {
  const out: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const pick = (chunk: string, tag: string) => {
    const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const m = r.exec(chunk);
    return m ? m[1].trim() : '';
  };
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const chunk = m[1];
    const title = stripCdataAndHtml(pick(chunk, 'title'));
    const link = stripCdataAndHtml(pick(chunk, 'link'));
    const pubDate = pick(chunk, 'pubDate');
    const source = stripCdataAndHtml(pick(chunk, 'source'));
    if (title && link) {
      let iso: string | null = null;
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) iso = d.toISOString();
      }
      out.push({ title, link, pubDate, publishedAt: iso, source });
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 30)));

  if (!symbol) {
    return NextResponse.json({ error: 'symbol 파라미터 필요' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: stock } = await supabase
    .from('stocks')
    .select('name_ko, name_en, country')
    .eq('symbol', symbol.toUpperCase())
    .maybeSingle();

  if (!stock) {
    return NextResponse.json({ error: '종목을 찾을 수 없습니다', items: [] }, { status: 404 });
  }

  // KR 종목은 한국어 이름 + '주식' 으로 검색, US 종목은 영문명 + 'stock'
  const s = stock as { name_ko: string | null; name_en: string | null; country: string | null };
  const isKR = s.country === 'KR';
  const name = isKR ? s.name_ko ?? s.name_en : s.name_en ?? s.name_ko;
  if (!name) {
    return NextResponse.json({ error: '종목명 없음', items: [] }, { status: 404 });
  }

  const query = isKR ? `${name} 주식` : `${name} stock`;
  const params = new URLSearchParams({
    q: query,
    hl: isKR ? 'ko' : 'en',
    gl: isKR ? 'KR' : 'US',
    ceid: isKR ? 'KR:ko' : 'US:en',
  });

  const url = `https://news.google.com/rss/search?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockTerminal/1.0)' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Google News RSS HTTP ${res.status}`, items: [] },
        { status: 502 }
      );
    }
    const xml = await res.text();
    const items = parseRssItems(xml).slice(0, limit);

    return NextResponse.json({
      query,
      symbol: symbol.toUpperCase(),
      name,
      items,
      meta: {
        total: items.length,
        source: 'Google News RSS',
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `뉴스 조회 실패: ${msg}`, items: [] },
      { status: 502 }
    );
  }
}
