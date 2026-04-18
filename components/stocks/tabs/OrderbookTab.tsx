'use client';

import OrderBook from '@/components/stocks/OrderBook';
import ExecutionList from '@/components/stocks/ExecutionList';

export default function OrderbookTab({ symbol, country }: { symbol: string; country: string }) {
  if (country !== 'KR') {
    return (
      <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
        미국 주식은 호가 데이터를 제공하지 않습니다. 차트 탭을 이용해주세요.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-[#E5E7EB] rounded h-[520px] overflow-hidden">
        <OrderBook symbol={symbol} />
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded h-[520px] overflow-hidden">
        <ExecutionList symbol={symbol} />
      </div>
    </div>
  );
}
