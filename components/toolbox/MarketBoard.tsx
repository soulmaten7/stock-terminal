'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSheetSync, openSheetUrl, closeSheetUrl } from '@/lib/useSheetSync';
import { Star, ArrowUpDown, ChevronUp, ChevronDown, Hand, Search, X } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import { TONE_DOT_CLASS as TONE_DOT } from '@/lib/lensTones';
import { BrokerAdTr, BrokerAdCard } from './BrokerAdRow';
import LensPreview from './LensPreview';
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
  nameEn?: string | null;
  price: number | null; // null=결측(→'—'). 0으로 날조 금지(STEP 808 §6)
  changePercent: number | null; // 1일 · null=결측
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  amount?: number; // 거래대금(KRW) — 정렬 전용(표시 X)
  lens?: LensCount | null; // 선계산 톤 요약(KR only·STEP 756) — null=선계산 밖
};

type SubTab = 'stock' | 'etf' | 'etn' | 'reit';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: 'subtab.stock' },
  { key: 'etf', label: 'subtab.etf' },
  { key: 'etn', label: 'subtab.etn' },
  { key: 'reit', label: 'subtab.reit' },
];

type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row; hideSm?: boolean }[] = [
  { key: '1d', label: 'period.1d', field: 'changePercent' },
  { key: '1w', label: 'period.1w', field: 'r1w' },
  { key: '1m', label: 'period.1m', field: 'r1m', hideSm: true },
  { key: '3m', label: 'period.3m', field: 'r3m', hideSm: true },
  { key: '6m', label: 'period.6m', field: 'r6m', hideSm: true },
  { key: '1y', label: 'period.1y', field: 'r1y' },
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
// KR 일일 등락 상한 ±30% 근사(±29.5%부터 상/하한 배지). 색은 기존 상승=빨강/하락=파랑 관례 그대로.
// 판정은 키('upper'|'lower')로, 표시 문구는 t()로 — 로직과 라벨 분리.
function limitBadge(chg: number): 'upper' | 'lower' | null {
  if (chg >= 29.5) return 'upper';
  if (chg <= -29.5) return 'lower';
  return null;
}
function LimitBadge({ chg }: { chg: number | null }) {
  const t = useTranslations('Board');
  if (chg == null) return null; // 결측이면 상/하한 배지 없음(STEP 808 §6)
  const b = limitBadge(chg);
  if (!b) return null;
  return (
    <span className={`ml-1 rounded px-1 text-[12px] font-semibold sm:text-[10px] ${b === 'upper' ? 'bg-unjong-up/10 text-unjong-up' : 'bg-unjong-down/10 text-unjong-down'}`}>
      {t(`limit.${b}`)}
    </span>
  );
}

type KrMarket = 'all' | 'kospi' | 'kosdaq';

async function fetchRows(tab: SubTab, market: KrMarket = 'all'): Promise<Row[]> {
  if (tab === 'stock') {
    let raw: Record<string, unknown>[] = [];
    try {
      const j = await (await fetch('/api/krx/ranking?market=' + market + '&sort=amount&limit=2600')).json();
      raw = (j.stocks ?? []) as Record<string, unknown>[];
    } catch { raw = []; }
    if (raw.length === 0) {
      try {
        const j = await (await fetch('/api/kis/volume-rank?market=' + market + '&sort=amount&limit=100')).json();
        raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
      } catch { raw = []; }
    }
    // 1일전과 1주~1년전을 같은 스냅샷 응답에서 함께 받음 — 두 API 병합 제거(병합 실패 시 1일전만 뜨고 나머지 '—' 되던 버그 방지). null은 undefined로(→'—').
    const num = (v: unknown) => (v == null ? undefined : Number(v));
    const rows: Row[] = raw.map((s) => ({
      symbol: String(s.symbol ?? ''),
      name: String(s.name ?? ''),
      nameEn: (s.nameEn as string | null) ?? null,
      price: num(s.price) ?? null, // 결측이면 null(→'—'). "+0.00%" 보합 날조 금지(STEP 808 §6)
      changePercent: num(s.changePercent) ?? null,
      amount: Number(s.amount ?? 0), // 정렬 전용(표시 X)이라 0 유지 무해
      lens: (s.lens as LensCount | null) ?? null,
      r1w: num(s.r1w), r1m: num(s.r1m), r3m: num(s.r3m), r6m: num(s.r6m), r1y: num(s.r1y),
    }));
    return rows;
  }
  const api = tab === 'etf' ? '/api/krx/etf-performance' : tab === 'etn' ? '/api/krx/etn-performance' : '/api/yahoo/reit-performance';
  try {
    const j = await (await fetch(api)).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y, amount: Number(r.amount ?? 0),
    }));
  } catch { return []; }
}

