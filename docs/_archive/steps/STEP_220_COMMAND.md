<!-- 2026-06-07 -->
# STEP 220 — 링크모음 재설계: 카테고리 탭 + 한 줄 리스트 (+운종 브랜드 색)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_220_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
링크모음을 **카드 그리드 → 탭 + 한 줄 리스트**로 재설계(종목 랭킹 탭 UX와 동일).
- 상단 **카테고리 탭**(뉴스 | 차트·분석 | 공시·규제 | 리서치·리포트 | 거시경제 | 커뮤니티 | 거래소·증권사) — 누르면 그 카테고리 링크만 리스트로.
- 링크 1개 = **한 줄(행)**: 아이콘 · 이름 · 도메인(주소) · 한 줄 설명요약 · (로그인 시)즐겨찾기.
- 검색어 입력 시 = **전 카테고리에서 매칭**(탭 숨김). 국가(한국/미국) 필터 유지.
- **옛 민트색(#0ABAB5)·하드코딩 회색 → 운종 브랜드 토큰**(`unjong-*`)으로 교체(겸사 리스타일).

## 전제 상태
- HEAD: STEP 219 상태 (+ STEP 218 적용 완료)
- 변경 2파일(전체 교체): `components/toolbox/LinkCard.tsx`(카드→행) · `components/toolbox/ToolboxClient.tsx`(탭+리스트)
- `app/toolbox/page.tsx` 프롭(initialCategories·availableCountries·isLoggedIn) 그대로 호환 → 수정 불필요
- `CategorySection.tsx` 는 이제 미사용(고아) → 후속 정리 대상(이번엔 안 건드림)
- DB 변경 0

---

## 작업 1/2 — `components/toolbox/LinkCard.tsx` (파일 전체 교체 — 카드→한 줄 행)

```tsx
'use client';

import { useState } from 'react';
import { Star, ExternalLink } from 'lucide-react';

export type LinkItem = {
  id: number;
  site_name: string;
  site_url: string;
  description: string | null;
  logo_url: string | null;
  isFavorite?: boolean;
};

export default function LinkCard({
  link,
  isLoggedIn,
  onFavoriteToggle,
}: {
  link: LinkItem;
  isLoggedIn: boolean;
  onFavoriteToggle: (id: number, fav: boolean) => void;
}) {
  const [fav, setFav] = useState(link.isFavorite ?? false);
  const [favLoading, setFavLoading] = useState(false);

  const domain = (() => {
    try { return new URL(link.site_url).hostname.replace(/^www\./, ''); }
    catch { return link.site_url; }
  })();

  const handleClick = () => {
    fetch('/api/toolbox/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: link.id }),
    }).catch(() => {});
    window.open(link.site_url, '_blank', 'noopener,noreferrer');
  };

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const next = !fav;
    setFav(next);
    try {
      await fetch('/api/toolbox/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id, favorite: next }),
      });
      onFavoriteToggle(link.id, next);
    } catch {
      setFav(!next);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group flex cursor-pointer items-center gap-3 border-b border-unjong-border px-2 py-3 transition-colors last:border-b-0 hover:bg-unjong-background"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt=""
        width={22}
        height={22}
        className="shrink-0 rounded"
        onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
      />
      {/* 이름 + 도메인 */}
      <div className="flex w-44 shrink-0 flex-col sm:w-52">
        <span className="truncate text-sm font-bold text-unjong-primary group-hover:text-unjong-accent">
          {link.site_name}
        </span>
        <span className="truncate text-xs text-unjong-muted">{domain}</span>
      </div>
      {/* 한 줄 설명 */}
      <p className="hidden min-w-0 flex-1 truncate text-sm text-unjong-muted sm:block">
        {link.description || ''}
      </p>
      {/* 즐겨찾기 + 외부링크 */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
        {isLoggedIn && (
          <button
            type="button"
            onClick={handleFav}
            aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className={`transition-colors ${fav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
          >
            <Star size={16} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
        <ExternalLink size={14} className="text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  );
}
```

---

## 작업 2/2 — `components/toolbox/ToolboxClient.tsx` (파일 전체 교체 — 탭 + 리스트)

```tsx
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
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/toolbox/LinkCard.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(v7): 링크모음 재설계 — 카테고리 탭+한 줄 리스트 + 운종 브랜드 색 (STEP 220)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] `/toolbox` 상단 **카테고리 탭**(뉴스|차트·분석|공시·규제|리서치·리포트|거시경제|커뮤니티|거래소·증권사), 탭별 개수 표시
- [ ] 탭 클릭 → 그 카테고리 링크가 **한 줄씩**(아이콘·이름·도메인·설명) 리스트로
- [ ] 검색어 입력 → **전 카테고리 매칭**(탭 숨고 결과 리스트), 국가(한국/미국) 필터 동작
- [ ] 색이 **운종 톤**(옛 민트 #0ABAB5 사라짐), 행 hover·외부링크 새 탭·즐겨찾기(로그인 시)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- `CategorySection.tsx` 는 이제 import 안 됨(고아) — 빌드엔 무해. 후속 잔재 정리 때 삭제.
- 좁은 화면에선 설명 열 숨김(`sm:block`) — 이름·도메인·즐겨찾기는 유지.
- 즐겨찾기 ★ 는 로그인 시에만(카카오 OAuth 활성화 후 실동작).
- **문서 TODO**(다음 갱신): STEP 162·215~220.

---
> STEP 220 = 링크모음 탭+리스트 재설계 + 브랜드 색. 전제 STEP 219. 문서 묶어 갱신.
