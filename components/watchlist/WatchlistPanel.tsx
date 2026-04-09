'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Plus, Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/watchlist';

interface WatchlistItem {
  id: number;
  symbol: string;
  country: string;
  created_at: string;
}

export default function WatchlistPanel() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSymbol, setAddSymbol] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const data = await getWatchlist(user.id);
      setItems(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !addSymbol.trim()) return;
    const symbol = addSymbol.trim().toUpperCase();
    const success = await addToWatchlist(user.id, symbol);
    if (success) {
      setItems((prev) => [{ id: Date.now(), symbol, country: 'KR', created_at: new Date().toISOString() }, ...prev]);
      setAddSymbol('');
    }
  };

  const handleRemove = async (symbol: string) => {
    if (!user) return;
    const success = await removeFromWatchlist(user.id, symbol);
    if (success) setItems((prev) => prev.filter((i) => i.symbol !== symbol));
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Star className="w-10 h-10 text-[#999999] mb-4" />
        <p className="text-black font-bold text-lg mb-2">관심종목</p>
        <p className="text-[#999999] text-sm mb-4">로그인 후 관심종목을 관리하세요</p>
        <Link href="/auth/login" className="px-6 py-2 bg-[#0ABAB5] text-white font-bold hover:bg-[#088F8C]">로그인</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={addSymbol}
          onChange={(e) => setAddSymbol(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="종목코드 입력 (예: 005930)"
          className="flex-1 px-4 py-2 bg-[#F5F5F5] border border-[#E5E7EB] text-sm text-black placeholder:text-[#999999] focus:outline-none focus:border-[#0ABAB5]"
        />
        <button onClick={handleAdd} className="px-4 py-2 bg-[#0ABAB5] text-white font-bold hover:bg-[#088F8C] flex items-center gap-1">
          <Plus className="w-4 h-4" /> 추가
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-10 bg-[#F0F0F0] animate-pulse" />))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Star className="w-8 h-8 text-[#999999] mb-3" />
          <p className="text-[#999999] text-sm font-bold">관심종목이 없습니다</p>
          <p className="text-[#999999] text-xs mt-1">위에서 종목코드를 입력해 추가하세요</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3 px-3 border-b border-[#F0F0F0] last:border-0 hover:bg-[#F5F5F5]">
              <Link href={`/stocks/${item.symbol}`} className="flex-1 text-black font-bold hover:text-[#0ABAB5]">
                {item.symbol}
              </Link>
              <button onClick={() => handleRemove(item.symbol)} className="text-[#999999] hover:text-[#FF4D4D] p-1">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
