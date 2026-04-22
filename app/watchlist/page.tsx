import type { Metadata } from 'next';
import WatchlistPageClient from '@/components/watchlist/WatchlistPageClient';

export const metadata: Metadata = { title: '관심종목 — StockTerminal' };

export default function WatchlistPage() {
  return <WatchlistPageClient />;
}
