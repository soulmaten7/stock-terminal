'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useSheetSync, openSheetUrl, closeSheetUrl } from '@/lib/useSheetSync';
import { Star, ArrowUpDown, ChevronUp, ChevronDown, Hand, Search, X } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import { TONE_DOT_CLASS as TONE_DOT } from '@/lib/lensTones';
import LensPreview from './LensPreview';
import AdSlotRow from './AdSlotRow';
import { saveBoardView, loadBoardView } from '@/lib/boardMemory';

type LensCount = { pos: number; warn: number; flat: number };
function LensDots({ lens, size = 7 }: { lens: LensCount | null | undefined; size?: number }) {
  if (!lens) return null; // 호출부가 필요 시 '—' 표시(모바일 인라인은 아무것도 안 보임)
  const dim = { height: size, width: size };
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {Array.from({ length: lens.pos }).map((_, i) => <span key={`p${i}`} style={dim} className={`shrink-0 rounded-full ${TONE_DOT.pos}`} />)}
      {Array.from({ length: lens.warn }).map((_, i) => <span key={`w${i}`} style={dim} className={`shrink-0 rounded-full ${TONE_DOT.warn}`} />)}
      {Array.from({ length: lens.flat }).map((_, i) => <span key={`f${i}`} style={dim} className={`shrink-0 rounded-full ${TONE_DOT.flat}`} />)}
    </span>
  );
}

type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  amount?: number;
  lens?: LensCount | null; // 선계산 톤 요약(STEP 757) — null=선계산 밖
};

type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1d', label: 'period.1d', field: 'changePercent' },
  { key: '1w', label: 'period.1w', field: 'r1w' },
  { key: '1m', label: 'period.1m', field: 'r1m' },
  { key: '3m', label: 'period.3m', field: 'r3m' },
  { key: '6m', label: 'period.6m', field: 'r6m' },
  { key: '1y', label: 'period.1y', field: 'r1y' },
];

const CACHE_KEY = 'gb-stock-list';

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}

async function fetchRows(): Promise<Row[]> {
  try {
    const j = await (await fetch('/api/yahoo/gb-list')).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y, amount: r.amount,
      lens: r.lens ?? null,
    }));
  } catch { return []; }
}

