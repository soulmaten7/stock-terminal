import type { Metadata } from 'next';
import BriefingPageClient from '@/components/briefing/BriefingPageClient';

export const metadata: Metadata = { title: '장전 브리핑 — StockTerminal' };

export default function BriefingPage() {
  return <BriefingPageClient />;
}
