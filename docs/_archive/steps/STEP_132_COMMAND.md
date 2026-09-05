<!-- 2026-06-01 -->
# STEP 132 — 새 홈 손성기 모듈 순서 재배치 + MVP 2.0 진입 모듈

## 실행 명령어
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- STEP 129·130·131 완료 (디자인 시스템·카드·종목 페이지 탭)
- 새 홈 (`/`) 모듈 순서: 시장 핫이슈 → 시장 헤드라인 → HOT 토론 (loose)
- MVP 2.0 (상품·리딩방) 진입 모듈 X (홈 발견성 약함)

## 운종 인사이트 — 손성기 디자이너 (네이버 페이 증권 리뉴얼 2024)

> 70%+ 클릭이 관심종목. 홈 = "탐색의 출발점 가이드".
> 모듈 순서: 시장 지표 → 보유/관심 → 시장 핫이슈 → 트렌딩 → 리서치

## 목표

| 영역 | 변경 |
|------|------|
| **홈 모듈 순서** | 시장 지표 (글로벌 티커 — 이미 헤더) → 관심 종목 (강조) → 시장 핫이슈 → HOT 토론 → **HOT 평가 (MVP 2.0)** → 시장 헤드라인 |
| **신규 모듈** | `HotProductReviewsModule` (HOT 상품 평가) · `HotRoomReviewsModule` (HOT 리딩방 평가) |
| **관심종목** | 우측 → 가운데 상단 강조 (또는 우측 유지하되 시각 강화) |
| **카드 그리드** | 토스 스타일 큰 카드로 (gap-5·rounded-2xl) |

## 작업

### [1] 신규 — `components/home-v5/HotProductReviewsModule.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { MessageCircle } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Product = {
  id: string;
  category: string;
  ticker: string | null;
  name: string;
  issuer: string | null;
  discussion_count: number;
};

export default function HotProductReviewsModule() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("products")
          .select("id, category, ticker, name, issuer, discussion_count")
          .eq("hidden", false)
          .order("discussion_count", { ascending: false })
          .limit(5);
        setItems((data || []) as Product[]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-unjong-primary flex items-center gap-1.5">
          💎 HOT 상품 평가
        </h2>
        <Link href="/products" className="text-xs text-unjong-accent hover:underline font-medium">
          전체 보기 →
        </Link>
      </header>

      {loading ? <LoadingState title="로딩 중..." /> : items.length === 0 ? <EmptyState icon="💼" title="등록된 상품이 없습니다" /> : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/product/${p.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-unjong-background transition-colors">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 flex-shrink-0">
                  {p.category.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-unjong-primary truncate">{p.name}</p>
                  <p className="text-xs text-unjong-muted truncate">{p.issuer}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-unjong-muted flex-shrink-0">
                  <MessageCircle size={12} /> {p.discussion_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

### [2] 신규 — `components/home-v5/HotRoomReviewsModule.tsx`

위와 유사. `leading_rooms` 테이블 조회. is_certified 일 때 ✓ 인증 표시.

```tsx
// HotProductReviewsModule 와 같은 패턴
// 차이: leading_rooms 테이블, platform 배지 (telegram/kakao/discord/youtube), is_certified 시 인증 마크
```

### [3] HomeClientV5 재배치

기존:
```tsx
<div className="grid grid-cols-[320px_1fr_320px] gap-4 px-10 py-4 min-h-[calc(100vh-200px)]">
  <aside className="space-y-4 sticky top-4">
    <ChatPanel />
    <HotChatRoomsModule />
  </aside>
  <main className="space-y-4">
    <section>
      <h2>🔥 시장 핫 이슈</h2>
      <div className="grid grid-cols-2 gap-4">{cards}</div>
    </section>
    <MarketNewsModule />
    <HotDiscussionsModule />
  </main>
  <aside className="sticky top-4">
    <WatchlistPanel />
  </aside>
</div>
```

변경 (손성기 순서):
```tsx
<div className="grid grid-cols-[320px_1fr_320px] gap-5 px-10 py-5 min-h-[calc(100vh-200px)]">
  {/* 좌: 채팅 영역 — 유지 */}
  <aside className="space-y-5 sticky top-5">
    <div className="h-[400px]"><ChatPanel /></div>
    <HotChatRoomsModule />
  </aside>

  {/* 가운데: 손성기 순서 */}
  <main className="space-y-5">
    {/* 1. 시장 핫 이슈 (Movers·Volume·NetBuy·공시) */}
    <section>
      <h2 className="text-lg font-bold text-unjong-primary mb-3">🔥 시장 핫 이슈</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MoversCard />
        <VolumeCard />
        <NetBuyBrokerCard />
        <DisclosureCard />
      </div>
    </section>

    {/* 2. HOT 토론 (운종 본질) */}
    <HotDiscussionsModule />

    {/* 3. MVP 2.0 — HOT 평가 (운종 진짜 차별화) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <HotProductReviewsModule />
      <HotRoomReviewsModule />
    </div>

    {/* 4. 시장 헤드라인 */}
    <MarketNewsModule />
  </main>

  {/* 우: 관심 종목 — 강조 (70% 클릭 영역) */}
  <aside className="sticky top-5">
    <WatchlistPanel />
  </aside>
</div>
```

### [4] WatchlistPanel 시각 강화

기존 WatchlistPanel 의 컨테이너에 CardContainer 적용 또는 직접 rounded-2xl + shadow-soft + p-5 추가. 헤더 큰 폰트.

### [5] 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### [6] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(design): 새 홈 손성기 모듈 순서 + MVP 2.0 진입 (전면 리뉴얼 STEP 4/5)

신규 모듈:
- HotProductReviewsModule — HOT 상품 평가 TOP 5 (/products 진입)
- HotRoomReviewsModule — HOT 리딩방 평가 TOP 5 (/rooms 진입, 인증 마크 표시)

HomeClientV5 모듈 순서 재배치 (손성기 디자이너 인사이트):
1. 시장 핫 이슈 (Movers·Volume·NetBuy·공시) — gap-5 큰 카드
2. HOT 토론 — 운종 본질
3. HOT 평가 2개 모듈 — MVP 2.0 진입 (운종 차별화)
4. 시장 헤드라인 — 외부 RSS

WatchlistPanel:
- CardContainer 스타일 적용 (rounded-2xl + shadow-soft)
- 우측 sticky 유지 (70%+ 클릭 영역 — 손성기 데이터)

좌측 채팅 영역 유지 + 변경 X

다음 STEP 133: /screener·/calendar 정리 + MVP 2.0 페이지 디자인 통일"
git push
```
