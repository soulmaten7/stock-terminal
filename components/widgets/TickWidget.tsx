'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface Execution {
  time: string;
  price: number;
  change: number;
  changeSign: string;
  volume: number;
}

interface ApiResponse {
  symbol: string;
  executions: Execution[];
}

const DEFAULT_SYMBOL = '005930';

function fmtPrice(n: number): string {
  return n.toLocaleString('ko-KR');
}

function fmtTime(t: string): string {
  if (!t || t.length < 6) return t || '—';
  return `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
}

function calcStrength(executions: Execution[]): number {
  if (executions.length === 0) return 0;
  const recent = executions.slice(0, 10);
  const upVol = recent
    .filter((e) => e.changeSign === '1' || e.changeSign === '2')
    .reduce((s, e) => s + e.volume, 0);
  const totalVol = recent.reduce((s, e) => s + e.volume, 0);
  if (totalVol === 0) return 50;
  return Math.round((upVol / totalVol) * 100);
}

export default function TickWidget() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/kis/execution?symbol=${symbol}`);
        if (!res.ok) return;
        const data: ApiResponse = await res.json();
        if (cancelled) return;
        setExecutions(data.executions || []);
      } catch {
        // noop
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    load();
    const timer = setInterval(load, 5_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [symbol]);

  const handleSymbolChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSymbolInput(v);
    if (v.length === 6) setSymbol(v);
  };

  const strength = calcStrength(executions);
  const strengthUp = strength >= 50;

  return (
    <WidgetCard
      title="체결창"
      subtitle={`${symbol} · 5초 갱신`}
      href={`/ticks?symbol=${symbol}`}
      action={
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={symbolInput}
            onChange={handleSymbolChange}
            className="w-16 text-[10px] font-mono border border-[#E5E7EB] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]"
            placeholder="005930"
            aria-label="종목 코드"
          />
          {loading && <span className="text-[10px] text-[#BBB]">로딩…</span>}
        </div>
      }
    >
      <div className="px-3 py-2 border-b border-[#F0F0F0]">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[#999]">체결강도</span>
          <span className={`font-bold ${strengthUp ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
            {strength}%
          </span>
        </div>
        <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${strengthUp ? 'bg-[#FF3B30]' : 'bg-[#0051CC]'}`}
            style={{ width: `${Math.min(strength, 100)}%` }}
          />
        </div>
      </div>

      <div role="table" aria-label="체결 내역">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-3 px-3 py-1 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">시각</span>
            <span role="columnheader" className="text-right">체결가</span>
            <span role="columnheader" className="text-right">체결량</span>
          </div>
        </div>
        <div role="rowgroup">
          {executions.slice(0, 10).map((t, i) => {
            const up = t.changeSign === '1' || t.changeSign === '2';
            return (
              <div
                key={i}
                role="row"
                className="grid grid-cols-3 px-3 py-1 text-xs border-b border-[#F0F0F0]"
              >
                <span role="cell" className="text-[#999]">{fmtTime(t.time)}</span>
                <span role="cell" className={`text-right font-bold ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                  {fmtPrice(t.price)}
                </span>
                <span role="cell" className="text-right text-[#555]">{t.volume.toLocaleString()}</span>
              </div>
            );
          })}
          {!loading && executions.length === 0 && (
            <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
