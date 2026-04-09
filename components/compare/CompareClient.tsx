'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';

interface StockData {
  symbol: string; name: string; marketCap: string; per: number; pbr: number;
  roe: number; dividendYield: number; foreignRatio: number; high52w: number; low52w: number;
  priceHistory: number[];
}

const STOCK_DB: Record<string, StockData> = {
  '005930': { symbol: '005930', name: '삼성전자', marketCap: '431조', per: 12.3, pbr: 1.4, roe: 15.2, dividendYield: 2.1, foreignRatio: 55, high52w: 82000, low52w: 58000, priceHistory: [100, 102, 98, 105, 103, 108, 106, 110, 107, 104, 109, 112] },
  '000660': { symbol: '000660', name: 'SK하이닉스', marketCap: '134조', per: 8.7, pbr: 1.8, roe: 18.1, dividendYield: 1.2, foreignRatio: 52, high52w: 215000, low52w: 120000, priceHistory: [100, 105, 110, 108, 115, 120, 118, 125, 122, 128, 130, 135] },
  '005380': { symbol: '005380', name: '현대차', marketCap: '52조', per: 6.2, pbr: 0.7, roe: 12.5, dividendYield: 3.5, foreignRatio: 35, high52w: 280000, low52w: 170000, priceHistory: [100, 103, 101, 106, 108, 105, 110, 112, 109, 115, 118, 120] },
  '035420': { symbol: '035420', name: 'NAVER', marketCap: '37조', per: 25.1, pbr: 1.3, roe: 8.5, dividendYield: 0.5, foreignRatio: 48, high52w: 260000, low52w: 180000, priceHistory: [100, 97, 95, 98, 96, 99, 102, 100, 103, 105, 108, 110] },
};

const ALL_SYMBOLS = Object.keys(STOCK_DB);
const COLORS = ['#0ABAB5', '#FF3B30', '#007AFF', '#FF9500'];

const METRICS: { key: keyof StockData; label: string; fmt?: (v: number) => string }[] = [
  { key: 'marketCap', label: '시가총액' },
  { key: 'per', label: 'PER', fmt: (v) => v.toFixed(1) },
  { key: 'pbr', label: 'PBR', fmt: (v) => v.toFixed(1) },
  { key: 'roe', label: 'ROE', fmt: (v) => v.toFixed(1) + '%' },
  { key: 'dividendYield', label: '배당수익률', fmt: (v) => v.toFixed(1) + '%' },
  { key: 'foreignRatio', label: '외국인비중', fmt: (v) => v + '%' },
  { key: 'high52w', label: '52주 고가', fmt: (v) => v.toLocaleString() },
  { key: 'low52w', label: '52주 저가', fmt: (v) => v.toLocaleString() },
];

export default function CompareClient() {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string[]>(['005930', '000660']);
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const addStock = (sym: string) => {
    if (selected.length < 4 && !selected.includes(sym)) setSelected([...selected, sym]);
    setSearchInput('');
    setShowSearch(false);
  };

  const removeStock = (sym: string) => setSelected(selected.filter((s) => s !== sym));

  const stocks = selected.map((s) => STOCK_DB[s]).filter(Boolean);
  const suggestions = ALL_SYMBOLS.filter((s) => !selected.includes(s) && (STOCK_DB[s].name.includes(searchInput) || s.includes(searchInput)));

  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">종목 비교</h1>
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-16 bg-[#F0F0F0] animate-pulse" />))}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-6">종목 비교</h1>

      {/* Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {stocks.map((s, i) => (
          <div key={s.symbol} className="flex items-center gap-2 px-3 py-1.5 border-[2px] font-bold text-sm" style={{ borderColor: COLORS[i] }}>
            <span style={{ color: COLORS[i] }}>{s.name}</span>
            <button onClick={() => removeStock(s.symbol)} className="text-[#999999] hover:text-[#FF4D4D]"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {selected.length < 4 && (
          <div className="relative">
            <button onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-1 px-3 py-1.5 border border-[#E5E7EB] text-sm text-[#999999] font-bold hover:border-[#0ABAB5]">
              <Plus className="w-4 h-4" /> 종목 추가
            </button>
            {showSearch && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-[#E5E7EB] shadow-lg z-50 w-60">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                  <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} autoFocus
                    placeholder="종목명/코드" className="w-full pl-8 pr-3 py-2 text-sm border-b border-[#E5E7EB] focus:outline-none" />
                </div>
                {suggestions.map((sym) => (
                  <button key={sym} onClick={() => addStock(sym)}
                    className="w-full text-left px-4 py-2 text-sm text-black font-medium hover:bg-[#F5F5F5]">
                    {STOCK_DB[sym].name} <span className="text-[#999999]">{sym}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {stocks.length < 2 ? (
        <p className="text-[#999999] text-sm font-bold text-center py-16">비교할 종목을 2개 이상 선택하세요</p>
      ) : (
        <>
          {/* Chart */}
          <div className="bg-white border-[3px] border-[#0ABAB5] p-6 mb-6">
            <h2 className="text-lg font-bold text-black mb-4">수익률 비교 (최근 12개월, 기준=100)</h2>
            <div className="h-[200px] flex items-end gap-1">
              {stocks[0].priceHistory.map((_, mi) => (
                <div key={mi} className="flex-1 flex items-end gap-px" style={{ height: '100%' }}>
                  {stocks.map((s, si) => {
                    const val = s.priceHistory[mi];
                    return <div key={s.symbol} className="flex-1" style={{ height: `${val * 0.7}%`, backgroundColor: COLORS[si], opacity: 0.8 }} />;
                  })}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              {stocks.map((s, i) => (
                <span key={s.symbol} className="text-xs font-bold" style={{ color: COLORS[i] }}>● {s.name}</span>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border-[3px] border-[#0ABAB5] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-black">지표</th>
                  {stocks.map((s, i) => (
                    <th key={s.symbol} className="text-right px-4 py-3 font-bold" style={{ color: COLORS[i] }}>{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  const values = stocks.map((s) => s[m.key] as number);
                  const best = Math.max(...values);
                  return (
                    <tr key={m.key} className="border-b border-[#F0F0F0]">
                      <td className="px-4 py-2 font-bold text-black">{m.label}</td>
                      {stocks.map((s) => {
                        const v = s[m.key];
                        const isBest = typeof v === 'number' && v === best;
                        return (
                          <td key={s.symbol} className={`text-right px-4 py-2 font-mono-price font-bold ${isBest ? 'text-[#0ABAB5] bg-[#0ABAB5]/5' : 'text-black'}`}>
                            {m.fmt ? m.fmt(v as number) : String(v)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
