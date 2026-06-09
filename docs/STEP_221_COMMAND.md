<!-- 2026-06-07 -->
# STEP 221 — 링크모음: 증권사 거래대금 순위 톱 블록 + 박스형 탭 + 카테고리 재정렬

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_221_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
`/toolbox` 상·하단 분할:
- **상단 = 증권사 거래대금 순위 톱 블록**(순위·로고·이름·점유%·바로가기). 증권사는 탭에서 빼고 여기로 승격.
- **하단 = 박스형 카테고리 탭 + 한 줄 리스트**(홈 필터칩 스타일). 탭 순서 = 운종식(사실 먼저, 커뮤니티 맨 뒤).
- 🚫 **광고 0** — 객관적 거래대금 순위/링크만(유료 노출 로직 없음). 광고는 사용자 지시 시에만.
- 정직: 거래대금 순위는 실시간 X → **분기 갱신 고정값**, 중위권은 근사치(캐비엇 표시), 점유%는 확인된 상위 3곳만.

## 전제 상태
- HEAD: STEP 220 상태
- 변경 4파일: `lib/brokers.ts`(신규) · `components/toolbox/BrokerRanking.tsx`(신규) · `app/toolbox/page.tsx`(전체 교체) · `components/toolbox/ToolboxClient.tsx`(전체 교체 — 박스 탭·헤더는 page로 이동)
- 새 카테고리(analysis·etf·ipo) 라벨/순서는 넣되 **링크는 다음 STEP** → 링크 없는 카테고리는 탭에 안 뜸(빈 탭 없음)
- DB 변경 0

---

## 작업 1/4 — 신규 `lib/brokers.ts` (증권사 거래대금 순위 데이터)

```ts
// 증권사 거래대금 순위 (리테일 국내주식 기준). ⚠️ 실시간 아님 — 분기별 갱신 고정값.
// 출처: 코스콤/금투협 집계 언론 보도. 점유%는 확인된 상위 3곳만(근거 없는 수치 금지).
// 중위권(4위~) 순서는 근사치(분기 변동) — 바뀌면 이 배열만 손보면 됨.
export type Broker = {
  rank: number;
  name: string;
  domain: string;
  url: string;
  share?: number; // 국내주식 거래대금 점유율 % (확인된 곳만)
  note?: string;
};

export const BROKERS: Broker[] = [
  { rank: 1, name: "키움증권", domain: "kiwoom.com", url: "https://www.kiwoom.com", share: 18, note: "20년 연속 1위" },
  { rank: 2, name: "미래에셋증권", domain: "securities.miraeasset.com", url: "https://securities.miraeasset.com", share: 13 },
  { rank: 3, name: "한국투자증권", domain: "truefriend.com", url: "https://www.truefriend.com", share: 11 },
  { rank: 4, name: "삼성증권", domain: "samsungpop.com", url: "https://www.samsungpop.com" },
  { rank: 5, name: "NH투자증권", domain: "nhqv.com", url: "https://www.nhqv.com" },
  { rank: 6, name: "KB증권", domain: "kbsec.com", url: "https://www.kbsec.com" },
  { rank: 7, name: "신한투자증권", domain: "shinhansec.com", url: "https://www.shinhansec.com" },
  { rank: 8, name: "하나증권", domain: "hanaw.com", url: "https://www.hanaw.com" },
  { rank: 9, name: "메리츠증권", domain: "imeritz.com", url: "https://www.imeritz.com" },
  { rank: 10, name: "토스증권", domain: "tossinvest.com", url: "https://www.tossinvest.com", note: "신규 계좌 급증" },
  { rank: 11, name: "대신증권", domain: "daishin.com", url: "https://www.daishin.com" },
  { rank: 12, name: "한화투자증권", domain: "hanwhawm.com", url: "https://www.hanwhawm.com" },
];
```

---

## 작업 2/4 — 신규 `components/toolbox/BrokerRanking.tsx` (톱 블록)

