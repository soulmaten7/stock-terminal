<!-- 2026-06-09 -->
# STEP 228 — 링크모음 3등분 재설계 (한국 | 미국 | 증권사 리스트, 탭 제거·전부 보임)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_228_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
`/toolbox`를 **탭 없이 한 페이지에 다 보이는 디렉토리**로 재설계.
- **3등분 그리드**: `[ 🇰🇷 한국 ] [ 🇺🇸 미국 ] [ 증권사 리스트 ]` (각 1/3).
- 한국·미국 칸: 카테고리는 **탭이 아니라 회색 섹션 라벨**로만 묶고, 그 아래 **바로가기 링크 행** 전부 노출. 탭·국가 토글·검색 제거.
- 증권사 칸: 이름 「**증권사 리스트**」 + 미니제목 「**거래대금 순**」(+근사치). 같은 컬럼 카드 스타일로 통일(헤더 높이·테두리·여백 일치).

## 전제 상태
- HEAD: STEP 227 + DB 큐레이션(26 마이그레이션) 적용 상태
- 변경 3파일: `app/toolbox/page.tsx`(전체 교체) · `components/toolbox/ToolboxClient.tsx`(전체 교체) · `components/toolbox/BrokerRanking.tsx`(헤더·래퍼 2곳)
- `LinkCard`(행)는 그대로 재사용. `CategorySection`(고아) 안 건드림. DB 변경 0

---

## 작업 1/3 — `app/toolbox/page.tsx` (파일 전체 교체 — 3등분 그리드)

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

  return (
    <div className="px-6 py-6">
      {/* 3등분: 한국 | 미국 | 증권사 리스트 (ToolboxClient가 한국·미국 2칸, BrokerRanking이 3번째) */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <ToolboxClient initialCategories={categories} isLoggedIn={!!user} />
        <BrokerRanking />
      </div>
    </div>
  );
}
```

> `items-start` = 칸별 높이 달라도 위 정렬. ToolboxClient는 `<>한국칸 미국칸</>` 2개를, BrokerRanking은 1개를 → 3그리드 칸.

---

## 작업 2/3 — `components/toolbox/ToolboxClient.tsx` (파일 전체 교체 — 한국·미국 2칸)

```tsx
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
```

> 탭/검색/국가 토글 전부 제거. KR·US 칸이 각각 카테고리 순(`뉴스→…→거래소`)으로 섹션+링크 행. `LinkCard`(행) 그대로 사용.

---

## 작업 3/3 — `components/toolbox/BrokerRanking.tsx` (래퍼·헤더 통일 + 재명명)

**찾기 (래퍼):**
```tsx
    <section className="mb-6 rounded-2xl border border-unjong-border bg-unjong-surface p-5">
```
**바꾸기:**
```tsx
    <section className="min-w-0 rounded-2xl border border-unjong-border bg-unjong-surface p-4">
```

**찾기 (헤더):**
```tsx
      <div className="mb-3">
        <h2 className="text-lg font-bold text-unjong-primary">증권사 거래대금 순위</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">최근 분기 기준 · 근사치(분기 변동)</p>
      </div>
```
**바꾸기:**
```tsx
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">증권사 리스트</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">거래대금 순 · 최근 분기 근사치</p>
      </div>
```

> 래퍼 `p-5`→`p-4`·`mb-6` 제거(그리드 칸), 헤더에 `border-b pb-2` 추가해 한국·미국 칸 헤더와 동일 높이·구분선. 제목 "증권사 리스트" + 미니 "거래대금 순".

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/toolbox/page.tsx components/toolbox/ToolboxClient.tsx components/toolbox/BrokerRanking.tsx && git commit -m "feat(v7): 링크모음 3등분 재설계 — 한국|미국|증권사 리스트, 탭 제거·전부 노출 (STEP 228)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] `/toolbox`가 **3칸**(🇰🇷 한국 | 🇺🇸 미국 | 증권사 리스트), 탭·검색·국가토글 사라짐
- [ ] 한국·미국 칸: 카테고리 **회색 라벨**로 구획 + 링크 행 **전부 보임**(스크롤)
- [ ] 증권사 칸: 제목 **"증권사 리스트"** + 미니 **"거래대금 순"**, 20개 행·바로가기 버튼
- [ ] 3칸 **헤더 높이·테두리·여백 통일**(나란히 한 덩어리)
- [ ] 좁은 화면선 세로로 한국→미국→증권사 스택
- ⚠️ 서버 컴포넌트 변경 → 하드 새로고침(`Cmd+Shift+R`). 그래도 그대로면 dev 서버 재시작.

## 주의·예상 이슈
- 한국 칸이 링크 많아 가장 길어질 수 있음(정상, `items-start`라 위 정렬). 너무 길면 추후 칸 내 2열 등 조정.
- 검색은 제거(다 보이니 불필요) — 나중에 필요하면 상단에 작게 재추가.
- `CategorySection`(고아)·`availableCountries` prop은 미사용 — 후속 정리. `LinkCard` 행 스타일은 유지.
- **문서 TODO**(다음 갱신): STEP 228.

---
> STEP 228 = 링크모음 3등분 재설계. 전제 STEP 227. 문서 묶어 갱신.
