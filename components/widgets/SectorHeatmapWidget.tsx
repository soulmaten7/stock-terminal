'use client';

import { useEffect, useState } from 'react';
import WidgetHeader from '@/components/dashboard/WidgetHeader';

interface Sector { sector: string; change: number; count: number; }

type Market = 'KR' | 'US';

function heatColor(change: number): string {
  const c = Math.max(-5, Math.min(5, change));
  if (c > 0) {
    const a = Math.round((c / 5) * 200 + 30);
    return `rgba(255,59,48,${(a / 255).toFixed(2)})`;
  }
  if (c < 0) {
    const a = Math.round((Math.abs(c) / 5) * 200 + 30);
    return `rgba(0,81,204,${(a / 255).toFixed(2)})`;
  }
  return '#F3F4F6';
}

function textColor(change: number): string {
  return Math.abs(change) > 1.5 ? '#FFFFFF' : '#222222';
}

export default function SectorHeatmapWidget() {
  const [market, setMarket] = useState<Market>('KR');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/home/sectors?market=${market}`)
      .then((r) => (r.ok ? r.json() : { sectors: [] }))
      .then((d) => setSectors(d.sectors ?? []))
      .catch(() => setSectors([]))
      .finally(() => setLoading(false));
  }, [market]);

  const marketToggle = (
    <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB]">
      {(['KR', 'US'] as Market[]).map((m) => (
        <button
          key={m}
          onClick={() => setMarket(m)}
          className={`px-3 h-6 text-xs font-bold ${
            market === m ? 'bg-[#0ABAB5] text-white' : 'bg-white text-[#666] hover:bg-[#F3F4F6]'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* TODO: /market-map 페이지 미구현 — STEP 84+ */}
      <WidgetHeader title="섹터 히트맵" actions={marketToggle} />

      {loading ? (
        <div className="flex-1 grid grid-cols-4 gap-1.5 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#F0F0F0] animate-pulse rounded" />
          ))}
        </div>
      ) : sectors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-[#999]">데이터 없음</div>
      ) : (
        <div className="flex-1 grid grid-cols-4 gap-1.5 p-3 content-start">
          {sectors.map((s) => (
            <div
              key={s.sector}
              className="rounded p-1.5 flex flex-col justify-between min-h-[52px]"
              style={{ background: heatColor(s.change) }}
            >
              <span className="text-[10px] font-medium leading-tight" style={{ color: textColor(s.change) }}>
                {s.sector}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: textColor(s.change) }}>
                {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 px-3 text-[10px] text-[#AAA]">
        {market === 'KR' ? 'KRX 섹터 ETF 당일 등락' : 'SPDR 섹터 ETF 당일 등락'}
      </p>
    </div>
  );
}
