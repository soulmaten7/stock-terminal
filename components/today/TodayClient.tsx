'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/authStore';
import { homeMarketFor } from '@/stores/countryStore';
import { pickLocale } from '@/lib/lensCopy';
import { changeColorClass, type Tone } from '@/lib/lensTones';
import { StockLogo } from '@/components/ui/StockLogo';
import { resolveWatchlistName } from '@/lib/displayName';
import { WatchStar } from '@/components/common/WatchStar';
import { PageShell } from '@/components/layout/PageShell';
import { ReportRow } from '@/components/reports/ReportRow';
import type { HomeReportFeed } from '@/lib/channelReports';
import type { OurChannelCard } from '@/lib/ourChannels';
import { REPORT_COUNTRIES } from '@/lib/constants/reportCountries';

// PC 전용 hover 별(STEP 781 §2) — 탐색 WatchStar 기본값(sm:flex) 위에 평소 투명·행 hover/포커스 시만 표시 추가.
const HOVER_STAR_CLASS = 'hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg opacity-0 transition-opacity sm:flex sm:group-hover:opacity-100 sm:focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unjong-mint';
function hoverStarClass(watched: boolean): string {
  return `${HOVER_STAR_CLASS} ${watched ? 'text-unjong-mint' : 'text-unjong-border'}`;
}

type IndexItem = { name: string; value: string; changeText: string; changePct: number; isUp: boolean; group: string };
type WatchlistQuote = {
  symbol: string; name_ko: string; name_en: string | null; market: string; country: string;
  price: number | null; changePercent: number | null; tones: Tone[] | null;
};


function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
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

export default function TodayClient({ initialReportsByCountry, initialIndices, ourChannels }: {
  initialReportsByCountry: Record<string, HomeReportFeed>; initialIndices: IndexItem[]; ourChannels: OurChannelCard[];
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
  const reportsByCountry = initialReportsByCountry;

  const [watchlistQuotes, setWatchlistQuotes] = useState<WatchlistQuote[] | null>(null); // null=미조회, []=조회했지만 0
  const [watchlistError, setWatchlistError] = useState(false); // 조회 실패 — 온보딩(없음)과 구분(STEP 804 §4)
  const [reloadKey, setReloadKey] = useState(0); // 재시도 트리거

  // 로그인·관심목록 의존 데이터만 클라 fetch(세션 필요 — 서버 프리페치 불가).
  // ORDER_트릴리언렌즈크론정지_0905: "내 관심종목·렌즈 변화" 섹션 제거에 따라 /api/today/changes
  // 호출도 함께 끊는다(라우트·lib/todayChanges.ts 자체는 파킹 — 삭제 아님).
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setWatchlistQuotes([]); setWatchlistError(false); return; }
    let alive = true;
    setWatchlistError(false);
    async function run() {
      const quotes = await fetchJson<{ auth: boolean; watchlist: WatchlistQuote[] }>('/api/watchlist/quotes');
      if (!alive) return;
      // quotes 조회 실패(null)를 '없음(빈 목록)'으로 흡수하지 않는다 — 온보딩 카드가 등록 사용자에게 뜨던 버그(STEP 804 §4).
      if (quotes === null) { setWatchlistError(true); return; }
      setWatchlistQuotes(quotes.watchlist ?? []);
    }
    run();
    return () => { alive = false; };
  }, [user, authLoading, reloadKey]);

  const formattedDate = new Intl.DateTimeFormat(loc === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());

  const hasWatchlist = (watchlistQuotes?.length ?? 0) > 0;

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
        {/* 1) 헤더 — 날짜가 주인공(목업대로·STEP 765b), "오늘" H1·부제 제거(페이지 <title>은 유지).
             ORDER_트릴리언홈히어로정리_0905: 시장 요약 줄(상단 티커·우측 시장 카드와 중복)·한 입
             브리핑(폐지된 렌즈 모델이 생성한 서술) 제거 — 브리핑 생성 크론·API는 화면 호출만 끊음. */}
        <div className="mb-6 px-4 sm:px-0">
          <h1 className="text-[22px] font-bold text-unjong-primary lg:text-[26px]">{formattedDate}</h1>
        </div>

        {/* 2) 국가별 리포트 피드 — REPORT_COUNTRIES를 순회(ORDER_트릴리언국가확장구조_0905 STEP2: 국가
             추가는 lib/constants/reportCountries.ts + messages 국가 블록만으로 끝나야 한다, 컴포넌트 수정 없이). */}
        {[...REPORT_COUNTRIES].sort((a, b) => a.displayOrder - b.displayOrder).map((rc) => {
          const feed = reportsByCountry[rc.code] ?? { items: [], count: 0 };
          return (
            <section key={rc.code} className="mb-7">
              <h2 className="mb-2 px-4 text-base font-bold text-unjong-primary sm:px-0">
                {rc.flag} {t(`countries.${rc.code}.name`)} <span className="font-normal text-unjong-muted">· {t(`countries.${rc.code}.reportsTitle`)}</span>
              </h2>
              {feed.items.length === 0 ? (
                <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t('noReportsYet')}</p>
              ) : (
                <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
                  {feed.items.map((r, i) => (
                    <ReportRow key={`${r.symbol}-${r.report_date}-${r.broker}-${i}`} item={r} loc={loc} compact />
                  ))}
                </div>
              )}
              {feed.count > feed.items.length ? (
                <Link href={`/reports?country=${rc.code}`} className="mt-2 inline-block px-4 text-[15px] font-semibold text-unjong-accent sm:px-0 sm:text-sm">{t('viewMoreReports', { n: feed.count })}</Link>
              ) : null}
            </section>
          );
        })}

        {/* 3) 우리 채널 — ORDER_트릴리언채널카드_0905 STEP2: 리포트 피드 다음 행선지로 유튜브 채널 2개 노출 */}
        <section className="mb-7">
          <h2 className="mb-2 px-4 text-base font-bold text-unjong-primary sm:px-0">{t('ourChannelsTitle')}</h2>
          <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:px-0">
            {ourChannels.map((c) => (
              <a
                key={c.channel_key}
                href={c.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-unjong-border bg-unjong-surface p-4 transition-colors hover:bg-unjong-background/60"
              >
                {c.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail_url} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-unjong-background text-xl">📺</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-unjong-primary sm:text-sm">
                    {REPORT_COUNTRIES.find((rc) => rc.code === c.country_code)?.flag} {c.title}
                  </p>
                  {/* 구독자수 표시는 끔(ORDER_트릴리언국가확장구조_0905 §0-1(A)) — our_channels.subscriber_count·
                      크론·refreshOurChannels()는 그대로 두고 화면만 채널 설명으로 교체. 숫자가 커지면 이 줄만 되돌리면 된다. */}
                  <p className="mt-0.5 truncate text-[13px] text-unjong-muted">{t(`countries.${c.country_code}.channelDescription`)}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* 4) 각주 */}
        <p className="px-4 text-[13px] leading-relaxed text-unjong-muted sm:px-0 sm:text-xs">{tMaterial('material')}</p>
    </PageShell>
  );
}
