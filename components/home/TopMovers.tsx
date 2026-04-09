'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const TABS = [
  { key: 'gainers', label: '상승률 TOP', icon: TrendingUp },
  { key: 'losers', label: '하락률 TOP', icon: TrendingDown },
  { key: 'volume', label: '거래량 TOP', icon: BarChart3 },
] as const;

// 데모 데이터 — 실제로는 API에서 로드
const DEMO_DATA = {
  gainers: [
    { symbol: '005930', name: '삼성전자', price: '72,400', change: '+5.23%' },
    { symbol: '000660', name: 'SK하이닉스', price: '185,000', change: '+4.12%' },
    { symbol: '035420', name: 'NAVER', price: '225,500', change: '+3.89%' },
    { symbol: '051910', name: 'LG화학', price: '412,000', change: '+3.52%' },
    { symbol: '006400', name: '삼성SDI', price: '485,000', change: '+3.21%' },
  ],
  losers: [
    { symbol: '035720', name: '카카오', price: '45,200', change: '-4.85%' },
    { symbol: '003670', name: '포스코퓨처엠', price: '198,000', change: '-3.92%' },
    { symbol: '247540', name: '에코프로비엠', price: '112,500', change: '-3.44%' },
    { symbol: '373220', name: 'LG에너지솔루션', price: '362,000', change: '-2.96%' },
    { symbol: '068270', name: '셀트리온', price: '175,000', change: '-2.51%' },
  ],
  volume: [
    { symbol: '005930', name: '삼성전자', price: '72,400', change: '45,123,456' },
    { symbol: '000660', name: 'SK하이닉스', price: '185,000', change: '12,345,678' },
    { symbol: '035720', name: '카카오', price: '45,200', change: '8,765,432' },
    { symbol: '035420', name: 'NAVER', price: '225,500', change: '6,543,210' },
    { symbol: '051910', name: 'LG화학', price: '412,000', change: '5,432,100' },
  ],
};

export default function TopMovers() {
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'volume'>('gainers');
  const data = DEMO_DATA[activeTab];

  return (
    <section>
      <h2 className="text-lg font-bold mb-4">종목 TOP</h2>
      <div className="bg-dark-700  overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="text-text-secondary text-xs">
                <th className="text-left pb-2 font-normal">#</th>
                <th className="text-left pb-2 font-normal">종목명</th>
                <th className="text-right pb-2 font-normal">현재가</th>
                <th className="text-right pb-2 font-normal">{activeTab === 'volume' ? '거래량' : '등락률'}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={item.symbol} className="border-t border-border/30 hover:bg-dark-600/50">
                  <td className="py-2.5 text-text-secondary text-sm">{idx + 1}</td>
                  <td className="py-2.5">
                    <Link href={`/stocks/${item.symbol}`} className="text-sm hover:text-accent">
                      {item.name}
                    </Link>
                  </td>
                  <td className="py-2.5 text-right text-sm font-mono-price">{item.price}</td>
                  <td className={`py-2.5 text-right text-sm font-mono-price ${
                    activeTab === 'volume' ? 'text-text-secondary' :
                    item.change.startsWith('+') ? 'text-up' : 'text-down'
                  }`}>
                    {item.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
