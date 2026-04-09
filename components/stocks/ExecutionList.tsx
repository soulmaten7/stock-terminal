'use client';

import { useState, useEffect, useCallback } from 'react';

interface Execution {
  time: string;
  price: number;
  volume: number;
  change: number;
  changeSign: string;
}

export default function ExecutionList({ symbol }: { symbol: string }) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/kis/execution?symbol=${symbol}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.executions) setExecutions(data.executions);
    } catch {}
    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fmt = (n: number) => n.toLocaleString('ko-KR');
  const fmtTime = (t: string) => {
    if (t.length >= 6) return `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
    return t;
  };

  if (loading) {
    return (
      <div className="bg-[#0D1117] border border-[#2D3748] p-4 h-full">
        <h3 className="text-white font-bold text-sm mb-3">체결</h3>
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-5 bg-[#161B22] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1117] border border-[#2D3748] p-3 h-full overflow-y-auto">
      <h3 className="text-white font-bold text-sm mb-2">체결</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#666666] font-bold">
            <th className="text-left py-1">시간</th>
            <th className="text-right py-1">가격</th>
            <th className="text-right py-1">수량</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((e, i) => {
            const isBuy = e.changeSign === '2' || e.changeSign === '1';
            const color = isBuy ? 'text-[#FF3B30]' : 'text-[#007AFF]';
            return (
              <tr key={i} className="border-t border-[#1A1A2E]">
                <td className="text-[#999999] font-mono-price py-0.5">{fmtTime(e.time)}</td>
                <td className={`text-right font-mono-price font-bold py-0.5 ${color}`}>{fmt(e.price)}</td>
                <td className="text-right font-mono-price text-[#999999] py-0.5">{fmt(e.volume)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
