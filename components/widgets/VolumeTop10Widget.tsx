'use client';

import { useEffect, useState } from 'react';
import WidgetHeader from '@/components/dashboard/WidgetHeader';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface VolumeItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  spike: number;
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR');
}

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function VolumeTop10Widget({ inline = false, size = 'default' }: Props = {}) {
  const [items, setItems] = useState<VolumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  useEffect(() => {
    fetch('/api/kis/volume-rank?sort=spike&limit=10')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.stocks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxSpike = Math.max(5, ...items.map((x) => x.spike));

  const content = (
    <div role="table" aria-label="거래량 급등 종목 목록">
      <div role="rowgroup">
        <div
          role="row"
          className="grid grid-cols-[32px_1fr_80px_90px_70px] px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]"
        >
          <span role="columnheader">#</span>
          <span role="columnheader">종목</span>
          <span role="columnheader" className="text-right">배수</span>
          <span role="columnheader" className="text-right">현재가</span>
          <span role="columnheader" className="text-right">등락률</span>
        </div>
      </div>
      <div role="rowgroup">
        {items.slice(0, 10).map((r, i) => {
          const barPct = Math.min(100, Math.round((r.spike / maxSpike) * 100));
          const isExtreme = r.spike >= 10;
          const isHigh = r.spike >= 5 && r.spike < 10;
          const spikeColor = isExtreme
            ? 'text-[#FF3B30]'
            : isHigh
            ? 'text-[#FF9500]'
            : 'text-[#0ABAB5]';
          return (
            <div
              key={r.symbol}
              role="row"
              onClick={() => setSelected({ code: r.symbol, name: r.name, market: 'KR' })}
              className="grid grid-cols-[32px_1fr_80px_90px_70px] px-3 py-2.5 text-sm hover:bg-[#F8F9FA] border-b border-[#F0F0F0] cursor-pointer"
            >
              <span role="cell" className="text-[#999] font-bold">
                {i + 1}
              </span>
              <span role="cell" className="font-bold text-black truncate flex items-center gap-1">
                <span className="truncate">{r.name}</span>
                {isExtreme && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white shrink-0">
                    급등
                  </span>
                )}
              </span>
              <span role="cell" className="relative pr-1">
                <span
                  className={`absolute inset-y-1 left-0 rounded ${
                    isExtreme ? 'bg-[#FF3B30]/20' : isHigh ? 'bg-[#FF9500]/15' : 'bg-[#0ABAB5]/15'
                  }`}
                  style={{ width: `${barPct}%` }}
                />
                <span className={`relative text-right font-bold tabular-nums block ${spikeColor}`}>
                  {r.spike > 0 ? `${r.spike}x` : '—'}
                </span>
              </span>
              <span role="cell" className="text-right text-black tabular-nums">
                {fmt(r.price)}
              </span>
              <span
                role="cell"
                className={`text-right font-bold tabular-nums ${
                  r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                }`}
              >
                {r.changePercent >= 0 ? '+' : ''}
                {r.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
        {!loading && items.length === 0 && (
          <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
        )}
      </div>
    </div>
  );

  const widgetHeader = (
    <WidgetHeader
      title="거래량 급등 TOP 10"
      subtitle="KIS API · 배수 = 거래량 / 평균거래량"
      href="/movers/volume"
      actions={loading ? <span className="text-[10px] text-[#BBB]">로딩 중…</span> : undefined}
    />
  );

  if (inline) {
    return (
      <div className="flex flex-col h-full">
        {widgetHeader}
        <div className="flex-1 overflow-auto">{content}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {widgetHeader}
      <div className="flex-1 overflow-auto">{content}</div>
    </div>
  );
}
