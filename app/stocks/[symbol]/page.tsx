'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/authStore';
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/watchlist';
import type { Stock } from '@/types/stock';
import AuthGuard from '@/components/auth/AuthGuard';
import ChartTab from '@/components/stocks/dashboard/ChartTab';
import FinancialsTab from '@/components/stocks/dashboard/FinancialsTab';
import DisclosuresTab from '@/components/stocks/dashboard/DisclosuresTab';
import SupplyDemandTab from '@/components/stocks/dashboard/SupplyDemandTab';
import ShortSellingTab from '@/components/stocks/dashboard/ShortSellingTab';
import InsiderTab from '@/components/stocks/dashboard/InsiderTab';
import DividendTab from '@/components/stocks/dashboard/DividendTab';
import NewsTab from '@/components/stocks/dashboard/NewsTab';
import SectorTab from '@/components/stocks/dashboard/SectorTab';
import MacroTab from '@/components/stocks/dashboard/MacroTab';
import OrderBook from '@/components/stocks/OrderBook';
import ExecutionList from '@/components/stocks/ExecutionList';
import { TrendingUp, ExternalLink, Star } from 'lucide-react';

const TABS = [
  { key: 'chart', label: '차트' },
  { key: 'financials', label: '재무제표' },
  { key: 'disclosures', label: '공시' },
  { key: 'supply', label: '수급' },
  { key: 'short', label: '공매도/신용' },
  { key: 'insider', label: '내부자' },
  { key: 'dividend', label: '배당' },
  { key: 'news', label: '뉴스' },
  { key: 'sector', label: '섹터' },
  { key: 'macro', label: '거시경제' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('chart');
  const { user } = useAuthStore();
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    async function loadStock() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

      if (data) {
        setStock(data as Stock);
      }
      setLoading(false);
    }
    loadStock();
  }, [symbol]);

  useEffect(() => {
    if (!stock) return;
    async function loadPrice() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stock_prices')
        .select('close, change, change_percent')
        .eq('stock_id', stock!.id)
        .order('trade_date', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCurrentPrice(data.close);
        setPriceChange(data.change);
        setPriceChangePercent(data.change_percent);
      }
    }
    loadPrice();
  }, [stock]);

  useEffect(() => {
    if (!user || !symbol) return;
    isInWatchlist(user.id, symbol.toUpperCase()).then(setStarred);
  }, [user, symbol]);

  const toggleWatchlist = async () => {
    if (!user) return;
    const sym = symbol.toUpperCase();
    if (starred) {
      await removeFromWatchlist(user.id, sym);
      setStarred(false);
    } else {
      await addToWatchlist(user.id, sym, stock?.country || 'KR');
      setStarred(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-dark-900">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-dark-900 text-text-primary">
        <p className="text-xl mb-4">종목을 찾을 수 없습니다</p>
        <Link href="/stocks" className="text-accent hover:underline">
          종목 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const isUp = (priceChange ?? 0) >= 0;
  const currency = stock.country === 'KR' ? 'KRW' : 'USD';

  function renderTab() {
    switch (activeTab) {
      case 'chart':
        return (
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <ChartTab symbol={stock!.symbol} market={stock!.market} country={stock!.country} />
            </div>
            {stock!.country === 'KR' && (
              <div className="hidden lg:flex w-[280px] shrink-0 flex-col gap-3">
                <div className="h-[300px]"><OrderBook symbol={stock!.symbol} /></div>
                <div className="h-[300px]"><ExecutionList symbol={stock!.symbol} /></div>
              </div>
            )}
          </div>
        );
      case 'financials':
        return <FinancialsTab stockId={stock!.id} />;
      case 'disclosures':
        return <DisclosuresTab stockId={stock!.id} symbol={stock!.symbol} />;
      case 'supply':
        return <SupplyDemandTab stockId={stock!.id} />;
      case 'short':
        return <ShortSellingTab stockId={stock!.id} />;
      case 'insider':
        return <InsiderTab stockId={stock!.id} />;
      case 'dividend':
        return <DividendTab stockId={stock!.id} />;
      case 'news':
        return <NewsTab stockId={stock!.id} />;
      case 'sector':
        return <SectorTab stockId={stock!.id} sector={stock!.sector ?? ''} />;
      case 'macro':
        return <MacroTab />;
      default:
        return null;
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-900 text-text-primary">
        {/* Header */}
        <div className="border-b border-border bg-dark-800 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{stock.name_ko || stock.name_en}</h1>
                    <span className="text-text-secondary text-sm font-mono-price">{stock.symbol}</span>
                    <span className="px-2 py-0.5 text-xs rounded bg-dark-700 border border-border text-text-secondary">
                      {stock.market}
                    </span>
                  </div>
                  {stock.sector && (
                    <p className="text-text-secondary text-sm mt-1">{stock.sector}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                {currentPrice != null && (
                  <div className="text-right">
                    <p className={`text-2xl font-bold font-mono-price ${isUp ? 'text-up' : 'text-down'}`}>
                      {formatCurrency(currentPrice, currency)}
                    </p>
                    <p className={`text-sm font-mono-price ${isUp ? 'text-up' : 'text-down'}`}>
                      {isUp ? '+' : ''}
                      {formatCurrency(priceChange, currency)} ({formatPercent(priceChangePercent)})
                    </p>
                  </div>
                )}

                {user && (
                  <button onClick={toggleWatchlist} className={`p-2 border ${starred ? 'text-[#C9A96E] border-[#C9A96E]' : 'text-text-secondary border-border'} hover:text-[#C9A96E]`}>
                    <Star className="w-5 h-5" fill={starred ? '#C9A96E' : 'none'} />
                  </button>
                )}

                <Link
                  href={`/stocks/${symbol}/analysis`}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white hover:opacity-90 transition-opacity"
                >
                  <TrendingUp className="w-4 h-4" />
                  AI 분석
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border bg-dark-800 px-6 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {renderTab()}
        </div>
      </div>
    </AuthGuard>
  );
}
