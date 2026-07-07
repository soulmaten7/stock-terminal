'use client';

import { Fragment, useState, useEffect } from 'react';
import LinkCard, { type LinkItem } from './LinkCard';
import AdSlotRow from './AdSlotRow';
import YoutubeRanking, { type YtChannel } from './YoutubeRanking';
import AdvisorDirectory from './AdvisorDirectory';
import MarketBoard from './MarketBoard';
import UsMarketBoard from './UsMarketBoard';
import JpMarketBoard from './JpMarketBoard';
import CnMarketBoard from './CnMarketBoard';
import VnMarketBoard from './VnMarketBoard';
import NewsFeed from './NewsFeed';
import DartFeed from './DartFeed';
import SecFeed from './SecFeed';
import MacroFeed from './MacroFeed';
import OfferingsFeed from './OfferingsFeed';
import { useCountryStore, type Country } from '@/stores/countryStore';

type LinkWithCountry = LinkItem & { country?: string | null };
type Category = { slug: string; label: string; links: LinkWithCountry[] };

const COUNTRIES: { code: Country; label: string }[] = [
  { code: 'KR', label: '한국' },
  { code: 'US', label: '미국' },
  { code: 'JP', label: '일본' },
  { code: 'CN', label: '중국' },
  { code: 'VN', label: '베트남' },
  { code: 'GB', label: '영국' },
];

// 탭 표시 순서 (V7 재정렬): 뉴스·증권사·유튜브 앞으로, 리딩방 끝
const TAB_ORDER = ['market', 'chart', 'news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'exchange', 'community', 'youtube', 'room'];
// 탭 묶음 경계 — 각 묶음의 첫 탭 앞에 얇은 구분선(시세 | 정보 | 상품 | 거래소·기관 | 사람)
const CLUSTER_START = new Set(['news', 'etf', 'exchange', 'community']);
// link_hub 카테고리가 아닌 특수 탭의 라벨
const SPECIAL_LABELS: Record<string, string> = { market: '종목·상품', youtube: '유튜브', room: '리딩방·검증' };

// 우측 피드가 붙는 탭 + 탭별 피드 컴포넌트
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf', 'ipo'];
// 모바일 서브탭에서 '모아보기(피드)' 쪽 라벨 (링크 ↔ 피드 분리)
const FEED_SUB_LABEL: Record<string, string> = {
  news: '최신 뉴스', disclosure: '최신 공시', macro: '주요 지표',
  analysis: '실적·재무 뉴스', research: '목표주가 뉴스', etf: 'ETF 뉴스', ipo: '청약 일정',
};

// 피드별 지원 국가 — 단일 'KR' 가드 대체. 점진 확장(뉴스·공시는 후속 STEP에서 US 추가).
// 현재 macro만 US 개방(/api/macro/summary가 ECOS+FRED 둘 다 반환). 나머지는 KR 전용 유지.
const FEED_COUNTRY_SUPPORT: Record<string, Country[]> = {
  news: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], research: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], etf: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'], ipo: ['KR', 'US', 'JP', 'CN', 'VN', 'GB'],
};
function feedSupports(tab: string, c: Country) { return FEED_COUNTRY_SUPPORT[tab]?.includes(c) ?? false; }

