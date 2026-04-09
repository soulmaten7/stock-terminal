'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Star, RotateCcw, Search } from 'lucide-react';

interface StockRow {
  symbol: string; name: string; market: string; price: number; change: number;
  volume: number; per: number; pbr: number; dividendYield: number; foreignRatio: number; marketCap: number;
}

const PRESETS = [
  { label: '거래량 급등', icon: '🔥', filter: { minVolume: 5000000 } },
  { label: '저PER 가치주', icon: '💰', filter: { maxPer: 10 } },
  { label: '고배당', icon: '💎', filter: { minDividend: 3 } },
  { label: '외국인 순매수', icon: '🏦', filter: { minForeign: 30 } },
];

const DUMMY_STOCKS: StockRow[] = [
  { symbol: '005930', name: '삼성전자', market: 'KOSPI', price: 72400, change: 1.68, volume: 15234000, per: 12.3, pbr: 1.4, dividendYield: 2.1, foreignRatio: 55, marketCap: 431 },
  { symbol: '000660', name: 'SK하이닉스', market: 'KOSPI', price: 185000, change: -1.33, volume: 4521000, per: 8.7, pbr: 1.8, dividendYield: 1.2, foreignRatio: 52, marketCap: 134 },
  { symbol: '005380', name: '현대차', market: 'KOSPI', price: 248000, change: 1.43, volume: 1234000, per: 6.2, pbr: 0.7, dividendYield: 3.5, foreignRatio: 35, marketCap: 52 },
  { symbol: '035420', name: 'NAVER', market: 'KOSPI', price: 225500, change: -0.44, volume: 987000, per: 25.1, pbr: 1.3, dividendYield: 0.5, foreignRatio: 48, marketCap: 37 },
  { symbol: '035720', name: '카카오', market: 'KOSPI', price: 45200, change: 1.80, volume: 5678000, per: 45.2, pbr: 2.1, dividendYield: 0.2, foreignRatio: 32, marketCap: 20 },
  { symbol: '373220', name: 'LG에너지솔루션', market: 'KOSPI', price: 362000, change: 1.40, volume: 892000, per: 52.3, pbr: 4.5, dividendYield: 0, foreignRatio: 28, marketCap: 84 },
  { symbol: '207940', name: '삼성바이오', market: 'KOSPI', price: 820000, change: 1.49, volume: 234000, per: 68.1, pbr: 8.2, dividendYield: 0, foreignRatio: 15, marketCap: 54 },
  { symbol: '000270', name: '기아', market: 'KOSPI', price: 125000, change: 1.63, volume: 2345000, per: 5.8, pbr: 0.9, dividendYield: 4.2, foreignRatio: 38, marketCap: 48 },
  { symbol: '005490', name: 'POSCO홀딩스', market: 'KOSPI', price: 385000, change: -0.39, volume: 678000, per: 7.1, pbr: 0.5, dividendYield: 3.8, foreignRatio: 22, marketCap: 32 },
  { symbol: '068270', name: '셀트리온', market: 'KOSPI', price: 175000, change: -1.69, volume: 1567000, per: 32.5, pbr: 3.2, dividendYield: 0.3, foreignRatio: 18, marketCap: 24 },
  { symbol: '247540', name: '에코프로비엠', market: 'KOSDAQ', price: 112500, change: 8.2, volume: 12340000, per: 85.3, pbr: 12.1, dividendYield: 0, foreignRatio: 8, marketCap: 11 },
  { symbol: '086520', name: '에코프로', market: 'KOSDAQ', price: 78900, change: 4.5, volume: 4560000, per: 120.5, pbr: 15.3, dividendYield: 0, foreignRatio: 5, marketCap: 8 },
];

interface FilterState { market: string[]; maxPer: number; minDividend: number; minVolume: number; minForeign: number; keyword: string; }
const DEFAULT_FILTER: FilterState = { market: ['KOSPI', 'KOSDAQ'], maxPer: 999, minDividend: 0, minVolume: 0, minForeign: 0, keyword: '' };

