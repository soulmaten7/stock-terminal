'use client';

import WidgetCard from '@/components/home/WidgetCard';

const INDICES = [
  { name: 'KOSPI', val: '2,687.43', change: '+0.82%', up: true },
  { name: 'KOSDAQ', val: '862.15', change: '+1.14%', up: true },
  { name: 'S&P 500 선물', val: '5,312.50', change: '-0.23%', up: false },
  { name: 'NASDAQ 선물', val: '18,421.00', change: '-0.31%', up: false },
  { name: 'USD/KRW', val: '1,382.40', change: '+0.15%', up: true },
  { name: 'USD/JPY', val: '153.82', change: '+0.08%', up: true },
  { name: 'WTI 원유', val: '82.14', change: '+0.47%', up: true },
  { name: '미국채 10Y', val: '4.621%', change: '+0.03%p', up: false },
];

export default function GlobalIndicesWidget() {
  return (
    <WidgetCard
      title="글로벌 지수·환율·선물·채권"
      subtitle="Phase B · Yahoo Finance"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <div role="table" aria-label="글로벌 지수 목록">
        {INDICES.map((idx) => (
          <div key={idx.name} role="row" className="flex items-center justify-between px-3 py-1.5 border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
            <span role="cell" className="text-xs text-[#555]">{idx.name}</span>
            <div className="flex items-center gap-3">
              <span role="cell" className="text-xs font-bold text-black">{idx.val}</span>
              <span role="cell" className={`text-xs font-bold w-16 text-right ${idx.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{idx.change}</span>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
