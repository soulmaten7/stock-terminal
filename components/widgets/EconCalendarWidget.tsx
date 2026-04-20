'use client';

import WidgetCard from '@/components/home/WidgetCard';

const DUMMY = [
  { time: '21:30', country: '🇺🇸', event: 'CPI (월간)', prev: '0.3%', forecast: '0.2%', impact: 'high' },
  { time: '23:00', country: '🇺🇸', event: '소매판매 (월간)', prev: '0.6%', forecast: '0.4%', impact: 'medium' },
  { time: '04/23 03:00', country: '🇺🇸', event: 'FOMC 회의록', prev: '-', forecast: '-', impact: 'high' },
  { time: '04/23 21:30', country: '🇺🇸', event: '신규 실업수당 청구', prev: '215K', forecast: '218K', impact: 'medium' },
];

const IMPACT: Record<string, string> = {
  high: 'bg-[#FF3B30]',
  medium: 'bg-[#FF9500]',
  low: 'bg-[#E5E7EB]',
};

export default function EconCalendarWidget() {
  return (
    <WidgetCard
      title="경제캘린더"
      subtitle="Phase B · Investing.com"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <ul aria-label="경제 캘린더" className="divide-y divide-[#F0F0F0]">
        {DUMMY.map((e, i) => (
          <li key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-[#F8F9FA]">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${IMPACT[e.impact]}`} />
            <span className="text-[10px] text-[#999] shrink-0 w-16">{e.time}</span>
            <span className="text-[10px] shrink-0">{e.country}</span>
            <span className="text-xs text-black flex-1 truncate">{e.event}</span>
            <span className="text-[10px] text-[#555] shrink-0">예: {e.forecast}</span>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
