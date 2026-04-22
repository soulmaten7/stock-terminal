'use client';

import { useState, useEffect } from 'react';

interface FlowRow { label: string; value: number; color: string; }

export default function MarketFlow() {
  const [flow, setFlow] = useState<FlowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/kis/investor-rank?market=all');
        const json = await res.json();
        if (json.totals) {
          const { foreignBuyTotal, institutionBuyTotal, individualBuyApprox } = json.totals;
          setFlow([
            { label: '외국인',     value: foreignBuyTotal,     color: '#FF3B30' },
            { label: '기관',       value: institutionBuyTotal, color: '#007AFF' },
            { label: '개인(추정)', value: individualBuyApprox, color: '#999999' },
          ]);
        }
      } catch {}
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const maxAbs = flow.length > 0 ? Math.max(...flow.map((f) => Math.abs(f.value ?? 0))) : 1;

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-bold text-black">상위 종목 순매수 집계</h2>
        <span className="text-[10px] text-[#999]">KIS · 외국인·기관 매매 상위 30종목 합산 (억원)</span>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-[#F0F0F0] animate-pulse" />
          ))}
        </div>
      ) : flow.length === 0 ? (
        <p className="text-sm text-[#999] text-center py-8">데이터를 불러올 수 없습니다</p>
      ) : (
        <div className="space-y-3">
          {flow.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-sm font-bold text-black w-28 shrink-0">{f.label}</span>
              <div className="flex-1 h-6 bg-[#F5F5F5] relative">
                <div className="absolute top-0 h-full" style={{
                  width: `${(Math.abs(f.value ?? 0) / maxAbs) * 100}%`,
                  backgroundColor: f.color,
                  left: (f.value ?? 0) >= 0 ? '50%' : undefined,
                  right: (f.value ?? 0) < 0 ? '50%' : undefined,
                }} />
              </div>
              <span className={`text-sm font-mono-price font-bold w-20 text-right ${(f.value ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                {(f.value ?? 0) >= 0 ? '+' : ''}{(f.value ?? 0).toLocaleString()}억
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
