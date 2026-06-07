<!-- 2026-06-07 -->
# STEP 206 — 리딩방/채널 랭킹 (경고 문구 개정 + 좋아요/싫어요/조회 클릭 정렬)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_206_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시 — 리딩방·채널 공용 컴포넌트라 한 번에)
1. **경고 문구 개정**(둘 다, "추천·보증 안 함" 방패 유지):
   - 리딩방: "금감원 신고 여부(사실)와 사용자 평가 순으로 랭킹을 보여줄 뿐, 운종이 추천·보증하지 않아요. 허위·작전·과장이 많으니 가입·결제 전 충분히 확인하세요."
   - 채널: "주식 관련 유튜브·SNS·디스코드 채널이에요. 운종은 사용자 평가 랭킹을 보여줄 뿐 추천·보증하지 않아요. 투자 판단·결과는 본인 책임이에요."
2. **정렬 칩 추가**: 좋아요순 / 싫어요순 / 조회순 — 클릭 시 재정렬, 활성 지표 굵게. (싫어요순 = "주의" 뷰)
3. 인증 배지는 유지(시각 신뢰 신호), 정렬은 선택 지표 기준(인증 강제 상위 해제).
4. ⚠️ 채널 **팔로워순**은 `follower_count` 컬럼(DB)·수집 필요 → **별도 후속 STEP**.

## 전제 상태
- HEAD: STEP 205 상태
- 변경: `components/home-v6/HomeRoomRanking.tsx`(전면 교체) 1파일 — 리딩방·채널 둘 다 반영(공용)

---

## 작업 1/1 — `components/home-v6/HomeRoomRanking.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown, Eye, ShieldCheck, AlertTriangle } from "lucide-react";
import { LoadingState } from "@/components/ui/State";
import { PlatformLogo } from "./platformLogo";
import HomeRoomPreview, { type RoomItem } from "./HomeRoomPreview";

type Kind = "room" | "channel";

const COPY: Record<Kind, { warn: string; empty: string }> = {
  room: {
    warn: "금감원 신고 여부(사실)와 사용자 평가 순으로 랭킹을 보여줄 뿐, 운종이 추천·보증하지 않아요. 허위·작전·과장이 많으니 가입·결제 전 충분히 확인하세요.",
    empty: "아직 등록된 리딩방이 없어요",
  },
  channel: {
    warn: "주식 관련 유튜브·SNS·디스코드 채널이에요. 운종은 사용자 평가 랭킹을 보여줄 뿐 추천·보증하지 않아요. 투자 판단·결과는 본인 책임이에요.",
    empty: "아직 등록된 채널이 없어요",
  },
};

type RoomSort = "like" | "dislike" | "view";
const ROOM_SORTS: { key: RoomSort; label: string; col: string }[] = [
  { key: "like", label: "좋아요순", col: "like_count" },
  { key: "dislike", label: "싫어요순", col: "dislike_count" },
  { key: "view", label: "조회순", col: "view_count" },
];

function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}

export default function HomeRoomRanking({ platforms, kind }: { platforms: string[]; kind: Kind }) {
  const [items, setItems] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<RoomItem | null>(null);
  const [sort, setSort] = useState<RoomSort>("like");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const sortCol = ROOM_SORTS.find((s) => s.key === sort)!.col;
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("leading_rooms")
          .select("id, platform, name, operator, pricing, external_url, is_certified, like_count, dislike_count, view_count")
          .eq("hidden", false)
          .in("platform", platforms)
          .order(sortCol, { ascending: false })
          .order("view_count", { ascending: false })
          .limit(10);
        if (!cancelled) {
          const list = (data as RoomItem[]) ?? [];
          setItems(list);
          setHovered(list[0] ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [platforms, kind, sort]);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 정체성 경고 */}
      <div className="flex items-start gap-2 border-b border-unjong-border bg-amber-50 px-4 py-2.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-relaxed text-amber-800">{COPY[kind].warn}</p>
      </div>

      {/* 정렬 칩 */}
      <div className="flex items-center gap-1 border-b border-unjong-border px-3 py-2">
        {ROOM_SORTS.map((s) => (
          <button key={s.key} type="button" onClick={() => setSort(s.key)} className={chip(sort === s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState className="py-10" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <span className="mb-2 text-2xl">{kind === "room" ? "📡" : "📺"}</span>
          <p className="text-sm font-medium text-unjong-primary">{COPY[kind].empty}</p>
          <Link href="/discussion" className="mt-3 inline-block rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            디렉토리 보기 →
          </Link>
        </div>
      ) : (
        <div className="flex items-start gap-4 p-2">
          <ul className="min-w-0 flex-1 divide-y divide-unjong-border">
            {items.map((r, i) => (
              <li key={r.id}>
                <Link
                  href={`/room/${r.id}`}
                  onMouseEnter={() => setHovered(r)}
                  className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-unjong-background"
                >
                  <span className="w-4 shrink-0 text-center text-sm font-bold tabular-nums text-unjong-muted">{i + 1}</span>
                  <PlatformLogo platform={r.platform} size={28} />
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-unjong-primary">{r.name}</span>
                    {r.is_certified ? (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <ShieldCheck size={10} /> 금감원 신고 ✓
                      </span>
                    ) : kind === "room" ? (
                      <span className="shrink-0 rounded-full bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">신고 미확인</span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-[11px] tabular-nums text-unjong-muted">
                    <span className={`flex items-center gap-0.5 ${sort === "like" ? "font-bold text-unjong-primary" : ""}`}><ThumbsUp size={11} /> {r.like_count}</span>
                    <span className={`flex items-center gap-0.5 ${sort === "dislike" ? "font-bold text-unjong-primary" : ""}`}><ThumbsDown size={11} /> {r.dislike_count}</span>
                    <span className={`flex items-center gap-0.5 ${sort === "view" ? "font-bold text-unjong-primary" : ""}`}><Eye size={11} /> {r.view_count}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <HomeRoomPreview room={hovered} />
        </div>
      )}
    </section>
  );
}
```

> 변경: 경고 문구(room/channel 둘 다 개정) · 정렬 칩(좋아요/싫어요/조회, 활성 지표 굵게) · 정렬 시 재쿼리 · 인증 강제상위 해제(배지 유지).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeRoomRanking.tsx && git commit -m "feat(v7): 리딩방/채널 랭킹 — 경고 문구 개정 + 좋아요/싫어요/조회 클릭 정렬(공용) (STEP 206)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 리딩방·채널 둘 다 **경고 문구 새 버전**("추천·보증하지 않아요" 포함)
- [ ] **좋아요순/싫어요순/조회순 칩** — 클릭 시 순위 바뀌고, 해당 카운트 굵게
- [ ] 싫어요순 누르면 "싫어요 많은 순"(주의 뷰)으로 재정렬
- [ ] 인증 배지(금감원 신고 ✓)는 그대로, hover 프리뷰·투표 동작 유지
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 채널 **팔로워순**은 `follower_count` 컬럼+수집(유튜브 자동/인스타·페북 등록기반)이라 **별도 후속 STEP**.
- 정렬은 선택 지표 기준(인증 강제 상위 X) — 인증은 배지로 신뢰 신호.
- **문서 TODO**(다음 갱신): STEP 205~206 + 채널 팔로워 후속.

---
> STEP 206 = 리딩방/채널 정렬·문구. 전제 STEP 205. 다음: 채널 팔로워(DB) · 상세페이지. 문서 묶어 갱신.
