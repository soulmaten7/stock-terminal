'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface MoverItem {
  rank: number;
  symbol: string;
  name: string;
  price: string;
  changePercent: number;
}

export default function MoversTop10Widget() {
  const [tab, setTab] = useState<'up' | 'down'>('up');
  const [upItems, setUpItems] = useState<MoverItem[]>([]);
  const [downItems, setDownItems] = useState<MoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/kis/movers?dir=up').then((r) => (r.ok ? r.json() : { items: [] })),
      fetch('/api/kis/movers?dir=down').then((r) => (r.ok ? r.json() : { items: [] })),
    ])
      .then(([up, down]) => {
        setUpItems(up.items ?? []);
        setDownItems(down.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const data = tab === 'up' ? upItems : downItems;

  return (
    <WidgetCard
      title="상승/하락 TOP 10"
      subtitle="KIS API"
      href="/movers/price"
      action={
        <div className="flex gap-1">
          <button
            onClick={() => setTab('up')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
              tab === 'up' ? 'bg-[#FF3B30] text-white' : 'text-[#999] hover:text-black'
            }`}
          >
            상승
          </button>
          <button
            onClick={() => setTab('down')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
              tab === 'down' ? 'bg-[#0051CC] text-white' : 'text-[#999] hover:text-black'
            }`}
          >
            하락
          </button>
        </div>
      }
    >
      {loading && (
        <div className="flex items-center justify-center h-20 text-xs text-[#999]">로딩 중…</div>
      )}
      {!loading && (
        <div role="table" aria-label="상승하락 종목 목록">
          <div role="rowgroup">
            <div
              role="row"
              className="grid grid-cols-3 px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]"
            >
              <span role="columnheader">#  종목</span>
              <span role="columnheader" className="text-right">등락률</span>
              <span role="columnheader" className="text-right">현재가</span>
            </div>
          </div>
          <div role="rowgroup">
            {data.map((r) => (
              <div
                key={r.symbol}
                role="row"
                className="grid grid-cols-3 px-3 py-2.5 text-sm hover:bg-[#F8F9FA] border-b border-[#F0F0F0]"
              >
                <span role="cell" className="font-bold text-black truncate">
                  <span className="text-[#999] mr-1">{r.rank}</span>
                  {r.name}
                </span>
                <span
                  role="cell"
                  className={`text-right font-bold ${
                    tab === 'up' ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                  }`}
                >
                  {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
                </span>
                <span role="cell" className="text-right text-black">{r.price}</span>
              </div>
            ))}
            {data.length === 0 && (
              <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
            )}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
