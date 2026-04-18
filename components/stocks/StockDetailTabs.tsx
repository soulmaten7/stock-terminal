'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { STOCK_TABS, DEFAULT_STOCK_TAB, type StockTabKey } from '@/lib/constants/stock-tabs';
import type { Stock } from '@/types/stock';

import OverviewTab from '@/components/stocks/tabs/OverviewTab';
import ChartTab from '@/components/stocks/dashboard/ChartTab';
import OrderbookTab from '@/components/stocks/tabs/OrderbookTab';
import FinancialsTab from '@/components/stocks/dashboard/FinancialsTab';
import EarningsTab from '@/components/stocks/tabs/EarningsTab';
import NewsDisclosureTab from '@/components/stocks/tabs/NewsDisclosureTab';
import SupplyDemandTab from '@/components/stocks/dashboard/SupplyDemandTab';
import CompareTab from '@/components/stocks/tabs/CompareTab';

interface Props {
  stock: Stock;
}

export default function StockDetailTabs({ stock }: Props) {
  const params = useSearchParams();
  const raw = params.get('tab');
  const active: StockTabKey = (STOCK_TABS.find((t) => t.key === raw)?.key ?? DEFAULT_STOCK_TAB) as StockTabKey;

  function renderTab() {
    switch (active) {
      case 'overview':
        return <OverviewTab stock={stock} />;
      case 'chart':
        return <ChartTab symbol={stock.symbol} market={stock.market} country={stock.country} />;
      case 'orderbook':
        return <OrderbookTab symbol={stock.symbol} country={stock.country || 'KR'} />;
      case 'financials':
        return <FinancialsTab stockId={stock.id} />;
      case 'earnings':
        return <EarningsTab stockId={stock.id} symbol={stock.symbol} />;
      case 'news':
        return <NewsDisclosureTab stockId={stock.id} symbol={stock.symbol} />;
      case 'flow':
        return <SupplyDemandTab stockId={stock.id} />;
      case 'compare':
        return <CompareTab stock={stock} />;
      default:
        return null;
    }
  }

  return (
    <>
      {/* Tab navigation — URL 기반 */}
      <div className="border-b border-[#E5E7EB] bg-white px-6 overflow-x-auto sticky top-0 z-[5]">
        <div className="max-w-7xl mx-auto flex gap-1">
          {STOCK_TABS.map((tab) => {
            const href = `?tab=${tab.key}`;
            const isActive = active === tab.key;
            return (
              <Link
                key={tab.key}
                href={href}
                scroll={false}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0ABAB5] text-[#0ABAB5]'
                    : 'border-transparent text-[#666666] hover:text-black'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 py-6 bg-white min-h-[60vh]">
        {renderTab()}
      </div>
    </>
  );
}
