'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils/format';
import type { InsiderTrade } from '@/types/stock';

interface InsiderTabProps {
  stockId: number;
}

export default function InsiderTab({ stockId }: InsiderTabProps) {
  const [trades, setTrades] = useState<InsiderTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('insider_trades')
        .select('*')
        .eq('stock_id', stockId)
        .order('trade_date', { ascending: false })
        .limit(50);

      setTrades((data as InsiderTrade[]) ?? []);
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

  if (trades.length === 0) {
    return (
      <div className="text-center text-text-secondary py-20">
        내부자 거래 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-dark-700 rounded-lg border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary text-left">
            <th className="p-3">일자</th>
            <th className="p-3">성명</th>
            <th className="p-3">직위</th>
            <th className="p-3">구분</th>
            <th className="p-3 text-right">수량</th>
            <th className="p-3 text-right">단가</th>
            <th className="p-3 text-right">거래금액</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const isBuy = t.trade_type === 'buy';
            return (
              <tr key={t.id} className="border-b border-border/50 hover:bg-dark-800/50">
                <td className="p-3 text-text-primary font-mono-price">{formatDate(t.trade_date)}</td>
                <td className="p-3 text-text-primary">{t.insider_name}</td>
                <td className="p-3 text-text-secondary">{t.position ?? '-'}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                      isBuy
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {isBuy ? '매수' : '매도'}
                  </span>
                </td>
                <td className="p-3 text-right font-mono-price text-text-primary">
                  {formatNumber(t.shares)}
                </td>
                <td className="p-3 text-right font-mono-price text-text-primary">
                  {formatCurrency(t.price)}
                </td>
                <td className="p-3 text-right font-mono-price text-text-primary">
                  {formatCurrency(t.total_amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
