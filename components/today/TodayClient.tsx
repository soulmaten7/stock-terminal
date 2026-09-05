'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/authStore';
import { homeMarketFor } from '@/stores/countryStore';
import { LENS_READINGS, compactPhrase, pickLocale, type Locale } from '@/lib/lensCopy';
import { TONE_DOT_CLASS as TONE_DOT, TONE_TEXT_CLASS, changeColorClass, type Tone } from '@/lib/lensTones';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import { resolveWatchlistName } from '@/lib/displayName';
import { groupBySymbol } from '@/lib/groupChanges';
import { AsOfBadge } from '@/components/ui/AsOfBadge';
import { WatchStar } from '@/components/common/WatchStar';
import { PageShell } from '@/components/layout/PageShell';
import { ReportRow } from '@/components/reports/ReportRow';
import type { HomeReportFeed } from '@/lib/channelReports';

// PC 전용 hover 별(STEP 781 §2) — 탐색 WatchStar 기본값(sm:flex) 위에 평소 투명·행 hover/포커스 시만 표시 추가.
const HOVER_STAR_CLASS = 'hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg opacity-0 transition-opacity sm:flex sm:group-hover:opacity-100 sm:focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unjong-accent';
function hoverStarClass(watched: boolean): string {
  return `${HOVER_STAR_CLASS} ${watched ? 'text-unjong-accent' : 'text-unjong-border'}`;
}

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
  changePercent: number | null;
  nameKo: string | null;
  nameEn: string | null;
};
type ChangesResp = { date: string | null; count?: number; items: ChangeItem[]; failed?: boolean };
type IndexItem = { name: string; value: string; changeText: string; changePct: number; isUp: boolean; group: string };
type WatchlistQuote = {
  symbol: string; name_ko: string; name_en: string | null; market: string; country: string;
  price: number | null; changePercent: number | null; tones: Tone[] | null;
};


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

// 섹션 헤더 우측 기준 라벨 — 행마다 붙던 "어제" 프리픽스를 섹션당 한 번으로(STEP 770 §1).
function BasisLabel() {
  const t = useTranslations('Common');
  return <span className="shrink-0 text-[11px] font-medium text-unjong-muted">{t('priceChangeBasis')}</span>;
}

