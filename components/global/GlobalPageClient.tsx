'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface QuoteItem {
  section: string;
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

const SECTIONS = ['전체', '국내', '미국', '선물', '환율', '채권', '원자재', '아시아', '유럽'] as const;
type Section = (typeof SECTIONS)[number];

function fmt(n: number | null, digits = 2): string {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: digits });
  return n.toFixed(digits);
}

function isYield(symbol: string): boolean {
  return ['^TNX', '^FVX', '^IRX', '^TYX'].includes(symbol);
}

export default function GlobalPageClient() {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [section, setSection] = useState<Section>('전체');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/global');
        if (!res.ok) throw new Error('load fail');
        const d = await res.json();
        if (cancelled) return;
        setItems(d.items ?? []);
        setUpdatedAt(d.updatedAt ?? '');
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  const filtered = section === '전체' ? items : items.filter((i) => i.section === section);

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">글로벌 지수</h1>
        <p className="text-sm text-[#666]">
          전 세계 주요 지수·환율·선물·채권·원자재 실시간. Yahoo Finance v2 · 60초 갱신.
          {updatedAt && <span className="ml-2 text-[#999]">최종 {new Date(updatedAt).toLocaleTimeString('ko-KR')}</span>}
        </p>
      </div>

      {/* 섹션 필터 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white flex-wrap">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={`text-xs font-bold px-3 py-2 transition-colors ${
                section === s
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="px-4 py-2.5 text-left w-20">구분</th>
                <th className="px-4 py-2.5 text-left">지수/종목</th>
                <th className="px-4 py-2.5 text-right w-28">현재가</th>
                <th className="px-4 py-2.5 text-right w-24">등락</th>
                <th className="px-4 py-2.5 text-right w-24">등락률</th>
                <th className="px-4 py-2.5 text-right w-28">52주 고가</th>
                <th className="px-4 py-2.5 text-right w-28">52주 저가</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#FF3B30]">데이터를 불러오지 못했습니다</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">데이터 없음</td></tr>
              )}
              {!loading && !error && filtered.map((r) => {
                const up = r.changePercent >= 0;
                const yieldSym = isYield(r.symbol);
                return (
                  <tr key={r.symbol} className="border-t border-[#F0F0F0] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-2.5 text-[#888] text-xs">{r.section}</td>
                    <td className="px-4 py-2.5 text-black font-bold">{r.label}</td>
                    <td className="px-4 py-2.5 text-right text-[#333] tabular-nums">
                      {yieldSym ? `${fmt(r.price, 3)}%` : fmt(r.price)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {up ? '+' : ''}{fmt(r.change, yieldSym ? 3 : 2)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {up ? '+' : ''}{r.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#666] tabular-nums">
                      {yieldSym ? (r.fiftyTwoWeekHigh !== null ? `${fmt(r.fiftyTwoWeekHigh, 3)}%` : '—') : fmt(r.fiftyTwoWeekHigh)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#666] tabular-nums">
                      {yieldSym ? (r.fiftyTwoWeekLow !== null ? `${fmt(r.fiftyTwoWeekLow, 3)}%` : '—') : fmt(r.fiftyTwoWeekLow)}
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
