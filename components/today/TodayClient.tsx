'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/authStore';
import { homeMarketFor, type Country } from '@/stores/countryStore';
import { LENS_COPY, LENS_READINGS, pickLocale, type Locale } from '@/lib/lensCopy';
import type { Tone } from '@/lib/lensTones';
import { StockLogo } from '@/components/ui/StockLogo';
import { cleanUsName } from '@/lib/usNameFormat';
import { formatPrice } from '@/lib/currency';
import { pickKrName } from '@/lib/krNameFormat';
import foreignKoRaw from '@/data/foreign_ko_names.json';

const FOREIGN_KO = foreignKoRaw as Record<string, string>;

// 렌즈 키(lensCopy.ts STATE_SPEC과 동일) — 임의 string 인덱싱 대신 이 목록으로 좁힌다.
type LensKey = 'momentum' | 'technical' | 'valuation' | 'lowvol' | 'quality' | 'assetgrowth' | 'fscore';

type ChangeItem = {
  symbol: string;
  name: string | null;
  lensKey: string;
  fromState: string | null;
  toState: string;
  fromTone: Tone | null;
  toTone: Tone;
  tradeAmount: number | null;
  price: number | null;
  nameKo?: string | null;
  nameEn?: string | null;
};
type ChangesResp = { date: string | null; count?: number; items: ChangeItem[] };
type IndexItem = { name: string; value: string; changeText: string; changePct: number; isUp: boolean; group: string };
type WatchlistQuote = {
  symbol: string; name_ko: string; name_en: string | null; market: string; country: string;
  price: number | null; changePercent: number | null; tones: Tone[] | null;
};
type BoardInfo = { changePercent: number | null; name: string; nameEn?: string | null };

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

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

async function fetchKrBoardMap(): Promise<Map<string, BoardInfo>> {
  const j = await fetchJson<{ stocks?: { symbol: string; name: string; nameEn?: string | null; changePercent?: number }[] }>(
    '/api/krx/ranking?market=all&sort=amount&limit=2600'
  );
  const m = new Map<string, BoardInfo>();
  for (const s of j?.stocks ?? []) m.set(s.symbol, { changePercent: s.changePercent ?? null, name: s.name, nameEn: s.nameEn ?? null });
  return m;
}
async function fetchUsBoardMap(): Promise<Map<string, BoardInfo>> {
  const j = await fetchJson<{ items?: { symbol: string; name: string; changePercent?: number }[] }>('/api/yahoo/us-list');
  const m = new Map<string, BoardInfo>();
  for (const it of j?.items ?? []) m.set(it.symbol, { changePercent: it.changePercent ?? null, name: it.name });
  return m;
}

// 어제 UTC date(change_date와 동일 규칙) — 응답 date가 이보다 과거면 폴백 배지("금요일 기준") 노출.
function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}
function weekdayOf(dateStr: string, loc: Locale): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return new Intl.DateTimeFormat(loc === 'en' ? 'en-US' : 'ko-KR', { weekday: 'long', timeZone: 'UTC' }).format(d);
}

function AsOfBadge({ date, loc }: { date: string | null; loc: Locale }) {
  const t = useTranslations('Today');
  if (!date || date === todayUtcDate()) return null;
  return <span className="ml-2 rounded-full bg-unjong-background px-2 py-0.5 text-[13px] font-medium text-unjong-muted sm:text-[11px]">{t('asOfDay', { day: weekdayOf(date, loc) })}</span>;
}

// 섹션 헤더 우측 기준 라벨 — 행마다 붙던 "어제" 프리픽스를 섹션당 한 번으로(STEP 770 §1).
function BasisLabel() {
  const t = useTranslations('Common');
  return <span className="shrink-0 text-[11px] font-medium text-unjong-muted">{t('priceChangeBasis')}</span>;
}

