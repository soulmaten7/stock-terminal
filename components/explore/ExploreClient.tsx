'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // 페이지가 force-dynamic이라 정적 렌더 상실 우려 없음(710C의 SSG 회피 사유 미해당)
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/authStore';
import { homeMarketFor } from '@/stores/countryStore';
import { LENS_COPY, LENS_READINGS, pickLocale, type Locale } from '@/lib/lensCopy';
import type { Tone } from '@/lib/lensTones';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import { pickKrName } from '@/lib/krNameFormat';
import { Star, Search as SearchIcon, X, ArrowLeft } from 'lucide-react';

type Country = 'KR' | 'US';
type LensKey = 'momentum' | 'technical' | 'valuation' | 'lowvol' | 'quality' | 'assetgrowth' | 'fscore';
type Tones = { pos: number; warn: number; flat: number };

type SearchItem = { symbol: string; name: string; country: string; type: 'stock' | 'etf' };
type LensTopItem = { symbol: string; name: string; tones: Tones; price: number | null; changePercent: number | null };
type ChangeItem = {
  symbol: string; name: string | null; lensKey: string;
  fromState: string | null; toState: string; fromTone: Tone | null; toTone: Tone; tradeAmount: number | null;
  price: number | null; changePercent: number | null; nameKo?: string | null; nameEn?: string | null;
};
type ChangesResp = { date: string | null; count?: number; items: ChangeItem[] };
type BoardRow = { symbol: string; name: string; nameEn?: string | null; price: number; changePercent: number; lens?: Tones | null };

const STORAGE_KEY = 'explore_market';
const TONE_DOT: Record<Tone, string> = { pos: 'bg-unjong-accent', warn: 'bg-amber-400', flat: 'bg-unjong-muted' };

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}
function lensName(loc: Locale, key: string): string {
  return (LENS_COPY[loc] as unknown as Record<string, { name: string }>)[key]?.name ?? key;
}
function stateLabel(loc: Locale, key: string, state: string | null): string {
  if (!state) return '—';
  const readings = (LENS_READINGS[loc] as unknown as Record<string, Record<string, { phrase: string }>>)[key];
  return readings?.[state]?.phrase ?? state;
}
// 행 폭이 좁아 괄호 보조어까지 못 담을 때(예 "하락 추세 (200일선 아래)") 메인 상태만 — 원문은 상세에서(STEP 770 §4).
function compactPhrase(s: string): string {
  return s.replace(/\s*\([^)]*\)\s*$/, '');
}
function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}
function weekdayOf(dateStr: string, loc: Locale): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return new Intl.DateTimeFormat(loc === 'en' ? 'en-US' : 'ko-KR', { weekday: 'long', timeZone: 'UTC' }).format(d);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
async function fetchAmountTop(market: Country, limit: number): Promise<BoardRow[]> {
  if (market === 'KR') {
    const j = await fetchJson<{ stocks?: BoardRow[] }>(`/api/krx/ranking?market=all&sort=amount&limit=${limit}`);
    return (j?.stocks ?? []).slice(0, limit);
  }
  const j = await fetchJson<{ items?: BoardRow[] }>('/api/yahoo/us-list');
  return (j?.items ?? []).slice(0, limit);
}

// 칩 스펙(STEP 763 통일 규격) 재사용 — 모바일 44px·rounded-xl·활성=strong, 데스크톱은 sm: 분기로 기존 느낌 보존.
function chipClass(active: boolean): string {
  return `inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-1.5 text-sm font-medium transition-colors sm:min-h-0 sm:rounded-lg sm:font-semibold ${
    active ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'
  }`;
}

function AsOfBadge({ date, loc }: { date: string | null; loc: Locale }) {
  const t = useTranslations('Today');
  if (!date || date === todayUtcDate()) return null;
  return <span className="ml-2 rounded-full bg-unjong-background px-2 py-0.5 text-[13px] font-medium text-unjong-muted sm:text-[11px]">{t('asOfDay', { day: weekdayOf(date, loc) })}</span>;
}

