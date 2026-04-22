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

// DB id가 필요한 탭 (stock.id === null이면 disabled)
const DB_REQUIRED_TABS: StockTabKey[] = ['financials', 'earnings', 'news', 'flow'];

interface Props {
  stock: Stock;
}

export default function StockDetailTabs({ stock }: Props) {
  const params = useSearchParams();
  const raw = params.get('tab');
  const active: StockTabKey = (STOCK_TABS.find((t) => t.key === raw)?.key ?? DEFAULT_STOCK_TAB) as StockTabKey;
  const isDbMissing = stock.id === null;

  function renderTab() {
    // DB 필요 탭인데 id 없으면 안내 UI
    if (isDbMissing && DB_REQUIRED_TABS.includes(active)) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-black font-bold mb-2">이 탭은 확장 데이터 연결 후 이용 가능합니다</p>
          <p className="text-sm text-[#666]">
            종목 기본 정보는 KIS API 실시간 조회 중 (차트 · 호가 · 비교 탭은 정상 작동)
          </p>
        </div>
      );
    }

    switch (active) {
      case 'overview':
        return <OverviewTab stock={stock} />;
      case 'chart':
        return <ChartTab symbol={stock.symbol} market={stock.market} country={stock.country} />;
      case 'orderbook':
        return <OrderbookTab symbol={stock.symbol} country={stock.country || 'KR'} />;
      case 'financials':
        return <FinancialsTab stockId={stock.id!} />;
      case 'earnings':
        return <EarningsTab stockId={stock.id!} symbol={stock.symbol} />;
      case 'news':
        return <NewsDisclosureTab stockId={stock.id!} symbol={stock.symbol} />;
      case 'flow':
        return <SupplyDemandTab stockId={stock.id!} />;
      case 'compare':
        return <CompareTab stock={stock} />;
      default:
        return null;
    }
  }

  return (
    <>
      <div className="border-b border-[#E5E7EB] bg-white px-6 overflow-x-auto sticky top-0 z-[5]">
        <div className="max-w-7xl mx-auto flex gap-1">
          {STOCK_TABS.map((tab) => {
            const href = `?tab=${tab.key}`;
            const isActive = active === tab.key;
            const isDisabled = isDbMissing && DB_REQUIRED_TABS.includes(tab.key as StockTabKey);
            return (
              <Link
                key={tab.key}
                href={href}
                scroll={false}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0ABAB5] text-[#0ABAB5]'
                    : isDisabled
                    ? 'border-transparent text-[#BBB]'
                    : 'border-transparent text-[#666666] hover:text-black'
                }`}
                title={isDisabled ? '확장 데이터 연결 후 사용 가능' : undefined}
              >
                {tab.label}
                {isDisabled && <span className="ml-1 text-[10px]">🔒</span>}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 bg-white min-h-[60vh]">
        {renderTab()}
      </div>
    </>
  );
}
