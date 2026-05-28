<!-- 2026-05-27 -->
# STEP 99 — 카드 더보기 + 디테일 페이지 (동적 라우트 21개)

> **목표**: 카드 더보기 클릭 → 디테일 페이지 → 뒤로가기로 원래 창. 동적 라우트로 21개 카드 한 번에 적용.
> **세션**: #25 (Layer 1)
> **전제**: STEP 95-F 완료 (또는 진행 중) — 3컬럼 + 카드 풀폭 구조
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md`

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_99_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **동적 라우트 3개** — `scalper/[card]`, `longterm/[card]`, `us/[card]` — 21개 카드 자동 처리
2. **CardDetail 공통 컴포넌트** — 모든 디테일 페이지 디자인 통일
3. **카드 데이터 재활용** — 별도 더미 추가 X (Layer 1 에서 풀 데이터)
4. **좌측 채팅 유지** — 디테일 페이지에서도 채팅 보임 (운종 정체성)
5. **뒤로가기 = 명시적 Link** — 브라우저 히스토리 의존 X, `← {창이름}으로`

---

## 작업 1 — `components/cards/CardContainer.tsx` 에 `detailHref` prop 추가

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type CardContainerProps = {
  id?: string;
  title: string;
  emoji?: string;
  subtitle?: string;
  hint?: string;
  detailHref?: string;  // ← 신규: 더보기 페이지 경로
  children: ReactNode;
};

export function CardContainer({
  id,
  title,
  emoji,
  subtitle,
  hint,
  detailHref,
  children,
}: CardContainerProps) {
  return (
    <section
      id={id}
      className="flex flex-col rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden scroll-mt-32"
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between gap-2 border-b border-unjong-border px-4 py-3 bg-unjong-background">
        <div className="flex items-center gap-1.5 min-w-0">
          {emoji && <span aria-hidden>{emoji}</span>}
          <h3 className="text-sm font-semibold text-unjong-primary truncate">
            {title}
          </h3>
          {subtitle && (
            <span className="text-[10px] text-unjong-muted">· {subtitle}</span>
          )}
        </div>

        {/* 더보기 링크 — detailHref 있을 때만 표시 */}
        {detailHref && (
          <Link
            href={detailHref}
            className="flex items-center gap-0.5 text-[11px] text-unjong-muted hover:text-unjong-accent transition-colors flex-shrink-0"
            aria-label={`${title} 상세 페이지`}
          >
            <span>더보기</span>
            <ArrowUpRight size={11} />
          </Link>
        )}
      </header>

      {/* 바디 */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">{children}</div>

      {/* 힌트 푸터 (선택) */}
      {hint && (
        <footer className="border-t border-unjong-border px-3 py-1.5 bg-unjong-background">
          <span className="text-[10px] text-unjong-muted italic">{hint}</span>
        </footer>
      )}
    </section>
  );
}
```

⚠️ `ArrowUpRight` lucide-react 아이콘 import.
⚠️ `detailHref` 없으면 "더보기" 링크 표시 안 됨 (기존 카드 그대로).

---

## 작업 2 — 21개 카드 컴포넌트에 `detailHref` 전달

### `components/cards/ScalperCards.tsx` (7개)

```tsx
export function MoversCard() {
  return <CardContainer id="card-movers" detailHref="/scalper/movers" title="Movers · 등락률 TOP" ...>...</CardContainer>;
}
export function VolumeCard() {
  return <CardContainer id="card-volume" detailHref="/scalper/volume" ...>...</CardContainer>;
}
export function ViCard() {
  return <CardContainer id="card-vi" detailHref="/scalper/vi" ...>...</CardContainer>;
}
export function NetBuyBrokerCard() {
  return <CardContainer id="card-netbuy" detailHref="/scalper/netbuy" ...>...</CardContainer>;
}
export function ScalperDisclosureCard() {
  return <CardContainer id="card-disclosure" detailHref="/scalper/disclosure" ...>...</CardContainer>;
}
export function ThemeTop10Card() {
  return <CardContainer id="card-theme" detailHref="/scalper/theme" ...>...</CardContainer>;
}
export function ShortInterestCard() {
  return <CardContainer id="card-short" detailHref="/scalper/short" ...>...</CardContainer>;
}
```

