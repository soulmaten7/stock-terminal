'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupplyDemand } from '@/types/stock';
import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, ReferenceLine,
} from 'recharts';
import { Users, TrendingUp, BarChart3 } from 'lucide-react';

interface Props {
  stockId: number;
}

function formatAmount(n: number | null | undefined): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('ko-KR');
}

function formatSignedShares(n: number | null | undefined): string {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('ko-KR')}`;
}

function netColor(n: number | null | undefined): string {
  if (n == null || n === 0) return 'text-text-secondary';
  return n > 0 ? 'text-red-400' : 'text-blue-400';
}

export default function SupplyAnalysis({ stockId }: Props) {
  const [rows, setRows] = useState<SupplyDemand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('supply_demand')
        .select('*')
        .eq('stock_id', stockId)
        .order('trade_date', { ascending: true })
        .limit(90);
      if (data) setRows(data as SupplyDemand[]);
      setLoading(false);
    }
    load();
  }, [stockId]);

  const chartData = useMemo(() => {
    if (rows.length === 0) return [];
    let cumF = 0, cumI = 0, cumP = 0;
    return rows.map(r => {
      cumF += r.foreign_net ?? 0;
      cumI += r.institution_net ?? 0;
      cumP += r.individual_net ?? 0;
      return {
        date: r.trade_date,
        foreign: r.foreign_net,
        institution: r.institution_net,
        individual: r.individual_net,
        cumForeign: cumF,
        cumInstitution: cumI,
        cumIndividual: cumP,
      };
    });
  }, [rows]);

  const summary = useMemo(() => {
    if (rows.length === 0) return null;
    const sum = rows.reduce(
      (acc, r) => ({
        foreign: acc.foreign + (r.foreign_net ?? 0),
        institution: acc.institution + (r.institution_net ?? 0),
        individual: acc.individual + (r.individual_net ?? 0),
      }),
      { foreign: 0, institution: 0, individual: 0 }
    );
    return { ...sum, days: rows.length };
  }, [rows]);

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
          <Users className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-bold text-text-primary mb-2">
            수급 분석 — 데이터 부족
          </h3>
          <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed">
            해당 종목은 아직 투자자별 매매동향 수집 대상에 포함되지 않았습니다. 시총 TOP 100 + 관심종목 우선 커버 중 — 확장 예정.
          </p>
        </div>
        <DisclaimerBanner />
      </div>
    );
  }

  const recent5 = [...rows].slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* 합계 카드 */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          투자자별 합계 (최근 {summary?.days}영업일, 단위: 주)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '외국인', value: summary?.foreign ?? 0, color: '#0ABAB5' },
            { label: '기관', value: summary?.institution ?? 0, color: '#F59E0B' },
            { label: '개인', value: summary?.individual ?? 0, color: '#8B5CF6' },
          ].map(m => (
            <div key={m.label} className="bg-dark-700 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <p className="text-xs text-text-secondary">{m.label} 순매수 합계</p>
              </div>
              <p className={`text-2xl font-bold font-mono-price ${netColor(m.value)}`}>
                {formatSignedShares(m.value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 일별 순매수 스택 바차트 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          일별 순매수 (단위: 주)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={40} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={formatAmount} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value) => value != null ? Number(value).toLocaleString('ko-KR') : '—'}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#6B7280" />
              <Bar dataKey="foreign" name="외국인" fill="#0ABAB5" stackId="stack" />
              <Bar dataKey="institution" name="기관" fill="#F59E0B" stackId="stack" />
              <Bar dataKey="individual" name="개인" fill="#8B5CF6" stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 누적 순매수 라인차트 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          누적 순매수 추이 (단위: 주)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={40} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={formatAmount} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#F9FAFB' }}
                formatter={(value) => value != null ? Number(value).toLocaleString('ko-KR') : '—'}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#6B7280" />
              <Line type="monotone" dataKey="cumForeign" name="외국인 누적" stroke="#0ABAB5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cumInstitution" name="기관 누적" stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cumIndividual" name="개인 누적" stroke="#8B5CF6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 최근 5일 요약 테이블 */}
      <div className="bg-dark-700 rounded-lg p-5 border border-border">
        <h3 className="text-base font-bold mb-4">최근 5영업일 순매수 (단위: 주)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="py-2 px-3 text-left font-normal">거래일</th>
                <th className="py-2 px-3 text-right font-normal">외국인</th>
                <th className="py-2 px-3 text-right font-normal">기관</th>
                <th className="py-2 px-3 text-right font-normal">개인</th>
              </tr>
            </thead>
            <tbody>
              {recent5.map(r => (
                <tr key={r.trade_date} className="border-b border-border/50">
                  <td className="py-2 px-3 text-text-primary">{r.trade_date}</td>
                  <td className={`py-2 px-3 text-right font-mono-price ${netColor(r.foreign_net)}`}>
                    {formatSignedShares(r.foreign_net)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono-price ${netColor(r.institution_net)}`}>
                    {formatSignedShares(r.institution_net)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono-price ${netColor(r.individual_net)}`}>
                    {formatSignedShares(r.individual_net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary/70 mt-3">
          양수(빨강) = 순매수, 음수(파랑) = 순매도. 출처: KIS 투자자별 매매동향
        </p>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
