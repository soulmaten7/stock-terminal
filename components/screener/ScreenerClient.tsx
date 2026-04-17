'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RotateCcw, Search } from 'lucide-react';
import { formatMarketCap } from '@/lib/utils/format';

interface StockRow {
  symbol: string;
  name_ko: string;
  market: string;
  market_cap: number | null;
  sector: string | null;
  industry: string | null;
}

interface ApiResponse {
  stocks: StockRow[];
  total: number;
  page: number;
  limit: number;
}

const 조 = 1_000_000_000_000;

const PRESETS = [
  { label: '대형주 (10조+)', icon: '🏢', filter: { minCap: 10 * 조 } },
  { label: '중형주 (1~10조)', icon: '🏬', filter: { minCap: 1 * 조, maxCap: 10 * 조 } },
  { label: '소형주 (1조 미만)', icon: '🏪', filter: { maxCap: 1 * 조 } },
];

interface FilterState {
  market: string[];
  keyword: string;
  minCap: number;
  maxCap: number;
}
const DEFAULT_FILTER: FilterState = { market: ['KOSPI', 'KOSDAQ'], keyword: '', minCap: 0, maxCap: 0 };

const LIMIT = 50;

export default function ScreenerClient() {
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // 필터 변경 시 page 1로 리셋
  useEffect(() => { setPage(1); }, [filters]);

  // API 호출 (디바운스)
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({
        market: filters.market.join(','),
        page: String(page),
        limit: String(LIMIT),
      });
      if (filters.keyword) params.set('q', filters.keyword);
      if (filters.minCap > 0) params.set('minCap', String(filters.minCap));
      if (filters.maxCap > 0) params.set('maxCap', String(filters.maxCap));

      fetch(`/api/stocks/screener?${params}`)
        .then((r) => r.json())
        .then((d: ApiResponse) => setData(d))
        .catch(() => setData({ stocks: [], total: 0, page: 1, limit: LIMIT }))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [filters, page, mounted]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const p = preset.filter as Partial<FilterState>;
    setFilters({ ...DEFAULT_FILTER, minCap: p.minCap ?? 0, maxCap: p.maxCap ?? 0 });
  };

  const toggleMarket = (m: string) => {
    const next = filters.market.includes(m)
      ? filters.market.filter((x) => x !== m)
      : [...filters.market, m];
    if (next.length === 0) return; // 최소 1개
    setFilters({ ...filters, market: next });
  };

  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">종목 스크리너</h1>
        <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-12 bg-[#F0F0F0] animate-pulse" />))}</div>
      </div>
    );
  }

  const stocks = data?.stocks ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-2">종목 스크리너</h1>
      <p className="text-[#999999] text-xs mb-6">
        KOSPI + KOSDAQ 전체 상장종목 · 시가총액순 · 재무/가격 필터는 다음 업데이트에서 추가
      </p>

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
            <label className="text-xs font-bold text-black block mb-1">시장</label>
            <div className="flex gap-2">
              {['KOSPI', 'KOSDAQ'].map((m) => (
                <button key={m} onClick={() => toggleMarket(m)}
                  className={`px-3 py-1.5 text-xs font-bold border ${filters.market.includes(m) ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]' : 'bg-white text-[#999999] border-[#E5E7EB]'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">키워드</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input type="text" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="종목명/코드" className="pl-8 pr-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-40" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">시총 최소(조)</label>
            <input type="number" value={filters.minCap > 0 ? filters.minCap / 조 : ''}
              onChange={(e) => setFilters({ ...filters, minCap: e.target.value ? Number(e.target.value) * 조 : 0 })}
              placeholder="0" className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-24" />
          </div>
          <div>
            <label className="text-xs font-bold text-black block mb-1">시총 최대(조)</label>
            <input type="number" value={filters.maxCap > 0 ? filters.maxCap / 조 : ''}
              onChange={(e) => setFilters({ ...filters, maxCap: e.target.value ? Number(e.target.value) * 조 : 0 })}
              placeholder="무제한" className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-24" />
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
              <th className="text-left px-3 py-2">시장</th>
              <th className="text-left px-3 py-2">섹터</th>
              <th className="text-right px-3 py-2">시가총액</th>
            </tr>
          </thead>
          <tbody>
            {loading && stocks.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-[#999999]">불러오는 중...</td></tr>
            )}
            {!loading && stocks.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-[#999999] font-bold">조건에 맞는 종목이 없습니다</td></tr>
            )}
            {stocks.map((s, i) => (
              <tr key={`${s.symbol}-${s.market}`} className={`border-b border-[#F0F0F0] hover:bg-[#F5F5F5] ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                <td className="px-3 py-2">
                  <Link href={`/stocks/${s.symbol}`} className="text-black font-bold hover:text-[#0ABAB5]">{s.name_ko}</Link>
                  <span className="text-[#999999] text-xs ml-1">{s.symbol}</span>
                </td>
                <td className="px-3 py-2 text-xs text-[#999999] font-bold">{s.market}</td>
                <td className="px-3 py-2 text-xs text-[#666666]">{s.sector ?? '-'}</td>
                <td className="text-right px-3 py-2 font-mono-price font-bold">{formatMarketCap(s.market_cap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[#999999] text-xs">
          {total.toLocaleString()}종목 중 {((page - 1) * LIMIT + 1).toLocaleString()}~{Math.min(page * LIMIT, total).toLocaleString()}
        </p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1 text-xs font-bold border border-[#E5E7EB] disabled:opacity-40 hover:border-[#0ABAB5]">이전</button>
          <span className="px-3 py-1 text-xs font-bold text-black">{page} / {totalPages || 1}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1 text-xs font-bold border border-[#E5E7EB] disabled:opacity-40 hover:border-[#0ABAB5]">다음</button>
        </div>
      </div>
    </div>
  );
}
