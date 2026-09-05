<!-- 2026-06-19 -->
# STEP 282 — [V7 ②] 게이트웨이 = 한국/미국 토글 + 카테고리 탭

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_282_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 281(`bace5cf`). 빌드 ✓.
- **설계 근거**: `docs/PRODUCT_SPEC_V7.md` §3~4. V7 빌드 ②.

---

## 🎯 목표

홈 게이트웨이(현재 한국|미국|증권사 3칸)를 **V7 탭 구조**로:
- 상단 **한국 / 미국 토글**
- **카테고리 탭**: 유튜브 · 뉴스 · 차트·분석 · 재무·분석 · 공시·규제 · 리서치·리포트 · ETF·펀드 · 공모주·배당 · 거시경제 · 커뮤니티 · 거래소 · **증권사** · **리딩방**
- **유튜브 / 리딩방** = "준비 중" 자리(③④에서 채움), **증권사** = 기존 BrokerRanking, 나머지 = link_hub 링크
- 기본 탭 = 첫 실제 카테고리(뉴스), 기본 국가 = 한국

> 구조 패스라 모양은 본 뒤 다듬으면 됨.

---

## 📄 파일 1 (전체 교체) — `components/toolbox/ToolboxClient.tsx`

```tsx
'use client';

import { useState } from 'react';
import LinkCard, { type LinkItem } from './LinkCard';
import BrokerRanking from './BrokerRanking';

type LinkWithCountry = LinkItem & { country?: string | null };
type Category = { slug: string; label: string; links: LinkWithCountry[] };

const COUNTRIES = [
  { code: 'KR', label: '🇰🇷 한국' },
  { code: 'US', label: '🇺🇸 미국' },
];

function Placeholder({ emoji, title, desc }: { emoji: string; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-2 text-2xl">{emoji}</span>
      <p className="text-sm font-medium text-unjong-primary">{title}</p>
      {desc ? <p className="mt-1 text-xs text-unjong-muted">{desc}</p> : null}
    </div>
  );
}

export default function ToolboxClient({
  initialCategories,
  isLoggedIn,
}: {
  initialCategories: Category[];
  isLoggedIn: boolean;
}) {
  const [country, setCountry] = useState('KR');
  const [categories, setCategories] = useState(initialCategories);
  const [activeTab, setActiveTab] = useState(initialCategories[0]?.slug ?? 'youtube');

  // 탭 순서: 유튜브 → (link_hub 카테고리) → 증권사 → 리딩방
  const tabs = [
    { slug: 'youtube', label: '유튜브' },
    ...categories.map((c) => ({ slug: c.slug, label: c.label })),
    { slug: 'broker', label: '증권사' },
    { slug: 'room', label: '리딩방' },
  ];

  const handleFavoriteToggle = (id: number, fav: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        links: cat.links.map((l) => (l.id === id ? { ...l, isFavorite: fav } : l)),
      }))
    );
  };

  const cat = categories.find((c) => c.slug === activeTab);
  const catLinks = cat ? cat.links.filter((l) => l.country === country) : [];
  const countryLabel = country === 'KR' ? '한국' : '미국';

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {/* 국가 토글 */}
      <div className="flex items-center gap-1 border-b border-unjong-border p-3">
        {COUNTRIES.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCountry(c.code)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              country === c.code ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-1 overflow-x-auto border-b border-unjong-border px-3 py-2">
        {tabs.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setActiveTab(t.slug)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              activeTab === t.slug ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 내용 */}
      <div className="p-4">
        {activeTab === 'youtube' ? (
          <Placeholder emoji="📺" title="유튜브 Top100 — 준비 중" desc="주간 구독자순 한국 주식 유튜브 (자동 갱신 예정)" />
        ) : activeTab === 'room' ? (
          <Placeholder emoji="📣" title="리딩방 검증 — 준비 중" desc="신원인증 등록 + 사실(등록/신고) 라벨" />
        ) : activeTab === 'broker' ? (
          country === 'KR' ? <BrokerRanking /> : <Placeholder emoji="🇺🇸" title="미국 증권사 — 준비 중" />
        ) : catLinks.length === 0 ? (
          <Placeholder emoji="🗂️" title={`${cat?.label ?? ''} · ${countryLabel} 링크 준비 중`} />
        ) : (
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {catLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                isLoggedIn={isLoggedIn}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📄 파일 2 — `app/page.tsx` (게이트웨이 풀폭 + BrokerRanking 분리 제거)

> ToolboxClient가 이제 증권사(BrokerRanking)를 탭 안에서 직접 그리므로, page에서는 풀폭으로 ToolboxClient만 렌더.

### (2-A) import 정리
**찾기:**
```tsx
import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
import BrokerRanking from "@/components/toolbox/BrokerRanking";
```
**바꾸기:**
```tsx
import { createClient } from "@/lib/supabase/server";
import ToolboxClient from "@/components/toolbox/ToolboxClient";
```

### (2-B) 렌더 — 3칸 그리드 → 풀폭
**찾기:**
```tsx
  return (
    <div className="px-6 py-6">
      {/* 게이트웨이: 한국 | 미국 (ToolboxClient) + 증권사 리스트 (BrokerRanking) */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <ToolboxClient initialCategories={categories} isLoggedIn={!!user} />
        <BrokerRanking />
      </div>
    </div>
  );
```
**바꾸기:**
```tsx
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <ToolboxClient initialCategories={categories} isLoggedIn={!!user} />
    </div>
  );
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 홈 → **한국/미국 토글** + **카테고리 탭**(유튜브·뉴스·…·증권사·리딩방).
2. **뉴스 등 카테고리 탭** 클릭 → 해당 한국 링크 카드.
3. **증권사 탭** → 증권사 리스트(BrokerRanking).
4. **유튜브·리딩방 탭** → "준비 중" 자리.
5. **미국 토글** → 미국 링크(없으면 "준비 중").

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 게이트웨이 한국/미국 토글 + 카테고리 탭 재편 (유튜브·리딩방 준비중, 증권사 통합) (V7 ②, STEP 282)" && git push
```

---

> **한 줄 요약**: 게이트웨이를 한국/미국 토글 + 카테고리 탭으로. 유튜브·리딩방은 자리만(③④), 증권사는 기존 리스트, 나머지는 link_hub 링크.
