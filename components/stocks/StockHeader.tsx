import Link from 'next/link';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import WatchlistToggle from '@/components/stocks/WatchlistToggle';
import type { Stock } from '@/types/stock';

interface Props {
  stock: Stock;
  currentPrice: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
}

export default function StockHeader({ stock, currentPrice, priceChange, priceChangePercent }: Props) {
  const isUp = (priceChange ?? 0) >= 0;
  const currency = stock.country === 'KR' ? 'KRW' : 'USD';

  return (
    <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-black">{stock.name_ko || stock.name_en}</h1>
              <span className="text-[#666666] text-sm font-mono-price">{stock.symbol}</span>
              <span className="px-2 py-0.5 text-xs rounded bg-[#F5F7FA] border border-[#E5E7EB] text-[#666666] font-bold">
                {stock.market}
              </span>
            </div>
            {stock.sector && <p className="text-[#666666] text-sm mt-1">{stock.sector}</p>}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {currentPrice != null && (
            <div className="text-right">
              <p className={`text-2xl font-bold font-mono-price ${isUp ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                {formatCurrency(currentPrice, currency)}
              </p>
              <p className={`text-sm font-mono-price font-bold ${isUp ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                {isUp ? '+' : ''}{formatCurrency(priceChange, currency)} ({formatPercent(priceChangePercent)})
              </p>
            </div>
          )}

          <WatchlistToggle symbol={stock.symbol} country={stock.country || 'KR'} />

          <Link
            href={`/stocks/${stock.symbol}/analysis`}
            className="flex items-center gap-2 px-4 py-2 bg-[#0ABAB5] text-white hover:bg-[#099b96] transition-colors text-sm font-bold rounded"
          >
            <TrendingUp className="w-4 h-4" />
            AI 분석
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
