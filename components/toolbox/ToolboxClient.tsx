'use client';

import { useState, useMemo, useCallback } from 'react';
import CategorySection from './CategorySection';
import type { LinkItem } from './LinkCard';

type LinkWithCountry = LinkItem & { country?: string | null };
type Category = { slug: string; label: string; links: LinkWithCountry[] };

export default function ToolboxClient({
  initialCategories,
  availableCountries,
  isLoggedIn,
}: {
  initialCategories: Category[];
  availableCountries: string[];
  isLoggedIn: boolean;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<string>('all'); // 'all' | 'KR' | 'US' | ...
  const [allOpen, setAllOpen] = useState(true);
  const [openKey, setOpenKey] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        links: cat.links.filter((l) => {
          if (country !== 'all' && l.country !== country) return false;
          if (!q) return true;
          return (
            l.site_name.toLowerCase().includes(q) ||
            (l.description ?? '').toLowerCase().includes(q) ||
            l.site_url.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((cat) => cat.links.length > 0);
  }, [categories, query, country]);

  const handleFavoriteToggle = useCallback((id: number, fav: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        links: cat.links.map((l) => (l.id === id ? { ...l, isFavorite: fav } : l)),
      }))
    );
  }, []);

  const toggleAll = () => {
    setAllOpen((v) => !v);
    setOpenKey((k) => k + 1);
  };

  const totalLinks = categories.reduce((s, c) => s + c.links.length, 0);
  const shownLinks = filtered.reduce((s, c) => s + c.links.length, 0);

  // 국가 라벨 — 필요 시 확장
  const countryLabel: Record<string, string> = {
    KR: '한국',
    US: '미국',
    GLOBAL: '글로벌',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">투자자 도구함</h1>
        <p className="text-sm text-[#666666] mt-1">
          외부 서비스 큐레이션 · {categories.length} 카테고리 · {totalLinks}개 링크
          {shownLinks !== totalLinks && (
            <span className="ml-2 text-[#0ABAB5] font-bold">표시 {shownLinks}개</span>
          )}
        </p>
      </div>

      {/* 검색 + 국가 필터 + 토글 */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사이트 검색 (이름, 설명, URL)"
          className="flex-1 min-w-[200px] border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black placeholder-[#999999] focus:outline-none focus:border-[#0ABAB5]"
        />

        {/* 국가 필터 — 1개 국가뿐이면 숨김 */}
        {availableCountries.length > 1 && (
          <div className="flex items-center gap-1 border border-[#E5E7EB] rounded-lg p-0.5">
            <button
              onClick={() => setCountry('all')}
              className={`px-2.5 py-1.5 text-xs font-bold rounded ${
                country === 'all'
                  ? 'bg-[#0ABAB5] text-white'
                  : 'text-[#666666] hover:text-black'
              }`}
            >
              전체
            </button>
            {availableCountries.map((c) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded ${
                  country === c
                    ? 'bg-[#0ABAB5] text-white'
                    : 'text-[#666666] hover:text-black'
                }`}
              >
                {countryLabel[c] ?? c}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={toggleAll}
          className="flex-shrink-0 border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#666666] hover:border-[#0ABAB5] hover:text-[#0ABAB5] transition-colors"
        >
          {allOpen ? '전체 접기' : '전체 펼치기'}
        </button>
      </div>

      {/* 카테고리 목록 */}
      {filtered.length === 0 ? (
        <p className="text-center text-[#999999] text-sm py-16">검색 결과가 없습니다.</p>
      ) : (
        <div key={openKey} className="space-y-0">
          {filtered.map((cat, i) => (
            <CategorySection
              key={`${cat.slug}-${openKey}`}
              slug={cat.slug}
              label={cat.label}
              links={cat.links}
              defaultOpen={allOpen && i < 3}
              isLoggedIn={isLoggedIn}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