function feedFor(tab: string, country: Country) {
  switch (tab) {
    case 'news': return <NewsFeed country={country} />;
    case 'disclosure': return country === 'US' ? <SecFeed /> : <DartFeed />;
    case 'macro': return <MacroFeed defaultView={country === 'US' ? 'us' : 'kr'} />;
    case 'analysis': return country === 'US'
      ? <NewsFeed country="US" query="US stock company earnings results" title="미국 실적·기업 뉴스" />
      : country === 'JP'
      ? <NewsFeed country="JP" query="決算 業績 日本株" title="일본 실적·기업 뉴스" />
      : country === 'CN'
      ? <NewsFeed country="CN" query="業績 財報 港股 A股" title="중화권 실적·기업 뉴스" />
      : country === 'VN'
      ? <NewsFeed country="VN" query="kết quả kinh doanh lợi nhuận doanh nghiệp" title="베트남 실적·기업 뉴스" />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK stock earnings results company" title="영국 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
    case 'research': return country === 'US'
      ? <NewsFeed country="US" query="stock analyst rating price target upgrade downgrade" title="미국 애널리스트·리포트 뉴스" />
      : country === 'JP'
      ? <NewsFeed country="JP" query="アナリスト 目標株価 レーティング" title="일본 애널리스트·리포트 뉴스" />
      : country === 'CN'
      ? <NewsFeed country="CN" query="目標價 評級 券商 港股" title="중화권 애널리스트·리포트 뉴스" />
      : country === 'VN'
      ? <NewsFeed country="VN" query="khuyến nghị cổ phiếu giá mục tiêu" title="베트남 애널리스트·리포트 뉴스" />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK stock analyst rating price target" title="영국 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
    case 'etf': return country === 'US'
      ? <NewsFeed country="US" query="ETF fund inflows stock market" title="미국 ETF·펀드 뉴스" />
      : country === 'JP'
      ? <NewsFeed country="JP" query="ETF 投資信託 日本" title="일본 ETF·펀드 뉴스" />
      : country === 'CN'
      ? <NewsFeed country="CN" query="ETF 基金 港股 A股" title="중화권 ETF·펀드 뉴스" />
      : country === 'VN'
      ? <NewsFeed country="VN" query="ETF quỹ đầu tư chứng khoán" title="베트남 ETF·펀드 뉴스" />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK ETF fund LSE investment trust" title="영국 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
    case 'ipo': return country === 'US'
      ? <NewsFeed country="US" query="IPO stock market debut listing" title="미국 IPO·공모 뉴스" />
      : country === 'JP'
      ? <NewsFeed country="JP" query="IPO 新規上場 日本" title="일본 IPO·공모 뉴스" />
      : country === 'CN'
      ? <NewsFeed country="CN" query="新股 IPO 上市 港股" title="중화권 IPO·공모 뉴스" />
      : country === 'VN'
      ? <NewsFeed country="VN" query="IPO niêm yết cổ phiếu mới" title="베트남 IPO·공모 뉴스" />
      : country === 'GB'
      ? <NewsFeed country="GB" query="UK IPO London Stock Exchange listing" title="영국 IPO·공모 뉴스" />
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
  const { country, setCountry } = useCountryStore();
  const [categories, setCategories] = useState(initialCategories);
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0]);
  const [feedSub, setFeedSub] = useState<'links' | 'feed'>('feed'); // 모바일 서브탭(모아보기 먼저)

  // 새로고침해도 마지막 탭 유지 (국가는 useCountryStore persist가 담당)
  useEffect(() => {
    const t = localStorage.getItem('unjong_tab');
    if (t && TAB_ORDER.includes(t)) setActiveTab(t);
  }, []);
  useEffect(() => { localStorage.setItem('unjong_tab', activeTab); setFeedSub('feed'); }, [activeTab]);

  // 탭 = TAB_ORDER 순서. 현재 국가에 콘텐츠가 있는 탭만 표시.
  // - 특수탭(종목·상품·유튜브·리딩방) = 라이브 데이터(KRX·유튜브·금감원)라 한국 전용
  // - 카테고리 탭 = 해당 국가에 큐레이션 링크가 있을 때만 → 미국 '준비 중' 벽 제거(깨끗한 링크 허브)
  const tabs = TAB_ORDER.map((slug) => {
    const special = SPECIAL_LABELS[slug];
    if (special) {
      // market(종목·상품)은 미국도 라이브 데이터(Yahoo) 제공 → KR/US 모두 노출.
      // youtube·room은 한국 전용 데이터라 KR만.
      if (slug === 'market') return { slug, label: special };
      return country === 'KR' ? { slug, label: special } : null;
    }
    const c = categories.find((cat) => cat.slug === slug);
    const hasLinks = !!c && c.links.some((l) => l.country === country);
    // 피드 지원국가면 큐레이션 링크가 없어도 탭 노출(예: US 거시는 FRED 라이브) → KR 동작은 동일.
    const show = hasLinks || feedSupports(slug, country);
    return show && c ? { slug, label: c.label } : null;
  }).filter((t): t is { slug: string; label: string } => t !== null);

  // 국가 전환 시 현재 탭이 그 국가에 없으면 첫 유효 탭으로 이동
  useEffect(() => {
    if (tabs.length && !tabs.some((t) => t.slug === activeTab)) setActiveTab(tabs[0].slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, activeTab]);

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
  const countryLabel = ({ KR: '한국', US: '미국', JP: '일본', CN: '중국' } as Record<Country, string>)[country];

  return (
    <div className="min-w-0 rounded-2xl border border-unjong-border bg-unjong-surface">
      {/* 국가 토글 */}
      <div className="flex items-center gap-1 border-b border-unjong-border p-3">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCountry(c.code)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              country === c.code ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 카테고리 탭 */}
      <div className="flex items-stretch gap-1 overflow-x-auto border-b border-unjong-border px-2 py-2 sm:px-3">
        {tabs.map((t, i) => (
          <Fragment key={t.slug}>
            {i > 0 && CLUSTER_START.has(t.slug) ? (
              <span aria-hidden className="mx-1 my-1 w-px shrink-0 self-stretch bg-unjong-border" />
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTab(t.slug)}
              className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:py-1.5 ${
                activeTab === t.slug ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
              }`}
            >
              {t.label}
            </button>
          </Fragment>
        ))}
      </div>

      {/* 내용 */}
      <div className="p-3 sm:p-4">
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
            <Placeholder emoji="🇬🇧" title="영국 종목·상품 — 준비 중" desc="곧 제공됩니다" />
          )
        ) : activeTab === 'youtube' ? (
          country === 'KR' ? (
            <YoutubeRanking channels={youtubeChannels} />
          ) : (
            <Placeholder emoji="🇺🇸" title="미국 주식 유튜브 — 준비 중" />
          )
        ) : activeTab === 'room' ? (
          country === 'KR' ? (
            <AdvisorDirectory isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇺🇸" title="미국 — 준비 중" />
          )
        ) : FEED_TABS.includes(activeTab) && feedSupports(activeTab, country) ? (
          <div>
            {/* 모바일 전용 서브탭 — 링크 ↔ 모아보기 (데스크탑은 2단이라 숨김) */}
            <div className="mb-3 flex gap-1 lg:hidden">
              <button type="button" onClick={() => setFeedSub('feed')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${feedSub === 'feed' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}>{FEED_SUB_LABEL[activeTab] ?? '모아보기'}</button>
              <button type="button" onClick={() => setFeedSub('links')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${feedSub === 'links' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}>링크모음</button>
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
                  <p className="py-10 text-center text-sm text-unjong-muted">큐레이션 링크 준비 중</p>
                )}
              </div>
              <aside className={`w-full shrink-0 lg:w-96 ${feedSub === 'feed' ? '' : 'hidden'} lg:block`}>
                {feedFor(activeTab, country)}
              </aside>
            </div>
          </div>
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
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
