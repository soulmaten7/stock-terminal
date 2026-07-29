'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // 페이지가 force-dynamic이라 정적 렌더 상실 우려 없음(710C의 SSG 회피 사유 미해당)
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/authStore';
import { homeMarketFor } from '@/stores/countryStore';
import { AsOfBadge } from '@/components/ui/AsOfBadge';
import { LENS_READINGS, compactPhrase, lensDisplayName, lensStateLabel, pickLocale, type Locale } from '@/lib/lensCopy';
import { TONE_DOT_CLASS as TONE_DOT, TONE_TEXT_CLASS, changeColorClass, type Tone } from '@/lib/lensTones';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice, formatTradeValue } from '@/lib/currency';
import { resolveDisplayName } from '@/lib/displayName';
import { groupBySymbol } from '@/lib/groupChanges';
import { WatchStar } from '@/components/common/WatchStar';
import { PageShell } from '@/components/layout/PageShell';
import { Search as SearchIcon, X, ArrowLeft } from 'lucide-react';

type Country = 'KR' | 'US';
type LensKey = 'momentum' | 'technical' | 'valuation' | 'lowvol' | 'quality' | 'assetgrowth' | 'fscore';
type Tones = { pos: number; warn: number; flat: number };

type SearchItem = { symbol: string; name: string; country: string; type: 'stock' | 'etf' };
type LensTopItem = {
  symbol: string; name: string; tones: Tones; price: number | null; changePercent: number | null;
  topLensKey?: string | null; topLensState?: string | null;
};
type ChangeItem = {
  symbol: string; name: string | null; lensKey: string;
  fromState: string | null; toState: string; fromTone: Tone | null; toTone: Tone; tradeAmount: number | null;
  price: number | null; changePercent: number | null; nameKo?: string | null; nameEn?: string | null;
};
type ToneCounts = { total: number; pos: number; warn: number };
type ChangesResp = { date: string | null; count?: number; counts?: ToneCounts; items: ChangeItem[]; failed?: boolean };
// tradeAmount(KR·krx/ranking)·amount(US·yahoo/us-list) — 소스별 필드명이 달라 rowTradeAmount()로 흡수.
type BoardRow = {
  symbol: string; name: string; nameEn?: string | null; price: number; changePercent: number; lens?: Tones | null;
  tradeAmount?: number | null; amount?: number | null;
};
function rowTradeAmount(r: BoardRow): number | null {
  return r.tradeAmount ?? r.amount ?? null;
}

const STORAGE_KEY = 'explore_market';
const RECENTS_KEY = 'explore_recent_searches';

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function stateLabel(loc: Locale, key: string, state: string | null): string {
  if (!state) return '—';
  const readings = (LENS_READINGS[loc] as unknown as Record<string, Record<string, { phrase: string }>>)[key];
  return readings?.[state]?.phrase ?? state;
}
// 행 폭이 좁아 괄호 보조어까지 못 담을 때(예 "하락 추세 (200일선 아래)") 메인 상태만 — 원문은 상세에서(STEP 770 §4).
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
// 실패(null)와 빈 결과([])를 구분해 반환 — 호출부가 '실패'와 '없음'을 다르게 표시(STEP 804 §4).
// asOf = 데이터 기준일(KR 스냅샷 bas_dd) — 화면이 AsOfBadge로 데이터 나이 표시(STEP 804 §2).
async function fetchAmountTop(market: Country, limit: number): Promise<{ rows: BoardRow[]; asOf: string | null } | null> {
  if (market === 'KR') {
    const j = await fetchJson<{ stocks?: BoardRow[]; asOf?: string | null }>(`/api/krx/ranking?market=all&sort=amount&limit=${limit}`);
    return j === null ? null : { rows: (j.stocks ?? []).slice(0, limit), asOf: j.asOf ?? null };
  }
  const j = await fetchJson<{ items?: BoardRow[] }>('/api/yahoo/us-list');
  return j === null ? null : { rows: (j.items ?? []).slice(0, limit), asOf: null };
}

// 칩 스펙(STEP 763 통일 규격) 재사용 — 모바일 44px·rounded-xl·활성=strong, 데스크톱은 sm: 분기로 기존 느낌 보존.
function chipClass(active: boolean): string {
  return `inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-1.5 text-sm font-medium transition-colors sm:min-h-0 sm:rounded-lg sm:font-semibold ${
    active ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background active:bg-unjong-background'
  }`;
}

