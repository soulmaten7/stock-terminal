'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatMarketCap, formatPercent } from '@/lib/utils/format';
import type { Stock } from '@/types/stock';

interface SectorTabProps {
  stockId: number;
  sector: string;
}

interface SectorStock extends Stock {
  per?: number | null;
  change_percent?: number | null;
}

export default function SectorTab({ stockId, sector }: SectorTabProps) {
  const [stocks, setStocks] = useState<SectorStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!sector) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('stocks')
        .select('*')
        .eq('sector', sector)
        .eq('is_active', true)
        .order('market_cap', { ascending: false });

      const results = (data as SectorStock[]) ?? [];
      setStocks(results);

      const idx = results.findIndex((s) => s.id === stockId);
      if (idx >= 0) setRank(idx + 1);

      setLoading(false);
    }
    load();
  }, [stockId, sector]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="text-center text-text-secondary py-20">
        섹터 정보가 없습니다.
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center text-text-secondary py-20">
        같은 섹터의 종목이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sector Position */}
      {rank != null && (
        <div className="bg-dark-700 rounded-lg border border-border p-4">
          <p className="text-text-primary text-sm">
            <span className="text-accent font-semibold">{sector}</span> 섹터 -{' '}
            시가총액 기준 섹터 내{' '}
            <span className="text-accent font-bold font-mono-price">{rank}위</span> /{' '}
            <span className="font-mono-price">{stocks.length}개</span> 중
          </p>
        </div>
      )}

      {/* Sector Stocks Table */}
      <div className="bg-dark-700 rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-left">
              <th className="p-3 w-8">#</th>
              <th className="p-3">종목명</th>
              <th className="p-3">코드</th>
              <th className="p-3 text-right">시가총액</th>
              <th className="p-3 text-right">PER</th>
              <th className="p-3 text-right">등락률</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s, i) => {
              const isCurrentStock = s.id === stockId;
              return (
                <tr
                  key={s.id}
                  className={`border-b border-border/50 transition-colors ${
                    isCurrentStock
                      ? 'bg-accent/10 border-l-2 border-l-accent'
                      : 'hover:bg-dark-800/50'
                  }`}
                >
                  <td className="p-3 text-text-secondary font-mono-price">{i + 1}</td>
                  <td className="p-3">
                    <Link
                      href={`/stocks/${s.symbol}`}
                      className={`hover:text-accent transition-colors ${
                        isCurrentStock ? 'text-accent font-semibold' : 'text-text-primary'
                      }`}
                    >
                      {s.name_ko || s.name_en}
                    </Link>
                  </td>
                  <td className="p-3 text-text-secondary font-mono-price">{s.symbol}</td>
                  <td className="p-3 text-right font-mono-price text-text-primary">
                    {formatMarketCap(s.market_cap)}
                  </td>
                  <td className="p-3 text-right font-mono-price text-text-primary">
                    {s.per != null ? s.per.toFixed(2) : '-'}
                  </td>
                  <td className={`p-3 text-right font-mono-price ${
                    (s.change_percent ?? 0) >= 0 ? 'text-up' : 'text-down'
                  }`}>
                    {s.change_percent != null ? formatPercent(s.change_percent) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
