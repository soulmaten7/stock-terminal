'use client';

import { Fragment, useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import LinkCard, { type LinkItem } from './LinkCard';
import AdSlotRow from './AdSlotRow';
import YoutubeRanking, { type YtChannel } from './YoutubeRanking';
import AdvisorDirectory from './AdvisorDirectory';
import BrokerRanking from './BrokerRanking';
import MarketBoard from './MarketBoard';
import UsMarketBoard from './UsMarketBoard';
import JpMarketBoard from './JpMarketBoard';
import CnMarketBoard from './CnMarketBoard';
import VnMarketBoard from './VnMarketBoard';
import GbMarketBoard from './GbMarketBoard';
import NewsFeed from './NewsFeed';
import DartFeed from './DartFeed';
import SecFeed from './SecFeed';
import MacroFeed from './MacroFeed';
import OfferingsFeed from './OfferingsFeed';
import UsOfferingsFeed from './UsOfferingsFeed';
import { useCountryStore, homeMarketFor, COUNTRY_STORAGE_KEY, type Country } from '@/stores/countryStore';
import { useHomeReset } from '@/stores/homeResetStore';
import { clearBoardViews } from '@/lib/boardMemory';

type LinkWithCountry = LinkItem & { country?: string | null };
type Category = { slug: string; label: string; links: LinkWithCountry[] };

// 모듈 최상위 상수라 훅을 못 쓴다 → 라벨 자리에 'ko.json 키'를 담고, 렌더 지점에서 t()로 해석.
type Translate = ReturnType<typeof useTranslations>;

const COUNTRIES: { code: Country; labelKey: string }[] = [
  { code: 'KR', labelKey: 'country.KR' },
  { code: 'US', labelKey: 'country.US' },
  { code: 'JP', labelKey: 'country.JP' },
  { code: 'CN', labelKey: 'country.CN' },
  { code: 'VN', labelKey: 'country.VN' },
  { code: 'GB', labelKey: 'country.GB' },
];

// ── 2단 네비 (2026-07-10 재구조) ──────────────────────────────
// 상단 2탭: 종목 · 정보. 나머지(증권사·유사투자자문 조회 등)는 "정보" 하위탭으로 접음. (검증→'유사투자자문 조회'로 정보 하위 이동)
// 근거: 빅테크식 최소·직관 네비 + catch-all 금지(네이버·다음·야후 관행) — 자세히는 docs/BRAND_IDENTITY.md.
const TOP_TABS = ['market', 'info'] as const;
type TopTab = (typeof TOP_TABS)[number];
const TOP_LABEL_KEYS: Record<TopTab, string> = { market: 'top.market', info: 'top.info' };

// "정보" 하위탭 순서 — 우리 정보(피드) 먼저, 외부·거래처(증권사·차트·거래소·커뮤니티·유튜브)는 구분선 뒤.
// 증권사=참조 디렉토리로 강등(트래픽 낮음). 수익은 종목 리스트 인리스트 광고로(설계: docs/AD_MONETIZATION_PLAYBOOK).
const INFO_ORDER = ['news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'broker', 'room', 'chart', 'exchange', 'community', 'youtube'];
// 하위탭 짧은 라벨(최소 UI). 없는 건 카테고리 라벨(DB)로 폴백 — 폴백은 번역 대상 아님.
const INFO_LABEL_KEYS: Record<string, string> = {
  news: 'info.news', disclosure: 'info.disclosure', research: 'info.research', analysis: 'info.analysis', macro: 'info.macro', etf: 'info.etf', ipo: 'info.ipo',
  broker: 'info.broker', room: 'info.room', chart: 'info.chart', exchange: 'info.exchange', community: 'info.community', youtube: 'info.youtube',
};
// 외부·거래처 하위탭 — 구분선 뒤로(곁가지 표시)
const INFO_EXTERNAL = new Set(['broker', 'room', 'chart', 'exchange', 'community', 'youtube']);
// 유효 slug 전체(로컬스토리지 복원 검증용)
const ALL_SLUGS = ['market', ...INFO_ORDER];

function topOf(slug: string): TopTab {
  if (slug === 'market') return 'market';
  return 'info';
}

// 우측 피드가 붙는 탭 + 탭별 피드 컴포넌트
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf', 'ipo'];
// 모바일 서브탭에서 '모아보기(피드)' 쪽 라벨 (링크 ↔ 피드 분리)
const FEED_SUB_LABEL_KEYS: Record<string, string> = {
  news: 'feedSub.news', disclosure: 'feedSub.disclosure', macro: 'feedSub.macro',
  analysis: 'feedSub.analysis', research: 'feedSub.research', etf: 'feedSub.etf', ipo: 'feedSub.ipo',
};

// 피드별 지원 국가 — 단일 'KR' 가드 대체. 점진 확장(뉴스·공시는 후속 STEP에서 US 추가).
// 현재 macro만 US 개방(/api/macro/summary가 ECOS+FRED 둘 다 반환). 나머지는 KR 전용 유지.
const FEED_COUNTRY_SUPPORT: Record<string, Country[]> = {
  news: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], research: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], etf: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], ipo: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'],
};
function feedSupports(tab: string, c: Country) { return FEED_COUNTRY_SUPPORT[tab]?.includes(c) ?? false; }

