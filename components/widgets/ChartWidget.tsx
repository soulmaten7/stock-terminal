'use client';

import { useEffect, useRef, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';

declare global {
  interface Window {
    TradingView?: { widget: new (o: Record<string, unknown>) => unknown };
  }
}

type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function normalizeSymbol(input: string): { raw: string; isKrx: boolean } {
  const t = input.trim().toUpperCase();
  if (/^\d{6}$/.test(t)) return { raw: t, isKrx: true };
  if (t.includes(':')) return { raw: t, isKrx: false };
  return { raw: `NASDAQ:${t}`, isKrx: false };
}

export default function ChartWidget({ symbol = '005930' }: { symbol?: string }) {
  const [ticker, setTicker] = useState(symbol);
  const [input, setInput] = useState(symbol);
  const { raw, isKrx } = normalizeSymbol(ticker);

  const krxContainerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tvContainerRef = useRef<HTMLDivElement>(null);

  // ── KRX: KIS API fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isKrx) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/kis/chart?symbol=${raw}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || 'fetch failed');
        setCandles(data.candles || []);
        setName(data.name || '');
      } catch (e) {
        if (!cancelled) setErr(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [raw, isKrx]);

  // ── KRX: Lightweight Charts 렌더 ───────────────────────────────────────────
  useEffect(() => {
    if (!isKrx || !krxContainerRef.current || candles.length === 0) return;
    const el = krxContainerRef.current;
    el.innerHTML = '';

    const chart: IChartApi = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#333',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#F0F0F0' },
        horzLines: { color: '#F0F0F0' },
      },
      rightPriceScale: { borderColor: '#E5E7EB' },
      timeScale: { borderColor: '#E5E7EB', timeVisible: false },
      crosshair: { mode: 1 },
      autoSize: true,
    });

    const candleSeries: ISeriesApi<'Candlestick'> = chart.addCandlestickSeries({
      upColor: '#FF3B30',
      downColor: '#0064FF',
      borderVisible: false,
      wickUpColor: '#FF3B30',
      wickDownColor: '#0064FF',
    });
    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const volumeSeries: ISeriesApi<'Histogram'> = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: '#D1D5DB',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? '#FFD1CF' : '#C7D7FF',
      }))
    );

    chart.timeScale().fitContent();
    return () => { chart.remove(); };
  }, [candles, isKrx]);

  // ── 해외 티커: TradingView tv.js ───────────────────────────────────────────
  useEffect(() => {
    if (isKrx || !tvContainerRef.current) return;
    const el = tvContainerRef.current;
    el.innerHTML = '';
    const host = document.createElement('div');
    host.id = `tv-${Date.now()}`;
    host.style.width = '100%';
    host.style.height = '100%';
    el.appendChild(host);

    const render = () => {
      if (!window.TradingView) return;
      new window.TradingView.widget({
        container_id: host.id,
        symbol: raw,
        interval: 'D',
        theme: 'light',
        locale: 'kr',
        timezone: 'Asia/Seoul',
        autosize: true,
        hide_side_toolbar: true,
        hide_top_toolbar: false,
        allow_symbol_change: false,
        style: '1',
        withdateranges: true,
        save_image: false,
      });
    };

    if (window.TradingView) {
      render();
    } else {
      const ex = document.querySelector<HTMLScriptElement>('script[data-tv-loader="1"]');
      if (ex) {
        ex.addEventListener('load', render, { once: true });
      } else {
        const s = document.createElement('script');
        s.src = 'https://s3.tradingview.com/tv.js';
        s.async = true;
        s.dataset.tvLoader = '1';
        s.onload = render;
        document.head.appendChild(s);
      }
    }
  }, [raw, isKrx]);

  const displayTitle = isKrx ? `${raw}${name ? ' · ' + name : ''}` : raw;

  return (
    <WidgetCard
      title="차트"
      subtitle={displayTitle}
      className="h-full"
      href={`/chart?symbol=${encodeURIComponent(raw)}`}
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
            className="w-24 text-[10px] bg-[#F0F0F0] rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]"
            placeholder="005930 · AAPL"
            maxLength={16}
          />
          <button type="submit" className="text-[10px] text-[#0ABAB5] hover:underline">
            이동
          </button>
        </form>
      }
    >
      {isKrx ? (
        <div className="w-full h-full relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#888] bg-white/50 z-10">
              차트 로딩 중…
            </div>
          )}
          {err && !loading && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#C33] bg-white/90 z-10 p-4 text-center">
              차트 로드 실패: {err}
            </div>
          )}
          <div ref={krxContainerRef} className="w-full h-full" />
        </div>
      ) : (
        <div ref={tvContainerRef} className="w-full h-full" />
      )}
    </WidgetCard>
  );
}
