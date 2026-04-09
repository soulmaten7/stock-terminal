'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface WatchItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  flash: boolean;
  error: boolean;
}

const DEFAULT_SYMBOLS = [
  { symbol: '005930', name: '삼성전자' },
  { symbol: '000660', name: 'SK하이닉스' },
  { symbol: '373220', name: 'LG에너지솔루션' },
  { symbol: '005380', name: '현대차' },
  { symbol: '035420', name: 'NAVER' },
  { symbol: '035720', name: '카카오' },
  { symbol: '207940', name: '삼성바이오' },
  { symbol: '068270', name: '셀트리온' },
  { symbol: '000270', name: '기아' },
  { symbol: '005490', name: 'POSCO홀딩스' },
];

export default function WatchlistLive() {
  const [mounted, setMounted] = useState(false);
  const [stocks, setStocks] = useState<WatchItem[]>([]);
  const prevPrices = useRef<Record<string, number>>({});

  const fetchPrices = useCallback(async () => {
    const results: WatchItem[] = [];

    for (const s of DEFAULT_SYMBOLS) {
      try {
        const res = await fetch(`/api/kis/price?symbol=${s.symbol}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const prev = prevPrices.current[s.symbol];
        const flashed = prev !== undefined && prev !== data.price;
        prevPrices.current[s.symbol] = data.price;

        results.push({
          symbol: s.symbol,
          name: data.name || s.name,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          flash: flashed,
          error: false,
        });
      } catch {
        results.push({
          symbol: s.symbol, name: s.name, price: prevPrices.current[s.symbol] || 0,
          change: 0, changePercent: 0, flash: false, error: true,
        });
      }
    }

    setStocks(results);

    setTimeout(() => {
      setStocks((prev) => prev.map((s) => ({ ...s, flash: false })));
    }, 600);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  if (!mounted) {
    return (
      <div className="bg-white border-[3px] border-[#0ABAB5]">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-base font-bold text-black">관심종목</h3>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (<div key={i} className="h-8 bg-[#F0F0F0] animate-pulse" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5]">
      <div className="px-4 py-3 border-b border-[#E5E7EB]">
        <h3 className="text-base font-bold text-black">관심종목</h3>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-[#F5F5F5]">
          <tr className="text-xs text-[#999999] font-bold">
            <th className="text-left px-4 py-2">종목명</th>
            <th className="text-right px-4 py-2">현재가</th>
            <th className="text-right px-4 py-2">등락률</th>
          </tr>
        </thead>
        <tbody>
          {stocks.length === 0 ? (
            Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-[#F0F0F0]">
                <td colSpan={3} className="px-4 py-3"><div className="h-4 bg-[#F0F0F0] animate-pulse" /></td>
              </tr>
            ))
          ) : (
            stocks.map((s) => (
              <tr key={s.symbol}
                className={`border-b border-[#F0F0F0] hover:bg-[#F5F5F5] cursor-pointer transition-all ${s.flash ? 'bg-yellow-50' : ''} ${s.error ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2">
                  <Link href={`/stocks/${s.symbol}`} className="text-black font-bold text-sm hover:text-[#0ABAB5]">{s.name}</Link>
                </td>
                <td className="px-4 py-2 text-right font-mono-price font-bold text-black text-sm">
                  {s.price > 0 ? fmt(s.price) : '-'}
                </td>
                <td className={`px-4 py-2 text-right font-mono-price font-bold text-sm ${s.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                  {s.price > 0 ? `${s.change >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%` : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
