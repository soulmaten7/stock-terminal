<!-- 2026-05-27 -->
# STEP 90 — 헤더 고정 영역 (운종 로고 + 검색 + 글로벌 티커 + 3창 카드 박스)

> **목표**: 운종 3창 공통 헤더의 실제 컴포넌트화. 시각적으로 운종 헤더가 완성된 것처럼 보이게.
> **세션**: #25
> **전제**: STEP 89 완료 (`e8bc870`), 3창 라우트 골격 + Layout placeholder 작동 중
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 5-1 (상단 헤더)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에 다음 한 줄 입력:

```
@docs/STEP_90_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **UI 완성, 데이터·기능은 placeholder/더미** — Layer 1 에서 실데이터 연결
2. **클라이언트 컴포넌트로 분리** — `usePathname()` 활용 (활성 창 강조)
3. **기존 V3 GlobalIndicesWidget 재활용 가능하면 활용**, 어려우면 더미 정적 표시
4. **shadcn/ui 또는 lucide-react** 아이콘 활용 — 이미 프로젝트에 있다면

---

## 작업 1 — 컴포넌트 폴더 구조 신설

```bash
mkdir -p components/header
```

생성할 파일:
- `components/header/UnjongLogo.tsx`
- `components/header/UnjongSearch.tsx`
- `components/header/GlobalTickerBar.tsx`
- `components/header/WindowSwitcher.tsx`
- `components/header/UnjongHeader.tsx` (통합 헤더)

---

## 작업 2 — `components/header/UnjongLogo.tsx`

```tsx
import Link from "next/link";

export function UnjongLogo() {
  return (
    <Link
      href="/scalper"
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <span className="text-2xl font-bold text-unjong-primary leading-none">
        雲從
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-[10px] tracking-widest text-unjong-muted font-medium">
          UNJONG
        </span>
        <span className="text-[9px] text-unjong-muted">운종</span>
      </div>
    </Link>
  );
}
```

⚠️ `text-unjong-primary`, `text-unjong-muted` 클래스가 작동 안 하면:
- `text-slate-900`, `text-slate-500` 같은 표준 Tailwind 로 폴백
- 또는 인라인 스타일 `style={{ color: 'var(--color-unjong-primary)' }}` 사용
- STEP 88 에서 색상 토큰이 어떻게 정의됐는지 `app/globals.css` 확인 필수

---

## 작업 3 — `components/header/UnjongSearch.tsx`

```tsx
"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export function UnjongSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="relative flex-1 max-w-xl">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="종목·뉴스·공시 통합 검색  ·  Layer 5 에서 활성화"
        className="w-full rounded-md border border-unjong-border bg-unjong-background py-1.5 pl-9 pr-3 text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none focus:border-unjong-accent transition-colors"
        aria-label="운종 통합 검색"
      />
    </div>
  );
}
```

⚠️ `lucide-react` 가 설치되어 있는지 확인. 없으면 `react-icons` 또는 단순 텍스트 아이콘으로 폴백.

검색 기능 자체는 Layer 5 에서 구현. 이 STEP 은 UI 만.

---

## 작업 4 — `components/header/GlobalTickerBar.tsx`

```tsx
"use client";

/**
 * 글로벌 지수 티커 바 — 헤더 우측 상단
 *
 * Layer 0: 정적 더미 데이터로 시각화
 * Layer 1: KIS API / Yahoo Finance 실시간 연결
 */
const DUMMY_TICKERS = [
  { label: "KOSPI", value: "2,634.21", change: "+0.42%", trend: "up" },
  { label: "KOSDAQ", value: "847.55", change: "-0.18%", trend: "down" },
  { label: "S&P", value: "5,234.12", change: "+0.87%", trend: "up" },
  { label: "NASDAQ", value: "16,891.50", change: "+1.12%", trend: "up" },
  { label: "USD/KRW", value: "1,387.50", change: "-0.05%", trend: "down" },
];

export function GlobalTickerBar() {
  return (
    <div className="flex items-center gap-4 text-xs">
      {DUMMY_TICKERS.map((t) => (
        <div key={t.label} className="flex items-center gap-1.5">
          <span className="font-medium text-unjong-muted">{t.label}</span>
          <span className="font-semibold text-unjong-primary">{t.value}</span>
          <span
            className={
              t.trend === "up"
                ? "text-unjong-success"
                : "text-unjong-danger"
            }
          >
            {t.change}
          </span>
        </div>
      ))}
      <span className="text-[10px] text-unjong-muted ml-2">
        (Layer 1 실시간 연결 예정)
      </span>
    </div>
  );
}
```

⚠️ `text-unjong-success`, `text-unjong-danger` 클래스가 작동 안 하면 `text-emerald-600`, `text-red-600` 으로 폴백.

---

## 작업 5 — `components/header/WindowSwitcher.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 3창 카드 박스 — 현재 활성 창 시각 강조
 */