### `components/cards/LongtermCards.tsx` (7개)

```tsx
export function LongtermDisclosureCard() {
  return <CardContainer id="card-disclosure" detailHref="/longterm/disclosure" ...>...</CardContainer>;
}
export function EarningsCalendarCard() {
  return <CardContainer id="card-earnings" detailHref="/longterm/earnings" ...>...</CardContainer>;
}
export function ValueScreenCard() {
  return <CardContainer id="card-value" detailHref="/longterm/value" ...>...</CardContainer>;
}
export function DividendTopCard() {
  return <CardContainer id="card-dividend" detailHref="/longterm/dividend" ...>...</CardContainer>;
}
export function Lows52WCard() {
  return <CardContainer id="card-lows" detailHref="/longterm/lows" ...>...</CardContainer>;
}
export function SectorCard() {
  return <CardContainer id="card-sector" detailHref="/longterm/sector" ...>...</CardContainer>;
}
export function WarningStockCard() {
  return <CardContainer id="card-warning" detailHref="/longterm/warning" ...>...</CardContainer>;
}
```

### `components/cards/UsCards.tsx` (7개)

```tsx
export function GlobalIndicesCard() {
  return <CardContainer id="card-indices" detailHref="/us/indices" ...>...</CardContainer>;
}
export function PreAfterMarketCard() {
  return <CardContainer id="card-prepost" detailHref="/us/prepost" ...>...</CardContainer>;
}
export function Magnificent7Card() {
  return <CardContainer id="card-m7" detailHref="/us/m7" ...>...</CardContainer>;
}
export function UsMoversCard() {
  return <CardContainer id="card-movers" detailHref="/us/movers" ...>...</CardContainer>;
}
export function ForexClockCard() {
  return <CardContainer id="card-forex" detailHref="/us/forex" ...>...</CardContainer>;
}
export function UsNewsCard() {
  return <CardContainer id="card-news" detailHref="/us/news" ...>...</CardContainer>;
}
export function FOMCCalendarCard() {
  return <CardContainer id="card-fomc" detailHref="/us/fomc" ...>...</CardContainer>;
}
```

→ 각 카드 컴포넌트가 detailHref 전달. 카드 헤더에 "더보기 →" 자동 표시.

---

## 작업 3 — `components/cards/CardDetail.tsx` 공통 컴포넌트 신설

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Filter, ArrowUpDown } from "lucide-react";

type CardMeta = {
  title: string;
  emoji: string;
  subtitle: string;
  windowLabel: string;
};

