import type { Metadata } from 'next';
import ScreenerClient from '@/components/screener/ScreenerClient';

export const metadata: Metadata = { title: '종목 스크리너 — StockTerminal' };

export default function ScreenerPage() {
  return <ScreenerClient />;
}
