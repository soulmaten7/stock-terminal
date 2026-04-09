'use client';

import TodayDisclosures from './TodayDisclosures';
import TodayNews from './TodayNews';
import SupplyDemandSummary from './SupplyDemandSummary';
import BannerSection from './BannerSection';

export default function RightSidebar() {
  return (
    <div className="space-y-3 overflow-y-auto">
      <TodayDisclosures />
      <TodayNews />
      <SupplyDemandSummary />
      <BannerSection />
    </div>
  );
}
