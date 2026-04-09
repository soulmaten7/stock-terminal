'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatPercent } from '@/lib/utils/format';
import { calculateCAGR } from '@/lib/utils/stockCalculations';
import type { Dividend, AIAnalysis } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Coins, TrendingUp, Calendar, Brain } from 'lucide-react';

interface Props {
  stockId: number;
}

// Placeholder sector comparison
const SECTOR_DIVIDEND_DATA = [
  { name: '현재 종목', yield: 3.2 },
  { name: '섹터 평균', yield: 2.1 },
  { name: 'KOSPI 평균', yield: 1.8 },
  { name: '예금금리', yield: 3.5 },
];

// Placeholder dividends when DB is empty
const PLACEHOLDER_DIVIDENDS: Omit<Dividend, 'id' | 'stock_id' | 'created_at'>[] = [
  { fiscal_year: 2021, dividend_per_share: 1500, dividend_yield: 2.5, payout_ratio: 28, ex_dividend_date: '2022-03-28', payment_date: '2022-04-20' },
  { fiscal_year: 2022, dividend_per_share: 1700, dividend_yield: 2.8, payout_ratio: 30, ex_dividend_date: '2023-03-27', payment_date: '2023-04-19' },
  { fiscal_year: 2023, dividend_per_share: 1900, dividend_yield: 3.0, payout_ratio: 31, ex_dividend_date: '2024-03-25', payment_date: '2024-04-17' },
  { fiscal_year: 2024, dividend_per_share: 2000, dividend_yield: 3.1, payout_ratio: 32, ex_dividend_date: '2025-03-24', payment_date: '2025-04-16' },
  { fiscal_year: 2025, dividend_per_share: 2100, dividend_yield: 3.2, payout_ratio: 33, ex_dividend_date: '2026-03-30', payment_date: '2026-04-22' },
];

