'use client';

import { useState, useEffect } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface NewsItem {
  title: string;
  link: string;
  publishedAt: string | null;
  source: string;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export default function NewsTab() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const _selected = useSelectedSymbolStore((s) => s.selected);
  const selected = mounted ? _selected : null;
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(false);
    fetch(`/api/stocks/news?symbol=${selected.code}&limit=50`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setItems(d?.items ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [selected?.code]);

  if (!selected) {
    return <div className="py-8 text-center text-xs text-[#999]">좌측에서 종목을 선택하세요</div>;
  }
  if (loading) return <ListSkeleton count={5} />;
  if (error) return <div className="py-8 text-center text-xs text-[#999]">뉴스를 불러오지 못했습니다</div>;
  if (!items.length) return <div className="py-8 text-center text-xs text-[#999]">최근 뉴스가 없습니다</div>;

  return (
    <ul className="py-2 divide-y divide-[#F0F0F0]">
      {items.map((n, i) => (
        <li key={i} className="py-2">
          <a
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-[#F9F9F9] -mx-2 px-2 py-1 rounded"
          >
            <div className="text-xs text-black font-medium leading-snug mb-0.5 line-clamp-2">{n.title}</div>
            <div className="text-[10px] text-[#999] flex gap-1.5">
              {n.publishedAt && <span>{formatRelativeTime(n.publishedAt)}</span>}
              {n.publishedAt && n.source && <span>·</span>}
              {n.source && <span className="truncate">{n.source}</span>}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <ul className="py-2 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="border-b border-[#F0F0F0] pb-3 last:border-0 animate-pulse">
          <div className="h-3 bg-[#F0F0F0] rounded w-5/6 mb-1.5" />
          <div className="h-2 bg-[#F0F0F0] rounded w-1/3" />
        </li>
      ))}
    </ul>
  );
}