const WINDOWS = [
  { href: "/scalper", label: "단타창", time: "09:00~15:30", emoji: "⚡" },
  { href: "/longterm", label: "장타창", time: "저녁·주말", emoji: "🌳" },
  { href: "/us", label: "미국주식창", time: "22:30~05:00", emoji: "🌙" },
] as const;

export function WindowSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2" aria-label="3창 전환">
      {WINDOWS.map((w) => {
        const isActive = pathname?.startsWith(w.href);
        return (
          <Link
            key={w.href}
            href={w.href}
            className={
              isActive
                ? "flex items-center gap-1.5 rounded-md border-2 border-unjong-accent bg-unjong-surface px-4 py-1.5 text-sm font-semibold text-unjong-primary shadow-sm"
                : "flex items-center gap-1.5 rounded-md border-2 border-transparent px-4 py-1.5 text-sm font-medium text-unjong-muted hover:bg-unjong-background hover:text-unjong-primary transition-colors"
            }
            aria-current={isActive ? "page" : undefined}
          >
            <span aria-hidden>{w.emoji}</span>
            <span>{w.label}</span>
            <span className="hidden lg:inline text-[10px] text-unjong-muted ml-1">
              {w.time}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
```

활성 창은 **금색 테두리 (unjong-accent)** + 굵은 텍스트 + 카드 배경.
비활성은 회색 텍스트 + hover 시 강조.

---

## 작업 6 — `components/header/UnjongHeader.tsx` (통합)

```tsx
import { Bell, User } from "lucide-react";
import { UnjongLogo } from "./UnjongLogo";
import { UnjongSearch } from "./UnjongSearch";
import { GlobalTickerBar } from "./GlobalTickerBar";
import { WindowSwitcher } from "./WindowSwitcher";

/**
 * 운종 3창 공통 헤더
 *
 * 구조 (2단):
 * - 상단: 로고 · 검색창 · 글로벌 티커 · 알림 · 프로필
 * - 하단: 3창 카드 박스 (단타/장타/미국주식)
 */
export function UnjongHeader() {
  return (
    <header className="border-b border-unjong-border bg-unjong-surface sticky top-0 z-50">
      {/* 상단 영역 */}
      <div className="flex h-14 items-center gap-4 px-4">
        <UnjongLogo />
        <div className="h-6 w-px bg-unjong-border" />
        <UnjongSearch />
        <div className="hidden md:block flex-shrink-0">
          <GlobalTickerBar />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="rounded-full p-1.5 text-unjong-muted hover:bg-unjong-background hover:text-unjong-primary transition-colors"
            aria-label="알림"
            title="알림 (Layer 1)"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 text-unjong-muted hover:bg-unjong-background hover:text-unjong-primary transition-colors"
            aria-label="프로필"
            title="프로필 (Layer 1)"
          >
            <User size={18} />
          </button>
        </div>
      </div>

      {/* 하단 — 3창 카드 박스 */}
      <div className="flex items-center px-4 py-2 border-t border-unjong-border bg-unjong-background">
        <WindowSwitcher />
      </div>
    </header>
  );
}
```

---

## 작업 7 — `app/(windows)/layout.tsx` 헤더 교체

기존 STEP 89 의 placeholder 헤더를 새 `UnjongHeader` 로 교체.

**기존 (STEP 89)**:
```tsx
<header className="border-b border-unjong-border bg-unjong-surface">
  <div className="flex h-14 items-center px-4 gap-4">
    <div className="text-xl font-bold text-unjong-primary">雲從</div>
    {/* ... placeholder ... */}
  </div>
  <nav className="flex h-12 items-center gap-2 px-4 border-t border-unjong-border">
    {/* ... 단타창/장타창/미국주식창 Link ... */}
  </nav>
</header>
```

**변경 후**:
```tsx
import { UnjongHeader } from "@/components/header/UnjongHeader";

// ...
return (
  <div className="flex h-screen flex-col bg-unjong-background">
    <UnjongHeader />
    {/* 본문 (좌측 + 메인 + 우측) — 기존 그대로 */}
    <div className="flex flex-1 overflow-hidden">
      {/* aside 좌측, main, aside 우측 — STEP 89 placeholder 그대로 */}
    </div>
  </div>
);
```

`Link` import 와 placeholder 헤더 마크업 제거. `import { UnjongHeader }` 만 추가.

---

## 작업 8 — lucide-react 설치 확인

```bash
cd ~/stock-terminal
npm ls lucide-react
```

만약 설치 안 되어 있으면:
```bash
npm install lucide-react
```

`package.json` 에 추가되면 git add 에 포함.

---

## 작업 9 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

**확인 사항**:
- 빌드 성공
- TypeScript 오류 0
- 3개 라우트 (`/scalper` `/longterm` `/us`) 그대로 빌드됨
- 새 컴포넌트 5개 (`components/header/*.tsx`) 정상 컴파일

빌드 실패 시:
- `text-unjong-*` 클래스 작동 여부 먼저 확인
- 색상 클래스 작동 안 하면 표준 Tailwind 로 폴백 (예: `text-slate-900`, `text-slate-500`, `border-slate-200`, `bg-white`, `bg-slate-50`, `text-emerald-600`, `text-red-600`)
- 폴백 적용 후 다시 빌드

---

## 작업 10 — git commit + push

빌드 성공 확인 후:

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/header
git add "app/(windows)/layout.tsx"
git add docs/STEP_90_COMMAND.md
git add package.json package-lock.json  # lucide-react 설치 시
git status
git commit -m "feat: STEP 90 - 운종 헤더 고정 영역 완성

- components/header/UnjongLogo.tsx — 雲從 한자 + UNJONG 영문 병기
- components/header/UnjongSearch.tsx — 통합 검색창 UI (Layer 5 활성)
- components/header/GlobalTickerBar.tsx — KOSPI/KOSDAQ/S&P/Nasdaq/USD-KRW (Layer 1 실시간 연결)
- components/header/WindowSwitcher.tsx — 3창 카드 박스 (활성 강조, usePathname)
- components/header/UnjongHeader.tsx — 2단 통합 헤더 (sticky top)
- app/(windows)/layout.tsx — UnjongHeader 적용, placeholder 제거
- 다음 STEP 91: 좌측 사이드 (채팅+관심종목)"
git push
```

---

## 검증 체크리스트

작업 끝나면 다음 항목 확인:

- [ ] `components/header/` 폴더 + 5개 컴포넌트 파일 존재
- [ ] `lucide-react` 패키지 설치 확인
- [ ] `app/(windows)/layout.tsx` 에 `UnjongHeader` import + 사용
- [ ] 기존 placeholder 헤더 마크업 제거됨
- [ ] `npm run build` 성공
- [ ] git commit + push 완료
- [ ] 색상 클래스 (`text-unjong-*`, `bg-unjong-*`) 폴백 적용 여부 보고

---

## 완료 보고 (Claude Code → 사용자)

작업 끝나면 사용자에게:
```
STEP 90 완료. 운종 헤더 고정 영역 끝.
- UnjongLogo + UnjongSearch + GlobalTickerBar + WindowSwitcher + UnjongHeader (5개 컴포넌트)
- (windows)/layout.tsx 의 placeholder 헤더 → UnjongHeader 로 교체
- WindowSwitcher 는 usePathname 으로 현재 활성 창 금색 테두리 강조
- 검색·티커는 UI 만, 실데이터·기능은 Layer 1·5 에서 연결
- 빌드 클린, git push 완료 (커밋 [해시])
- 색상 클래스 폴백 여부: [yes/no, 폴백한 경우 어떤 클래스로 대체했는지]

다음 STEP 91 (좌측 사이드 — 채팅+관심종목) 명령서 받을 준비 됨.

브라우저에서 확인:
  http://localhost:3333/scalper → 단타창 강조
  http://localhost:3333/longterm → 장타창 강조
  http://localhost:3333/us → 미국주식창 강조
  - 좌측 사이드는 아직 placeholder (STEP 91 예정)
  - 우측 사이드패널도 placeholder (STEP 93 예정)
```

---

## ⚠️ 주의 사항

1. **데이터·기능은 placeholder/더미** — 글로벌 티커 실데이터, 검색 기능, 알림, 프로필 모두 후속 Layer
2. **컴포넌트 분리 엄격히** — 한 파일에 다 몰아넣지 말고 5개 파일로 분리 (재사용성·테스트 용이)
3. **클라이언트 컴포넌트** — `usePathname()` 쓰는 것은 `"use client"` 필수
4. **색상 폴백 시 반드시 보고** — 어떤 클래스로 대체했는지 알아야 다음 STEP 에서 일관성 유지
5. **헤더 sticky** — `sticky top-0 z-50` 으로 스크롤 시 고정
6. **모바일 대응 일부** — 글로벌 티커는 md 이상에서만 표시 (`hidden md:block`)
7. **console.log 남기지 말 것** — CLAUDE.md 규칙
8. **빌드 깨지면 즉시 멈추고 Cowork 에게 보고** — 강제 진행 금지
