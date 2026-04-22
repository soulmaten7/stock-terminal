'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsFeed from './NewsFeed';
import NewsFilter from './NewsFilter';

export interface FeedItem {
  id: string;
  type: 'news' | 'disclosure';
  time: string;
  sortKey: string;
  source: string;
  title: string;
  url: string;
  corpName?: string;
  stockCode?: string;
  isImportant?: boolean;
}

export interface Filters {
  tab: 'all' | 'news' | 'disclosure';
  sources: string[];
  disclosureTypes: string[];
  keyword: string;
}

const ALL_SOURCES = ['한국경제', '매일경제', '서울경제', '연합뉴스', '조선비즈'];

export default function NewsClient() {
  const sp = useSearchParams();
  const initSource = sp.get('source');
  const initTab = (['all', 'news', 'disclosure'].includes(sp.get('tab') || '')
    ? sp.get('tab')
    : 'all') as 'all' | 'news' | 'disclosure';

  const [mounted, setMounted] = useState(false);
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [filters, setFilters] = useState<Filters>({
    tab: initTab,
    sources: initSource ? [initSource] : ALL_SOURCES,
    disclosureTypes: [],
    keyword: '',
  });
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'all'>('all');
  const [onlyImportant, setOnlyImportant] = useState(false);

  const load = useCallback(async () => {
    const merged: FeedItem[] = [];
    try {
      const [dartRes, newsRes] = await Promise.all([
        fetch('/api/dart?endpoint=list&page_count=30'),
        fetch('/api/news?country=KR&limit=30'),
      ]);
      const dartData = await dartRes.json();
      const newsData = await newsRes.json();

      if (dartData.disclosures) {
        dartData.disclosures.forEach((d: Record<string, string | boolean>) => {
          const dt = d.rcept_dt as string;
          merged.push({
            id: `d-${d.rcept_no}`, type: 'disclosure',
            time: dt.length === 8 ? `${dt.slice(4, 6)}.${dt.slice(6, 8)}` : dt,
            sortKey: dt, source: '공시', title: (d.report_nm as string).trim(),
            url: d.url as string, corpName: d.corp_name as string, stockCode: d.stock_code as string,
            isImportant: d.is_important as boolean,
          });
        });
      }
      if (newsData.news) {
        newsData.news.forEach((n: Record<string, string>, i: number) => {
          const d = new Date(n.published_at);
          const time = isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          const sortKey = isNaN(d.getTime()) ? '' : d.toISOString();
          merged.push({ id: `n-${i}`, type: 'news', time, sortKey, source: n.source, title: n.title, url: n.url });
        });
      }
    } catch {}
    merged.sort((a, b) => (b.sortKey > a.sortKey ? 1 : -1));
    setAllItems(merged);
  }, []);

  useEffect(() => { setMounted(true); load(); const iv = setInterval(load, 5 * 60 * 1000); return () => clearInterval(iv); }, [load]);

  const now = Date.now();
  const rangeMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    all: Infinity,
  };

  const filtered = allItems.filter((item) => {
    if (filters.tab === 'news' && item.type !== 'news') return false;
    if (filters.tab === 'disclosure' && item.type !== 'disclosure') return false;
    if (item.type === 'news' && filters.sources.length > 0 && !filters.sources.includes(item.source)) return false;
    if (filters.keyword && !item.title.includes(filters.keyword) && !(item.corpName || '').includes(filters.keyword)) return false;
    if (onlyImportant && !item.isImportant) return false;
    if (timeRange !== 'all' && item.sortKey) {
      const ts = new Date(item.sortKey).getTime();
      if (!isNaN(ts) && now - ts > rangeMs[timeRange]) return false;
    }
    return true;
  });

  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">뉴스·공시</h1>
        <div className="space-y-3">{Array.from({ length: 10 }).map((_, i) => (<div key={i} className="h-12 bg-[#F0F0F0] animate-pulse" />))}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-8">뉴스·공시</h1>

      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(['1h', '24h', '7d', 'all'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`text-xs font-bold px-3 py-2 transition-colors ${
                timeRange === r
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {r === 'all' ? '전체' : r}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-[#333] cursor-pointer">
          <input
            type="checkbox"
            checked={onlyImportant}
            onChange={(e) => setOnlyImportant(e.target.checked)}
            className="accent-[#FF3B30]"
          />
          중요 공시만
        </label>
        <span className="text-xs text-[#888] ml-auto">{filtered.length}건</span>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <NewsFeed items={filtered} />
        </div>
        <div className="hidden md:block w-[300px] shrink-0">
          <NewsFilter filters={filters} onFilterChange={setFilters} />
        </div>
      </div>
    </div>
  );
}