export default function GbMarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations('Board');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>(CACHE_KEY) ?? []);
  const [loading, setLoading] = useState(() => getCache(CACHE_KEY) === undefined);
  const [period, setPeriod] = useState<PeriodKey>('1d');
  const [sortKey, setSortKey] = useState<'amount' | 'name' | 'price' | PeriodKey>(() => (loadBoardView('GB')?.sortKey as 'amount' | 'name' | 'price' | PeriodKey) ?? 'amount');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>(() => loadBoardView('GB')?.sortDir ?? 'desc');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  useSheetSync(rows, setSelectedStock, setSheetExpanded);
  const selectStock = (next: Row | null) => {
    if (next) { setSelectedStock(next); openSheetUrl(next.symbol); }
    else if (!closeSheetUrl()) setSelectedStock(null);
  };
  const dragStartY = useRef<number | null>(null);
  function onSheetTouchStart(e: ReactTouchEvent) { dragStartY.current = e.touches[0].clientY; }
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
  const [page, setPage] = useState(() => loadBoardView('GB')?.page ?? 0);
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const [periodOpenM, setPeriodOpenM] = useState(false);
  const periodRefM = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false); // 검색 아이콘→펼침(모바일 전용·STEP 763)
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (periodRefM.current && !periodRefM.current.contains(e.target as Node)) setPeriodOpenM(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // firstRun: 렌즈 상세 왕복 복원 시 첫 마운트에선 리셋 스킵(복원값 유지) — fetch는 항상 실행.
  const firstRun = useRef(true);
  useEffect(() => {
    let cancelled = false;
    if (!firstRun.current) { setSearch(''); setPage(0); setSortKey('amount'); setSortDir('desc'); }
    firstRun.current = false;
    const cached = getCache<Row[]>(CACHE_KEY);
    if (cached) { setRows(cached); setLoading(false); } else { setRows([]); setLoading(true); }
    fetchRows().then((r) => { if (!cancelled) { setRows(r); setCache(CACHE_KEY, r); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // 뷰 상태(정렬·페이지) 기억 — 렌즈 상세 왕복 복원용(하위탭 없음).
  useEffect(() => {
    saveBoardView('GB', { sortKey, sortDir, page });
  }, [sortKey, sortDir, page]);

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
      body: JSON.stringify({ symbol: r.symbol, name_ko: r.name, market: 'GB', country: 'GB', add }),
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(r.symbol) : n.add(r.symbol); return n; });
    });
  };

  const PAGE_SIZE = 50;
  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'changePercent';
  const sortPeriodField = PERIODS.find((p) => p.key === sortKey)?.field ?? null;
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortKey === 'amount') return [...base].sort((a, b) => (Number(a.amount ?? 0) - Number(b.amount ?? 0)) * dir);
    if (sortKey === 'name') return [...base].sort((a, b) => a.name.localeCompare(b.name, 'en') * dir);
    if (sortKey === 'price') return [...base].sort((a, b) => ((a.price ?? 0) - (b.price ?? 0)) * dir);
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

  function clickHeader(k: 'amount' | 'name' | 'price' | PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }
  function sortArrow(k: 'amount' | 'name' | 'price' | PeriodKey) {
    if (sortKey !== k) return <ArrowUpDown size={14} className="shrink-0 text-unjong-muted opacity-60" />;
    return sortDir === 'desc'
      ? <ChevronDown size={14} strokeWidth={2.5} className="shrink-0 text-unjong-mint" />
      : <ChevronUp size={14} strokeWidth={2.5} className="shrink-0 text-unjong-mint" />;
  }
  function periodCell(r: Row): number | null | undefined {
    return r[periodField] as number | null | undefined;
  }
  function pageNumbers(): (number | '…')[] {
    const out: (number | '…')[] = [];
    const cur = page + 1; const win = 2;
    const start = Math.max(1, cur - win); const end = Math.min(totalPages, cur + win);
    if (start > 1) { out.push(1); if (start > 2) out.push('…'); }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages) { if (end < totalPages - 1) out.push('…'); out.push(totalPages); }
    return out;
  }

  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* 검색 — 모바일: 44px 아이콘→탭하면 펼침 / 데스크톱: 상시 입력창(불변)·STEP 763 */}
          <div className="flex shrink-0 items-center sm:hidden">
            {searchOpen ? (
              <div className="flex items-center gap-1">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  placeholder={t('search')}
                  className="w-36 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-mint"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearch(''); setPage(0); }}
                  aria-label={t('close')}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-unjong-muted"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={t('search')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-unjong-muted hover:bg-unjong-background"
              >
                <Search size={18} />
              </button>
            )}
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={t('search')}
              className="w-48 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-mint"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="shrink-0 text-xs text-unjong-muted hover:text-unjong-mint">{t('reset')}</button>}
          </div>
        </div>
        <div className="hidden w-96 shrink-0 lg:block" />
      </div>

      {!loading && sorted.length > 0 ? (
        <div className="mb-3 lg:hidden">
          <div className="flex items-center gap-1.5">
            <Hand size={13} className="shrink-0 text-unjong-mint" />
            <p className="text-[13px] text-unjong-primary">{t('lensHint')}</p>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[12px] text-unjong-muted">{t('lensHintNote')}</p>
            <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-unjong-muted">
              <span className="flex items-center gap-0.5"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-mint" />{t('legendPos')}</span>
              <span className="flex items-center gap-0.5"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-amber-400" />{t('legendWarn')}</span>
              <span className="flex items-center gap-0.5"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-muted" />{t('legendFlat')}</span>
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">{search ? t('noResult', { q: search }) : t('noData')}</p>
          ) : (
            <>
            <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-unjong-border pb-2 sm:hidden">
              {/* 종목명 정렬 진입점은 모바일에서 제거(검색으로 대체·데스크톱 테이블 헤더는 유지·STEP 763b) */}
              <button type="button" onClick={() => clickHeader('price')} className={`inline-flex min-h-11 shrink-0 items-center gap-0.5 px-2 text-[14px] transition-colors ${sortKey === 'price' ? 'font-bold text-unjong-mint' : 'text-unjong-muted'}`}>
                {t('colPrice')}{sortArrow('price')}
              </button>
              {/* 기간 드롭다운 — 카드 우측 "1일전 -x.xx%" 열 바로 위(헤더=데이터 열 정렬·STEP 763c) */}
              <span className="inline-flex items-center gap-1">
                <div ref={periodRefM} className="relative w-[4.75rem]">
                  <button type="button" onClick={() => setPeriodOpenM((o) => !o)} aria-haspopup="listbox" aria-expanded={periodOpenM}
                    className={`flex min-h-11 w-full items-center justify-between gap-1 rounded-xl bg-unjong-surface px-3 text-[14px] font-medium outline-none hover:bg-unjong-background ${sortKey === period ? 'font-bold text-unjong-mint' : 'text-unjong-primary'}`}>
                    {t(PERIODS.find((p) => p.key === period)?.label ?? 'periodFallback')}
                    <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpenM ? 'rotate-180' : ''}`} />
                  </button>
                  {periodOpenM ? (
                    <div role="listbox" className="absolute right-0 top-full z-50 mt-0.5 min-w-full overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                      {PERIODS.map((p) => (
                        <button key={p.key} type="button" role="option" aria-selected={p.key === period}
                          onClick={() => { setPeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpenM(false); }}
                          className={`flex min-h-11 w-full items-center justify-end whitespace-nowrap px-3 text-right text-[15px] transition-colors hover:bg-unjong-background ${p.key === period ? 'font-bold text-unjong-mint' : 'text-unjong-primary'}`}>
                          {t(p.label)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button type="button" onClick={() => clickHeader(period)} aria-label={t('sortPeriodDirection')} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-unjong-muted">
                  {sortArrow(period)}
                </button>
              </span>
            </div>
            <table className="hidden w-full table-fixed text-sm sm:table sm:min-w-[600px]">
              <thead>
                <tr className="h-[46px] border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">#</th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">
                    <button type="button" onClick={() => clickHeader('name')}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'name' ? 'font-bold text-unjong-mint' : ''}`}>
                      {t('colName')}{sortArrow('name')}
                    </button>
                  </th>
                  <th className="w-[92px] whitespace-nowrap px-2 py-2.5 text-left font-medium sm:px-3">{t('lensCol')}</th>
                  <th className="w-[120px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">
                    <button type="button" onClick={() => clickHeader('price')}
                      className={`inline-flex items-center justify-end gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'price' ? 'font-bold text-unjong-mint' : ''}`}>
                      {t('colPrice')}{sortArrow('price')}
                    </button>
                  </th>
                  <th className="w-[116px] whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-medium sm:pr-4">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <div ref={periodRef} className="relative w-[4.75rem]">
                        <button type="button" onClick={() => setPeriodOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={periodOpen}
                          className="flex w-full items-center justify-between gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none hover:border-unjong-mint">
                          {t(PERIODS.find((p) => p.key === period)?.label ?? 'periodFallback')}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-0.5 overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                            {PERIODS.map((p) => (
                              <button key={p.key} type="button" role="option" aria-selected={p.key === period}
                                onClick={() => { setPeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpen(false); }}
                                className={`block w-full px-3 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === period ? 'font-bold text-unjong-mint' : 'text-unjong-primary'}`}>
                                {t(p.label)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button type="button" onClick={() => clickHeader(period)} className="shrink-0 transition-colors hover:text-unjong-primary">
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
                          <span className="ml-1.5 text-xs text-unjong-muted">{r.symbol.replace(/\.L$/, '')}</span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 sm:px-3">
                      {r.lens ? <LensDots lens={r.lens} /> : <span className="text-[12px] text-unjong-muted">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'GB') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(periodCell(r))}`}>{periodCell(r) === undefined ? <span className="text-unjong-muted">…</span> : pct(periodCell(r))}</td>
                    <td className="w-9 px-1 py-2.5 text-center">
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                        aria-label={watchSet.has(r.symbol) ? t('watchRemove') : t('watchAdd')}
                        className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-mint' : 'text-unjong-border hover:text-unjong-mint'}`}>
                        <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} className="mx-auto" />
                      </button>
                    </td>
                  </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
            <div className="sm:hidden">
              {paginated.map((r, i) => (
                <Fragment key={r.symbol}>
                  <div onClick={() => { setSheetExpanded(false); selectStock(selectedStock?.symbol === r.symbol ? null : r); }}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 active:bg-unjong-background">
                    <span className="w-5 shrink-0 text-center text-xs tabular-nums text-unjong-muted">{page * PAGE_SIZE + i + 1}</span>
                    <StockLogo code={r.symbol} name={r.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="min-w-0 flex-1 truncate text-[16px] leading-tight text-unjong-primary">
                          <span className="font-bold">{r.name}</span>
                          <span className="ml-1.5 text-xs text-unjong-muted">{r.symbol.replace(/\.L$/, '')}</span>
                        </p>
                        {r.lens ? <LensDots lens={r.lens} size={6} /> : null}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[14px] tabular-nums text-unjong-muted">{r.price ? formatPrice(r.price, 'GB') : '—'}</span>
                        <span className={`shrink-0 text-[14px] tabular-nums font-semibold ${pctColor(periodCell(r))}`}>
                          <span className="mr-1 text-[12px] font-normal text-unjong-muted">{t(PERIODS.find((p) => p.key === period)?.label ?? 'periodFallback')}</span>
                          {periodCell(r) === undefined ? '…' : pct(periodCell(r))}
                        </span>
                      </div>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                      aria-label={watchSet.has(r.symbol) ? t('watchRemove') : t('watchAdd')}
                      className={`shrink-0 p-3 transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-mint' : 'text-unjong-border'}`}>
                      <Star size={18} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </Fragment>
              ))}
            </div>
            <div className="mt-2">
              <AdSlotRow slot="broker" />
            </div>
            </>
          )}
          {!loading && sorted.length > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-center gap-1 border-t border-unjong-border px-2 py-3 text-xs">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">←</button>
              {pageNumbers().map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-1 text-unjong-muted">…</span>
                ) : (
                  <button key={n} type="button" onClick={() => setPage((n as number) - 1)}
                    className={`h-7 min-w-[1.75rem] rounded px-1 tabular-nums transition-colors ${page === (n as number) - 1 ? 'bg-unjong-strong font-bold text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}>
                    {n}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">→</button>
              <span className="ml-2 text-unjong-muted">{t('total', { n: sorted.length.toLocaleString() })}</span>
            </div>
          )}
        </div>

        <aside className="hidden w-96 shrink-0 lg:block lg:sticky lg:top-11 lg:self-start lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
          <LensPreview stock={selectedStock ?? sorted[0] ?? null} market="GB" example={!selectedStock} />
        </aside>
      </div>

      {selectedStock && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => selectStock(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl border-t border-unjong-border bg-unjong-surface shadow-xl"
            style={{ height: sheetExpanded ? '66vh' : '50vh', transform: `translateY(${Math.max(0, sheetDragY)}px)`, transition: sheetDragY ? 'none' : 'transform 0.2s ease, height 0.2s ease' }}>
            <div className="flex shrink-0 touch-none cursor-grab justify-center pb-3 pt-2 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart} onTouchMove={onSheetTouchMove} onTouchEnd={onSheetTouchEnd}>
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              <div className="mb-3 flex items-center gap-3">
                <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.name}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.symbol.replace(/\.L$/, '')} · {selectedStock.price ? formatPrice(selectedStock.price, 'GB') : '—'}
                    <span className={`ml-1 font-sans font-semibold tabular-nums ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                  </p>
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                  {([
                    [t('period.1d'), selectedStock.changePercent],
                    [t('period.1w'), selectedStock.r1w],
                    [t('period.1m'), selectedStock.r1m],
                    [t('period.3m'), selectedStock.r3m],
                    [t('period.6m'), selectedStock.r6m],
                    [t('period.1y'), selectedStock.r1y],
                  ] as [string, number | null | undefined][]).map(([label, v]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-[12px] text-unjong-muted">{label}</span>
                      <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <LensPreview stock={selectedStock} market="GB" compact />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
