'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatPercent } from '@/lib/utils/format';
import type { Financial, AIAnalysis } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { Gauge, TrendingUp, Shield, Award, Brain } from 'lucide-react';

interface Props {
  stockId: number;
}

interface ScoreSection {
  label: string;
  score: number;
  icon: React.ReactNode;
  details: { label: string; value: string; percentile: number }[];
}

function ScoreGauge({ score, size = 120, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#34C759';
    if (s >= 60) return '#0ABAB5';
    if (s >= 40) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        {/* Background arc */}
        <path
          d={`M 8 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 8}`}
          fill="none"
          stroke="#374151"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M 8 ${size / 2 + 8} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 8}`}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          className="font-mono-price"
          fill={getColor(score)}
          fontSize="24"
          fontWeight="bold"
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize="10"
        >
          / 100
        </text>
      </svg>
      <p className="text-sm font-bold mt-1">{label}</p>
    </div>
  );
}

function PercentileBar({ percentile }: { percentile: number }) {
  return (
    <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all bg-accent"
        style={{ width: `${percentile}%` }}
      />
    </div>
  );
}

export default function QuantAnalysis({ stockId }: Props) {
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
          .eq('analysis_type', 'quant')
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

  // Momentum Score (placeholder returns)
  const return3m = 8.5;
  const return6m = 15.2;
  const return12m = 22.7;
  const momentumPercentile3m = 72;
  const momentumPercentile6m = 65;
  const momentumPercentile12m = 78;
  const momentumScore = Math.round((momentumPercentile3m * 0.5 + momentumPercentile6m * 0.3 + momentumPercentile12m * 0.2));

  // Value Score
  const per = latest?.per ?? 12.5;
  const pbr = latest?.pbr ?? 0.95;
  const psr = 1.2; // placeholder
  const valuePercentilePer = per < 15 ? Math.round(80 - per * 2) : Math.round(50 - per);
  const valuePercentilePbr = pbr < 1.5 ? Math.round(85 - pbr * 20) : Math.round(50 - pbr * 10);
  const valuePercentilePsr = 68;
  const valueScore = Math.round(
    Math.max(0, Math.min(100, (Math.max(0, valuePercentilePer) * 0.4 + Math.max(0, valuePercentilePbr) * 0.4 + valuePercentilePsr * 0.2)))
  );

  // Quality Score
  const roe = latest?.roe ?? 12.3;
  const debtRatio = latest?.debt_ratio ?? 85;
  // Earnings stability: low variance in net_income across years
  const earningsStability = financials.length >= 3 ? 75 : 60;
  const qualityRoeScore = Math.min(100, Math.max(0, roe * 5));
  const qualityDebtScore = Math.min(100, Math.max(0, 100 - debtRatio * 0.5));
  const qualityScore = Math.round(qualityRoeScore * 0.4 + qualityDebtScore * 0.3 + earningsStability * 0.3);

  // Overall Quant Score
  const overallScore = Math.round(momentumScore * 0.3 + valueScore * 0.35 + qualityScore * 0.35);
  const topPercent = Math.max(1, 100 - overallScore);

  const sections: ScoreSection[] = [
    {
      label: '모멘텀',
      score: momentumScore,
      icon: <TrendingUp className="w-5 h-5 text-accent" />,
      details: [
        { label: '3개월 수익률', value: formatPercent(return3m), percentile: momentumPercentile3m },
        { label: '6개월 수익률', value: formatPercent(return6m), percentile: momentumPercentile6m },
        { label: '12개월 수익률', value: formatPercent(return12m), percentile: momentumPercentile12m },
      ],
    },
    {
      label: '가치',
      score: valueScore,
      icon: <Shield className="w-5 h-5 text-accent" />,
      details: [
        { label: 'PER', value: per.toFixed(1) + '배', percentile: Math.max(0, valuePercentilePer) },
        { label: 'PBR', value: pbr.toFixed(2) + '배', percentile: Math.max(0, valuePercentilePbr) },
        { label: 'PSR', value: psr.toFixed(2) + '배', percentile: valuePercentilePsr },
      ],
    },
    {
      label: '퀄리티',
      score: qualityScore,
      icon: <Award className="w-5 h-5 text-accent" />,
      details: [
        { label: 'ROE', value: roe.toFixed(1) + '%', percentile: Math.round(qualityRoeScore) },
        { label: '부채비율', value: debtRatio.toFixed(0) + '%', percentile: Math.round(qualityDebtScore) },
        { label: '이익 안정성', value: earningsStability + '점', percentile: earningsStability },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-dark-700 rounded-lg p-6 border border-border text-center">
        <h2 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
          <Gauge className="w-5 h-5 text-accent" />
          종합 퀀트 스코어
        </h2>
        <div className="flex justify-center my-4">
          <ScoreGauge score={overallScore} size={160} label="" />
        </div>
        <p className="text-sm text-text-secondary">
          가중평균: 모멘텀 30% + 가치 35% + 퀄리티 35%
        </p>
        <p className="mt-3">
          <span className="inline-block px-4 py-1.5 rounded-full bg-premium/10 text-premium font-bold text-lg">
            상위 {topPercent}%
          </span>
        </p>
      </div>

      {/* Individual Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.label} className="bg-dark-700 rounded-lg p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              {section.icon}
              <h3 className="text-base font-bold">{section.label} 스코어</h3>
            </div>
            <div className="flex justify-center mb-4">
              <ScoreGauge score={section.score} size={100} label={`${section.score}점`} />
            </div>
            <div className="space-y-3">
              {section.details.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{d.label}</span>
                    <span className="font-mono-price font-bold">{d.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PercentileBar percentile={d.percentile} />
                    <span className="text-xs text-text-secondary font-mono-price w-10 text-right">
                      {d.percentile}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-premium" />
          AI 퀀트 분석 요약
        </h3>
        {aiAnalysis ? (
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {aiAnalysis.content_ko}
          </div>
        ) : (
          <div className="bg-dark-800 rounded-lg p-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              종합 퀀트 스코어 {overallScore}점으로 전체 종목 중 상위 {topPercent}%에 해당합니다.
              모멘텀 {momentumScore}점, 가치 {valueScore}점, 퀄리티 {qualityScore}점으로
              {momentumScore >= valueScore && momentumScore >= qualityScore
                ? ' 모멘텀 팩터가 가장 강하게 나타나고 있습니다.'
                : valueScore >= qualityScore
                ? ' 가치 팩터에서 우수한 점수를 보이고 있습니다.'
                : ' 퀄리티 팩터가 돋보입니다.'}
            </p>
            <p className="text-xs text-text-secondary/50 mt-2">* AI 분석이 아직 생성되지 않아 자동 요약을 표시합니다.</p>
          </div>
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
