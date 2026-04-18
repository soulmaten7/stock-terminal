'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface FeedItem {
  id: string;
  type: 'news' | 'disclosure';
  time: string;
  source: string;
  title: string;
  url: string;
  isImportant?: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  '한국경제': 'text-[#2196F3]',
  '매일경제': 'text-[#34C759]',
  '서울경제': 'text-[#8B5CF6]',
  '연합뉴스': 'text-[#FF4D4D]',
  '조선비즈': 'text-[#FF9500]',
  '공시': 'text-[#FF4D4D]',
};

export default function BreakingFeed() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);

  const load = useCallback(async () => {
    const merged: FeedItem[] = [];
    try {
      const [dartRes, newsRes] = await Promise.all([
        fetch('/api/dart?endpoint=list&page_count=8'),
        fetch('/api/news?country=KR&limit=8'),
      ]);
      const dartData = await dartRes.json();
      const newsData = await newsRes.json();

      if (dartData.disclosures) {
        dartData.disclosures.forEach((d: Record<string, string | boolean>) => {
          const dt = d.rcept_dt as string;
          merged.push({
            id: `d-${d.rcept_no}`,
            type: 'disclosure',
            time: dt.length === 8 ? `${dt.slice(4, 6)}.${dt.slice(6, 8)}` : dt,
            source: '공시',
            title: `${d.corp_name} — ${(d.report_nm as string).trim()}`,
            url: d.url as string,
            isImportant: d.is_important as boolean,
          });
        });
      }

      if (newsData.news) {
        newsData.news.forEach((n: Record<string, string>, i: number) => {
          const d = new Date(n.published_at);
          const time = isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          merged.push({
            id: `n-${i}`,
            type: 'news',
            time,
            source: n.source,
            title: n.title,
            url: n.url,
          });
        });
      }
    } catch {}

    if (merged.length === 0) {
      merged.push(
        { id: 'demo-1', type: 'news', time: '09:32', source: '한국경제', title: '코스피, 장 초반 강보합 출발...외국인 순매수', url: '#' },
        { id: 'demo-2', type: 'disclosure', time: '09:30', source: '공시', title: '삼성전자 — 분기보고서 (2026.03)', url: '#', isImportant: true },
        { id: 'demo-3', type: 'news', time: '09:28', source: '매일경제', title: 'SK하이닉스, AI 반도체 수주 사상 최대', url: '#' },
      );
    }

    merged.sort((a, b) => (b.time > a.time ? 1 : -1));
    setItems(merged.slice(0, 15));
  }, []);

  useEffect(() => {
    setMounted(true);
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#FF4D4D]" />
            <h3 className="text-base font-bold text-black">속보</h3>
          </div>
          <span className="text-xs text-[#999999] font-bold">전체 보기 →</span>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#FF4D4D] animate-pulse" />
          <h3 className="text-base font-bold text-black">속보</h3>
        </div>
        <Link href="/news" className="text-xs text-[#999999] hover:text-[#0ABAB5] font-bold">전체 보기 →</Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />))}
          </div>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className={`px-4 py-2.5 border-b border-[#F0F0F0] last:border-0 hover:bg-[#F5F5F5] ${item.isImportant ? 'bg-[#FFF5F5]' : ''}`}>
                <a href={item.url} target={item.type === 'news' ? '_blank' : undefined} rel={item.type === 'news' ? 'noopener noreferrer' : undefined}
                  className="flex items-start gap-2">
                  {item.isImportant && <span className="text-[#FF4D4D] text-xs mt-0.5 shrink-0">●</span>}
                  <span className="text-[#999999] text-xs font-mono-price font-bold shrink-0 mt-0.5 w-10">{item.time}</span>
                  <span className={`text-xs font-bold shrink-0 mt-0.5 ${SOURCE_COLORS[item.source] || 'text-[#999999]'}`}>[{item.source}]</span>
                  <span className="text-black text-sm font-medium hover:text-[#0ABAB5] line-clamp-1">{item.title}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