// 섹션 헤더 우측 기준 라벨 — 행마다 붙던 "어제" 프리픽스를 섹션당 한 번으로(STEP 770 §1).
function BasisLabel() {
  const tCommon = useTranslations('Common');
  return <span className="shrink-0 text-[11px] font-medium text-unjong-muted">{tCommon('priceChangeBasis')}</span>;
}

function WatchStar({ symbol, watched, onToggle }: { symbol: string; watched: boolean; onToggle: (symbol: string) => void }) {
  const t = useTranslations('Board');
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(symbol); }}
      aria-label={watched ? t('watchRemove') : t('watchAdd')}
      className={`hidden h-11 w-11 shrink-0 items-center justify-center transition-colors sm:flex ${watched ? 'text-unjong-accent' : 'text-unjong-border'}`}
    >
      <Star size={18} fill={watched ? 'currentColor' : 'none'} />
    </button>
  );
}

function PriceCell({ price, changePercent, market }: { price: number | null; changePercent: number | null; market: Country }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span className="text-[15px] font-semibold tabular-nums text-unjong-primary sm:text-sm">{price != null ? formatPrice(price, market) : '—'}</span>
      <span className={`text-[13px] tabular-nums sm:text-[11px] ${pctColor(changePercent)}`}>{pct(changePercent)}</span>
    </div>
  );
}

