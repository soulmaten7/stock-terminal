'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw, Search, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { formatMarketCap } from '@/lib/utils/format';
import PartnerSlot from '@/components/partners/PartnerSlot';
import { useAuthStore } from '@/stores/authStore';
import { addToWatchlist, removeFromWatchlist, getWatchlistSymbols } from '@/lib/watchlist';

interface StockRow {
  symbol: string;
  name_ko: string;
  market: string;
  market_cap: number | null;
  sector: string | null;
  industry: string | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  operating_margin: number | null;
  return_3m: number | null;
  return_6m: number | null;
  return_12m: number | null;
  value_pct: number | null;
  momentum_pct: number | null;
  quality_pct: number | null;
  composite_pct: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  dividend_per_share: number | null;
  div_fiscal_year: number | null;
}

interface ApiResponse {
  stocks: StockRow[];
  total: number;
  page: number;
  limit: number;
  orderBy: string;
  order: 'asc' | 'desc';
}

const 조 = 1_000_000_000_000;
const LIMIT = 50;

interface PresetFilter {
  minCap?: number;
  maxCap?: number;
  minPER?: number;
  maxPER?: number;
  minROE?: number;
  minComposite?: number;
  minMomentum?: number;
  minQuality?: number;
  minValue?: number;
  minYield?: number;
  maxPayout?: number;
}

const PRESETS: Array<{ label: string; icon: string; filter: PresetFilter; orderBy?: string }> = [
  { label: '대형주 (10조+)', icon: '🏢', filter: { minCap: 10 * 조 } },
  { label: '중형주 (1~10조)', icon: '🏬', filter: { minCap: 1 * 조, maxCap: 10 * 조 } },
  { label: '소형주 (1조 미만)', icon: '🏪', filter: { maxCap: 1 * 조 } },
  { label: '퀀트 TOP 100', icon: '🔥', filter: { minComposite: 80 }, orderBy: 'composite_pct' },
  { label: '저PER + 고ROE', icon: '💎', filter: { maxPER: 10, minROE: 15 }, orderBy: 'roe' },
  { label: '모멘텀 강세', icon: '📈', filter: { minMomentum: 80 }, orderBy: 'momentum_pct' },
  { label: '배당 귀족', icon: '💰', filter: { minYield: 4, maxPayout: 60 }, orderBy: 'dividend_yield' },
  { label: '우량 Quality', icon: '🛡️', filter: { minQuality: 80 }, orderBy: 'quality_pct' },
];

interface FilterState {
  market: string[];
  keyword: string;
  minCap: number;
  maxCap: number;
  minPER: number;
  maxPER: number;
  minROE: number;
  minComposite: number;
  minMomentum: number;
  minQuality: number;
  minValue: number;
  minYield: number;
  maxPayout: number;
}

const DEFAULT_FILTER: FilterState = {
  market: ['KOSPI', 'KOSDAQ'],
  keyword: '',
  minCap: 0,
  maxCap: 0,
  minPER: 0,
  maxPER: 0,
  minROE: 0,
  minComposite: 0,
  minMomentum: 0,
  minQuality: 0,
  minValue: 0,
  minYield: 0,
  maxPayout: 0,
};

type SortKey =
  | 'market_cap' | 'per' | 'roe' | 'composite_pct' | 'dividend_yield';
const SORTABLE_COLUMNS: Record<SortKey, string> = {
  market_cap: '시가총액',
  per: 'PER',
  roe: 'ROE',
  composite_pct: '퀀트종합',
  dividend_yield: '배당수익률',
};

function fmtNum(n: number | null | undefined, digits = 2, suffix = ''): string {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return `${Number(n).toFixed(digits)}${suffix}`;
}

function scoreBadge(pct: number | null): { bg: string; text: string } {
  if (pct == null) return { bg: 'bg-[#F0F0F0]', text: 'text-[#999]' };
  if (pct >= 75) return { bg: 'bg-emerald-500/15', text: 'text-emerald-600' };
  if (pct >= 50) return { bg: 'bg-[#0ABAB5]/15', text: 'text-[#0ABAB5]' };
  if (pct >= 25) return { bg: 'bg-amber-500/15', text: 'text-amber-600' };
  return { bg: 'bg-red-500/10', text: 'text-red-600' };
}

