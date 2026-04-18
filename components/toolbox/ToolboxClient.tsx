'use client';

import { useState, useMemo, useCallback } from 'react';
import CategorySection from './CategorySection';
import type { LinkItem } from './LinkCard';

type Category = { slug: string; label: string; links: LinkItem[] };

export default function ToolboxClient({
  initialCategories,
  isLoggedIn,
}: {
  initialCategories: Category[];
  isLoggedIn: boolean;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [query, setQuery] = useState('');
  const [allOpen, setAllOpen] = useState(true);
  const [openKey, setOpenKey] = useState(0); // key 변경으로 하위 컴포넌트 리셋

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        links: cat.links.filter(
          (l) =>
            l.site_name.toLowerCase().includes(q) ||
            (l.description ?? '').toLowerCase().includes(q) ||
            l.site_url.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.links.length > 0);
  }, [categories, query]);

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">투자자 도구함</h1>
        <p className="text-sm text-[#666666] mt-1">
          외부 서비스 큐레이션 · {categories.length} 카테고리 · {totalLinks}개 링크
        </p>
      </div>

      {/* 검색 + 토글 */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사이트 검색 (이름, 설명, URL)"
          className="flex-1 border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black placeholder-[#999999] focus:outline-none focus:border-[#0ABAB5]"
        />
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
