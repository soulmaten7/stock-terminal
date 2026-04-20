'use client';

import WidgetCard from '@/components/home/WidgetCard';

const ASKS = [
  { price: '78,700', qty: 12341, bar: 62 },
  { price: '78,600', qty: 8920, bar: 45 },
  { price: '78,500', qty: 15670, bar: 79 },
  { price: '78,450', qty: 5430, bar: 27 },
  { price: '78,400', qty: 19800, bar: 100 },
];
const BIDS = [
  { price: '78,350', qty: 18200, bar: 92 },
  { price: '78,300', qty: 11050, bar: 56 },
  { price: '78,200', qty: 7640, bar: 39 },
  { price: '78,100', qty: 4210, bar: 21 },
  { price: '78,000', qty: 9870, bar: 50 },
];

export default function OrderBookWidget() {
  return (
    <WidgetCard
      title="호가창"
      subtitle="10단 · Phase B · KIS WebSocket"
      href="/orderbook"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <div aria-label="호가창" className="px-2 py-1 text-xs">
        {/* 매도 호가 */}
        <div className="mb-0.5">
          {ASKS.map((a) => (
            <div key={a.price} className="relative flex items-center justify-between py-0.5 px-1">
              <div
                className="absolute right-0 top-0 bottom-0 bg-[#0051CC]/10"
                style={{ width: `${a.bar}%` }}
              />
              <span className="relative text-[#0051CC] font-bold">{a.price}</span>
              <span className="relative text-[#555]">{a.qty.toLocaleString()}</span>
            </div>
          ))}
        </div>
        {/* 현재가 */}
        <div className="bg-[#0ABAB5]/10 text-center py-1 font-bold text-[#0ABAB5] text-sm border-y border-[#0ABAB5]/20 mb-0.5">
          78,400 <span className="text-xs text-[#FF3B30]">+1.29%</span>
        </div>
        {/* 매수 호가 */}
        <div>
          {BIDS.map((b) => (
            <div key={b.price} className="relative flex items-center justify-between py-0.5 px-1">
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#FF3B30]/10"
                style={{ width: `${b.bar}%` }}
              />
              <span className="relative text-[#FF3B30] font-bold">{b.price}</span>
              <span className="relative text-[#555]">{b.qty.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
