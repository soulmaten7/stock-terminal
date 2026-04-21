import type { Metadata } from 'next';
import ScreenerClient from '@/components/screener/ScreenerClient';

export const metadata: Metadata = { title: '종목 발굴 — StockTerminal' };

export default function ScreenerPage() {
  return <ScreenerClient />;
}