// AsOfBadge는 components/ui/AsOfBadge로 공용화(STEP 829 §7).

// 섹션 헤더 우측 기준 라벨 — 행마다 붙던 "어제" 프리픽스를 섹션당 한 번으로(STEP 770 §1).
function BasisLabel() {
  const tCommon = useTranslations('Common');
  return <span className="shrink-0 text-[11px] font-medium text-unjong-muted">{tCommon('priceChangeBasis')}</span>;
}

// 변화 풀리스트 전용 — 거래대금 정렬 목록이라 선정 기준까지 명시(STEP 775 §1, 오늘 화면 772 라벨과 동일 키 재사용).
function SelectionBasisLabel() {
  const tToday = useTranslations('Today');
  return <span className="shrink-0 text-[11px] font-medium text-unjong-muted">{tToday('selectionBasisLabel')}</span>;
}

// 도트 목록(강점이 많은 종목·오늘 거래가 많았던 종목) 전용 — 도트가 뭘 뜻하는지 범례로 명시(STEP 776 §2). 기존 렌즈 용어(Board.legend*) 재사용.
function DotLegendBasisLabel() {
  const tb = useTranslations('Board');
  const tCommon = useTranslations('Common');
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-unjong-muted">
      <span className="flex items-center gap-1"><span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT.pos}`} />{tb('legendPos')}</span>
      <span className="flex items-center gap-1"><span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT.warn}`} />{tb('legendWarn')}</span>
      <span className="flex items-center gap-1"><span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT.flat}`} />{tb('legendFlat')}</span>
      <span>· {tCommon('priceChangeBasis')}</span>
    </span>
  );
}

function PriceCell({ price, changePercent, market, loc }: { price: number | null; changePercent: number | null; market: Country; loc: Locale }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span className="text-[15px] font-semibold tabular-nums text-unjong-primary sm:text-sm">{price != null ? formatPrice(price, market) : '—'}</span>
      <span className={`text-[13px] tabular-nums sm:text-[11px] ${changeColorClass(changePercent, loc)}`}>{pct(changePercent)}</span>
    </div>
  );
}

// 랭킹 근거 둘째 줄(STEP 779) — 그 리스트가 왜 이 순서인지(강점 수+대표 라벨 / 거래대금). 도트 뒤에 붙이되 넘치면 말줄임.
function DotsRow({ symbol, name, tones, price, changePercent, market, loc, watched, onToggleWatch, rankingBasis }: {
  symbol: string; name: string; tones: Tones | null | undefined; price: number | null; changePercent: number | null; market: Country; loc: Locale;
  watched: boolean; onToggleWatch: (symbol: string, name: string) => void; rankingBasis?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 hover:bg-unjong-background/60 active:bg-unjong-background">
      <Link href={`/stock/${symbol}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <StockLogo code={symbol} name={name} size={30} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[17px] font-semibold text-unjong-primary sm:text-sm">{name}</p>
          {tones ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="flex shrink-0 items-center gap-0.5">
                {Array.from({ length: tones.pos }).map((_, i) => <span key={`p${i}`} className={`h-[6px] w-[6px] shrink-0 rounded-full ${TONE_DOT.pos}`} />)}
                {Array.from({ length: tones.warn }).map((_, i) => <span key={`w${i}`} className={`h-[6px] w-[6px] shrink-0 rounded-full ${TONE_DOT.warn}`} />)}
                {Array.from({ length: tones.flat }).map((_, i) => <span key={`f${i}`} className={`h-[6px] w-[6px] shrink-0 rounded-full ${TONE_DOT.flat}`} />)}
              </span>
              {rankingBasis ? <span className="min-w-0 truncate text-[13px] text-unjong-muted sm:text-[11px]">{rankingBasis}</span> : null}
            </div>
          ) : null}
        </div>
        <PriceCell price={price} changePercent={changePercent} market={market} loc={loc} />
      </Link>
      <WatchStar symbol={symbol} watched={watched} onToggle={() => onToggleWatch(symbol, name)} />
    </div>
  );
}

// "강점이 많은 종목" 둘째 줄 — 강점 N(muted) · 대표 강점 라벨(pos 톤=민트). pos 0개면 라벨 생략(강점 0만).
function PosRankingBasis({ tones, topLensKey, topLensState, loc, t }: {
  tones: Tones; topLensKey?: string | null; topLensState?: string | null; loc: Locale; t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <span>{t('strengthCount', { n: tones.pos })}</span>
      {topLensKey ? (
        <>
          {' · '}
          <span className={TONE_TEXT_CLASS.pos}>{lensDisplayName(loc, topLensKey)} {compactPhrase(lensStateLabel(loc, topLensKey, topLensState ?? null))}</span>
        </>
      ) : null}
    </>
  );
}

