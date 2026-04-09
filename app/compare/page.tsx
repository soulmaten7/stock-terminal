import type { Metadata } from 'next';
import CompareClient from '@/components/compare/CompareClient';

export const metadata: Metadata = { title: '종목 비교 — StockTerminal' };

export default function ComparePage() {
  return <CompareClient />;
}
