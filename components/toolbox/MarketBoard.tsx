'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { Star, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import BrokerRanking from './BrokerRanking';
import AdSlotRow from './AdSlotRow';

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
};

type SubTab = 'stock' | 'etf' | 'etn' | 'reit';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
  { key: 'etn', label: 'ETN' },
  { key: 'reit', label: '리츠' },
];

type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row; hideSm?: boolean }[] = [
  { key: '1d', label: '1일전', field: 'changePercent' },
  { key: '1w', label: '1주일전', field: 'r1w' },
  { key: '1m', label: '1개월전', field: 'r1m', hideSm: true },
  { key: '3m', label: '3개월전', field: 'r3m', hideSm: true },
  { key: '6m', label: '6개월전', field: 'r6m', hideSm: true },
  { key: '1y', label: '1년전', field: 'r1y' },
];
// 단일 기간 컬럼 드롭다운 옵션 — 1일부터(고정 1일 컬럼 제거, US 표와 동일). 전 기간 포함.
const DROPDOWN_PERIODS = PERIODS;

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}

async function fetchRows(tab: SubTab): Promise<Row[]> {
  if (tab === 'stock') {
    let raw: Record<string, unknown>[] = [];
    try {
      const j = await (await fetch('/api/krx/ranking?market=all&sort=amount&limit=2600')).json();
      raw = (j.stocks ?? []) as Record<string, unknown>[];
    } catch { raw = []; }
    if (raw.length === 0) {
      try {
        const j = await (await fetch('/api/kis/volume-rank?market=all&sort=amount&limit=100')).json();
        raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
      } catch { raw = []; }
    }
    const rows: Row[] = raw.map((s) => ({
      symbol: String(s.symbol ?? ''),
      name: String(s.name ?? ''),
      price: Number(s.price ?? 0),
      changePercent: Number(s.changePercent ?? 0),
    }));
    try {
      const j = await (await fetch('/api/krx/kr-performance')).json();
      const map: Record<string, Row> = {};
      for (const it of (j.items ?? []) as Row[]) if (it.symbol) map[String(it.symbol)] = it;
      return rows.map((r) => {
        const p = map[r.symbol];
        return p ? { ...r, r1w: p.r1w, r1m: p.r1m, r3m: p.r3m, r6m: p.r6m, r1y: p.r1y } : r;
      });
    } catch { return rows; }
  }
  const api = tab === 'etf' ? '/api/krx/etf-performance' : tab === 'etn' ? '/api/krx/etn-performance' : '/api/yahoo/reit-performance';
  try {
    const j = await (await fetch(api)).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y,
    }));
  } catch { return []; }
}

