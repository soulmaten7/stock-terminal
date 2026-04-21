'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

// 기본 관심종목 — 추후 로그인 사용자별로 교체 가능
const DEFAULT_SYMBOLS = [
  { symbol: '005930', name: '삼성전자' },
  { symbol: '000660', name: 'SK하이닉스' },
  { symbol: '035420', name: 'NAVER' },
  { symbol: '373220', name: 'LG에너지솔루션' },
  { symbol: '035720', name: '카카오' },
];

interface Row {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
}

function fmtPrice(n: number): string {
  return n.toLocaleString('ko-KR');
}

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('ko-KR');
}

async function fetchPrice(symbol: string, fallbackName: string): Promise<Row> {
  try {
    const res = await fetch(`/api/kis/price?symbol=${symbol}`);
    if (!res.ok) throw new Error('fetch failed');
    const d = await res.json();
    return {
      symbol,
      name: d.name || fallbackName,
      price: d.price ?? 0,
      changePercent: d.changePercent ?? 0,
      volume: d.volume ?? 0,
    };
  } catch {
    return { symbol, name: fallbackName, price: 0, changePercent: 0, volume: 0 };
  }
}

export default function WatchlistWidget() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const results = await Promise.all(
        DEFAULT_SYMBOLS.map((s) => fetchPrice(s.symbol, s.name))
      );
      if (cancelled) return;
      setRows(results);
      setLoading(false);
      setLastUpdate(new Date());
    };

    load();
    const timer = setInterval(load, 10_000); // 10초마다 갱신

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <WidgetCard
      title="관심종목"
      subtitle="KIS API · 10초 갱신"
      className="h-full"
      href="/watchlist"
      action={
        loading ? (
          <span className="text-[10px] text-[#BBB]">로딩 중…</span>
        ) : lastUpdate ? (
          <span className="text-[10px] text-[#999]">
            {lastUpdate.toTimeString().slice(0, 5)}
          </span>
        ) : undefined
      }
    >
      <div role="table" aria-label="관심종목 목록" className="w-full">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-4 px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">종목</span>
            <span role="columnheader" className="text-right">현재가</span>
            <span role="columnheader" className="text-right">등락률</span>
            <span role="columnheader" className="text-right">거래량</span>
          </div>
        </div>
        <div role="rowgroup">
          {rows.map((r) => (
            <div
              key={r.symbol}
              role="row"
              className="grid grid-cols-4 px-3 py-2.5 text-sm hover:bg-[#F8F9FA] border-b border-[#F0F0F0]"
            >
              <span role="cell" className="font-bold text-black truncate">{r.name}</span>
              <span role="cell" className="text-right text-black">
                {r.price > 0 ? fmtPrice(r.price) : '—'}
              </span>
              <span
                role="cell"
                className={`text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
              >
                {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
              </span>
              <span role="cell" className="text-right text-[#666]">
                {r.volume > 0 ? fmtVol(r.volume) : '—'}
              </span>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
