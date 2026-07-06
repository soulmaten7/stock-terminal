// R3: 종목 뉴스 헤드라인(Google News RSS·키리스). 앱 기존 모아보기 뉴스와 동일 소스 계열.
// 여기선 헤드라인만 가져온다(LLM 요약은 라우트). 프레임워크 무관.
export type Headline = { title: string; date: string; source: string };

export async function fetchStockNews(query: string, limit = 8): Promise<Headline[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrillionBot/1.0; +https://onetrillion.app)' },
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const strip = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    const out: Headline[] = [];
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const b = m[1];
      const title = strip(b.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
      const date = (b.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '').trim();
      const source = strip(b.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '');
      if (title) out.push({ title, date, source });
      if (out.length >= limit) break;
    }
    return out;
  } catch { return []; }
}