export default function ScreenerClient() {
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<SortKey>('market_cap');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [watched, setWatched] = useState<Set<string>>(new Set());

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) { setWatched(new Set()); return; }
    getWatchlistSymbols(user.id).then((syms) => setWatched(new Set(syms)));
  }, [user]);

  // URL 초기 필터 1회
  useEffect(() => {
    if (!mounted) return;
    const urlMarket = searchParams.get('market');
    const urlQ = searchParams.get('q');
    if (!urlMarket && !urlQ) return;

    setFilters((prev) => {
      const next = { ...prev };
      if (urlMarket) {
        const markets = urlMarket.split(',').filter((m) => ['KOSPI', 'KOSDAQ'].includes(m));
        if (markets.length > 0) next.market = markets;
      }
      if (urlQ) next.keyword = urlQ;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => { setPage(1); }, [filters, orderBy, order]);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      setLoading(true);
      const p = new URLSearchParams({
        market: filters.market.join(','),
        page: String(page),
        limit: String(LIMIT),
        orderBy,
        order,
      });
      if (filters.keyword) p.set('q', filters.keyword);
      const addIf = (key: string, val: number) => { if (val > 0) p.set(key, String(val)); };
      addIf('minCap', filters.minCap);
      addIf('maxCap', filters.maxCap);
      addIf('minPER', filters.minPER);
      addIf('maxPER', filters.maxPER);
      addIf('minROE', filters.minROE);
      addIf('minComposite', filters.minComposite);
      addIf('minMomentum', filters.minMomentum);
      addIf('minQuality', filters.minQuality);
      addIf('minValue', filters.minValue);
      addIf('minYield', filters.minYield);
      addIf('maxPayout', filters.maxPayout);

      fetch(`/api/stocks/screener?${p}`)
        .then((r) => r.json())
        .then((d: ApiResponse) => setData(d))
        .catch(() => setData({ stocks: [], total: 0, page: 1, limit: LIMIT, orderBy, order }))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [filters, page, orderBy, order, mounted]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const next: FilterState = { ...DEFAULT_FILTER };
    const f = preset.filter;
    if (f.minCap) next.minCap = f.minCap;
    if (f.maxCap) next.maxCap = f.maxCap;
    if (f.minPER) next.minPER = f.minPER;
    if (f.maxPER) next.maxPER = f.maxPER;
    if (f.minROE) next.minROE = f.minROE;
    if (f.minComposite) next.minComposite = f.minComposite;
    if (f.minMomentum) next.minMomentum = f.minMomentum;
    if (f.minQuality) next.minQuality = f.minQuality;
    if (f.minValue) next.minValue = f.minValue;
    if (f.minYield) next.minYield = f.minYield;
    if (f.maxPayout) next.maxPayout = f.maxPayout;
    setFilters(next);
    if (preset.orderBy) {
      setOrderBy(preset.orderBy as SortKey);
      setOrder('desc');
    }
  };

  const toggleWatch = async (symbol: string) => {
    if (!user) {
      alert('관심종목은 로그인 후 이용 가능합니다.');
      return;
    }
    const was = watched.has(symbol);
    setWatched((prev) => {
      const n = new Set(prev);
      if (was) n.delete(symbol); else n.add(symbol);
      return n;
    });
    const ok = was
      ? await removeFromWatchlist(user.id, symbol)
      : await addToWatchlist(user.id, symbol);
    if (!ok) {
      setWatched((prev) => {
        const n = new Set(prev);
        if (was) n.add(symbol); else n.delete(symbol);
        return n;
      });
    }
  };

  const toggleMarket = (m: string) => {
    const next = filters.market.includes(m)
      ? filters.market.filter((x) => x !== m)
      : [...filters.market, m];
    if (next.length === 0) return;
    setFilters({ ...filters, market: next });
  };

  const toggleSort = (col: SortKey) => {
    if (orderBy === col) {
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setOrderBy(col);
      setOrder('desc');
    }
  };

  if (!mounted) {
    return (
      <div className="px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">종목 발굴</h1>
        <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-12 bg-[#F0F0F0] animate-pulse" />))}</div>
      </div>
    );
  }

  const stocks = data?.stocks ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const SortHeader = ({ col, align = 'right' }: { col: SortKey; align?: 'left' | 'right' | 'center' }) => {
    const active = orderBy === col;
    return (
      <button
        onClick={() => toggleSort(col)}
        className={`flex items-center gap-1 text-sm font-bold ${active ? 'text-[#0ABAB5]' : 'text-[#999]'} hover:text-[#0ABAB5] ${align === 'right' ? 'justify-end ml-auto' : align === 'center' ? 'justify-center mx-auto' : ''}`}
      >
        {SORTABLE_COLUMNS[col]}
        {active && (order === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
      </button>
    );
  };

  return (
    <div className="px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-2">종목 발굴</h1>
      <p className="text-[#999999] text-sm mb-6">
        KOSPI + KOSDAQ 전체 · 퀀트/재무 팩터 기반 필터 · 컬럼 클릭 정렬
      </p>

      {/* Presets */}
      <div className="bg-[#0D1117] p-4 mb-6 flex gap-3 overflow-x-auto">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="shrink-0 px-4 py-2 bg-[#161B22] text-white font-bold text-sm hover:bg-[#C9A96E] border border-[#2D3748]"
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border-[3px] border-[#0ABAB5] p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm font-bold text-black block mb-1">시장</label>
            <div className="flex gap-2">
              {['KOSPI', 'KOSDAQ'].map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMarket(m)}
                  className={`px-3 py-1.5 text-sm font-bold border ${filters.market.includes(m) ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]' : 'bg-white text-[#999999] border-[#E5E7EB]'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-black block mb-1">키워드</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="종목명/코드"
                className="pl-8 pr-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-40"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-black block mb-1">시총 최소(조)</label>
            <input
              type="number"
              value={filters.minCap > 0 ? filters.minCap / 조 : ''}
              onChange={(e) => setFilters({ ...filters, minCap: e.target.value ? Number(e.target.value) * 조 : 0 })}
              placeholder="0"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-black block mb-1">시총 최대(조)</label>
            <input
              type="number"
              value={filters.maxCap > 0 ? filters.maxCap / 조 : ''}
              onChange={(e) => setFilters({ ...filters, maxCap: e.target.value ? Number(e.target.value) * 조 : 0 })}
              placeholder="무제한"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-black block mb-1">PER ≤</label>
            <input
              type="number"
              value={filters.maxPER > 0 ? filters.maxPER : ''}
              onChange={(e) => setFilters({ ...filters, maxPER: e.target.value ? Number(e.target.value) : 0 })}
              placeholder="무제한"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-black block mb-1">ROE ≥ (%)</label>
            <input
              type="number"
              value={filters.minROE > 0 ? filters.minROE : ''}
              onChange={(e) => setFilters({ ...filters, minROE: e.target.value ? Number(e.target.value) : 0 })}
              placeholder="0"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-black block mb-1">퀀트 종합 ≥</label>
            <input
              type="number"
              value={filters.minComposite > 0 ? filters.minComposite : ''}
              onChange={(e) => setFilters({ ...filters, minComposite: e.target.value ? Number(e.target.value) : 0 })}
              placeholder="0"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-black block mb-1">배당수익률 ≥ (%)</label>
            <input
              type="number"
              step="0.1"
              value={filters.minYield > 0 ? filters.minYield : ''}
              onChange={(e) => setFilters({ ...filters, minYield: e.target.value ? Number(e.target.value) : 0 })}
              placeholder="0"
              className="px-3 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm w-20"
            />
          </div>
          <button
            onClick={() => { setFilters(DEFAULT_FILTER); setOrderBy('market_cap'); setOrder('desc'); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-[#999999] hover:text-black"
          >
            <RotateCcw className="w-3 h-3" /> 초기화
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] text-sm text-[#999999] font-bold">
            <tr>
              <th className="text-left px-4 py-3">종목</th>
              <th className="text-left px-4 py-3">시장</th>
              <th className="text-left px-4 py-3">섹터</th>
              <th className="text-right px-4 py-3"><SortHeader col="market_cap" /></th>
              <th className="text-right px-4 py-3"><SortHeader col="per" /></th>
              <th className="text-right px-4 py-3"><SortHeader col="roe" /></th>
              <th className="text-right px-4 py-3"><SortHeader col="dividend_yield" /></th>
              <th className="text-center px-4 py-3"><SortHeader col="composite_pct" align="center" /></th>
              <th className="text-center px-4 py-3 w-10">⭐</th>
            </tr>
          </thead>
          <tbody>
            {loading && stocks.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-[#999999]">불러오는 중...</td></tr>
            )}
            {!loading && stocks.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-[#999999] font-bold">조건에 맞는 종목이 없습니다</td></tr>
            )}
            {stocks.map((s, i) => {
              const badge = scoreBadge(s.composite_pct);
              return (
                <tr key={`${s.symbol}-${s.market}`} className={`border-b border-[#F0F0F0] hover:bg-[#F5F5F5] ${i % 2 === 1 ? 'bg-[#FAFAFA]' : ''}`}>
                  <td className="px-4 py-3">
                    <Link href={`/stocks/${s.symbol}`} className="text-black font-bold hover:text-[#0ABAB5]">{s.name_ko}</Link>
                    <span className="text-[#999999] text-sm ml-1">{s.symbol}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#999999] font-bold">{s.market}</td>
                  <td className="px-4 py-3 text-sm text-[#666666]">{s.sector ?? '-'}</td>
                  <td className="text-right px-4 py-3 font-mono-price font-bold">{formatMarketCap(s.market_cap)}</td>
                  <td className="text-right px-4 py-3 font-mono-price">{fmtNum(s.per, 1)}</td>
                  <td className="text-right px-4 py-3 font-mono-price">{fmtNum(s.roe, 1, '%')}</td>
                  <td className="text-right px-4 py-3 font-mono-price">{fmtNum(s.dividend_yield, 2, '%')}</td>
                  <td className="text-center px-4 py-3">
                    {s.composite_pct != null ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${badge.bg} ${badge.text}`}>
                        {Math.round(s.composite_pct)}
                      </span>
                    ) : <span className="text-[#CCC] text-sm">—</span>}
                  </td>
                  <td className="text-center px-4 py-3">
                    <button
                      onClick={() => toggleWatch(s.symbol)}
                      className={`p-1 transition-colors ${watched.has(s.symbol) ? 'text-[#0ABAB5]' : 'text-[#CCC] hover:text-[#0ABAB5]'}`}
                      aria-label={watched.has(s.symbol) ? '관심종목 제거' : '관심종목 추가'}
                    >
                      <Star className="w-4 h-4" fill={watched.has(s.symbol) ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[#999999] text-sm">
          {total.toLocaleString()}종목 중 {((page - 1) * LIMIT + 1).toLocaleString()}~{Math.min(page * LIMIT, total).toLocaleString()}
        </p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1 text-sm font-bold border border-[#E5E7EB] disabled:opacity-40 hover:border-[#0ABAB5]">이전</button>
          <span className="px-3 py-1 text-sm font-bold text-black">{page} / {totalPages || 1}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1 text-sm font-bold border border-[#E5E7EB] disabled:opacity-40 hover:border-[#0ABAB5]">다음</button>
        </div>
      </div>

      {/* Partner Slot */}
      <div className="mt-8">
        <PartnerSlot slotKey="screener-bottom" variant="card" />
      </div>
    </div>
  );
}
