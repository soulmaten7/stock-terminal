'use client';

import { useState, useEffect } from 'react';
import SectorHeatmap from './SectorHeatmap';
import ThemeGroups from './ThemeGroups';
import MarketFlow from './MarketFlow';
import EconomicDashboard from './EconomicDashboard';

export default function AnalysisClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">시장 분석</h1>
        <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-32 bg-[#F0F0F0] animate-pulse" />))}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-8">시장 분석</h1>
      <SectorHeatmap />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <ThemeGroups />
        <MarketFlow />
      </div>
      <div className="mt-8">
        <EconomicDashboard />
      </div>
    </div>
  );
}
