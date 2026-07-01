'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';

type NewsItem = { title: string; link: string; source: string; pubDate: string; image?: string | null };

function timeAgo(pub: string): string {
  const t = new Date(pub).getTime();
  if (!t) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' }) {
  // US는 Yahoo ^GSPC RSS(키리스, query 무시). KR은 네이버 검색(query 사용).
  const isUs = country === 'US';
  const url = isUs
    ? '/api/news/feed?market=US' + (query ? '&q=' + encodeURIComponent(query) : '')
    : '/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : '');
  const cacheKey = isUs ? 'news:us:' + (query ?? '') : 'news:' + (query ?? '');
  const [items, setItems] = useState<NewsItem[]>(() => getCache<NewsItem[]>(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => getCache(cacheKey) === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache(cacheKey, list); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
  if (items.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">뉴스를 불러오지 못했습니다.</p>;

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">{title || '최신 뉴스'}</p>

      {/* 대표 기사 */}
      <a href={featured.link} target="_blank" rel="noopener noreferrer nofollow" className="group mb-3 block overflow-hidden rounded-xl border border-unjong-border">
        {featured.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={featured.image} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-32 w-full object-cover sm:h-36" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : null}
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{featured.title}</p>
          <p className="mt-1 text-xs text-unjong-muted">{featured.source} · {timeAgo(featured.pubDate)}</p>
        </div>
      </a>

      {/* 나머지 */}
      <ul>
        {rest.map((n, i) => (
          <li key={i}>
            <a href={n.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 border-b border-unjong-border py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-unjong-primary group-hover:text-unjong-accent">{n.title}</p>
                <p className="mt-0.5 text-xs text-unjong-muted">{n.source} · {timeAgo(n.pubDate)}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{isUs ? (query ? '출처: Google News. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : '출처: Yahoo Finance (S&P 500). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.') : '출처: 네이버 뉴스 검색. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.'}</p>
    </div>
  );
}