function LensChangeRow({
  item, loc, changePercent, displayName, market,
}: {
  item: ChangeItem; loc: Locale; changePercent: number | null; displayName: string; market: string;
}) {
  const t = useTranslations('Today');
  const key = item.lensKey as LensKey;
  const line = t('lensChangeLine', {
    lensName: lensName(loc, key),
    from: compactPhrase(stateLabel(loc, key, item.fromState)),
    to: compactPhrase(stateLabel(loc, key, item.toState)),
  });
  return (
    <Link href={`/stock/${item.symbol}`} className="flex items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 hover:bg-unjong-background/60">
      <StockLogo code={item.symbol} name={displayName} size={30} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[17px] font-semibold text-unjong-primary sm:text-sm">{displayName}</p>
        <p className="flex items-center gap-1.5 truncate text-[15px] text-unjong-muted sm:text-[12px]">
          <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT[item.toTone]}`} />
          {line}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-[15px] font-semibold tabular-nums text-unjong-primary sm:text-sm">{item.price != null ? formatPrice(item.price, market) : '—'}</span>
        <span className={`text-[13px] tabular-nums sm:text-[11px] ${pctColor(changePercent)}`}>{pct(changePercent)}</span>
      </div>
    </Link>
  );
}

export default function TodayClient() {
  const localeRaw = useLocale();
  const loc = pickLocale(localeRaw);
  const t = useTranslations('Today');
  const tMaterial = useTranslations('LensPreview');
  const { user, isLoading: authLoading } = useAuthStore();
  const homeMarket = homeMarketFor(localeRaw); // 'KR' | 'US'

  const [loading, setLoading] = useState(true);
  const [indices, setIndices] = useState<IndexItem[]>([]);
  const [watchlistQuotes, setWatchlistQuotes] = useState<WatchlistQuote[] | null>(null); // null=미조회, []=조회했지만 0
  const [watchlistChanges, setWatchlistChanges] = useState<ChangeItem[]>([]);
  const [watchlistChangesDate, setWatchlistChangesDate] = useState<string | null>(null);
  const [usChanges, setUsChanges] = useState<ChangesResp | null>(null);
  const [homeChanges, setHomeChanges] = useState<ChangesResp | null>(null);
  const [krBoardMap, setKrBoardMap] = useState<Map<string, BoardInfo>>(new Map());
  const [usBoardMap, setUsBoardMap] = useState<Map<string, BoardInfo>>(new Map());

  useEffect(() => {
    let alive = true;
    async function run() {
      const needKr = homeMarket === 'KR';
      const [idx, us, home, usMap, krMap] = await Promise.all([
        fetchJson<{ items: IndexItem[] }>('/api/yahoo/indices'),
        fetchJson<ChangesResp>('/api/today/changes?market=US&limit=5'),
        needKr ? fetchJson<ChangesResp>('/api/today/changes?market=KR&limit=5') : Promise.resolve(null),
        fetchUsBoardMap(),
        needKr ? fetchKrBoardMap() : Promise.resolve(new Map<string, BoardInfo>()),
      ]);
      if (!alive) return;
      setIndices(idx?.items ?? []);
      setUsChanges(us);
      setHomeChanges(needKr ? home : us);
      setUsBoardMap(usMap);
      setKrBoardMap(krMap);
    }
    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeMarket]);

  // 로그인·관심목록 의존 데이터 — 세션 확정 후에만.
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setWatchlistQuotes([]); setWatchlistChanges([]); setLoading(false); return; }
    let alive = true;
    async function run() {
      const [quotes, wlKr, wlUs] = await Promise.all([
        fetchJson<{ auth: boolean; watchlist: WatchlistQuote[] }>('/api/watchlist/quotes'),
        fetchJson<ChangesResp>('/api/today/changes?market=KR&watchlist=true&limit=20'),
        fetchJson<ChangesResp>('/api/today/changes?market=US&watchlist=true&limit=20'),
      ]);
      if (!alive) return;
      setWatchlistQuotes(quotes?.watchlist ?? []);
      const merged = [...(wlKr?.items ?? []), ...(wlUs?.items ?? [])].sort((a, b) => (b.tradeAmount ?? 0) - (a.tradeAmount ?? 0));
      setWatchlistChanges(merged);
      setWatchlistChangesDate(wlKr?.date ?? wlUs?.date ?? null);
      setLoading(false);
    }
    run();
    return () => { alive = false; };
  }, [user, authLoading]);

  if (loading || authLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-unjong-accent border-t-transparent" /></div>;
  }

  const homeIndexName = homeMarket === 'KR' ? 'KOSPI' : 'S&P 500';
  const homeIndex = indices.find((i) => i.name === homeIndexName);
  const formattedDate = new Intl.DateTimeFormat(loc === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());

  const quoteMap = new Map((watchlistQuotes ?? []).map((q) => [q.symbol, q]));
  const hasWatchlist = (watchlistQuotes?.length ?? 0) > 0;

  const usListForRail = ['S&P 500', 'NASDAQ', 'Dow Jones', 'VIX'];
  const krListForRail = ['KOSPI', 'KOSDAQ', 'USD/KRW', 'VIX'];
  const railNames = homeMarket === 'KR' ? krListForRail : usListForRail;
  const railIndices = railNames.map((n) => indices.find((i) => i.name === n)).filter((x): x is IndexItem => !!x);

  // 종목명: KR=공용 util(pickKrName·STEP 770 §3, 오늘·탐색 동일 함수) / US=한글 오버라이드(ko만) → cleanUsName 축약(STEP 765b).
  function nameFor(item: ChangeItem, market: Country): string {
    if (market === 'KR') {
      const info = krBoardMap.get(item.symbol);
      return pickKrName(loc, info?.name, info?.nameEn, item.name ?? item.symbol);
    }
    if (loc === 'ko') {
      const ko = FOREIGN_KO[item.symbol.toUpperCase()];
      if (ko) return ko;
    }
    const info = usBoardMap.get(item.symbol);
    const raw = info?.name ?? item.name ?? item.symbol;
    return cleanUsName(raw);
  }
  function changePctFor(item: ChangeItem, market: Country): number | null {
    const map = market === 'KR' ? krBoardMap : usBoardMap;
    return map.get(item.symbol)?.changePercent ?? null;
  }

  return (
    <div className="mx-auto max-w-[1040px] py-6 sm:px-6 lg:flex lg:items-start lg:gap-8">
      <main className="min-w-0 flex-1 lg:max-w-[680px]">
        {/* 1) 헤더 — 날짜가 주인공(목업대로·STEP 765b), "오늘" H1·부제 제거(페이지 <title>은 유지) */}
        <div className="mb-6 px-4 sm:px-0">
          <h1 className="text-[22px] font-bold text-unjong-primary lg:text-[26px]">{formattedDate}</h1>
          {homeIndex ? (
            <p className="mt-2 text-[15px] font-medium text-unjong-primary sm:text-sm">
              {t('marketLine', { index: homeIndex.name, pct: pct(homeIndex.changePct) })}
              {homeChanges?.count != null ? <span className="text-unjong-muted"> · {t('changesCount', { n: homeChanges.count })}</span> : null}
            </p>
          ) : null}
        </div>

        {/* 2) 내 관심종목 · 렌즈 변화 */}
        <section className="mb-7">
          {!user || !hasWatchlist ? (
            <div className="mx-4 rounded-2xl border border-unjong-border bg-unjong-surface p-5 text-center sm:mx-0">
              <p className="text-[15px] font-medium text-unjong-primary sm:text-sm">{t('onboardingTitle')}</p>
              <Link href="/explore" className="mt-2 inline-block text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('onboardingCta')}</Link>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between px-4 sm:px-0">
                <div className="flex items-center">
                  <h2 className="text-base font-bold text-unjong-primary">{t('watchlistChangesTitle')}</h2>
                  <AsOfBadge date={watchlistChangesDate} loc={loc} />
                </div>
                <BasisLabel />
              </div>
              {watchlistChanges.length === 0 ? (
                <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noWatchlistChangesToday')}</p>
              ) : (
                <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
                  {watchlistChanges.slice(0, 4).map((item, i) => {
                    const q = quoteMap.get(item.symbol);
                    const displayName = q ? (loc === 'en' ? (q.name_en ?? q.name_ko) : q.name_ko) : (item.name ?? item.symbol);
                    return (
                      <LensChangeRow key={`${item.symbol}-${item.lensKey}-${i}`} item={item} loc={loc} changePercent={q?.changePercent ?? null} displayName={displayName} market={q?.country ?? 'KR'} />
                    );
                  })}
                </div>
              )}
              <Link href="/favorites" className="mt-2 inline-block px-4 text-[15px] font-semibold text-unjong-accent sm:px-0 sm:text-sm">{t('viewAllWatchlist')}</Link>
            </>
          )}
        </section>

        {/* 3) 간밤 미국 */}
        <section className="mb-7">
          <div className="mb-2 flex items-center justify-between px-4 sm:px-0">
            <div className="flex items-center">
              <h2 className="text-base font-bold text-unjong-primary">{t('overnightUsTitle')}</h2>
              <AsOfBadge date={usChanges?.date ?? null} loc={loc} />
            </div>
            <BasisLabel />
          </div>
          {(usChanges?.items.length ?? 0) === 0 ? (
            <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noChangesToday')}</p>
          ) : (
            <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
              {(usChanges?.items ?? []).slice(0, 5).map((item, i) => (
                <LensChangeRow key={`${item.symbol}-${item.lensKey}-${i}`} item={item} loc={loc} changePercent={changePctFor(item, 'US')} displayName={nameFor(item, 'US')} market="US" />
              ))}
            </div>
          )}
        </section>

        {/* 4) 오늘 시장 변화(KR·en이면 US 우선) */}
        <section className="mb-7">
          <div className="mb-2 flex items-center justify-between px-4 sm:px-0">
            <div className="flex items-center">
              <h2 className="text-base font-bold text-unjong-primary">{t('marketChangesTitle')}</h2>
              <AsOfBadge date={homeChanges?.date ?? null} loc={loc} />
            </div>
            <BasisLabel />
          </div>
          {(homeChanges?.items.length ?? 0) === 0 ? (
            <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noChangesToday')}</p>
          ) : (
            <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
              {(homeChanges?.items ?? []).slice(0, 5).map((item, i) => (
                <LensChangeRow key={`${item.symbol}-${item.lensKey}-${i}`} item={item} loc={loc} changePercent={changePctFor(item, homeMarket)} displayName={nameFor(item, homeMarket)} market={homeMarket} />
              ))}
            </div>
          )}
          {homeChanges && homeChanges.count != null && homeChanges.count > 5 ? (
            <Link href="/explore?list=changes" className="mt-2 inline-block px-4 text-[15px] font-semibold text-unjong-accent sm:px-0 sm:text-sm">{t('viewMoreChanges', { n: homeChanges.count - 5 })}</Link>
          ) : null}
        </section>

        {/* 5) 각주 */}
        <p className="px-4 text-[13px] leading-relaxed text-unjong-muted sm:px-0 sm:text-xs">{tMaterial('material')}</p>
      </main>

      {/* PC 우측 레일 */}
      <aside className="mt-8 hidden lg:mt-0 lg:block lg:w-80 lg:shrink-0">
        <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-4">
          <p className="mb-2 text-sm font-bold text-unjong-primary">{t('railMarketTitle')}</p>
          <div className="grid grid-cols-2 gap-2">
            {railIndices.map((idx) => (
              <div key={idx.name} className="rounded-lg bg-unjong-background p-2.5">
                <p className="truncate text-[12px] text-unjong-muted">{idx.name}</p>
                <p className={`text-sm font-semibold tabular-nums ${pctColor(idx.changePct)}`}>{pct(idx.changePct)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-unjong-border bg-unjong-surface p-4">
          <p className="mb-2 text-sm font-bold text-unjong-primary">{t('railWatchlistTitle')}</p>
          {!user ? (
            <Link href="/auth/login" className="text-sm font-semibold text-unjong-accent">{t('railWatchlistLogin')}</Link>
          ) : !hasWatchlist ? (
            <p className="text-sm text-unjong-muted">{t('onboardingTitle')}</p>
          ) : (
            <>
              {(watchlistQuotes ?? []).slice(0, 6).map((q) => (
                <Link key={q.symbol} href={`/stock/${q.symbol}`} className="flex items-center gap-2 border-b border-unjong-border py-2 last:border-0 hover:bg-unjong-background/60">
                  <StockLogo code={q.symbol} name={q.name_ko} size={24} />
                  <span className="min-w-0 flex-1 truncate text-sm text-unjong-primary">{loc === 'en' ? (q.name_en ?? q.name_ko) : q.name_ko}</span>
                  <span className={`shrink-0 text-[13px] font-semibold tabular-nums ${pctColor(q.changePercent)}`}>{pct(q.changePercent)}</span>
                </Link>
              ))}
              <Link href="/favorites" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">{t('railViewAll')}</Link>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
