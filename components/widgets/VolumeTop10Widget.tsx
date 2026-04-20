'use client';

import WidgetCard from '@/components/home/WidgetCard';

const DUMMY = [
  { rank: 1, name: '에코프로비엠', mult: '18.3x', price: '124,500', change: '+8.4%', up: true },
  { rank: 2, name: '포스코퓨처엠', mult: '12.1x', price: '232,000', change: '+5.2%', up: true },
  { rank: 3, name: '셀트리온', mult: '9.7x', price: '178,500', change: '+3.1%', up: true },
  { rank: 4, name: '카카오게임즈', mult: '7.4x', price: '18,200', change: '-4.2%', up: false },
  { rank: 5, name: 'HLB', mult: '6.2x', price: '54,700', change: '+12.8%', up: true },
];

export default function VolumeTop10Widget() {
  return (
    <WidgetCard
      title="거래량 급등 TOP 10"
      subtitle="Phase B · KIS API"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <div role="table" aria-label="거래량 급등 종목 목록">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-5 px-3 py-1.5 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">#</span>
            <span role="columnheader">종목</span>
            <span role="columnheader" className="text-right">배수</span>
            <span role="columnheader" className="text-right">현재가</span>
            <span role="columnheader" className="text-right">등락률</span>
          </div>
        </div>
        <div role="rowgroup">
          {DUMMY.map((r) => (
            <div key={r.rank} role="row" className="grid grid-cols-5 px-3 py-1.5 text-xs hover:bg-[#F8F9FA] border-b border-[#F0F0F0]">
              <span role="cell" className="text-[#999] font-bold">{r.rank}</span>
              <span role="cell" className="font-bold text-black truncate">{r.name}</span>
              <span role="cell" className="text-right text-[#FF9500] font-bold">{r.mult}</span>
              <span role="cell" className="text-right text-black">{r.price}</span>
              <span role="cell" className={`text-right font-bold ${r.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{r.change}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
