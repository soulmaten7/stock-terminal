import type { Metadata } from 'next';
import AnalysisClient from '@/components/analysis-page/AnalysisClient';

export const metadata: Metadata = { title: '시장 분석 — StockTerminal' };

export default function AnalysisPage() {
  return <AnalysisClient />;
}