// query는 검색어(화면에 안 보임) → 번역 대상 아님. title만 t()로.
function feedFor(tab: string, country: Country, t: Translate) {
  switch (tab) {
    case 'news': return <NewsFeed country={country} />;
    case 'disclosure': return country === 'US' ? <SecFeed /> : <DartFeed />;
    case 'macro': return <MacroFeed defaultView={country === 'US' ? 'us' : 'kr'} />;
    case 'analysis': return country === 'US'
      ? <NewsFeed country="US" query="US stock company earnings results" title={t('feedTitle.analysis.US')} />
      : country === 'JP'
      ? <NewsFeed country="JP" query="決算 業績 日本株" title={t('feedTitle.analysis.JP')} />
      : country === 'CN'
      ? <NewsFeed country="CN" query="業績 財報 港股 A股" title={t('feedTitle.analysis.CN')} />
      : country === 'VN'
      ? <NewsFeed country="VN" query="kết quả kinh doanh lợi nhuận doanh nghiệp" title={t('feedTitle.analysis.VN')} />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK stock earnings results company" title={t('feedTitle.analysis.GB')} />
      : <NewsFeed query="실적 영업이익 잠정" title={t('feedTitle.analysis.KR')} />;
    case 'research': return country === 'US'
      ? <NewsFeed country="US" query="stock analyst rating price target upgrade downgrade" title={t('feedTitle.research.US')} />
      : country === 'JP'
      ? <NewsFeed country="JP" query="アナリスト 目標株価 レーティング" title={t('feedTitle.research.JP')} />
      : country === 'CN'
      ? <NewsFeed country="CN" query="目標價 評級 券商 港股" title={t('feedTitle.research.CN')} />
      : country === 'VN'
      ? <NewsFeed country="VN" query="khuyến nghị cổ phiếu giá mục tiêu" title={t('feedTitle.research.VN')} />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK stock analyst rating price target" title={t('feedTitle.research.GB')} />
      : <NewsFeed query="증권사 리포트 목표주가" title={t('feedTitle.research.KR')} />;
    case 'etf': return country === 'US'
      ? <NewsFeed country="US" query="ETF fund inflows stock market" title={t('feedTitle.etf.US')} />
      : country === 'JP'
      ? <NewsFeed country="JP" query="ETF 投資信託 日本" title={t('feedTitle.etf.JP')} />
      : country === 'CN'
      ? <NewsFeed country="CN" query="ETF 基金 港股 A股" title={t('feedTitle.etf.CN')} />
      : country === 'VN'
      ? <NewsFeed country="VN" query="ETF quỹ đầu tư chứng khoán" title={t('feedTitle.etf.VN')} />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK ETF fund LSE investment trust" title={t('feedTitle.etf.GB')} />
      : <NewsFeed query="ETF 상장 순자산총액" title={t('feedTitle.etf.KR')} />;
    case 'ipo': return country === 'US'
      ? <UsOfferingsFeed />
      : country === 'JP'
      ? <NewsFeed country="JP" query="IPO 新規上場 日本" title={t('feedTitle.ipo.JP')} />
      : country === 'CN'
      ? <NewsFeed country="CN" query="新股 IPO 上市 港股" title={t('feedTitle.ipo.CN')} />
      : country === 'VN'
      ? <NewsFeed country="VN" query="IPO niêm yết cổ phiếu mới" title={t('feedTitle.ipo.VN')} />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK IPO London Stock Exchange listing" title={t('feedTitle.ipo.GB')} />
      : <OfferingsFeed />;
    default: return null;
  }
}

