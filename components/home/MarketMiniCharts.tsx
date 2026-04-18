'use client';

import { useEffect, useRef, useCallback } from 'react';

function TVMini({ symbol, label }: { symbol: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const init = useCallback(() => {
    const container = ref.current;
    if (!container) return;
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.type = 'text/javascript';
    script.textContent = JSON.stringify({
      symbol, width: '100%', height: '100%', locale: 'kr',
      dateRange: '1D', colorTheme: 'light', isTransparent: true, autosize: true,
    });
    container.appendChild(widgetDiv);
    container.appendChild(script);
    return () => {
      try {
        container.querySelectorAll('iframe').forEach((f) => { try { f.src = 'about:blank'; } catch {} });
        container.querySelectorAll('script').forEach((s) => s.remove());
        while (container.firstChild) container.removeChild(container.firstChild);
      } catch {}
    };
  }, [symbol]);

  useEffect(() => { return init(); }, [init]);

  return (
    <div className="bg-[#F5F7FA] border border-[#E5E7EB] p-2 rounded">
      <p className="text-[#666666] text-xs font-bold mb-1">{label}</p>
      <div ref={ref} style={{ height: 120 }} />
    </div>
  );
}

export default function MarketMiniCharts() {
  return (
    <div className="p-4 h-full">
      <h3 className="text-black font-bold text-sm mb-3">코스피 / 코스닥</h3>
      <div className="grid grid-cols-2 gap-3">
        <TVMini key="kospi" symbol="KRX:005930" label="삼성전자 (코스피 대표)" />
        <TVMini key="kosdaq" symbol="KRX:247540" label="에코프로비엠 (코스닥 대표)" />
      </div>
    </div>
  );
}
