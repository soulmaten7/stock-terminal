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
  const COUNTRY_ORDER = ['KR', 'US', 'GLOBAL'];
  const orderedCountries = [...availableCountries].sort((a, b) => COUNTRY_ORDER.indexOf(a) - COUNTRY_ORDER.indexOf(b));

  const [categories, setCategories] = useState(initialCategories);
  const [active, setActive] = useState(initialCategories[0]?.slug ?? '');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<string>(orderedCountries[0] ?? 'KR');

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
      return categories.flatMap((c) => c.links).filter((l) => inCountry(l) && inQuery(l));
    }
    const cat = categories.find((c) => c.slug === active);
    return (cat?.links ?? []).filter(inCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, active, q, country]);

  return (
    <div>
      {/* 국가 필터 — 왼쪽 정렬 */}
      {orderedCountries.length > 0 && (
        <div className="mb-3 inline-flex items-center gap-0.5 rounded-lg border border-unjong-border p-0.5">
          {orderedCountries.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCountry(c)}
              className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${country === c ? 'bg-unjong-accent text-white' : 'text-unjong-muted hover:text-unjong-primary'}`}
            >{countryLabel[c] ?? c}</button>
          ))}
        </div>
      )}

      {/* 탭(왼쪽 박스형) + 검색(오른쪽 컴팩트) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {!q ? (
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => {
              const on = active === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setActive(c.slug)}
                  className={
                    on
                      ? 'rounded-lg bg-unjong-primary px-3 py-2 text-sm font-bold text-white'
                      : 'rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary'
                  }
                >
                  {c.label}
                  <span className={`ml-1 text-xs ${on ? 'text-white/70' : 'text-unjong-muted'}`}>{catCount(c)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <span className="py-2 text-sm font-medium text-unjong-muted">검색 결과 {visibleLinks.length}</span>
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사이트 검색"
          className="w-44 shrink-0 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary placeholder:text-unjong-muted focus:border-unjong-accent focus:outline-none sm:w-56"
        />
      </div>

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
