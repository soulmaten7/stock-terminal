'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface MoverItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  priceText: string;
  changePercent: number;
}

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

const LIMIT = 30;
const UPPER_LIMIT = 29.5;
const LOWER_LIMIT = -29.5;

export default function MoversTop10Widget({ inline = false, size = 'default' }: Props = {}) {
  const [tab, setTab] = useState<'up' | 'down'>('up');
  const [upItems, setUpItems] = useState<MoverItem[]>([]);
  const [downItems, setDownItems] = useState<MoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/kis/movers?dir=up&limit=${LIMIT}`).then((r) => (r.ok ? r.json() : { items: [] })),
      fetch(`/api/kis/movers?dir=down&limit=${LIMIT}`).then((r) => (r.ok ? r.json() : { items: [] })),
    ])
      .then(([up, down]) => {
        setUpItems(up.items ?? []);
        setDownItems(down.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const raw = tab === 'up' ? upItems : downItems;
  const data = raw.slice(0, 10);
  const upperCount = upItems.filter((x) => x.changePercent >= UPPER_LIMIT).length;
  const lowerCount = downItems.filter((x) => x.changePercent <= LOWER_LIMIT).length;

  const tabButtons = (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setTab('up')}
        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
          tab === 'up' ? 'bg-[#FF3B30] text-white' : 'text-[#999] hover:text-black'
        }`}
      >
        상승{upperCount > 0 ? ` · 상한가 ${upperCount}` : ''}
      </button>
      <button
        onClick={() => setTab('down')}
        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
          tab === 'down' ? 'bg-[#0051CC] text-white' : 'text-[#999] hover:text-black'
        }`}
      >
        하락{lowerCount > 0 ? ` · 하한가 ${lowerCount}` : ''}
      </button>
    </div>
  );

  const body = (
    <>
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
            {data.map((r) => {
              const isUpper = r.changePercent >= UPPER_LIMIT;
              const isLower = r.changePercent <= LOWER_LIMIT;
              const isLimit = isUpper || isLower;
              return (
                <div
                  key={r.symbol}
                  role="row"
                  className={`grid grid-cols-3 px-3 py-2.5 text-sm border-b border-[#F0F0F0] hover:bg-[#F8F9FA] ${
                    isUpper ? 'bg-[#FFE5E3]' : isLower ? 'bg-[#E3ECFF]' : ''
                  }`}
                >
                  <span role="cell" className="font-bold text-black truncate flex items-center gap-1">
                    <span className="text-[#999] mr-1">{r.rank}</span>
                    <span className="truncate">{r.name}</span>
                    {isUpper && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white shrink-0">
                        상
                      </span>
                    )}
                    {isLower && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#0051CC] text-white shrink-0">
                        하
                      </span>
                    )}
                  </span>
                  <span
                    role="cell"
                    className={`text-right font-bold tabular-nums ${
                      tab === 'up' ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                    } ${isLimit ? 'underline' : ''}`}
                  >
                    {r.changePercent >= 0 ? '+' : ''}
                    {r.changePercent.toFixed(2)}%
                  </span>
                  <span role="cell" className="text-right text-black tabular-nums">
                    {r.priceText}
                  </span>
                </div>
              );
            })}
            {data.length === 0 && (
              <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (inline) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex justify-end px-3 py-2 border-b border-[#F0F0F0] shrink-0">
          {tabButtons}
        </div>
        <div className="flex-1 overflow-auto">{body}</div>
      </div>
    );
  }

  return (
    <WidgetCard
      title="상승/하락 TOP 10"
      subtitle="KIS API"
      href={`/movers/price?tab=${tab}`}
      size={size}
      action={tabButtons}
    >
      {body}
    </WidgetCard>
  );
}
