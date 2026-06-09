<!-- 2026-06-07 -->
# STEP 222 — 링크모음 레이아웃 정리: 헤더 제거 + 증권사 우측 레일 + 검색/국가 정렬

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_222_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
1. 헤더 밑 **제목·부제 제거**("주식 관련 링크모음 / 증권사·뉴스…" 블록).
2. **증권사 거래대금 순위 → 오른쪽 레일**(홈 관심종목처럼 따로 배치 → 증권사 강조). 좌=링크 디렉토리 / 우=증권사 레일 2열.
3. **검색창 작게 + 탭 줄 오른쪽 정렬**, **전체/미국/한국(국가) 왼쪽 정렬**.

## 전제 상태
- HEAD: STEP 221 상태
- 변경 3파일: `app/toolbox/page.tsx`(전체 교체) · `components/toolbox/BrokerRanking.tsx`(1줄 수정) · `components/toolbox/ToolboxClient.tsx`(전체 교체)
- DB 변경 0

---

## 작업 1/3 — `app/toolbox/page.tsx` (파일 전체 교체 — 헤더 제거 + 2열 그리드)

```tsx
import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
import BrokerRanking from "@/components/toolbox/BrokerRanking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "주식 관련 링크모음 — 운종" };

const CATEGORY_LABELS: Record<string, string> = {
  news: "뉴스",
  chart: "차트·분석",
  analysis: "재무·분석",
  disclosure: "공시·규제",
  research: "리서치·리포트",
  etf: "ETF·펀드",
  ipo: "공모주·배당",
  macro: "거시경제",
  community: "커뮤니티",
  exchange: "거래소",
};
const CATEGORY_ORDER = ["news", "chart", "analysis", "disclosure", "research", "etf", "ipo", "macro", "community", "exchange"];

type LinkRow = {
  id: number;
  country: string | null;
  category: string;
  site_name: string;
  site_url: string;
  description: string | null;
  logo_url: string | null;
  display_order: number | null;
};

export default async function ToolboxPage() {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("link_hub")
    .select("id, country, category, site_name, site_url, description, logo_url, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favSet = new Set<number>();
  if (user) {
    const { data: favs } = await supabase
      .from("link_hub_favorites")
      .select("link_id")
      .eq("user_id", user.id);
    favSet = new Set((favs ?? []).map((f: { link_id: number }) => f.link_id));
  }

  const rows = (links ?? []) as LinkRow[];
  const grouped: Record<string, (LinkRow & { isFavorite: boolean })[]> = {};
  for (const link of rows) {
    (grouped[link.category] ??= []).push({ ...link, isFavorite: favSet.has(link.id) });
  }

  const categories = Object.keys(grouped)
    .sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map((slug) => ({ slug, label: CATEGORY_LABELS[slug] ?? slug, links: grouped[slug]! }));

  const availableCountries = [...new Set(rows.map((l) => l.country).filter(Boolean))] as string[];

  return (
    <div className="px-6 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* 좌: 링크 디렉토리 */}
        <div className="min-w-0">
          <ToolboxClient
            initialCategories={categories}
            availableCountries={availableCountries}
            isLoggedIn={!!user}
          />
        </div>
        {/* 우: 증권사 거래대금 순위 레일 */}
        <div className="min-w-0">
          <BrokerRanking />
        </div>
      </div>
    </div>
  );
}
```

> 헤더(h1·부제) 삭제. 좌 `1fr`(링크) / 우 `340px`(증권사 레일). 모바일선 세로로 쌓임(링크→증권사).

---

## 작업 2/3 — `components/toolbox/BrokerRanking.tsx` 단일열로 (레일 폭에 맞게)

**찾기:**
```tsx
      <ol className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
```
**바꾸기:**
```tsx
      <ol className="grid grid-cols-1 gap-0.5">
```

> 레일(340px)에 들어가므로 2열 → 1열. 나머지(섹션·행)는 그대로.

---

## 작업 3/3 — `components/toolbox/ToolboxClient.tsx` (파일 전체 교체 — 국가 좌측 + 검색 컴팩트 우측)

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
      return categories.flatMap((c) => c.links).filter((l) => inCountry(l) && inQuery(l));
    }
    const cat = categories.find((c) => c.slug === active);
    return (cat?.links ?? []).filter(inCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, active, q, country]);

  return (
    <div>
      {/* 국가 필터 — 왼쪽 정렬 */}
      {availableCountries.length > 1 && (
        <div className="mb-3 inline-flex items-center gap-0.5 rounded-lg border border-unjong-border p-0.5">
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
```

> 국가 필터 = 왼쪽 `inline-flex`(좌측 정렬). 탭(왼쪽) + 검색(오른쪽 `w-44/56` 컴팩트)을 `justify-between` 한 줄. 검색 중엔 탭 자리에 "검색 결과 N".

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/toolbox/page.tsx components/toolbox/BrokerRanking.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(v7): 링크모음 레이아웃 — 헤더 제거+증권사 우측 레일+검색/국가 정렬 (STEP 222)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] `/toolbox` **상단 제목·부제 사라짐**
- [ ] **증권사 거래대금 순위가 오른쪽 레일**(단일열 12개), 왼쪽은 링크 디렉토리
- [ ] **국가(전체/미국/한국) 왼쪽 정렬**, **검색창 작아지고 탭 줄 오른쪽**
- [ ] 박스 탭·한 줄 리스트·검색(전 카테고리) 정상
- [ ] 좁은 화면선 링크 → 증권사 순으로 세로 스택
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 증권사 레일은 **고정(sticky) 아님** — 홈 관심종목 선호(STEP 213)와 동일하게 그 자리. 스크롤 따라 고정 원하면 후속에 `lg:sticky` 추가.
- 다음: **link_hub 큐레이션 INSERT**(재무·분석·ETF·공모주 + 보강, MCP) → 새 탭 등장.
- **문서 TODO**(다음 갱신): STEP 162·215~222.

---
> STEP 222 = 링크모음 레이아웃(헤더 제거·증권사 우측 레일·검색/국가 정렬). 전제 STEP 221. 문서 묶어 갱신.
