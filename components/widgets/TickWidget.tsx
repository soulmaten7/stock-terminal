'use client';

import WidgetCard from '@/components/home/WidgetCard';

const DUMMY = [
  { time: '15:29:58', price: '78,400', qty: 823, side: 'buy' },
  { time: '15:29:55', price: '78,350', qty: 1204, side: 'sell' },
  { time: '15:29:52', price: '78,400', qty: 542, side: 'buy' },
  { time: '15:29:49', price: '78,400', qty: 2100, side: 'buy' },
  { time: '15:29:46', price: '78,300', qty: 731, side: 'sell' },
];

export default function TickWidget() {
  const strength = 64.2;

  return (
    <WidgetCard
      title="체결창"
      subtitle="체결강도 · Phase B"
      href="/ticks"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      {/* 체결강도 바 */}
      <div className="px-3 py-2 border-b border-[#F0F0F0]">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[#999]">체결강도</span>
          <span className="font-bold text-[#FF3B30]">{strength}%</span>
        </div>
        <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF3B30] rounded-full"
            style={{ width: `${Math.min(strength, 100)}%` }}
          />
        </div>
      </div>
      {/* 체결 로그 */}
      <div role="table" aria-label="체결 내역">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-3 px-3 py-1 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">시각</span>
            <span role="columnheader" className="text-right">체결가</span>
            <span role="columnheader" className="text-right">체결량</span>
          </div>
        </div>
        <div role="rowgroup">
          {DUMMY.map((t, i) => (
            <div key={i} role="row" className="grid grid-cols-3 px-3 py-1 text-xs border-b border-[#F0F0F0]">
              <span role="cell" className="text-[#999]">{t.time}</span>
              <span role="cell" className={`text-right font-bold ${t.side === 'buy' ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{t.price}</span>
              <span role="cell" className="text-right text-[#555]">{t.qty.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
