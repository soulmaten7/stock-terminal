import type { Metadata } from 'next';
import WatchlistPageClient from '@/components/watchlist/WatchlistPageClient';

export const metadata: Metadata = { title: '관심종목 — 운종' };

export default function WatchlistPage() {
  return <WatchlistPageClient />;
}
