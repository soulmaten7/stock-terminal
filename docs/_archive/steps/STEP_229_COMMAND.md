<!-- 2026-06-09 -->
# STEP 229 — 홈: 실시간차트 2:1(표:미리보기) + 인기토론 → 실시간 속보

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_229_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
1. 홈 실시간차트 탭에서 **표 : 미리보기 = 2:1**. (지금 미리보기가 320px 고정이라 표가 거의 다 먹음)
2. 홈 **🔥 인기 토론 카드 → 🔴 실시간 속보**(시장 헤드라인). 이유: 홈에 실시간채팅이 생겨 'live' 테마엔 속보가 짝. 토론은 종목 미리보기·토론 메뉴에 있음.

## 전제 상태
- HEAD: STEP 228 상태
- 변경 4파일: `components/home-v6/HomeStockDetail.tsx`(wide prop) · `components/market/MarketClient.tsx`(임베디드 그리드) · `components/home-v6/HomeBreakingNews.tsx`(신규) · `components/home-v6/HomeClientV6.tsx`(전체 교체)
- ⚠️ `HomeStockDetail`은 ETF 미리보기와 **공용** → `wide` prop으로 **실시간차트만** 1/3 채우게(ETF 탭 안 건드림). DB 변경 0

---

## 작업 1/4 — `HomeStockDetail.tsx` `wide` prop 추가 (실시간차트용 폭)

**찾기 (시그니처):**
```tsx
export default function HomeStockDetail({ stock }: { stock: HoverStock | null }) {
```
**바꾸기:**
```tsx
export default function HomeStockDetail({ stock, wide = false }: { stock: HoverStock | null; wide?: boolean }) {
```

**찾기 (aside 폭):**
```tsx
    <aside className="hidden xl:block w-80 shrink-0">
```
**바꾸기:**
```tsx
    <aside className={`hidden xl:block ${wide ? "w-full min-w-0" : "w-80 shrink-0"}`}>
```

> 기본(ETF 미리보기)은 `w-80` 고정 유지, `wide`일 때만 `w-full`(그리드 칸 채움).

---

## 작업 2/4 — `MarketClient.tsx` 임베디드 레이아웃 flex → 2:1 그리드

**찾기 (래퍼 — 부분 문자열):**
```tsx
embedded ? "flex items-start gap-4" : ""
```
**바꾸기:**
```tsx
embedded ? "grid grid-cols-1 items-start gap-4 xl:grid-cols-3" : ""
```

**찾기 (테이블 섹션 — 부분 문자열):**
```tsx
${embedded ? "flex-1 min-w-0" : ""}
```
**바꾸기:**
```tsx
${embedded ? "min-w-0 xl:col-span-2" : ""}
```

> `xl:grid-cols-3` + 표 `col-span-2`(2/3) + 미리보기 1칸(1/3) = 2:1. `xl` 은 미리보기 `hidden xl:block` 브레이크포인트와 일치(그 아래선 표만 풀폭). `{embedded && detailSlot}`(미리보기)는 그대로 — `wide`라 칸을 채움.

---

