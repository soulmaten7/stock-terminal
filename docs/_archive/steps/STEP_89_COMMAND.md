<!-- 2026-05-27 -->
# STEP 89 — 3창 라우트 구조 생성 (`/scalper` `/longterm` `/us`)

> **목표**: Next.js App Router 라우트 그룹으로 3창 페이지 골격 생성 + 공통 Layout
> **세션**: #25
> **전제**: STEP 88 완료 (`892c662`), 빌드 클린, 운종 브랜드 적용 완료
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 4 (3창 구조)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에 다음 한 줄 입력:

```
@docs/STEP_89_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙 — 이 STEP 은 "골격만"

1. **새 라우트만 추가**, 기존 V3 (`/`, `/dashboard` 등) 는 건드리지 않음 (STEP 94 에서 강등)
2. **컴포넌트 placeholder**, 실제 차트·채팅·카드 컴포넌트는 STEP 90~93 에서 채움
3. **빌드 클린 + 페이지 로드 가능** 까지가 이 STEP 의 끝
4. **라우트 그룹 `(windows)`** 사용 — URL 에는 안 나오지만 layout 적용 범위 분리

---

## 작업 1 — 폴더 구조 생성

다음 폴더·파일을 새로 만든다:

```
app/
├── (windows)/                       # ← 신규 라우트 그룹
│   ├── layout.tsx                  # ← 신규 공통 레이아웃
│   ├── scalper/
│   │   └── page.tsx               # ← 단타창
│   ├── longterm/
│   │   └── page.tsx               # ← 장타창
│   └── us/
│       └── page.tsx               # ← 미국주식창
└── (기존 파일들 그대로)
```

### Bash 명령:
```bash
mkdir -p "app/(windows)/scalper"
mkdir -p "app/(windows)/longterm"
mkdir -p "app/(windows)/us"
```

⚠️ zsh 에서 괄호 escape 필요: 따옴표로 감싸기 (위 명령처럼).

---

## 작업 2 — `app/(windows)/layout.tsx` 작성

운종 3창의 공통 레이아웃. 헤더 + 좌측 사이드 + 메인 + 우측 사이드패널의 4영역 자리만.

```tsx
import type { ReactNode } from "react";
import Link from "next/link";

/**
 * 운종(雲從) 3창 공통 레이아웃
 *
 * 영역 구조:
 * - 상단 헤더 (고정) — 로고, 검색, 3창 카드, 글로벌 티커
 * - 좌측 사이드 (폭 300px, 고정) — 채팅 + 관심종목 (STEP 91 에서 채움)
 * - 메인 영역 — 각 창의 카드 모자이크 (STEP 92 에서 채움)
 * - 우측 사이드패널 (가변) — 종목 클릭 시 차트/호가/체결 (STEP 93 에서 채움)
 *
 * 이 STEP 89 에서는 placeholder 만. 실제 컴포넌트는 후속 STEP 에서.
 */
