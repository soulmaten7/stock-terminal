'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stock } from '@/types/stock';
import StockHeader from '@/components/stocks/StockHeader';
import StockDetailTabs from '@/components/stocks/StockDetailTabs';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);

  // 종목 기본 정보
  useEffect(() => {
    async function loadStock() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();
      if (data) setStock(data as Stock);
      setLoading(false);
    }
    loadStock();
  }, [symbol]);

  // 최신 가격
  useEffect(() => {
    if (!stock) return;
    async function loadPrice() {
      const supabase = createClient();
      const { data } = await supabase
        .from('stock_prices')
        .select('close, change, change_percent')
        .eq('stock_id', stock!.id)
        .order('trade_date', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setCurrentPrice(data.close);
        setPriceChange(data.change);
        setPriceChangePercent(data.change_percent);
      }
    }
    loadPrice();
  }, [stock]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white text-black">
        <p className="text-xl mb-4">종목을 찾을 수 없습니다</p>
        <Link href="/stocks" className="text-[#0ABAB5] hover:underline font-bold">
          종목 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <StockHeader
        stock={stock}
        currentPrice={currentPrice}
        priceChange={priceChange}
        priceChangePercent={priceChangePercent}
      />
      <StockDetailTabs stock={stock} />
    </div>
  );
}
