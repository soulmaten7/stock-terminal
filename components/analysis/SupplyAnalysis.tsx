'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils/format';
import type { SupplyDemand, AIAnalysis } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Users, Building2, Globe, Brain, AlertTriangle } from 'lucide-react';

interface Props {
  stockId: number;
}

// Placeholder supply data (20 trading days)
function generatePlaceholderSupply(stockId: number): SupplyDemand[] {
  const data: SupplyDemand[] = [];
  let foreignCum = 0;
  let instCum = 0;
  const baseDate = new Date('2026-03-05');

  for (let i = 0; i < 20; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const foreignNet = Math.round((Math.random() - 0.4) * 50000);
    const instNet = Math.round((Math.random() - 0.45) * 30000);
    const individualNet = -(foreignNet + instNet);
    foreignCum += foreignNet;
    instCum += instNet;

    data.push({
      id: i + 1,
      stock_id: stockId,
      trade_date: date.toISOString().split('T')[0],
      foreign_net: foreignNet,
      institution_net: instNet,
      individual_net: individualNet,
      foreign_cumulative: foreignCum,
      program_net: Math.round((Math.random() - 0.5) * 10000),
      created_at: new Date().toISOString(),
    });
  }
  return data;
}

type IntensityLevel = '강한 매수' | '약한 매수' | '중립' | '약한 매도' | '강한 매도';

function getIntensity(cumulative: number, avgVolume: number): IntensityLevel {
  if (avgVolume === 0) return '중립';
  const ratio = cumulative / avgVolume;
  if (ratio > 0.5) return '강한 매수';
  if (ratio > 0.1) return '약한 매수';
  if (ratio < -0.5) return '강한 매도';
  if (ratio < -0.1) return '약한 매도';
  return '중립';
}

function getIntensityColor(level: IntensityLevel): string {
  switch (level) {
    case '강한 매수': return 'text-up bg-up/10';
    case '약한 매수': return 'text-up/70 bg-up/5';
    case '중립': return 'text-text-secondary bg-dark-800';
    case '약한 매도': return 'text-down/70 bg-down/5';
    case '강한 매도': return 'text-down bg-down/10';
  }
}

