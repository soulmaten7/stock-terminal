'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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

interface PriceInfo {
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  tradeAmount?: number;
  high52w?: number;
  low52w?: number;
  per?: number;
  pbr?: number;
  marketCap?: number;
}

const fmtN = (n: number | undefined | null) =>
  n == null ? '—' : n.toLocaleString('ko-KR');

const fmtAmount = (n: number | undefined) => {
  if (!n) return '—';
  if (n >= 1_0000_0000_0000) return `${(n / 1_0000_0000_0000).toFixed(1)}조`;
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(1)}만`;
  return n.toLocaleString();
};

export default function OrderBookPageClient() {
  const sp = useSearchParams();
  const symbolParam = sp.get('symbol') || '005930';

  const [symbol, setSymbol] = useState(symbolParam);
  const [input, setInput] = useState(symbolParam);
  const [book, setBook] = useState<BookData | null>(null);
  const [info, setInfo] = useState<PriceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSymbol(symbolParam);
    setInput(symbolParam);
  }, [symbolParam]);

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
    setLoading(true);
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
    }
  };

  const asks = book?.asks?.slice(-10) || [];
  const bids = book?.bids?.slice(0, 10) || [];

  const allVol = [...asks.map((a) => a.volume), ...bids.map((b) => b.volume)];
  const maxVol = Math.max(1, ...allVol);

  const totalAsk = book?.totalAskVolume ?? 0;
  const totalBid = book?.totalBidVolume ?? 0;
  const sumTotal = totalAsk + totalBid;
  const bidPct = sumTotal > 0 ? (totalBid / sumTotal) * 100 : 50;
  const askPct = 100 - bidPct;

  const up = (info?.change ?? 0) >= 0;
  const colorCls = up ? 'text-[#FF3B30]' : 'text-[#0051CC]';

  return (
    <div className="w-full px-6 py-6 max-w-screen-2xl mx-auto">
      {/* 상단 헤더 */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black">호가창</h1>
          <p className="text-sm text-[#666] mt-0.5">
            {symbol}
            {info?.name ? ` · ${info.name}` : ''} · KIS OpenAPI · 5초 갱신
          </p>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="mb-3 flex flex-wrap items-center gap-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-32 text-sm bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"
            placeholder="005930"
            maxLength={6}
            inputMode="numeric"
          />
          <button
            type="submit"
            className="text-sm font-medium text-white bg-[#0ABAB5] hover:bg-[#089B97] rounded px-3 py-1.5"
          >
            이동
          </button>
        </form>
        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      {/* 종목 요약 */}
      {info?.price ? (
        <div className="mb-4 bg-white border border-[#E5E7EB] rounded-lg p-5">
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <span className={`text-3xl font-bold tabular-nums ${colorCls}`}>
              {fmtN(info.price)}
            </span>
            <span className={`text-lg font-medium tabular-nums ${colorCls}`}>
              {up ? '+' : ''}
              {fmtN(info.change)} ({up ? '+' : ''}
              {(info.changePercent ?? 0).toFixed(2)}%)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#888]">시가</span>
              <span className="tabular-nums text-[#333]">{fmtN(info.open)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">고가</span>
              <span className="tabular-nums text-[#FF3B30]">{fmtN(info.high)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">저가</span>
              <span className="tabular-nums text-[#0051CC]">{fmtN(info.low)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">거래량</span>
              <span className="tabular-nums text-[#333]">{fmtAmount(info.volume)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">52주 최고</span>
              <span className="tabular-nums text-[#333]">{fmtN(info.high52w)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">52주 최저</span>
              <span className="tabular-nums text-[#333]">{fmtN(info.low52w)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">PER</span>
              <span className="tabular-nums text-[#333]">
                {info.per ? info.per.toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">PBR</span>
              <span className="tabular-nums text-[#333]">
                {info.pbr ? info.pbr.toFixed(2) : '—'}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* 10단 호가창 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#F0F0F0] flex items-center justify-between">
          <span className="text-sm font-bold text-black">10단 호가</span>
          <span className="text-xs text-[#999]">KIS OpenAPI · FHKST01010200</span>
        </div>

        {asks.length === 0 && bids.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#999]">데이터 없음</div>
        ) : (
          <div className="px-4 py-3">
            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 py-2 border-b border-[#F0F0F0] text-[11px] font-bold text-[#888]">
              <div className="text-right pr-2">매도 잔량</div>
              <div className="text-center min-w-[100px]">호가</div>
              <div className="text-left pl-2">매수 잔량</div>
            </div>

            {/* 매도 10단 */}
            <div className="py-1">
              {asks.map((a, i) => {
                const bar = Math.round((a.volume / maxVol) * 100);
                return (
                  <div
                    key={`ask-${i}`}
                    className="relative grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-1 px-2 hover:bg-[#FAFAFA]"
                  >
                    <div className="relative h-full flex items-center justify-end">
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#0051CC]/15 rounded-sm"
                        style={{ width: `${bar}%` }}
                      />
                      <span className="relative text-sm text-[#555] tabular-nums pr-1">
                        {a.volume.toLocaleString()}
                      </span>
                    </div>
                    <span className="relative text-sm text-[#0051CC] font-bold text-center min-w-[100px] tabular-nums">
                      {fmtN(a.price)}
                    </span>
                    <span />
                  </div>
                );
              })}
            </div>

            {/* 현재가 */}
            <div className="bg-[#0ABAB5]/10 text-center py-2.5 font-bold text-[#0ABAB5] text-base border-y border-[#0ABAB5]/30 my-1 tabular-nums">
              {info?.price ? fmtN(info.price) : '—'}
              <span className={`ml-2 text-sm ${colorCls}`}>
                {up ? '+' : ''}
                {fmtN(info?.change)} ({up ? '+' : ''}
                {(info?.changePercent ?? 0).toFixed(2)}%)
              </span>
            </div>

            {/* 매수 10단 */}
            <div className="py-1">
              {bids.map((b, i) => {
                const bar = Math.round((b.volume / maxVol) * 100);
                return (
                  <div
                    key={`bid-${i}`}
                    className="relative grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-1 px-2 hover:bg-[#FAFAFA]"
                  >
                    <span />
                    <span className="relative text-sm text-[#FF3B30] font-bold text-center min-w-[100px] tabular-nums">
                      {fmtN(b.price)}
                    </span>
                    <div className="relative h-full flex items-center justify-start">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#FF3B30]/15 rounded-sm"
                        style={{ width: `${bar}%` }}
                      />
                      <span className="relative text-sm text-[#555] tabular-nums pl-1">
                        {b.volume.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 총잔량 푸터 */}
        {sumTotal > 0 && (
          <div className="border-t border-[#F0F0F0] px-4 py-3 bg-[#FAFAFA]">
            <div className="flex items-center justify-between text-xs mb-2 tabular-nums">
              <span className="text-[#666]">
                총 매도{' '}
                <span className="text-[#0051CC] font-bold">{totalAsk.toLocaleString()}</span>
              </span>
              <span className="text-[#666]">
                총 매수{' '}
                <span className="text-[#FF3B30] font-bold">{totalBid.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex h-3 rounded overflow-hidden">
              <div
                className="bg-[#FF3B30] flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${bidPct}%` }}
              >
                {bidPct >= 15 ? `${bidPct.toFixed(1)}%` : ''}
              </div>
              <div
                className="bg-[#0051CC] flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${askPct}%` }}
              >
                {askPct >= 15 ? `${askPct.toFixed(1)}%` : ''}
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#888] mt-1">
              <span>매수 우세 ←</span>
              <span>→ 매도 우세</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
