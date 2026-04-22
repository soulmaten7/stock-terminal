'use client';

import { useEffect, useState, useMemo, type ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Execution {
  time: string;
  price: number;
  change: number;
  changeSign: string;
  volume: number;
}

const DEFAULT_SYMBOL = '005930';

function fmtPrice(n: number): string {
  return n.toLocaleString('ko-KR');
}
function fmtTime(t: string): string {
  if (!t || t.length < 6) return t || '—';
  return `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`;
}

export default function TicksPageClient() {
  const sp = useSearchParams();
  const initSym = sp.get('symbol') && /^\d{6}$/.test(sp.get('symbol')!) ? sp.get('symbol')! : DEFAULT_SYMBOL;

  const [symbol, setSymbol] = useState(initSym);
  const [symbolInput, setSymbolInput] = useState(initSym);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/kis/execution?symbol=${symbol}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setExecutions(data.executions || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setLoading(true);
    load();
    const iv = setInterval(load, 5_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [symbol]);

  const { strength, buyVol, sellVol, totalVol, avgPrice } = useMemo(() => {
    const recent = executions.slice(0, 50);
    const buyVol = recent.filter((e) => e.changeSign === '1' || e.changeSign === '2').reduce((s, e) => s + e.volume, 0);
    const sellVol = recent.filter((e) => e.changeSign === '4' || e.changeSign === '5').reduce((s, e) => s + e.volume, 0);
    const totalVol = buyVol + sellVol;
    const strength = totalVol === 0 ? 50 : Math.round((buyVol / totalVol) * 100);
    const avgPrice = recent.length === 0 ? 0 : Math.round(recent.reduce((s, e) => s + e.price * e.volume, 0) / Math.max(1, recent.reduce((s, e) => s + e.volume, 0)));
    return { strength, buyVol, sellVol, totalVol, avgPrice };
  }, [executions]);

  const handleSymbolChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSymbolInput(v);
    if (v.length === 6) setSymbol(v);
  };

  const strengthUp = strength >= 50;

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">체결창</h1>
        <p className="text-sm text-[#666]">
          실시간 체결 내역 + 체결강도 + 매수/매도 분포. KIS API FHKST01010300 · 5초 갱신.
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-center gap-3">
        <label className="text-xs text-[#666]">종목 코드</label>
        <input
          type="text"
          inputMode="numeric"
          value={symbolInput}
          onChange={handleSymbolChange}
          className="w-24 text-sm font-mono border border-[#E5E7EB] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]"
          placeholder="005930"
        />
        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      {/* 통계 + 테이블 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* 통계 패널 */}
        <aside className="space-y-3">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-xs text-[#999] mb-2">체결강도</div>
            <div className={`text-3xl font-bold ${strengthUp ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
              {strength}%
            </div>
            <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${strengthUp ? 'bg-[#FF3B30]' : 'bg-[#0051CC]'}`}
                style={{ width: `${Math.min(strength, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#888] mt-2">최근 50건 기준</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#666]">매수 체결량</span>
              <span className="text-[#FF3B30] font-bold tabular-nums">{buyVol.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">매도 체결량</span>
              <span className="text-[#0051CC] font-bold tabular-nums">{sellVol.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-[#F0F0F0] pt-2">
              <span className="text-[#666]">총 체결량</span>
              <span className="text-black font-bold tabular-nums">{totalVol.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">가중평균가</span>
              <span className="text-black font-bold tabular-nums">{avgPrice > 0 ? fmtPrice(avgPrice) : '—'}</span>
            </div>
          </div>
        </aside>

        {/* 체결 테이블 */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="px-4 py-2.5 text-left w-24">시각</th>
                <th className="px-4 py-2.5 text-right w-28">체결가</th>
                <th className="px-4 py-2.5 text-right w-20">변동</th>
                <th className="px-4 py-2.5 text-right">체결량</th>
                <th className="px-4 py-2.5 text-center w-16">구분</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
              )}
              {!loading && executions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-[#999]">데이터 없음</td></tr>
              )}
              {executions.slice(0, 50).map((t, i) => {
                const up = t.changeSign === '1' || t.changeSign === '2';
                return (
                  <tr key={i} className="border-t border-[#F0F0F0] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-2 text-[#888] font-mono text-xs">{fmtTime(t.time)}</td>
                    <td className={`px-4 py-2 text-right font-bold tabular-nums ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {fmtPrice(t.price)}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums text-xs ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {t.change > 0 ? '+' : ''}{t.change}
                    </td>
                    <td className="px-4 py-2 text-right text-[#555] tabular-nums">{t.volume.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${up ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-[#0051CC]/10 text-[#0051CC]'}`}>
                        {up ? '매수' : '매도'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
