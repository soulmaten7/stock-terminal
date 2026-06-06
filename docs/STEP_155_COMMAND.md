<!-- 2026-06-04 -->
# STEP 155 — 토스식 개편 1: 상단 네비 6탭 → 4탭

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_155_COMMAND.md 파일 내용대로 실행해줘`

## 목표
토스식 개편 1단계. 상단 메뉴를 **6탭 → 4탭**으로 단순화.
- **현재**: 홈 · 마켓 · 토론 · 뉴스 · 평가·검증 · MY (6)
- **변경**: 홈 · 마켓 · **토론·평가** · MY (4)
- **뉴스 탭 제거** (뉴스는 종목 안 + 홈 헤드라인으로 — 포털 아님)
- **평가·검증 → "토론·평가"로 통합** (탭에서 빼도 홈 검증·평가 모듈이 `/products`·`/rooms` 로 링크 → 안 숨겨짐)
> 전체 방향·분석: `docs/TOSS_ANALYSIS_AND_IA.md`

## 전제 상태
- HEAD: `01f2682` (STEP 154) — 빌드 ✓ / git clean
- 변경: `components/header/MainNav.tsx` 1개뿐. `/news`·`/products`·`/rooms` 라우트는 그대로 살아있음(탭에서만 제거).

## 사전 확인 (검증됨)
- `MainNav` 은 `MENU` 배열만 바꾸면 됨(렌더 JSX 동일). `MENU` 는 모듈 내부 const(외부 import 없음) → 안전.
- 새 "토론·평가" 탭은 `/discussion` 이동 + active 매칭에 `/products`·`/rooms`·`/reviews` 포함 → 평가 페이지에서도 하이라이트.
- `/news`·`/products`·`/rooms` 페이지는 라우트로 살아있어 URL·홈 링크로 접근 가능(깨지지 않음).

---

## 작업 1/1 — `components/header/MainNav.tsx` (파일 전체 교체)

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderSearch } from "./HeaderSearch";

// 토스식 상단 4탭 (운종). 뉴스는 종목 안+홈으로, 평가·검증은 토론·평가 탭으로 통합. 거래·코인 제외.
const MENU = [
  { href: "/", label: "홈", match: (p: string) => p === "/" },
  { href: "/market", label: "마켓", match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: "/discussion", label: "토론·평가", match: (p: string) => /^\/(discussion|product|room|reviews)/.test(p) },
  { href: "/mypage", label: "MY", match: (p: string) => p.startsWith("/mypage") },
] as const;

export function MainNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="flex items-center gap-4 border-b border-unjong-border bg-unjong-background px-4"
      aria-label="메인 네비"
    >
      {/* 좌측: 토스식 4탭 (active = 하단 굵은 밑줄) */}
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

> 변경점: `MENU` 6개 → 4개 (뉴스 제거, 평가·검증을 "토론·평가"로 통합) + 주석. 나머지(렌더 JSX·검색)는 동일.

---

## 작업 2/2 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add components/header/MainNav.tsx && git commit -m "feat(v7): 토스식 개편 1 — 상단 네비 6탭→4탭 (홈·마켓·토론평가·MY, 뉴스 탭 제거·평가검증 통합) (STEP 155)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (확인) `npm run dev` → 상단 메뉴 4개(홈·마켓·토론·평가·MY)로 줄었는지, /products·/rooms 가도 "토론·평가" 하이라이트

## 주의·예상 이슈
- `/news`·`/products`·`/rooms` 라우트는 살아있음(탭에서만 제거) → 404 안 남. 상품·리딩방은 홈 검증·평가 모듈로 여전히 접근.
- 새 탭 "토론·평가"는 `/discussion` 이동 — 현재 /discussion 은 토론만 보임. 평가 콘텐츠를 /discussion 에 합치는 건 다음 STEP(토론·평가 통합 페이지).
- 미사용 import 0(Link·usePathname·HeaderSearch만).

---
> STEP 155 = 토스식 개편 1(네비 4탭). 전제 `01f2682` → 커밋 후 다음: ② 홈=검증 대상 디렉토리 · ③ 토론·평가 통합 페이지 · ④ 티커 하단 얇은 스트립(우리 데이터). 문서·STEP 154 문서는 묶어서 갱신.
