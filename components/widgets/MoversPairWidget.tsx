'use client';

import { useEffect, useState } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface MoverItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  priceText: string;
  changePercent: number;
}

export default function MoversPairWidget() {
  const [gainers, setGainers] = useState<MoverItem[]>([]);
  const [losers, setLosers] = useState<MoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  useEffect(() => {
    Promise.all([
      fetch('/api/kis/movers?dir=up&limit=10').then((r) => (r.ok ? r.json() : { items: [] })),
      fetch('/api/kis/movers?dir=down&limit=10').then((r) => (r.ok ? r.json() : { items: [] })),
    ])
      .then(([g, l]) => { setGainers(g.items ?? []); setLosers(l.items ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const renderList = (items: MoverItem[], up: boolean) => (
    <ol className="text-xs space-y-0.5">
      {loading && <li className="text-[#999] text-center py-4">로딩 중…</li>}
      {!loading && items.length === 0 && <li className="text-[#999] text-center py-4">데이터 없음</li>}
      {!loading && items.slice(0, 10).map((it, i) => {
        const isLimit = Math.abs(it.changePercent) >= 29.5;
        return (
          <li
            key={it.symbol}
            onClick={() => setSelected({ code: it.symbol, name: it.name, market: 'KR' })}
            className={`flex items-center justify-between px-2 py-1.5 hover:bg-[#F3F4F6] cursor-pointer rounded ${
              isLimit ? (up ? 'bg-[#FFE5E3]' : 'bg-[#E3ECFF]') : ''
            }`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-[#999] w-4 shrink-0">{i + 1}</span>
              <span className="truncate font-medium text-black">{it.name}</span>
              {isLimit && (
                <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${
                  up ? 'bg-[#FF3B30] text-white' : 'bg-[#0051CC] text-white'
                }`}>{up ? '상' : '하'}</span>
              )}
            </span>
            <span className={`tabular-nums font-bold shrink-0 ml-2 ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
              {it.changePercent >= 0 ? '+' : ''}{it.changePercent.toFixed(2)}%
            </span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="p-3 h-full flex flex-col">
      <h3 className="text-sm font-bold text-[#222] mb-3">급등락 Top 10</h3>
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#FF3B30] mb-2">🔺 상승</div>
          {renderList(gainers, true)}
        </div>
        <div className="border-l border-[#E5E7EB] pl-3 min-w-0">
          <div className="text-xs font-bold text-[#0051CC] mb-2">🔻 하락</div>
          {renderList(losers, false)}
        </div>
      </div>
    </div>
  );
}
