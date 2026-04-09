'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/format';
import type { Dividend } from '@/types/stock';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DividendTabProps {
  stockId: number;
}

export default function DividendTab({ stockId }: DividendTabProps) {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('dividends')
        .select('*')
        .eq('stock_id', stockId)
        .order('fiscal_year', { ascending: true });

      setDividends((data as Dividend[]) ?? []);
      setLoading(false);
    }
    load();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (dividends.length === 0) {
    return (
      <div className="text-center text-text-secondary py-20">
        배당 데이터가 없습니다.
      </div>
    );
  }

  const latest = dividends[dividends.length - 1];

  const chartData = dividends.slice(-5).map((d) => ({
    year: String(d.fiscal_year),
    주당배당금: d.dividend_per_share ?? 0,
  }));

  const summaryCards = [
    { label: '주당 배당금', value: formatCurrency(latest.dividend_per_share) },
    { label: '배당 수익률', value: latest.dividend_yield != null ? `${latest.dividend_yield.toFixed(2)}%` : '-' },
    { label: '배당 성향', value: latest.payout_ratio != null ? `${latest.payout_ratio.toFixed(1)}%` : '-' },
    { label: '배당락일', value: latest.ex_dividend_date ? formatDate(latest.ex_dividend_date) : '-' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-dark-700 rounded-lg border border-border p-4">
            <p className="text-text-secondary text-xs mb-1">{card.label}</p>
            <p className="text-text-primary font-bold font-mono-price">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 5-Year History Chart */}
      <div className="bg-dark-700 rounded-lg border border-border p-4">
        <h3 className="text-text-primary font-semibold mb-4">최근 5년 배당금 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="year" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis tick={{ fill: '#999', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="주당배당금" fill="#34C759" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dividend History Table */}
      <div className="bg-dark-700 rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-left">
              <th className="p-3">연도</th>
              <th className="p-3 text-right">주당 배당금</th>
              <th className="p-3 text-right">배당 수익률</th>
              <th className="p-3 text-right">배당 성향</th>
              <th className="p-3">배당락일</th>
              <th className="p-3">지급일</th>
            </tr>
          </thead>
          <tbody>
            {[...dividends].reverse().map((d) => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-dark-800/50">
                <td className="p-3 text-text-primary font-mono-price">{d.fiscal_year}</td>
                <td className="p-3 text-right font-mono-price text-text-primary">
                  {formatCurrency(d.dividend_per_share)}
                </td>
                <td className="p-3 text-right font-mono-price text-text-primary">
                  {d.dividend_yield != null ? `${d.dividend_yield.toFixed(2)}%` : '-'}
                </td>
                <td className="p-3 text-right font-mono-price text-text-primary">
                  {d.payout_ratio != null ? `${d.payout_ratio.toFixed(1)}%` : '-'}
                </td>
                <td className="p-3 text-text-secondary">
                  {d.ex_dividend_date ? formatDate(d.ex_dividend_date) : '-'}
                </td>
                <td className="p-3 text-text-secondary">
                  {d.payment_date ? formatDate(d.payment_date) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