export default function MarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations('Board');
  const locale = useLocale();
  const isEn = locale === 'en'; // en 화면은 KR 종목명도 영문(야후 name_en)로 — 한글 폴백
  const [tab, setTab] = useState<SubTab>(() => (loadBoardView('KR')?.sub as SubTab) ?? 'stock');
  const [krMarket, setKrMarket] = useState<KrMarket>(() => (loadBoardView('KR')?.market as KrMarket) ?? 'all'); // 코스피/코스닥 세그먼트(주식 탭 전용)
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('market:stock:all') ?? []);
  const [loading, setLoading] = useState(() => getCache('market:stock:all') === undefined);
  const [sortKey, setSortKey] = useState<'amount' | 'name' | 'price' | PeriodKey>(() => (loadBoardView('KR')?.sortKey as 'amount' | 'name' | 'price' | PeriodKey) ?? 'amount'); // 기본 거래대금순
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>(() => loadBoardView('KR')?.sortDir ?? 'desc'); // 기본 내림차순
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d'); // 단일 기간 컬럼 선택값(데스크탑·모바일 공용) — 기본 1일
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
    setSheetDragY(e.touches[0].clientY - dragStartY.current); // 음수=위로, 양수=아래로
  }
  function onSheetTouchEnd() {
    const dy = sheetDragY;
    if (dy < -60) setSheetExpanded(true);          // 위로 끌기 → 확장(66vh)
    else if (dy > 90) {
      if (sheetExpanded) setSheetExpanded(false);  // 아래로: 확장상태면 축소(50vh)
      else selectStock(null);                 // 기본상태면 닫기
    }
    setSheetDragY(0);
    dragStartY.current = null;
  }
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(() => loadBoardView('KR')?.page ?? 0);
  const [periodOpen, setPeriodOpen] = useState(false); // 기간 커스텀 드롭다운 열림(데스크탑)
  const periodRef = useRef<HTMLDivElement>(null);
  const [periodOpenM, setPeriodOpenM] = useState(false); // 기간 커스텀 드롭다운 열림(모바일)
  const periodRefM = useRef<HTMLDivElement>(null);
  const [marketOpenM, setMarketOpenM] = useState(false); // 코스피/코스닥 세그먼트 드롭다운(모바일 정렬줄 통합·STEP 763)
  const marketRefM = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false); // 검색 아이콘→펼침(모바일 전용·STEP 763)
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // 기간·세그먼트 드롭다운 바깥 클릭 시 닫기 (SelectDropdown 패턴 미러)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (periodRefM.current && !periodRefM.current.contains(e.target as Node)) setPeriodOpenM(false);
      if (marketRefM.current && !marketRefM.current.contains(e.target as Node)) setMarketOpenM(false);
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

  // firstRun: 렌즈 상세 왕복 복원 시 첫 마운트에선 리셋 스킵(복원값 유지) — fetch는 항상 실행.
  const firstRun = useRef(true);
  useEffect(() => {
    let cancelled = false;
    if (!firstRun.current) {
      setSearch('');
      setPage(0);
      setSortKey('amount'); // 하위탭 전환 시 거래대금순으로 리셋
      setSortDir('desc');
      setKrMarket('all'); // 하위탭 전환 시 코스피/코스닥 세그먼트도 전체로 리셋
    }
    firstRun.current = false;
    const ck = tab === 'stock' ? `market:stock:${krMarket}` : 'market:' + tab;
    const cached = getCache<Row[]>(ck);
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows(tab, krMarket).then((r) => { if (!cancelled) { setRows(r); setCache(ck, r); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // 뷰 상태(하위탭·세그먼트·정렬·페이지) 기억 — 렌즈 상세 왕복 복원용.
  useEffect(() => {
    saveBoardView('KR', { sub: tab, sortKey, sortDir, page, market: krMarket });
  }, [tab, sortKey, sortDir, page, krMarket]);

  // 코스피/코스닥 세그먼트 전환 — 정렬·검색·기간은 유지, 종목 세트만 재fetch(캐시 분리). 초기 마운트는 위 tab 이펙트가 이미 처리.
  const krMarketMounted = useRef(false);
  useEffect(() => {
    if (!krMarketMounted.current) { krMarketMounted.current = true; return; }
    if (tab !== 'stock') return;
    let cancelled = false;
    setPage(0);
    const ck = `market:stock:${krMarket}`;
    const cached = getCache<Row[]>(ck);
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows('stock', krMarket).then((r) => { if (!cancelled) { setRows(r); setCache(ck, r); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [krMarket]);

  // 셀 표시용 기간 필드(드롭다운 선택) — 정렬과 별개. 정렬은 sortKey('name'|'price'|기간)로 결정.
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)?.field ?? PERIODS[0].field;
  // 기간 정렬 시 사용할 필드(sortKey가 기간키일 때만). name·price는 별도 분기.
  const sortPeriodField = PERIODS.find((p) => p.key === sortKey)?.field ?? null;
  const PAGE_SIZE = 50;
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortKey === 'amount') {
      return [...base].sort((a, b) => (Number(a.amount || 0) - Number(b.amount || 0)) * dir);
    }
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

  function clickHeader(k: 'amount' | 'name' | 'price' | PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  // 정렬 헤더 화살표 — 활성(현재 정렬 키)=▲/▼ accent, 비활성=흐린 ↕(클릭 가능 암시).
  function sortArrow(k: 'amount' | 'name' | 'price' | PeriodKey) {
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
      {/* 컨트롤 줄: 좌=하위탭+검색(같은 줄) / 우(w-96)=렌즈 패널 자리 확보 */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {SUBTABS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setTab(s.key)}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-3 py-2 text-[14px] font-medium transition-colors sm:min-h-0 sm:rounded-lg sm:py-1.5 sm:text-[13px] sm:font-semibold ${tab === s.key ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
              >
                {t(s.label)}
              </button>
            ))}
          </div>
          {/* 검색 — 모바일: 44px 아이콘→탭하면 펼침(자동 포커스·X로 닫기) / 데스크톱: 상시 입력창(불변)·STEP 763 */}
          <div className="flex shrink-0 items-center sm:hidden">
            {searchOpen ? (
              <div className="flex items-center gap-1">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  placeholder={t('searchKr')}
                  className="w-36 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent"
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
                aria-label={t('searchKr')}
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
              placeholder={t('searchKr')}
              className="w-48 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="shrink-0 text-xs text-unjong-muted hover:text-unjong-accent">{t('reset')}</button>}
          </div>
        </div>
        <div className="hidden w-96 shrink-0 lg:block" />
      </div>

      {/* 주식 하위탭 전용: 코스피/코스닥 세그먼트 — 데스크톱은 칩 줄 유지, 모바일은 아래 정렬줄 드롭다운으로 통합(−1층·STEP 763) */}
      {tab === 'stock' ? (
        <div className="mb-2 hidden sm:block">
          <div className="inline-flex gap-0.5 rounded-lg border border-unjong-border p-0.5">
            {(
              [
                { key: 'all', label: t('krMarket.all') },
                { key: 'kospi', label: t('krMarket.kospi') },
                { key: 'kosdaq', label: t('krMarket.kosdaq') },
              ] as { key: KrMarket; label: string }[]
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setKrMarket(m.key)}
                className={`rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${krMarket === m.key ? 'bg-unjong-accent text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 렌즈 힌트 — 상시 표시(1회성 최적화 폐기·STEP 763c). 스크롤로 지나가는 콘텐츠로 취급. */}
      {!loading && sorted.length > 0 ? (
        <div className="mb-3 lg:hidden">
          <div className="flex items-center gap-1.5">
            <Hand size={13} className="shrink-0 text-unjong-accent" />
            <p className="text-[13px] text-unjong-primary">{t('lensHint')}</p>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[12px] text-unjong-muted">{t('lensHintNote')}</p>
            <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-unjong-muted">
              <span className="flex items-center gap-0.5"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-accent" />{t('legendPos')}</span>
              <span className="flex items-center gap-0.5"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-amber-400" />{t('legendWarn')}</span>
              <span className="flex items-center gap-0.5"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-muted" />{t('legendFlat')}</span>
            </span>
          </div>
        </div>
      ) : null}

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
            <p className="py-10 text-center text-sm text-unjong-muted">{search ? t('noResult', { q: search }) : t('noData')}</p>
          ) : (
            <>
            <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-unjong-border pb-2 sm:hidden">
              <div className="flex items-center gap-2">
                {/* 코스피/코스닥 세그먼트 — 모바일은 별도 줄 대신 정렬줄 드롭다운으로 통합(−1층·STEP 763). 44px·13px(STEP 763b) */}
                {tab === 'stock' ? (
                  <div ref={marketRefM} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setMarketOpenM((o) => !o)}
                      aria-haspopup="listbox"
                      aria-expanded={marketOpenM}
                      className="inline-flex min-h-11 items-center gap-0.5 rounded-xl bg-unjong-surface px-3 text-[14px] font-medium text-unjong-primary outline-none hover:bg-unjong-background"
                    >
                      {t(`krMarket.${krMarket}`)}
                      <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${marketOpenM ? 'rotate-180' : ''}`} />
                    </button>
                    {marketOpenM ? (
                      <div role="listbox" className="absolute left-0 top-full z-50 mt-0.5 min-w-full overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                        {(['all', 'kospi', 'kosdaq'] as KrMarket[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            role="option"
                            aria-selected={m === krMarket}
                            onClick={() => { setKrMarket(m); setMarketOpenM(false); }}
                            className={`flex min-h-11 w-full items-center whitespace-nowrap px-3 text-left text-[15px] transition-colors hover:bg-unjong-background ${m === krMarket ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                          >
                            {t(`krMarket.${m}`)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {/* 종목명 정렬 진입점은 모바일에서 제거(검색으로 대체·데스크톱 테이블 헤더는 유지·STEP 763b) */}
                <button
                  type="button"
                  onClick={() => clickHeader('price')}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-0.5 px-2 text-[14px] transition-colors ${sortKey === 'price' ? 'font-bold text-unjong-accent' : 'text-unjong-muted'}`}
                >
                  {t('colPrice')}{sortArrow('price')}
                </button>
              </div>
              {/* 기간 드롭다운 — 카드 우측 "1일전 -x.xx%" 열 바로 위(헤더=데이터 열 정렬·STEP 763c) */}
              <span className="inline-flex items-center gap-1">
                <div ref={periodRefM} className="relative w-[4.75rem]">
                  <button
                    type="button"
                    onClick={() => setPeriodOpenM((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={periodOpenM}
                    className={`flex min-h-11 w-full items-center justify-between gap-1 rounded-xl bg-unjong-surface px-3 text-[14px] font-medium outline-none hover:bg-unjong-background ${sortKey === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                  >
                    {t(PERIODS.find((p) => p.key === mobilePeriod)?.label ?? 'periodFallback')}
                    <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpenM ? 'rotate-180' : ''}`} />
                  </button>
                  {periodOpenM ? (
                    <div role="listbox" className="absolute right-0 top-full z-50 mt-0.5 min-w-full overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                      {PERIODS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          role="option"
                          aria-selected={p.key === mobilePeriod}
                          onClick={() => { setMobilePeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpenM(false); }}
                          className={`flex min-h-11 w-full items-center justify-end whitespace-nowrap px-3 text-right text-[15px] transition-colors hover:bg-unjong-background ${p.key === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                        >
                          {t(p.label)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button type="button" onClick={() => clickHeader(mobilePeriod)} aria-label={t('sortPeriodDirection')} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-unjong-muted">
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
                      aria-label={sortKey === 'name' ? t('sortNameActive', { dir: sortDir === 'desc' ? t('dirDesc') : t('dirAsc') }) : t('sortNameDefault')}
                      title={t('sortNameTitle')}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'name' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      {t('colName')}{sortArrow('name')}
                    </button>
                  </th>
                  <th className="w-[92px] whitespace-nowrap px-2 py-2.5 text-left font-medium sm:px-3">{t('lensCol')}</th>
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">
                    <button
                      type="button"
                      onClick={() => clickHeader('price')}
                      aria-label={sortKey === 'price' ? t('sortPriceActive', { dir: sortDir === 'desc' ? t('dirDesc') : t('dirAsc') }) : t('sortPriceDefault')}
                      title={t('sortPriceTitle')}
                      className={`inline-flex items-center justify-end gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'price' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      {t('colPrice')}{sortArrow('price')}
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
                          {t(DROPDOWN_PERIODS.find((p) => p.key === mobilePeriod)?.label ?? 'periodFallback')}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-0.5 overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                            {DROPDOWN_PERIODS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                role="option"
                                aria-selected={p.key === mobilePeriod}
                                onClick={() => { setMobilePeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpen(false); }}
                                className={`block w-full px-3 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                              >
                                {t(p.label)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label={sortKey === mobilePeriod ? t('sortPeriodActive', { dir: sortDir === 'desc' ? t('dirAsc') : t('dirDesc') }) : t('sortPeriodDefault')}
                        title={t('sortPeriodTitle')}
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
                  <tr onClick={() => selectStock(selectedStock?.symbol === r.symbol ? null : r)} className={`cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background ${selectedStock?.symbol === r.symbol ? 'bg-unjong-background' : ''}`}>
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StockLogo code={r.symbol} name={r.name} size={32} />
                        <span title={r.name} className="truncate font-medium text-unjong-primary">{isEn ? (r.nameEn ?? r.name) : r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 sm:px-3">
                      {r.lens ? <LensDots lens={r.lens} /> : <span className="text-[12px] text-unjong-muted">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'KR') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(r[mobileField] as number | null | undefined)}`}>
                      {pct(r[mobileField] as number | null | undefined)}
                      {mobilePeriod === '1d' ? <LimitBadge chg={r.changePercent} /> : null}
                    </td>
                    <td className="w-9 px-1 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                        aria-label={watchSet.has(r.symbol) ? t('watchRemove') : t('watchAdd')}
                        className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} className="mx-auto" />
                      </button>
                    </td>
                  </tr>
                  {(i + 1) % 10 === 0 && i + 1 < paginated.length ? <BrokerAdTr colSpan={6} /> : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {/* 모바일 전용 카드 리스트 — 1줄 종목명 풀, 2줄 현재가(좌)+선택기간 수익률(우) */}
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
                      <div className="flex items-center gap-1">
                        <p className="min-w-0 flex-1 truncate text-[16px] font-bold leading-tight text-unjong-primary">{isEn ? (r.nameEn ?? r.name) : r.name}</p>
                        {r.lens ? <LensDots lens={r.lens} size={6} /> : null}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="text-[14px] tabular-nums text-unjong-muted">{r.price ? formatPrice(r.price, 'KR') : '—'}</span>
                        <span className={`shrink-0 text-[14px] tabular-nums font-semibold ${pctColor(r[mobileField] as number | null | undefined)}`}>
                          <span className="mr-1 text-[12px] font-normal text-unjong-muted">{t(PERIODS.find((p) => p.key === mobilePeriod)?.label ?? 'periodFallback')}</span>
                          {pct(r[mobileField] as number | null | undefined)}
                          {mobilePeriod === '1d' ? <LimitBadge chg={r.changePercent} /> : null}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                      aria-label={watchSet.has(r.symbol) ? t('watchRemove') : t('watchAdd')}
                      className={`shrink-0 p-3 transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border'}`}
                    >
                      <Star size={18} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  {(i + 1) % 10 === 0 && i + 1 < paginated.length ? <BrokerAdCard /> : null}
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
                    className={`h-7 min-w-[1.75rem] rounded px-1 tabular-nums transition-colors ${page === (n as number) - 1 ? 'bg-unjong-strong font-bold text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
                  >
                    {n}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">→</button>
              <span className="ml-2 text-unjong-muted">{t('total', { n: sorted.length.toLocaleString() })}</span>
            </div>
          )}
        </div>

        {/* 우측: AI 렌즈 미리보기 패널 — 종목 선택 시 수익률+렌즈 표시, 미선택 시 안내 */}
        <aside className="hidden w-96 shrink-0 lg:block lg:sticky lg:top-11 lg:self-start lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
          <LensPreview stock={selectedStock ?? sorted[0] ?? null} market="KR" example={!selectedStock} />
        </aside>
      </div>

      {/* 종목 클릭 → 수익률·렌즈 시트 (모바일 전용 — PC는 우측 렌즈 패널) */}
      {selectedStock && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => selectStock(null)} />
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
                  <p className="font-bold leading-snug text-unjong-primary">{isEn ? (selectedStock.nameEn ?? selectedStock.name) : selectedStock.name}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.symbol} · {selectedStock.price ? selectedStock.price.toLocaleString() : '—'}
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
              <LensPreview stock={selectedStock} market="KR" compact />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
