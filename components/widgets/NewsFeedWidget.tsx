'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface NewsItem {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  timeAgo: string;
}

const SOURCE_COLOR: Record<string, string> = {
  '한국경제': 'text-[#0066CC]',
  '매일경제': 'text-[#CC0000]',
  '이데일리': 'text-[#009900]',
};

interface Props { size?: 'default' | 'large' }

export default function NewsFeedWidget({ size = 'default' }: Props = {}) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/home/news')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="뉴스 속보" subtitle="한경 · 매경 · 이데일리" href="/news" size={size}>
      {loading && (
        <div className="flex items-center justify-center h-24 text-xs text-[#999]">
          로딩 중…
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-24 text-xs text-[#FF3B30]">
          뉴스를 불러오지 못했습니다
        </div>
      )}
      {!loading && !error && (
        <ul aria-label="뉴스 목록" className="divide-y divide-[#F0F0F0] overflow-y-auto max-h-full">
          {items.map((n, i) => (
            <li key={i} className="px-3 py-2 hover:bg-[#F8F9FA]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] font-semibold ${SOURCE_COLOR[n.source] ?? 'text-[#999]'}`}>
                  {n.source}
                </span>
                {n.timeAgo && (
                  <span className="text-[10px] text-[#BBBBBB]">{n.timeAgo}</span>
                )}
              </div>
              {n.link ? (
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black leading-snug line-clamp-2 hover:text-[#0ABAB5] hover:underline"
                >
                  {n.title}
                </a>
              ) : (
                <p className="text-sm text-black leading-snug line-clamp-2">{n.title}</p>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-3 py-4 text-xs text-[#999] text-center">뉴스 없음</li>
          )}
        </ul>
      )}
    </WidgetCard>
  );
}
