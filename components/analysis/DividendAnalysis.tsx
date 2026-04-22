'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Dividend } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Coins, TrendingUp, Percent } from 'lucide-react';

interface Props {
  stockId: number;
}

function formatNum(n: number | null | undefined, digits = 0, suffix = ''): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`;
}

export default function DividendAnalysis({ stockId }: Props) {
  const [rows, setRows] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('dividends')
        .select('*')
        .eq('stock_id', stockId)
        .order('fiscal_year', { ascending: true });
      if (data) setRows(data as Dividend[]);
      setLoading(false);
    }
    load();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
          <Coins className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            배당 정보 없음
          </h3>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            해당 종목은 최근 6년간 DART에 배당 공시가 없거나 무배당입니다. 시총 TOP 200 대상 커버 중 — 확장 예정.
          </p>
        </div>
        <DisclaimerBanner />
      </div>
    );
  }

  const chartData = rows.map(r => ({
    year: String(r.fiscal_year),
    dps: r.dividend_per_share,
    yield: r.dividend_yield,
    payout: r.payout_ratio,
  }));

  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const dpsGrowth =
    prev?.dividend_per_share && latest?.dividend_per_share
      ? ((latest.dividend_per_share - prev.dividend_per_share) / prev.dividend_per_share) * 100
      : null;

  const metrics = [
    { label: '주당 배당금 (최근)', value: latest.dividend_per_share, digits: 0, suffix: '원' },
    { label: '배당 수익률 (최근)', value: latest.dividend_yield, digits: 2, suffix: '%' },
    { label: '배당 성향 (최근)', value: latest.payout_ratio, digits: 2, suffix: '%' },
    { label: 'DPS 성장률 (YoY)', value: dpsGrowth, digits: 2, suffix: '%' },
  ];

  return (
    <div className="space-y-6">
      {/* 최근 배당 요약 */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent" />
          최근 회계연도 배당 ({latest.fiscal_year}년)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <p className="text-xs text-text-secondary mb-1">{m.label}</p>
              <p className="text-2xl font-bold font-mono-price mt-1 text-text-primary">
                {formatNum(m.value, m.digits, m.suffix)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-secondary/70 mt-2">
          출처: DART 정기공시 배당에 관한 사항 (alotMatter)
        </p>
      </div>

      {/* 주당 현금배당금 추이 */}
      {chartData.some(d => d.dps != null) && (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent" />
            주당 현금배당금 추이 (단위: 원)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value) => value != null ? `${Number(value).toLocaleString('ko-KR')}원` : '—'}
                />
                <Bar dataKey="dps" name="주당 배당금" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 배당 수익률 추이 */}
      {chartData.some(d => d.yield != null) && (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            배당 수익률 추이 (단위: %)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value) => value != null ? `${Number(value).toFixed(2)}%` : '—'}
                />
                <Line type="monotone" dataKey="yield" name="배당 수익률" stroke="#0ABAB5" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 배당 성향 추이 */}
      {chartData.some(d => d.payout != null) && (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-accent" />
            배당 성향 추이 (단위: %)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value) => value != null ? `${Number(value).toFixed(2)}%` : '—'}
                />
                <Line type="monotone" dataKey="payout" name="배당 성향" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            배당 성향 = 배당 총액 ÷ 당기순이익. 높을수록 순이익 중 주주환원 비중 큼.
          </p>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