export default function MarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('market:stock') ?? []);
  const [loading, setLoading] = useState(() => getCache('market:stock') === undefined);
  const [sortKey, setSortKey] = useState<'name' | 'price' | PeriodKey>('price'); // 기본 현재가 정렬
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 기본 내림차순
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d'); // 단일 기간 컬럼 선택값(데스크탑·모바일 공용) — 기본 1일
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);

  // 모바일 하단 시트 스냅포인트: 50vh 기본 → 위로 끌면 66vh, 아래로 끌면 축소/닫힘
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);
  function onSheetTouchStart(e: ReactTouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onSheetTouchMove(e: ReactTouchEvent) {
    if (dragStartY.current === null) return;
    setSheetDragY(e.touches[0].clientY - dragStartY.current); // 음수=위로, 양수=아래로
  }
  function onSheetTouchEnd() {
    const dy = sheetDragY;
    if (dy < -60) setSheetExpanded(true);          // 위로 끌기 → 확장(66vh)
    else if (dy > 90) {
      if (sheetExpanded) setSheetExpanded(false);  // 아래로: 확장상태면 축소(50vh)
      else setSelectedStock(null);                 // 기본상태면 닫기
    }
    setSheetDragY(0);
    dragStartY.current = null;
  }
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [periodOpen, setPeriodOpen] = useState(false); // 기간 커스텀 드롭다운 열림
  const periodRef = useRef<HTMLDivElement>(null);

  // 기간 드롭다운 바깥 클릭 시 닫기 (SelectDropdown 패턴 미러)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

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
      body: JSON.stringify({ symbol: r.symbol, name_ko: r.name, market: 'KRX', country: 'KR', add }),
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(r.symbol) : n.add(r.symbol); return n; });
    });
  };

  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    setSortKey('price'); // 하위탭 전환 시 현재가 내림차순으로 리셋
    setSortDir('desc');
    const ck = 'market:' + tab;
    const cached = getCache<Row[]>(ck);
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setCache(ck, r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);

  // 셀 표시용 기간 필드(드롭다운 선택) — 정렬과 별개. 정렬은 sortKey('name'|'price'|기간)로 결정.
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)?.field ?? PERIODS[0].field;
  // 기간 정렬 시 사용할 필드(sortKey가 기간키일 때만). name·price는 별도 분기.
  const sortPeriodField = PERIODS.find((p) => p.key === sortKey)?.field ?? null;
  const PAGE_SIZE = 50;
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortKey === 'name') {
      // 종목명: 한글 로캘 문자열 비교
      return [...base].sort((a, b) => a.name.localeCompare(b.name, 'ko') * dir);
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
  }, [rows, sortKey, sortPeriodField, sortDir, search]);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  function clickHeader(k: 'name' | 'price' | PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  // 정렬 헤더 화살표 — 활성(현재 정렬 키)=▲/▼ accent, 비활성=흐린 ↕(클릭 가능 암시).
  function sortArrow(k: 'name' | 'price' | PeriodKey) {
    if (sortKey !== k) return <ArrowUpDown size={14} className="shrink-0 text-unjong-muted opacity-60" />;
    return sortDir === 'desc'
      ? <ChevronDown size={14} strokeWidth={2.5} className="shrink-0 text-unjong-accent" />
      : <ChevronUp size={14} strokeWidth={2.5} className="shrink-0 text-unjong-accent" />;
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
      {/* 컨트롤 줄: 좌=하위탭+검색(같은 줄) / 우(w-72)=증권사 바로가기 헤더 */}
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
              placeholder="종목명·코드 검색"
              className="w-32 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent sm:w-48"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="shrink-0 text-xs text-unjong-muted hover:text-unjong-accent">초기화</button>}
          </div>
        </div>
        <div className="hidden w-72 shrink-0 lg:block">
          <p className="text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        </div>
      </div>

      {/* 좌: 종목 표 / 우: 증권사 순위 (기존 미리보기 자리) */}
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
                <select
                  value={mobilePeriod}
                  onChange={(e) => { const p = e.target.value as PeriodKey; setMobilePeriod(p); setSortKey(p); setSortDir('desc'); setPage(0); }}
                  aria-label="기간 선택 및 정렬"
                  className={`rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs outline-none ${sortKey === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                >
                  {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <button type="button" onClick={() => clickHeader(mobilePeriod)} aria-label="선택 기간 정렬 방향" className="text-unjong-muted">
                  {sortArrow(mobilePeriod)}
                </button>
              </span>
            </div>
            <table className="hidden w-full table-fixed text-sm sm:table sm:min-w-[760px]">
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
                  {/* 단일 기간 컬럼: 드롭다운으로 기간 선택(1일부터) + 옆 토글로 해당 기간 정렬(데스크탑·모바일 동일, US 미러) */}
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
                          {DROPDOWN_PERIODS.find((p) => p.key === mobilePeriod)?.label ?? '기간'}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                            {DROPDOWN_PERIODS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                role="option"
                                aria-selected={p.key === mobilePeriod}
                                onClick={() => { setMobilePeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpen(false); }}
                                className={`block w-full px-3 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label={sortKey === mobilePeriod ? `선택 기간 ${sortDir === 'desc' ? '오름차순' : '내림차순'}으로 정렬` : '선택 기간으로 정렬'}
                        title="선택 기간순 정렬(클릭 시 오름/내림 전환)"
                        className="shrink-0 transition-colors hover:text-unjong-primary"
                      >
                        {sortArrow(mobilePeriod)}
                      </button>
                    </span>
                  </th>
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <Fragment key={r.symbol}>
                  <tr onClick={() => setSelectedStock((s) => (s?.symbol === r.symbol ? null : r))} className={`cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background ${selectedStock?.symbol === r.symbol ? 'bg-unjong-background' : ''}`}>
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StockLogo code={r.symbol} name={r.name} size={32} />
                        <span title={r.name} className="truncate font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'KR') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
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
            {/* 모바일 전용 카드 리스트 — 1줄 종목명 풀, 2줄 현재가(좌)+선택기간 수익률(우) */}
            <div className="sm:hidden">
              {paginated.map((r, i) => (
                <Fragment key={r.symbol}>
                  <div
                    onClick={() => { setSheetExpanded(false); setSelectedStock((s) => (s?.symbol === r.symbol ? null : r)); }}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 active:bg-unjong-background"
                  >
                    <span className="w-5 shrink-0 text-center text-xs tabular-nums text-unjong-muted">{page * PAGE_SIZE + i + 1}</span>
                    <StockLogo code={r.symbol} name={r.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold leading-tight text-unjong-primary">{r.name}</p>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="text-xs tabular-nums text-unjong-muted">{r.price ? formatPrice(r.price, 'KR') : '—'}</span>
                        <span className={`shrink-0 tabular-nums font-semibold ${pctColor(r[mobileField] as number | null | undefined)}`}>
                          <span className="mr-1 text-[10px] font-normal text-unjong-muted">{PERIODS.find((p) => p.key === mobilePeriod)?.label}</span>
                          {pct(r[mobileField] as number | null | undefined)}
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
          {/* 페이지네이션 — 숫자 페이지 (리딩방과 동일 방식) */}
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

        {/* 우측: 증권사 리스트(헤더는 위 컨트롤 줄로 이동) — 스크롤 따라오게 sticky */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="flex h-[46px] items-center border-b border-unjong-border px-1 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
      </div>

      {/* 종목 클릭 → 증권사 바로가기 (모바일 전용 — PC는 우측 리스트로 한눈에 보임) */}
      {selectedStock && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedStock(null)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl border-t border-unjong-border bg-unjong-surface shadow-xl"
            style={{ height: sheetExpanded ? '66vh' : '50vh', transform: `translateY(${Math.max(0, sheetDragY)}px)`, transition: sheetDragY ? 'none' : 'transform 0.2s ease, height 0.2s ease' }}
          >
            {/* 드래그 핸들 — 위로 끌면 확장, 아래로 끌면 축소/닫힘 */}
            <div
              className="flex shrink-0 touch-none cursor-grab justify-center pb-3 pt-2 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            {/* 내부 스크롤 — overscroll-contain으로 '당겨서 새로고침' 차단 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              <div className="mb-3 flex items-center gap-3">
                <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.name}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.symbol} · {selectedStock.price ? selectedStock.price.toLocaleString() : '—'}
                    <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                  </p>
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs text-unjong-muted">현재가</span>
                  <span className="text-base font-bold tabular-nums text-unjong-primary">{selectedStock.price ? formatPrice(selectedStock.price, 'KR') : '—'}</span>
                </div>
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
              <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
              <BrokerRanking hideHeader />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
