'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Star, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useCountryStore } from '@/stores/countryStore';
import type { Country } from '@/stores/countryStore';
import { formatNumber, formatMarketCap, formatPercent } from '@/lib/utils/format';
import { canAccessPremium } from '@/lib/utils/permissions';
import PaywallModal from '@/components/common/PaywallModal';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Stock {
  symbol: string;
  name: string;
  market: string;
  sector: string | null;
  current_price: number | null;
  change_percent: number | null;
  volume: number | null;
  market_cap: number | null;
  per: number | null;
  pbr: number | null;
  dividend_yield: number | null;
}

type Tab = 'all' | 'watchlist';
type SortKey = 'name' | 'change_percent' | 'volume' | 'market_cap' | 'per' | 'pbr' | 'dividend_yield';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 50;

const KR_MARKETS = [
  { value: '', label: '전체' },
  { value: 'KOSPI', label: '코스피' },
  { value: 'KOSDAQ', label: '코스닥' },
];

const US_MARKETS = [
  { value: '', label: '전체' },
  { value: 'NASDAQ', label: '나스닥' },
  { value: 'NYSE', label: 'NYSE' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: '종목명' },
  { value: 'change_percent', label: '등락률' },
  { value: 'volume', label: '거래량' },
  { value: 'market_cap', label: '시가총액' },
  { value: 'per', label: 'PER' },
  { value: 'pbr', label: 'PBR' },
  { value: 'dividend_yield', label: '배당수익률' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function StocksPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>}>
      <StocksPage />
    </Suspense>
  );
}

function StocksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user } = useAuthStore();
  const { country } = useCountryStore();

  // Search / filters
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [marketFilter, setMarketFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('market_cap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Data
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Tabs & paywall
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [showPaywall, setShowPaywall] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const marketOptions = country === 'KR' ? KR_MARKETS : US_MARKETS;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ── Fetch watchlist ────────────────────────────────────────────────────────

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlistSymbols(new Set());
      return;
    }
    const { data } = await supabase
      .from('watchlists')
      .select('symbol')
      .eq('user_id', user.id)
      .eq('country', country);

    setWatchlistSymbols(new Set((data ?? []).map((w: { symbol: string }) => w.symbol)));
  }, [supabase, user, country]);

  // ── Fetch stocks ───────────────────────────────────────────────────────────

  const fetchStocks = useCallback(async () => {
    setLoading(true);

    let qb = supabase
      .from('stocks')
      .select('symbol,name,market,sector,current_price,change_percent,volume,market_cap,per,pbr,dividend_yield', {
        count: 'exact',
      })
      .eq('country', country);

    // Tab: watchlist
    if (activeTab === 'watchlist') {
      if (watchlistSymbols.size === 0) {
        setStocks([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      qb = qb.in('symbol', Array.from(watchlistSymbols));
    }

    // Search
    if (query.trim()) {
      const q = query.trim();
      qb = qb.or(`symbol.ilike.%${q}%,name.ilike.%${q}%`);
    }

    // Market filter
    if (marketFilter) {
      qb = qb.eq('market', marketFilter);
    }

    // Sector filter
    if (sectorFilter) {
      qb = qb.eq('sector', sectorFilter);
    }

    // Sorting
    const ascending = sortDir === 'asc';
    qb = qb.order(sortKey, { ascending, nullsFirst: false });

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    qb = qb.range(from, to);

    const { data, count, error } = await qb;

    if (!error) {
      setStocks((data as Stock[]) ?? []);
      setTotalCount(count ?? 0);
    } else {
      setStocks([]);
      setTotalCount(0);
    }

    setLoading(false);
  }, [supabase, country, activeTab, watchlistSymbols, query, marketFilter, sectorFilter, sortKey, sortDir, page]);

  // ── Fetch sectors for dropdown ─────────────────────────────────────────────

  const fetchSectors = useCallback(async () => {
    const { data } = await supabase
      .from('stocks')
      .select('sector')
      .eq('country', country)
      .not('sector', 'is', null);

    if (data) {
      const unique = Array.from(new Set<string>(data.map((d: { sector: string }) => d.sector))).sort();
      setSectors(unique);
    }
  }, [supabase, country]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [query, marketFilter, sectorFilter, sortKey, sortDir, activeTab, country]);

  // ── Watchlist toggle ───────────────────────────────────────────────────────

  const toggleWatchlist = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const isWatched = watchlistSymbols.has(symbol);
    const next = new Set(watchlistSymbols);

    if (isWatched) {
      await supabase.from('watchlists').delete().eq('user_id', user.id).eq('symbol', symbol);
      next.delete(symbol);
    } else {
      await supabase.from('watchlists').insert({
        user_id: user.id,
        symbol,
        country,
        market: stocks.find((s) => s.symbol === symbol)?.market ?? '',
        display_order: watchlistSymbols.size,
      });
      next.add(symbol);
    }

    setWatchlistSymbols(next);
  };

  // ── Row click ──────────────────────────────────────────────────────────────

  const handleRowClick = (symbol: string) => {
    if (canAccessPremium(user?.role)) {
      router.push(`/stocks/${symbol}`);
    } else {
      setShowPaywall(true);
    }
  };

  // ── Change percent color ───────────────────────────────────────────────────

  const changeColor = (v: number | null) => {
    if (v == null) return 'text-text-secondary';
    if (v > 0) return 'text-up';
    if (v < 0) return 'text-down';
    return 'text-text-secondary';
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (showPaywall) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <button
          onClick={() => setShowPaywall(false)}
          className="text-text-secondary text-sm mb-4 hover:text-text-primary"
        >
          &larr; 목록으로 돌아가기
        </button>
        <PaywallModal />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">
      {/* ── Search Bar ──────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="종목명 또는 종목코드를 입력하세요 (예: 삼성전자, 005930, AAPL)"
            className="w-full pl-12 pr-4 py-3 bg-dark-700 border border-border rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
        </div>
      </div>

      {/* ── Filter / Sort Bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Market filter */}
        <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-1">
          {marketOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMarketFilter(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                marketFilter === opt.value
                  ? 'bg-accent text-dark-900 font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sector dropdown */}
        <div className="relative">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="appearance-none bg-dark-700 border border-border rounded-lg pl-3 pr-8 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          >
            <option value="">전체 섹터</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>

        {/* Sort dropdown */}
        <div className="relative ml-auto">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none bg-dark-700 border border-border rounded-lg pl-3 pr-8 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        </div>

        {/* Sort direction toggle */}
        <button
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="bg-dark-700 border border-border rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          {sortDir === 'asc' ? '오름차순' : '내림차순'}
        </button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          전체 종목
        </button>
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'watchlist'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          내 관심종목
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-dark-700 rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="px-3 py-3 text-center w-10">{/* star */}</th>
              <th className="px-3 py-3 text-left">종목코드</th>
              <th className="px-3 py-3 text-left">종목명</th>
              <th className="px-3 py-3 text-right">현재가</th>
              <th className="px-3 py-3 text-right">등락률</th>
              <th className="px-3 py-3 text-right">거래량</th>
              <th className="px-3 py-3 text-right">시가총액</th>
              <th className="px-3 py-3 text-right">PER</th>
              <th className="px-3 py-3 text-right">PBR</th>
              <th className="px-3 py-3 text-right">배당수익률</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-20 text-text-secondary">
                  로딩 중...
                </td>
              </tr>
            ) : stocks.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-20 text-text-secondary">
                  {activeTab === 'watchlist'
                    ? '관심종목이 없습니다. 종목 목록에서 별표를 눌러 추가해보세요.'
                    : '검색 결과가 없습니다.'}
                </td>
              </tr>
            ) : (
              stocks.map((stock) => (
                <tr
                  key={stock.symbol}
                  onClick={() => handleRowClick(stock.symbol)}
                  className="border-b border-border last:border-b-0 hover:bg-dark-600/50 cursor-pointer transition-colors"
                >
                  {/* Watchlist toggle */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={(e) => toggleWatchlist(e, stock.symbol)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          watchlistSymbols.has(stock.symbol)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-text-secondary'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Symbol */}
                  <td className="px-3 py-3 text-text-secondary font-mono text-xs">
                    {stock.symbol}
                  </td>

                  {/* Name */}
                  <td className="px-3 py-3 text-text-primary font-medium">
                    {stock.name}
                  </td>

                  {/* Current price */}
                  <td className="px-3 py-3 text-right text-text-primary tabular-nums">
                    {formatNumber(stock.current_price)}
                  </td>

                  {/* Change percent */}
                  <td className={`px-3 py-3 text-right tabular-nums ${changeColor(stock.change_percent)}`}>
                    {formatPercent(stock.change_percent)}
                  </td>

                  {/* Volume */}
                  <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                    {formatNumber(stock.volume)}
                  </td>

                  {/* Market cap */}
                  <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                    {formatMarketCap(stock.market_cap)}
                  </td>

                  {/* PER */}
                  <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                    {stock.per != null ? stock.per.toFixed(2) : '-'}
                  </td>

                  {/* PBR */}
                  <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                    {stock.pbr != null ? stock.pbr.toFixed(2) : '-'}
                  </td>

                  {/* Dividend yield */}
                  <td className="px-3 py-3 text-right text-text-secondary tabular-nums">
                    {stock.dividend_yield != null ? `${stock.dividend_yield.toFixed(2)}%` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-lg bg-dark-700 border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm text-text-secondary px-3">
            {page} / {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-lg bg-dark-700 border border-border text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
