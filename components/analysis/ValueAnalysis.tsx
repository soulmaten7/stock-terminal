'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatPercent } from '@/lib/utils/format';
import { calculateGrahamValue, calculateSafetyMargin } from '@/lib/utils/stockCalculations';
import type { Financial, AIAnalysis } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Shield, Calculator, Brain } from 'lucide-react';

interface Props {
  stockId: number;
}

interface MetricCard {
  label: string;
  value: number | null;
  sectorAvg: number | null;
  description: string;
}

// Placeholder sector averages
const SECTOR_AVERAGES = {
  per: 15.2,
  pbr: 1.3,
  psr: 1.8,
  pcr: 8.5,
  evEbitda: 10.2,
};

export default function ValueAnalysis({ stockId }: Props) {
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [finRes, aiRes] = await Promise.all([
        supabase
          .from('financials')
          .select('*')
          .eq('stock_id', stockId)
          .eq('period_type', 'annual')
          .order('period_date', { ascending: false })
          .limit(5),
        supabase
          .from('ai_analyses')
          .select('*')
          .eq('stock_id', stockId)
          .eq('analysis_type', 'value')
          .order('generated_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (finRes.data) setFinancials(finRes.data as Financial[]);
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

  const latest = financials[0] ?? null;

  // Derive metric values
  const per = latest?.per ?? null;
  const pbr = latest?.pbr ?? null;
  // Approximate PSR and PCR from available data
  const psr = latest?.revenue && latest?.per && latest?.net_income && latest.net_income !== 0
    ? (latest.per * latest.net_income) / latest.revenue
    : null;
  const pcr = null; // not available in schema, use placeholder
  const evEbitda = latest?.operating_income
    ? null // would need market_cap + debt, use placeholder
    : null;

  // Use placeholder values if DB is empty
  const displayPer = per ?? 12.5;
  const displayPbr = pbr ?? 0.95;
  const displayPsr = psr ?? 1.2;
  const displayPcr = pcr ?? 6.8;
  const displayEvEbitda = evEbitda ?? 8.3;

  const metrics: MetricCard[] = [
    { label: 'PER', value: displayPer, sectorAvg: SECTOR_AVERAGES.per, description: '주가수익비율' },
    { label: 'PBR', value: displayPbr, sectorAvg: SECTOR_AVERAGES.pbr, description: '주가순자산비율' },
    { label: 'PSR', value: displayPsr, sectorAvg: SECTOR_AVERAGES.psr, description: '주가매출비율' },
    { label: 'PCR', value: displayPcr, sectorAvg: SECTOR_AVERAGES.pcr, description: '주가현금흐름비율' },
    { label: 'EV/EBITDA', value: displayEvEbitda, sectorAvg: SECTOR_AVERAGES.evEbitda, description: '기업가치/EBITDA' },
  ];

  // Sector comparison chart data
  const sectorChartData = metrics.map((m) => ({
    name: m.label,
    current: m.value,
    sector: m.sectorAvg,
  }));

  // Graham value
  const eps = latest?.eps ?? 5200;
  const bps = latest?.bps ?? 48000;
  const grahamValue = calculateGrahamValue(eps, bps);
  const currentPrice = 52000; // placeholder
  const safetyMargin = grahamValue ? calculateSafetyMargin(grahamValue, currentPrice) : null;

  // Simple DCF
  const fcf = latest?.operating_income ? latest.operating_income * 0.7 : 350_000_000_000;
  const growthRate = 0.08;
  const discountRate = 0.10;
  const terminalGrowth = 0.02;
  const years = 5;
  let dcfSum = 0;
  for (let i = 1; i <= years; i++) {
    dcfSum += (fcf * Math.pow(1 + growthRate, i)) / Math.pow(1 + discountRate, i);
  }
  const terminalValue = (fcf * Math.pow(1 + growthRate, years) * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, years);
  const enterpriseValue = dcfSum + pvTerminal;
  const sharesOutstanding = 100_000_000; // placeholder
  const dcfFairValue = Math.round(enterpriseValue / sharesOutstanding);

  function getValueColor(current: number | null, sectorAvg: number | null): string {
    if (current == null || sectorAvg == null) return 'text-text-secondary';
    return current < sectorAvg ? 'text-down' : 'text-up';
  }

  return (
    <div className="space-y-6">
      {/* Key Metric Cards */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          핵심 밸류에이션 지표
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <p className="text-xs text-text-secondary mb-1">{m.description}</p>
              <p className="text-lg font-bold font-mono-price">{m.label}</p>
              <p className={`text-2xl font-bold font-mono-price mt-1 ${getValueColor(m.value, m.sectorAvg)}`}>
                {m.value?.toFixed(2) ?? '-'}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                섹터 평균: <span className="font-mono-price">{m.sectorAvg?.toFixed(2)}</span>
              </p>
              {m.value != null && m.sectorAvg != null && (
                <span
                  className={`inline-block mt-1.5 px-2 py-0.5 text-xs rounded ${
                    m.value < m.sectorAvg
                      ? 'bg-down/10 text-down'
                      : 'bg-up/10 text-up'
                  }`}
                >
                  {m.value < m.sectorAvg ? '저평가' : '고평가'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sector Comparison Chart */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">섹터 대비 비교</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorChartData} layout="vertical" margin={{ left: 60, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                width={60}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F9FAFB' }}
                itemStyle={{ color: '#F9FAFB' }}
              />
              <Bar dataKey="current" name="현재" fill="#0ABAB5" radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="sector" name="섹터 평균" fill="#4B5563" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graham Safety Margin */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          그레이엄 안전마진
        </h3>
        <div className="bg-dark-800 rounded-lg p-4 mb-4">
          <p className="text-xs text-text-secondary mb-2">산출 공식</p>
          <p className="font-mono-price text-sm text-text-primary">
            적정가치 = sqrt(22.5 x EPS x BPS)
          </p>
          <p className="font-mono-price text-sm text-text-secondary mt-1">
            = sqrt(22.5 x {formatNumber(eps)} x {formatNumber(bps)})
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-text-secondary">그레이엄 적정가치</p>
            <p className="text-xl font-bold font-mono-price text-accent mt-1">
              {grahamValue ? formatNumber(Math.round(grahamValue)) + '원' : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-secondary">현재 주가</p>
            <p className="text-xl font-bold font-mono-price text-text-primary mt-1">
              {formatNumber(currentPrice)}원
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-secondary">안전마진</p>
            <p className={`text-xl font-bold font-mono-price mt-1 ${
              safetyMargin != null && safetyMargin > 0 ? 'text-success' : 'text-up'
            }`}>
              {safetyMargin != null ? formatPercent(safetyMargin) : '-'}
            </p>
          </div>
        </div>
        {safetyMargin != null && (
          <div className="mt-4">
            <div className="w-full bg-dark-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${safetyMargin > 0 ? 'bg-success' : 'bg-up'}`}
                style={{ width: `${Math.min(Math.max(50 + safetyMargin / 2, 5), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>고평가</span>
              <span>적정</span>
              <span>저평가</span>
            </div>
          </div>
        )}
      </div>

      {/* Simple DCF Model */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-accent" />
          간이 DCF 모델
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-dark-800 rounded-lg p-3">
            <p className="text-xs text-text-secondary">추정 FCF</p>
            <p className="font-mono-price text-sm font-bold mt-1">{formatNumber(Math.round(fcf / 100_000_000))}억</p>
          </div>
          <div className="bg-dark-800 rounded-lg p-3">
            <p className="text-xs text-text-secondary">성장률</p>
            <p className="font-mono-price text-sm font-bold mt-1">{(growthRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-dark-800 rounded-lg p-3">
            <p className="text-xs text-text-secondary">할인율</p>
            <p className="font-mono-price text-sm font-bold mt-1">{(discountRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-dark-800 rounded-lg p-3">
            <p className="text-xs text-text-secondary">영구성장률</p>
            <p className="font-mono-price text-sm font-bold mt-1">{(terminalGrowth * 100).toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-dark-800 rounded-lg p-4 text-center">
          <p className="text-xs text-text-secondary mb-1">DCF 추정 적정가치</p>
          <p className="text-3xl font-bold font-mono-price text-premium">
            {formatNumber(dcfFairValue)}원
          </p>
          <p className={`text-sm font-mono-price mt-1 ${dcfFairValue > currentPrice ? 'text-success' : 'text-up'}`}>
            현재가 대비 {formatPercent(((dcfFairValue - currentPrice) / currentPrice) * 100)}
          </p>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-premium" />
          AI 가치투자 분석 요약
        </h3>
        {aiAnalysis ? (
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {aiAnalysis.content_ko}
          </div>
        ) : (
          <div className="bg-dark-800 rounded-lg p-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              현재 PER {displayPer.toFixed(1)}배, PBR {displayPbr.toFixed(1)}배로 섹터 평균 대비{' '}
              {displayPer < SECTOR_AVERAGES.per ? '저평가' : '고평가'} 구간에 위치합니다.
              그레이엄 적정가치 기준 안전마진은 {safetyMargin?.toFixed(1)}%이며,
              DCF 모델 기준 추정 적정가치는 {formatNumber(dcfFairValue)}원입니다.
              장기 가치투자 관점에서의 종합적인 검토가 필요합니다.
            </p>
            <p className="text-xs text-text-secondary/50 mt-2">* AI 분석이 아직 생성되지 않아 자동 요약을 표시합니다.</p>
          </div>
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