export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-unjong-background">
      {/* 상단 헤더 (STEP 90 에서 채움) */}
      <header className="border-b border-unjong-border bg-unjong-surface">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="text-xl font-bold text-unjong-primary">雲從</div>
          <div className="text-xs text-unjong-muted">UNJONG</div>
          <div className="flex-1 text-center text-xs text-unjong-muted">
            (검색창 자리 · STEP 90)
          </div>
          <div className="text-xs text-unjong-muted">
            (글로벌 티커 · STEP 90)
          </div>
        </div>
        <nav className="flex h-12 items-center gap-2 px-4 border-t border-unjong-border">
          <Link
            href="/scalper"
            className="rounded-md px-4 py-1.5 text-sm font-medium hover:bg-unjong-background"
          >
            단타창
          </Link>
          <Link
            href="/longterm"
            className="rounded-md px-4 py-1.5 text-sm font-medium hover:bg-unjong-background"
          >
            장타창
          </Link>
          <Link
            href="/us"
            className="rounded-md px-4 py-1.5 text-sm font-medium hover:bg-unjong-background"
          >
            미국주식창
          </Link>
        </nav>
      </header>

      {/* 본문 (좌측 + 메인 + 우측) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드 — 채팅 + 관심종목 (STEP 91) */}
        <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
          <div className="flex h-full flex-col">
            <div className="border-b border-unjong-border p-3 text-sm font-medium">
              💬 채팅 (STEP 91)
            </div>
            <div className="flex-1 overflow-y-auto p-3 text-xs text-unjong-muted">
              채팅 메시지 자리
              <br />
              (Layer 1 — Supabase Realtime 연결 시 활성)
            </div>
            <div className="border-t border-unjong-border p-3 text-xs text-unjong-muted">
              ✏️ 메시지 입력 자리 (STEP 91)
            </div>
            <div className="border-t border-unjong-border p-3 text-sm font-medium">
              👀 관심종목 (STEP 91)
            </div>
            <div className="max-h-[30%] overflow-y-auto p-3 text-xs text-unjong-muted">
              관심종목 리스트 자리
              <br />
              (기존 Watchlist 컴포넌트 재배치 예정)
            </div>
          </div>
        </aside>

        {/* 메인 영역 — 각 창의 컨텐츠 (STEP 92) */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>

        {/* 우측 사이드패널 — 종목 클릭 시 (STEP 93) */}
        <aside className="hidden xl:flex w-[360px] flex-shrink-0 border-l border-unjong-border bg-unjong-surface p-3 text-xs text-unjong-muted">
          종목 미선택 상태
          <br />
          (Layer 0 — STEP 93 에서 차트·호가·체결 패널 연결)
        </aside>
      </div>
    </div>
  );
}
```

⚠️ **주의 사항**:
- `bg-unjong-*`, `border-unjong-*` 등의 Tailwind 클래스는 STEP 88 에서 추가된 팔레트 사용
- 만약 Tailwind v4 의 `@theme` 방식으로 색상이 정의되어 있다면, 클래스명이 `bg-unjong-background` 가 아니라 `bg-[color:--color-unjong-background]` 같은 형태일 수 있음. **STEP 88 에서 사용한 패턴과 동일하게** 맞출 것.
- 색상 클래스가 작동 안 하면 일단 `bg-white`, `bg-gray-50` 같은 기본 클래스로 폴백 후 Cowork 에게 보고.

---

## 작업 3 — `app/(windows)/scalper/page.tsx` 작성

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "단타창",
  description:
    "운종(雲從) 단타창 — 장중 09:00~15:30 액티브 트레이더의 데스크. " +
    "Movers · Volume · VI · NetBuy · 공시 · 테마 · 공매도.",
};

export default function ScalperPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h1 className="text-2xl font-bold text-unjong-primary">⚡ 단타창</h1>
        <p className="mt-2 text-sm text-unjong-muted">
          장중 09:00~15:30 — 액티브 트레이더의 데스크
        </p>
      </div>

      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h2 className="text-sm font-medium text-unjong-muted">
          메인 카드 7개 자리 (STEP 92 + Layer 1)
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-unjong-muted">
          <li>1. Movers (등락률 TOP)</li>
          <li>2. Volume 폭증</li>
          <li>3. VI 발동/해제 ⭐신규</li>
          <li>4. NetBuy + 거래원 ⭐거래원 신규</li>
          <li>5. 공시 실시간</li>
          <li>6. 테마 TOP10</li>
          <li>7. 공매도 잔고 ⭐신규</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 작업 4 — `app/(windows)/longterm/page.tsx` 작성

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "장타창",
  description:
    "운종(雲從) 장타창 — 가치투자자·장기보유자의 데스크. " +
    "공시 · 분기실적 · 저평가 · 배당 · 신저가 · 섹터 · 관리종목.",
};

export default function LongtermPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h1 className="text-2xl font-bold text-unjong-primary">🌳 장타창</h1>
        <p className="mt-2 text-sm text-unjong-muted">
          저녁·주말 — 가치투자자·장기보유자의 데스크
        </p>
      </div>

      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h2 className="text-sm font-medium text-unjong-muted">
          메인 카드 7개 자리 (STEP 92 + Layer 1)
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-unjong-muted">
          <li>1. 공시 (실적·배당·증자·자사주)</li>
          <li>2. 분기 실적 캘린더</li>
          <li>3. 저평가 종목 랭킹 ⭐신규</li>
          <li>4. 배당 캘린더 + 수익률 TOP</li>
          <li>5. 52주 신저가 우량주 ⭐신규</li>
          <li>6. 섹터 히트맵</li>
          <li>7. 관리종목·투자유의 ⭐신규</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 작업 5 — `app/(windows)/us/page.tsx` 작성

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "미국주식창",
  description:
    "운종(雲從) 미국주식창 — 미장 투자자의 새벽 데스크. " +
    "S&P/Nasdaq/VIX · Pre/After · M7 · Movers · 환율 · 뉴스+8K · FOMC.",
};

export default function UsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h1 className="text-2xl font-bold text-unjong-primary">🌙 미국주식창</h1>
        <p className="mt-2 text-sm text-unjong-muted">
          새벽 22:30~05:00 — 미장 투자자의 데스크
        </p>
      </div>

      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h2 className="text-sm font-medium text-unjong-muted">
          메인 카드 7개 자리 (STEP 92 + Layer 1)
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-unjong-muted">
          <li>1. 글로벌 지수 (S&P/Nasdaq/Dow/VIX)</li>
          <li>2. Pre-market / After-hours TOP ⭐신규</li>
          <li>3. Magnificent 7 ⭐신규</li>
          <li>4. 미국 Movers</li>
          <li>5. USD/KRW 환율 + 미국 시계 ⭐신규</li>
          <li>6. 미국 뉴스 + 8-K (SEC EDGAR)</li>
          <li>7. FOMC·CPI·NFP 캘린더</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 작업 6 — 기존 V3 라우트 보존 (건드리지 말 것)

다음은 **이 STEP 에서 절대 수정 금지**:
- `app/page.tsx` (루트 / — V3 5섹션 홈) → STEP 94 에서 강등
- `app/dashboard/` (있다면)
- `app/analysis/`, `app/ad/`, `app/auth/` 등 기존 페이지들
- `app/layout.tsx` (root layout) — STEP 88 에서 이미 운종 메타데이터 적용됨

이 STEP 은 **순수 추가** 만. 기존 파일 수정 0 건.

---

## 작업 7 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

**확인 사항**:
- 빌드 성공
- TypeScript 오류 0
- 다음 3개 라우트가 build output 에 나타남:
  - `/scalper`
  - `/longterm`
  - `/us`
- 기존 라우트들 (`/`, `/dashboard`, `/analysis` 등) 도 그대로 빌드됨

만약 색상 클래스 (`bg-unjong-*`) 가 적용 안 돼서 빌드 깨지면:
- `app/globals.css` 의 `--color-unjong-*` 토큰을 어떻게 사용하는지 확인
- 필요시 모든 `bg-unjong-*` 클래스를 `bg-white`, `bg-gray-50`, `text-gray-900` 등 표준 Tailwind 클래스로 일괄 변경
- 폴백 적용 후 Cowork 에게 보고

---

## 작업 8 — 로컬 서버 확인 (수동, 선택)

빌드 성공 후 dev 서버에서 페이지 정상 로드 확인 (선택 작업, 사용자가 직접 할 수도 있음):

```bash
# 기존 서버 죽이고 재시작
lsof -ti :3333 | xargs kill -9 2>/dev/null
npm run dev
```

브라우저에서 확인:
- `http://localhost:3333/scalper` → 단타창 페이지
- `http://localhost:3333/longterm` → 장타창 페이지
- `http://localhost:3333/us` → 미국주식창 페이지
- 각 페이지에서 상단 3창 nav 클릭 시 다른 창으로 라우트 전환

