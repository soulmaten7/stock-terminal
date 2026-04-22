import { Suspense } from 'react';
import type { Metadata } from 'next';
import ChartPageClient from '@/components/chart/ChartPageClient';

export const metadata: Metadata = { title: '차트 — StockTerminal' };

export default function ChartPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] bg-white">
          <div className="animate-spin w-8 h-8 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
        </div>
      }
    >
      <ChartPageClient />
    </Suspense>
  );
}
