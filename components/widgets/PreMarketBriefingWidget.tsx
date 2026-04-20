'use client';

import WidgetCard from '@/components/home/WidgetCard';

const OVERNIGHT = [
  { name: 'S&P 500', val: '5,308.13', change: '-0.34%', up: false },
  { name: 'NASDAQ', val: '18,399.47', change: '-0.52%', up: false },
  { name: 'DOW', val: '39,142.23', change: '-0.22%', up: false },
];

const EVENTS = [
  '08:00 — 한국 수출입 지표 발표',
  '10:30 — 삼성전자 1분기 실적 발표',
  '21:30 — 미국 CPI (예상 0.2%)',
];

export default function PreMarketBriefingWidget() {
  return (
    <WidgetCard
      title="장전 브리핑"
      subtitle="Phase B · Yahoo + DART"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <div className="px-3 py-2">
        <p className="text-[10px] font-bold text-[#999] mb-1.5 uppercase tracking-wider">간밤 미증시</p>
        <div className="space-y-1 mb-3">
          {OVERNIGHT.map((o) => (
            <div key={o.name} className="flex items-center justify-between text-xs">
              <span className="text-[#555]">{o.name}</span>
              <div className="flex gap-2">
                <span className="font-bold text-black">{o.val}</span>
                <span className={`font-bold ${o.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{o.change}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold text-[#999] mb-1.5 uppercase tracking-wider">오늘 주요 일정</p>
        <ul className="space-y-1">
          {EVENTS.map((e, i) => (
            <li key={i} className="text-xs text-[#333] flex items-start gap-1.5">
              <span className="text-[#0ABAB5] mt-0.5">•</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </div>
    </WidgetCard>
  );
}
