'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { BarChart3, Target, TrendingUp, Award } from 'lucide-react';

interface QuantFactor {
  stock_id: number;
  snapshot_date: string;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  operating_margin: number | null;
  return_3m: number | null;
  return_6m: number | null;
  return_12m: number | null;
  value_pct: number | null;
  momentum_pct: number | null;
  quality_pct: number | null;
  composite_pct: number | null;
  sector_rank_pct: number | null;
  universe_size: number | null;
}

interface Props {
  stockId: number;
}

function formatNum(n: number | null | undefined, digits = 1, suffix = ''): string {
  if (n == null || isNaN(Number(n))) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: digits })}${suffix}`;
}

function scoreColor(pct: number | null | undefined): string {
  if (pct == null) return 'text-text-secondary';
  if (pct >= 75) return 'text-emerald-400';
  if (pct >= 50) return 'text-accent';
  if (pct >= 25) return 'text-amber-400';
  return 'text-red-400';
}

function scoreLabel(pct: number | null | undefined): string {
  if (pct == null) return '—';
  if (pct >= 75) return '상위';
  if (pct >= 50) return '중상위';
  if (pct >= 25) return '중하위';
  return '하위';
}

export default function QuantAnalysis({ stockId }: Props) {
  const [factor, setFactor] = useState<QuantFactor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('quant_factors')
        .select('*')
        .eq('stock_id', stockId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setFactor(data as QuantFactor);
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

  if (!factor) {
    return (
      <div className="space-y-6">
        <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            퀀트 팩터 없음
          </h3>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            해당 종목은 퀀트 팩터 집계 대상 (시총 TOP 200) 에 포함되지 않았습니다.
          </p>
        </div>
        <DisclaimerBanner />
      </div>
    );
  }

  const radarData = [
    { axis: 'Value', score: factor.value_pct ?? 0 },
    { axis: 'Momentum', score: factor.momentum_pct ?? 0 },
    { axis: 'Quality', score: factor.quality_pct ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* 종합 점수 헤더 */}
      <div className="bg-gradient-to-r from-dark-700 to-dark-800 rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-text-secondary mb-1 flex items-center gap-2">
              <Award className="w-4 h-4" />
              종합 퀀트 스코어 (TOP {factor.universe_size} 대비)
            </p>
            <p className={`text-5xl font-bold font-mono-price ${scoreColor(factor.composite_pct)}`}>
              {formatNum(factor.composite_pct, 1)}
              <span className="text-xl text-text-secondary ml-2">/ 100</span>
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {scoreLabel(factor.composite_pct)} · 섹터 내 {formatNum(factor.sector_rank_pct, 1)}점
            </p>
          </div>
          <div className="text-xs text-text-secondary/70 text-right">
            <p>집계일 {factor.snapshot_date}</p>
            <p>가중: Value 35% · Momentum 30% · Quality 35%</p>
          </div>
        </div>
      </div>

      {/* 3개 팩터 점수 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Value', pct: factor.value_pct, icon: Target, desc: 'PER·PBR 역순위' },
          { label: 'Momentum', pct: factor.momentum_pct, icon: TrendingUp, desc: '3M·6M·12M 수익률' },
          { label: 'Quality', pct: factor.quality_pct, icon: Award, desc: 'ROE·영업이익률' },
        ].map(m => (
          <div key={m.label} className="bg-dark-700 rounded-lg p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <m.icon className="w-5 h-5 text-accent" />
              <p className="text-sm font-bold text-text-primary">{m.label}</p>
            </div>
            <p className={`text-3xl font-bold font-mono-price ${scoreColor(m.pct)}`}>
              {formatNum(m.pct, 1)}
              <span className="text-sm text-text-secondary ml-1">/ 100</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">{m.desc}</p>
            <p className={`text-xs font-bold mt-2 ${scoreColor(m.pct)}`}>
              {scoreLabel(m.pct)}
            </p>
          </div>
        ))}
      </div>

      {/* 레이더 차트 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          팩터 프로필
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#F9FAFB', fontSize: 13 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Radar name="점수" dataKey="score" stroke="#0ABAB5" fill="#0ABAB5" fillOpacity={0.3} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 원시 지표 테이블 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">원시 지표 (퍼센타일 계산 기초)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="py-2 px-3 text-left font-normal">항목</th>
                <th className="py-2 px-3 text-right font-normal">값</th>
                <th className="py-2 px-3 text-right font-normal">해석</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr><td className="py-2 px-3 text-text-primary">PER</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.per, 2, '배')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">낮을수록 저평가</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">PBR</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.pbr, 2, '배')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">낮을수록 저평가</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">ROE</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.roe, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">높을수록 수익성</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">영업이익률</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.operating_margin, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">높을수록 효율성</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">3개월 수익률</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.return_3m, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">—</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">6개월 수익률</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.return_6m, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">—</td></tr>
              <tr><td className="py-2 px-3 text-text-primary">12개월 수익률</td><td className="py-2 px-3 text-right font-mono-price">{formatNum(factor.return_12m, 2, '%')}</td><td className="py-2 px-3 text-right text-xs text-text-secondary">—</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary/70 mt-3">
          퍼센타일은 시총 TOP {factor.universe_size} 종목 간 상대 순위. 절대 평가 아님.
        </p>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
