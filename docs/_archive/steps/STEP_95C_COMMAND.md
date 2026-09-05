<!-- 2026-05-27 -->
# STEP 95-C — 헤더 통합 (V3 골격 + 운종 브랜드) + 컨텍스트 네비

> **목표**: V3 헤더 골격을 운종 브랜드로 통합. 4단 컨텍스트 네비 신설 (창별 자동 변경). 두 번째 운종 헤더 완전 제거.
> **세션**: #25
> **전제**: 9b1676f (STEP 95-A revert) + c0bbff0 (STEP 96 단타창 7개) 상태
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` + 사용자 결정 사항 (Bloomberg Terminal 컨텍스트 탭 패턴)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_95C_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **V3 헤더 골격(LayoutShell·TickerBar·Footer)은 유지**, 운종 브랜드로 통합
2. **두 번째 운종 헤더 (`UnjongHeader`) 완전 제거** — 1단으로 통합되므로
3. **V3 옛 네비 16개 → 새 메인 네비** (3창 + 스크리너 + 캘린더) 로 교체
4. **4단 컨텍스트 네비 신설** — 창별 카드 7개 메뉴 자동 변경 + 앵커 점프 + 금색 깜박임
5. **카드 컴포넌트에 id prop 추가** — 앵커 점프 작동 가능
6. **빌드 깨지면 즉시 멈추고 보고** — 작업 범위 큼

---

## 작업 1 — V3 헤더 컴포넌트 위치 진단

```bash
cd ~/stock-terminal

# V3 헤더 관련 컴포넌트 위치
grep -rn "Header\|TickerBar\|TopNav\|LayoutShell" --include="*.tsx" --include="*.ts" components 2>/dev/null | head -20
ls components/ 2>/dev/null

# root layout 의 import
cat app/layout.tsx | head -50

# UnjongHeader 위치
ls components/header/ 2>/dev/null
```

확인할 것:
- V3 Header 컴포넌트 파일 (이름·경로)
- TickerBar 컴포넌트 (글로벌 티커)
- TopNav 컴포넌트 (16개 옛 네비)
- LayoutShell wrapper (있다면)
- root layout 에 어떻게 import 되는지

⚠️ 이름이 다를 수 있음. grep 결과 우선.

---

## 작업 2 — V3 Header 컴포넌트 수정

### 2-1. "STOCK TERMINAL" → "UNJONG 운종"

V3 Header 컴포넌트 안에서 브랜드 표시 부분 찾아 교체:

```tsx
// 기존
<div>STOCK TERMINAL</div>

// 변경 후
<div className="flex items-center gap-1.5">
  <span className="text-lg font-bold tracking-wider text-unjong-primary">
    UNJONG
  </span>
  <span className="text-sm text-unjong-muted">운종</span>
</div>
```

⚠️ 한자 `雲從` 사용 X. 영문 `UNJONG` + 한글 `운종` 만.

### 2-2. 검색 아이콘 → 큰 통합 검색박스

기존 작은 돋보기 아이콘을 제거하고 `UnjongSearch` 컴포넌트의 디자인으로 교체:

```tsx
// 기존 (V3)
<button className="search-icon"><Search /></button>

// 변경 후 — 운종 통합 검색박스
<div className="relative flex-1 max-w-2xl mx-4">
  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
  <input
    type="text"
    placeholder="종목·뉴스·공시 통합 검색  ·  Layer 5 에서 활성화"
    className="w-full rounded-md border border-unjong-border bg-unjong-background py-1.5 pl-9 pr-3 text-sm placeholder:text-unjong-muted focus:outline-none focus:border-unjong-accent"
  />