function ChangeRow({ item, loc, market, watched, onToggleWatch, extra = 0 }: {
  item: ChangeItem; loc: Locale; market: Country; watched: boolean; onToggleWatch: (symbol: string, name: string) => void; extra?: number;
}) {
  const t = useTranslations('Today');
  const tCommon = useTranslations('Common');
  const key = item.lensKey as LensKey;
  // 도착 상태(B)만 톤 색(STEP 777 §4) — A는 muted 그대로, 776 단일 토큰(TONE_TEXT_CLASS) 재사용.
  const line = t.rich('lensChangeLine', {
    from: compactPhrase(stateLabel(loc, key, item.fromState)),
    to: compactPhrase(stateLabel(loc, key, item.toState)),
    b: (chunks) => <span className={TONE_TEXT_CLASS[item.toTone]}>{chunks}</span>,
  });
  // 종목명 — 공용 util(resolveDisplayName·STEP 775 §3, 오늘·탐색·서버 API 전부 동일 함수).
  const name = resolveDisplayName({ loc, market, symbol: item.symbol, nameKo: item.nameKo, nameEn: item.nameEn, rawName: item.name, context: 'list' });
  return (
    <div className="flex items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 hover:bg-unjong-background/60 active:bg-unjong-background">
      <Link href={`/stock/${item.symbol}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <StockLogo code={item.symbol} name={name} size={30} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[17px] font-semibold text-unjong-primary sm:text-sm">{name}</p>
          {/* 모바일 2줄 허용 — 도착 상태가 잘리지 않게(STEP 795 §7). 데스크톱은 1줄 밀도 유지. */}
          <p className="flex items-start gap-1.5 text-[15px] text-unjong-muted sm:text-[12px]">
            <span className={`mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full sm:mt-[5px] ${TONE_DOT[item.toTone]}`} />
            <span className="line-clamp-2 sm:line-clamp-1">
              {line}
              {extra > 0 ? <span className="text-unjong-muted">{tCommon('andNMore', { n: extra })}</span> : null}
            </span>
          </p>
        </div>
        <PriceCell price={item.price} changePercent={item.changePercent} market={market} loc={loc} />
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
  const pathname = usePathname(); // 로케일 무관 경로 — 로그인 후 복귀(next)용
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
    // URL을 단일 소스로 갱신(STEP 804 §7) — 새로고침·공유 링크에서 시장이 유지되도록. 나머지 쿼리(list 등)는 보존.
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('market', m);
    router.replace(`${pathname}?${params.toString()}`);
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

  // 최근 검색(STEP 777 §6) — 서버 저장 없이 로컬 전용, 선택한 종목 최대 3개(최신 우선·중복 제거).
  const [recents, setRecents] = useState<SearchItem[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch { /* localStorage 불가 환경 무시 */ }
  }, []);
  function saveRecent(item: SearchItem) {
    setRecents((prev) => {
      const next = [item, ...prev.filter((r) => r.symbol !== item.symbol)].slice(0, 3);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* 무시 */ }
      return next;
    });
  }
  function removeRecent(symbol: string) {
    setRecents((prev) => {
      const next = prev.filter((r) => r.symbol !== symbol);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* 무시 */ }
      return next;
    });
  }

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
    saveRecent(item);
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
  const [amountAsOf, setAmountAsOf] = useState<string | null>(null); // 거래대금 목록 데이터 기준일(STEP 804 §2)
  const [reloadKey, setReloadKey] = useState(0); // 재시도 트리거(STEP 804 §4)
  // 톤 필터 칩(변화 풀리스트 전용·STEP 775 §2) — 정렬 토글 아님, to_tone 기준 필터만. 건수는 서버 집계(counts) 재사용.
  const [toneFilter, setToneFilter] = useState<'all' | 'pos' | 'warn'>('all');

  useEffect(() => {
    const limit = activeList ? 50 : 5;
    let alive = true;
    async function run() {
      setChanges(null); setPosTop(null); setAmountTop(null);
      setListsFailed({ changes: false, pos: false, amount: false });
      const [ch, pos, amt] = await Promise.all([
        fetchJson<ChangesResp>(`/api/today/changes?market=${market}&limit=${limit}`),
        fetchJson<{ items: LensTopItem[] }>(`/api/explore/lens-top?market=${market}&sort=pos&limit=${limit}&lang=${lang}`),
        fetchAmountTop(market, limit),
      ]);
      if (!alive) return;
      setChanges(ch);
      setPosTop(pos?.items ?? null);
      setAmountTop(amt === null ? null : amt.rows);
      setAmountAsOf(amt?.asOf ?? null);
      // 실패(null)만 failed로 — 빈 결과([])는 '없음'이지 실패가 아님(STEP 804 §4).
      // STEP 809 §6: API가 200+failed:true(DB 오류)로 와도 실패로 취급(빈 목록으로 위장 금지).
      setListsFailed({ changes: ch === null || !!ch?.failed, pos: pos === null, amount: amt === null });
    }
    run();
    return () => { alive = false; };
  }, [market, activeList, lang, reloadKey]);

  // 관심목록(별 토글)
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) { setWatchSet(new Set()); return; }
    fetchJson<{ watchlist?: { symbol: string }[] }>('/api/watchlist').then((j) => {
      if (j?.watchlist) setWatchSet(new Set(j.watchlist.map((w) => w.symbol)));
    });
  }, [user]);
  function toggleWatch(symbol: string, name: string) {
    if (!user) { router.push(`/auth/login?next=${encodeURIComponent(pathname)}`); return; }
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

  // 실패를 '없음'·빈 공백으로 위장하지 않는다(STEP 804 §4) — 명시적 오류 + 재시도.
  function LoadFailed() {
    return (
      <div className="py-6 text-center">
        <p className="text-[15px] text-unjong-muted sm:text-sm">{t('loadError')}</p>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-1.5 inline-block text-[13px] font-semibold text-unjong-accent">{t('retry')}</button>
      </div>
    );
  }

  // ── 풀 리스트 뷰 ──
  if (activeList) {
    const titleKey = activeList === 'changes' ? 'changesTitle' : activeList === 'pos' ? 'posTitle' : 'amountTitle';
    const asOfDate = activeList === 'changes' ? changes?.date ?? null : activeList === 'amount' ? amountAsOf : null;
    // 톤 필터 적용 후 종목당 그룹핑(STEP 776 §3 — 필터 먼저, 그다음 묶기).
    const filteredGroupedChanges = changes ? groupBySymbol(changes.items.filter((it) => toneFilter === 'all' || it.toTone === toneFilter)) : [];
    return (
      <PageShell>
        {/* 탐색 본문은 전 구간 680 고정 — PageShell main은 lg에서만 680이라 640~1023구간이 넓어지던 회귀 차단(STEP 798 §1). */}
        <div className="max-w-[680px]">
        <button type="button" onClick={() => router.back()} className="mb-4 ml-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-accent sm:ml-0">
          <ArrowLeft size={20} />
          {tLogin('back')}
        </button>
        <div className="mb-3 flex flex-col gap-1 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-unjong-primary">{t(market === 'KR' ? 'countryKr' : 'countryUs')} · {t(titleKey)}</h1>
            <AsOfBadge date={asOfDate} loc={loc} market={market} />
          </div>
          {activeList === 'changes' ? <SelectionBasisLabel /> : <DotLegendBasisLabel />}
        </div>
        {/* STEP 810 §3: pos 개수 정렬은 우리 조합이고 저변동·기술은 수익 신호 아님 — 정직 명시 */}
        {activeList === 'pos' ? <p className="mb-3 px-4 text-[12px] leading-relaxed text-unjong-muted sm:px-0">{t('posSubNote')}</p> : null}
        {activeList === 'changes' ? (
          <div className="mb-3 flex gap-1.5 px-4 sm:px-0">
            <button type="button" onClick={() => setToneFilter('all')} className={chipClass(toneFilter === 'all')}>
              {t('filterAll')} {changes?.counts?.total ?? 0}
            </button>
            <button type="button" onClick={() => setToneFilter('pos')} className={chipClass(toneFilter === 'pos')}>
              <span className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full bg-unjong-accent" />
              {t('filterToPos')} {changes?.counts?.pos ?? 0}
            </button>
            <button type="button" onClick={() => setToneFilter('warn')} className={chipClass(toneFilter === 'warn')}>
              <span className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full bg-amber-400" />
              {t('filterToWarn')} {changes?.counts?.warn ?? 0}
            </button>
          </div>
        ) : null}
        {/* 칩=전체 집계(예 137) vs 목록=상위 50건+종목묶기(예 12행) 불일치 명시(STEP 804 §8) */}
        {activeList === 'changes' && changes && (changes.counts?.total ?? 0) > changes.items.length ? (
          <p className="mb-2 px-4 text-[12px] text-unjong-muted sm:px-0">{t('toneCountNote', { shown: changes.items.length })}</p>
        ) : null}
        <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
          {activeList === 'changes' ? (
            listsFailed.changes ? <LoadFailed /> : changes === null ? <Skeleton /> : filteredGroupedChanges.length === 0 ? <p className="py-6 text-center text-[15px] text-unjong-muted sm:text-sm">{t('noItems')}</p> :
              filteredGroupedChanges.map(({ item, extra }, i) => <ChangeRow key={`${item.symbol}-${item.lensKey}-${i}`} item={item} loc={loc} market={market} watched={watchSet.has(item.symbol)} onToggleWatch={toggleWatch} extra={extra} />)
          ) : activeList === 'pos' ? (
            listsFailed.pos ? <LoadFailed /> : posTop === null ? <Skeleton /> : posTop.length === 0 ? <p className="py-6 text-center text-[15px] text-unjong-muted sm:text-sm">{t('noItems')}</p> :
              posTop.map((r) => <DotsRow key={r.symbol} symbol={r.symbol} name={r.name} tones={r.tones} price={r.price} changePercent={r.changePercent} market={market} loc={loc} watched={watchSet.has(r.symbol)} onToggleWatch={toggleWatch} rankingBasis={<PosRankingBasis tones={r.tones} topLensKey={r.topLensKey} topLensState={r.topLensState} loc={loc} t={t} />} />)
          ) : (
            listsFailed.amount ? <LoadFailed /> : amountTop === null ? <Skeleton /> : amountTop.length === 0 ? <p className="py-6 text-center text-[15px] text-unjong-muted sm:text-sm">{t('noItems')}</p> :
              amountTop.map((r) => {
                const amt = rowTradeAmount(r);
                return <DotsRow key={r.symbol} symbol={r.symbol} name={resolveDisplayName({ loc, market, symbol: r.symbol, nameKo: r.name, nameEn: r.nameEn, rawName: r.name, context: 'list' })} tones={r.lens} price={r.price} changePercent={r.changePercent} market={market} loc={loc} watched={watchSet.has(r.symbol)} onToggleWatch={toggleWatch} rankingBasis={amt != null ? t('tradeAmountLabel', { v: formatTradeValue(amt, market) }) : null} />;
              })
          )}
        </div>
        </div>
    </PageShell>
    );
  }

  // ── 메인 뷰 ──
  return (
    <PageShell>
      {/* 탐색 본문 전 구간 680 고정(STEP 798 §1). */}
      <div className="max-w-[680px]">
      {/* 5면 중 유일하게 h1이 없어 추가(STEP 796 §4) — 밀도 결정(763) 존중해 sr-only. 풀리스트 뷰는 이미 h1 있음. */}
      <h1 className="sr-only">{t('pageTitle')}</h1>
      {/* 검색 — 주인공 */}
      <div ref={searchBoxRef} className="relative mb-6 px-4 sm:px-0">
        <div className="relative">
          <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-unjong-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.trim() ? results.length > 0 : recents.length > 0) setSearchOpen(true); }}
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
            {!query.trim() ? (
              recents.length === 0 ? null : (
                <>
                  <p className="px-4 pb-1 pt-2 text-[11px] font-medium text-unjong-muted">{t('recentSearches')}</p>
                  {recents.map((r) => (
                    <div key={`${r.symbol}-${r.country}`} className="flex w-full items-center gap-2.5 px-4 py-2.5 hover:bg-unjong-background active:bg-unjong-background">
                      <button type="button" onClick={() => goToResult(r)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                        <StockLogo code={r.symbol} name={r.name} size={28} />
                        <span className="min-w-0 flex-1 truncate text-[17px] font-medium text-unjong-primary sm:text-sm">{r.name}</span>
                        <span className="shrink-0 text-[13px] font-medium text-unjong-muted sm:text-[11px]">{r.country}</span>
                      </button>
                      <button type="button" onClick={() => removeRecent(r.symbol)} aria-label={t('removeRecent')} className="flex h-11 w-11 shrink-0 items-center justify-center text-unjong-muted hover:text-unjong-primary active:bg-unjong-background">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </>
              )
            ) : searchLoading ? (
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
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-unjong-background active:bg-unjong-background ${i === activeIdx ? 'bg-unjong-background' : ''}`}
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
        <div className="mb-2 flex flex-col gap-1 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
          <div className="flex items-center">
            <h2 className="text-base font-bold text-unjong-primary">{t('changesTitle')}</h2>
            <AsOfBadge date={changes?.date ?? null} loc={loc} market={market} />
          </div>
          <div className="flex flex-col items-start gap-0.5 sm:items-end">
            {changes && changes.count != null && changes.count > 0 ? (
              <Link href="/explore?list=changes" className="shrink-0 text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('moreCount', { n: changes.count })}</Link>
            ) : null}
            <BasisLabel />
          </div>
        </div>
        {listsFailed.changes ? <LoadFailed /> : changes === null ? (
          <Skeleton />
        ) : changes.items.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noItems')}</p>
        ) : (
          <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
            {groupBySymbol(changes.items).slice(0, 5).map(({ item, extra }, i) => (
              <ChangeRow key={`${item.symbol}-${item.lensKey}-${i}`} item={item} loc={loc} market={market} watched={watchSet.has(item.symbol)} onToggleWatch={toggleWatch} extra={extra} />
            ))}
          </div>
        )}
      </section>

      {/* 목록 2: 여러 기법에서 상위권인 종목(우리 조합·추천 아님·STEP 810 §3) */}
      <section className="mb-7">
        <div className="mb-2 flex flex-col gap-1 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
          <h2 className="text-base font-bold text-unjong-primary">{t('posTitle')}</h2>
          <div className="flex flex-col items-start gap-0.5 sm:items-end">
            {posTop && posTop.length > 0 ? <Link href="/explore?list=pos" className="shrink-0 text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('moreLink')}</Link> : null}
            <DotLegendBasisLabel />
          </div>
        </div>
        <p className="mb-2 px-4 text-[12px] leading-relaxed text-unjong-muted sm:px-0">{t('posSubNote')}</p>
        {listsFailed.pos ? <LoadFailed /> : posTop === null ? (
          <Skeleton />
        ) : posTop.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noItems')}</p>
        ) : (
          <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
            {posTop.slice(0, 5).map((r) => (
              <DotsRow key={r.symbol} symbol={r.symbol} name={r.name} tones={r.tones} price={r.price} changePercent={r.changePercent} market={market} loc={loc} watched={watchSet.has(r.symbol)} onToggleWatch={toggleWatch} rankingBasis={<PosRankingBasis tones={r.tones} topLensKey={r.topLensKey} topLensState={r.topLensState} loc={loc} t={t} />} />
            ))}
          </div>
        )}
      </section>

      {/* 목록 3: 오늘 거래가 많았던 종목 */}
      <section className="mb-7">
        <div className="mb-2 flex flex-col gap-1 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
          <h2 className="text-base font-bold text-unjong-primary">{t('amountTitle')}</h2>
          <div className="flex flex-col items-start gap-0.5 sm:items-end">
            {amountTop && amountTop.length > 0 ? <Link href="/explore?list=amount" className="shrink-0 text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('moreLink')}</Link> : null}
            <DotLegendBasisLabel />
          </div>
        </div>
        {listsFailed.amount ? <LoadFailed /> : amountTop === null ? (
          <Skeleton />
        ) : amountTop.length === 0 ? (
          <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noItems')}</p>
        ) : (
          <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
            {amountTop.slice(0, 5).map((r) => {
              const amt = rowTradeAmount(r);
              return <DotsRow key={r.symbol} symbol={r.symbol} name={resolveDisplayName({ loc, market, symbol: r.symbol, nameKo: r.name, nameEn: r.nameEn, rawName: r.name, context: 'list' })} tones={r.lens} price={r.price} changePercent={r.changePercent} market={market} loc={loc} watched={watchSet.has(r.symbol)} onToggleWatch={toggleWatch} rankingBasis={amt != null ? t('tradeAmountLabel', { v: formatTradeValue(amt, market) }) : null} />;
            })}
          </div>
        )}
      </section>

      <p className="px-4 text-[13px] leading-relaxed text-unjong-muted sm:px-0 sm:text-xs">{tMaterial('material')}</p>
      </div>
    </PageShell>
  );
}
