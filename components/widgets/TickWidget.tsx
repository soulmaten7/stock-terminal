'use client';

import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import WidgetCard from '@/components/home/WidgetCard';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

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

function hugeThreshold(execs: Execution[]): number {
  if (execs.length === 0) return Infinity;
  const sorted = [...execs].map((e) => e.volume).sort((a, b) => a - b);
  const p80 = sorted[Math.floor(sorted.length * 0.8)] ?? sorted[sorted.length - 1];
  return p80 * 3;
}

export default function TickWidget() {
  const selectedCode = useSelectedSymbolStore((s) => s.selected?.code);
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [symbolInput, setSymbolInput] = useState(DEFAULT_SYMBOL);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);
  const prevFirstKey = useRef<string>('');

  // sync with global selected symbol
  useEffect(() => {
    if (selectedCode && /^\d{6}$/.test(selectedCode)) {
      setSymbol(selectedCode);
      setSymbolInput(selectedCode);
    }
  }, [selectedCode]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/kis/execution?symbol=${symbol}`);
        if (!res.ok) return;
        const data: ApiResponse = await res.json();
        if (cancelled) return;
        const execs = data.executions || [];
        setExecutions(execs);
        setTotalVolume(execs.reduce((s, e) => s + e.volume, 0));
        prevFirstKey.current = execs[0] ? `${execs[0].time}-${execs[0].volume}` : '';
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
  const huge = hugeThreshold(executions);
  const displayed = executions.slice(0, 10);

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
      {/* 체결강도 */}
      <div className="px-3 py-1.5 border-b border-[#F0F0F0]">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[#999]">체결강도</span>
          <span className={`font-bold ${strengthUp ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>{strength}%</span>
        </div>
        <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${strengthUp ? 'bg-[#FF3B30]' : 'bg-[#0051CC]'}`}
            style={{ width: `${Math.min(strength, 100)}%` }}
          />
        </div>
      </div>

      {/* 헤더 */}
      <div className="grid grid-cols-[56px_1fr_1fr_auto] px-3 py-1 text-[10px] text-[#999] font-bold border-b border-[#F0F0F0]">
        <span>시각</span>
        <span className="text-right">체결가</span>
        <span className="text-right">체결량</span>
        <span className="w-8" />
      </div>

      {/* 체결 행 */}
      <div>
        {displayed.map((t, i) => {
          const up = t.changeSign === '1' || t.changeSign === '2';
          const isHuge = t.volume >= huge;
          const maxVol = Math.max(1, ...displayed.map((e) => e.volume));
          const barPct = Math.round((t.volume / maxVol) * 100);
          return (
            <div
              key={`${t.time}-${i}`}
              className={`relative grid grid-cols-[56px_1fr_1fr_auto] px-3 py-1 text-xs border-b border-[#F0F0F0] animate-fadeIn ${
                isHuge ? (up ? 'bg-[#FFF1F0]' : 'bg-[#F0F4FF]') : ''
              }`}
            >
              {/* 볼륨 depth bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 opacity-10 ${up ? 'bg-[#FF3B30]' : 'bg-[#0051CC]'}`}
                style={{ width: `${barPct}%` }}
                aria-hidden="true"
              />
              <span className="relative text-[#999] tabular-nums">{fmtTime(t.time)}</span>
              <span className={`relative text-right font-bold tabular-nums ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                {fmtPrice(t.price)}
              </span>
              <span className="relative text-right text-[#555] tabular-nums">{t.volume.toLocaleString()}</span>
              <span className="relative w-8 flex justify-end">
                {isHuge && (
                  <span className={`text-[8px] font-black px-1 rounded ${up ? 'bg-[#FF3B30] text-white' : 'bg-[#0051CC] text-white'}`}>
                    대
                  </span>
                )}
              </span>
            </div>
          );
        })}
        {!loading && executions.length === 0 && (
          <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
        )}
      </div>

      {/* 총 체결량 */}
      {totalVolume > 0 && (
        <div className="px-3 py-1.5 border-t border-[#F0F0F0] bg-[#FAFAFA] flex items-center justify-between">
          <span className="text-[10px] text-[#999]">표시 합계</span>
          <span className="text-[10px] font-bold text-[#333] tabular-nums">{totalVolume.toLocaleString()} 주</span>
        </div>
      )}
    </WidgetCard>
  );
}
