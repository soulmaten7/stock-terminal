'use client';

import { useEffect, useState } from 'react';

interface FlowRow {
  label: string;
  kospi: string;
  kosdaq: string;
}

function colorClass(val: string) {
  return val.startsWith('+') ? 'text-[#0ABAB5]' : val.startsWith('-') ? 'text-[#FF3B30]' : 'text-[#999]';
}

export default function FlowTab() {
  const [rows, setRows] = useState<FlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/home/investor-flow')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setRows(d.rows ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="text-sm text-[#666] mb-3">
        외국인·기관·개인·기타법인의 코스피/코스닥 순매수 합계. 당일 스냅샷 기준. KIS API FHKST01010900 기반.
      </p>
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <span className="text-sm font-bold text-black">투자자별 매매동향</span>
          <span className="text-[10px] font-bold text-[#999]">당일 기준</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                <th className="px-4 py-3 text-left font-bold text-[#666] text-xs">투자자</th>
                <th className="px-4 py-3 text-right font-bold text-[#666] text-xs">코스피 순매수</th>
                <th className="px-4 py-3 text-right font-bold text-[#666] text-xs">코스닥 순매수</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-[#FF3B30]">데이터를 불러오지 못했습니다</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-[#999]">데이터 없음</td></tr>
              )}
              {!loading && !error && rows.map((r) => (
                <tr key={r.label} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                  <td className="px-4 py-3 text-[#333] font-bold">{r.label}</td>
                  <td className={`px-4 py-3 text-right font-bold ${colorClass(r.kospi)}`}>{r.kospi}</td>
                  <td className={`px-4 py-3 text-right font-bold ${colorClass(r.kosdaq)}`}>{r.kosdaq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#999]">
        * 기타법인은 현재 0으로 표시됩니다 (KIS inquire-investor API가 기타법인 순매수를 분리 제공하지 않음). 향후 별도 API 연동 필요.
      </p>
    </div>
  );
}
