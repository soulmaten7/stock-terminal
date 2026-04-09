'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SupplyItem {
  stock_name: string;
  symbol: string;
  net_amount: number;
}

export default function SupplyDemandSummary() {
  const [foreignTop, setForeignTop] = useState<SupplyItem[]>([]);
  const [institutionTop, setInstitutionTop] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('supply_demand')
        .select('*, stocks(symbol, name_ko)')
        .eq('trade_date', today)
        .order('foreign_net', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const items = data.map((d: Record<string, unknown>) => ({
          stock_name: (d.stocks as { name_ko?: string })?.name_ko || (d.stocks as { symbol?: string })?.symbol || '-',
          symbol: (d.stocks as { symbol?: string })?.symbol || '',
          net_foreign: d.foreign_net as number,
          net_institution: d.institution_net as number,
        }));

        setForeignTop(
          [...items].sort((a, b) => (b.net_foreign || 0) - (a.net_foreign || 0)).slice(0, 3).map((i) => ({
            stock_name: i.stock_name,
            symbol: i.symbol,
            net_amount: i.net_foreign,
          }))
        );
        setInstitutionTop(
          [...items].sort((a, b) => (b.net_institution || 0) - (a.net_institution || 0)).slice(0, 3).map((i) => ({
            stock_name: i.stock_name,
            symbol: i.symbol,
            net_amount: i.net_institution,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const renderList = (title: string, icon: React.ReactNode, items: SupplyItem[]) => (
    <div className="bg-white p-5 border-[3px] border-[#0ABAB5]">
      <h3 className="font-bold flex items-center gap-2 mb-4 text-black text-base">
        {icon}
        {title}
      </h3>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          {icon}
          <p className="text-[#999999] text-sm mt-2 font-bold">수급 데이터 준비 중</p>
          <p className="text-[#999999] text-xs mt-1">장 마감 후 당일 수급 데이터가 업데이트됩니다</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-[#F0F0F0] last:border-0">
              <Link href={`/stocks/${item.symbol}`} className="text-black font-bold hover:text-[#0ABAB5]">
                <span className="text-[#0ABAB5] font-bold mr-2">{idx + 1}</span>
                {item.stock_name}
              </Link>
              <span className={`font-mono-price font-bold ${item.net_amount > 0 ? 'text-up' : 'text-down'}`}>
                {item.net_amount > 0 ? '+' : ''}{formatNumber(item.net_amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section>
      <h2 className="text-lg font-bold mb-4 text-black">오늘의 수급</h2>
      <div className="grid grid-cols-2 gap-4">
        {renderList('외국인 순매수 TOP 3', <TrendingUp className="w-4 h-4 text-up" />, foreignTop)}
        {renderList('기관 순매수 TOP 3', <TrendingUp className="w-4 h-4 text-down" />, institutionTop)}
      </div>
    </section>
  );
}
