<!-- 2026-06-07 -->
# STEP 218 — '주식 관련 링크모음' 페이지 마운트 (기존 toolbox 살리기) + 헤더 탭

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_218_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 합의)
이미 만들어둔 **toolbox(링크 허브)** 를 살려 헤더 '주식 관련 링크모음' 탭으로 노출.
- `ToolboxClient`·`CategorySection`·`LinkCard` + API(`/api/toolbox/*`) + **`link_hub` 56개 링크(KR/US 7카테고리)** 전부 존재. **빠진 건 `/toolbox` 페이지(라우트)뿐** → 그것만 생성.
- 헤더 탭: `홈 / 마켓 / 뉴스·시황` → **`+ 주식 관련 링크모음`** (`/toolbox`).
- 🚫 **광고 슬롯 제거**: `CategorySection` 에 박힌 "Partner Slot" (광고 자리)는 사용자 규칙("광고는 내가 정할 때만")대로 **이번엔 빼고 링크만** 표시. (나중에 광고 시 되살림.)
- 페이지 제목(H1)을 탭과 맞춰 "주식 관련 링크모음" 으로.
- ⏭️ **색·디자인(옛 민트 #0ABAB5 → 운종 토큰)은 STEP 219** (이번은 마운트만).

## 전제 상태
- HEAD: STEP 217 상태
- 변경 4파일: `app/toolbox/page.tsx`(신규) · `components/layout/Header.tsx`(탭) · `components/toolbox/CategorySection.tsx`(광고 제거) · `components/toolbox/ToolboxClient.tsx`(H1 1줄)
- DB 변경 0 (link_hub 기존 데이터 사용)

---

## 작업 1/4 — 신규 `app/toolbox/page.tsx` (서버 페이지, 파일 생성)

```tsx
import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "주식 관련 링크모음 — 운종" };

const CATEGORY_LABELS: Record<string, string> = {
  news: "뉴스",
  chart: "차트·분석",
  disclosure: "공시·규제",
  research: "리서치·리포트",
  macro: "거시경제",
  community: "커뮤니티",
  exchange: "거래소·증권사",
};
const CATEGORY_ORDER = ["news", "chart", "disclosure", "research", "macro", "community", "exchange"];

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
    <ToolboxClient
      initialCategories={categories}
      availableCountries={availableCountries}
      isLoggedIn={!!user}
    />
  );
}
```

> `/api/toolbox/list` 와 동일 로직(서버 컴포넌트 직접 쿼리). 로그인 시 즐겨찾기 반영.

---

## 작업 2/4 — `Header.tsx` 에 '주식 관련 링크모음' 탭 추가

**찾기:**
```tsx
// 운종 상단 탭. 토론·평가는 홈(랭킹·인기토론)으로 접근(평가·검증 톱레벨 승격은 UI 완성 후 결정).
// MY는 우측 프로필 아이콘으로. '주식 관련 링크모음'은 페이지 생성 후 추가 예정. 거래·코인 제외.
const MENU = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/market', label: '마켓', match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: '/news', label: '뉴스·시황', match: (p: string) => /^\/news/.test(p) },
] as const;
```
**바꾸기:**
```tsx
// 운종 상단 탭. 토론·평가는 홈(랭킹·인기토론)으로 접근(평가·검증 톱레벨 승격은 UI 완성 후 결정).
// MY는 우측 프로필 아이콘으로. 거래·코인 제외.
const MENU = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/market', label: '마켓', match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: '/news', label: '뉴스·시황', match: (p: string) => /^\/news/.test(p) },
  { href: '/toolbox', label: '주식 관련 링크모음', match: (p: string) => /^\/toolbox/.test(p) },
] as const;
```

---

## 작업 3/4 — `CategorySection.tsx` 광고(Partner Slot) 제거

**찾기 (import + 함수):**
```tsx
import LinkCard, { type LinkItem } from './LinkCard';
import PartnerSlot from '@/components/partners/PartnerSlot';

function PartnerSlotPlaceholder({ slotId, slug }: { slotId: string; slug: string }) {
  if (slug === 'exchange') {
    return <PartnerSlot slotKey={slotId} variant="compact" className="mb-3" />;
  }
  return (
    <div
      data-slot={slotId}
      className="border border-dashed border-[#E5E7EB] rounded-xl px-4 py-3 text-xs text-[#BBBBBB] text-center mb-3"
    >
      Partner Slot — W4 구현 예정
    </div>
  );
}
```
**바꾸기:**
```tsx
import LinkCard, { type LinkItem } from './LinkCard';
```

**찾기 (section 태그 — slug 사용 유지):**
```tsx
    <section>
      <button
```
**바꾸기:**
```tsx
    <section data-category={slug}>
      <button
```

**찾기 (슬롯 렌더 제거):**
```tsx
        <div className="pt-3 pb-4">
          <PartnerSlotPlaceholder slotId={`toolbox-category-${slug}`} slug={slug} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
```
**바꾸기:**
```tsx
        <div className="pt-3 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
```

> `PartnerSlot` import·함수·렌더 모두 제거. `slug` 는 `<section data-category={slug}>` 로 계속 쓰여 미사용 경고 없음.

---

## 작업 4/4 — `ToolboxClient.tsx` 제목을 탭과 일치

**찾기:**
```tsx
        <h1 className="text-2xl font-bold text-black">참고 사이트</h1>
```
**바꾸기:**
```tsx
        <h1 className="text-2xl font-bold text-black">주식 관련 링크모음</h1>
```

> 색(`text-black` 등 옛 팔레트)은 STEP 219 에서 운종 토큰으로 교체. 이번엔 글자만.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/toolbox/page.tsx components/layout/Header.tsx components/toolbox/CategorySection.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(v7): 주식 관련 링크모음 페이지 마운트(기존 toolbox 살림)+헤더 탭, 광고 슬롯 제거 (STEP 218)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 헤더에 **'주식 관련 링크모음'** 탭 보이고 클릭 → `/toolbox` 페이지(카테고리별 링크 카드)
- [ ] 카테고리(뉴스·차트·공시·리서치·거시·커뮤니티·거래소) 접기/펼치기 + 검색 + 국가(한국/미국) 필터 동작
- [ ] 링크 카드 클릭 시 외부 사이트 새 탭으로 열림
- [ ] **"Partner Slot" 광고 박스 안 보임**(제거됨)
- [ ] 페이지 제목이 "주식 관련 링크모음"
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 디자인이 **옛 민트색(#0ABAB5)·흰 배경**이라 지금 브랜드와 이질감 → **STEP 219에서 운종 토큰으로 리스타일**(예정).
- 즐겨찾기 ★ 는 로그인 시에만 표시(카카오 OAuth 활성화 후 실동작).
- 옛 `TopNav.tsx`(죽은 코드, `/toolbox`·`/calendar` 가리킴)는 후속 잔재 정리 대상.
- **문서 TODO**(다음 갱신): STEP 215~218.

---
> STEP 218 = 링크모음 마운트(toolbox 살림)+헤더 탭+광고 제거. 전제 STEP 217. 색은 219. 문서 묶어 갱신.
