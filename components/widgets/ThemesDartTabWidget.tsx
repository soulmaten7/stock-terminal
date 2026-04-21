'use client';

import { useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';
import TrendingThemesWidget from './TrendingThemesWidget';
import DartFilingsWidget from './DartFilingsWidget';

export default function ThemesDartTabWidget() {
  const [tab, setTab] = useState<'themes' | 'dart'>('themes');

  const tabs = [
    { id: 'themes' as const, label: '상승 테마' },
    { id: 'dart' as const, label: 'DART 공시' },
  ];

  return (
    <WidgetCard title="발견 피드" subtitle="테마 · 공시">
      <div className="h-full flex flex-col">
        <div className="flex border-b border-[#E5E7EB] shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-1.5 text-[11px] font-bold transition-colors ${
                tab === t.id
                  ? 'text-black border-b-2 border-[#0ABAB5] bg-white'
                  : 'text-[#999] hover:text-[#555]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          {tab === 'themes' ? <TrendingThemesWidget inline /> : <DartFilingsWidget inline />}
        </div>
      </div>
    </WidgetCard>
  );
}
