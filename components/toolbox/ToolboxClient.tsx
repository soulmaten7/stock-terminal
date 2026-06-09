'use client';

import { useState, useCallback } from 'react';
import LinkCard, { type LinkItem } from './LinkCard';

type LinkWithCountry = LinkItem & { country?: string | null };
type Category = { slug: string; label: string; links: LinkWithCountry[] };

const COLUMNS = [
  { code: 'KR', label: '🇰🇷 한국', sub: '국내 주식 사이트' },
  { code: 'US', label: '🇺🇸 미국', sub: '해외 주식 사이트' },
];

export default function ToolboxClient({
  initialCategories,
  isLoggedIn,
}: {
  initialCategories: Category[];
  isLoggedIn: boolean;
}) {
  const [categories, setCategories] = useState(initialCategories);

  const handleFavoriteToggle = useCallback((id: number, fav: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        links: cat.links.map((l) => (l.id === id ? { ...l, isFavorite: fav } : l)),
      }))
    );
  }, []);

  return (
    <>
      {COLUMNS.map((col) => (
        <section
          key={col.code}
          className="min-w-0 rounded-2xl border border-unjong-border bg-unjong-surface p-4"
        >
          {/* 칸 헤더 (증권사 칸과 높이·스타일 통일) */}
          <div className="mb-3 border-b border-unjong-border pb-2">
            <h2 className="text-lg font-bold text-unjong-primary">{col.label}</h2>
            <p className="mt-0.5 text-xs text-unjong-muted">{col.sub}</p>
          </div>

          {/* 카테고리 섹션 (탭 아님 — 회색 라벨로만 구획) */}
          <div className="space-y-4">
            {categories.map((cat) => {
              const links = cat.links.filter((l) => l.country === col.code);
              if (links.length === 0) return null;
              return (
                <div key={cat.slug}>
                  <h3 className="mb-1 px-1 text-xs font-bold text-unjong-muted">{cat.label}</h3>
                  <div>
                    {links.map((link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        isLoggedIn={isLoggedIn}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
