'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCountryStore } from '@/stores/countryStore';

function TradingViewMarketOverview({ country }: { country: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const initWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const symbols =
      country === 'KR'
        ? [
            { s: 'KRX:KOSPI', d: 'KOSPI' },
            { s: 'KRX:KOSDAQ', d: 'KOSDAQ' },
            { s: 'NASDAQ:NDX', d: 'NASDAQ 100' },
            { s: 'SP:SPX', d: 'S&P 500' },
            { s: 'FX_IDC:USDKRW', d: 'USD/KRW' },
            { s: 'TVC:USOIL', d: 'WTI' },
            { s: 'TVC:GOLD', d: 'GOLD' },
            { s: 'BITSTAMP:BTCUSD', d: 'BTC' },
          ]
        : [
            { s: 'NASDAQ:NDX', d: 'NASDAQ 100' },
            { s: 'SP:SPX', d: 'S&P 500' },
            { s: 'DJ:DJI', d: 'DOW' },
            { s: 'RUSSELL:RUT', d: 'RUSSELL 2000' },
            { s: 'FX_IDC:USDKRW', d: 'USD/KRW' },
            { s: 'TVC:USOIL', d: 'WTI' },
            { s: 'TVC:GOLD', d: 'GOLD' },
            { s: 'BITSTAMP:BTCUSD', d: 'BTC' },
          ];

    const config = {
      colorTheme: 'dark',
      dateRange: '1M',
      showChart: true,
      locale: 'kr',
      largeChartUrl: '',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: '100%',
      height: 400,
      tabs: [
        {
          title: '시장 요약',
          symbols: symbols.map((sym) => ({ s: sym.s, d: sym.d })),
          originalTitle: 'Market',
        },
      ],
    };

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.async = true;
    script.type = 'text/javascript';
    script.textContent = JSON.stringify(config);

    container.appendChild(widgetDiv);
    container.appendChild(script);

    const timer = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(timer);
  }, [country]);

  useEffect(() => {
    const cleanup = initWidget();

    return () => {
      cleanup?.();
      // Safe cleanup: remove children without triggering iframe contentWindow errors
      const container = containerRef.current;
      if (container) {
        try {
          // Remove iframes first to prevent contentWindow access errors
          const iframes = container.querySelectorAll('iframe');
          iframes.forEach((iframe) => {
            try {
              iframe.src = 'about:blank';
            } catch {
              // ignore
            }
          });
          // Remove scripts to stop any pending execution
          const scripts = container.querySelectorAll('script');
          scripts.forEach((s) => s.remove());
          // Now safe to clear
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
    <div className="relative bg-dark-700  overflow-hidden" style={{ height: 400 }}>
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col gap-3 p-6">
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 h-16 bg-dark-600  animate-pulse" />
            ))}
          </div>
          <div className="flex-1 bg-dark-600  animate-pulse" />
        </div>
      )}
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: 400 }}
      />
    </div>
  );
}

export default function MarketSummaryCards() {
  const { country } = useCountryStore();

  return (
    <section>
      <h2 className="text-lg font-bold mb-4">시장 요약</h2>
      {/* key forces full remount on country change — avoids manual DOM clearing */}
      <TradingViewMarketOverview key={country} country={country} />
    </section>
  );
}
