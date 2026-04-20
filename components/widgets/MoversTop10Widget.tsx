'use client';

import { useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

const GAINERS = [
  { rank: 1, name: 'HLB', change: '+29.9%', price: '54,700' },
  { rank: 2, name: '에코프로비엠', change: '+8.4%', price: '124,500' },
  { rank: 3, name: '엔켐', change: '+7.1%', price: '38,450' },
  { rank: 4, name: '씨에스윈드', change: '+6.8%', price: '52,200' },
  { rank: 5, name: '한화오션', change: '+5.5%', price: '34,900' },
];

const LOSERS = [
  { rank: 1, name: '카카오게임즈', change: '-12.4%', price: '18,200' },
  { rank: 2, name: 'CJ CGV', change: '-9.1%', price: '4,180' },
  { rank: 3, name: '두산퓨얼셀', change: '-7.8%', price: '11,350' },
  { rank: 4, name: '한미반도체', change: '-6.2%', price: '88,400' },
  { rank: 5, name: '리노공업', change: '-4.9%', price: '158,000' },
];

export default function MoversTop10Widget() {
  const [tab, setTab] = useState<'up' | 'down'>('up');
  const data = tab === 'up' ? GAINERS : LOSERS;

  return (
    <WidgetCard
      title="상승/하락 TOP 10"
      subtitle="Phase B · KIS API"
      action={
        <div className="flex gap-1">
          <button
            onClick={() => setTab('up')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${tab === 'up' ? 'bg-[#FF3B30] text-white' : 'text-[#999] hover:text-black'}`}
          >
            상승
          </button>
          <button
            onClick={() => setTab('down')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${tab === 'down' ? 'bg-[#0051CC] text-white' : 'text-[#999] hover:text-black'}`}
          >
            하락
          </button>
        </div>
      }
    >
      <div role="table" aria-label="상승하락 종목 목록">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">#  종목</span>
            <span role="columnheader" className="text-right">등락률</span>
            <span role="columnheader" className="text-right">현재가</span>
          </div>
        </div>
        <div role="rowgroup">
          {data.map((r) => (
            <div key={r.rank} role="row" className="grid grid-cols-3 px-3 py-1.5 text-xs hover:bg-[#F8F9FA] border-b border-[#F0F0F0]">
              <span role="cell" className="font-bold text-black"><span className="text-[#999] mr-1">{r.rank}</span>{r.name}</span>
              <span role="cell" className={`text-right font-bold ${tab === 'up' ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{r.change}</span>
              <span role="cell" className="text-right text-black">{r.price}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
