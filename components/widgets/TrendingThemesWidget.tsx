'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import WidgetCard from '@/components/home/WidgetCard';

interface Theme { name: string; change: number; count: number; }

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

type Mode = 'up' | 'down';

export default function TrendingThemesWidget({ inline = false, size = 'default' }: Props = {}) {
  const [allThemes, setAllThemes] = useState<Theme[]>([]);
  const [mode, setMode] = useState<Mode>('up');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/themes');
        const json = await res.json();
        if (json.themes) setAllThemes(json.themes);
      } catch {}
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const themes = [...allThemes]
    .sort((a, b) => (mode === 'up' ? b.change - a.change : a.change - b.change))
    .slice(0, 5);

  const maxAbs = Math.max(1, ...themes.map((t) => Math.abs(t.change)));

  const controls = (
    <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
      <button
        type="button"
        onClick={() => setMode('up')}
        className={`text-[10px] font-bold px-2 py-0.5 ${
          mode === 'up' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666]'
        }`}
      >
        상승
      </button>
      <button
        type="button"
        onClick={() => setMode('down')}
        className={`text-[10px] font-bold px-2 py-0.5 ${
          mode === 'down' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666]'
        }`}
      >
        하락
      </button>
    </div>
  );

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
      {themes.map((theme) => {
        const pct = (Math.abs(theme.change) / maxAbs) * 100;
        const isUp = theme.change >= 0;
        return (
          <Link
            key={theme.name}
            href={`/analysis?theme=${encodeURIComponent(theme.name)}`}
            className="relative flex items-center justify-between py-2 px-3 hover:bg-[#F8F9FA]"
          >
            {/* bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 ${isUp ? 'bg-[#FF3B30]/5' : 'bg-[#0051CC]/5'}`}
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-[#1A1A2E] truncate">{theme.name}</span>
              <span className="text-[10px] text-[#999] shrink-0">{theme.count}종목</span>
            </div>
            <span className={`relative text-sm font-bold shrink-0 ${isUp ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
              {isUp ? '+' : ''}{theme.change.toFixed(1)}%
            </span>
          </Link>
        );
      })}
    </div>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard
      title={mode === 'up' ? '상승 테마' : '하락 테마'}
      subtitle="큐레이션 · 평균 등락률"
      href="/analysis"
      size={size}
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {controls}
          <div className="flex items-center gap-1">
            {mode === 'up' ? (
              <TrendingUp className="w-3 h-3 text-[#FF3B30]" />
            ) : (
              <TrendingDown className="w-3 h-3 text-[#0051CC]" />
            )}
            <span className={`text-[10px] font-bold ${mode === 'up' ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
              TOP 5
            </span>
          </div>
        </div>
      }
    >
      {content}
    </WidgetCard>
  );
}
