'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatCurrency, formatPercent, formatDate } from '@/lib/utils/format';
import type { Financial, AIAnalysis } from '@/types/stock';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Sparkles } from 'lucide-react';

interface FinancialsTabProps {
  stockId: number;
}

export default function FinancialsTab({ stockId }: FinancialsTabProps) {
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [periodType, setPeriodType] = useState<'annual' | 'quarterly'>('annual');
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const { data } = await supabase
        .from('financials')
        .select('*')
        .eq('stock_id', stockId)
        .eq('period_type', periodType)
        .order('period_date', { ascending: true });

      setFinancials((data as Financial[]) ?? []);
      setLoading(false);
    }
    load();
  }, [stockId, periodType]);

  useEffect(() => {
    async function loadAI() {
      const supabase = createClient();
      const { data } = await supabase
        .from('ai_analysis')
        .select('content_ko')
        .eq('stock_id', stockId)
        .eq('analysis_type', 'value')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setAiSummary((data as AIAnalysis).content_ko);
      }
    }
    loadAI();
  }, [stockId]);

  const latest = financials.length > 0 ? financials[financials.length - 1] : null;

  const chartData = financials.map((f) => ({
    period: formatDate(f.period_date),
    매출액: f.revenue ? f.revenue / 100_000_000 : 0,
    영업이익: f.operating_income ? f.operating_income / 100_000_000 : 0,
    순이익: f.net_income ? f.net_income / 100_000_000 : 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (financials.length === 0) {
    return (
      <div className="text-center text-[#666666] py-20">
        재무제표 데이터가 없습니다.
      </div>
    );
  }

  const summaryCards = [
    { label: '매출액', value: formatCurrency(latest?.revenue), sub: null },
    { label: '영업이익', value: formatCurrency(latest?.operating_income), sub: latest?.operating_margin != null ? `마진 ${formatPercent(latest.operating_margin)}` : null },
    { label: '순이익', value: formatCurrency(latest?.net_income), sub: latest?.net_margin != null ? `마진 ${formatPercent(latest.net_margin)}` : null },
    { label: 'ROE', value: latest?.roe != null ? `${latest.roe.toFixed(2)}%` : '-', sub: null },
    { label: 'PER', value: latest?.per != null ? `${latest.per.toFixed(2)}` : '-', sub: null },
    { label: 'PBR', value: latest?.pbr != null ? `${latest.pbr.toFixed(2)}` : '-', sub: null },
    { label: '부채비율', value: latest?.debt_ratio != null ? `${latest.debt_ratio.toFixed(1)}%` : '-', sub: null },
  ];

  return (
    <div className="space-y-6">
      {/* Period Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriodType('annual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            periodType === 'annual'
              ? 'bg-[#0ABAB5] text-white'
              : 'bg-[#F5F7FA] text-[#666666] hover:text-black'
          }`}
        >
          연간
        </button>
        <button
          onClick={() => setPeriodType('quarterly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            periodType === 'quarterly'
              ? 'bg-[#0ABAB5] text-white'
              : 'bg-[#F5F7FA] text-[#666666] hover:text-black'
          }`}
        >
          분기별
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <p className="text-[#666666] text-xs mb-1">{card.label}</p>
            <p className="text-black font-bold font-mono-price text-sm">{card.value}</p>
            {card.sub && <p className="text-[#666666] text-xs mt-1">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
        <h3 className="text-black font-semibold mb-4">매출/영업이익/순이익 추이 (억원)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="period" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis tick={{ fill: '#999', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Bar dataKey="매출액" fill="#0ABAB5" radius={[2, 2, 0, 0]} />
            <Bar dataKey="영업이익" fill="#34C759" radius={[2, 2, 0, 0]} />
            <Bar dataKey="순이익" fill="#FF9500" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[#666666] text-left">
              <th className="p-3">기간</th>
              <th className="p-3 text-right">매출액</th>
              <th className="p-3 text-right">영업이익</th>
              <th className="p-3 text-right">순이익</th>
              <th className="p-3 text-right">EPS</th>
              <th className="p-3 text-right">ROE</th>
              <th className="p-3 text-right">PER</th>
              <th className="p-3 text-right">PBR</th>
              <th className="p-3 text-right">부채비율</th>
            </tr>
          </thead>
          <tbody>
            {financials.map((f) => (
              <tr key={f.id} className="border-b border-[#E5E7EB] hover:bg-[#F5F7FA]">
                <td className="p-3 text-black">{formatDate(f.period_date)}</td>
                <td className="p-3 text-right font-mono-price">{formatNumber(f.revenue)}</td>
                <td className="p-3 text-right font-mono-price">{formatNumber(f.operating_income)}</td>
                <td className="p-3 text-right font-mono-price">{formatNumber(f.net_income)}</td>
                <td className="p-3 text-right font-mono-price">{formatNumber(f.eps)}</td>
                <td className="p-3 text-right font-mono-price">{f.roe != null ? `${f.roe.toFixed(2)}%` : '-'}</td>
                <td className="p-3 text-right font-mono-price">{f.per != null ? f.per.toFixed(2) : '-'}</td>
                <td className="p-3 text-right font-mono-price">{f.pbr != null ? f.pbr.toFixed(2) : '-'}</td>
                <td className="p-3 text-right font-mono-price">{f.debt_ratio != null ? `${f.debt_ratio.toFixed(1)}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-premium" />
            <h3 className="text-premium font-semibold text-sm">AI 가치 분석</h3>
          </div>
          <p className="text-[#666666] text-sm leading-relaxed whitespace-pre-line">{aiSummary}</p>
        </div>
      )}
    </div>
  );
}
