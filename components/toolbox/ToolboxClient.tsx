'use client';

import { useState } from 'react';
import LinkCard, { type LinkItem } from './LinkCard';
import BrokerRanking from './BrokerRanking';
import YoutubeRanking, { type YtChannel } from './YoutubeRanking';

type LinkWithCountry = LinkItem & { country?: string | null };
type Category = { slug: string; label: string; links: LinkWithCountry[] };

const COUNTRIES = [
  { code: 'KR', label: '🇰🇷 한국' },
  { code: 'US', label: '🇺🇸 미국' },
];

// 탭 표시 순서 (V7 재정렬): 뉴스·증권사·유튜브 앞으로, 리딩방 끝
const TAB_ORDER = ['news', 'broker', 'youtube', 'chart', 'analysis', 'research', 'disclosure', 'etf', 'ipo', 'macro', 'exchange', 'community', 'room'];
// link_hub 카테고리가 아닌 특수 탭의 라벨
const SPECIAL_LABELS: Record<string, string> = { youtube: '유튜브', broker: '증권사', room: '리딩방·검증' };

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
  const [country, setCountry] = useState('KR');
  const [categories, setCategories] = useState(initialCategories);
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0]);

  // 탭 = TAB_ORDER 순서대로. 특수탭(유튜브·증권사·리딩방)은 항상, 카테고리는 데이터 있을 때만.
  const tabs = TAB_ORDER.map((slug) => {
    const special = SPECIAL_LABELS[slug];
    if (special) return { slug, label: special };
    const c = categories.find((cat) => cat.slug === slug);
    return c ? { slug, label: c.label } : null;
  }).filter((t): t is { slug: string; label: string } => t !== null);

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
  const countryLabel = country === 'KR' ? '한국' : '미국';

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
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
      <div className="flex gap-1 overflow-x-auto border-b border-unjong-border px-3 py-2">
        {tabs.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setActiveTab(t.slug)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              activeTab === t.slug ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 내용 */}
      <div className="p-4">
        {activeTab === 'youtube' ? (
          country === 'KR' ? (
            <YoutubeRanking channels={youtubeChannels} />
          ) : (
            <Placeholder emoji="🇺🇸" title="미국 주식 유튜브 — 준비 중" />
          )
        ) : activeTab === 'room' ? (
          <Placeholder emoji="📣" title="리딩방 검증 — 준비 중" desc="신원인증 등록 + 사실(등록/신고) 라벨" />
        ) : activeTab === 'broker' ? (
          country === 'KR' ? <BrokerRanking /> : <Placeholder emoji="🇺🇸" title="미국 증권사 — 준비 중" />
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
        ) : (
          <div className="space-y-1">
            {catLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                isLoggedIn={isLoggedIn}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