export default function ScreenerClient() {
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [sortKey, setSortKey] = useState<keyof StockRow>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { setMounted(true); }, []);

  const results = useMemo(() => {
    return DUMMY_STOCKS
      .filter((s) => {
        if (!filters.market.includes(s.market)) return false;
        if (s.per > filters.maxPer && filters.maxPer < 999) return false;
        if (s.dividendYield < filters.minDividend) return false;
        if (s.volume < filters.minVolume) return false;
        if (s.foreignRatio < filters.minForeign) return false;
        if (filters.keyword && !s.name.includes(filters.keyword) && !s.symbol.includes(filters.keyword)) return false;
        return true;
      })
      .sort((a, b) => sortDir === 'desc' ? (b[sortKey] as number) - (a[sortKey] as number) : (a[sortKey] as number) - (b[sortKey] as number));
  }, [filters, sortKey, sortDir]);

  const toggleSort = (key: keyof StockRow) => {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const f = { ...DEFAULT_FILTER };
    const p = preset.filter as Partial<FilterState>;
    if (p.maxPer) f.maxPer = p.maxPer;
    if (p.minDividend) f.minDividend = p.minDividend;
    if (p.minVolume) f.minVolume = p.minVolume;
    if (p.minForeign) f.minForeign = p.minForeign;
    setFilters(f);
  };

  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">종목 스크리너</h1>
        <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-12 bg-[#F0F0F0] animate-pulse" />))}</div>
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString('ko-KR');
  const TH = ({ label, k }: { label: string; k: keyof StockRow }) => (
    <th className="text-right px-3 py-2 cursor-pointer hover:text-[#0ABAB5]" onClick={() => toggleSort(k)}>
      {label} {sortKey === k ? (sortDir === 'desc' ? '▼' : '▲') : ''}
    </th>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-6">종목 스크리너</h1>

      {/* Presets */}
      <div className="bg-[#0D1117] p-4 mb-6 flex gap-3 overflow-x-auto">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className="shrink-0 px-4 py-2 bg-[#161B22] text-white font-bold text-sm hover:bg-[#C9A96E] border border-[#2D3748]">
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border-[3px] border-[#0ABAB5] p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-black block mb-1">키워드</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input type="text" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="종목명/코드" className="pl-8 pr-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">PER 최대</label>
            <input type="number" value={filters.maxPer === 999 ? '' : filters.maxPer} onChange={(e) => setFilters({ ...filters, maxPer: e.target.value ? Number(e.target.value) : 999 })}
              placeholder="무제한" className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-24" />
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">배당률 최소</label>
            <input type="number" value={filters.minDividend || ''} onChange={(e) => setFilters({ ...filters, minDividend: Number(e.target.value) || 0 })}
              placeholder="0%" className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-24" />
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">외국인 비중</label>
            <input type="number" value={filters.minForeign || ''} onChange={(e) => setFilters({ ...filters, minForeign: Number(e.target.value) || 0 })}
              placeholder="0%" className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-24" />
          </div>
          <button onClick={() => setFilters(DEFAULT_FILTER)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#999999] hover:text-black">
            <RotateCcw className="w-3 h-3" /> 초기화
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] text-xs text-[#999999] font-bold">
            <tr>
              <th className="text-left px-3 py-2">종목</th>
              <TH label="현재가" k="price" /><TH label="등락률" k="change" /><TH label="거래량" k="volume" />
              <TH label="PER" k="per" /><TH label="PBR" k="pbr" /><TH label="배당률" k="dividendYield" />
              <TH label="외국인" k="foreignRatio" /><th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {results.map((s, i) => (
              <tr key={s.symbol} className={`border-b border-[#F0F0F0] hover:bg-[#F5F5F5] ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                <td className="px-3 py-2">
                  <Link href={`/stocks/${s.symbol}`} className="text-black font-bold hover:text-[#0ABAB5]">{s.name}</Link>
                  <span className="text-[#999999] text-xs ml-1">{s.symbol}</span>
                </td>
                <td className="text-right px-3 py-2 font-mono-price font-bold">{fmt(s.price)}</td>
                <td className={`text-right px-3 py-2 font-mono-price font-bold ${s.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>{s.change >= 0 ? '+' : ''}{s.change}%</td>
                <td className="text-right px-3 py-2 font-mono-price text-[#999999]">{fmt(s.volume)}</td>
                <td className="text-right px-3 py-2 font-mono-price">{s.per.toFixed(1)}</td>
                <td className="text-right px-3 py-2 font-mono-price">{s.pbr.toFixed(1)}</td>
                <td className="text-right px-3 py-2 font-mono-price">{s.dividendYield}%</td>
                <td className="text-right px-3 py-2 font-mono-price">{s.foreignRatio}%</td>
                <td className="px-3 py-2 text-center"><button className="text-[#999999] hover:text-[#C9A96E]"><Star className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 && <p className="text-center py-8 text-[#999999] font-bold text-sm">조건에 맞는 종목이 없습니다</p>}
      </div>
      <p className="text-[#999999] text-xs mt-3">{results.length}종목 / 전체 {DUMMY_STOCKS.length}종목</p>
    </div>
  );
}
