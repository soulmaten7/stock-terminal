<!-- 2026-06-04 -->
# STEP 151 — 네비게이션 네이버식 재편 + 토론·뉴스 페이지 shell (뼈대)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_151_COMMAND.md 파일 내용대로 실행해줘`

## 목표
운종 상단 메뉴를 **네이버 증권식 6메뉴** [홈 · 마켓 · 토론 · 뉴스 · 평가·검증 · MY]로 재편하고,
독립 라우트가 없던 **토론·뉴스** 페이지를 **shell(껍데기)** 로 신설 → 메뉴로 모든 섹션이 네비 가능한 **뼈대** 완성.
(전체 계획·spec: `docs/SITE_MAP_V7.md`. 페이지 내부 콘텐츠는 STEP 152~에서 네이버처럼 채움.)

## 전제 상태 (이 커밋 위에서 작업)
- HEAD: `acdc313` (STEP 150 보완 — 브리핑 runtime/dynamic)
- 빌드: ✓ / 브랜치: `main`
- 변경: 파일 1개 수정 + 2개 신규.

## 사전 확인 (코드 구조 — 이미 검증됨)
- `app/layout.tsx` 가 `<Header/> <TickerBar/> <MainNav/> <Footer/>` 를 **전역**으로 렌더 → 새 페이지는 메뉴·헤더 자동 상속.
- 메뉴 컴포넌트 = `components/header/MainNav.tsx`.
- 재사용 모듈: `HotDiscussionsModule`·`MarketNewsModule` 둘 다 `components/home-v5/`, `export default`, `"use client"`, 자체 데이터 fetch (그대로 꽂으면 동작).

---

## 작업 1/3 — 메뉴 재편: `components/header/MainNav.tsx` (파일 전체 교체)

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderSearch } from "./HeaderSearch";

// 네이버 증권식 상단 6메뉴 (운종). 코인·거래 제외, 평가·검증 = 운종 차별점.
const MENU = [
  { href: "/", label: "홈", match: (p: string) => p === "/" },
  { href: "/kr", label: "마켓", match: (p: string) => /^\/(kr|us|market|stock)/.test(p) },
  { href: "/discussion", label: "토론", match: (p: string) => p.startsWith("/discussion") },
  { href: "/news", label: "뉴스", match: (p: string) => p.startsWith("/news") },
  { href: "/products", label: "평가·검증", match: (p: string) => /^\/(product|room|reviews)/.test(p) },
  { href: "/mypage", label: "MY", match: (p: string) => p.startsWith("/mypage") },
] as const;

export function MainNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="flex items-center gap-4 border-b border-unjong-border bg-unjong-background px-4"
      aria-label="메인 네비"
    >
      {/* 좌측: 네이버식 6메뉴 (active = 하단 굵은 밑줄) */}
      <div className="flex items-center shrink-0">
        {MENU.map((m) => {
          const isActive = m.match(pathname);
          return (
            <Link
              key={m.label}
              href={m.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "px-3 py-3 text-sm font-bold text-unjong-primary border-b-2 border-unjong-primary -mb-px transition-colors"
                  : "px-3 py-3 text-sm font-medium text-unjong-muted hover:text-unjong-primary border-b-2 border-transparent -mb-px transition-colors"
              }
            >
              {m.label}
            </Link>
          );
        })}
      </div>

      {/* 우측: 검색 (남은 폭 채움) */}
      <div className="flex-1 min-w-0 py-1.5">
        <HeaderSearch />
      </div>
    </nav>
  );
}
```

> 변경점: 기존 [한국주식·미국주식] + [상품·리딩방·캘린더] → 네이버식 6메뉴. `CalendarDays·Award` 아이콘 import 제거(미사용 → ESLint 빌드 에러 방지). `/calendar` 라우트는 유지되며 메뉴에서만 빠짐(추후 마켓>시장지표로 흡수 검토).

---

## 작업 2/3 — 토론 shell 신규: `app/discussion/page.tsx` (신규 파일)

```tsx
import type { Metadata } from "next";
import HotDiscussionsModule from "@/components/home-v5/HotDiscussionsModule";

export const metadata: Metadata = { title: "토론" };

export default function DiscussionPage() {
  return (
    <div className="max-w-[1480px] mx-auto px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">토론</h1>
        <p className="mt-1 text-sm text-unjong-muted">
          종목 토론을 한곳에서 — 솔직한 의견과 검증된 정보. (오늘의 추천·업종/테마별 토론은 순차 확장 예정)
        </p>
      </header>
      <HotDiscussionsModule />
    </div>
  );
}
```

---

## 작업 3/3 — 뉴스 shell 신규: `app/news/page.tsx` (신규 파일)

```tsx
import type { Metadata } from "next";
import MarketNewsModule from "@/components/home-v5/MarketNewsModule";

export const metadata: Metadata = { title: "뉴스" };

export default function NewsPage() {
  return (
    <div className="max-w-[1480px] mx-auto px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">뉴스</h1>
        <p className="mt-1 text-sm text-unjong-muted">
          시장 헤드라인 — 한경·매경·머니투데이·이데일리·연합. (속보·많이 본·토픽·리서치는 순차 확장 예정)
        </p>
      </header>
      <MarketNewsModule />
    </div>
  );
}
```

---

## 작업 4/4 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add components/header/MainNav.tsx app/discussion/page.tsx app/news/page.tsx && git commit -m "feat(v7): 네이버식 상단 6메뉴 재편(홈·마켓·토론·뉴스·평가검증·MY) + 토론·뉴스 페이지 shell 신설 (STEP 151)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (확인) `npm run dev` → 상단 메뉴 6개 보이고, `/discussion`·`/news` 클릭 시 페이지 뜨는지 (active 탭 밑줄도)

## 주의·예상 이슈
- 새 페이지는 전역 layout 으로 헤더·메뉴·푸터 자동 상속 → 별도 작업 불필요.
- `HotDiscussionsModule`·`MarketNewsModule` 은 `export default` 검증 완료 → import 정확.
- 새 MainNav 는 `Link`·`usePathname`·`HeaderSearch` 만 사용(미사용 import 0) → ESLint 안전.
- 토론 페이지는 토론글 0건이면 STEP 149 의 "종목 보러 가기" CTA 가 그대로 보임(정상).
- `/calendar` 는 라우트 살아있음(메뉴에서만 제거) — 깨지지 않음.

---
> STEP 151 = SITE_MAP_V7 "뼈대" 단계. 전제 `acdc313` → 이 STEP 코드 커밋 후 다음 STEP(마켓 페이지)부터 페이지 내부를 네이버처럼 채움. 문서 갱신은 묶어서 별도 docs 커밋.
