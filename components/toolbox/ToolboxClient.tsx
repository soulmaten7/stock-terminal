'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
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
import { useCountryStore, type Country } from '@/stores/countryStore';
import { useHomeReset } from '@/stores/homeResetStore';
import { clearBoardViews } from '@/lib/boardMemory';

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

// ── 2단 네비 (2026-07-10 재구조) ──────────────────────────────
// 상단 2탭: 종목 · 정보. 나머지(증권사·유사투자자문 조회 등)는 "정보" 하위탭으로 접음. (검증→'유사투자자문 조회'로 정보 하위 이동)
// 근거: 빅테크식 최소·직관 네비 + catch-all 금지(네이버·다음·야후 관행) — 자세히는 docs/BRAND_IDENTITY.md.
const TOP_TABS = ['market', 'info'] as const;
type TopTab = (typeof TOP_TABS)[number];
const TOP_LABELS: Record<TopTab, string> = { market: '종목', info: '정보' };

// "정보" 하위탭 순서 — 우리 정보(피드) 먼저, 외부·거래처(증권사·차트·거래소·커뮤니티·유튜브)는 구분선 뒤.
// 증권사=참조 디렉토리로 강등(트래픽 낮음). 수익은 종목 리스트 인리스트 광고로(설계: docs/AD_MONETIZATION_PLAYBOOK).
const INFO_ORDER = ['news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'broker', 'room', 'chart', 'exchange', 'community', 'youtube'];
// 하위탭 짧은 라벨(최소 UI). 없는 건 카테고리 라벨로 폴백.
const INFO_LABELS: Record<string, string> = {
  news: '뉴스', disclosure: '공시', research: '리포트', analysis: '기업·재무', macro: '거시', etf: 'ETF', ipo: '공모주',
  broker: '증권사', room: '유사투자자문사', chart: '차트', exchange: '거래소', community: '토론·커뮤니티', youtube: '유튜브',
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
  const [activeTab, setActiveTab] = useState<string>('market');
  const [lastInfoSub, setLastInfoSub] = useState<string>('news'); // "정보" 재진입 시 마지막 하위탭 기억
  const [feedSub, setFeedSub] = useState<'links' | 'feed'>('feed'); // 모바일 서브탭(모아보기 먼저)

  // 새로고침해도 마지막 탭 유지 (국가는 useCountryStore persist가 담당)
  useEffect(() => {
    const t = localStorage.getItem('unjong_tab');
    if (t && ALL_SLUGS.includes(t)) {
      setActiveTab(t);
      if (INFO_ORDER.includes(t)) setLastInfoSub(t);
    }
  }, []);
  useEffect(() => { localStorage.setItem('unjong_tab', activeTab); setFeedSub('feed'); }, [activeTab]);

  // 헤더 로고/'주식' 클릭 → 홈 리셋. 국가는 store가 KR로, 여기선 탭=종목·서브=모아보기로.
  const homeResetN = useHomeReset((s) => s.n);
  const homeMounted = useRef(false);
  useEffect(() => {
    if (!homeMounted.current) { homeMounted.current = true; return; }
    setActiveTab('market');
    setFeedSub('feed');
  }, [homeResetN]);

  // ── 하위탭(정보) 가용성: 국가별. 피드는 지원국가, 링크 카테고리는 링크 존재, 유튜브는 KR. ──
  const infoSubs = INFO_ORDER.map((slug) => {
    if (slug === 'broker') return { slug, label: INFO_LABELS.broker }; // 증권사 = 전 국가 참조 디렉토리(항상)
    if (slug === 'youtube') return country === 'KR' ? { slug, label: INFO_LABELS.youtube } : null;
    if (slug === 'room') return country === 'KR' ? { slug, label: INFO_LABELS.room } : null; // 검증(유사투자자문 조회) = KR 전용
    const c = categories.find((cat) => cat.slug === slug);
    const hasLinks = !!c && c.links.some((l) => l.country === country);
    const show = (FEED_TABS.includes(slug) && feedSupports(slug, country)) || hasLinks;
    if (!show) return null;
    return { slug, label: INFO_LABELS[slug] ?? c?.label ?? slug };
  }).filter((t): t is { slug: string; label: string } => t !== null);

  // ── 상단 2탭 가용성: market 항상, info는 하위탭 있을 때. (검증=유사투자자문 조회는 info 하위탭) ──
  const topTabs = TOP_TABS.filter((t) => {
    if (t === 'info') return infoSubs.length > 0;
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

  const selectTop = (t: TopTab) => {
    if (t === 'info') {
      const target = infoSubs.some((s) => s.slug === lastInfoSub) ? lastInfoSub : (infoSubs[0]?.slug ?? 'news');
      setActiveTab(target);
    } else {
      setActiveTab(t);
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
  const countryLabel = ({ KR: '한국', US: '미국', JP: '일본', CN: '중국', VN: '베트남', GB: '영국' } as Record<Country, string>)[country];

  return (
    <div className="min-w-0 rounded-2xl border border-unjong-border bg-unjong-surface">
      {/* 국가 토글 */}
      <div className="flex items-center gap-1 border-b border-unjong-border p-3">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => { clearBoardViews(); setCountry(c.code); }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              country === c.code ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 상단 2탭 — 종목 · 정보 (검증=유사투자자문 조회는 정보 하위탭) */}
      <div className="flex items-stretch gap-1 overflow-x-auto border-b border-unjong-border px-2 py-2 sm:px-3">
        {topTabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => selectTop(t)}
            className={`shrink-0 rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors sm:py-1.5 ${
              activeTop === t ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {TOP_LABELS[t]}
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
                  activeTab === s.slug ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
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
            <BrokerRanking />
          </div>
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
              <button type="button" onClick={() => setFeedSub('links')} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${feedSub === 'links' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}>바로가기</button>
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
