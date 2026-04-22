'use client';

import { useEffect, useState } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
import type { PriceData } from './StockDetailPanel';

interface Props {
  priceData: PriceData | null;
  loading?: boolean;
}

function fmtPrice(n: number): string {
  return n > 0 ? n.toLocaleString('ko-KR') : '--';
}

function fmtVol(n: number): string {
  if (!n) return '--';
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString('ko-KR');
}

function fmtMarketCap(n: number): string {
  if (!n) return '--';
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}조`;
  return `${n.toLocaleString('ko-KR')}억`;
}

function changeCls(n: number): string {
  if (n > 0) return 'text-[#FF3B30]';
  if (n < 0) return 'text-[#0051CC]';
  return 'text-[#444]';
}

export default function SnapshotHeader({ priceData, loading }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const _selected = useSelectedSymbolStore((s) => s.selected);
  const selected = mounted ? _selected : null;

  const priceCls = changeCls(priceData?.changePercent ?? 0);
  const pctStr = priceData
    ? `${priceData.changePercent >= 0 ? '+' : ''}${priceData.changePercent.toFixed(2)}%`
    : '--%';

  return (
    <header className="px-4 py-3 border-b border-[#E5E7EB] shrink-0 bg-white">
      <div className="flex items-baseline justify-between mb-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-black truncate">
            {selected?.name ?? '종목을 선택하세요'}
          </div>
          <div className="text-[11px] text-[#999]">
            {selected?.code ?? '—'}
            {selected?.market && <span className="ml-1 text-[#BBB]">· {selected.market}</span>}
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <div className={`text-lg font-bold ${loading ? 'text-[#BBB]' : 'text-black'}`}>
            {priceData ? fmtPrice(priceData.price) : '--'}
          </div>
          <div className={`text-[11px] font-bold ${loading ? 'text-[#BBB]' : priceCls}`}>
            {pctStr}
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px] text-[#666]">
        <div><dt className="inline text-[#999]">시 </dt><dd className="inline">{priceData ? fmtPrice(priceData.open) : '--'}</dd></div>
        <div><dt className="inline text-[#999]">고 </dt><dd className="inline">{priceData ? fmtPrice(priceData.high) : '--'}</dd></div>
        <div><dt className="inline text-[#999]">저 </dt><dd className="inline">{priceData ? fmtPrice(priceData.low) : '--'}</dd></div>
        <div><dt className="inline text-[#999]">거래량 </dt><dd className="inline">{priceData ? fmtVol(priceData.volume) : '--'}</dd></div>
        <div><dt className="inline text-[#999]">시총 </dt><dd className="inline">{priceData ? fmtMarketCap(priceData.marketCap) : '--'}</dd></div>
        <div><dt className="inline text-[#999]">PER </dt><dd className="inline">{priceData?.per ? `${priceData.per.toFixed(1)}배` : '—'}</dd></div>
      </dl>
    </header>
  );
}
