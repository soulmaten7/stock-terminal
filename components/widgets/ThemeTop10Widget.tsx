'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WidgetHeader from '@/components/dashboard/WidgetHeader';

interface Theme { name: string; change: number; count: number; }

type Mode = 'up' | 'down';

export default function ThemeTop10Widget() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('up');

  useEffect(() => {
    fetch('/api/themes')
      .then((r) => (r.ok ? r.json() : { themes: [] }))
      .then((d) => setThemes(d.themes ?? []))
      .catch(() => setThemes([]))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...themes]
    .sort((a, b) => mode === 'up' ? b.change - a.change : a.change - b.change)
    .slice(0, 10);

  const maxAbs = Math.max(1, ...sorted.map((t) => Math.abs(t.change)));

  const modeToggle = (
    <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB]">
      <button
        onClick={() => setMode('up')}
        className={`px-2.5 h-6 text-xs font-bold ${mode === 'up' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666] hover:bg-[#F3F4F6]'}`}
      >
        상승
      </button>
      <button
        onClick={() => setMode('down')}
        className={`px-2.5 h-6 text-xs font-bold ${mode === 'down' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666] hover:bg-[#F3F4F6]'}`}
      >
        하락
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader title="테마 Top 10" href="/themes" actions={modeToggle} />

      <ol className="flex-1 space-y-0.5 overflow-auto px-2 py-2">
        {loading && Array.from({ length: 10 }).map((_, i) => (
          <li key={i} className="flex items-center gap-2 py-1.5 px-1">
            <div className="w-4 h-3 bg-[#F0F0F0] animate-pulse" />
            <div className="flex-1 h-3 bg-[#F0F0F0] animate-pulse rounded" />
            <div className="w-12 h-3 bg-[#F0F0F0] animate-pulse" />
          </li>
        ))}
        {!loading && sorted.map((t, i) => {
          const pct = (Math.abs(t.change) / maxAbs) * 100;
          const isUp = t.change >= 0;
          return (
            <li key={t.name} className="relative">
              <div
                className={`absolute inset-0 rounded ${isUp ? 'bg-[#FF3B30]/6' : 'bg-[#0051CC]/6'}`}
                style={{ width: `${pct}%` }}
                aria-hidden="true"
              />
              <Link
                href={`/analysis?theme=${encodeURIComponent(t.name)}`}
                className="relative flex items-center gap-2 py-1.5 px-1 hover:bg-[#F3F4F6] rounded"
              >
                <span className="text-[#999] w-4 text-xs shrink-0">{i + 1}</span>
                <span className="flex-1 text-xs font-medium text-[#222] truncate">{t.name}</span>
                <span className="text-[10px] text-[#999] shrink-0">{t.count}종</span>
                <span className={`text-xs font-bold tabular-nums shrink-0 w-14 text-right ${isUp ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                  {isUp ? '+' : ''}{t.change.toFixed(2)}%
                </span>
              </Link>
            </li>
          );
        })}
        {!loading && sorted.length === 0 && (
          <li className="text-center text-xs text-[#999] py-4">데이터 없음</li>
        )}
      </ol>
    </div>
  );
}
