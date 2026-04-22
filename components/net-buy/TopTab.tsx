'use client';

import { useEffect, useState } from 'react';

interface NetItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
}

function fmtBn(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toLocaleString('ko-KR')}`;
}

function fmtPrice(val: number): string {
  return val.toLocaleString('ko-KR');
}

export default function TopTab() {
  const [rows, setRows] = useState<NetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/kis/investor-rank')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const foreignTop: NetItem[] = d.foreignTop ?? [];
        const institutionTop: NetItem[] = d.institutionTop ?? [];
        const map = new Map<string, NetItem>();
        for (const it of [...foreignTop, ...institutionTop]) {
          if (!map.has(it.symbol)) map.set(it.symbol, it);
        }
        const merged = Array.from(map.values())
          .sort((a, b) => (b.foreignBuy + b.institutionBuy) - (a.foreignBuy + a.institutionBuy))
          .slice(0, 20);
        setRows(merged);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="text-sm text-[#666] mb-3">
        외국인·기관 순매수 상위 종목. 외국인 TOP 10과 기관 TOP 10을 합산해 정렬. KIS API FHPTJ04400000 기반.
      </p>
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <span className="text-sm font-bold text-black">실시간 수급 TOP</span>
          <span className="text-[10px] font-bold text-[#999]">당일 기준</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                <th className="px-4 py-2.5 text-left font-bold text-[#666]">순위</th>
                <th className="px-4 py-2.5 text-left font-bold text-[#666]">종목명</th>
                <th className="px-4 py-2.5 text-right font-bold text-[#666]">외국인 순매수(억)</th>
                <th className="px-4 py-2.5 text-right font-bold text-[#666]">기관 순매수(억)</th>
                <th className="px-4 py-2.5 text-right font-bold text-[#666]">현재가</th>
                <th className="px-4 py-2.5 text-right font-bold text-[#666]">등락률</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-[#FF3B30]">데이터를 불러오지 못했습니다</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-[#999]">데이터 없음</td></tr>
              )}
              {!loading && !error && rows.map((r, i) => (
                <tr key={r.symbol} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                  <td className="px-4 py-2 text-[#333]">{i + 1}</td>
                  <td className="px-4 py-2 text-[#333] font-bold truncate">{r.name}</td>
                  <td className={`px-4 py-2 text-right font-bold ${r.foreignBuy >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF3B30]'}`}>
                    {fmtBn(r.foreignBuy)}
                  </td>
                  <td className={`px-4 py-2 text-right font-bold ${r.institutionBuy >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF3B30]'}`}>
                    {fmtBn(r.institutionBuy)}
                  </td>
                  <td className="px-4 py-2 text-right text-[#333]">{fmtPrice(r.price)}원</td>
                  <td className={`px-4 py-2 text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                    {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