const CARD_META: Record<string, CardMeta> = {
  // 단타창
  "scalper-movers": { title: "Movers · 등락률 TOP", emoji: "🚀", subtitle: "실시간 KOSPI/KOSDAQ", windowLabel: "단타창" },
  "scalper-volume": { title: "Volume · 거래량 폭증", emoji: "🔥", subtitle: "전일 대비 3배+", windowLabel: "단타창" },
  "scalper-vi": { title: "VI · 변동성 완화장치", emoji: "🚨", subtitle: "실시간 발동/해제", windowLabel: "단타창" },
  "scalper-netbuy": { title: "NetBuy + 거래원", emoji: "💰", subtitle: "외인·기관 + 매수 1위", windowLabel: "단타창" },
  "scalper-disclosure": { title: "공시 · 실시간", emoji: "📄", subtitle: "DART", windowLabel: "단타창" },
  "scalper-theme": { title: "테마 TOP10", emoji: "🎯", subtitle: "실시간 등락률 순", windowLabel: "단타창" },
  "scalper-short": { title: "공매도 잔고 변화", emoji: "⚠️", subtitle: "숏커버·위험 시그널", windowLabel: "단타창" },

  // 장타창
  "longterm-disclosure": { title: "공시 · 실적·배당·증자", emoji: "📊", subtitle: "DART", windowLabel: "장타창" },
  "longterm-earnings": { title: "분기 실적 캘린더", emoji: "📅", subtitle: "발표 예정", windowLabel: "장타창" },
  "longterm-value": { title: "저평가 종목 랭킹", emoji: "💎", subtitle: "PER · PBR · ROE 조합", windowLabel: "장타창" },
  "longterm-dividend": { title: "배당 캘린더 + 수익률 TOP", emoji: "💰", subtitle: "배당락일 임박 순", windowLabel: "장타창" },
  "longterm-lows": { title: "52주 신저가 우량주", emoji: "📉", subtitle: "줍줍 시그널 (시총 1조+)", windowLabel: "장타창" },
  "longterm-sector": { title: "섹터 히트맵", emoji: "🗺️", subtitle: "업종별 등락", windowLabel: "장타창" },
  "longterm-warning": { title: "관리종목·투자유의", emoji: "⚠️", subtitle: "위험 회피 시그널", windowLabel: "장타창" },

  // 미국주식창
  "us-indices": { title: "글로벌 지수", emoji: "🌐", subtitle: "S&P/Nasdaq/Dow/VIX", windowLabel: "미국주식창" },
  "us-prepost": { title: "Pre-market / After-hours", emoji: "🌅", subtitle: "시간외 변동 TOP", windowLabel: "미국주식창" },
  "us-m7": { title: "Magnificent 7", emoji: "⭐", subtitle: "미국 7대 대장주", windowLabel: "미국주식창" },
  "us-movers": { title: "미국 Movers", emoji: "🇺🇸", subtitle: "정규장 TOP", windowLabel: "미국주식창" },
  "us-forex": { title: "USD/KRW + 미국 시계", emoji: "💱", subtitle: "환율 · 시장 상태", windowLabel: "미국주식창" },
  "us-news": { title: "미국 뉴스", emoji: "📰", subtitle: "Bloomberg/CNBC/WSJ", windowLabel: "미국주식창" },
  "us-fomc": { title: "FOMC·CPI·NFP 캘린더", emoji: "📅", subtitle: "미국 거시 이벤트", windowLabel: "미국주식창" },
};

const WINDOW_HREF: Record<string, string> = {
  scalper: "/scalper",
  longterm: "/longterm",
  us: "/us",
};

type CardDetailProps = {
  window: "scalper" | "longterm" | "us";
  card: string;
};

export function CardDetail({ window, card }: CardDetailProps) {
  const meta = CARD_META[`${window}-${card}`];

  // 알 수 없는 카드 → 안내
  if (!meta) {
    return (
      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-6 text-center">
        <p className="text-sm text-unjong-muted">
          알 수 없는 카드 — <code className="text-unjong-primary">{window}/{card}</code>
        </p>
        <Link
          href={WINDOW_HREF[window] ?? "/scalper"}
          className="mt-2 inline-block text-xs text-unjong-accent hover:underline"
        >
          ← 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 뒤로가기 헤더 */}
      <div className="flex items-center justify-between">
        <Link
          href={WINDOW_HREF[window]}
          className="flex items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{meta.windowLabel}으로</span>
        </Link>
        <span className="text-[10px] text-unjong-muted italic">
          Layer 1 — 실데이터 + 풀 리스트 연결 예정
        </span>
      </div>

      {/* 카드 타이틀 */}
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-2xl">{meta.emoji}</span>
          <div>
            <h1 className="text-lg font-bold text-unjong-primary">{meta.title}</h1>
            <p className="text-xs text-unjong-muted mt-0.5">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      {/* 필터/정렬 UI placeholder */}
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-unjong-muted">
            <Filter size={12} />
            <span>필터</span>
            <span className="text-unjong-primary font-medium">전체</span>
            <span className="text-[10px]">·</span>
            <span className="hover:text-unjong-primary cursor-pointer">KOSPI</span>
            <span className="text-[10px]">·</span>
            <span className="hover:text-unjong-primary cursor-pointer">KOSDAQ</span>
            <span className="text-[10px]">·</span>
            <span className="hover:text-unjong-primary cursor-pointer">시총 1조+</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-unjong-muted ml-auto">
            <ArrowUpDown size={12} />
            <span>정렬</span>
            <span className="text-unjong-primary font-medium">등락률 ↓</span>
          </div>
        </div>
        <p className="text-[10px] text-unjong-muted italic mt-2 pl-4">
          Layer 1 — 실제 필터/정렬 동작 연결 예정
        </p>
      </div>

      {/* 데이터 영역 — Layer 1 안내 */}
      <div className="rounded-lg border-2 border-dashed border-unjong-border bg-unjong-surface p-8 text-center">
        <p className="text-2xl mb-2">{meta.emoji}</p>
        <p className="text-sm font-medium text-unjong-primary mb-1">
          {meta.title} 풀 리스트
        </p>
        <p className="text-xs text-unjong-muted leading-relaxed max-w-md mx-auto">
          Layer 1 에서 30~100건+ 풀 데이터 + 필터/정렬 + 검색 + 시간별 추이 연결.
          <br />
          현재 메인 카드 (요약 5건) 는{" "}
          <Link href={WINDOW_HREF[window]} className="text-unjong-accent hover:underline">
            {meta.windowLabel}
          </Link>
          {" "}에서 확인.
        </p>
      </div>
    </div>
  );
}
```

⚠️ `lucide-react` 의 `ArrowLeft`, `Filter`, `ArrowUpDown` import 확인.
⚠️ 21개 카드 메타데이터 정확히 입력 (id 와 매칭).

---

## 작업 4 — 동적 라우트 3개 신설

### `app/(windows)/scalper/[card]/page.tsx`

```tsx
import type { Metadata } from "next";
import { CardDetail } from "@/components/cards/CardDetail";

