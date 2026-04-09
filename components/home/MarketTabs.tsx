'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ── Tab Definitions ─────────────────────────────────────────────────────────

type TabKey = 'kospi' | 'kosdaq' | 'nasdaq' | 'sp500' | 'forex';

interface TabDef {
  key: TabKey;
  label: string;
  chartSymbol: string;
  stocks: { symbol: string; name: string; tvSymbol: string }[];
}

const TABS: TabDef[] = [
  {
    key: 'kospi',
    label: '코스피',
    chartSymbol: 'KRX:005930',
    stocks: [
      { symbol: '005930', name: '삼성전자', tvSymbol: 'KRX:005930' },
      { symbol: '000660', name: 'SK하이닉스', tvSymbol: 'KRX:000660' },
      { symbol: '373220', name: 'LG에너지솔루션', tvSymbol: 'KRX:373220' },
      { symbol: '207940', name: '삼성바이오로직스', tvSymbol: 'KRX:207940' },
      { symbol: '005380', name: '현대차', tvSymbol: 'KRX:005380' },
      { symbol: '000270', name: '기아', tvSymbol: 'KRX:000270' },
      { symbol: '005490', name: 'POSCO홀딩스', tvSymbol: 'KRX:005490' },
      { symbol: '035420', name: 'NAVER', tvSymbol: 'KRX:035420' },
      { symbol: '035720', name: '카카오', tvSymbol: 'KRX:035720' },
      { symbol: '006400', name: '삼성SDI', tvSymbol: 'KRX:006400' },
    ],
  },
  {
    key: 'kosdaq',
    label: '코스닥',
    chartSymbol: 'KRX:247540',
    stocks: [
      { symbol: '247540', name: '에코프로비엠', tvSymbol: 'KRX:247540' },
      { symbol: '086520', name: '에코프로', tvSymbol: 'KRX:086520' },
      { symbol: '196170', name: '알테오젠', tvSymbol: 'KRX:196170' },
      { symbol: '028300', name: 'HLB', tvSymbol: 'KRX:028300' },
      { symbol: '058470', name: '리노공업', tvSymbol: 'KRX:058470' },
    ],
  },
  {
    key: 'nasdaq',
    label: '나스닥',
    chartSymbol: 'NASDAQ:AAPL',
    stocks: [
      { symbol: 'AAPL', name: 'Apple', tvSymbol: 'NASDAQ:AAPL' },
      { symbol: 'MSFT', name: 'Microsoft', tvSymbol: 'NASDAQ:MSFT' },
      { symbol: 'NVDA', name: 'NVIDIA', tvSymbol: 'NASDAQ:NVDA' },
      { symbol: 'GOOGL', name: 'Alphabet', tvSymbol: 'NASDAQ:GOOGL' },
      { symbol: 'AMZN', name: 'Amazon', tvSymbol: 'NASDAQ:AMZN' },
      { symbol: 'META', name: 'Meta', tvSymbol: 'NASDAQ:META' },
      { symbol: 'TSLA', name: 'Tesla', tvSymbol: 'NASDAQ:TSLA' },
      { symbol: 'AMD', name: 'AMD', tvSymbol: 'NASDAQ:AMD' },
      { symbol: 'NFLX', name: 'Netflix', tvSymbol: 'NASDAQ:NFLX' },
      { symbol: 'PLTR', name: 'Palantir', tvSymbol: 'NYSE:PLTR' },
    ],
  },
  {
    key: 'sp500',
    label: 'S&P500',
    chartSymbol: 'AMEX:SPY',
    stocks: [
      { symbol: 'SPY', name: 'SPDR S&P 500', tvSymbol: 'AMEX:SPY' },
      { symbol: 'QQQ', name: 'Invesco QQQ', tvSymbol: 'NASDAQ:QQQ' },
      { symbol: 'DIA', name: 'SPDR Dow Jones', tvSymbol: 'AMEX:DIA' },
      { symbol: 'IWM', name: 'iShares Russell', tvSymbol: 'AMEX:IWM' },
      { symbol: 'XLF', name: 'Financial Sector', tvSymbol: 'AMEX:XLF' },
      { symbol: 'XLE', name: 'Energy Sector', tvSymbol: 'AMEX:XLE' },
      { symbol: 'XLK', name: 'Technology Sector', tvSymbol: 'AMEX:XLK' },
      { symbol: 'XLV', name: 'Healthcare Sector', tvSymbol: 'AMEX:XLV' },
    ],
  },
  {
    key: 'forex',
    label: '환율/원자재',
    chartSymbol: 'FX:EURUSD',
    stocks: [
      { symbol: 'USDKRW', name: 'USD/KRW', tvSymbol: 'FX_IDC:USDKRW' },
      { symbol: 'EURUSD', name: 'EUR/USD', tvSymbol: 'FX:EURUSD' },
      { symbol: 'USDJPY', name: 'USD/JPY', tvSymbol: 'FX:USDJPY' },
      { symbol: 'WTI', name: 'WTI 원유', tvSymbol: 'TVC:USOIL' },
      { symbol: 'GOLD', name: '금', tvSymbol: 'TVC:GOLD' },
      { symbol: 'SILVER', name: '은', tvSymbol: 'TVC:SILVER' },
      { symbol: 'BTC', name: 'Bitcoin', tvSymbol: 'BITSTAMP:BTCUSD' },
      { symbol: 'ETH', name: 'Ethereum', tvSymbol: 'BITSTAMP:ETHUSD' },
    ],
  },
];

