'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface NewsItem {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  timeAgo: string;
}

const SOURCE_COLORS: Record<string, string> = {
  '한국경제': '#E31837',
  '매일경제': '#0055B8',
  '이데일리': '#00A36C',
};

export default function NewsStreamWidget() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAt, setLastAt] = useState(0);

  const load = () => {
    setLoading(true);
    fetch('/api/home/news?limit=30')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => { setItems(d.items ?? []); setLastAt(Date.now()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-bold text-[#222]">뉴스 스트림</h3>
        <button
          onClick={load}
          className="text-[#999] hover:text-[#222] transition-colors"
          title="새로고침"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-0">
        {loading && items.length === 0 && Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="py-2 border-b border-[#F3F4F6]">
            <div className="h-3 w-3/4 bg-[#F0F0F0] animate-pulse rounded mb-1.5" />
            <div className="h-2.5 w-1/4 bg-[#F0F0F0] animate-pulse rounded" />
          </div>
        ))}
        {items.map((it, i) => (
          <a
            key={`${it.link}-${i}`}
            href={it.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2 py-2 border-b border-[#F3F4F6] hover:bg-[#FAFAFA] last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#222] leading-snug line-clamp-2 group-hover:text-[#0ABAB5]">
                {it.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="text-[10px] font-bold px-1 py-0.5 rounded text-white"
                  style={{ background: SOURCE_COLORS[it.source] ?? '#888' }}
                >
                  {it.source}
                </span>
                <span className="text-[10px] text-[#999]">{it.timeAgo}</span>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-[#CCC] group-hover:text-[#0ABAB5] shrink-0 mt-0.5" />
          </a>
        ))}
        {!loading && items.length === 0 && (
          <div className="py-8 text-center text-xs text-[#999]">뉴스를 불러올 수 없습니다</div>
        )}
      </div>
    </div>
  );
}
