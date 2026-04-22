import { Suspense } from 'react';
import type { Metadata } from 'next';
import OrderBookPageClient from '@/components/orderbook/OrderBookPageClient';

export const metadata: Metadata = { title: '호가창 — StockTerminal' };

export default function OrderBookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] bg-white">
          <div className="animate-spin w-8 h-8 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
        </div>
      }
    >
      <OrderBookPageClient />
    </Suspense>
  );
}
