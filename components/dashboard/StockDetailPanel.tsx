'use client';

import { useState } from 'react';
import SnapshotHeader from './SnapshotHeader';
import DetailTabs, { type DetailTab } from './DetailTabs';
import OverviewTab from './tabs/OverviewTab';

const TAB_LABEL: Record<DetailTab, string> = {
  overview:    '종합',
  news:        '뉴스',
  disclosures: '공시',
  financials:  '재무',
};

export default function StockDetailPanel() {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  return (
    <aside className="flex flex-col h-full bg-white border-l border-[#E5E7EB] min-w-0">
      <SnapshotHeader />
      <DetailTabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto px-4">
        {activeTab === 'overview' ? (
          <OverviewTab onNavigateTab={setActiveTab} />
        ) : (
          <div className="text-center py-8 text-xs text-[#999]">
            Coming soon — {TAB_LABEL[activeTab]}
          </div>
        )}
      </div>
    </aside>
  );
}
