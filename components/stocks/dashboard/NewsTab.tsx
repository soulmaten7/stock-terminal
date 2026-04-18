'use client';

/**
 * NewsTab — Google News RSS 라이브 조회.
 *
 * 기존 V2: `news` DB 테이블 조회 (시딩 파이프라인 미비로 실질 빈 상태)
 * V3: `/api/stocks/news?symbol=...` 로 Google News RSS 라이브 호출 — 시딩 불요
 */

import { useState, useEffect } from 'react';
import { ExternalLink, Clock } from 'lucide-react';

interface NewsTabProps {
  stockId: number; // 호환용 — 라이브 모드에선 symbol 만 사용
  symbol: string;
}

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  publishedAt: string | null;
  source: string;
};

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const now = new Date();
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function NewsTab({ symbol }: NewsTabProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setErr('');
    fetch(`/api/stocks/news?symbol=${encodeURIComponent(symbol)}&limit=30`, {
      signal: ctl.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? '뉴스 조회 실패');
        setItems(d.items ?? []);
        setQuery(d.query ?? '');
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setErr(e.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {query && (
        <p className="text-[11px] text-[#999999]">
          검색어: <span className="font-bold text-[#666666]">{query}</span>
        </p>
      )}

      {err && (
        <div className="px-3 py-2 bg-[#FF3B30]/5 border border-[#FF3B30]/30 rounded text-xs text-[#FF3B30]">
          ⚠ {err}
        </div>
      )}

      {items.length === 0 && !err ? (
        <div className="text-center text-[#666666] py-20 text-sm">관련 뉴스를 찾지 못했습니다.</div>
      ) : (
        <div className="space-y-2">
          {items.map((n, i) => (
            <a
              key={`${n.link}-${i}`}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded border border-[#E5E7EB] p-3 hover:border-[#0ABAB5]/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-black text-sm font-medium group-hover:text-[#0ABAB5] transition-colors line-clamp-2">
                    {n.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#666666]">
                    {n.source && <span className="font-bold">{n.source}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(n.publishedAt)}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#666666] group-hover:text-[#0ABAB5] transition-colors shrink-0 mt-0.5" />
              </div>
            </a>
          ))}
        </div>
      )}

      <p className="text-[10px] text-[#999999] text-center">데이터: Google News RSS</p>
    </div>
  );
}
