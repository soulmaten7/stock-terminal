import type { Metadata } from 'next';
import { Suspense } from 'react';
import NewsClient from '@/components/news/NewsClient';

export const metadata: Metadata = { title: '뉴스·공시 — StockTerminal' };

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 py-8"><div className="h-12 bg-[#F0F0F0] animate-pulse" /></div>}>
      <NewsClient />
    </Suspense>
  );
}
