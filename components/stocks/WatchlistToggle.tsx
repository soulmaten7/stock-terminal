'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/watchlist';

export default function WatchlistToggle({ symbol, country }: { symbol: string; country: string }) {
  const { user } = useAuthStore();
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    if (!user || !symbol) return;
    isInWatchlist(user.id, symbol.toUpperCase()).then(setStarred);
  }, [user, symbol]);

  if (!user) return null;

  const toggle = async () => {
    const sym = symbol.toUpperCase();
    if (starred) {
      await removeFromWatchlist(user.id, sym);
      setStarred(false);
    } else {
      await addToWatchlist(user.id, sym, country);
      setStarred(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`p-2 border rounded ${starred ? 'text-[#C9A96E] border-[#C9A96E]' : 'text-[#666666] border-[#E5E7EB]'} hover:text-[#C9A96E]`}
    >
      <Star className="w-5 h-5" fill={starred ? '#C9A96E' : 'none'} />
    </button>
  );
}
