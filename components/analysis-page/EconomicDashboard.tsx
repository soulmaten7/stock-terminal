'use client';

import { useState, useEffect } from 'react';

interface Indicator { series_id: string; label: string; unit: string; value: number | null; date: string | null; change: number | null; }

export default function EconomicDashboard() {
  const [data, setData] = useState<Indicator[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/fred?mode=summary');
        const json = await res.json();
        if (json.indicators) setData(json.indicators);
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-6">
      <h2 className="text-lg font-bold text-black mb-4">미국 경제지표 (FRED)</h2>
      {data.length === 0 ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-10 bg-[#F0F0F0] animate-pulse" />))}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {data.map((ind) => (
            <div key={ind.series_id} className="bg-[#F5F5F5] p-4">
              <p className="text-xs text-[#999999] font-bold">{ind.label}</p>
              <p className="text-xl font-mono-price font-bold text-black mt-1">
                {ind.value != null ? ind.value.toLocaleString() : '-'} <span className="text-xs text-[#999999]">{ind.unit}</span>
              </p>
              {ind.change != null && (
                <p className={`text-xs font-mono-price font-bold mt-1 ${ind.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                  {ind.change >= 0 ? '+' : ''}{ind.change.toFixed(2)}
                </p>
              )}
              {ind.date && <p className="text-[10px] text-[#999999] mt-1">{ind.date}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
