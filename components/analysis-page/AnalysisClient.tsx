'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SectorHeatmap from './SectorHeatmap';
import ThemeGroups from './ThemeGroups';
import MarketFlow from './MarketFlow';
import EconomicDashboard from './EconomicDashboard';

interface Theme { name: string; change: number; count: number; }

export default function AnalysisClient() {
  const sp = useSearchParams();
  const highlighted = sp.get('theme');
  const [mounted, setMounted] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sort, setSort] = useState<'up' | 'down' | 'count'>('up');

  useEffect(() => {
    setMounted(true);
    fetch('/api/themes')
      .then((r) => r.json())
      .then((j) => setThemes(j.themes ?? []))
      .catch(() => {});
  }, []);

  const sortedThemes = [...themes].sort((a, b) => {
    if (sort === 'up') return b.change - a.change;
    if (sort === 'down') return a.change - b.change;
    return b.count - a.count;
  });

  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">시장 분석</h1>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#F0F0F0] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-8">시장 분석</h1>

      <SectorHeatmap />

      {/* 전체 테마 리스트 */}
      <section className="mt-8 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <header className="px-4 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-black">전체 테마</h2>
            <p className="text-xs text-[#999]">큐레이션 · {themes.length}개 테마 · 평균 등락률</p>
          </div>
          <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
            <button
              onClick={() => setSort('up')}
              className={`text-xs font-bold px-3 py-1.5 ${sort === 'up' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666]'}`}
            >
              상승순
            </button>
            <button
              onClick={() => setSort('down')}
              className={`text-xs font-bold px-3 py-1.5 ${sort === 'down' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666]'}`}
            >
              하락순
            </button>
            <button
              onClick={() => setSort('count')}
              className={`text-xs font-bold px-3 py-1.5 ${sort === 'count' ? 'bg-[#0ABAB5] text-white' : 'bg-white text-[#666]'}`}
            >
              종목수
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sortedThemes.map((t) => {
            const up = t.change >= 0;
            const isHighlight = highlighted && t.name === highlighted;
            return (
              <div
                key={t.name}
                className={`px-4 py-3 border-b border-r border-[#F0F0F0] flex items-center justify-between gap-2 hover:bg-[#F8F9FA] ${
                  isHighlight ? 'bg-[#0ABAB5]/10 ring-1 ring-[#0ABAB5]' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-black truncate">{t.name}</div>
                  <div className="text-[10px] text-[#999]">{t.count}종목</div>
                </div>
                <span className={`text-sm font-bold shrink-0 ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                  {up ? '+' : ''}{t.change.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <ThemeGroups />
        <MarketFlow />
      </div>

      <div className="mt-8">
        <EconomicDashboard />
      </div>
    </div>
  );
}
