'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Newspaper, ArrowRight } from 'lucide-react';

interface NewsItem { title: string; url: string; source: string; published_at: string; }

const SOURCE_COLORS: Record<string, string> = {
  '한국경제': 'text-[#2196F3]',
  '매일경제': 'text-[#FF4D4D]',
  '서울경제': 'text-[#FF9500]',
  '연합뉴스': 'text-[#0ABAB5]',
  '조선비즈': 'text-[#8B5CF6]',
};

export default function TodayNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const res = await fetch('/api/news?country=KR&limit=5'); const data = await res.json(); if (data.news) setNews(data.news); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr); if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-5 border-[3px] border-[#0ABAB5]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 text-black">
          <Newspaper className="w-4 h-4 text-[#0ABAB5]" />
          주요 뉴스
        </h3>
        <Link href="/news" className="text-xs text-black hover:text-[#0ABAB5] flex items-center gap-1 font-bold">
          더보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />))}
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Newspaper className="w-8 h-8 text-[#999999] mb-3" />
          <p className="text-[#999999] text-sm font-bold">오늘 등록된 뉴스가 없습니다</p>
          <p className="text-[#999999] text-xs mt-1">주요 뉴스가 곧 업데이트됩니다</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {news.map((n, i) => (
            <li key={`${n.url}-${i}`} className="flex items-start gap-3 text-sm py-1.5 border-b border-[#F0F0F0] last:border-0">
              <span className="text-[#999999] text-sm shrink-0 mt-0.5 font-mono-price font-medium">{formatTime(n.published_at)}</span>
              <div className="min-w-0 flex-1">
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-black font-medium text-sm hover:text-[#0ABAB5] line-clamp-1">{n.title}</a>
                <span className={`text-xs font-bold ${SOURCE_COLORS[n.source] || 'text-[#999999]'}`}>{n.source}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
