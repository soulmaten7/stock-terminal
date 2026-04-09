'use client';

import { BarChart3 } from 'lucide-react';

const DUMMY = [
  { name: '삼성전자', symbol: '005930', date: '04/10', consensus: '영업이익 6.5조' },
  { name: 'LG에너지솔루션', symbol: '373220', date: '04/11', consensus: '영업이익 3,200억' },
  { name: 'SK하이닉스', symbol: '000660', date: '04/14', consensus: '영업이익 5.8조' },
  { name: 'NAVER', symbol: '035420', date: '04/14', consensus: '영업이익 4,100억' },
  { name: '현대차', symbol: '005380', date: '04/15', consensus: '영업이익 3.2조' },
];

export default function EarningsCalendar() {
  return (
    <div className="bg-white p-5 border-[3px] border-[#0ABAB5] h-full">
      <h3 className="text-black font-bold text-base mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[#0ABAB5]" /> 실적 발표 예정
      </h3>
      <div className="space-y-3">
        {DUMMY.map((e) => (
          <div key={e.symbol} className="flex items-center justify-between py-2 border-b border-[#F0F0F0] last:border-0">
            <div>
              <p className="text-black font-bold text-sm">{e.name}</p>
              <p className="text-[#999999] text-xs font-mono-price">{e.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-black font-bold text-xs">{e.date}</p>
              <p className="text-[#0ABAB5] text-xs font-bold">{e.consensus}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