function DotsRow({ symbol, name, tones, price, changePercent, market, watched, onToggleWatch }: {
  symbol: string; name: string; tones: Tones | null | undefined; price: number | null; changePercent: number | null; market: Country;
  watched: boolean; onToggleWatch: (symbol: string, name: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 hover:bg-unjong-background/60">
      <Link href={`/stock/${symbol}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <StockLogo code={symbol} name={name} size={30} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[17px] font-semibold text-unjong-primary sm:text-sm">{name}</p>
          {tones ? (
            <span className="flex items-center gap-0.5">
              {Array.from({ length: tones.pos }).map((_, i) => <span key={`p${i}`} className={`h-[6px] w-[6px] shrink-0 rounded-full ${TONE_DOT.pos}`} />)}
              {Array.from({ length: tones.warn }).map((_, i) => <span key={`w${i}`} className={`h-[6px] w-[6px] shrink-0 rounded-full ${TONE_DOT.warn}`} />)}
              {Array.from({ length: tones.flat }).map((_, i) => <span key={`f${i}`} className={`h-[6px] w-[6px] shrink-0 rounded-full ${TONE_DOT.flat}`} />)}
            </span>
          ) : null}
        </div>
        <PriceCell price={price} changePercent={changePercent} market={market} />
      </Link>
      <WatchStar symbol={symbol} watched={watched} onToggle={() => onToggleWatch(symbol, name)} />
    </div>
  );
}

function ChangeRow({ item, loc, market, watched, onToggleWatch }: {
  item: ChangeItem; loc: Locale; market: Country; watched: boolean; onToggleWatch: (symbol: string, name: string) => void;
}) {
  const t = useTranslations('Today');
  const key = item.lensKey as LensKey;
  const line = t('lensChangeLine', {
    lensName: lensName(loc, key),
    from: compactPhrase(stateLabel(loc, key, item.fromState)),
    to: compactPhrase(stateLabel(loc, key, item.toState)),
  });
  // KR 심볼명 = 공용 util(pickKrName·STEP 770 §3, 오늘·탐색 동일 함수) — item.nameKo/nameEn 없으면(US) 원본 폴백.
  const name = pickKrName(loc, item.nameKo, item.nameEn, item.name ?? item.symbol);
  return (
    <div className="flex items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 hover:bg-unjong-background/60">
      <Link href={`/stock/${item.symbol}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <StockLogo code={item.symbol} name={name} size={30} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[17px] font-semibold text-unjong-primary sm:text-sm">{name}</p>
          <p className="flex items-center gap-1.5 truncate text-[15px] text-unjong-muted sm:text-[12px]">
            <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT[item.toTone]}`} />
            {line}
          </p>
        </div>
        <PriceCell price={item.price} changePercent={item.changePercent} market={market} />
      </Link>
      <WatchStar symbol={item.symbol} watched={watched} onToggle={() => onToggleWatch(item.symbol, name)} />
    </div>
  );
}

type ListKey = 'changes' | 'pos' | 'amount';

export default function ExploreClient() {
  const localeRaw = useLocale();
  const loc = pickLocale(localeRaw);
  const lang = loc; // ko|en — API lang 파라미터와 동일 표기
  const t = useTranslations('Explore');
  const tMaterial = useTranslations('LensPreview');
  const tLogin = useTranslations('Login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const listParam = searchParams.get('list');
  const activeList: ListKey | null = listParam === 'changes' || listParam === 'pos' || listParam === 'amount' ? listParam : null;
  const marketParam = searchParams.get('market');
  const marketFromQuery: Country | null = marketParam === 'KR' || marketParam === 'US' ? marketParam : null;
  const { user } = useAuthStore();

  // 국가 토글 초기값 — 쿼리(?market=)가 있으면 우선(오늘 홈 "더 보기" 진입 등·STEP 772 §1), 없으면 localStorage → 로케일 기본.
  const [market, setMarket] = useState<Country>(marketFromQuery ?? (homeMarketFor(localeRaw) === 'US' ? 'US' : 'KR'));
  useEffect(() => {
    if (marketFromQuery) {
      try { localStorage.setItem(STORAGE_KEY, marketFromQuery); } catch { /* 무시 */ }
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'KR' || saved === 'US') setMarket(saved);
    } catch { /* localStorage 불가 환경 무시 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function selectMarket(m: Country) {
    setMarket(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch { /* 무시 */ }
  }

  // 검색
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); setSearchOpen(false); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      const j = await fetchJson<{ items: SearchItem[] }>(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}`);
      setResults(j?.items ?? []);
      setSearchOpen(true);
      setActiveIdx(-1);
      setSearchLoading(false);
    }, 300); // IME 안전: compositionend 대신 값 기반 디바운스만(스펙)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, lang]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function goToResult(item: SearchItem) {
    setSearchOpen(false);
    setQuery('');
    router.push(`/stock/${item.symbol}`);
  }
  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setSearchOpen(false); inputRef.current?.blur(); return; }
    if (!searchOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); goToResult(results[activeIdx]); }
  }

  // 3개 목록
  const [changes, setChanges] = useState<ChangesResp | null>(null);
  const [posTop, setPosTop] = useState<LensTopItem[] | null>(null);
  const [amountTop, setAmountTop] = useState<BoardRow[] | null>(null);
  const [listsFailed, setListsFailed] = useState<{ changes: boolean; pos: boolean; amount: boolean }>({ changes: false, pos: false, amount: false });

  useEffect(() => {
    const limit = activeList ? 50 : 5;
    let alive = true;
    async function run() {
      setChanges(null); setPosTop(null); setAmountTop(null);
      const [ch, pos, amt] = await Promise.all([
        fetchJson<ChangesResp>(`/api/today/changes?market=${market}&limit=${limit}`),
        fetchJson<{ items: LensTopItem[] }>(`/api/explore/lens-top?market=${market}&sort=pos&limit=${limit}&lang=${lang}`),
        fetchAmountTop(market, limit),
      ]);
      if (!alive) return;
      setChanges(ch);
      setPosTop(pos?.items ?? null);
      setAmountTop(amt);
      setListsFailed({ changes: !ch, pos: !pos, amount: amt.length === 0 });
    }
    run();
    return () => { alive = false; };
  }, [market, activeList, lang]);

  // 관심목록(별 토글)
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) { setWatchSet(new Set()); return; }
    fetchJson<{ watchlist?: { symbol: string }[] }>('/api/watchlist').then((j) => {
      if (j?.watchlist) setWatchSet(new Set(j.watchlist.map((w) => w.symbol)));
    });
  }, [user]);
  function toggleWatch(symbol: string, name: string) {
    if (!user) { window.location.href = '/auth/login'; return; }
    const add = !watchSet.has(symbol);
    setWatchSet((prev) => { const n = new Set(prev); add ? n.add(symbol) : n.delete(symbol); return n; });
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, name_ko: name, market: market === 'KR' ? 'KRX' : 'US', country: market, add }),
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(symbol) : n.add(symbol); return n; });
    });
  }

  function Skeleton() {
    return (
      <div className="space-y-2 px-4 py-2 sm:px-0">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded bg-unjong-background" />)}
      </div>
    );
  }

  // ── 풀 리스트 뷰 ──
  if (activeList) {
    const titleKey = activeList === 'changes' ? 'changesTitle' : activeList === 'pos' ? 'posTitle' : 'amountTitle';
    const asOfDate = activeList === 'changes' ? changes?.date ?? null : null;
    return (
      <div className="mx-auto max-w-[680px] py-6 sm:px-6">
        <button type="button" onClick={() => router.back()} className="mb-4 ml-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-accent sm:ml-0">
          <ArrowLeft size={20} />
          {tLogin('back')}
        </button>
        <div className="mb-3 flex items-center justify-between px-4 sm:px-0">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-unjong-primary">{t(market === 'KR' ? 'countryKr' : 'countryUs')} · {t(titleKey)}</h1>
            <AsOfBadge date={asOfDate} loc={loc} />
          </div>
          <BasisLabel />
        </div>
        <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
          {activeList === 'changes' ? (
            changes === null ? <Skeleton /> : changes.items.length === 0 ? <p className="py-6 text-center text-[15px] text-unjong-muted sm:text-sm">{t('noItems')}</p> :
              changes.items.map((item, i) => <ChangeRow key={`${item.symbol}-${item.lensKey}-${i}`} item={item} loc={loc} market={market} watched={watchSet.has(item.symbol)} onToggleWatch={toggleWatch} />)
          ) : activeList === 'pos' ? (
            posTop === null ? <Skeleton /> : posTop.length === 0 ? <p className="py-6 text-center text-[15px] text-unjong-muted sm:text-sm">{t('noItems')}</p> :
              posTop.map((r) => <DotsRow key={r.symbol} symbol={r.symbol} name={r.name} tones={r.tones} price={r.price} changePercent={r.changePercent} market={market} watched={watchSet.has(r.symbol)} onToggleWatch={toggleWatch} />)
          ) : (
            amountTop === null ? <Skeleton /> : amountTop.length === 0 ? <p className="py-6 text-center text-[15px] text-unjong-muted sm:text-sm">{t('noItems')}</p> :
              amountTop.map((r) => <DotsRow key={r.symbol} symbol={r.symbol} name={pickKrName(loc, r.name, r.nameEn, r.name)} tones={r.lens} price={r.price} changePercent={r.changePercent} market={market} watched={watchSet.has(r.symbol)} onToggleWatch={toggleWatch} />)
          )}
        </div>
      </div>
    );
  }

  // ── 메인 뷰 ──
  return (
    <div className="mx-auto max-w-[680px] py-6 sm:px-6">
      {/* 검색 — 주인공 */}
      <div ref={searchBoxRef} className="relative mb-6 px-4 sm:px-0">
        <div className="relative">
          <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-unjong-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setSearchOpen(true); }}
            onKeyDown={onSearchKeyDown}
            placeholder={t('searchPlaceholder')}
            className="h-[52px] w-full rounded-2xl border border-unjong-border bg-unjong-surface pl-11 pr-11 text-[15px] text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent"
          />
          {query ? (
            <button type="button" onClick={() => { setQuery(''); setResults([]); setSearchOpen(false); inputRef.current?.focus(); }} aria-label="clear" className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-unjong-muted">
              <X size={16} />
            </button>
          ) : null}
        </div>
        {searchOpen ? (
          <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-2xl border border-unjong-border bg-unjong-surface py-1.5 shadow-lg">
            {searchLoading ? (
              <Skeleton />
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-[15px] text-unjong-muted sm:text-sm">{t('noSearchResults')}</p>
            ) : (
              results.map((r, i) => (
                <button
                  key={`${r.symbol}-${r.country}`}
                  type="button"
                  role="option"
                  aria-selected={i === activeIdx}
                  onClick={() => goToResult(r)}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-unjong-background ${i === activeIdx ? 'bg-unjong-background' : ''}`}
                >
                  <StockLogo code={r.symbol} name={r.name} size={28} />
                  <span className="min-w-0 flex-1 truncate text-[17px] font-medium text-unjong-primary sm:text-sm">{r.name}</span>
                  <span className="shrink-0 text-[13px] font-medium text-unjong-muted sm:text-[11px]">{r.country}</span>
                  <span className="shrink-0 rounded bg-unjong-background px-1.5 py-0.5 text-[13px] font-medium text-unjong-muted sm:text-[10px]">{r.type.toUpperCase()}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      {/* 국가 토글 */}
      <div className="mb-6 flex gap-1 px-4 sm:px-0">
        <button type="button" onClick={() => selectMarket('KR')} className={chipClass(market === 'KR')}>{t('countryKr')}</button>
        <button type="button" onClick={() => selectMarket('US')} className={chipClass(market === 'US')}>{t('countryUs')}</button>
      </div>

      {/* 목록 1: 오늘 상태가 바뀐 종목 */}
      <section className="mb-7">
        <div className="mb-2 flex items-center justify-between px-4 sm:px-0">
          <div className="flex items-center">
            <h2 className="text-base font-bold text-unjong-primary">{t('changesTitle')}</h2>
            <AsOfBadge date={changes?.date ?? null} loc={loc} />
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {changes && changes.count != null && changes.count > 0 ? (
              <Link href="/explore?list=changes" className="shrink-0 text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('moreCount', { n: changes.count })}</Link>
            ) : null}
            <BasisLabel />
          </div>
        </div>
        {listsFailed.changes ? null : changes === null ? (
          <Skeleton />
        ) : changes.items.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noItems')}</p>
        ) : (
          <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
            {changes.items.slice(0, 5).map((item, i) => (
              <ChangeRow key={`${item.symbol}-${item.lensKey}-${i}`} item={item} loc={loc} market={market} watched={watchSet.has(item.symbol)} onToggleWatch={toggleWatch} />
            ))}
          </div>
        )}
      </section>

      {/* 목록 2: 강점이 많은 종목 */}
      <section className="mb-7">
        <div className="mb-2 flex items-center justify-between px-4 sm:px-0">
          <h2 className="text-base font-bold text-unjong-primary">{t('posTitle')}</h2>
          <div className="flex flex-col items-end gap-0.5">
            {posTop && posTop.length > 0 ? <Link href="/explore?list=pos" className="shrink-0 text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('moreLink')}</Link> : null}
            <BasisLabel />
          </div>
        </div>
        {listsFailed.pos ? null : posTop === null ? (
          <Skeleton />
        ) : posTop.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noItems')}</p>
        ) : (
          <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
            {posTop.slice(0, 5).map((r) => (
              <DotsRow key={r.symbol} symbol={r.symbol} name={r.name} tones={r.tones} price={r.price} changePercent={r.changePercent} market={market} watched={watchSet.has(r.symbol)} onToggleWatch={toggleWatch} />
            ))}
          </div>
        )}
      </section>

      {/* 목록 3: 오늘 거래가 많았던 종목 */}
      <section className="mb-7">
        <div className="mb-2 flex items-center justify-between px-4 sm:px-0">
          <h2 className="text-base font-bold text-unjong-primary">{t('amountTitle')}</h2>
          <div className="flex flex-col items-end gap-0.5">
            {amountTop && amountTop.length > 0 ? <Link href="/explore?list=amount" className="shrink-0 text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('moreLink')}</Link> : null}
            <BasisLabel />
          </div>
        </div>
        {listsFailed.amount ? null : amountTop === null ? (
          <Skeleton />
        ) : amountTop.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noItems')}</p>
        ) : (
          <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
            {amountTop.slice(0, 5).map((r) => (
              <DotsRow key={r.symbol} symbol={r.symbol} name={pickKrName(loc, r.name, r.nameEn, r.name)} tones={r.lens} price={r.price} changePercent={r.changePercent} market={market} watched={watchSet.has(r.symbol)} onToggleWatch={toggleWatch} />
            ))}
          </div>
        )}
      </section>

      <p className="px-4 text-[13px] leading-relaxed text-unjong-muted sm:px-0 sm:text-xs">{tMaterial('material')}</p>
    </div>
  );
}
