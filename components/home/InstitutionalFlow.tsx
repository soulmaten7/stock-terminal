'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FlowItem {
  symbol: string;
  name: string;
  foreignBuy: number; // 억원
  institutionBuy: number; // 억원
}

function FlowTable({
  title,
  data,
  field,
}: {
  title: string;
  data: FlowItem[];
  field: 'foreignBuy' | 'institutionBuy';
}) {
  const fmt = (n: number) => (n >= 0 ? '+' : '') + n.toLocaleString('ko-KR') + '억';

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-bold text-black mb-2 px-1">{title}</h4>
      <div className="space-y-0.5">
        {data.slice(0, 10).map((item, idx) => {
          const val = item[field];
          return (
            <Link
              key={item.symbol}
              href={`/stocks/${item.symbol}`}
              className="flex items-center justify-between py-1.5 px-2 hover:bg-[#F5F5F5]"
            >
              <div className="flex items-center gap-2">
                <span className="text-[#0ABAB5] font-bold text-xs w-5">{idx + 1}</span>
                <span className="text-black font-bold text-sm truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {val >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-[#FF3B30]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#007AFF]" />
                )}
                <span
                  className={`font-mono-price font-bold text-sm ${
                    val >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'
                  }`}
                >
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
  const [foreignTop, setForeignTop] = useState<FlowItem[]>([]);
  const [institutionTop, setInstitutionTop] = useState<FlowItem[]>([]);

  useEffect(() => {
    setMounted(true);

    const fetchData = async () => {
      try {
        // 한 번의 호출로 TOP10 두 개 리스트 동시에 받음
        const res = await fetch('/api/kis/investor-rank');
        if (!res.ok) return;
        const data = await res.json();
        if (data.foreignTop) setForeignTop(data.foreignTop);
        if (data.institutionTop) setInstitutionTop(data.institutionTop);
      } catch {
        // 에러 무시 (이전 데이터 유지)
      }
    };

    // 첫 호출은 WatchlistLive 사이클과 겹치지 않도록 5초 후
    const startTimer = setTimeout(fetchData, 5000);
    // 이후 60초마다 갱신
    const interval = setInterval(fetchData, 60000);
    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="bg-white border-[3px] border-[#0ABAB5] h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <h3 className="text-base font-bold text-black">실시간 수급</h3>
          <span className="text-xs text-[#999999] font-bold">전체 보기 →</span>
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = foreignTop.length > 0 || institutionTop.length > 0;

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
        <h3 className="text-base font-bold text-black">실시간 수급 (TOP 10)</h3>
        <Link
          href="/analysis"
          className="text-xs text-[#999999] hover:text-[#0ABAB5] font-bold"
        >
          전체 보기 →
        </Link>
      </div>
      <div className="flex gap-4 p-4">
        {!hasData ? (
          <div className="flex-1 space-y-2 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <FlowTable title="외국인 순매수 TOP 10" data={foreignTop} field="foreignBuy" />
            <div className="w-px bg-[#E5E7EB] shrink-0" />
            <FlowTable
              title="기관 순매수 TOP 10"
              data={institutionTop}
              field="institutionBuy"
            />
          </>
        )}
      </div>
    </div>
  );
}
