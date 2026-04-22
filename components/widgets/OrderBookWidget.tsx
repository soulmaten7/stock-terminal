'use client';

import { useEffect, useState, FormEvent } from 'react';
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

const DEFAULT_SYMBOL = '005930';

export default function OrderBookWidget() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [input, setInput] = useState(DEFAULT_SYMBOL);
  const [book, setBook] = useState<BookData | null>(null);
  const [info, setInfo] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [bookRes, priceRes] = await Promise.all([
          fetch(`/api/kis/orderbook?symbol=${symbol}`),
          fetch(`/api/kis/price?symbol=${symbol}`),
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
    const timer = setInterval(load, 5_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [symbol]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (/^\d{6}$/.test(v)) {
      setSymbol(v);
      setBook(null);
      setLoading(true);
    }
  };

  const allVolumes = [
    ...(book?.asks || []).map((a) => a.volume),
    ...(book?.bids || []).map((b) => b.volume),
  ];
  const maxVol = Math.max(1, ...allVolumes);

  const asks = book?.asks?.slice(-5) || [];
  const bids = book?.bids?.slice(0, 5) || [];

  const totalAsk = book?.totalAskVolume ?? 0;
  const totalBid = book?.totalBidVolume ?? 0;
  const sumTotal = totalAsk + totalBid;
  const bidPct = sumTotal > 0 ? (totalBid / sumTotal) * 100 : 50;
  const askPct = 100 - bidPct;

  return (
    <WidgetCard
      title="호가창"
      subtitle={`${info?.name || symbol} · 5초 갱신`}
      href={`/orderbook?symbol=${symbol}`}
      action={
        <form onSubmit={handleSubmit} className="flex items-center gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-16 text-[10px] bg-[#F0F0F0] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]"
            placeholder="005930"
            maxLength={6}
            inputMode="numeric"
          />
          <button type="submit" className="text-[10px] text-[#0ABAB5] hover:underline">
            이동
          </button>
        </form>
      }
    >
      {asks.length === 0 && bids.length === 0 && !loading ? (
        <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
      ) : (
        <div className="flex flex-col h-full">
          <div aria-label="호가창" className="px-2 py-1 text-xs flex-1">
            {/* 매도 호가 (위) — 3-col 그리드 */}
            <div className="mb-0.5">
              {asks.map((a, i) => {
                const bar = Math.round((a.volume / maxVol) * 100);
                return (
                  <div
                    key={`ask-${i}`}
                    className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-1 py-0.5 px-1"
                  >
                    <div className="relative h-full flex items-center justify-end">
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#0051CC]/15"
                        style={{ width: `${bar}%` }}
                      />
                      <span className="relative text-[#555] tabular-nums">
                        {a.volume.toLocaleString()}
                      </span>
                    </div>
                    <span className="relative text-[#0051CC] font-bold text-center min-w-[60px] tabular-nums">
                      {fmtPrice(a.price)}
                    </span>
                    <span />
                  </div>
                );
              })}
            </div>

            {/* 현재가 */}
            <div className="bg-[#0ABAB5]/10 text-center py-1 font-bold text-[#0ABAB5] text-sm border-y border-[#0ABAB5]/20 mb-0.5 tabular-nums">
              {info?.price ? fmtPrice(info.price) : '—'}{' '}
              <span
                className={`text-xs ${(info?.changePercent ?? 0) >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
              >
                {(info?.changePercent ?? 0) >= 0 ? '+' : ''}
                {(info?.changePercent ?? 0).toFixed(2)}%
              </span>
            </div>

            {/* 매수 호가 (아래) — 3-col 그리드 */}
            <div>
              {bids.map((b, i) => {
                const bar = Math.round((b.volume / maxVol) * 100);
                return (
                  <div
                    key={`bid-${i}`}
                    className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-1 py-0.5 px-1"
                  >
                    <span />
                    <span className="relative text-[#FF3B30] font-bold text-center min-w-[60px] tabular-nums">
                      {fmtPrice(b.price)}
                    </span>
                    <div className="relative h-full flex items-center justify-start">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#FF3B30]/15"
                        style={{ width: `${bar}%` }}
                      />
                      <span className="relative text-[#555] tabular-nums">
                        {b.volume.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 총잔량 푸터 */}
          {sumTotal > 0 && (
            <div className="border-t border-[#F0F0F0] px-2 py-1.5 bg-[#FAFAFA]">
              <div className="flex items-center justify-between text-[10px] text-[#666] tabular-nums mb-1">
                <span>
                  매도 <span className="text-[#0051CC] font-bold">{totalAsk.toLocaleString()}</span>
                </span>
                <span>
                  매수 <span className="text-[#FF3B30] font-bold">{totalBid.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex h-1.5 rounded overflow-hidden">
                <div className="bg-[#FF3B30]" style={{ width: `${bidPct}%` }} title={`매수 ${bidPct.toFixed(1)}%`} />
                <div className="bg-[#0051CC]" style={{ width: `${askPct}%` }} title={`매도 ${askPct.toFixed(1)}%`} />
              </div>
              <div className="flex items-center justify-between text-[9px] text-[#888] tabular-nums mt-0.5">
                <span>매수 {bidPct.toFixed(1)}%</span>
                <span>{askPct.toFixed(1)}% 매도</span>
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