export default function SupplyAnalysis({ stockId }: Props) {
  const [supplyData, setSupplyData] = useState<SupplyDemand[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingPlaceholder, setUsingPlaceholder] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [sdRes, aiRes] = await Promise.all([
        supabase
          .from('supply_demand')
          .select('*')
          .eq('stock_id', stockId)
          .order('trade_date', { ascending: true })
          .limit(20),
        supabase
          .from('ai_analyses')
          .select('*')
          .eq('stock_id', stockId)
          .eq('analysis_type', 'supply')
          .order('generated_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (sdRes.data && sdRes.data.length > 0) {
        setSupplyData(sdRes.data as SupplyDemand[]);
      } else {
        setSupplyData(generatePlaceholderSupply(stockId));
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

  // Cumulative data for chart
  let foreignCum = 0;
  let instCum = 0;
  const cumulativeChartData = supplyData.map((d) => {
    foreignCum += d.foreign_net ?? 0;
    instCum += d.institution_net ?? 0;
    return {
      date: d.trade_date.slice(5), // MM-DD
      foreign: foreignCum,
      institution: instCum,
    };
  });

  // Use actual cumulative from data if available
  const latestEntry = supplyData[supplyData.length - 1];
  const totalForeignCum = foreignCum;
  const totalInstCum = instCum;

  // Average daily volume (approximate from net trades)
  const avgAbsVolume =
    supplyData.reduce((sum, d) => sum + Math.abs(d.foreign_net ?? 0) + Math.abs(d.institution_net ?? 0), 0) /
    Math.max(supplyData.length, 1);

  // Intensity labels
  const foreignIntensity = getIntensity(totalForeignCum, avgAbsVolume * 10);
  const instIntensity = getIntensity(totalInstCum, avgAbsVolume * 10);

  // Volume anomaly: today's total vs 20-day average
  const todayVolume = latestEntry
    ? Math.abs(latestEntry.foreign_net ?? 0) + Math.abs(latestEntry.institution_net ?? 0) + Math.abs(latestEntry.individual_net ?? 0)
    : 0;
  const avgDailyVolume =
    supplyData.reduce(
      (sum, d) => sum + Math.abs(d.foreign_net ?? 0) + Math.abs(d.institution_net ?? 0) + Math.abs(d.individual_net ?? 0),
      0
    ) / Math.max(supplyData.length, 1);
  const volumeRatio = avgDailyVolume > 0 ? todayVolume / avgDailyVolume : 1;
  const isVolumeAnomaly = volumeRatio > 2;

  // Program trading
  const totalProgramNet = supplyData.reduce((sum, d) => sum + (d.program_net ?? 0), 0);
  const programRatio = avgAbsVolume > 0 ? (Math.abs(totalProgramNet) / (avgAbsVolume * supplyData.length)) * 100 : 0;

  return (
    <div className="space-y-6">
      {usingPlaceholder && (
        <div className="bg-dark-800 border border-border rounded-lg p-3 text-xs text-text-secondary/60">
          * 실제 수급 데이터가 없어 예시 데이터를 표시합니다.
        </div>
      )}

      {/* Top summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-dark-700 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-accent" />
            <p className="text-xs text-text-secondary">외국인 20일 누적</p>
          </div>
          <p className={`text-xl font-bold font-mono-price ${totalForeignCum >= 0 ? 'text-up' : 'text-down'}`}>
            {totalForeignCum >= 0 ? '+' : ''}{formatNumber(totalForeignCum)}
          </p>
          <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs rounded font-bold ${getIntensityColor(foreignIntensity)}`}>
            {foreignIntensity}
          </span>
        </div>
        <div className="bg-dark-700 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-accent" />
            <p className="text-xs text-text-secondary">기관 20일 누적</p>
          </div>
          <p className={`text-xl font-bold font-mono-price ${totalInstCum >= 0 ? 'text-up' : 'text-down'}`}>
            {totalInstCum >= 0 ? '+' : ''}{formatNumber(totalInstCum)}
          </p>
          <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs rounded font-bold ${getIntensityColor(instIntensity)}`}>
            {instIntensity}
          </span>
        </div>
        <div className="bg-dark-700 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-text-secondary" />
            <p className="text-xs text-text-secondary">거래량 이상</p>
          </div>
          <p className="text-xl font-bold font-mono-price">
            {volumeRatio.toFixed(1)}x
          </p>
          <p className="text-xs text-text-secondary mt-1">20일 평균 대비</p>
          {isVolumeAnomaly && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-xs rounded font-bold bg-premium/10 text-premium">
              <AlertTriangle className="w-3 h-3" /> 이상 감지
            </span>
          )}
        </div>
        <div className="bg-dark-700 rounded-lg p-4 border border-border">
          <p className="text-xs text-text-secondary mb-2">프로그램 매매 비중</p>
          <p className="text-xl font-bold font-mono-price">{programRatio.toFixed(1)}%</p>
          <p className={`text-xs mt-1 ${totalProgramNet >= 0 ? 'text-up' : 'text-down'}`}>
            순{totalProgramNet >= 0 ? '매수' : '매도'} {formatNumber(Math.abs(totalProgramNet))}주
          </p>
        </div>
      </div>

      {/* 20-day cumulative chart */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">외국인/기관 20일 누적 매매 추이</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeChartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} width={70} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value: unknown, name: unknown) => [
                  formatNumber(Number(value)) + '주',
                  String(name) === 'foreign' ? '외국인' : '기관',
                ]}
              />
              <ReferenceLine y={0} stroke="#4B5563" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="foreign"
                name="foreign"
                stroke="#FF3B30"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="institution"
                name="institution"
                stroke="#0ABAB5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-up rounded" />
            <span className="text-text-secondary">외국인</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-down rounded" />
            <span className="text-text-secondary">기관</span>
          </div>
        </div>
      </div>

      {/* Daily breakdown table */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">일별 수급 현황 (최근 10일)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-xs border-b border-border">
                <th className="text-left py-2 px-3">일자</th>
                <th className="text-right py-2 px-3">외국인</th>
                <th className="text-right py-2 px-3">기관</th>
                <th className="text-right py-2 px-3">개인</th>
                <th className="text-right py-2 px-3">프로그램</th>
              </tr>
            </thead>
            <tbody>
              {supplyData.slice(-10).reverse().map((d) => (
                <tr key={d.trade_date} className="border-b border-border/50 hover:bg-dark-800/50">
                  <td className="py-2 px-3 font-mono-price text-xs">{d.trade_date.slice(5)}</td>
                  <td className={`py-2 px-3 text-right font-mono-price ${(d.foreign_net ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                    {(d.foreign_net ?? 0) >= 0 ? '+' : ''}{formatNumber(d.foreign_net)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono-price ${(d.institution_net ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                    {(d.institution_net ?? 0) >= 0 ? '+' : ''}{formatNumber(d.institution_net)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono-price ${(d.individual_net ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                    {(d.individual_net ?? 0) >= 0 ? '+' : ''}{formatNumber(d.individual_net)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono-price ${(d.program_net ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                    {(d.program_net ?? 0) >= 0 ? '+' : ''}{formatNumber(d.program_net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-premium" />
          AI 수급분석 요약
        </h3>
        {aiAnalysis ? (
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {aiAnalysis.content_ko}
          </div>
        ) : (
          <div className="bg-dark-800 rounded-lg p-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              최근 20거래일 기준 외국인은 {totalForeignCum >= 0 ? '순매수' : '순매도'}{' '}
              {formatNumber(Math.abs(totalForeignCum))}주로 {foreignIntensity} 패턴을 보이고 있으며,
              기관은 {totalInstCum >= 0 ? '순매수' : '순매도'}{' '}
              {formatNumber(Math.abs(totalInstCum))}주로 {instIntensity} 패턴입니다.
              {isVolumeAnomaly && ' 금일 거래량이 20일 평균 대비 비정상적으로 높아 주의가 필요합니다.'}
              {' '}프로그램 매매 비중은 {programRatio.toFixed(1)}%입니다.
            </p>
            <p className="text-xs text-text-secondary/50 mt-2">* AI 분석이 아직 생성되지 않아 자동 요약을 표시합니다.</p>
          </div>
        )}
      </div>

      <DisclaimerBanner />
    </div>
  );
}
