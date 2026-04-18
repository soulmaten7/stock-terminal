'use client';

export default function EarningsTab({ stockId, symbol }: { stockId: number; symbol: string }) {
  return (
    <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
      <p className="font-bold text-black mb-2">실적 탭</p>
      <p className="text-xs">
        분기별 매출/영업이익/순이익 히스토리 + 어닝 서프라이즈/미스 (W2.3 에서 구현 예정).
      </p>
      <p className="text-[10px] mt-3">stockId: {stockId} / symbol: {symbol}</p>
    </div>
  );
}
