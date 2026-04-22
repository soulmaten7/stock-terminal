import type { Metadata } from 'next';
import GlobalPageClient from '@/components/global/GlobalPageClient';

export const metadata: Metadata = { title: '글로벌 지수 — StockTerminal' };

export default function GlobalPage() {
  return <GlobalPageClient />;
}
