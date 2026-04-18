'use client';

import { Calendar } from 'lucide-react';

const DUMMY = [
  { date: '04/10 (목)', time: '21:30', name: '미국 CPI (3월)', prev: '3.2%', forecast: '3.1%', stars: 3 },
  { date: '04/11 (금)', time: '03:00', name: 'FOMC 의사록 공개', prev: '-', forecast: '-', stars: 3 },
  { date: '04/11 (금)', time: '21:30', name: '미국 PPI (3월)', prev: '0.3%', forecast: '0.2%', stars: 2 },
  { date: '04/14 (월)', time: '11:00', name: '중국 GDP (1Q)', prev: '5.2%', forecast: '5.0%', stars: 3 },
  { date: '04/15 (화)', time: '21:30', name: '미국 소매판매 (3월)', prev: '0.6%', forecast: '0.4%', stars: 2 },
];

export default function EconomicCalendar() {
  return (
    <div className="p-5 h-full">
      <h3 className="text-black font-bold text-base mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[#0ABAB5]" /> 경제지표 일정
      </h3>
      <div className="space-y-3">
        {DUMMY.map((e, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-[#F0F0F0] last:border-0">
            <div className="shrink-0 w-20">
              <p className="text-black font-bold text-xs">{e.date}</p>
              <p className="text-[#999999] text-xs font-mono-price">{e.time}</p>
            </div>
            <div className="flex-1">
              <p className="text-black font-bold text-sm">{e.name}</p>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="text-[#999999]">이전: <b className="text-black">{e.prev}</b></span>
                <span className="text-[#999999]">예상: <b className="text-[#0ABAB5]">{e.forecast}</b></span>
              </div>
            </div>
            <div className="shrink-0 text-[#C9A96E] text-xs">{'★'.repeat(e.stars)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