```tsx
'use client';

import { ExternalLink } from 'lucide-react';
import { BROKERS } from '@/lib/brokers';

export default function BrokerRanking() {
  return (
    <section className="mb-6 rounded-2xl border border-unjong-border bg-unjong-surface p-5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-unjong-primary">증권사 거래대금 순위</h2>
        <span className="shrink-0 text-xs text-unjong-muted">최근 분기 기준 · 근사치(분기 변동)</span>
      </div>
      <p className="mb-4 text-xs text-unjong-muted">국내주식 거래대금 점유율 순 · 운종은 거래 안내만(허브)</p>
      <ol className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
        {BROKERS.map((b) => (
          <li key={b.rank}>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-unjong-background"
            >
              <span className={`w-5 shrink-0 text-center text-sm font-bold ${b.rank <= 3 ? 'text-unjong-accent' : 'text-unjong-muted'}`}>{b.rank}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
                alt=""
                width={20}
                height={20}
                className="shrink-0 rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
              />
              <span className="shrink-0 text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{b.name}</span>
              {b.share != null && (
                <span className="shrink-0 text-xs font-bold text-unjong-accent">{b.share}%</span>
              )}
              {b.note && <span className="truncate text-xs text-unjong-muted">· {b.note}</span>}
              <ExternalLink size={13} className="ml-auto shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

> 사용자 스케치의 "거래대금 순위 + 증권사 리스트 목록"을 한 덩어리(순위 리스트)로 합침. 나누고 싶으면 추후 분리.

---

## 작업 3/4 — `app/toolbox/page.tsx` (파일 전체 교체 — 헤더+증권사 블록+카테고리 라벨/순서)

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
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-unjong-primary">주식 관련 링크모음</h1>
        <p className="mt-1 text-sm text-unjong-muted">증권사·뉴스·분석·공시까지 한곳에서 · 운종은 동선만 안내(허브)</p>
      </div>
      <BrokerRanking />
      <ToolboxClient
        initialCategories={categories}
        availableCountries={availableCountries}
        isLoggedIn={!!user}
      />
    </div>
  );
}
```

---

## 작업 4/4 — `components/toolbox/ToolboxClient.tsx` (파일 전체 교체 — 박스형 탭 + 헤더 제거)

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

      {/* 카테고리 탭 (박스형 — 홈 필터칩 스타일, 검색 중엔 숨김) */}
      {!q && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
cd ~/stock-terminal && git add lib/brokers.ts components/toolbox/BrokerRanking.tsx app/toolbox/page.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(v7): 링크모음 — 증권사 거래대금 순위 톱 블록 + 박스형 탭 + 카테고리 재정렬 (STEP 221)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] `/toolbox` 상단에 **증권사 거래대금 순위**(키움 18%·미래에셋 13%·한투 11% … 12개, 로고+바로가기)
- [ ] 하단 카테고리 탭이 **박스형**(활성=남색 채움, 비활성=테두리 박스), 운종식 순서(뉴스·차트·재무·공시·리서치… 커뮤니티 맨 뒤)
- [ ] 탭 클릭 → 한 줄 리스트, 검색 → 전 카테고리 매칭(탭 숨김)
- [ ] **광고 요소 없음**(객관 순위만), 증권사는 탭에서 빠지고 톱 블록에만
- [ ] 새 카테고리(재무·분석·ETF·공모주)는 **아직 탭 안 뜸**(링크 0 → 다음 STEP에서 채움)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 증권사 4위~ 순서는 **근사치**(분기 변동) — 바뀌면 `lib/brokers.ts` 배열만 수정.
- 헤더(h1)는 `page.tsx`로 이동, `ToolboxClient`는 검색·탭·리스트만(중복 제거).
- 다음 STEP: **link_hub 큐레이션 INSERT**(재무·분석·ETF·공모주 + 기존 보강, MCP 적용) → 새 탭 등장.
- **문서 TODO**(다음 갱신): STEP 162·215~221.

---
> STEP 221 = 증권사 톱 블록 + 박스 탭 + 카테고리 재정렬. 전제 STEP 220. 링크 큐레이션은 다음. 문서 묶어 갱신.
