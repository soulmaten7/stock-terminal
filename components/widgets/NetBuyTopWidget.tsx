'use client';

import { useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

const FOREIGN = [
  { name: 'SK하이닉스', net: '+2,841억', change: '+2.84%', up: true },
  { name: '삼성전자', net: '+1,203억', change: '+1.29%', up: true },
  { name: 'LG전자', net: '+834억', change: '+0.98%', up: true },
  { name: 'POSCO홀딩스', net: '+612억', change: '+1.43%', up: true },
  { name: 'KB금융', net: '+441억', change: '+0.77%', up: true },
];

const INST = [
  { name: '삼성바이오로직스', net: '+1,920억', change: '+3.12%', up: true },
  { name: '현대차', net: '+1,104억', change: '+1.55%', up: true },
  { name: '기아', net: '+782억', change: '+2.01%', up: true },
  { name: 'LG에너지솔루션', net: '+543억', change: '+0.32%', up: true },
  { name: '셀트리온', net: '+321억', change: '+3.08%', up: true },
];

export default function NetBuyTopWidget() {
  const [tab, setTab] = useState<'foreign' | 'inst'>('foreign');
  const data = tab === 'foreign' ? FOREIGN : INST;

  return (
    <WidgetCard
      title="실시간 수급 TOP"
      subtitle="Phase B · pykrx"
      action={
        <div className="flex gap-1">
          <button onClick={() => setTab('foreign')} className={`text-[10px] font-bold px-2 py-0.5 rounded ${tab === 'foreign' ? 'bg-[#0ABAB5] text-white' : 'text-[#999]'}`}>외국인</button>
          <button onClick={() => setTab('inst')} className={`text-[10px] font-bold px-2 py-0.5 rounded ${tab === 'inst' ? 'bg-[#0ABAB5] text-white' : 'text-[#999]'}`}>기관</button>
        </div>
      }
    >
      <div role="table" aria-label="수급 TOP 목록">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span>종목</span><span className="text-right">순매수</span><span className="text-right">등락</span>
          </div>
        </div>
        <div role="rowgroup">
          {data.map((r) => (
            <div key={r.name} role="row" className="grid grid-cols-3 px-3 py-1.5 text-xs border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
              <span className="font-bold text-black truncate">{r.name}</span>
              <span className="text-right text-[#0ABAB5] font-bold">{r.net}</span>
              <span className={`text-right font-bold ${r.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{r.change}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
