'use client';

import { useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

export default function ChartWidget({ symbol = '005930' }: { symbol?: string }) {
  const [ticker, setTicker] = useState(symbol);
  const [input, setInput] = useState(symbol);
  const krxSymbol = `KRX:${ticker}`;

  const src =
    'https://s.tradingview.com/widgetembed/?' +
    `symbol=${encodeURIComponent(krxSymbol)}` +
    '&interval=D' +
    '&theme=light' +
    '&hide_side_toolbar=1' +
    '&hide_top_toolbar=1' +
    '&allow_symbol_change=0' +
    '&locale=kr' +
    '&timezone=Asia%2FSeoul';

  return (
    <WidgetCard
      title="차트"
      subtitle={krxSymbol}
      className="h-full"
      href="/chart"
      action={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = input.trim();
            if (v) setTicker(v.toUpperCase());
          }}
          className="flex items-center gap-1"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            className="w-20 text-[10px] bg-[#F0F0F0] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]"
            placeholder="005930"
            maxLength={6}
          />
          <button
            type="submit"
            className="text-[10px] text-[#0ABAB5] hover:underline"
          >
            이동
          </button>
        </form>
      }
    >
      <iframe
        key={krxSymbol}
        src={src}
        className="w-full h-full border-0"
        title={`TradingView 차트 — ${krxSymbol}`}
        allowFullScreen
      />
    </WidgetCard>
  );
}
