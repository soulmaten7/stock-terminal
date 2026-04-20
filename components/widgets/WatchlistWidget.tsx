'use client';

import WidgetCard from '@/components/home/WidgetCard';

const DUMMY = [
  { name: '삼성전자', price: '78,400', change: '+1.29%', vol: '12.3M', up: true },
  { name: 'SK하이닉스', price: '198,500', change: '+2.84%', vol: '4.1M', up: true },
  { name: 'NAVER', price: '174,200', change: '-0.57%', vol: '891K', up: false },
  { name: 'LG에너지솔루션', price: '318,000', change: '+0.32%', vol: '342K', up: true },
  { name: '카카오', price: '42,150', change: '-1.17%', vol: '2.8M', up: false },
];

export default function WatchlistWidget() {
  return (
    <WidgetCard
      title="관심종목"
      subtitle="Phase B"
      className="h-full"
      href="/watchlist"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <div role="table" aria-label="관심종목 목록" className="w-full">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-4 px-3 py-1.5 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">종목</span>
            <span role="columnheader" className="text-right">현재가</span>
            <span role="columnheader" className="text-right">등락률</span>
            <span role="columnheader" className="text-right">거래량</span>
          </div>
        </div>
        <div role="rowgroup">
          {DUMMY.map((r) => (
            <div key={r.name} role="row" className="grid grid-cols-4 px-3 py-1.5 text-xs hover:bg-[#F8F9FA] border-b border-[#F0F0F0]">
              <span role="cell" className="font-bold text-black truncate">{r.name}</span>
              <span role="cell" className="text-right text-black">{r.price}</span>
              <span role="cell" className={`text-right font-bold ${r.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{r.change}</span>
              <span role="cell" className="text-right text-[#666]">{r.vol}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