function Placeholder({ emoji, title, desc }: { emoji: string; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-2 text-2xl">{emoji}</span>
      <p className="text-sm font-medium text-unjong-primary">{title}</p>
      {desc ? <p className="mt-1 text-xs text-unjong-muted">{desc}</p> : null}
    </div>
  );
}

export default function ToolboxClient({
  initialCategories,
  isLoggedIn,
  youtubeChannels,
}: {
  initialCategories: Category[];
  isLoggedIn: boolean;
  youtubeChannels: YtChannel[];
}) {
  const t = useTranslations('Toolbox');
  const locale = useLocale();
  const homeCountry = homeMarketFor(locale); // ko → KR · en → US
  const { country, setCountry } = useCountryStore();
  const [categories, setCategories] = useState(initialCategories);
  const [activeTab, setActiveTab] = useState<string>('market');
  const [lastInfoSub, setLastInfoSub] = useState<string>('news'); // "정보" 재진입 시 마지막 하위탭 기억
  const [feedSub, setFeedSub] = useState<'links' | 'feed'>('feed'); // 모바일 서브탭(모아보기 먼저)

  // 새로고침해도 마지막 탭 유지 (국가는 useCountryStore persist가 담당)
  useEffect(() => {
    const saved = localStorage.getItem('unjong_tab');
    if (saved && ALL_SLUGS.includes(saved)) {
      setActiveTab(saved);
      if (INFO_ORDER.includes(saved)) setLastInfoSub(saved);
    }
  }, []);
  useEffect(() => { localStorage.setItem('unjong_tab', activeTab); setFeedSub('feed'); }, [activeTab]);

  // 국가탭 순서 — 로케일의 홈 시장을 맨 앞으로. 나머지는 기존 상대순서 유지(en: US·KR·JP·CN·VN·GB).
  const countryTabs = useMemo(
    () => [
      ...COUNTRIES.filter((c) => c.code === homeCountry),
      ...COUNTRIES.filter((c) => c.code !== homeCountry),
    ],
    [homeCountry]
  );

  // 로케일 기본 국가 — "저장된 선택이 아직 없는 첫 방문"에만 홈 시장으로 맞춘다.
  // 사용자가 한 번이라도 국가를 고르면 persist에 남고, 그 선택이 항상 이긴다(로케일이 덮지 않음).
  // 이미 그 국가면 아무것도 하지 않는다 → STEP 703 보드 뷰 복원(종목 상세 왕복)이 그대로 산다.
  const localeDefaultDone = useRef(false);
  useEffect(() => {
    if (localeDefaultDone.current) return;
    localeDefaultDone.current = true;
    let stored: string | null = null;
    try { stored = localStorage.getItem(COUNTRY_STORAGE_KEY); } catch { /* 비가용 무시 */ }
    if (stored) return; // 사용자의 과거 선택 존중
    if (useCountryStore.getState().country === homeCountry) return; // 바꿀 게 없음(=보드 뷰 보존)
    clearBoardViews();
    setCountry(homeCountry);
  }, [homeCountry, setCountry]);

  // 헤더 로고/'주식' 클릭 → 홈 뷰 리셋(탭=종목·서브=모아보기). 국가는 유지(STEP 748) — persist 선택이 이긴다.
  const homeResetN = useHomeReset((s) => s.n);
  const homeMounted = useRef(false);
  useEffect(() => {
    if (!homeMounted.current) { homeMounted.current = true; return; }
    setActiveTab('market');
    setFeedSub('feed');
  }, [homeResetN]);

  // ── 하위탭(정보) 가용성: 국가별. 피드는 지원국가, 링크 카테고리는 링크 존재, 유튜브는 KR. ──
  const infoSubs = INFO_ORDER.map((slug) => {
    if (slug === 'broker') return { slug, label: t(INFO_LABEL_KEYS.broker) }; // 증권사 = 전 국가 참조 디렉토리(항상)
    if (slug === 'youtube') return country === 'KR' ? { slug, label: t(INFO_LABEL_KEYS.youtube) } : null;
    if (slug === 'room') return country === 'KR' ? { slug, label: t(INFO_LABEL_KEYS.room) } : null; // 유사투자자문사 = KR 전용
    const c = categories.find((cat) => cat.slug === slug);
    const hasLinks = !!c && c.links.some((l) => l.country === country);
    const show = (FEED_TABS.includes(slug) && feedSupports(slug, country)) || hasLinks;
    if (!show) return null;
    return { slug, label: INFO_LABEL_KEYS[slug] ? t(INFO_LABEL_KEYS[slug]) : (c?.label ?? slug) };
  }).filter((s): s is { slug: string; label: string } => s !== null);

  // ── 상단 2탭 가용성: market 항상, info는 하위탭 있을 때. (검증=유사투자자문 조회는 info 하위탭) ──
  const topTabs = TOP_TABS.filter((tab) => {
    if (tab === 'info') return infoSubs.length > 0;
    return true;
  });
  const activeTop = topOf(activeTab);

  // 국가 전환 시 현재 탭이 그 국가에 없으면 보정
  useEffect(() => {
    if (INFO_ORDER.includes(activeTab) && !infoSubs.some((s) => s.slug === activeTab)) {
      setActiveTab(infoSubs[0]?.slug ?? 'market');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, activeTab]);

  const selectTop = (tab: TopTab) => {
    if (tab === 'info') {
      const target = infoSubs.some((s) => s.slug === lastInfoSub) ? lastInfoSub : (infoSubs[0]?.slug ?? 'news');
      setActiveTab(target);
    } else {
      setActiveTab(tab);
    }
  };
  const selectSub = (slug: string) => { setActiveTab(slug); setLastInfoSub(slug); };

  const handleFavoriteToggle = (id: number, fav: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        links: cat.links.map((l) => (l.id === id ? { ...l, isFavorite: fav } : l)),
      }))
    );
  };

  const cat = categories.find((c) => c.slug === activeTab);
  const catLinks = cat ? cat.links.filter((l) => l.country === country) : [];
  const countryLabel = t(`country.${country}`);

  return (
    <div className="min-w-0 border-y border-unjong-border bg-unjong-surface sm:rounded-2xl sm:border">
      {/* 국가 토글 */}
      <div className="flex items-center gap-1 border-b border-unjong-border p-3">
        {countryTabs.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => { clearBoardViews(); setCountry(c.code); }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              country === c.code ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      {/* 상단 2탭 — 종목 · 정보 (검증=유사투자자문 조회는 정보 하위탭) */}
      <div className="flex items-stretch gap-1 overflow-x-auto border-b border-unjong-border px-2 py-2 sm:px-3">
        {topTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => selectTop(tab)}
            className={`shrink-0 rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors sm:py-1.5 ${
              activeTop === tab ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {t(TOP_LABEL_KEYS[tab])}
          </button>
        ))}
      </div>

      {/* "정보" 하위탭 — 피드 먼저, 외부 링크성은 구분선 뒤 */}
      {activeTop === 'info' && infoSubs.length > 0 ? (
        <div className="flex items-stretch gap-1 overflow-x-auto border-b border-unjong-border px-2 py-1.5 sm:px-3">
          {infoSubs.map((s, i) => (
            <Fragment key={s.slug}>
              {i > 0 && INFO_EXTERNAL.has(s.slug) && !INFO_EXTERNAL.has(infoSubs[i - 1].slug) ? (
                <span aria-hidden className="mx-1 my-1 w-px shrink-0 self-stretch bg-unjong-border" />
              ) : null}
              <button
                type="button"
                onClick={() => selectSub(s.slug)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  activeTab === s.slug ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'
                }`}
              >
                {s.label}
              </button>
            </Fragment>
          ))}
        </div>
      ) : null}

      {/* 내용 — 홈 리셋(n) 시 리마운트해 보드 서브필터(주식/ETF…)까지 초기화 */}
      <div className="p-3 sm:p-4" key={`content-${homeResetN}`}>
        {activeTab === 'market' ? (
          country === 'KR' ? (
            <MarketBoard isLoggedIn={isLoggedIn} />
          ) : country === 'US' ? (
            <UsMarketBoard isLoggedIn={isLoggedIn} />
          ) : country === 'JP' ? (
            <JpMarketBoard isLoggedIn={isLoggedIn} />
          ) : country === 'CN' ? (
            <CnMarketBoard isLoggedIn={isLoggedIn} />
          ) : country === 'VN' ? (
            <VnMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <GbMarketBoard isLoggedIn={isLoggedIn} />
          )
        ) : activeTab === 'broker' ? (
          <div className="w-full">
            <BrokerRanking region={locale === 'en' ? 'US' : 'KR'} />
          </div>
        ) : activeTab === 'youtube' ? (
          country === 'KR' ? (
            <YoutubeRanking channels={youtubeChannels} />
          ) : (
            <Placeholder emoji="🇺🇸" title={t('youtubeComingSoon')} />
          )
        ) : activeTab === 'room' ? (
          country === 'KR' ? (
            <AdvisorDirectory isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇺🇸" title={t('roomComingSoon')} />
          )
        ) : FEED_TABS.includes(activeTab) && feedSupports(activeTab, country) ? (
          <div>
            {/* 모바일 전용 서브탭 — 링크 ↔ 모아보기 (데스크탑은 2단이라 숨김) */}
            <div className="mb-3 flex gap-1 lg:hidden">
              <button type="button" onClick={() => setFeedSub('feed')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${feedSub === 'feed' ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}>{t(FEED_SUB_LABEL_KEYS[activeTab] ?? 'feedSub.fallback')}</button>
              <button type="button" onClick={() => setFeedSub('links')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${feedSub === 'links' ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}>{t('shortcuts')}</button>
            </div>
            <div className="flex flex-col gap-5 lg:flex-row lg:gap-4">
              <div className={`min-w-0 flex-1 ${feedSub === 'links' ? '' : 'hidden'} lg:block`}>
                {catLinks.length > 0 ? (
                  catLinks.map((link, i) => (
                    <Fragment key={link.id}>
                      <LinkCard
                        link={link}
                        isLoggedIn={isLoggedIn}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                      {(i + 1) % 10 === 0 && i + 1 < catLinks.length ? <AdSlotRow slot="feed" /> : null}
                    </Fragment>
                  ))
                ) : (
                  <p className="py-10 text-center text-sm text-unjong-muted">{t('linksEmpty')}</p>
                )}
              </div>
              <aside className={`w-full shrink-0 lg:w-96 ${feedSub === 'feed' ? '' : 'hidden'} lg:block`}>
                {feedFor(activeTab, country, t)}
              </aside>
            </div>
          </div>
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={t('linksComingSoon', { cat: cat?.label ?? '', country: countryLabel })} />
        ) : (
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              {catLinks.map((link, i) => (
                <Fragment key={link.id}>
                  <LinkCard
                    link={link}
                    isLoggedIn={isLoggedIn}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                  {(i + 1) % 10 === 0 && i + 1 < catLinks.length ? <AdSlotRow slot="feed" /> : null}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