export default function DividendAnalysis({ stockId }: Props) {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingPlaceholder, setUsingPlaceholder] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [divRes, aiRes] = await Promise.all([
        supabase
          .from('dividends')
          .select('*')
          .eq('stock_id', stockId)
          .order('fiscal_year', { ascending: true }),
        supabase
          .from('ai_analyses')
          .select('*')
          .eq('stock_id', stockId)
          .eq('analysis_type', 'dividend')
          .order('generated_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (divRes.data && divRes.data.length > 0) {
        setDividends(divRes.data as Dividend[]);
      } else {
        // Use placeholders
        setDividends(
          PLACEHOLDER_DIVIDENDS.map((d, i) => ({
            ...d,
            id: i + 1,
            stock_id: stockId,
            created_at: new Date().toISOString(),
          })) as Dividend[]
        );
        setUsingPlaceholder(true);
      }
      if (aiRes.data) setAiAnalysis(aiRes.data as AIAnalysis);
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

  const latest = dividends[dividends.length - 1];
  const oldest = dividends[0];

  // Current yield
  const currentYield = latest?.dividend_yield ?? 0;

  // Payout ratio
  const currentPayout = latest?.payout_ratio ?? 0;

  // CAGR
  const startDps = oldest?.dividend_per_share ?? 0;
  const endDps = latest?.dividend_per_share ?? 0;
  const years = dividends.length > 1 ? (latest?.fiscal_year ?? 0) - (oldest?.fiscal_year ?? 0) : 0;
  const dividendCagr = startDps > 0 && years > 0 ? calculateCAGR(startDps, endDps, years) : null;

  // Consecutive years
  const consecutiveYears = dividends.filter((d) => (d.dividend_per_share ?? 0) > 0).length;

  // Next ex-dividend date countdown
  const today = new Date();
  let daysUntilExDiv: number | null = null;
  let nextExDivDate: string | null = null;
  // Find next upcoming ex-dividend date
  for (const d of [...dividends].reverse()) {
    if (d.ex_dividend_date) {
      const exDate = new Date(d.ex_dividend_date);
      if (exDate > today) {
        daysUntilExDiv = Math.ceil((exDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        nextExDivDate = d.ex_dividend_date;
        break;
      }
    }
  }

  // Chart data
  const yieldChartData = dividends.map((d) => ({
    year: d.fiscal_year.toString(),
    yield: d.dividend_yield ?? 0,
    dps: d.dividend_per_share ?? 0,
  }));

  const payoutChartData = dividends.map((d) => ({
    year: d.fiscal_year.toString(),
    payout: d.payout_ratio ?? 0,
  }));

  return (
    <div className="space-y-6">
      {usingPlaceholder && (
        <div className="bg-dark-800 border border-border rounded-lg p-3 text-xs text-text-secondary/60">
          * 실제 배당 데이터가 없어 예시 데이터를 표시합니다.
        </div>
      )}

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-dark-700 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-premium" />
            <p className="text-xs text-text-secondary">현재 배당수익률</p>
          </div>
          <p className="text-2xl font-bold font-mono-price text-premium">
            {currentYield.toFixed(2)}%
          </p>
        </div>
        <div className="bg-dark-700 rounded-lg p-4 border border-border">
          <p className="text-xs text-text-secondary mb-2">배당성향</p>
          <p className="text-2xl font-bold font-mono-price">{currentPayout.toFixed(1)}%</p>
        </div>
        <div className="bg-dark-700 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <p className="text-xs text-text-secondary">배당 CAGR</p>
          </div>
          <p className="text-2xl font-bold font-mono-price text-success">
            {dividendCagr != null ? dividendCagr.toFixed(1) + '%' : '-'}
          </p>
          {years > 0 && <p className="text-xs text-text-secondary mt-1">{years}년간</p>}
        </div>
        <div className="bg-dark-700 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-accent" />
            <p className="text-xs text-text-secondary">연속 배당</p>
          </div>
          <p className="text-2xl font-bold font-mono-price">{consecutiveYears}년</p>
        </div>
      </div>

      {/* Ex-dividend countdown */}
      {nextExDivDate && daysUntilExDiv != null && (
        <div className="bg-dark-700 rounded-lg p-5 border border-border flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">다음 배당락일</p>
            <p className="text-base font-bold mt-1">{nextExDivDate}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-2xl font-bold font-mono-price">
              D-{daysUntilExDiv}
            </span>
          </div>
        </div>
      )}

      {/* Yield + DPS trend chart */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">배당수익률 & 주당배당금 추이</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yieldChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis
                yAxisId="yield"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
                width={50}
              />
              <YAxis
                yAxisId="dps"
                orientation="right"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(v) => `${formatNumber(v)}`}
                width={70}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Line
                yAxisId="yield"
                type="monotone"
                dataKey="yield"
                name="수익률 (%)"
                stroke="#FFD700"
                strokeWidth={2}
                dot={{ fill: '#FFD700', r: 4 }}
              />
              <Line
                yAxisId="dps"
                type="monotone"
                dataKey="dps"
                name="주당배당금 (원)"
                stroke="#0ABAB5"
                strokeWidth={2}
                dot={{ fill: '#0ABAB5', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payout ratio trend */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">배당성향 추이</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={payoutChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `${v}%`} width={50} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, '배당성향']}
              />
              <Bar dataKey="payout" name="배당성향" fill="#34C759" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector Comparison */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">배당수익률 비교</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={SECTOR_DIVIDEND_DATA.map((d) => ({
                ...d,
                yield: d.name === '현재 종목' ? currentYield : d.yield,
              }))}
              layout="vertical"
              margin={{ left: 80, right: 20, top: 5, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value: unknown) => [`${Number(value).toFixed(2)}%`, '수익률']}
              />
              <Bar dataKey="yield" name="수익률" radius={[0, 4, 4, 0]} barSize={20}>
                {SECTOR_DIVIDEND_DATA.map((_, i) => {
                  const colors = ['#FFD700', '#0ABAB5', '#4B5563', '#9CA3AF'];
                  return <rect key={i} fill={colors[i]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-premium" />
          AI 배당투자 분석 요약
        </h3>
        {aiAnalysis ? (
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {aiAnalysis.content_ko}
          </div>
        ) : (
          <div className="bg-dark-800 rounded-lg p-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              현재 배당수익률 {currentYield.toFixed(2)}%로 섹터 평균(2.1%) 대비{' '}
              {currentYield > 2.1 ? '높은' : '낮은'} 수준입니다.
              {dividendCagr != null && ` 최근 ${years}년간 배당금 CAGR은 ${dividendCagr.toFixed(1)}%이며,`}
              {' '}연속 {consecutiveYears}년간 배당을 지급하고 있어{' '}
              {consecutiveYears >= 5 ? '안정적인 배당 이력을 보유하고 있습니다.' : '배당 이력을 쌓아가고 있습니다.'}
              {' '}배당성향 {currentPayout.toFixed(1)}%는{' '}
              {currentPayout < 40 ? '보수적인 수준으로 향후 증배 여력이 있습니다.' : '적정한 수준입니다.'}
            </p>
            <p className="text-xs text-text-secondary/50 mt-2">* AI 분석이 아직 생성되지 않아 자동 요약을 표시합니다.</p>
          </div>
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
