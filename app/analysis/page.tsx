import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalysisClient from '@/components/analysis-page/AnalysisClient';

export const metadata: Metadata = { title: '시장 분석 — StockTerminal' };

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 py-8"><div className="h-12 bg-[#F0F0F0] animate-pulse" /></div>}>
      <AnalysisClient />
    </Suspense>
  );
}
