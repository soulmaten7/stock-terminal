'use client';

import { Search, Bell } from 'lucide-react';
import type { Filters } from './NewsClient';

const SOURCES = ['한국경제', '매일경제', '서울경제', '연합뉴스', '조선비즈'];
const TABS: { key: Filters['tab']; label: string }[] = [
  { key: 'all', label: '전체' }, { key: 'news', label: '뉴스만' }, { key: 'disclosure', label: '공시만' },
];

export default function NewsFilter({ filters, onFilterChange }: { filters: Filters; onFilterChange: (f: Filters) => void }) {
  const toggleSource = (s: string) => {
    const next = filters.sources.includes(s) ? filters.sources.filter((x) => x !== s) : [...filters.sources, s];
    onFilterChange({ ...filters, sources: next });
  };

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-5 space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB]">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => onFilterChange({ ...filters, tab: t.key })}
            className={`flex-1 py-2 text-xs font-bold ${filters.tab === t.key ? 'text-[#0ABAB5] border-b-2 border-[#0ABAB5]' : 'text-black'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Keyword */}
      <div>
        <label className="text-xs font-bold text-black mb-2 block">키워드 검색</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input type="text" value={filters.keyword} onChange={(e) => onFilterChange({ ...filters, keyword: e.target.value })}
            placeholder="종목명, 키워드" className="w-full pl-9 pr-3 py-2 bg-[#F5F5F5] border border-[#E5E7EB] text-sm text-black placeholder:text-[#999999] focus:outline-none focus:border-[#0ABAB5]" />
        </div>
      </div>

      {/* Sources */}
      {filters.tab !== 'disclosure' && (
        <div>
          <label className="text-xs font-bold text-black mb-2 block">매체 필터</label>
          <div className="space-y-2">
            {SOURCES.map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.sources.includes(s)} onChange={() => toggleSource(s)}
                  className="w-4 h-4 accent-[#0ABAB5]" />
                <span className="text-sm text-black font-medium">{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Alert */}
      <button className="w-full flex items-center justify-center gap-2 py-2 border border-[#E5E7EB] text-sm text-[#999999] font-bold hover:border-[#0ABAB5] hover:text-[#0ABAB5]">
        <Bell className="w-4 h-4" /> 키워드 알림 설정
      </button>
    </div>
  );
}
