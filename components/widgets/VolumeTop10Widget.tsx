'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface VolumeItem {
  rank?: number;
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

  useEffect(() => {
    fetch('/api/kis/volume-rank')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.stocks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const content = (
    <div role="table" aria-label="거래량 급등 종목 목록">
      <div role="rowgroup">
        <div
          role="row"
          className="grid grid-cols-5 px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]"
        >
          <span role="columnheader">#</span>
          <span role="columnheader">종목</span>
          <span role="columnheader" className="text-right">배수</span>
          <span role="columnheader" className="text-right">현재가</span>
          <span role="columnheader" className="text-right">등락률</span>
        </div>
      </div>
      <div role="rowgroup">
        {items.slice(0, 10).map((r, i) => (
          <div
            key={r.symbol}
            role="row"
            className="grid grid-cols-5 px-3 py-2.5 text-sm hover:bg-[#F8F9FA] border-b border-[#F0F0F0]"
          >
            <span role="cell" className="text-[#999] font-bold">{i + 1}</span>
            <span role="cell" className="font-bold text-black truncate">{r.name}</span>
            <span role="cell" className="text-right text-[#FF9500] font-bold">
              {r.spike > 0 ? `${r.spike}x` : '—'}
            </span>
            <span role="cell" className="text-right text-black">{fmt(r.price)}</span>
            <span
              role="cell"
              className={`text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
            >
              {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard
      title="거래량 급등 TOP 10"
      subtitle="KIS API"
      href="/movers/volume"
      size={size}
      action={
        loading ? <span className="text-[10px] text-[#BBB]">로딩 중…</span> : undefined
      }
    >
      {content}
    </WidgetCard>
  );
}
