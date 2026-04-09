'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatDate, formatPercent } from '@/lib/utils/format';
import type { ShortCredit, AIAnalysis } from '@/types/stock';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Sparkles } from 'lucide-react';

interface ShortSellingTabProps {
  stockId: number;
}

export default function ShortSellingTab({ stockId }: ShortSellingTabProps) {
  const [data, setData] = useState<ShortCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: result } = await supabase
        .from('short_credit')
        .select('*')
        .eq('stock_id', stockId)
        .order('trade_date', { ascending: true })
        .limit(30);

      setData((result as ShortCredit[]) ?? []);
      setLoading(false);
    }
    load();
  }, [stockId]);

  useEffect(() => {
    async function loadAI() {
      const supabase = createClient();
      const { data } = await supabase
        .from('ai_analysis')
        .select('content_ko')
        .eq('stock_id', stockId)
        .eq('analysis_type', 'supply')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setAiSummary((data as AIAnalysis).content_ko);
      }
    }
    loadAI();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-text-secondary py-20">
        공매도/신용 데이터가 없습니다.
      </div>
    );
  }

  const shortChartData = data.map((d) => ({
    date: formatDate(d.trade_date),
    공매도잔고: d.short_balance,
    공매도비중: d.short_ratio,
  }));

  const creditChartData = data.map((d) => ({
    date: formatDate(d.trade_date),
    신용잔고: d.credit_balance,
    대차잔고: d.loan_balance,
  }));

  const latest = data[data.length - 1];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-dark-700 rounded-lg border border-border p-4">
          <p className="text-text-secondary text-xs mb-1">공매도 잔고</p>
          <p className="text-text-primary font-bold font-mono-price">{formatNumber(latest.short_balance)}</p>
        </div>
        <div className="bg-dark-700 rounded-lg border border-border p-4">
          <p className="text-text-secondary text-xs mb-1">공매도 비중</p>
          <p className="text-text-primary font-bold font-mono-price">
            {latest.short_ratio != null ? `${latest.short_ratio.toFixed(2)}%` : '-'}
          </p>
        </div>
        <div className="bg-dark-700 rounded-lg border border-border p-4">
          <p className="text-text-secondary text-xs mb-1">신용 잔고</p>
          <p className="text-text-primary font-bold font-mono-price">{formatNumber(latest.credit_balance)}</p>
        </div>
        <div className="bg-dark-700 rounded-lg border border-border p-4">
          <p className="text-text-secondary text-xs mb-1">대차 잔고</p>
          <p className="text-text-primary font-bold font-mono-price">{formatNumber(latest.loan_balance)}</p>
        </div>
      </div>

      {/* Short Balance + Ratio Chart */}
      <div className="bg-dark-700 rounded-lg border border-border p-4">
        <h3 className="text-text-primary font-semibold mb-4">공매도 잔고 / 비중 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={shortChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#999', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="공매도잔고" fill="#FF3B30" radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="공매도비중" stroke="#FF9500" strokeWidth={2} dot={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Credit Balance Chart */}
      <div className="bg-dark-700 rounded-lg border border-border p-4">
        <h3 className="text-text-primary font-semibold mb-4">신용/대차 잔고 추이</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={creditChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis tick={{ fill: '#999', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="신용잔고" stroke="#0ABAB5" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="대차잔고" stroke="#AF52DE" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="bg-dark-700 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-premium" />
            <h3 className="text-premium font-semibold text-sm">AI 수급 분석</h3>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">{aiSummary}</p>
        </div>
      )}
    </div>
  );
}
