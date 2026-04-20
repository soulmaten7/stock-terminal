'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface FlowRow {
  label: string;
  kospi: string;
  kosdaq: string;
}

function colorClass(val: string) {
  return val.startsWith('+') ? 'text-[#FF3B30]' : val.startsWith('-') ? 'text-[#0051CC]' : 'text-[#999]';
}

export default function InvestorFlowWidget() {
  const [rows, setRows] = useState<FlowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/home/investor-flow')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setRows(d.rows ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="투자자별 매매동향" subtitle="KIS API · 당일" href="/investor-flow">
      {loading && (
        <div className="flex items-center justify-center h-16 text-xs text-[#999]">로딩 중…</div>
      )}
      {!loading && (
        <div role="table" aria-label="투자자별 매매동향">
          <div role="rowgroup">
            <div role="row" className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
              <span>투자자</span>
              <span className="text-right">코스피</span>
              <span className="text-right">코스닥</span>
            </div>
          </div>
          <div role="rowgroup">
            {rows.map((d) => (
              <div key={d.label} role="row" className="grid grid-cols-3 px-3 py-2 text-xs border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                <span className="font-bold text-black">{d.label}</span>
                <span className={`text-right font-bold ${colorClass(d.kospi)}`}>{d.kospi}</span>
                <span className={`text-right font-bold ${colorClass(d.kosdaq)}`}>{d.kosdaq}</span>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="px-3 py-3 text-xs text-[#999] text-center">데이터 없음</div>
            )}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
