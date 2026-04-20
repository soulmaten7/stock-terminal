'use client';

import WidgetCard from '@/components/home/WidgetCard';

const DATA = [
  { label: '외국인', kospi: '+4,231억', kosdaq: '+1,203억', up: true },
  { label: '기관', kospi: '+2,104억', kosdaq: '-342억', up: true },
  { label: '개인', kospi: '-6,335억', kosdaq: '-861억', up: false },
  { label: '기타법인', kospi: '-234억', kosdaq: '+112억', up: false },
];

export default function InvestorFlowWidget() {
  return (
    <WidgetCard
      title="투자자별 매매동향"
      subtitle="Phase B · pykrx · 10분 지연"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <div role="table" aria-label="투자자별 매매동향">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span>투자자</span><span className="text-right">코스피</span><span className="text-right">코스닥</span>
          </div>
        </div>
        <div role="rowgroup">
          {DATA.map((d) => (
            <div key={d.label} role="row" className="grid grid-cols-3 px-3 py-2 text-xs border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
              <span className="font-bold text-black">{d.label}</span>
              <span className={`text-right font-bold ${d.kospi.startsWith('+') ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{d.kospi}</span>
              <span className={`text-right font-bold ${d.kosdaq.startsWith('+') ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{d.kosdaq}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