// ── TradingView Mini Chart (single instance per symbol) ─────────────────────

function TVMiniChart({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.type = 'text/javascript';
    script.textContent = JSON.stringify({
      symbol,
      width: '100%',
      height: '100%',
      locale: 'kr',
      dateRange: '1D',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: true,
      largeChartUrl: '',
      noTimeScale: true,
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);

    return () => {
      try {
        const iframes = container.querySelectorAll('iframe');
        iframes.forEach((f) => { try { f.src = 'about:blank'; } catch {} });
        container.querySelectorAll('script').forEach((s) => s.remove());
        while (container.firstChild) container.removeChild(container.firstChild);
      } catch {}
    };
  }, [symbol]);

  return <div ref={ref} className="tradingview-widget-container" style={{ height: '100%', width: '100%' }} />;
}

// ── Main Index Chart ────────────────────────────────────────────────────────

function TVIndexChart({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.textContent = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'Asia/Seoul',
      theme: 'dark',
      style: '1',
      locale: 'kr',
      backgroundColor: 'rgba(11, 17, 32, 1)',
      gridColor: 'rgba(255, 255, 255, 0.04)',
      allow_symbol_change: false,
      calendar: false,
      hide_top_toolbar: true,
      hide_legend: false,
      save_image: false,
      support_host: 'https://www.tradingview.com',
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);

    return () => {
      try {
        const iframes = container.querySelectorAll('iframe');
        iframes.forEach((f) => { try { f.src = 'about:blank'; } catch {} });
        container.querySelectorAll('script').forEach((s) => s.remove());
        while (container.firstChild) container.removeChild(container.firstChild);
      } catch {}
    };
  }, [symbol]);

  return <div ref={ref} className="tradingview-widget-container" style={{ height: '100%', width: '100%' }} />;
}

// ── Stocks List ─────────────────────────────────────────────────────────────

function StockRow({ stock }: { stock: TabDef['stocks'][0] }) {
  return (
    <Link
      href={`/stocks/${stock.symbol}`}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#161B22] transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-white group-hover:text-[#C9A96E] transition-colors truncate">
          {stock.name}
        </p>
        <p className="text-sm text-[#999999] font-mono-price">{stock.symbol}</p>
      </div>
      <div className="w-[120px] h-[50px] shrink-0">
        <TVMiniChart symbol={stock.tvSymbol} />
      </div>
    </Link>
  );
}

// ── MarketTabs Component ────────────────────────────────────────────────────

export default function MarketTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('kospi');
  const tab = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="flex flex-col">
      {/* Tab Bar */}
      <div className="flex shrink-0 bg-[#1A1A2E] overflow-hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-3 text-base font-bold transition-colors ${
              activeTab === t.key
                ? 'bg-[#C9A96E] text-white'
                : 'bg-[#1A1A2E] text-white hover:text-[#C9A96E]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Index Chart — stays dark */}
      <div className="h-[320px] shrink-0 border-b border-[#2D3748] bg-[#0D1117]">
        <TVIndexChart key={tab.chartSymbol} symbol={tab.chartSymbol} />
      </div>

      {/* Stock List — silver */}
      <div className="bg-[#0D1117]">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm font-bold text-[#999999]">
              {tab.label} 주요 종목
            </h3>
            <span className="text-xs text-[#999999] font-medium">{tab.stocks.length}종목</span>
          </div>
          <div className="space-y-0.5">
            {tab.stocks.map((stock) => (
              <StockRow key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
