'use client';

import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

// TODO(STEP 72+): 시세·지표 데이터 페치 훅 연결
export default function SnapshotHeader() {
  const selected = useSelectedSymbolStore((s) => s.selected);

  return (
    <header className="px-4 py-3 border-b border-[#E5E7EB] shrink-0 bg-white">
      <div className="flex items-baseline justify-between mb-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-black truncate">
            {selected?.name ?? '종목을 선택하세요'}
          </div>
          <div className="text-[11px] text-[#999]">
            {selected?.code ?? '—'}
            {selected?.market && <span className="ml-1 text-[#BBB]">· {selected.market}</span>}
          </div>
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
