'use client';

import { useState, useMemo, useCallback } from 'react';
import LinkCard, { type LinkItem } from './LinkCard';

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
  const [active, setActive] = useState(initialCategories[0]?.slug ?? '');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<string>('all');

  const handleFavoriteToggle = useCallback((id: number, fav: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        links: cat.links.map((l) => (l.id === id ? { ...l, isFavorite: fav } : l)),
      }))
    );
  }, []);

  const q = query.trim().toLowerCase();
  const countryLabel: Record<string, string> = { KR: '한국', US: '미국', GLOBAL: '글로벌' };

  const inCountry = (l: LinkWithCountry) => country === 'all' || l.country === country;
  const catCount = (c: Category) => c.links.filter(inCountry).length;

  const visibleLinks = useMemo(() => {
    const inQuery = (l: LinkWithCountry) =>
      !q ||
      l.site_name.toLowerCase().includes(q) ||
      (l.description ?? '').toLowerCase().includes(q) ||
      l.site_url.toLowerCase().includes(q);
    if (q) {
      // 검색 모드: 전 카테고리에서 매칭 (탭 무시)
      return categories.flatMap((c) => c.links).filter((l) => inCountry(l) && inQuery(l));
    }
    const cat = categories.find((c) => c.slug === active);
    return (cat?.links ?? []).filter(inCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, active, q, country]);

  const totalLinks = categories.reduce((s, c) => s + c.links.length, 0);

  return (
    <div className="px-6 py-6">
      {/* 헤더 */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-unjong-primary">주식 관련 링크모음</h1>
        <p className="mt-1 text-sm text-unjong-muted">
          외부 서비스 큐레이션 · {categories.length} 카테고리 · {totalLinks}개 링크 · 운종은 동선만 안내(허브)
        </p>
      </div>

      {/* 검색 + 국가 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사이트 검색 (이름, 설명, URL)"
          className="min-w-[200px] flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-4 py-2.5 text-sm text-unjong-primary placeholder:text-unjong-muted focus:border-unjong-accent focus:outline-none"
        />
        {availableCountries.length > 1 && (
          <div className="flex items-center gap-0.5 rounded-lg border border-unjong-border p-0.5">
            <button
              type="button"
              onClick={() => setCountry('all')}
              className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${country === 'all' ? 'bg-unjong-accent text-white' : 'text-unjong-muted hover:text-unjong-primary'}`}
            >전체</button>
            {availableCountries.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCountry(c)}
                className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${country === c ? 'bg-unjong-accent text-white' : 'text-unjong-muted hover:text-unjong-primary'}`}
              >{countryLabel[c] ?? c}</button>
            ))}
          </div>
        )}
      </div>

      {/* 카테고리 탭 (검색 중엔 숨김) */}
      {!q && (
        <div className="mb-3 flex flex-wrap items-center gap-1 border-b border-unjong-border">
          {categories.map((c) => {
            const on = active === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setActive(c.slug)}
                className={
                  on
                    ? '-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary'
                    : '-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary'
                }
              >
                {c.label}
                <span className={`ml-1 text-xs ${on ? 'text-unjong-accent' : 'text-unjong-muted'}`}>{catCount(c)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 링크 리스트 (한 줄씩) */}
      {visibleLinks.length === 0 ? (
        <p className="py-16 text-center text-sm text-unjong-muted">
          {q ? '검색 결과가 없습니다.' : '링크가 없습니다.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-unjong-border bg-unjong-surface px-2">
          {visibleLinks.map((link) => (
            <LinkCard key={link.id} link={link} isLoggedIn={isLoggedIn} onFavoriteToggle={handleFavoriteToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
