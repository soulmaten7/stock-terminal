'use client';

import { useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';
import VolumeTop10Widget from './VolumeTop10Widget';
import MoversTop10Widget from './MoversTop10Widget';

interface Props { size?: 'default' | 'large' }

export default function VolumeMoversTabWidget({ size = 'default' }: Props = {}) {
  const [tab, setTab] = useState<'volume' | 'movers'>('volume');

  const tabs = [
    { id: 'volume' as const, label: '거래량 TOP' },
    { id: 'movers' as const, label: '상승/하락' },
  ];

  return (
    <WidgetCard title="시장 활성도" subtitle="KIS API · 분 단위" size={size}>
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
          {tab === 'volume' ? <VolumeTop10Widget inline /> : <MoversTop10Widget inline />}
        </div>
      </div>
    </WidgetCard>
  );
}
