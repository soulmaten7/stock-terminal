'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type Statement = {
  period: string;
  periodType: string;
  year: number;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  opMargin: number | null;
  netMargin: number | null;
};

type EarningsData = {
  quarters: Statement[];
  annual: Statement[];
  fallbackReason?: string;
};

function fmt조억(v: number | null): string {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(1)}조`;
  if (abs >= 1e8) return `${(v / 1e8).toFixed(0)}억`;
  return v.toLocaleString('ko-KR');
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return `${v.toFixed(2)}%`;
}

// Recharts 용 단위 축약 (조 단위)
function toTri(v: number | null) {
  if (v == null) return null;
  return Math.round((v / 1e12) * 10) / 10;
}

const COLORS = {
  revenue: '#0ABAB5',
  operatingIncome: '#FF3B30',
  netIncome: '#007AFF',
  opMargin: '#FF3B30',
  netMargin: '#007AFF',
};

export default function EarningsTab({ stockId, symbol }: { stockId: number; symbol: string }) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'annual' | 'quarterly'>('annual');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/earnings?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-[#999999] text-sm">
        불러오는 중…
      </div>
    );
  }

  if (!data || (data.annual.length === 0 && data.quarters.length === 0)) {
    return (
      <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
        DART 재무제표 조회 불가 — corp_code 또는 조회년도 확인 필요
        {data?.fallbackReason && (
          <p className="text-[10px] mt-1 text-[#999999]">{data.fallbackReason}</p>
        )}
      </div>
    );
  }

  const annualChartData = data.annual.map((r) => ({
    period: r.period,
    매출: toTri(r.revenue),
    영업이익: toTri(r.operatingIncome),
    순이익: toTri(r.netIncome),
  }));

  const quarterChartData = data.quarters.map((r) => ({
    period: r.period,
    매출: toTri(r.revenue),
    영업이익: toTri(r.operatingIncome),
    순이익: toTri(r.netIncome),
    OPM: r.opMargin,
    순이익률: r.netMargin,
  }));

  const tableData = tab === 'annual' ? data.annual : data.quarters;

  return (
    <div className="space-y-6">
      {/* 탭 토글 */}
      <div className="flex gap-2">
        {(['annual', 'quarterly'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${
              tab === t
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#666666] border-[#E5E7EB] hover:border-black'
            }`}
          >
            {t === 'annual' ? '연간' : '분기'}
          </button>
        ))}
      </div>

      {/* 연간 막대차트 */}
      {tab === 'annual' && annualChartData.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-black mb-3">연간 실적 (단위: 조원)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={annualChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#666666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#666666' }} unit="조" />
              <Tooltip formatter={(v) => [`${v}조`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="매출" fill={COLORS.revenue} radius={[2, 2, 0, 0]} />
              <Bar dataKey="영업이익" fill={COLORS.operatingIncome} radius={[2, 2, 0, 0]} />
              <Bar dataKey="순이익" fill={COLORS.netIncome} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 분기 라인차트 */}
      {tab === 'quarterly' && quarterChartData.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-black mb-3">분기 실적 추이 (단위: 조원)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={quarterChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#666666' }} />
                <YAxis tick={{ fontSize: 11, fill: '#666666' }} unit="조" />
                <Tooltip formatter={(v) => [`${v}조`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="매출" stroke={COLORS.revenue} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="영업이익" stroke={COLORS.operatingIncome} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="순이익" stroke={COLORS.netIncome} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-bold text-black mb-3">분기 마진율 추이</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={quarterChartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#666666' }} />
                <YAxis tick={{ fontSize: 11, fill: '#666666' }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="OPM" stroke={COLORS.opMargin} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="순이익률" stroke={COLORS.netMargin} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 상세 테이블 */}
      <div>
        <h3 className="text-sm font-bold text-black mb-2">
          {tab === 'annual' ? '연간' : '분기'} 상세
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E5E7EB]">
                {['기간', '매출액', '영업이익', '순이익', 'OP마진', '순이익률'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-bold text-[#666666]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((r) => (
                <tr key={r.period} className="border-b border-[#F5F7FA] hover:bg-[#F5F7FA]">
                  <td className="px-3 py-2 font-mono-price font-bold text-black">{r.period}</td>
                  <td className="px-3 py-2 text-black">{fmt조억(r.revenue)}</td>
                  <td className={`px-3 py-2 font-bold ${(r.operatingIncome ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                    {fmt조억(r.operatingIncome)}
                  </td>
                  <td className={`px-3 py-2 font-bold ${(r.netIncome ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                    {fmt조억(r.netIncome)}
                  </td>
                  <td className="px-3 py-2 text-[#666666]">{fmtPct(r.opMargin)}</td>
                  <td className="px-3 py-2 text-[#666666]">{fmtPct(r.netMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-[#999999]">
        출처: DART 재무제표 (연결재무제표 기준) · stockId {stockId}
      </p>
    </div>
  );
}
