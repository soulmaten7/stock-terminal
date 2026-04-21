'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface Level {
  price: number;
  volume: number;
}

interface BookData {
  symbol: string;
  asks: Level[];
  bids: Level[];
  totalAskVolume: number;
  totalBidVolume: number;
}

interface PriceData {
  name?: string;
  price?: number;
  changePercent?: number;
}

function fmtPrice(n: number): string {
  return n.toLocaleString('ko-KR');
}

// 삼성전자 기본값 — 추후 심볼 입력 UI 추가 가능
const DEFAULT_SYMBOL = '005930';

export default function OrderBookWidget() {
  const [book, setBook] = useState<BookData | null>(null);
  const [info, setInfo] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [bookRes, priceRes] = await Promise.all([
          fetch(`/api/kis/orderbook?symbol=${DEFAULT_SYMBOL}`),
          fetch(`/api/kis/price?symbol=${DEFAULT_SYMBOL}`),
        ]);
        const bookJson = bookRes.ok ? await bookRes.json() : null;
        const priceJson = priceRes.ok ? await priceRes.json() : null;
        if (cancelled) return;
        if (bookJson && bookJson.asks) setBook(bookJson);
        if (priceJson) setInfo(priceJson);
      } catch {
        // noop
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 5_000); // 5초마다 갱신

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // 호가창 시각화: 각 단의 거래량을 전체 최대 대비 % 로 환산
  const allVolumes = [
    ...(book?.asks || []).map((a) => a.volume),
    ...(book?.bids || []).map((b) => b.volume),
  ];
  const maxVol = Math.max(1, ...allVolumes);

  const asks = book?.asks?.slice(0, 5) || [];
  const bids = book?.bids?.slice(0, 5) || [];

  return (
    <WidgetCard
      title="호가창"
      subtitle={`${info?.name || DEFAULT_SYMBOL} · 5초 갱신`}
      href="/orderbook"
      action={
        loading ? <span className="text-[10px] text-[#BBB]">로딩 중…</span> : undefined
      }
    >
      {asks.length === 0 && bids.length === 0 && !loading ? (
        <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
      ) : (
        <div aria-label="호가창" className="px-2 py-1 text-xs">
          {/* 매도 호가 (높은 가격 → 낮은 가격) */}
          <div className="mb-0.5">
            {asks.map((a, i) => {
              const bar = Math.round((a.volume / maxVol) * 100);
              return (
                <div key={`ask-${i}`} className="relative flex items-center justify-between py-0.5 px-1">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-[#0051CC]/10"
                    style={{ width: `${bar}%` }}
                  />
                  <span className="relative text-[#0051CC] font-bold">{fmtPrice(a.price)}</span>
                  <span className="relative text-[#555]">{a.volume.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          {/* 현재가 */}
          <div className="bg-[#0ABAB5]/10 text-center py-1 font-bold text-[#0ABAB5] text-sm border-y border-[#0ABAB5]/20 mb-0.5">
            {info?.price ? fmtPrice(info.price) : '—'}{' '}
            <span
              className={`text-xs ${(info?.changePercent ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
            >
              {(info?.changePercent ?? 0) >= 0 ? '+' : ''}
              {(info?.changePercent ?? 0).toFixed(2)}%
            </span>
          </div>
          {/* 매수 호가 */}
          <div>
            {bids.map((b, i) => {
              const bar = Math.round((b.volume / maxVol) * 100);
              return (
                <div key={`bid-${i}`} className="relative flex items-center justify-between py-0.5 px-1">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#FF3B30]/10"
                    style={{ width: `${bar}%` }}
                  />
                  <span className="relative text-[#FF3B30] font-bold">{fmtPrice(b.price)}</span>
                  <span className="relative text-[#555]">{b.volume.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