type Params = Promise<{ card: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { card } = await params;
  return {
    title: `단타창 / ${card}`,
    description: `운종 단타창 ${card} 디테일 페이지.`,
  };
}

export default async function ScalperCardDetailPage({ params }: { params: Params }) {
  const { card } = await params;
  return <CardDetail window="scalper" card={card} />;
}
```

### `app/(windows)/longterm/[card]/page.tsx`

```tsx
import type { Metadata } from "next";
import { CardDetail } from "@/components/cards/CardDetail";

type Params = Promise<{ card: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { card } = await params;
  return {
    title: `장타창 / ${card}`,
    description: `운종 장타창 ${card} 디테일 페이지.`,
  };
}

export default async function LongtermCardDetailPage({ params }: { params: Params }) {
  const { card } = await params;
  return <CardDetail window="longterm" card={card} />;
}
```

### `app/(windows)/us/[card]/page.tsx`

```tsx
import type { Metadata } from "next";
import { CardDetail } from "@/components/cards/CardDetail";

type Params = Promise<{ card: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { card } = await params;
  return {
    title: `미국주식창 / ${card}`,
    description: `운종 미국주식창 ${card} 디테일 페이지.`,
  };
}

export default async function UsCardDetailPage({ params }: { params: Params }) {
  const { card } = await params;
  return <CardDetail window="us" card={card} />;
}
```

⚠️ Next.js 15+ 에서는 `params` 가 `Promise` 라 `await` 필수.

---

## 작업 5 — 디테일 페이지에서 종목상세·관심종목 처리

현재 (windows)/layout.tsx 의 1행 = 종목상세 + 관심종목. 디테일 페이지 들어가도 1행이 그대로 보일 텐데, 이게 적절한지?

옵션:
- **A. 1행 그대로 유지** — 디테일 페이지에서도 종목상세·관심종목 보임 (운종 정체성)
- **B. 디테일 페이지에서는 1행 숨김** — 디테일 컨텐츠만 풀폭

→ **A 추천** (운종 정체성 유지). children 만 디테일 페이지 컨텐츠로 교체. 1행은 그대로.

별도 작업 X. layout.tsx 그대로 작동.

---

## 작업 6 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- 새 컴포넌트 (CardDetail) 정상
- 21개 카드의 detailHref 정상 작동
- 동적 라우트 3개 (`/scalper/[card]`, `/longterm/[card]`, `/us/[card]`) 빌드됨

build output 에서 `/scalper/[card]`, `/longterm/[card]`, `/us/[card]` 보여야 함.

---

## 작업 7 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add -A
git status
git commit -m "feat: STEP 99 - 카드 더보기 + 디테일 페이지 (동적 라우트 21개)

큰 구조 추가:
- CardContainer: detailHref prop 추가 → 카드 헤더에 '더보기 →' 링크
- 21개 카드 (3창 × 7) 모두 detailHref 전달
- components/cards/CardDetail.tsx 공통 컴포넌트 신설
  · 21개 카드 메타데이터 (CARD_META)
  · 뒤로가기 헤더 (← {창이름}으로)
  · 카드 타이틀 + 필터/정렬 UI placeholder
  · 데이터 영역 — Layer 1 안내

동적 라우트 3개 신설:
- app/(windows)/scalper/[card]/page.tsx
- app/(windows)/longterm/[card]/page.tsx
- app/(windows)/us/[card]/page.tsx
→ 21개 디테일 페이지 자동 처리

운종 정체성 유지:
- 디테일 페이지에서도 좌측 채팅 + 종목상세 + 관심종목 1행 표시
- ContextNav 도 그대로 (다른 카드 메뉴로 빠른 이동)

URL 구조:
- /scalper/movers · /scalper/volume · /scalper/vi · /scalper/netbuy · /scalper/disclosure · /scalper/theme · /scalper/short
- /longterm/disclosure · /longterm/earnings · /longterm/value · /longterm/dividend · /longterm/lows · /longterm/sector · /longterm/warning
- /us/indices · /us/prepost · /us/m7 · /us/movers · /us/forex · /us/news · /us/fomc

다음: 디테일 페이지 실데이터 (Layer 1 — 카드별 풀 리스트 30~100건+)"
git push
```

