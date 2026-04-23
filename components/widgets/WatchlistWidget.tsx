'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import WidgetHeader from '@/components/dashboard/WidgetHeader';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlistSymbols } from '@/lib/watchlist';
import { useSelectedSymbolStore, type Market } from '@/stores/selectedSymbolStore';

function inferMarket(code: string): Market {
  return /^\d{6}$/.test(code) ? 'KR' : 'US';
}

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
  change: number;
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
    if (!res.ok) throw new Error();
    const d = await res.json();
    return {
      symbol,
      name: d.name || fallbackName,
      price: d.price ?? 0,
      change: d.change ?? 0,
      changePercent: d.changePercent ?? 0,
      volume: d.volume ?? 0,
    };
  } catch {
    return { symbol, name: fallbackName, price: 0, change: 0, changePercent: 0, volume: 0 };
  }
}

export default function WatchlistWidget({ compact = false }: { compact?: boolean } = {}) {
  const { user, isLoading: authLoading } = useAuthStore();
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    let symbols: { symbol: string; name: string }[];
    if (user) {
      const syms = await getWatchlistSymbols(user.id);
      if (syms.length > 0) {
        symbols = syms.map((s) => ({ symbol: s, name: s }));
      } else {
        symbols = DEFAULT_SYMBOLS;
      }
    } else {
      symbols = DEFAULT_SYMBOLS;
    }
    const results = await Promise.all(
      symbols.map((s) => fetchPrice(s.symbol, s.name))
    );
    setRows(results);
    setLoading(false);
    setLastUpdate(new Date());
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    load();
    const timer = setInterval(load, 10_000);
    return () => clearInterval(timer);
  }, [authLoading, load]);

  const rowPy = compact ? 'py-1.5' : 'py-2.5';
  const textSz = compact ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader
        title="관심종목"
        subtitle="10초 갱신"
        href="/watchlist"
        linkLabel="관심종목 전체"
        actions={
          loading ? <span className="text-[10px] text-[#BBB]">로딩…</span>
          : lastUpdate ? <span className="text-[10px] text-[#999]">{lastUpdate.toTimeString().slice(0, 5)}</span>
          : undefined
        }
      />
      <div role="table" aria-label="관심종목 목록" className="w-full flex-1 overflow-y-auto">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-5 px-3 py-1.5 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">종목</span>
            <span role="columnheader" className="text-right">현재가</span>
            <span role="columnheader" className="text-right">전일비</span>
            <span role="columnheader" className="text-right">등락률</span>
            <span role="columnheader" className="text-right">거래량</span>
          </div>
        </div>
        <div role="rowgroup">
          {rows.map((r) => (
            <div
              key={r.symbol}
              role="row"
              className={`grid grid-cols-5 px-3 ${rowPy} ${textSz} hover:bg-[#F8F9FA] border-b border-[#F0F0F0]`}
            >
              <Link
                href={`/stocks/${r.symbol}`}
                role="cell"
                className="font-bold text-black truncate hover:text-[#0ABAB5]"
                onClick={() => setSelected({ code: r.symbol, name: r.name, market: inferMarket(r.symbol) })}
              >
                {r.name}
              </Link>
              <span role="cell" className="text-right text-black">
                {r.price > 0 ? fmtPrice(r.price) : '—'}
              </span>
              <span
                role="cell"
                className={`text-right ${r.change >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
              >
                {r.price > 0 ? `${r.change >= 0 ? '+' : ''}${fmtPrice(r.change)}` : '—'}
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
    </div>
  );
}
