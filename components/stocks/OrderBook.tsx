'use client';

import { useState, useEffect, useCallback } from 'react';

interface OrderLevel { price: number; volume: number; }

export default function OrderBook({ symbol }: { symbol: string }) {
  const [asks, setAsks] = useState<OrderLevel[]>([]);
  const [bids, setBids] = useState<OrderLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/kis/orderbook?symbol=${symbol}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.asks) setAsks(data.asks);
      if (data.bids) setBids(data.bids);
    } catch {}
    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const maxVol = Math.max(...asks.map((a) => a.volume), ...bids.map((b) => b.volume), 1);
  const fmt = (n: number) => n.toLocaleString('ko-KR');

  if (loading) {
    return (
      <div className="bg-[#0D1117] border border-[#2D3748] p-4 h-full">
        <h3 className="text-white font-bold text-sm mb-3">호가</h3>
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
      <h3 className="text-white font-bold text-sm mb-2">호가</h3>
      <div className="space-y-px">
        {/* Asks (매도) — 위에서 아래로 */}
        {asks.map((a, i) => (
          <div key={`a-${i}`} className="flex items-center h-6 relative">
            <div className="absolute inset-0 bg-[#007AFF]/10" style={{ width: `${(a.volume / maxVol) * 100}%` }} />
            <span className="relative z-10 flex-1 text-right text-xs font-mono-price text-[#999999] pr-2">{a.volume > 0 ? fmt(a.volume) : ''}</span>
            <span className="relative z-10 w-20 text-right text-xs font-mono-price text-[#007AFF] font-bold pr-1">{a.price > 0 ? fmt(a.price) : ''}</span>
            <span className="w-20" />
          </div>
        ))}

        {/* Bids (매수) — 위에서 아래로 */}
        {bids.map((b, i) => (
          <div key={`b-${i}`} className="flex items-center h-6 relative">
            <span className="w-20" />
            <span className="relative z-10 w-20 text-left text-xs font-mono-price text-[#FF3B30] font-bold pl-1">{b.price > 0 ? fmt(b.price) : ''}</span>
            <div className="absolute right-0 top-0 bottom-0 bg-[#FF3B30]/10" style={{ width: `${(b.volume / maxVol) * 100}%` }} />
            <span className="relative z-10 flex-1 text-left text-xs font-mono-price text-[#999999] pl-2">{b.volume > 0 ? fmt(b.volume) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
