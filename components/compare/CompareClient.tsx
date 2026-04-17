'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { formatMarketCap, formatNumber } from '@/lib/utils/format';

interface StockBasic {
  symbol: string;
  name_ko: string;
  market: string;
  market_cap: number | null;
}

interface StockFull extends StockBasic {
  price?: number;
  changePercent?: number;
  per?: number;
  pbr?: number;
  high52w?: number;
  low52w?: number;
  loading?: boolean;
  error?: boolean;
}

const COLORS = ['#0ABAB5', '#FF3B30', '#007AFF', '#FF9500'];

export default function CompareClient() {
  const [mounted, setMounted] = useState(false);
  const [stocks, setStocks] = useState<StockFull[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<StockBasic[]>([]);

  useEffect(() => { setMounted(true); }, []);

  // 검색 자동완성 (디바운스)
  useEffect(() => {
    if (!searchInput.trim()) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/stocks/search?q=${encodeURIComponent(searchInput)}&limit=10`)
        .then((r) => r.json())
        .then((d) => setSuggestions(d.stocks ?? []))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchKisData = async (symbol: string): Promise<Partial<StockFull>> => {
    try {
      const r = await fetch(`/api/kis/price?symbol=${symbol}`);
      const d = await r.json();
      if (d.error) return { error: true };
      return {
        price: d.price,
        changePercent: d.changePercent,
        per: d.per,
        pbr: d.pbr,
        high52w: d.high52w,
        low52w: d.low52w,
      };
    } catch {
      return { error: true };
    }
  };

  const addStock = async (basic: StockBasic) => {
    if (stocks.length >= 4 || stocks.some((s) => s.symbol === basic.symbol)) return;
    setSearchInput('');
    setShowSearch(false);
    setSuggestions([]);
    const newStock: StockFull = { ...basic, loading: true };
    setStocks((prev) => [...prev, newStock]);
    const kis = await fetchKisData(basic.symbol);
    setStocks((prev) => prev.map((s) => s.symbol === basic.symbol ? { ...s, ...kis, loading: false } : s));
  };

  const removeStock = (symbol: string) => setStocks((prev) => prev.filter((s) => s.symbol !== symbol));

  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">종목 비교</h1>
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-16 bg-[#F0F0F0] animate-pulse" />))}</div>
      </div>
    );
  }

  const METRICS: { key: keyof StockFull; label: string; fmt: (v: number | undefined) => string; higherIsBetter: boolean }[] = [
    { key: 'market_cap', label: '시가총액', fmt: (v) => formatMarketCap(v ?? null), higherIsBetter: true },
    { key: 'price', label: '현재가', fmt: (v) => v != null ? formatNumber(v) + '원' : '-', higherIsBetter: false },
    { key: 'changePercent', label: '전일대비', fmt: (v) => v != null ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : '-', higherIsBetter: true },
    { key: 'per', label: 'PER', fmt: (v) => v != null && v > 0 ? v.toFixed(1) : '-', higherIsBetter: false },
    { key: 'pbr', label: 'PBR', fmt: (v) => v != null && v > 0 ? v.toFixed(2) : '-', higherIsBetter: false },
    { key: 'high52w', label: '52주 고가', fmt: (v) => v != null && v > 0 ? formatNumber(v) + '원' : '-', higherIsBetter: false },
    { key: 'low52w', label: '52주 저가', fmt: (v) => v != null && v > 0 ? formatNumber(v) + '원' : '-', higherIsBetter: false },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-2">종목 비교</h1>
      <p className="text-[#999999] text-xs mb-6">
        KOSPI + KOSDAQ 전체 2,780종목 검색 · 한투 API 실시간 데이터 · 최대 4종목 비교
      </p>

      {/* Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {stocks.map((s, i) => (
          <div key={s.symbol} className="flex items-center gap-2 px-3 py-1.5 border-[2px] font-bold text-sm" style={{ borderColor: COLORS[i] }}>
            <span style={{ color: COLORS[i] }}>{s.name_ko}</span>
            <span className="text-[#999999] text-xs">{s.symbol}</span>
            <button onClick={() => removeStock(s.symbol)} className="text-[#999999] hover:text-[#FF4D4D]"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {stocks.length < 4 && (
          <div className="relative">
            <button onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-1 px-3 py-1.5 border border-[#E5E7EB] text-sm text-[#999999] font-bold hover:border-[#0ABAB5]">
              <Plus className="w-4 h-4" /> 종목 추가
            </button>
            {showSearch && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-[#E5E7EB] shadow-lg z-50 w-72">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                  <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} autoFocus
                    placeholder="종목명/코드 (예: 삼성전자)" className="w-full pl-8 pr-3 py-2 text-sm border-b border-[#E5E7EB] focus:outline-none" />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {suggestions.length === 0 && searchInput && (
                    <p className="px-4 py-3 text-xs text-[#999999]">검색 결과가 없습니다</p>
                  )}
                  {suggestions.map((s) => (
                    <button key={`${s.symbol}-${s.market}`} onClick={() => addStock(s)}
                      className="w-full text-left px-4 py-2 text-sm text-black font-medium hover:bg-[#F5F5F5] flex justify-between items-center">
                      <span>{s.name_ko} <span className="text-[#999999] text-xs ml-1">{s.symbol}</span></span>
                      <span className="text-[#999999] text-xs">{s.market}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {stocks.length < 2 ? (
        <p className="text-[#999999] text-sm font-bold text-center py-16">비교할 종목을 2개 이상 선택하세요</p>
      ) : (
        <div className="bg-white border-[3px] border-[#0ABAB5] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-black">지표</th>
                {stocks.map((s, i) => (
                  <th key={s.symbol} className="text-right px-4 py-3 font-bold" style={{ color: COLORS[i] }}>
                    {s.name_ko} {s.loading && <span className="text-[10px] text-[#999999]">(불러오는 중...)</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const values = stocks.map((s) => s[m.key] as number | undefined);
                const numeric = values.filter((v) => typeof v === 'number' && v > 0) as number[];
                const best = numeric.length > 0 ? (m.higherIsBetter ? Math.max(...numeric) : Math.min(...numeric)) : null;
                return (
                  <tr key={m.key} className="border-b border-[#F0F0F0]">
                    <td className="px-4 py-2 font-bold text-black">{m.label}</td>
                    {stocks.map((s) => {
                      const v = s[m.key] as number | undefined;
                      const isBest = best != null && typeof v === 'number' && v === best && numeric.length > 1;
                      return (
                        <td key={s.symbol} className={`text-right px-4 py-2 font-mono-price font-bold ${isBest ? 'text-[#0ABAB5] bg-[#0ABAB5]/5' : 'text-black'}`}>
                          {m.fmt(v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[#999999] text-xs mt-6">
        💡 수익률 차트 비교는 다음 업데이트에서 추가됩니다 (FinanceDataReader 12개월 히스토리).
      </p>
    </div>
  );
}
