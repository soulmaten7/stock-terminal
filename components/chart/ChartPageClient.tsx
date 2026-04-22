'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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

type Period = 'D' | 'W' | 'M';

function normalizeSymbol(input: string): { raw: string; isKrx: boolean } {
  const t = input.trim().toUpperCase();
  if (/^\d{6}$/.test(t)) return { raw: t, isKrx: true };
  if (t.includes(':')) return { raw: t, isKrx: false };
  return { raw: `NASDAQ:${t}`, isKrx: false };
}

const fmtN = (n: number) => n.toLocaleString('ko-KR');

export default function ChartPageClient() {
  const sp = useSearchParams();
  const symbolParam = sp.get('symbol') || '005930';

  const [ticker, setTicker] = useState(symbolParam);
  const [input, setInput] = useState(symbolParam);
  const [period, setPeriod] = useState<Period>('D');
  const { raw, isKrx } = normalizeSymbol(ticker);

  const krxContainerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tvContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTicker(symbolParam);
    setInput(symbolParam);
  }, [symbolParam]);

  // ── KRX: KIS API fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isKrx) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/kis/chart?symbol=${raw}&period=${period}`);
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
  }, [raw, isKrx, period]);

  // ── KRX: lightweight-charts 렌더 ──────────────────────────────────────────
  useEffect(() => {
    if (!isKrx || !krxContainerRef.current || candles.length === 0) return;
    const el = krxContainerRef.current;
    el.innerHTML = '';

    const chart: IChartApi = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#333',
        fontSize: 12,
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
      })),
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
      })),
    );

    chart.timeScale().fitContent();
    return () => { chart.remove(); };
  }, [candles, isKrx]);

  // ── 해외: TradingView tv.js ───────────────────────────────────────────────
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
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        allow_symbol_change: true,
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (v) setTicker(v.toUpperCase());
  };

  const tableRows = [...candles].reverse().slice(0, 30);

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
          <h1 className="text-2xl font-bold text-black">차트</h1>
          <p className="text-sm text-[#666] mt-0.5">
            {isKrx ? (name ? `${raw} · ${name}` : raw) : raw}
            {isKrx ? ' · KIS OpenAPI' : ' · TradingView'}
          </p>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="mb-3 flex flex-wrap items-center gap-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            className="w-48 text-sm bg-white border border-[#E5E7EB] rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"
            placeholder="005930 · AAPL · NASDAQ:TSLA"
            maxLength={32}
          />
          <button
            type="submit"
            className="text-sm font-medium text-white bg-[#0ABAB5] hover:bg-[#089B97] rounded px-3 py-1.5"
          >
            이동
          </button>
        </form>

        {isKrx && (
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-[#666] mr-1">기간</span>
            {(['D', 'W', 'M'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs font-medium px-2.5 py-1 rounded ${
                  period === p
                    ? 'bg-[#0ABAB5] text-white'
                    : 'bg-white border border-[#E5E7EB] text-[#666] hover:text-black'
                }`}
              >
                {p === 'D' ? '일' : p === 'W' ? '주' : '월'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 차트 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="relative" style={{ height: 600 }}>
          {isKrx ? (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[#888] bg-white/50 z-10">
                  차트 로딩 중…
                </div>
              )}
              {err && !loading && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[#C33] bg-white/90 z-10 p-4 text-center">
                  차트 로드 실패: {err}
                </div>
              )}
              <div ref={krxContainerRef} className="w-full h-full" />
            </>
          ) : (
            <div ref={tvContainerRef} className="w-full h-full" />
          )}
        </div>
      </div>

      {/* OHLCV 테이블 (KRX 전용) */}
      {isKrx && tableRows.length > 0 && (
        <div className="mt-4 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#F0F0F0] flex items-center justify-between">
            <span className="text-sm font-bold text-black">
              최근 {tableRows.length}개 {period === 'D' ? '일봉' : period === 'W' ? '주봉' : '월봉'}
            </span>
            <span className="text-xs text-[#999]">KIS OpenAPI</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                  <th className="px-4 py-2 text-left font-bold text-[#666]">날짜</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">시가</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">고가</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">저가</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">종가</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">전일비</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">등락률</th>
                  <th className="px-4 py-2 text-right font-bold text-[#666]">거래량</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((c, i) => {
                  const prev = tableRows[i + 1];
                  const change = prev ? c.close - prev.close : 0;
                  const changePct = prev ? (change / prev.close) * 100 : 0;
                  const up = change >= 0;
                  const colorCls = up ? 'text-[#FF3B30]' : 'text-[#0051CC]';
                  return (
                    <tr key={c.time} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                      <td className="px-4 py-1.5 text-[#333]">{c.time}</td>
                      <td className="px-4 py-1.5 text-right text-[#333]">{fmtN(c.open)}</td>
                      <td className="px-4 py-1.5 text-right text-[#333]">{fmtN(c.high)}</td>
                      <td className="px-4 py-1.5 text-right text-[#333]">{fmtN(c.low)}</td>
                      <td className={`px-4 py-1.5 text-right font-medium ${colorCls}`}>
                        {fmtN(c.close)}
                      </td>
                      <td className={`px-4 py-1.5 text-right ${colorCls}`}>
                        {prev ? `${up ? '+' : ''}${fmtN(change)}` : '—'}
                      </td>
                      <td className={`px-4 py-1.5 text-right ${colorCls}`}>
                        {prev ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-4 py-1.5 text-right text-[#666]">{fmtN(c.volume)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
