<!-- 2026-06-07 -->
# STEP 210 — 채널 팔로워순 A (컬럼 + 정렬칩·표시, 채널 한정)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_210_COMMAND.md 파일 내용대로 실행해줘`

## 목표
주식 관련 채널 랭킹에 **팔로워순** 추가(채널 한정).
- **DB 적용됨**: `leading_rooms.follower_count`·`follower_synced_at`(마이그레이션 025, Cowork MCP 적용 완료. 파일 커밋만).
- 채널 탭: 정렬칩에 **팔로워순** 추가(맨 앞), 행 우측에 **👤 팔로워수** 표시(채널만).
- 리딩방 탭은 그대로(팔로워 개념 약함).
- 데이터는 0부터 — **유튜브 자동수집/등록(B)은 후속 STEP**(YouTube API 키 필요).

## 전제 상태
- HEAD: STEP 209 + 마이그레이션 025 DB 적용
- 변경: `components/home-v6/HomeRoomRanking.tsx`(전면 교체) + `components/home-v6/HomeRoomPreview.tsx`(3곳) + `025_channel_follower.sql`(커밋)

---

## 작업 1/2 — `components/home-v6/HomeRoomPreview.tsx` (타입·아이콘·표시 3곳)

**찾기:**
```tsx
import { ThumbsUp, ThumbsDown, Eye, ShieldCheck, ExternalLink } from "lucide-react";
```
**바꾸기:**
```tsx
import { ThumbsUp, ThumbsDown, Eye, Users, ShieldCheck, ExternalLink } from "lucide-react";
```

**찾기:**
```tsx
  is_certified: boolean;
  like_count: number;
  dislike_count: number;
  view_count: number;
};
```
**바꾸기:**
```tsx
  is_certified: boolean;
  like_count: number;
  dislike_count: number;
  view_count: number;
  follower_count: number;
};
```

**찾기:**
```tsx
          <span className="flex items-center gap-1 px-1 text-xs text-unjong-muted"><Eye size={13} /> {room.view_count}</span>
        </div>
```
**바꾸기:**
```tsx
          <span className="flex items-center gap-1 px-1 text-xs text-unjong-muted"><Eye size={13} /> {room.view_count}</span>
          {room.follower_count > 0 && (
            <span className="flex items-center gap-1 px-1 text-xs text-unjong-muted"><Users size={13} /> {room.follower_count.toLocaleString()}</span>
          )}
        </div>
```

## 작업 2/2 — `components/home-v6/HomeRoomRanking.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown, Eye, Users, ShieldCheck, AlertTriangle } from "lucide-react";
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

type RoomSort = "follower" | "like" | "dislike" | "view";
const SORT_COL: Record<RoomSort, string> = {
  follower: "follower_count",
  like: "like_count",
  dislike: "dislike_count",
  view: "view_count",
};

function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}

export default function HomeRoomRanking({ platforms, kind }: { platforms: string[]; kind: Kind }) {
  const sorts: { key: RoomSort; label: string }[] =
    kind === "channel"
      ? [{ key: "follower", label: "팔로워순" }, { key: "like", label: "좋아요순" }, { key: "dislike", label: "싫어요순" }, { key: "view", label: "조회순" }]
      : [{ key: "like", label: "좋아요순" }, { key: "dislike", label: "싫어요순" }, { key: "view", label: "조회순" }];

  const [items, setItems] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<RoomItem | null>(null);
  const [sort, setSort] = useState<RoomSort>("like");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("leading_rooms")
          .select("id, platform, name, operator, pricing, external_url, is_certified, like_count, dislike_count, view_count, follower_count")
          .eq("hidden", false)
          .in("platform", platforms)
          .order(SORT_COL[sort], { ascending: false })
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
      <div className="flex flex-wrap items-center gap-1 border-b border-unjong-border px-3 py-2">
        {sorts.map((s) => (
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
                <Link href={`/room/${r.id}`} onMouseEnter={() => setHovered(r)} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-unjong-background">
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
                    {kind === "channel" && (
                      <span className={`flex items-center gap-0.5 ${sort === "follower" ? "font-bold text-unjong-primary" : ""}`}><Users size={11} /> {r.follower_count.toLocaleString()}</span>
                    )}
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

> 변경: 채널 정렬칩 맨 앞 **팔로워순** + 행 우측 **👤 팔로워수**(채널만), select에 follower_count. 리딩방은 그대로.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add supabase/migrations/025_channel_follower.sql components/home-v6/HomeRoomRanking.tsx components/home-v6/HomeRoomPreview.tsx && git commit -m "feat(db+v7): 채널 팔로워순 — follower_count(025) + 팔로워순 정렬칩·표시(채널) (STEP 210)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **주식 관련 채널** 탭 정렬칩에 **팔로워순** 추가(맨 앞), 행 우측에 👤 팔로워수
- [ ] 리딩방 탭은 팔로워 없이 그대로(좋아요/싫어요/조회)
- [ ] 팔로워수는 아직 0(데이터 수집 전) — 정상
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- follower_count 0부터 → 팔로워순 초기엔 동률. **B(STEP 후속)**: 유튜브 Data API 주1회 크론 자동수집 + 인스타/페북 등록 입력 채우면 의미 생김.
- 유튜브 자동수집은 **YouTube API 키 + 채널ID(external_url에서 추출/저장)** 필요 → 별도 STEP.
- **문서 TODO**(다음 갱신): STEP 207~210 + 마이그레이션 024·025.
- 다음(순서대로): ③ 종목상세 미세 폴리시. (팔로워 B는 키 준비되면.)

---
> STEP 210 = 채널 팔로워순 A(컬럼+UI). 전제 STEP 209+025. 다음: 종목상세 폴리시. 문서 묶어 갱신.
