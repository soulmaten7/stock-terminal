'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FlowItem { name: string; symbol: string; foreignBuy: number; institutionBuy: number; }

const WATCH_SYMBOLS = [
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

const DUMMY_ITEMS: FlowItem[] = WATCH_SYMBOLS.map((s) => ({
  ...s, foreignBuy: Math.round((Math.random() - 0.4) * 1000), institutionBuy: Math.round((Math.random() - 0.4) * 800),
}));

function FlowTable({ title, data, field }: { title: string; data: FlowItem[]; field: 'foreignBuy' | 'institutionBuy' }) {
  const sorted = [...data].sort((a, b) => b[field] - a[field]);
  const fmt = (n: number) => (n >= 0 ? '+' : '') + n.toLocaleString('ko-KR') + '억';

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-bold text-black mb-2 px-1">{title}</h4>
      <div className="space-y-0.5">
        {sorted.slice(0, 10).map((item, idx) => {
          const val = item[field];
          return (
            <Link key={item.symbol} href={`/stocks/${item.symbol}`}
              className="flex items-center justify-between py-1.5 px-2 hover:bg-[#F5F5F5]">
              <div className="flex items-center gap-2">
                <span className="text-[#0ABAB5] font-bold text-xs w-5">{idx + 1}</span>
                <span className="text-black font-bold text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {val >= 0 ? <TrendingUp className="w-3 h-3 text-[#FF3B30]" /> : <TrendingDown className="w-3 h-3 text-[#007AFF]" />}
                <span className={`font-mono-price font-bold text-sm ${val >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                  {fmt(val)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function InstitutionalFlow() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<FlowItem[]>([]);
  const dataRef = useRef<FlowItem[]>([]);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      const results: FlowItem[] = [];
      for (const s of WATCH_SYMBOLS) {
        try {
          const res = await fetch(`/api/kis/investor?symbol=${s.symbol}`);
          if (!res.ok) throw new Error('fail');
          const json = await res.json();
          if (json.investors && json.investors.length > 0) {
            const latest = json.investors[0];
            results.push({ symbol: s.symbol, name: s.name, foreignBuy: Math.round(latest.foreignAmount / 100000000), institutionBuy: Math.round(latest.institutionAmount / 100000000) });
          } else { throw new Error('no data'); }
        } catch {
          const existing = dataRef.current.find((x) => x.symbol === s.symbol);
          results.push(existing || { ...s, foreignBuy: 0, institutionBuy: 0 });
        }
      }
      if (results.length > 0) { setData(results); dataRef.current = results; }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-white border-[3px] border-[#0ABAB5] h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-base font-bold text-black">실시간 수급</h3>
          <span className="text-xs text-[#999999] font-bold">전체 보기 →</span>
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
        <h3 className="text-base font-bold text-black">실시간 수급</h3>
        <Link href="/analysis" className="text-xs text-[#999999] hover:text-[#0ABAB5] font-bold">전체 보기 →</Link>
      </div>
      <div className="flex gap-4 p-4">
        {data.length === 0 ? (
          <div className="flex-1 space-y-2 py-4">
            {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />))}
          </div>
        ) : (
          <>
            <FlowTable title="외국인 순매수 TOP 10" data={data} field="foreignBuy" />
            <div className="w-px bg-[#E5E7EB] shrink-0" />
            <FlowTable title="기관 순매수 TOP 10" data={data} field="institutionBuy" />
          </>
        )}
      </div>
    </div>
  );
}