</div>
```

위치는 로고와 우측 아이콘들 사이 가운데. flex-1 로 가용 공간 차지.

기존 운종 헤더의 `UnjongSearch.tsx` 컴포넌트를 그대로 import 해서 사용해도 OK.

---

## 작업 3 — TickerBar 통합 (V3 + 운종)

V3 TickerBar 에 운종 글로벌 티커 추가. 중복 항목은 1개만.

기존 V3 더미: USD/KRW, WTI, GOLD, BTC, ETH
기존 운종 더미: KOSPI, KOSDAQ, S&P, NASDAQ, USD/KRW

통합 후 — V3 TickerBar 의 데이터 배열에 추가:

```tsx
const TICKERS = [
  // 기존 V3
  { label: "USD/KRW", value: "1,503.73", change: "+0.20%" },
  { label: "WTI", value: "90.48", change: "+1.21%" },
  { label: "GOLD", value: "4,452.42", change: "-0.06%" },
  { label: "BTC", value: "74,343", change: "+0.18%" },
  { label: "ETH", value: "2,xxx", change: "..." },
  // 운종 추가
  { label: "KOSPI", value: "2,634.21", change: "+0.42%" },
  { label: "KOSDAQ", value: "847.55", change: "-0.18%" },
  { label: "S&P", value: "5,234.12", change: "+0.87%" },
  { label: "NASDAQ", value: "16,891.50", change: "+1.12%" },
];
```

⚠️ 실제 V3 TickerBar 의 데이터 구조에 맞게 조정. 더미 값은 그럴듯하게.

---

## 작업 4 — V3 옛 네비 16개 → 새 메인 네비

### 4-1. V3 TopNav 컴포넌트 (또는 그 위치)

기존 16개 네비 (관심종목·종목발굴·차트·호가창·체결창·급락·거래·수급·글로벌지수·섹터지도·테마주·뉴스속보·공시·경제캘린더·장전브리핑·참고사이트) 를 **모두 제거** + 새 메인 네비로 교체.

### 4-2. 새 메인 네비 디자인

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Calendar } from "lucide-react";

const PRIMARY_WINDOWS = [
  { href: "/scalper", label: "단타창", emoji: "⚡" },
  { href: "/longterm", label: "장타창", emoji: "🌳" },
  { href: "/us", label: "미국주식창", emoji: "🌙" },
] as const;

const SECONDARY_LINKS = [
  { href: "/screener", label: "스크리너", icon: Search },
  { href: "/calendar", label: "캘린더", icon: Calendar },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b border-unjong-border bg-unjong-background px-4 py-2" aria-label="메인 네비">
      {/* 좌측: 운종 3창 박스 */}
      <div className="flex items-center gap-2">
        {PRIMARY_WINDOWS.map((w) => {
          const isActive = pathname?.startsWith(w.href);
          return (
            <Link
              key={w.href}
              href={w.href}
              className={
                isActive
                  ? "flex items-center gap-1 rounded-md border-2 border-unjong-accent bg-unjong-surface px-3 py-1 text-sm font-semibold text-unjong-primary shadow-sm"
                  : "flex items-center gap-1 rounded-md border-2 border-transparent px-3 py-1 text-sm font-medium text-unjong-muted hover:bg-unjong-surface hover:text-unjong-primary"
              }
              aria-current={isActive ? "page" : undefined}
            >
              <span aria-hidden>{w.emoji}</span>
              <span>{w.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 우측: 보조 링크 */}
      <div className="flex items-center gap-3">
        {SECONDARY_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary"
          >
            <Icon size={14} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

⚠️ 운종 3창 박스에서 **시간대 텍스트 (09:00~15:30, 저녁·주말, 22:30~05:00) 완전 제거**. 사용자 요청.

### 4-3. 새 메인 네비를 root layout 또는 LayoutShell 에 배치

V3 TopNav 가 있던 자리에 `<MainNav />` 배치. 

`components/header/MainNav.tsx` 신규 생성.

---

## 작업 5 — 4단 컨텍스트 네비 신설

### 5-1. `components/header/ContextNav.tsx` 신설

```tsx
"use client";

import { usePathname } from "next/navigation";

type ContextMenu = {
  id: string;
  label: string;
  emoji: string;
};

const CONTEXT_MENUS: Record<string, ContextMenu[]> = {
  "/scalper": [
    { id: "card-movers", label: "Movers", emoji: "🚀" },
    { id: "card-volume", label: "Volume", emoji: "🔥" },
    { id: "card-vi", label: "VI", emoji: "🚨" },
    { id: "card-netbuy", label: "NetBuy", emoji: "💰" },
    { id: "card-disclosure", label: "공시", emoji: "📄" },
    { id: "card-theme", label: "테마", emoji: "🎯" },
    { id: "card-short", label: "공매도", emoji: "⚠️" },
  ],
  "/longterm": [
    { id: "card-disclosure", label: "공시", emoji: "📊" },
    { id: "card-earnings", label: "분기실적", emoji: "📅" },
    { id: "card-value", label: "저평가", emoji: "💎" },
    { id: "card-dividend", label: "배당TOP", emoji: "💰" },
    { id: "card-lows", label: "52주신저가", emoji: "📉" },
    { id: "card-sector", label: "섹터", emoji: "🗺️" },
    { id: "card-warning", label: "관리종목", emoji: "⚠️" },
  ],
  "/us": [
    { id: "card-indices", label: "지수+VIX", emoji: "🌐" },
    { id: "card-prepost", label: "Pre/After", emoji: "🌅" },
    { id: "card-m7", label: "M7", emoji: "⭐" },
    { id: "card-movers", label: "Movers", emoji: "🇺🇸" },
    { id: "card-forex", label: "환율+시계", emoji: "💱" },
    { id: "card-news", label: "뉴스+8K", emoji: "📰" },
    { id: "card-fomc", label: "FOMC", emoji: "📅" },
  ],
};

