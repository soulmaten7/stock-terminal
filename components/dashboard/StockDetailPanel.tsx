'use client';

import { useState, useEffect } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
import SnapshotHeader from './SnapshotHeader';
import DetailTabs, { type DetailTab } from './DetailTabs';
import OverviewTab from './tabs/OverviewTab';
import NewsTab from './tabs/NewsTab';
import DisclosuresTab from './tabs/DisclosuresTab';
import FinancialsTab from './tabs/FinancialsTab';

export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;
  per: number;
  pbr: number;
  high52w: number;
  low52w: number;
}


export default function StockDetailPanel() {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const selectedCode = useSelectedSymbolStore((s) => s.selected?.code);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    setActiveTab('overview');
  }, [selectedCode]);

  useEffect(() => {
    if (!selectedCode) { setPriceData(null); return; }
    setPriceLoading(true);
    fetch(`/api/kis/price?symbol=${selectedCode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setPriceData(d); setPriceLoading(false); })
      .catch(() => { setPriceData(null); setPriceLoading(false); });
  }, [selectedCode]);

  return (
    <aside className="flex flex-col h-full bg-white border-l border-[#E5E7EB] min-w-0">
      <SnapshotHeader priceData={priceData} loading={priceLoading} />
      <DetailTabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto px-4">
        {activeTab === 'overview'    && <OverviewTab priceData={priceData} onNavigateTab={setActiveTab} />}
        {activeTab === 'news'        && <NewsTab />}
        {activeTab === 'disclosures' && <DisclosuresTab />}
        {activeTab === 'financials'  && <FinancialsTab />}
      </div>
    </aside>
  );
}
