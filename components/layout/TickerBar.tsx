'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCountryStore } from '@/stores/countryStore';

function TradingViewTickerTape({ country }: { country: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const initWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const symbols =
      country === 'KR'
        ? [
            { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
            { proName: 'FOREXCOM:NSXUSD', title: 'US 100' },
            { proName: 'INDEX:DJI', title: 'DOW' },
            { proName: 'FX_IDC:USDKRW', title: 'USD/KRW' },
            { proName: 'TVC:USOIL', title: 'WTI' },
            { proName: 'TVC:GOLD', title: 'GOLD' },
            { proName: 'BITSTAMP:BTCUSD', title: 'BTC' },
            { proName: 'FX:EURUSD', title: 'EUR/USD' },
          ]
        : [
            { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
            { proName: 'FOREXCOM:NSXUSD', title: 'US 100' },
            { proName: 'INDEX:DJI', title: 'DOW' },
            { proName: 'INDEX:RUTW', title: 'RUSSELL' },
            { proName: 'FX_IDC:USDKRW', title: 'USD/KRW' },
            { proName: 'TVC:USOIL', title: 'WTI' },
            { proName: 'TVC:GOLD', title: 'GOLD' },
            { proName: 'BITSTAMP:BTCUSD', title: 'BTC' },
          ];

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.type = 'text/javascript';
    script.textContent = JSON.stringify({
      symbols,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'kr',
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);
  }, [country]);

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
      className="tradingview-widget-container h-full"
    />
  );
}

export default function TickerBar() {
  const { country } = useCountryStore();

  return (
    <div className="bg-[#0D1117] border-b border-[#2D3748] h-12 overflow-hidden">
      {/* key forces full remount on country change */}
      <TradingViewTickerTape key={country} country={country} />
    </div>
  );
}
