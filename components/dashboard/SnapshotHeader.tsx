'use client';

// TODO(STEP 71+): 선택된 종목 Zustand 스토어 연결, 실제 데이터 바인딩
export default function SnapshotHeader() {
  return (
    <header className="px-4 py-3 border-b border-[#E5E7EB] shrink-0 bg-white">
      <div className="flex items-baseline justify-between mb-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-black truncate">종목명</div>
          <div className="text-[11px] text-[#999]">000000</div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <div className="text-lg font-bold text-black">--</div>
          <div className="text-[11px] text-[#999]">--%</div>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px] text-[#666]">
        <div><dt className="inline text-[#999]">시 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">고 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">저 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">거래량 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">시총 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">PER </dt><dd className="inline">--</dd></div>
      </dl>
    </header>
  );
}
