<!-- 2026-06-07 -->
# STEP 204 — 리딩방=텔레그램/카카오만 + '주식 관련 채널' 탭 신설

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_204_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
- **리딩방** 탭 = **텔레그램·카카오톡만** (실질적 리딩방)
- **주식 관련 채널** 탭 신설 = 유튜브·디스코드·인스타그램·페이스북·네이버밴드/카페·기타
- 데이터는 한 테이블(`leading_rooms`), **platform 필터로만 분리**(DB 변경 0)
- `HomeRoomRanking` 을 `{ platforms, kind }` 파라미터화 → 두 탭이 같은 컴포넌트 재사용. 경고 문구·인증 배지 규칙만 kind 별로.
  - 리딩방: 강한 경고 + 미인증 "신고 미확인" 라벨
  - 채널: 가벼운 경고 + **인증된 경우만 ✓**(미인증 라벨 없음 — 유튜버 등은 신고 대상 아님)
- 인스타그램·페이스북 로고 추가

## 전제 상태
- HEAD: STEP 203 상태
- 변경: `components/home-v6/platformLogo.tsx`(인스타/페북 추가) + `components/home-v6/HomeRoomRanking.tsx`(파라미터화) + `components/home-v6/HomeRankingTabs.tsx`(채널 탭)

---

## 작업 1/3 — `components/home-v6/platformLogo.tsx` (파일 전체 교체 — 인스타/페북 추가)

```tsx
"use client";

import { useState } from "react";

export const PLATFORM_LABEL: Record<string, string> = {
  telegram: "텔레그램",
  kakao: "카카오",
  discord: "디스코드",
  youtube: "유튜브",
  instagram: "인스타그램",
  facebook: "페이스북",
  naver_band: "네이버밴드",
  naver_cafe: "네이버카페",
  other: "기타",
};

const PLATFORM_DOMAIN: Record<string, string> = {
  telegram: "telegram.org",
  kakao: "kakaocorp.com",
  discord: "discord.com",
  youtube: "youtube.com",
  instagram: "instagram.com",
  facebook: "facebook.com",
  naver_band: "band.us",
  naver_cafe: "naver.com",
};

const PLATFORM_EMOJI: Record<string, string> = {
  telegram: "✈️",
  kakao: "💬",
  discord: "🎮",
  youtube: "▶️",
  instagram: "📷",
  facebook: "👥",
  naver_band: "🟢",
  naver_cafe: "☕",
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

## 작업 2/3 — `components/home-v6/HomeRoomRanking.tsx` (파일 전체 교체 — 파라미터화)

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
    warn: "운종은 리딩방을 평가하지 않아요. 금감원 신고 여부(사실)와 사용자 평가만 보여줘요. 허위·작전·과장이 많으니 가입·결제 전 충분히 확인하세요.",
    empty: "아직 등록된 리딩방이 없어요",
  },
  channel: {
    warn: "주식 관련 유튜브·SNS·디스코드 채널이에요. 운종은 채널을 평가하지 않고 사용자 평가만 보여줘요. 투자 판단·결과는 본인 책임이에요.",
    empty: "아직 등록된 채널이 없어요",
  },
};

export default function HomeRoomRanking({ platforms, kind }: { platforms: string[]; kind: Kind }) {
  const [items, setItems] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<RoomItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("leading_rooms")
          .select("id, platform, name, operator, pricing, external_url, is_certified, like_count, dislike_count, view_count")
          .eq("hidden", false)
          .in("platform", platforms)
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
  }, [platforms, kind]);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 정체성 경고 */}
      <div className="flex items-start gap-2 border-b border-unjong-border bg-amber-50 px-4 py-2.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-relaxed text-amber-800">{COPY[kind].warn}</p>
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

## 작업 3/3 — `components/home-v6/HomeRankingTabs.tsx` (채널 탭 + props)

**찾기:**
```tsx
  { key: "room", label: "리딩방" },
] as const;
```
**바꾸기:**
```tsx
  { key: "room", label: "리딩방" },
  { key: "channel", label: "주식 관련 채널" },
] as const;
```

**찾기:**
```tsx
      {tab === "room" && <HomeRoomRanking />}
```
**바꾸기:**
```tsx
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
      {tab === "channel" && (
        <HomeRoomRanking platforms={["youtube", "discord", "instagram", "facebook", "naver_band", "naver_cafe", "other"]} kind="channel" />
      )}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/platformLogo.tsx components/home-v6/HomeRoomRanking.tsx components/home-v6/HomeRankingTabs.tsx && git commit -m "feat(v7): 리딩방=텔레그램/카카오만 + '주식 관련 채널' 탭(유튜브·디스코드·인스타·페북) 분리 (STEP 204)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **리딩방** 탭 = 텔레그램·카카오만 (예시 유튜브·디스코드 사라짐)
- [ ] **주식 관련 채널** 탭 신설 = 유튜브·디스코드 등(예시 데이터가 여기로 이동)
- [ ] 채널 탭: 미인증이면 "신고 미확인" 라벨 없음(인증 시만 ✓), 경고 문구 가벼움
- [ ] hover 프리뷰·투표·로고는 두 탭 동일 동작
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 인스타/페북은 데이터에 생기면 로고 자동(logo.dev). 예시 데이터엔 아직 없어 채널 탭은 유튜브·디스코드만 보일 수 있음(정상).
- 한 테이블 platform 필터라 DB 변경 없음. 새 채널 추가 시 platform 값만 맞추면 자동 분류.
- **문서 TODO**(다음 갱신): STEP 200~204(리딩방·채널 분리 포함).
- 다음: 방/채널 실제 데이터 입력 · 추천 정렬 고도화 · 펀드 소스 · STEP 162 키.

---
> STEP 204 = 리딩방/채널 분리. 전제 STEP 203. 문서 묶어 갱신.
