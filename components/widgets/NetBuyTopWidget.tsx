'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface NetItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
}

function fmtBn(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toLocaleString('ko-KR')}억`;
}

export default function NetBuyTopWidget() {
  const [tab, setTab] = useState<'foreign' | 'inst'>('foreign');
  const [data, setData] = useState<{ foreignTop: NetItem[]; institutionTop: NetItem[] }>({
    foreignTop: [],
    institutionTop: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kis/investor-rank')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData({ foreignTop: d.foreignTop ?? [], institutionTop: d.institutionTop ?? [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = tab === 'foreign' ? data.foreignTop : data.institutionTop;
  const netKey = tab === 'foreign' ? 'foreignBuy' : 'institutionBuy';

  return (
    <WidgetCard
      title="실시간 수급 TOP"
      subtitle="KIS API"
      action={
        <div className="flex gap-1">
          <button
            onClick={() => setTab('foreign')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${tab === 'foreign' ? 'bg-[#0ABAB5] text-white' : 'text-[#999]'}`}
          >
            외국인
          </button>
          <button
            onClick={() => setTab('inst')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${tab === 'inst' ? 'bg-[#0ABAB5] text-white' : 'text-[#999]'}`}
          >
            기관
          </button>
        </div>
      }
    >
      {loading && (
        <div className="flex items-center justify-center h-20 text-xs text-[#999]">로딩 중…</div>
      )}
      {!loading && (
        <div role="table" aria-label="수급 TOP 목록">
          <div role="rowgroup">
            <div role="row" className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
              <span>종목</span>
              <span className="text-right">순매수</span>
              <span className="text-right">등락</span>
            </div>
          </div>
          <div role="rowgroup">
            {items.map((r) => (
              <div key={r.symbol} role="row" className="grid grid-cols-3 px-3 py-1.5 text-xs border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                <span className="font-bold text-black truncate">{r.name}</span>
                <span className={`text-right font-bold ${r[netKey] >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF3B30]'}`}>
                  {fmtBn(r[netKey])}
                </span>
                <span className={`text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                  {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
            {items.length === 0 && (
              <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
            )}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
