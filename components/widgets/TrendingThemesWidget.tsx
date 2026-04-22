'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import WidgetCard from '@/components/home/WidgetCard';

interface Theme { name: string; change: number; count: number; }

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function TrendingThemesWidget({ inline = false, size = 'default' }: Props = {}) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/themes');
        const json = await res.json();
        if (json.themes) {
          const top5 = [...json.themes]
            .sort((a: Theme, b: Theme) => b.change - a.change)
            .slice(0, 5);
          setThemes(top5);
        }
      } catch {}
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const content = loading ? (
    <div className="flex flex-col h-full divide-y divide-[#F5F5F5]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 px-3">
          <div className="h-4 w-24 bg-[#F0F0F0] animate-pulse" />
          <div className="h-4 w-12 bg-[#F0F0F0] animate-pulse" />
        </div>
      ))}
    </div>
  ) : themes.length === 0 ? (
    <div className="h-full flex items-center justify-center">
      <p className="text-xs text-[#999]">데이터를 불러올 수 없습니다</p>
    </div>
  ) : (
    <div className="flex flex-col h-full divide-y divide-[#F5F5F5]">
      {themes.map((theme) => (
        <div key={theme.name} className="flex items-center justify-between py-2 px-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-[#1A1A2E] truncate">{theme.name}</span>
            <span className="text-[10px] text-[#999] shrink-0">{theme.count}종목</span>
          </div>
          <span className={`text-sm font-bold shrink-0 ${theme.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
            {theme.change >= 0 ? '+' : ''}{theme.change.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard
      title="상승 테마"
      subtitle="큐레이션 · 평균 등락률"
      href="/analysis"
      size={size}
      className="h-full"
      action={
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-[#FF3B30]" />
          <span className="text-[10px] text-[#FF3B30] font-bold">TOP 5</span>
        </div>
      }
    >
      {content}
    </WidgetCard>
  );
}