export function ContextNav() {
  const pathname = usePathname();
  const menus = pathname ? CONTEXT_MENUS[pathname] : undefined;

  if (!menus || menus.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // 금색 강조 깜박임 (1.5초)
    el.classList.add("unjong-card-highlight");
    setTimeout(() => el.classList.remove("unjong-card-highlight"), 1500);
  };

  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto border-b border-unjong-border bg-unjong-surface px-4 py-1.5"
      aria-label="창별 컨텍스트 네비"
    >
      {menus.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => handleClick(m.id)}
          className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background whitespace-nowrap"
        >
          <span aria-hidden>{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

### 5-2. 금색 강조 CSS 추가

`app/globals.css` 끝에 추가:

```css
.unjong-card-highlight {
  outline: 3px solid var(--color-unjong-accent, #D4AF37);
  outline-offset: 4px;
  border-radius: 0.5rem;
  transition: outline-color 0.3s;
}
```

⚠️ Tailwind v4 의 `--color-unjong-accent` 변수 사용. 없으면 hex 직접.

### 5-3. ContextNav 를 메인 네비 아래 배치

root layout 또는 V3 헤더 wrapper 에서, MainNav 바로 아래에 ContextNav 배치.

---

## 작업 6 — 카드 컴포넌트에 id 추가

ContextNav 의 앵커 점프가 작동하려면 각 카드에 id 필요.

### 6-1. `CardContainer.tsx` 에 id prop 추가

```tsx
type CardContainerProps = {
  id?: string;  // ← 신규
  title: string;
  emoji?: string;
  subtitle?: string;
  hint?: string;
  children: ReactNode;
};

export function CardContainer({
  id,
  title,
  emoji,
  subtitle,
  hint,
  children,
}: CardContainerProps) {
  return (
    <section
      id={id}  // ← 신규
      className="flex flex-col rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden scroll-mt-32"
    >
      {/* 기존 내용 그대로 */}
    </section>
  );
}
```

`scroll-mt-32` — 헤더가 sticky 라서 스크롤 시 헤더 아래로 오게 (헤더 가려짐 방지).

### 6-2. `ScalperCards.tsx` 의 7개 카드에 id 전달

```tsx
export function MoversCard() {
  return <CardContainer id="card-movers" title="..." ...>...</CardContainer>;
}
export function VolumeCard() {
  return <CardContainer id="card-volume" ...>...</CardContainer>;
}
export function ViCard() {
  return <CardContainer id="card-vi" ...>...</CardContainer>;
}
export function NetBuyBrokerCard() {
  return <CardContainer id="card-netbuy" ...>...</CardContainer>;
}
export function ScalperDisclosureCard() {
  return <CardContainer id="card-disclosure" ...>...</CardContainer>;
}
export function ThemeTop10Card() {
  return <CardContainer id="card-theme" ...>...</CardContainer>;
}
export function ShortInterestCard() {
  return <CardContainer id="card-short" ...>...</CardContainer>;
}
```

### 6-3. `LongtermCards.tsx` · `UsCards.tsx` 도 동일하게

ContextNav 의 id 매핑과 정확히 일치하도록.

---

## 작업 7 — 두 번째 운종 헤더 (UnjongHeader) 제거

`app/(windows)/layout.tsx` 에서 `UnjongHeader` import 와 사용 제거.

```diff
- import { UnjongHeader } from "@/components/header/UnjongHeader";
...
- <UnjongHeader />
```

이제 운종 3창에는 root layout 의 통합 헤더만 표시.

`components/header/UnjongHeader.tsx`, `UnjongLogo.tsx`, `UnjongSearch.tsx`, `GlobalTickerBar.tsx`, `WindowSwitcher.tsx` 파일들은 **삭제 X** (재활용 가능, 보존).

---

## 작업 8 — WindowSwitcher 의 시간대 텍스트 제거 (이미 안 쓰지만 정리)

`components/header/WindowSwitcher.tsx` 의 시간대 표시 제거 (사용자 요청):

```diff
- <span className="hidden lg:inline text-[10px] text-unjong-muted ml-1">
-   {w.time}
- </span>
```

`WINDOWS` 배열에서도 `time` 필드 제거.

⚠️ 이 컴포넌트는 더 이상 사용 안 되지만 (UnjongHeader 와 함께 제거), 보존 차원에서 정리.

---

## 작업 9 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- root layout 의 통합 헤더 정상 (1단 + 2단 티커 + 3단 메인 네비 + 4단 컨텍스트 네비)
- `(windows)/layout.tsx` 에서 UnjongHeader 제거 후 헤더 중복 X
- 카드 id 정상 작동

빌드 깨지면:
- 색상 클래스 폴백 (`text-unjong-*` 안 되면 `text-slate-900` 등)
- 보고 후 멈춤

---

## 작업 10 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add -A
git status
git commit -m "feat: STEP 95-C - 헤더 통합 (V3 골격 + 운종 브랜드) + 컨텍스트 네비

V3 헤더 골격 유지, 운종 브랜드로 통합:
- STOCK TERMINAL → UNJONG 운종 (한자 X)
- V3 검색 아이콘 → 큰 통합 검색박스
- V3 티커 + 운종 티커 (KOSPI/KOSDAQ/S&P/NASDAQ) 통합
- V3 옛 네비 16개 → 새 메인 네비 (3창 + 스크리너 + 캘린더)
- 시간대 텍스트 제거 (단타창 09:00~15:30 등)

4단 컨텍스트 네비 신설:
- 창별 7개 카드 메뉴 자동 변경 (Bloomberg Terminal 패턴)
- 앵커 점프 + 금색 깜박임 (1.5초)
- ScalperCards / LongtermCards / UsCards 의 카드 7개씩에 id 추가

두 번째 운종 헤더 (UnjongHeader) 완전 제거:
- (windows)/layout.tsx 에서 import 제거
- 컴포넌트 파일은 보존 (재활용 가능)

V3 옛 네비 살릴 가치 3개:
- 스크리너 → 메인 네비 보조
- 캘린더 → 메인 네비 보조
- 참고사이트 → Layer 2 의 사이트 모아보기로 이관 예정

다음 STEP: 헤더 통합 결과 화면 확인 후 옛 네비 정리·세부 조정"
git push
```

---

## 검증 체크리스트

- [ ] V3 Header 컴포넌트의 STOCK TERMINAL → "UNJONG 운종" 변경
- [ ] V3 검색 아이콘 → 큰 통합 검색박스 교체
- [ ] V3 TickerBar 에 운종 글로벌 티커 통합
- [ ] V3 옛 네비 16개 제거, 새 메인 네비 (3창 + 스크리너 + 캘린더) 적용
- [ ] 운종 3창 박스에서 시간대 텍스트 제거
- [ ] ContextNav 컴포넌트 신설
- [ ] CardContainer 에 id prop 추가
- [ ] ScalperCards / LongtermCards / UsCards 의 카드 7개씩에 id 추가
- [ ] `app/globals.css` 에 `.unjong-card-highlight` 스타일 추가
- [ ] (windows)/layout.tsx 에서 UnjongHeader import 제거
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 95-C 완료. 헤더 통합 + 컨텍스트 네비 끝.

진단 결과:
- V3 헤더 구조: [Header.tsx / TickerBar.tsx / TopNav.tsx / LayoutShell.tsx 등 실제 파일]
- 통합 적용 위치: [구체적]

변경 사항:
- 1단: STOCK TERMINAL → UNJONG 운종 + 큰 통합 검색박스 ✅
- 2단: V3 티커 + 운종 티커 통합 (총 X개 지수) ✅
- 3단: 16개 옛 네비 → 새 메인 네비 ([단타창][장타창][미국주식창] + 🔍 스크리너 📅 캘린더) ✅
- 4단: 컨텍스트 네비 신설 (창별 7개 카드 메뉴 자동 전환) ✅
- 카드 21개 (3창 × 7개) 에 id 추가 ✅
- UnjongHeader 제거 ✅

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/scalper
    → 헤더 4단 (운종/티커/메인네비/컨텍스트네비) 한 번에 보임
    → 4단 메뉴 클릭 시 카드 스크롤 + 금색 깜박임
    → 단타창 ↔ 장타창 클릭 시 4단 메뉴 자동 변경
  http://localhost:3333/dashboard → V3 헤더 그대로 (이제는 영향 X)
```

---

## ⚠️ 주의 사항

1. **V3 헤더 컴포넌트 진단 우선** — 추측 X, grep 결과로 정확히 파악
2. **LayoutShell·Footer 절대 건드리지 말 것** — STEP 95-A 의 실수 반복 금지
3. **두 번째 운종 헤더 제거는 import 만** — 파일 보존
4. **카드 id 명명 일관성** — `card-{name}` 패턴 ContextNav 와 정확히 매칭
5. **시간대 텍스트 제거** — 사용자 명시 요청
6. **한자 雲從 사용 X** — UNJONG + 운종 (영문 + 한글) 만
7. **빌드 깨지면 즉시 멈추고 보고** — 작업 범위 크니 안전 우선
8. **console.log 남기지 말 것** — CLAUDE.md 규칙
