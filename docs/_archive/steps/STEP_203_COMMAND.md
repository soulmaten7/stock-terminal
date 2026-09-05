<!-- 2026-06-07 -->
# STEP 203 — 리딩방 hover 프리뷰 (텔레그램 연결 + 👍/👎 투표 + 방 평가)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_203_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시 — 종목 hover 프리뷰처럼)
리딩방 행에 마우스 올리면 **오른쪽 사이드 프리뷰**:
- **텔레그램 연결 미리보기** = 플랫폼 로고+방이름+ "입장하기" 버튼(`external_url`). ⚠️ 텔레그램 라이브 임베드는 불가(iframe 차단) → 연결 카드.
- **👍 좋아요 / 👎 싫어요 투표 버튼**(실동작, `leading_room_votes`) + 👁 조회수
- 그 아래 **방 평가(댓글)** 최근 3개(읽기) + "방 상세·평가 남기기 →" CTA(`/room/{id}` 전체 보드)
- 투표는 로그인 필요(비로그인 시 안내). 토글/전환은 기존 토론 투표 패턴 그대로(`vote_type` like/dislike).

## 전제 상태
- HEAD: STEP 202 + 마이그레이션 023 DB 적용 상태
- 변경: `components/home-v6/platformLogo.tsx`(신규) + `components/home-v6/HomeRoomPreview.tsx`(신규) + `components/home-v6/HomeRoomRanking.tsx`(전면 교체)

---

## 작업 1/3 — 신규 `components/home-v6/platformLogo.tsx` (플랫폼 로고 공용)

