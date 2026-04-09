'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ChartTabProps {
  symbol: string;
  market: string;
  country: string;
}

function toTradingViewSymbol(symbol: string, market: string, country: string): string {
  if (country === 'KR') {
    return `KRX:${symbol}`;
  }
  if (market === 'NASDAQ') return `NASDAQ:${symbol}`;
  if (market === 'NYSE') return `NYSE:${symbol}`;
  if (market === 'AMEX') return `AMEX:${symbol}`;
  return symbol;
}

function TradingViewChart({ symbol, market, country }: ChartTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const initWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const tvSymbol = toTradingViewSymbol(symbol, market, country);

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: 'D',
      timezone: 'Asia/Seoul',
      theme: 'dark',
      style: '1',
      locale: 'kr',
      backgroundColor: 'rgba(17, 17, 23, 1)',
      gridColor: 'rgba(255, 255, 255, 0.06)',
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      height: '100%',
      width: '100%',
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);
  }, [symbol, market, country]);

  useEffect(() => {
    initWidget();

    return () => {
      const container = containerRef.current;
      if (container) {
        try {
          const iframes = container.querySelectorAll('iframe');
          iframes.forEach((iframe) => {
            try {
              iframe.src = 'about:blank';
            } catch {
              // ignore
            }
          });
          const scripts = container.querySelectorAll('script');
          scripts.forEach((s) => s.remove());
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [initWidget]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: '500px', width: '100%' }}
    />
  );
}

export default function ChartTab({ symbol, market, country }: ChartTabProps) {
  return (
    <div className="bg-dark-700 rounded-lg border border-border overflow-hidden">
      {/* key forces full remount when symbol changes */}
      <TradingViewChart
        key={`${symbol}-${market}-${country}`}
        symbol={symbol}
        market={market}
        country={country}
      />
    </div>
  );
}
