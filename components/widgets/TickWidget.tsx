'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface Execution {
  time: string; // HHMMSS
  price: number;
  change: number;
  changeSign: string; // 1=상승 2=하락 3=보합 4=상한 5=하한
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

// 체결강도 = (매수체결 volume / 전체 volume) × 100
// KIS changeSign: 1=상한, 2=상승, 3=보합, 4=하한, 5=하락
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
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/kis/execution?symbol=${DEFAULT_SYMBOL}`);
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

    load();
    const timer = setInterval(load, 5_000); // 5초마다 갱신

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const strength = calcStrength(executions);
  const strengthUp = strength >= 50;

  return (
    <WidgetCard
      title="체결창"
      subtitle={`${DEFAULT_SYMBOL} · 5초 갱신`}
      href="/ticks"
      action={
        loading ? <span className="text-[10px] text-[#BBB]">로딩 중…</span> : undefined
      }
    >
      {/* 체결강도 바 */}
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
      {/* 체결 로그 */}
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
                <span
                  role="cell"
                  className={`text-right font-bold ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
                >
                  {fmtPrice(t.price)}
                </span>
                <span role="cell" className="text-right text-[#555]">
                  {t.volume.toLocaleString()}
                </span>
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