## 작업 3/4 — 신규 `components/home-v6/HomeBreakingNews.tsx` (실시간 속보)

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type NewsItem = { title: string; link: string; publisher: string; publishedAt: string };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Row({ n }: { n: NewsItem }) {
  return (
    <li>
      <a
        href={n.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-baseline gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-unjong-background"
      >
        <span className="min-w-0 flex-1 truncate text-sm text-unjong-primary">{n.title}</span>
        <span className="shrink-0 text-[11px] text-unjong-muted">{n.publisher} · {timeAgo(n.publishedAt)}</span>
      </a>
    </li>
  );
}

export default function HomeBreakingNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/news/market");
        const j = await r.json();
        if (!cancelled) setItems((j.items as NewsItem[]) || []);
      } catch {
        /* 무시 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const left = items.slice(0, 6);
  const right = items.slice(6, 12);

  return (
    <section className="rounded-2xl border border-unjong-border bg-unjong-surface p-5 shadow-soft">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-unjong-primary">
          🔴 실시간 속보 <span className="text-xs font-normal text-unjong-muted">시장 헤드라인</span>
        </h2>
        <span className="flex items-center gap-1 text-xs text-unjong-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F04452]" /> 실시간
        </span>
      </div>

      {loading ? (
        <LoadingState className="py-8" />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-unjong-muted">속보를 불러오는 중이에요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <ul className="space-y-0.5">{left.map((n, i) => <Row key={`l${i}`} n={n} />)}</ul>
          <ul className="space-y-0.5">{right.map((n, i) => <Row key={`r${i}`} n={n} />)}</ul>
        </div>
      )}
    </section>
  );
}
```

> `/api/news/market`(한경·매경·머투·이데일리·연합 RSS 헤드라인 30개)에서 12개 2열. 클릭 시 원문 새 탭. 인기토론 카드와 같은 카드 셸(크기 동일).

---

## 작업 4/4 — `HomeClientV6.tsx` (파일 전체 교체 — 속보 교체 + 미리보기 wide)

```tsx
"use client";

import { useState } from "react";
import HomeIndexStrip from "./HomeIndexStrip";
import HomeBreakingNews from "./HomeBreakingNews";
import HomeRightRail from "./HomeRightRail";
import HomeStockDetail from "./HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";
import HomeRankingTabs from "./HomeRankingTabs";

export default function HomeClientV6() {
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  return (
    <div className="px-6 py-5">
      {/* 얇은 지수 티커 (헤더 밑 고정 — 지수 앵커) */}
      <HomeIndexStrip />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* 왼쪽: 실시간 속보 + (랭킹 | 상세 2:1) */}
        <div className="min-w-0">
          {/* 🔴 실시간 속보 (옛 인기토론 카드 자리) */}
          <HomeBreakingNews />

          {/* 랭킹 + (xl) 종목 상세 패널(2:1) */}
          <div className="mt-5">
            <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} wide />} />
          </div>
        </div>

        {/* 오른쪽: 관심 레일 */}
        <HomeRightRail />
      </div>
    </div>
  );
}
```

> `HomePopularDiscussions` → `HomeBreakingNews`. `detailSlot`에 `wide` 추가(실시간차트 미리보기 1/3). `HomePopularDiscussions`는 더 이상 import 안 됨(고아 — 후속 정리, 토론은 `/discussion`·종목에 유지).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeStockDetail.tsx components/market/MarketClient.tsx components/home-v6/HomeBreakingNews.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 홈 실시간차트 표:미리보기 2:1 + 인기토론→실시간 속보 (STEP 229)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈 **실시간차트 탭에서 표 : 미리보기 = 2:1**(xl 이상에서 미리보기가 1/3로 넓어짐)
- [ ] **ETF 탭 미리보기는 그대로**(w-80, 안 깨짐)
- [ ] 홈 인기토론 자리에 **🔴 실시간 속보**(헤드라인 12개·2열), 클릭 시 원문 새 탭
- [ ] 속보 비어도 "불러오는 중" 안내(깨짐 없음)
- ⚠️ 서버/클라 혼합 → 하드 새로고침. 그래도 그대로면 dev 재시작.

## 주의·예상 이슈
- 미리보기는 `xl`(1280px) 이상에서만 보이므로 2:1도 xl+에서. 그 아래선 표만 풀폭(정상).
- `HomePopularDiscussions`는 고아(후속 정리). 토론은 `/discussion`·종목 미리보기에 유지.
- 속보 RSS는 10분 캐시(서버) — 항상 최신 12개. 소스 일부 막히면 나머지로 채움.
- **문서 TODO**(다음 갱신): STEP 228·229.

---
> STEP 229 = 홈 실시간차트 2:1 + 인기토론→속보. 전제 STEP 228. 다음 = 리딩방/채널 구조. 문서 묶어 갱신.