---

## 검증 체크리스트

- [ ] `CardContainer` 에 `detailHref` prop 추가
- [ ] 21개 카드 (3 × 7) 컴포넌트 모두 `detailHref` 전달
- [ ] `components/cards/CardDetail.tsx` 신설
- [ ] CARD_META 에 21개 항목 모두 입력
- [ ] 3개 동적 라우트 page.tsx 신설
- [ ] 빌드 클린
- [ ] 21개 URL 모두 작동 (`/scalper/movers` 등)
- [ ] 디테일 페이지에서 ← 뒤로가기 정상 작동
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 99 완료. 카드 더보기 + 디테일 페이지 (21개) 끝.

신규:
- CardContainer.detailHref prop — 헤더에 '더보기 →' 링크
- 21개 카드 detailHref 전달:
  · /scalper/movers · /scalper/volume · /scalper/vi · /scalper/netbuy · /scalper/disclosure · /scalper/theme · /scalper/short
  · /longterm/disclosure · /longterm/earnings · /longterm/value · /longterm/dividend · /longterm/lows · /longterm/sector · /longterm/warning
  · /us/indices · /us/prepost · /us/m7 · /us/movers · /us/forex · /us/news · /us/fomc
- CardDetail.tsx 공통 컴포넌트 (21개 메타데이터)
- 3개 동적 라우트 (scalper/[card], longterm/[card], us/[card])

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  /scalper 들어가서 Movers 카드의 '더보기 →' 클릭
    → /scalper/movers 로 이동
    → '← 단타창으로' 뒤로가기 버튼
    → 클릭 시 /scalper 복귀
  모든 21개 카드 더보기 작동

좌측 채팅·종목상세·관심종목·ContextNav 그대로 유지.
디테일 페이지 = children 만 교체 (운종 정체성 보존).

다음: Layer 1 실데이터 또는 디자인 미세조정
```

---

## ⚠️ 주의 사항

1. **CARD_META 의 카드 ID 정확히** — 카드 컴포넌트의 detailHref 와 매칭 (`scalper-movers`, `scalper-volume` 등)
2. **Next.js 15+ params** — `await params` 필수 (Promise 타입)
3. **lucide-react 아이콘 import** — `ArrowUpRight`, `ArrowLeft`, `Filter`, `ArrowUpDown`
4. **디테일 페이지에서 children 만 교체** — layout 그대로 (1행·채팅 유지)
5. **빌드 깨지면 즉시 보고** — 21개 카드 한 번에 처리라 큰 작업
6. **console.log 남기지 말 것**
