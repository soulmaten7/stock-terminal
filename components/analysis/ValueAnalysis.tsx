'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Financial } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import ComingSoonCard from '@/components/common/ComingSoonCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface Props {
  stockId: number;
}

function formatNum(n: number | null | undefined, digits = 2, suffix = ''): string {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`;
}

export default function ValueAnalysis({ stockId }: Props) {
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('financials')
        .select('*')
        .eq('stock_id', stockId)
        .eq('period_type', 'annual')
        .order('period_date', { ascending: false })
        .limit(5);
      if (data) setFinancials(data as Financial[]);
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

  const latest = financials[0] ?? null;

  const metrics = [
    { label: 'PER', value: latest?.per, desc: '주가수익비율', suffix: '배' },
    { label: 'PBR', value: latest?.pbr, desc: '주가순자산비율', suffix: '배' },
    {
      label: 'ROE',
      value: latest?.roe ?? (latest?.eps && latest?.bps && latest.bps !== 0 ? (latest.eps / latest.bps) * 100 : null),
      desc: '자기자본이익률',
      suffix: '%',
    },
    { label: 'EPS', value: latest?.eps, desc: '주당순이익', suffix: '원' },
    { label: 'BPS', value: latest?.bps, desc: '주당순자산', suffix: '원' },
  ];

  const incomeSeries = [...financials]
    .filter(f => f.revenue != null || f.operating_income != null || f.net_income != null)
    .reverse()
    .map(f => ({
      period: f.period_date.slice(0, 4),
      revenue: f.revenue ? Math.round(f.revenue / 100_000_000) : null,
      operating_income: f.operating_income ? Math.round(f.operating_income / 100_000_000) : null,
      net_income: f.net_income ? Math.round(f.net_income / 100_000_000) : null,
    }));

  const marginSeries = [...financials]
    .filter(f => f.operating_margin != null || f.net_margin != null || f.debt_ratio != null)
    .reverse()
    .map(f => ({
      period: f.period_date.slice(0, 4),
      opMargin: f.operating_margin,
      netMargin: f.net_margin,
      debtRatio: f.debt_ratio,
    }));

  const hasIncomeData = incomeSeries.length > 0;
  const hasMarginData = marginSeries.length > 0;

  return (
    <div className="space-y-6">
      {/* 핵심 밸류에이션 지표 */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          핵심 밸류에이션 지표
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <p className="text-xs text-text-secondary mb-1">{m.desc}</p>
              <p className="text-base font-bold font-mono-price">{m.label}</p>
              <p className="text-2xl font-bold font-mono-price mt-1 text-text-primary">
                {formatNum(m.value, 2, m.suffix)}
              </p>
            </div>
          ))}
        </div>
        {latest?.period_date && (
          <p className="text-xs text-text-secondary/70 mt-2">
            기준: {latest.period_date} ({latest.period_type}){latest.source ? ` · 출처 ${latest.source}` : ''}
          </p>
        )}
      </div>

      {/* 손익계산서 시계열 */}
      {hasIncomeData ? (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            손익계산서 추이 (단위: 억원)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incomeSeries} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="매출액" stroke="#0ABAB5" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="operating_income" name="영업이익" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="net_income" name="당기순이익" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <ComingSoonCard
          title="손익계산서 시계열"
          description="해당 종목은 DART 재무제표 수집 대상에 아직 포함되지 않았습니다. 시총 TOP 100 종목 우선 커버 중 — 확장 예정."
        />
      )}

      {/* 수익성·안정성 지표 */}
      {hasMarginData && (
        <div className="bg-dark-700 rounded-lg p-5 border border-border">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            수익성·안정성 지표 (단위: %)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginSeries} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="period" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Line type="monotone" dataKey="opMargin" name="영업이익률" stroke="#0ABAB5" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="netMargin" name="순이익률" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="debtRatio" name="부채비율" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}