function LensChangeRow({
  item, loc, changePercent, displayName, market, extra = 0, watched, onToggleWatch,
}: {
  item: ChangeItem; loc: Locale; changePercent: number | null; displayName: string; market: string; extra?: number;
  watched: boolean; onToggleWatch: () => void;
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
  return (
    <div className="group flex items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 hover:bg-unjong-background/60 active:bg-unjong-background">
      <Link href={`/stock/${item.symbol}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <StockLogo code={item.symbol} name={displayName} size={30} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[17px] font-semibold text-unjong-primary sm:text-sm">{displayName}</p>
          {/* 모바일 2줄 허용 — 도착 상태가 잘리지 않게(STEP 795 §7). 데스크톱은 1줄 밀도 유지. 도트는 shrink-0 형제로 분리. */}
          <p className="flex items-start gap-1.5 text-[15px] text-unjong-muted sm:text-[12px]">
            <span className={`mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full sm:mt-[5px] ${TONE_DOT[item.toTone]}`} />
            <span className="line-clamp-2 sm:line-clamp-1">
              {line}
              {extra > 0 ? <span className="text-unjong-muted">{tCommon('andNMore', { n: extra })}</span> : null}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-[15px] font-semibold tabular-nums text-unjong-primary sm:text-sm">{item.price != null ? formatPrice(item.price, market) : '—'}</span>
          <span className={`text-[13px] tabular-nums sm:text-[11px] ${changeColorClass(changePercent, loc)}`}>{pct(changePercent)}</span>
        </div>
      </Link>
      <WatchStar symbol={item.symbol} watched={watched} onToggle={onToggleWatch} className={hoverStarClass(watched)} />
    </div>
  );
}

export default function TodayClient({ initialKrReports, initialUsReports, initialIndices, dailyBrief, dailyBriefDate = null }: {
  initialKrReports: HomeReportFeed; initialUsReports: HomeReportFeed; initialIndices: IndexItem[]; dailyBrief: string | null; dailyBriefDate?: string | null;
}) {
  const localeRaw = useLocale();
  const loc = pickLocale(localeRaw);
  const t = useTranslations('Today');
  const tMaterial = useTranslations('LensPreview');
  const { user, isLoading: authLoading } = useAuthStore();
  const homeMarket = homeMarketFor(localeRaw); // 'KR' | 'US'
  const router = useRouter();
  const pathname = usePathname(); // 로케일 무관 경로 — 로그인 후 복귀(next)용

  // 시장 전체(지수·리포트 피드) = 서버 프리페치(STEP 771 §3 / STEP2 리포트 피드로 교체) — 클라 fetch 없이 첫 HTML에 바로 포함.
  const indices = initialIndices;
  const krReports = initialKrReports;
  const usReports = initialUsReports;

  const [watchlistQuotes, setWatchlistQuotes] = useState<WatchlistQuote[] | null>(null); // null=미조회, []=조회했지만 0
  const [watchlistError, setWatchlistError] = useState(false); // 조회 실패 — 온보딩(없음)과 구분(STEP 804 §4)
  const [reloadKey, setReloadKey] = useState(0); // 재시도 트리거
  const [watchlistChanges, setWatchlistChanges] = useState<ChangeItem[]>([]);
  const [watchlistChangesDate, setWatchlistChangesDate] = useState<string | null>(null);

  // 로그인·관심목록 의존 데이터만 클라 fetch(세션 필요 — 서버 프리페치 불가).
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setWatchlistQuotes([]); setWatchlistChanges([]); setWatchlistError(false); return; }
    let alive = true;
    setWatchlistError(false);
    async function run() {
      const [quotes, wlKr, wlUs] = await Promise.all([
        fetchJson<{ auth: boolean; watchlist: WatchlistQuote[] }>('/api/watchlist/quotes'),
        fetchJson<ChangesResp>('/api/today/changes?market=KR&watchlist=true&limit=20'),
        fetchJson<ChangesResp>('/api/today/changes?market=US&watchlist=true&limit=20'),
      ]);
      if (!alive) return;
      // quotes 조회 실패(null)를 '없음(빈 목록)'으로 흡수하지 않는다 — 온보딩 카드가 등록 사용자에게 뜨던 버그(STEP 804 §4).
      if (quotes === null) { setWatchlistError(true); return; }
      setWatchlistQuotes(quotes.watchlist ?? []);
      const merged = [...(wlKr?.items ?? []), ...(wlUs?.items ?? [])].sort((a, b) => (b.tradeAmount ?? 0) - (a.tradeAmount ?? 0));
      setWatchlistChanges(merged);
      setWatchlistChangesDate(wlKr?.date ?? wlUs?.date ?? null);
    }
    run();
    return () => { alive = false; };
  }, [user, authLoading, reloadKey]);

  const homeIndexName = homeMarket === 'KR' ? 'KOSPI' : 'S&P 500';
  const homeIndex = indices.find((i) => i.name === homeIndexName);
  const formattedDate = new Intl.DateTimeFormat(loc === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());

  const quoteMap = new Map((watchlistQuotes ?? []).map((q) => [q.symbol, q]));
  const hasWatchlist = (watchlistQuotes?.length ?? 0) > 0;
  const watchlistLoading = authLoading || (!!user && watchlistQuotes === null && !watchlistError); // 에러면 로딩이 아니라 에러 표시(STEP 804 §4)

  // PC hover 별(STEP 781 §2) — 관심 여부 초기값은 이미 가진 watchlistQuotes 재사용(새 조회 없음), 토글은 탐색과 동일 엔드포인트.
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    setWatchSet(new Set((watchlistQuotes ?? []).map((q) => q.symbol)));
  }, [watchlistQuotes]);
  function toggleWatch(symbol: string, name: string, market: string, country: string) {
    if (!user) { router.push(`/auth/login?next=${encodeURIComponent(pathname)}`); return; }
    const add = !watchSet.has(symbol);
    setWatchSet((prev) => { const n = new Set(prev); add ? n.add(symbol) : n.delete(symbol); return n; });
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, name_ko: name, market, country, add }),
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(symbol) : n.add(symbol); return n; });
    });
  }

  const usListForRail = ['S&P 500', 'NASDAQ', 'Dow Jones', 'VIX'];
  const krListForRail = ['KOSPI', 'KOSDAQ', 'USD/KRW', 'VIX'];
  const railNames = homeMarket === 'KR' ? krListForRail : usListForRail;
  const railIndices = railNames.map((n) => indices.find((i) => i.name === n)).filter((x): x is IndexItem => !!x);

  // PC 우측 레일(레일 콘텐츠) — PageShell의 rail 슬롯으로 전달. 레일이 <aside>를 그림.
  const railNode = (
    <>
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-4">
        <p className="mb-2 text-sm font-bold text-unjong-primary">{t('railMarketTitle')}</p>
        <div className="grid grid-cols-2 gap-2">
          {railIndices.map((idx) => (
            <div key={idx.name} className="rounded-lg bg-unjong-background p-2.5">
              <p className="truncate text-[12px] text-unjong-muted">{idx.name}</p>
              <p className={`text-sm font-semibold tabular-nums ${changeColorClass(idx.changePct, loc)}`}>{pct(idx.changePct)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-unjong-border bg-unjong-surface p-4">
        <p className="mb-2 text-sm font-bold text-unjong-primary">{t('railWatchlistTitle')}</p>
        {!user ? (
          <Link href="/auth/login" className="text-sm font-semibold text-unjong-accent">{t('railWatchlistLogin')}</Link>
        ) : watchlistError ? (
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-sm font-semibold text-unjong-accent">{t('watchlistLoadError')} · {t('retry')}</button>
        ) : !hasWatchlist ? (
          <p className="text-sm text-unjong-muted">{t('onboardingTitle')}</p>
        ) : (
          <>
            {(watchlistQuotes ?? []).slice(0, 6).map((q) => (
              <div key={q.symbol} className="group flex items-center gap-2 border-b border-unjong-border py-2 last:border-0 hover:bg-unjong-background/60">
                <Link href={`/stock/${q.symbol}`} className="flex min-w-0 flex-1 items-center gap-2">
                  <StockLogo code={q.symbol} name={resolveWatchlistName(loc, q)} size={24} />
                  <span className="min-w-0 flex-1 truncate text-sm text-unjong-primary">{resolveWatchlistName(loc, q)}</span>
                  <span className={`shrink-0 text-[13px] font-semibold tabular-nums ${changeColorClass(q.changePercent, loc)}`}>{pct(q.changePercent)}</span>
                </Link>
                <WatchStar symbol={q.symbol} watched={watchSet.has(q.symbol)} onToggle={() => toggleWatch(q.symbol, resolveWatchlistName(loc, q), q.market, q.country)} className={hoverStarClass(watchSet.has(q.symbol))} />
              </div>
            ))}
            <Link href="/favorites" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">{t('railViewAll')}</Link>
          </>
        )}
      </div>
    </>
  );

  return (
    <PageShell rail={railNode}>
        {/* 1) 헤더 — 날짜가 주인공(목업대로·STEP 765b), "오늘" H1·부제 제거(페이지 <title>은 유지) */}
        <div className="mb-6 px-4 sm:px-0">
          <h1 className="text-[22px] font-bold text-unjong-primary lg:text-[26px]">{formattedDate}</h1>
          {homeIndex ? (
            <p className="mt-2 text-[15px] font-medium text-unjong-primary sm:text-sm">
              {t('marketLine', { index: homeIndex.name, pct: pct(homeIndex.changePct) })}
            </p>
          ) : null}
        </div>

        {/* 1.5) 한 입 브리핑 — 하루 1회 배치 생성 리드 문단(STEP 778). 없으면 섹션 생략(지어내지 않음). */}
        {dailyBrief ? (
          <div className="mb-7 px-4 sm:px-0">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-[12px] font-semibold text-unjong-muted">{t('briefSectionLabel')}</span>
              <span className="text-[12px] text-unjong-muted">{tMaterial('briefBadge')}</span>
              {/* STEP 809 §7: 브리핑이 오늘자가 아니면 기준일 배지(크론 실패 시 옛 브리핑을 날짜 없이 붙이던 것 방지) */}
              <AsOfBadge date={dailyBriefDate} loc={loc} market={homeMarket} />
            </div>
            <p className="text-[15px] leading-7 text-unjong-primary">{dailyBrief}</p>
          </div>
        ) : null}

        {/* 2) 내 관심종목 · 렌즈 변화 — 세션 필요라 유일하게 클라 로딩 상태를 가짐 */}
        <section className="mb-7">
          {watchlistLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-unjong-background" />)}
            </div>
          ) : user && watchlistError ? (
            /* 조회 실패를 온보딩(없음)으로 위장하지 않는다(STEP 804 §4) */
            <div className="mx-4 rounded-2xl border border-unjong-border bg-unjong-surface p-5 text-center sm:mx-0">
              <p className="text-[15px] font-medium text-unjong-primary sm:text-sm">{t('watchlistLoadError')}</p>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-2 inline-block text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('retry')}</button>
            </div>
          ) : !user || !hasWatchlist ? (
            <div className="mx-4 rounded-2xl border border-unjong-border bg-unjong-surface p-5 text-center sm:mx-0">
              <p className="text-[15px] font-medium text-unjong-primary sm:text-sm">{t('onboardingTitle')}</p>
              <Link href="/explore" className="mt-2 inline-block text-[15px] font-semibold text-unjong-accent sm:text-sm">{t('onboardingCta')}</Link>
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-col gap-1 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
                <div className="flex items-center">
                  <h2 className="text-base font-bold text-unjong-primary">{t('watchlistChangesTitle')}</h2>
                  <AsOfBadge date={watchlistChangesDate} loc={loc} market={homeMarket} />
                </div>
                <BasisLabel />
              </div>
              {watchlistChanges.length === 0 ? (
                <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noWatchlistChangesToday')}</p>
              ) : (
                <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
                  {groupBySymbol(watchlistChanges).slice(0, 4).map(({ item, extra }, i) => {
                    const q = quoteMap.get(item.symbol);
                    const displayName = q ? resolveWatchlistName(loc, q) : (item.name ?? item.symbol);
                    return (
                      <LensChangeRow
                        key={`${item.symbol}-${item.lensKey}-${i}`} item={item} loc={loc} changePercent={q?.changePercent ?? null} displayName={displayName} market={q?.country ?? 'KR'} extra={extra}
                        watched={watchSet.has(item.symbol)}
                        onToggleWatch={() => toggleWatch(item.symbol, displayName, q?.market ?? (q?.country === 'KR' ? 'KRX' : 'US'), q?.country ?? 'US')}
                      />
                    );
                  })}
                </div>
              )}
              <Link href="/favorites" className="mt-2 inline-block px-4 text-[15px] font-semibold text-unjong-accent sm:px-0 sm:text-sm">{t('viewAllWatchlist')}</Link>
            </>
          )}
        </section>

        {/* 3) 한국 주식 · 오늘의 증권사 리포트(KR) — ORDER_트릴리언홈피드_0905 STEP2: 렌즈 상태 변화 → channel_reports 피드로 교체 */}
        <section className="mb-7">
          <div className="mb-2 px-4 sm:px-0">
            <h2 className="text-base font-bold text-unjong-primary">{t('krCountryLine')}</h2>
            <p className="text-[13px] text-unjong-muted">{t('krReportsTitle')}</p>
          </div>
          {krReports.items.length === 0 ? (
            <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noReportsYet')}</p>
          ) : (
            <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
              {krReports.items.map((r, i) => (
                <ReportRow key={`${r.symbol}-${r.report_date}-${r.broker}-${i}`} item={r} loc={loc} />
              ))}
            </div>
          )}
          {krReports.count > krReports.items.length ? (
            <Link href="/reports?country=KR" className="mt-2 inline-block px-4 text-[15px] font-semibold text-unjong-accent sm:px-0 sm:text-sm">{t('viewMoreReports', { n: krReports.count })}</Link>
          ) : null}
        </section>

        {/* 4) 미국 주식 · 오늘의 기업 실적 전망(US) — 지금은 US 적재 미착수라 0건. 빈 상태만 두고 어댑터가 붙으면 자동으로 채워진다. */}
        <section className="mb-7">
          <div className="mb-2 px-4 sm:px-0">
            <h2 className="text-base font-bold text-unjong-primary">{t('usCountryLine')}</h2>
            <p className="text-[13px] text-unjong-muted">{t('usReportsTitle')}</p>
          </div>
          {usReports.items.length === 0 ? (
            <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noReportsYet')}</p>
          ) : (
            <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
              {usReports.items.map((r, i) => (
                <ReportRow key={`${r.symbol}-${r.report_date}-${r.broker}-${i}`} item={r} loc={loc} />
              ))}
            </div>
          )}
          {usReports.count > usReports.items.length ? (
            <Link href="/reports?country=US" className="mt-2 inline-block px-4 text-[15px] font-semibold text-unjong-accent sm:px-0 sm:text-sm">{t('viewMoreReports', { n: usReports.count })}</Link>
          ) : null}
        </section>

        {/* 5) 각주 */}
        <p className="px-4 text-[13px] leading-relaxed text-unjong-muted sm:px-0 sm:text-xs">{tMaterial('material')}</p>
    </PageShell>
  );
}
