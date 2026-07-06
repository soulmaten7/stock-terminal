'use client';
import { AiLensBadge, TLensLogo } from '@/components/AiLensBadge';

import { Fragment, useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { useSheetSync, openSheetUrl, closeSheetUrl } from '@/lib/useSheetSync';
import { Star, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import BrokerRanking from './BrokerRanking';
import AdSlotRow from './AdSlotRow';

// 주식·ETF 행 모두 r1w..r1y를 가짐 — 주식은 us-list가 us_stock_perf(크론 미리계산) 조인 + r1y(quote),
// ETF는 us-etf-performance가 한 번에 줌. 두 탭 동일 shape → 전 기간 정렬 가능.
type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  amount?: number; // 거래대금(USD) — 정렬 전용(표시 X)
};

// 하위 카테고리 탭 — 미국 시장 기준(주식 | ETF). 둘 다 라이브(각각 별도 라우트 fetch).
type SubTab = 'stock' | 'etf' | 'reit';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '종목' },
  { key: 'etf', label: 'ETF' },
  { key: 'reit', label: '리츠' },
];

// 기간 드롭다운: 현재가 다음 단일 컬럼을 선택 기간으로 표시(1일부터). 모든 기간이 행에 직접 있음(주식=us-list 조인, ETF=etf-performance).
type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1d', label: '1일전', field: 'changePercent' },
  { key: '1w', label: '1주일전', field: 'r1w' },
  { key: '1m', label: '1개월전', field: 'r1m' },
  { key: '3m', label: '3개월전', field: 'r3m' },
  { key: '6m', label: '6개월전', field: 'r6m' },
  { key: '1y', label: '1년전', field: 'r1y' },
];

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}
// 하위탭별 데이터 소스 — 주식=전종목 목록(us-list, batch quote + us_stock_perf 조인 / 전 기간 포함), ETF=us-etf-performance(기간 포함).
const ENDPOINTS: Record<SubTab, string> = {
  stock: '/api/yahoo/jp-list',
  etf: '/api/yahoo/jp-list?type=etf',
  reit: '/api/yahoo/jp-list?type=reit',
};
const CACHE_KEYS: Record<SubTab, string> = { stock: 'jp-stock-list', etf: 'jp-etf-list', reit: 'jp-reit-list' };

async function fetchRows(tab: SubTab): Promise<Row[]> {
  try {
    const j = await (await fetch(ENDPOINTS[tab])).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y, amount: r.amount,
    }));
  } catch { return []; }
}

