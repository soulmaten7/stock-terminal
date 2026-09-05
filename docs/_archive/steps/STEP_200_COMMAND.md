<!-- 2026-06-07 -->
# STEP 200 — 리딩방 탭 ① 랭킹 (금감원 인증 위 + 토론 활동 순)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_200_COMMAND.md 파일 내용대로 실행해줘`

## 목표
랭킹 탭에 **'리딩방'** 추가(투자상품 오른쪽) → 리딩방 랭킹.
- 정렬: **`is_certified`(금감원 신고 확인) 위 → 토론수 → 조회수** (기존 `leading_rooms` 데이터, DB 변경 0)
- 각 행: 순위·이름·**인증 뱃지(금감원 신고 ✓)/주의 라벨(신고 미확인)**·플랫폼·운영자·가격·토론/조회 수 → `/room/{id}`
- **운종 정체성 경고 유지**: "운종은 리딩방을 평가하지 않음 · 금감원 신고여부(사실)+사용자 토론만 · 허위·작전 많음"
- 운종 신규라 적으면 빈상태 CTA(가짜 X)

## 정직 메모 (중요)
- **"추천/좋아요" 컬럼이 `leading_rooms`에 아직 없음** → v1은 인증+토론·조회 활동 순. 사용자가 원한 "추천 버튼 순위"는 **DB 컬럼 추가 별도 STEP**(나중). 가짜 추천수 X.
- 광고/스폰서 슬롯 없음(설계 0 — 사용자 지시 시에만).

## 전제 상태
- HEAD: STEP 199 + 문서 커밋 상태
- 변경: `components/home-v6/HomeRoomRanking.tsx`(신규) + `components/home-v6/HomeRankingTabs.tsx`(탭 추가)
- 참고: `leading_rooms` = id, platform, name, operator, pricing, category[], is_certified, discussion_count, view_count, hidden

---

## 작업 1/2 — 신규 `components/home-v6/HomeRoomRanking.tsx` (파일 생성)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ShieldCheck, AlertTriangle, MessageCircle, Eye } from "lucide-react";
import { LoadingState } from "@/components/ui/State";

type Room = {
  id: string;
  platform: string;
  name: string;
  operator: string | null;
  pricing: string | null;
  is_certified: boolean;
  discussion_count: number;
  view_count: number;
};

const PLATFORM_LABEL: Record<string, string> = {
  telegram: "텔레그램",
  kakao: "카카오",
  discord: "디스코드",
  naver_band: "네이버밴드",
  naver_cafe: "네이버카페",
  youtube: "유튜브",
  other: "기타",
};

export default function HomeRoomRanking() {
  const [items, setItems] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("leading_rooms")
          .select("id, platform, name, operator, pricing, is_certified, discussion_count, view_count")
          .eq("hidden", false)
          .order("is_certified", { ascending: false })
          .order("discussion_count", { ascending: false })
          .order("view_count", { ascending: false })
          .limit(10);
        if (!cancelled) setItems((data as Room[]) ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 운종 정체성 경고 — 평가 X, 사실·토론만 */}
      <div className="flex items-start gap-2 border-b border-unjong-border bg-amber-50 px-4 py-2.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-relaxed text-amber-800">
          운종은 리딩방을 <b>평가하지 않아요</b>. 금감원 신고 여부(사실)와 사용자 토론만 보여줘요. 허위·작전·과장이 많으니 가입·결제 전 충분히 확인하세요.
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
        <ul className="divide-y divide-unjong-border">
          {items.map((r, i) => (
            <li key={r.id}>
              <Link href={`/room/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-unjong-background">
                <span className="w-4 shrink-0 text-center text-sm font-bold tabular-nums text-unjong-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-unjong-primary">{r.name}</span>
                    {r.is_certified ? (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <ShieldCheck size={10} /> 금감원 신고 ✓
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-unjong-background px-1.5 py-0.5 text-[10px] text-unjong-muted">신고 미확인</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-unjong-muted">
                    {PLATFORM_LABEL[r.platform] ?? "기타"} · {r.operator || "운영자 미상"} · {r.pricing || "가격 미상"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5 text-[11px] text-unjong-muted">
                  <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {r.discussion_count}</span>
                  <span className="flex items-center gap-0.5"><Eye size={11} /> {r.view_count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

## 작업 2/2 — `components/home-v6/HomeRankingTabs.tsx` (탭 추가)

**찾기:**
```tsx
import HomeEtfRanking from "./HomeEtfRanking";
```
**바꾸기:**
```tsx
import HomeEtfRanking from "./HomeEtfRanking";
import HomeRoomRanking from "./HomeRoomRanking";
```

**찾기:**
```tsx
  { key: "etf", label: "투자상품" },
] as const;
```
**바꾸기:**
```tsx
  { key: "etf", label: "투자상품" },
  { key: "room", label: "리딩방" },
] as const;
```

**찾기:**
```tsx
      {tab === "etf" && <HomeEtfRanking />}
```
**바꾸기:**
```tsx
      {tab === "etf" && <HomeEtfRanking />}
      {tab === "room" && <HomeRoomRanking />}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeRoomRanking.tsx components/home-v6/HomeRankingTabs.tsx && git commit -m "feat(v7): 리딩방 탭 — 랭킹(금감원 인증 위 + 토론 활동 순, 운종 평가 X 경고) (STEP 200)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 랭킹 탭 맨 오른쪽 **'리딩방'** 추가, 클릭 시 랭킹 + 상단 경고 배너
- [ ] **금감원 신고 ✓ 인증 방이 위**, 그 다음 토론·조회 순
- [ ] 미인증 방은 "신고 미확인" 회색 라벨
- [ ] 행 클릭 → `/room/{id}` 이동, 빈 데이터면 "리딩방 디렉토리 보기" CTA
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 운종 신규라 `leading_rooms` 적으면 빈상태/소수 — 정상.
- **추천/좋아요 순위는 다음**(leading_rooms에 recommend 컬럼 + 방 상세에 버튼 추가하는 DB STEP). 지금은 인증+활동 순.
- 인증 기준 = `is_certified`(fss_advisors 대조, `/api/rooms/[id]/verify`). 신고 건수/주의 신호 더 세분화는 추후 컬럼 추가 시.
- **문서 TODO**(다음 갱신): STEP 200 + 리딩방 추천버튼/DB 후속.

---
> STEP 200 = 리딩방 탭 ① 랭킹. 전제 STEP 199. 다음: 리딩방 추천버튼(DB) · 펀드 소스 · STEP 162 키. 문서 묶어 갱신.