⚠️ Claude Code 가 dev 서버를 켰다 끄면 사용자의 기존 dev 세션을 죽일 수 있음. **이 작업은 사용자가 따로 확인하게 두고 Claude Code 는 빌드만 검증**.

---

## 작업 9 — git commit + push

빌드 성공 확인 후:

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add app
git add docs/STEP_89_COMMAND.md
git status
git commit -m "feat: STEP 89 - 3창 라우트 구조 골격 (/scalper /longterm /us)

- app/(windows)/layout.tsx 신설 — 헤더+좌측+메인+우측패널 placeholder
- app/(windows)/scalper/page.tsx — 단타창 (카드 7개 자리)
- app/(windows)/longterm/page.tsx — 장타창 (카드 7개 자리)
- app/(windows)/us/page.tsx — 미국주식창 (카드 7개 자리)
- 기존 V3 라우트 (/, /dashboard 등) 그대로 보존 (STEP 94 강등 예정)
- 다음 STEP 90: 헤더 고정 영역 (검색·티커·3창 카드 박스)"
git push
```

---

## 검증 체크리스트

작업 끝나면 다음 항목 확인:

- [ ] `app/(windows)/` 폴더 존재
- [ ] `app/(windows)/layout.tsx` 작성됨
- [ ] `app/(windows)/scalper/page.tsx` 작성됨
- [ ] `app/(windows)/longterm/page.tsx` 작성됨
- [ ] `app/(windows)/us/page.tsx` 작성됨
- [ ] 기존 `app/page.tsx` 등 V3 페이지 수정 0건
- [ ] `npm run build` 성공
- [ ] build output 에 `/scalper` `/longterm` `/us` 라우트 보임
- [ ] git commit + push 완료
- [ ] GitHub 에 새 커밋 반영

---

## 완료 보고 (Claude Code → 사용자)

작업 끝나면 사용자에게:
```
STEP 89 완료. 3창 라우트 구조 골격 끝.
- /scalper /longterm /us 라우트 추가
- 공통 Layout placeholder 적용
- 빌드 클린, git push 완료 (커밋 [해시])
- 기존 V3 페이지들 그대로 보존

다음 STEP 90 (헤더 고정 영역 — 검색창, 티커, 3창 카드 박스) 명령서 받을 준비 됨.

브라우저에서 확인하려면:
  http://localhost:3333/scalper
  http://localhost:3333/longterm
  http://localhost:3333/us
```

---

## ⚠️ 주의 사항

1. **루트 `/` 는 건드리지 말 것** — STEP 94 에서 5섹션 → `/dashboard` 강등 시 함께 처리
2. **라우트 그룹 폴더명은 `(windows)`** — 괄호 포함, 정확히 일치해야 Next.js 가 인식
3. **색상 클래스가 작동 안 하면 폴백 후 보고** — 강제 진행 금지
4. **dev 서버 켜지 말 것** — 사용자 환경 침범 방지
5. **빌드 깨지면 즉시 멈추고 Cowork 에게 보고** — 강제 진행 금지
6. **console.log 남기지 말 것** — CLAUDE.md 규칙
