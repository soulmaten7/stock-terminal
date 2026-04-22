import type { Metadata } from 'next';
import { Suspense } from 'react';
import TicksPageClient from '@/components/ticks/TicksPageClient';

export const metadata: Metadata = { title: '체결창 — StockTerminal' };

export default function TicksPage() {
  return (
    <Suspense fallback={<div className="w-full px-6 py-6"><div className="h-48 bg-[#F0F0F0] animate-pulse rounded-lg" /></div>}>
      <TicksPageClient />
    </Suspense>
  );
}