export default function JpMarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>(CACHE_KEYS.stock) ?? []);
  const [loading, setLoading] = useState(() => getCache(CACHE_KEYS.stock) === undefined);
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 표시 기간 컬럼 선택값(셀 표시·기간 정렬 대상) — 기본 1일
  const [sortKey, setSortKey] = useState<'name' | 'price' | PeriodKey>('price'); // 정렬 키 — 기본 현재가
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 정렬 방향 — 기본 내림차순
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);

  // 모바일 하단 시트 스냅포인트: 50vh 기본 → 위로 끌면 66vh, 아래로 끌면 축소/닫힘
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // 종목 시트 선택을 URL(?s=)에 동기화 — 종목 페이지에서 "뒤로" 시 그 시트가 복원됨
  useSheetSync(rows, setSelectedStock, setSheetExpanded);
  const selectStock = (next: Row | null) => {
    if (next) { setSelectedStock(next); openSheetUrl(next.symbol); }
    else if (!closeSheetUrl()) setSelectedStock(null);
  };
  const dragStartY = useRef<number | null>(null);
  function onSheetTouchStart(e: ReactTouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onSheetTouchMove(e: ReactTouchEvent) {
    if (dragStartY.current === null) return;
    setSheetDragY(e.touches[0].clientY - dragStartY.current);
  }
  function onSheetTouchEnd() {
    const dy = sheetDragY;
    if (dy < -60) setSheetExpanded(true);
    else if (dy > 90) {
      if (sheetExpanded) setSheetExpanded(false);
      else selectStock(null);
    }
    setSheetDragY(0);
    dragStartY.current = null;
  }
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [periodOpen, setPeriodOpen] = useState(false); // 기간 커스텀 드롭다운 열림(데스크탑)
  const periodRef = useRef<HTMLDivElement>(null);
  const [periodOpenM, setPeriodOpenM] = useState(false); // 기간 커스텀 드롭다운 열림(모바일)
  const periodRefM = useRef<HTMLDivElement>(null);

  // 기간 드롭다운 바깥 클릭 시 닫기 (SelectDropdown 패턴 미러) — KR 미러
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (periodRefM.current && !periodRefM.current.contains(e.target as Node)) setPeriodOpenM(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // 탭별 데이터 로드 — 주식/ETF 각각 별도 라우트·캐시 키(서버 30분 캐시 + 클라 메모리 캐시 SWR).
  // 탭 전환 시 해당 탭 캐시를 즉시 표시 후 백그라운드 재검증.
  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    setSortKey('price'); // 하위탭 전환 시 현재가 내림차순으로 리셋
    setSortDir('desc');
    const key = CACHE_KEYS[tab];
    const cached = getCache<Row[]>(key);
    if (cached) { setRows(cached); setLoading(false); } else { setRows([]); setLoading(true); }
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setCache(key, r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);

  // 관심종목 동기화(로그인 시) — KR과 동일하게 symbol 집합 관리.
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.watchlist) setWatchSet(new Set((j.watchlist as { symbol: string }[]).map((w) => w.symbol)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const toggleWatch = (r: Row) => {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    const add = !watchSet.has(r.symbol);
    setWatchSet((prev) => { const n = new Set(prev); add ? n.add(r.symbol) : n.delete(r.symbol); return n; });
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: r.symbol, name_ko: r.name, market: 'JP', country: 'JP', add }),
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(r.symbol) : n.add(r.symbol); return n; });
    });
  };

  const PAGE_SIZE = 50;
  // 셀 표시용 기간 필드(드롭다운 선택) — 정렬과 별개.
  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'changePercent';
  // 기간 정렬 시 사용할 필드(sortKey가 기간키일 때만). name·price는 별도 분기.
  const sortPeriodField = PERIODS.find((p) => p.key === sortKey)?.field ?? null;
  // sortKey(name|price|기간)로 전 종목 정렬. 기간은 null 항상 뒤로. 검색 필터(티커·이름) 공통.
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortKey === 'name') {
      // 종목명(회사명): 영문 로캘 문자열 비교
      return [...base].sort((a, b) => a.name.localeCompare(b.name, 'en') * dir);
    }
    if (sortKey === 'price') {
      // 현재가: 숫자 비교
      return [...base].sort((a, b) => ((a.price ?? 0) - (b.price ?? 0)) * dir);
    }
    // 기간키: 해당 기간 필드 숫자 비교, null은 항상 뒤로
    if (!sortPeriodField) return base;
    return [...base].sort((a, b) => {
      const av = a[sortPeriodField] as number | null | undefined;
      const bv = b[sortPeriodField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [rows, search, sortKey, sortPeriodField, sortDir]);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));


  function clickHeader(k: 'name' | 'price' | PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  // 정렬 헤더 화살표 — 활성(현재 정렬 키)=▲/▼ accent, 비활성=흐린 ↕(클릭 가능 암시). KR 미러.
  function sortArrow(k: 'name' | 'price' | PeriodKey) {
    if (sortKey !== k) return <ArrowUpDown size={14} className="shrink-0 text-unjong-muted opacity-60" />;
    return sortDir === 'desc'
      ? <ChevronDown size={14} strokeWidth={2.5} className="shrink-0 text-unjong-accent" />
      : <ChevronUp size={14} strokeWidth={2.5} className="shrink-0 text-unjong-accent" />;
  }

  // 기간 셀 값: 선택 기간 필드를 행에서 직접 읽음(주식=us-list 조인, ETF=etf-performance). null=데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    return r[periodField] as number | null | undefined;
  }

  function pageNumbers(): (number | '…')[] {
    const out: (number | '…')[] = [];
    const cur = page + 1;
    const win = 2;
    const start = Math.max(1, cur - win);
    const end = Math.min(totalPages, cur + win);
    if (start > 1) { out.push(1); if (start > 2) out.push('…'); }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages) { if (end < totalPages - 1) out.push('…'); out.push(totalPages); }
    return out;
  }

  return (
    <section className="min-w-0">
      {/* 컨트롤 줄: 좌=하위탭+검색(같은 줄) / 우(w-72)=증권사 바로가기 헤더 — KR 미러 */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {SUBTABS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setTab(s.key)}
                className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors sm:py-1.5 ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="티커·종목명 검색"
              className="w-32 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent sm:w-48"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="shrink-0 text-xs text-unjong-muted hover:text-unjong-accent">초기화</button>}
          </div>
        </div>
        <div className="hidden w-72 shrink-0 lg:block">
          <p className="text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        </div>
      </div>

      {/* 좌: 종목 표 / 우: 증권사 리스트 — KR 미러(flex gap-4) */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">{search ? `"${search}" 검색 결과 없음` : '데이터가 없습니다. 잠시 후 다시 시도해 주세요.'}</p>
          ) : (
            <>
            <div className="mb-1.5 flex items-center gap-3 border-b border-unjong-border pb-2 text-xs sm:hidden">
              <button
                type="button"
                onClick={() => clickHeader('name')}
                className={`inline-flex items-center gap-0.5 transition-colors ${sortKey === 'name' ? 'font-bold text-unjong-accent' : 'text-unjong-muted'}`}
              >
                종목명{sortArrow('name')}
              </button>
              <button
                type="button"
                onClick={() => clickHeader('price')}
                className={`inline-flex items-center gap-0.5 transition-colors ${sortKey === 'price' ? 'font-bold text-unjong-accent' : 'text-unjong-muted'}`}
              >
                현재가{sortArrow('price')}
              </button>
              <div className="flex-1" />
              <span className="inline-flex items-center gap-1">
                <div ref={periodRefM} className="relative w-[4.75rem]">
                  <button
                    type="button"
                    onClick={() => setPeriodOpenM((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={periodOpenM}
                    className={`flex w-full items-center justify-between gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs outline-none hover:border-unjong-accent ${sortKey === period ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                  >
                    {PERIODS.find((p) => p.key === period)?.label ?? '기간'}
                    <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpenM ? 'rotate-180' : ''}`} />
                  </button>
                  {periodOpenM ? (
                    <div role="listbox" className="absolute right-0 top-full z-50 mt-1 w-[4.75rem] overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                      {PERIODS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          role="option"
                          aria-selected={p.key === period}
                          onClick={() => { setPeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpenM(false); }}
                          className={`block w-full px-2 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === period ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button type="button" onClick={() => clickHeader(period)} aria-label="선택 기간 정렬 방향" className="shrink-0 text-unjong-muted">
                  {sortArrow(period)}
                </button>
              </span>
            </div>
            <table className="hidden w-full table-fixed text-sm sm:table sm:min-w-[600px]">
              <thead>
                <tr className="h-[46px] border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">#</th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">
                    <button
                      type="button"
                      onClick={() => clickHeader('name')}
                      aria-label={sortKey === 'name' ? `종목명 ${sortDir === 'desc' ? '내림차순' : '오름차순'}` : '종목명순 정렬'}
                      title="종목명순 정렬(클릭 시 오름/내림 전환)"
                      className={`inline-flex items-center gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'name' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      종목명{sortArrow('name')}
                    </button>
                  </th>
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">
                    <button
                      type="button"
                      onClick={() => clickHeader('price')}
                      aria-label={sortKey === 'price' ? `현재가 ${sortDir === 'desc' ? '내림차순' : '오름차순'}` : '현재가순 정렬'}
                      title="현재가순 정렬(클릭 시 오름/내림 전환)"
                      className={`inline-flex items-center justify-end gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'price' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      현재가{sortArrow('price')}
                    </button>
                  </th>
                  {/* 기간 드롭다운(1일부터) — 선택 기간으로 전 종목 자동 정렬 + 옆 토글로 오름/내림. KR 미러 */}
                  <th className="w-[116px] whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-medium sm:pr-4">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <div ref={periodRef} className="relative w-[4.75rem]">
                        <button
                          type="button"
                          onClick={() => setPeriodOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={periodOpen}
                          className="flex w-full items-center justify-between gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none hover:border-unjong-accent"
                        >
                          {PERIODS.find((p) => p.key === period)?.label ?? '기간'}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                            {PERIODS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                role="option"
                                aria-selected={p.key === period}
                                onClick={() => { setPeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpen(false); }}
                                className={`block w-full px-3 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === period ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => clickHeader(period)}
                        aria-label={sortKey === period ? `선택 기간 ${sortDir === 'desc' ? '오름차순' : '내림차순'}으로 정렬` : '선택 기간으로 정렬'}
                        title="선택 기간순 정렬(클릭 시 오름/내림 전환)"
                        className="shrink-0 transition-colors hover:text-unjong-primary"
                      >
                        {sortArrow(period)}
                      </button>
                    </span>
                  </th>
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <Fragment key={r.symbol}>
                  <tr onClick={() => selectStock(selectedStock?.symbol === r.symbol ? null : r)} className={`cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background ${selectedStock?.symbol === r.symbol ? 'bg-unjong-background' : ''}`}>
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StockLogo code={r.symbol} name={r.name} size={32} />
                        <span className="min-w-0 truncate">
                          <span title={r.name} className="font-bold text-unjong-primary">{r.name}</span>
                          <span className="ml-1.5 text-xs text-unjong-muted">{r.symbol.replace(/\.T$/, '')}</span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'JP') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(periodCell(r))}`}>{periodCell(r) === undefined ? <span className="text-unjong-muted">…</span> : pct(periodCell(r))}</td>
                    <td className="w-9 px-1 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                        aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                        className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} className="mx-auto" />
                      </button>
                    </td>
                  </tr>
                  {/* 데스크탑 전용: 행 클릭 시 1일~1년 수익률 패노라마 펼침(모바일은 하단 시트가 대신) */}
                  {selectedStock?.symbol === r.symbol ? (
                    <tr className="hidden border-b border-unjong-border bg-unjong-background/50 lg:table-row">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-2.5">
                          <span className="text-[11px] font-semibold text-unjong-muted">기간 수익률</span>
                          <AiLensBadge href={`/stock/${r.symbol}`} arrow />
                          {([
                            ['1일전', r.changePercent],
                            ['1주일전', r.r1w],
                            ['1개월전', r.r1m],
                            ['3개월전', r.r3m],
                            ['6개월전', r.r6m],
                            ['1년전', r.r1y],
                          ] as [string, number | null | undefined][]).map(([label, v]) => (
                            <div key={label} className="flex min-w-[3.5rem] flex-col">
                              <span className="text-[11px] text-unjong-muted">{label}</span>
                              <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {/* 10행마다 광고 문의 행 (증권사 사이드바와 동일 패턴, 페이지 마지막 행 뒤엔 생략) */}
                  {(i + 1) % 10 === 0 && i + 1 < paginated.length ? (
                    <tr><td colSpan={5} className="p-0"><AdSlotRow slot="broker" /></td></tr>
                  ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {/* 모바일 전용 카드 리스트 — 1줄 티커·종목명, 2줄 현재가(좌)+선택기간 수익률(우) */}
            <div className="sm:hidden">
              {paginated.map((r, i) => (
                <Fragment key={r.symbol}>
                  <div
                    onClick={() => { setSheetExpanded(false); selectStock(selectedStock?.symbol === r.symbol ? null : r); }}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 active:bg-unjong-background"
                  >
                    <span className="w-5 shrink-0 text-center text-xs tabular-nums text-unjong-muted">{page * PAGE_SIZE + i + 1}</span>
                    <StockLogo code={r.symbol} name={r.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] leading-tight text-unjong-primary"><span className="font-bold">{r.name}</span><span className="ml-1.5 text-xs text-unjong-muted">{r.symbol.replace(/\.T$/, '')}</span></p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xs tabular-nums text-unjong-muted">{r.price ? formatPrice(r.price, 'JP') : '—'}</span>
                        <span className={`shrink-0 text-[13px] tabular-nums font-semibold ${pctColor(periodCell(r))}`}>
                          <span className="mr-1 text-[10px] font-normal text-unjong-muted">{PERIODS.find((p) => p.key === period)?.label}</span>
                          {periodCell(r) === undefined ? '…' : pct(periodCell(r))}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                      aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                      className={`shrink-0 transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border'}`}
                    >
                      <Star size={18} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  {(i + 1) % 10 === 0 && i + 1 < paginated.length ? <AdSlotRow slot="broker" /> : null}
                </Fragment>
              ))}
            </div>
            </>
          )}
          {/* 페이지네이션 — 숫자 페이지 (KR MarketBoard와 동일 방식) */}
          {!loading && sorted.length > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-center gap-1 border-t border-unjong-border px-2 py-3 text-xs">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">←</button>
              {pageNumbers().map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-1 text-unjong-muted">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage((n as number) - 1)}
                    className={`h-7 min-w-[1.75rem] rounded px-1 tabular-nums transition-colors ${page === (n as number) - 1 ? 'bg-unjong-primary font-bold text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
                  >
                    {n}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">→</button>
              <span className="ml-2 text-unjong-muted">총 {sorted.length.toLocaleString()} 종목</span>
            </div>
          )}
        </div>

        {/* 우측: 증권사 리스트(헤더는 위 컨트롤 줄로 이동) — KR과 동일하게 BrokerRanking 재사용 */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="flex h-[46px] items-center border-b border-unjong-border px-1 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
      </div>

      {/* 종목 클릭 → 증권사 바텀시트 (모바일 전용) — KR 미러 */}
      {selectedStock && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => selectStock(null)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl border-t border-unjong-border bg-unjong-surface shadow-xl"
            style={{ height: sheetExpanded ? '66vh' : '50vh', transform: `translateY(${Math.max(0, sheetDragY)}px)`, transition: sheetDragY ? 'none' : 'transform 0.2s ease, height 0.2s ease' }}
          >
            <div
              className="flex shrink-0 touch-none cursor-grab justify-center pb-3 pt-2 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              <div className="mb-3 flex items-center gap-3">
                <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.name}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.symbol.replace(/\.T$/, '')} · {selectedStock.price ? formatPrice(selectedStock.price, 'JP') : '—'}
                    <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                  </p>
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                  {([
                    ['1일전', selectedStock.changePercent],
                    ['1주일전', selectedStock.r1w],
                    ['1개월전', selectedStock.r1m],
                    ['3개월전', selectedStock.r3m],
                    ['6개월전', selectedStock.r6m],
                    ['1년전', selectedStock.r1y],
                  ] as [string, number | null | undefined][]).map(([label, v]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-[11px] text-unjong-muted">{label}</span>
                      <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <a
                href={`/stock/${selectedStock.symbol}`}
                className="mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-unjong-primary py-2.5 text-sm font-semibold text-white active:opacity-90"
              >
                <TLensLogo size={16} color="#2DD4BF" /> AI 렌즈
              </a>
              <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
              <BrokerRanking hideHeader />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
