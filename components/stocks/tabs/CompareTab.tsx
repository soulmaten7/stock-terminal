'use client';

import type { Stock } from '@/types/stock';

export default function CompareTab({ stock }: { stock: Stock }) {
  return (
    <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
      <p className="font-bold text-black mb-2">종목 비교</p>
      <p className="text-xs">
        {stock.symbol} 와 같은 섹터 Top 5 종목과 KPI 비교 (W2.3 에서 구현 예정).
      </p>
      <p className="text-[10px] mt-3">현재 섹터: {stock.sector ?? '—'}</p>
    </div>
  );
}
