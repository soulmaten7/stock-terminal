<!-- 2026-06-06 -->
# STEP 171 — 관심 레일 우측 세로 아이콘 탭 (토스식, 헤더 아래 풀하이트 유지)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_171_COMMAND.md 파일 내용대로 실행해줘`

## 목표
관심 레일 아이콘(알림/관심종목/보유종목/최근본)을 **위 가로줄 → 관심 박스 오른쪽 끝 세로 탭**으로 (토스의 내투자/관심/최근본/실시간 위치). 관심종목은 **헤더 아래 풀하이트 그대로 유지**. 접기 토글(`>>`)은 안 함.
- HomeRightRail: `[관심종목(왼쪽 flex-1) | 세로 아이콘 strip(오른쪽 w-12)]` 가로 배치
- 우측 컬럼 폭 `320 → 360px`(아이콘 strip 자리 확보)

## 전제 상태
- HEAD: `cc23d93`(STEP 170) 이상 (stale 캐시 정리 후 정상 화면 상태)
- 변경: `components/home-v6/HomeRightRail.tsx`(전체 교체) · `components/home-v6/HomeClientV6.tsx`(그리드 폭 1줄)

---

## 작업 1/2 — `components/home-v6/HomeRightRail.tsx` (파일 전체 교체)

```tsx
"use client";

import Link from "next/link";
import { Bell, Star, Briefcase, Clock } from "lucide-react";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";

export default function HomeRightRail() {
  const nav = [
    { icon: Bell, label: "알림", href: "/mypage" },
    { icon: Star, label: "관심", href: "/" },
    { icon: Briefcase, label: "보유", href: "/mypage" },
    { icon: Clock, label: "최근", href: "/" },
  ];
  return (
    <aside className="hidden lg:flex gap-3 sticky top-5 self-start h-[calc(100vh-6rem)]">
      {/* 관심종목 (왼쪽, 남은 폭 가득) — 추후 채팅 탭도 이 영역 */}
      <div className="flex-1 min-w-0">
        <WatchlistPanel />
      </div>

      {/* 오른쪽 끝 세로 아이콘 탭 (토스식) */}
      <nav
        className="flex flex-col items-center gap-5 shrink-0 w-12 bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft py-4"
        aria-label="우측 바로가기"
      >
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.label}
              href={n.href}
              title={n.label}
              className="flex flex-col items-center gap-1 text-unjong-muted hover:text-unjong-primary transition-colors"
            >
              <Icon size={18} />
              <span className="text-[9px]">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```
> 변경점: 세로 배치(아이콘 위 + 관심 아래) → **가로 배치(관심 왼쪽 + 아이콘 세로 strip 오른쪽 끝)**. 관심종목은 `flex-1`로 풀하이트 유지. 라벨은 짧게(알림/관심/보유/최근)로 w-12 안에 맞춤.

---

## 작업 2/2 — `components/home-v6/HomeClientV6.tsx` (우측 컬럼 폭 1줄)

**찾기:**
```tsx
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
```
**바꾸기:**
```tsx
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
```
> 관심종목(왼쪽) + 세로 아이콘 strip(오른쪽 48px) 둘 다 들어가게 360px 로.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeRightRail.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 관심 레일 우측 세로 아이콘 탭(토스식) — 알림/관심/보유/최근 far-right, 관심종목 풀하이트 유지 (STEP 171)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 관심 레일이 **[관심종목 | 오른쪽 끝 세로 아이콘(알림/관심/보유/최근)]** 으로 보이는지
- [ ] 관심종목이 헤더 아래 **풀하이트로 그대로** 내려오는지 (위치 변화 없음)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널에서 `pkill -9 -f "next dev"; pkill -9 -f next-server; cd ~/stock-terminal && rm -rf .next && npm run dev`

## 주의·예상 이슈
- 우측 컬럼 360px 중 아이콘 strip 48px + gap → 관심종목 폭 ~300px(정상).
- 세로 아이콘이 너무 붙으면 `gap-5` 숫자 조정.
- 접기 토글은 의도적으로 미구현(요청 제외).

---
> STEP 171 = 관심 레일 세로 아이콘 탭(#1 마무리). 전제 `cc23d93`. 다음: #3 랭킹 로고(레터아바타) · #2 hover 상세 · #4 카테고리 탭. 문서 묶어 갱신.
