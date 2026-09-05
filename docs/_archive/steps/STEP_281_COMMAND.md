<!-- 2026-06-19 -->
# STEP 281 — [V7 ①] /toolbox를 홈으로 승격 + 헤더(주식/코인) + 옛 홈·상품리스트 내리기

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_281_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 280 결과 커밋 + 미커밋 V7 문서(`docs/PRODUCT_SPEC_V7.md`, `SESSION_BOOT.md` 배너). 빌드 ✓.
- **결과 커밋 예정**: STEP 281 (V7 문서들도 함께 커밋됨).
- **설계 근거**: `docs/PRODUCT_SPEC_V7.md` (V7 대전환). 이건 그 빌드 ①단계.

---

## 🎯 목표 (V7 ①)

운종을 "검증된 중립 관문"으로 전환하는 첫 삽 — **이미 게이트웨이 뼈대가 있는 `/toolbox`를 홈(`/`)으로 승격**하고, 옛 네이버 클론 홈(랭킹/차트)과 상품리스트를 내림.

- `app/page.tsx`: 랭킹 홈(HomeClientV6) → **게이트웨이(toolbox 내용)**
- `/toolbox` → `/`로 리다이렉트
- 헤더: `홈 / 상품 리스트 / 주식 관련 링크모음` → **`주식 / 코인`**
- `/market` → `/`로 리다이렉트
- `코인` 자리는 "준비 중" 플레이스홀더 (한국 주식 완성 후 채움)

> 옛 홈 컴포넌트(HomeClientV6 등)·랭킹/차트 파일은 **삭제하지 않고 그대로 둠**(고아 상태, 빌드 영향 없음, 추후 정리). 이번엔 '안 보이게' 만드는 게 목표.

---

## 📄 파일 1 (교체) — `app/page.tsx` (홈 = 게이트웨이)

**파일 전체를 아래로 교체:**
```tsx
import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
import BrokerRanking from "@/components/toolbox/BrokerRanking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "운종 — 투자상품에 속지 않게 돕는 곳" };

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

export default async function HomePage() {
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
      {/* 게이트웨이: 한국 | 미국 (ToolboxClient) + 증권사 리스트 (BrokerRanking) */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <ToolboxClient initialCategories={categories} isLoggedIn={!!user} />
        <BrokerRanking />
      </div>
    </div>
  );
}
```

---

## 📄 파일 2 (교체) — `app/toolbox/page.tsx` (→ 홈으로 리다이렉트)

**파일 전체를 아래로 교체:**
```tsx
import { redirect } from "next/navigation";

export default function ToolboxRedirect() {
  redirect("/");
}
```

---

## 📄 파일 3 (교체) — `app/market/page.tsx` (→ 홈으로 리다이렉트)

> `app/market/page.tsx`가 있으면 아래로 교체. (없으면 건너뜀.)
```tsx
import { redirect } from "next/navigation";

export default function MarketRedirect() {
  redirect("/");
}
```

---

## 📄 파일 4 (신규) — `app/coin/page.tsx` (코인 준비중 플레이스홀더)

```tsx
export const metadata = { title: "코인 — 운종 (준비 중)" };

export default function CoinPage() {
  return (
    <div className="px-6 py-20 text-center">
      <p className="mb-2 text-2xl">🪙</p>
      <p className="text-lg font-bold text-unjong-primary">코인 — 준비 중</p>
      <p className="mt-1 text-sm text-unjong-muted">한국 주식 먼저 완성한 뒤 같은 구조로 제공해요.</p>
    </div>
  );
}
```

---

## 📄 파일 5 — `components/layout/Header.tsx` (헤더 메뉴 = 주식/코인)

**찾기:**
```tsx
const MENU = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/market', label: '상품 리스트', match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: '/toolbox', label: '주식 관련 링크모음', match: (p: string) => /^\/toolbox/.test(p) },
] as const;
```
**바꾸기:**
```tsx
const MENU = [
  { href: '/', label: '주식', match: (p: string) => p === '/' },
  { href: '/coin', label: '코인', match: (p: string) => /^\/coin/.test(p) },
] as const;
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (옛 홈 컴포넌트는 고아라도 빌드 안 깨짐).

개발 서버(`npm run dev`, 포트 3333):
1. **홈(`/`)** → 옛 랭킹/차트 대신 **게이트웨이(한국/미국 사이트 + 증권사 리스트)**가 보이는지.
2. **헤더** → `주식 / 코인` 두 개만. (상품 리스트·링크모음 사라짐)
3. `/toolbox`, `/market` 접속 시 **홈으로 리다이렉트**.
4. `코인` 클릭 → "준비 중" 페이지.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): /toolbox를 홈으로 승격 + 헤더 주식/코인 + 옛 홈·상품리스트 내림 (V7 ①, STEP 281)" && git push
```
> ⚠️ 이 커밋에 미커밋 V7 문서(`PRODUCT_SPEC_V7.md`, `SESSION_BOOT.md`)도 함께 올라감 — 정상.

---

> **한 줄 요약**: 게이트웨이 뼈대가 이미 있는 `/toolbox`를 홈으로 올리고, 헤더를 주식/코인으로, 옛 랭킹 홈·상품리스트는 리다이렉트로 내림. V7 첫 삽.
