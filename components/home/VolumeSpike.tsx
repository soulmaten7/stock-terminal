'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SpikeItem {
  symbol: string; name: string; price: number; changePercent: number; volume: number; spike: number;
}

const DUMMY: SpikeItem[] = [
  { symbol: '247540', name: '에코프로비엠', price: 112500, changePercent: 8.2, volume: 12340000, spike: 5.2 },
  { symbol: '028300', name: 'HLB', price: 58200, changePercent: 6.1, volume: 8920000, spike: 4.1 },
  { symbol: '196170', name: '알테오젠', price: 245000, changePercent: -3.4, volume: 5670000, spike: 3.8 },
  { symbol: '086520', name: '에코프로', price: 78900, changePercent: 4.5, volume: 4560000, spike: 3.2 },
  { symbol: '058470', name: '리노공업', price: 198000, changePercent: 2.1, volume: 2340000, spike: 2.8 },
];

export default function VolumeSpike() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<SpikeItem[]>([]);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const res = await fetch('/api/kis/volume-rank');
        if (!res.ok) return;
        const json = await res.json();
        if (json.stocks && json.stocks.length > 0) {
          const filtered = json.stocks.filter((s: SpikeItem) => s.spike >= 2).slice(0, 5);
          setData(filtered.length > 0 ? filtered : DUMMY);
        } else {
          setData(DUMMY);
        }
      } catch {
        setData(DUMMY);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-[#0D1117] p-4 border border-[#2D3748] h-full">
        <h3 className="text-white font-bold text-sm mb-3">거래량 급등</h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#161B22] animate-pulse" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D1117] p-4 border border-[#2D3748] h-full">
      <h3 className="text-white font-bold text-sm mb-3">거래량 급등</h3>
      <div className="space-y-2">
        {data.map((s) => (
          <Link key={s.symbol} href={`/stocks/${s.symbol}`}
            className="flex items-center justify-between py-1.5 hover:bg-[#161B22] px-2 -mx-2">
            <div>
              <span className="text-white font-bold text-sm">{s.name}</span>
              <span className={`ml-2 font-mono-price text-xs font-bold ${s.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(1)}%
              </span>
            </div>
            <span className="text-[#FF9500] font-mono-price font-bold text-sm">x{s.spike}</span>
          </Link>
        ))}
        {data.length === 0 && <p className="text-[#999999] text-xs">데이터 없음</p>}
      </div>
    </div>
  );
}