```tsx
"use client";

import { useState } from "react";

export const PLATFORM_LABEL: Record<string, string> = {
  telegram: "텔레그램",
  kakao: "카카오",
  discord: "디스코드",
  naver_band: "네이버밴드",
  naver_cafe: "네이버카페",
  youtube: "유튜브",
  other: "기타",
};

const PLATFORM_DOMAIN: Record<string, string> = {
  telegram: "telegram.org",
  kakao: "kakaocorp.com",
  discord: "discord.com",
  naver_band: "band.us",
  naver_cafe: "naver.com",
  youtube: "youtube.com",
};

const PLATFORM_EMOJI: Record<string, string> = {
  telegram: "✈️",
  kakao: "💬",
  discord: "🎮",
  naver_band: "🟢",
  naver_cafe: "☕",
  youtube: "▶️",
  other: "📡",
};

const LOGODEV = process.env.NEXT_PUBLIC_LOGODEV_TOKEN;

export function PlatformLogo({ platform, size = 28 }: { platform: string; size?: number }) {
  const [err, setErr] = useState(false);
  const domain = PLATFORM_DOMAIN[platform];
  const url = domain && LOGODEV ? `https://img.logo.dev/${domain}?token=${LOGODEV}&size=128&retina=true` : null;
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        className="shrink-0 rounded-full border border-unjong-border bg-white object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-unjong-background"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {PLATFORM_EMOJI[platform] ?? PLATFORM_EMOJI.other}
    </span>
  );
}
```

## 작업 2/3 — 신규 `components/home-v6/HomeRoomPreview.tsx` (프리뷰 패널)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { ThumbsUp, ThumbsDown, Eye, ShieldCheck, ExternalLink } from "lucide-react";
import { PlatformLogo, PLATFORM_LABEL } from "./platformLogo";

export type RoomItem = {
  id: string;
  platform: string;
  name: string;
  operator: string | null;
  pricing: string | null;
  external_url: string | null;
  is_certified: boolean;
  like_count: number;
  dislike_count: number;
  view_count: number;
};

type Comment = { id: string; nickname: string; content: string };

export default function HomeRoomPreview({ room }: { room: RoomItem | null }) {
  const user = useAuthStore((s) => s.user);
  const [vote, setVote] = useState<"like" | "dislike" | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loginNotice, setLoginNotice] = useState(false);

  useEffect(() => {
    if (!room) return;
    setLikes(room.like_count);
    setDislikes(room.dislike_count);
    setVote(null);
    let cancelled = false;
    (async () => {
      const supabase = createAnonClient();
      if (user) {
        const { data } = await supabase
          .from("leading_room_votes")
          .select("vote_type")
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled && data) setVote(data.vote_type as "like" | "dislike");
      }
      const { data: cs } = await supabase
        .from("platform_discussions")
        .select("id, nickname, content")
        .eq("target_type", "room")
        .eq("target_id", room.id)
        .eq("hidden", false)
        .order("like_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (!cancelled) setComments((cs as Comment[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [room?.id, user]);

  if (!room) {
    return (
      <aside className="hidden w-80 shrink-0 xl:block">
        <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-5 text-sm text-unjong-muted shadow-soft">
          리딩방에 마우스를 올리면 미리보기가 표시됩니다.
        </div>
      </aside>
    );
  }

  const notifyLogin = () => { setLoginNotice(true); setTimeout(() => setLoginNotice(false), 3000); };

  const handleVote = async (dir: "like" | "dislike") => {
    if (!user) return notifyLogin();
    const supabase = createAnonClient();
    if (vote === dir) {
      const { error } = await supabase.from("leading_room_votes").delete().eq("room_id", room.id).eq("user_id", user.id);
      if (!error) {
        setVote(null);
        if (dir === "like") setLikes((c) => Math.max(c - 1, 0));
        else setDislikes((c) => Math.max(c - 1, 0));
      }
    } else if (vote === null) {
      const { error } = await supabase.from("leading_room_votes").insert({ room_id: room.id, user_id: user.id, vote_type: dir });
      if (!error) {
        setVote(dir);
        if (dir === "like") setLikes((c) => c + 1);
        else setDislikes((c) => c + 1);
      }
    } else {
      const { error } = await supabase.from("leading_room_votes").update({ vote_type: dir }).eq("room_id", room.id).eq("user_id", user.id);
      if (!error) {
        setVote(dir);
        if (dir === "like") { setLikes((c) => c + 1); setDislikes((c) => Math.max(c - 1, 0)); }
        else { setDislikes((c) => c + 1); setLikes((c) => Math.max(c - 1, 0)); }
      }
    }
  };

  return (
    <aside className="hidden w-80 shrink-0 xl:block">
      <div className="sticky top-5 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
        {/* 헤더 */}
        <div className="flex items-center gap-2.5 border-b border-unjong-border p-4">
          <PlatformLogo platform={room.platform} size={36} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-bold text-unjong-primary">{room.name}</p>
              {room.is_certified && <ShieldCheck size={13} className="shrink-0 text-emerald-600" />}
            </div>
            <p className="truncate text-xs text-unjong-muted">
              {PLATFORM_LABEL[room.platform] ?? "기타"}{room.pricing ? ` · ${room.pricing}` : ""}
            </p>
          </div>
        </div>

        {/* 연결 */}
        <div className="border-b border-unjong-border p-4">
          <p className="mb-2 text-xs font-semibold text-unjong-muted">연결</p>
          {room.external_url ? (
            <a
              href={room.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-unjong-primary py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {PLATFORM_LABEL[room.platform] ?? "방"} 입장하기 <ExternalLink size={13} />
            </a>
          ) : (
            <p className="rounded-lg bg-unjong-background py-2.5 text-center text-xs text-unjong-muted">입장 링크 미등록</p>
          )}
        </div>

        {/* 투표 + 조회수 */}
        <div className="flex items-center gap-2 border-b border-unjong-border p-4">
          <button
            type="button"
            onClick={() => handleVote("like")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors ${
              vote === "like" ? "border-[#F04452] bg-[#F04452]/5 text-[#F04452]" : "border-unjong-border text-unjong-muted hover:border-[#F04452] hover:text-[#F04452]"
            }`}
          >
            <ThumbsUp size={14} fill={vote === "like" ? "currentColor" : "none"} /> {likes}
          </button>
          <button
            type="button"
            onClick={() => handleVote("dislike")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition-colors ${
              vote === "dislike" ? "border-[#3182F6] bg-[#3182F6]/5 text-[#3182F6]" : "border-unjong-border text-unjong-muted hover:border-[#3182F6] hover:text-[#3182F6]"
            }`}
          >
            <ThumbsDown size={14} fill={vote === "dislike" ? "currentColor" : "none"} /> {dislikes}
          </button>
          <span className="flex items-center gap-1 px-1 text-xs text-unjong-muted"><Eye size={13} /> {room.view_count}</span>
        </div>
        {loginNotice && <p className="px-4 pt-2 text-[11px] text-amber-700">로그인 후 평가할 수 있어요.</p>}

        {/* 방 평가 */}
        <div className="p-4">
          <p className="mb-2 text-xs font-semibold text-unjong-muted">방 평가</p>
          {comments.length === 0 ? (
            <p className="text-xs text-unjong-muted">아직 평가가 없어요. 첫 평가를 남겨보세요.</p>
          ) : (
            <ul className="space-y-2.5">
              {comments.map((c) => (
                <li key={c.id} className="text-xs">
                  <p className="mb-0.5 text-unjong-muted">{c.nickname}</p>
                  <p className="line-clamp-2 text-unjong-primary">{c.content}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/room/${room.id}`}
            className="mt-3 block w-full rounded-lg border border-unjong-border py-2 text-center text-sm font-medium text-unjong-primary hover:bg-unjong-background"
          >
            방 상세 · 평가 남기기 →
          </Link>
        </div>
      </div>
    </aside>
  );
}
```

## 작업 3/3 — `components/home-v6/HomeRoomRanking.tsx` (파일 전체 교체 — list ｜ preview)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown, Eye, ShieldCheck, AlertTriangle } from "lucide-react";
import { LoadingState } from "@/components/ui/State";
import { PlatformLogo } from "./platformLogo";
import HomeRoomPreview, { type RoomItem } from "./HomeRoomPreview";

export default function HomeRoomRanking() {
  const [items, setItems] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<RoomItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("leading_rooms")
          .select("id, platform, name, operator, pricing, external_url, is_certified, like_count, dislike_count, view_count")
          .eq("hidden", false)
          .order("is_certified", { ascending: false })
          .order("like_count", { ascending: false })
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
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 운종 정체성 경고 */}
      <div className="flex items-start gap-2 border-b border-unjong-border bg-amber-50 px-4 py-2.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-relaxed text-amber-800">
          운종은 리딩방을 <b>평가하지 않아요</b>. 금감원 신고 여부(사실)와 사용자 평가만 보여줘요. 허위·작전·과장이 많으니 가입·결제 전 충분히 확인하세요.
        </p>
      </div>

      {loading ? (
        <LoadingState className="py-10" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <span className="mb-2 text-2xl">📡</span>
          <p className="text-sm font-medium text-unjong-primary">아직 등록된 리딩방이 없어요</p>
          <Link href="/discussion" className="mt-3 inline-block rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            리딩방 디렉토리 보기 →
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
                    ) : (
                      <span className="shrink-0 rounded-full bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">신고 미확인</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-[11px] tabular-nums text-unjong-muted">
                    <span className="flex items-center gap-0.5"><ThumbsUp size={11} /> {r.like_count}</span>
                    <span className="flex items-center gap-0.5"><ThumbsDown size={11} /> {r.dislike_count}</span>
                    <span className="flex items-center gap-0.5"><Eye size={11} /> {r.view_count}</span>
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

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/platformLogo.tsx components/home-v6/HomeRoomPreview.tsx components/home-v6/HomeRoomRanking.tsx && git commit -m "feat(v7): 리딩방 hover 프리뷰 — 연결 카드+👍/👎 투표+방 평가, 플랫폼 로고 공용화 (STEP 203)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 리딩방 행 hover → **오른쪽 프리뷰**(로고+방이름 / 입장하기 버튼 / 👍👎 투표 / 👁조회수 / 방 평가 3개 + CTA)
- [ ] 로그인 상태에서 👍/👎 누르면 카운트 바뀌고(토글·전환), 새로고침해도 유지(`leading_room_votes`)
- [ ] 비로그인 시 "로그인 후 평가할 수 있어요" 안내
- [ ] 입장하기 = `external_url` 새 탭(없으면 "링크 미등록")
- [ ] xl 미만에선 프리뷰 숨고 리스트 전체폭
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 투표는 로그인(인증 유저)만 — RLS(auth.uid()=user_id). createAnonClient가 세션 보유.
- 텔레그램 라이브 임베드 불가 → 연결 카드(입장 버튼)로. 공개채널 최근글 임베드는 추후 옵션.
- 방 댓글 작성(전체)은 `/room/{id}` 의 PlatformDiscussionBoard. 프리뷰는 최근 3개 읽기 + CTA.
- **문서 TODO**(다음 갱신): STEP 200~203(리딩방 랭킹·DB·행·프리뷰).

---
> STEP 203 = 리딩방 hover 프리뷰. 전제 STEP 202+023. 리딩방 묶음 완료. 문서 묶어 갱신.
