'use client';

import Link from 'next/link';

const THEMES = [
  { name: '2차전지', change: 2.3, stocks: [
    { symbol: '006400', name: '삼성SDI', change: 3.1 }, { symbol: '373220', name: 'LG에너지솔루션', change: 2.8 }, { symbol: '247540', name: '에코프로비엠', change: 1.2 },
  ]},
  { name: 'AI반도체', change: 1.8, stocks: [
    { symbol: '000660', name: 'SK하이닉스', change: 2.1 }, { symbol: '005930', name: '삼성전자', change: 1.5 },
  ]},
  { name: '바이오', change: -0.8, stocks: [
    { symbol: '207940', name: '삼성바이오', change: -0.5 }, { symbol: '068270', name: '셀트리온', change: -1.2 }, { symbol: '196170', name: '알테오젠', change: 0.8 },
  ]},
];

export default function ThemeGroups() {
  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-6">
      <h2 className="text-lg font-bold text-black mb-4">테마별 종목</h2>
      <div className="space-y-4">
        {THEMES.map((t) => (
          <div key={t.name} className="border-b border-[#F0F0F0] pb-3 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-black">{t.name}</span>
              <span className={`font-mono-price font-bold text-sm ${t.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                {t.change >= 0 ? '▲' : '▼'}{Math.abs(t.change)}%
              </span>
            </div>
            <div className="space-y-1">
              {t.stocks.map((s) => (
                <Link key={s.symbol} href={`/stocks/${s.symbol}`} className="flex items-center justify-between py-1 px-2 hover:bg-[#F5F5F5]">
                  <span className="text-black text-sm">{s.name}</span>
                  <span className={`font-mono-price text-xs font-bold ${s.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                    {s.change >= 0 ? '+' : ''}{s.change}%
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
