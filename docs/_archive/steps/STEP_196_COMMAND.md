<!-- 2026-06-07 -->
# STEP 196 — 인기토론 홈 ②③ 인기토론 2열 라이브 + 주요지수 박스 교체

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_196_COMMAND.md 파일 내용대로 실행해줘`

## 목표
큰 '주요지수' 박스를 **인기토론 2열 라이브**로 교체(지수는 STEP 195 상단 스트립이 대체). ②(컴포넌트)+③(교체)를 한 번에.
- `discussions`(`createAnonClient`) 좋아요 순 상위 10 → **2열(1~5 ｜ 6~10)**, 각 행: 순위·로고·닉네임(tier)·내용·**좋아요/반론/댓글**·시간.
- **인기순 + 반론 노출**(합의): 좋아요 옆에 싫어요(반론) 같이 → 운종이 판단 안 하고 사용자가 거름.
- **라이브**: 20초 폴링(좋아요 변하면 순위 갱신). 빈/적을 땐 "첫 의견 남기기" CTA(가짜 글 X).
- 중복되는 **하단 마퀴(HomeStickyTicker) 제거**(상단 스트립이 앵커). HomeIndexBar 파일은 보존(미사용).
- ⚠️ 박스 제거로 **코스피/코스닥 수급(개인·외국인·기관)이 홈에서 빠짐** — '국내 투자자 동향' 탭에 있고, 원하면 작은 카드로 추후 재배치.

## 전제 상태
- HEAD: STEP 195 적용된 상태
- 변경: `components/home-v6/HomePopularDiscussions.tsx`(신규) + `components/home-v6/HomeClientV6.tsx`(전면 교체)

---

## 작업 1/2 — 신규 `components/home-v6/HomePopularDiscussions.tsx` (파일 생성)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { LoadingState } from "@/components/ui/State";
import { StockLogo } from "@/components/ui/StockLogo";

type Discussion = {
  id: string;
  symbol: string;
  nickname: string;
  tier: number;
  content: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  created_at: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Row({ d, rank }: { d: Discussion; rank: number }) {
  const tierEmoji = d.tier === 3 ? "🏆" : d.tier === 2 ? "✓" : "";
  return (
    <li>
      <Link href={`/stock/${d.symbol}`} className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-unjong-background">
        <span className="w-4 shrink-0 text-center text-sm font-bold tabular-nums text-unjong-muted">{rank}</span>
        <StockLogo code={d.symbol} name={d.symbol} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-xs text-unjong-muted">{tierEmoji} {d.nickname}</span>
            <span className="shrink-0 text-[11px] text-unjong-muted">{timeAgo(d.created_at)}</span>
          </div>
          <p className="truncate text-sm font-medium text-unjong-primary">{d.content}</p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-unjong-muted">
            <span className="flex items-center gap-0.5"><ThumbsUp size={11} /> {d.like_count}</span>
            <span className="flex items-center gap-0.5"><ThumbsDown size={11} /> {d.dislike_count}</span>
            <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {d.comment_count}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default function HomePopularDiscussions() {
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("discussions")
          .select("id, symbol, nickname, tier, content, like_count, dislike_count, comment_count, created_at")
          .eq("hidden", false)
          .order("like_count", { ascending: false })
          .order("comment_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10);
        if (!cancelled) setItems((data as Discussion[]) || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const left = items.slice(0, 5);
  const right = items.slice(5, 10);

  return (
    <section className="rounded-2xl border border-unjong-border bg-unjong-surface p-5 shadow-soft">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-unjong-primary">
          🔥 인기 토론 <span className="text-xs font-normal text-unjong-muted">좋아요 순</span>
        </h2>
        <span className="flex items-center gap-1 text-xs text-unjong-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F04452]" /> 실시간
        </span>
      </div>

      {loading ? (
        <LoadingState className="py-8" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <span className="mb-2 text-2xl">💬</span>
          <p className="text-sm font-medium text-unjong-primary">아직 인기 토론이 없어요</p>
          <p className="mt-1 text-xs text-unjong-muted">첫 의견을 남기면 여기 1등으로 올라가요.</p>
          <Link href="/discussion" className="mt-3 inline-block rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            토론 보러 가기 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <ul className="space-y-0.5">
            {left.map((d, i) => <Row key={d.id} d={d} rank={i + 1} />)}
          </ul>
          <ul className="space-y-0.5">
            {right.map((d, i) => <Row key={d.id} d={d} rank={i + 6} />)}
          </ul>
        </div>
      )}
    </section>
  );
}
```

## 작업 2/2 — `components/home-v6/HomeClientV6.tsx` (파일 전체 교체)

```tsx
"use client";

import { useState } from "react";
import HomeIndexStrip from "./HomeIndexStrip";
import HomePopularDiscussions from "./HomePopularDiscussions";
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* 왼쪽: 상태바 + 인기토론 + (랭킹 | 상세) */}
        <div className="min-w-0">
          {/* 시장 상태바 */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-unjong-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
              국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
              해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
            </span>
          </div>

          {/* 인기 토론 (주요지수 박스 자리 — 지수는 상단 스트립으로 이동) */}
          <HomePopularDiscussions />

          {/* 랭킹 + (xl) 종목 상세 패널 */}
          <div className="mt-5">
            <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} />} />
          </div>
        </div>

        {/* 오른쪽: 관심 레일 */}
        <HomeRightRail />
      </div>
    </div>
  );
}
```

> HomeIndexBar(박스)·HomeStickyTicker(하단 마퀴)·gridRef·useRef 제거 → 미사용 import 정리. 파일은 남겨둠(추후 재사용 가능).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomePopularDiscussions.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 인기토론 2열 라이브 + 주요지수 박스 교체(하단 마퀴 제거) — 인기토론 홈 ②③ (STEP 196)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 (미사용 import 경고 없는지) / 커밋·push
- [ ] 홈 = [상단 지수 스트립] → [🔥 인기 토론 2열] → [실시간차트 탭] / 오른쪽 관심레일
- [ ] 인기토론: 토론 있으면 좋아요 순 2열(순위·로고·닉네임·내용·👍/👎/💬·시간), 없으면 "첫 의견 남기기" CTA
- [ ] 큰 주요지수 박스·하단 마퀴 사라짐(지수는 상단 스트립에만)
- [ ] 20초마다 자동 갱신(좋아요 바뀌면 순위 변동)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 운종 신규라 토론이 적어 초반엔 CTA/소수만 표시 — 정상(가짜 글 X). 글 쌓이면 자동으로 찬다.
- 수급(코스피/코스닥 개인·외국인·기관)은 박스와 함께 홈에서 빠짐 → 원하면 작은 카드로 재배치 가능(말해주면 STEP 추가).
- `symbol` 없는 토론은 로고 아바타로 표시.
- 다음: 수급 재배치 여부 · 인기토론 빈상태 시딩 전략 · STEP 162 키 대기.

---
> STEP 196 = 인기토론 홈 ②③(2열 라이브 + 박스 교체). 전제 STEP 195. 인기토론 홈 완성. 문서 묶어 갱신.
