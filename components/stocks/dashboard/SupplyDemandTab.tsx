'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatDate } from '@/lib/utils/format';
import type { SupplyDemand } from '@/types/stock';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SupplyDemandTabProps {
  stockId: number;
}

export default function SupplyDemandTab({ stockId }: SupplyDemandTabProps) {
  const [data, setData] = useState<SupplyDemand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: result } = await supabase
        .from('supply_demand')
        .select('*')
        .eq('stock_id', stockId)
        .order('trade_date', { ascending: true })
        .limit(20);

      setData((result as SupplyDemand[]) ?? []);
      setLoading(false);
    }
    load();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-[#666666] py-20">
        수급 데이터가 없습니다.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatDate(d.trade_date),
    외국인: d.foreign_net,
    기관: d.institution_net,
    개인: d.individual_net,
  }));

  const cumulativeChartData = data.map((d) => ({
    date: formatDate(d.trade_date),
    외국인누적: d.foreign_cumulative,
  }));

  // Calculate consecutive foreign buying days
  let consecutiveDays = 0;
  let isBuying = false;
  for (let i = data.length - 1; i >= 0; i--) {
    const net = data[i].foreign_net ?? 0;
    if (i === data.length - 1) {
      isBuying = net > 0;
      if (net === 0) break;
      consecutiveDays = 1;
    } else {
      if ((isBuying && net > 0) || (!isBuying && net < 0)) {
        consecutiveDays++;
      } else {
        break;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Consecutive Days Badge */}
      {consecutiveDays > 0 && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
          isBuying
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {isBuying ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-sm font-medium">
            외국인 {consecutiveDays}일 연속 {isBuying ? '순매수' : '순매도'}
          </span>
        </div>
      )}

      {/* Net Trading Chart */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
        <h3 className="text-black font-semibold mb-4">투자자별 순매수 추이</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis tick={{ fill: '#999', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line type="monotone" dataKey="외국인" stroke="#FF3B30" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="기관" stroke="#0ABAB5" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="개인" stroke="#34C759" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Foreign Chart */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] p-4">
        <h3 className="text-black font-semibold mb-4">외국인 누적 순매수</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={cumulativeChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 12 }} />
            <YAxis tick={{ fill: '#999', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              labelStyle={{ color: '#000' }}
            />
            <Line type="monotone" dataKey="외국인누적" stroke="#FF9500" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div className="bg-dark-700 rounded-lg border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[#666666] text-left">
              <th className="p-3">일자</th>
              <th className="p-3 text-right">외국인</th>
              <th className="p-3 text-right">기관</th>
              <th className="p-3 text-right">개인</th>
              <th className="p-3 text-right">외국인 누적</th>
              <th className="p-3 text-right">프로그램</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((d) => (
              <tr key={d.id} className="border-b border-[#E5E7EB] hover:bg-[#F5F7FA]">
                <td className="p-3 text-black">{formatDate(d.trade_date)}</td>
                <td className={`p-3 text-right font-mono-price ${(d.foreign_net ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                  {formatNumber(d.foreign_net)}
                </td>
                <td className={`p-3 text-right font-mono-price ${(d.institution_net ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                  {formatNumber(d.institution_net)}
                </td>
                <td className={`p-3 text-right font-mono-price ${(d.individual_net ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                  {formatNumber(d.individual_net)}
                </td>
                <td className="p-3 text-right font-mono-price text-black">
                  {formatNumber(d.foreign_cumulative)}
                </td>
                <td className="p-3 text-right font-mono-price text-[#666666]">
                  {formatNumber(d.program_net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
