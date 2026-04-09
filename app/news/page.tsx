import type { Metadata } from 'next';
import NewsClient from '@/components/news/NewsClient';

export const metadata: Metadata = { title: '뉴스·공시 — StockTerminal' };

export default function NewsPage() {
  return <NewsClient />;
}
