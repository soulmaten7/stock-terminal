<!-- 2026-05-27 -->
# STEP 92 — 메인 카드 그리드 자리 잡기 (창별 3개씩)

> **목표**: 각 창의 메인 영역에 카드 3개씩 시각화. 그리드 시스템 정의.
> **세션**: #25
> **전제**: STEP 91 완료 (`13ae6c4`), 좌측 사이드 작동 중
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 5-3 (메인 영역)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_92_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **카드 3개씩만 (Layer 0)** — 카드 7개 완성은 Layer 1 의 일
2. **더미 데이터 풍성하게** — 시각화 그럴듯해야 사용자가 "운종 다 됐다" 느낌
3. **공통 CardContainer wrapper** — 디자인 일관성, Layer 1 확장 쉽게
4. **기존 V3 위젯 재활용 안 함** — STEP 91 의 WatchlistPanel 처럼 의존성 복잡할 가능성. 깔끔한 더미가 안전
5. **그리드 시스템 정의** — Layer 1 에서 7개 확장할 때 반응형 그대로 동작

---

## 작업 1 — 컴포넌트 폴더 생성

```bash
mkdir -p components/cards
```

생성할 파일:
- `components/cards/CardContainer.tsx` — 공통 카드 wrapper
- `components/cards/ScalperCards.tsx` — 단타창 카드 3개 (Movers / Volume / 공시)
- `components/cards/LongtermCards.tsx` — 장타창 카드 3개 (공시 / 분기실적 / 섹터)
- `components/cards/UsCards.tsx` — 미국주식창 카드 3개 (글로벌지수 / 미국Movers / 미국뉴스)

---

## 작업 2 — `components/cards/CardContainer.tsx` (공통 wrapper)

```tsx
import type { ReactNode } from "react";

type CardContainerProps = {
  title: string;
  emoji?: string;
  subtitle?: string;
  hint?: string;
  children: ReactNode;
};

/**
 * 운종 메인 카드 공통 wrapper
 *
 * 모든 카드는 이 컨테이너로 통일된 디자인 (헤더 + 바디 + 푸터 힌트).
 * Layer 1 에서 카드 추가될 때 동일 wrapper 사용.
 */
export function CardContainer({
  title,
  emoji,
  subtitle,
  hint,
  children,
}: CardContainerProps) {
  return (
    <section className="flex flex-col rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden">
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
      </header>

      {/* 바디 */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">{children}</div>

      {/* 힌트 푸터 (Layer 1 활성 안내) */}
      {hint && (
        <footer className="border-t border-unjong-border px-3 py-1.5 bg-unjong-background">
          <span className="text-[10px] text-unjong-muted italic">{hint}</span>
        </footer>
      )}
    </section>
  );
}
```

⚠️ 색상 클래스는 STEP 88~91 에서 정상 작동 확인된 `unjong-*` 사용.

---

## 작업 3 — `components/cards/ScalperCards.tsx` (단타창 3개)

```tsx
import { TrendingUp, TrendingDown, Zap, FileText } from "lucide-react";
import { CardContainer } from "./CardContainer";

// ─── 더미 데이터 ───

const MOVERS = [
  { code: "247540", name: "에코프로비엠", price: "412,000", changePct: 12.5 },
  { code: "035720", name: "카카오", price: "53,400", changePct: 10.2 },
  { code: "086520", name: "에코프로", price: "892,000", changePct: 8.7 },
  { code: "005930", name: "삼성전자", price: "82,100", changePct: 7.4 },
  { code: "000660", name: "SK하이닉스", price: "248,500", changePct: 6.1 },
];

const VOLUME_SURGE = [
  { code: "005930", name: "삼성전자", volume: "12,847,234", ratio: "5.2x" },
  { code: "035720", name: "카카오", volume: "8,234,567", ratio: "4.1x" },
  { code: "207940", name: "삼성바이오로직스", volume: "1,123,456", ratio: "3.8x" },
  { code: "035420", name: "NAVER", volume: "5,678,901", ratio: "3.2x" },
];

const DISCLOSURES = [
  { code: "005930", name: "삼성전자", type: "자기주식 취득", time: "10:42" },
  { code: "035720", name: "카카오", type: "주식분할 결정", time: "10:38" },
  { code: "000660", name: "SK하이닉스", type: "단일판매 계약", time: "10:25" },
  { code: "207940", name: "삼성바이오로직스", type: "특별관계자 거래", time: "10:18" },
  { code: "035420", name: "NAVER", type: "유상증자 결정", time: "10:05" },
];

// ─── 카드 ───

export function MoversCard() {
  return (
    <CardContainer
      title="Movers · 등락률 TOP"
      emoji="🚀"
      subtitle="실시간 KOSPI/KOSDAQ"
      hint="Layer 1 — KIS ranking API 연결 예정"
    >
      <ul className="space-y-2">
        {MOVERS.map((m, i) => (
          <li
            key={m.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-unjong-muted font-mono w-4 text-right">
                {i + 1}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {m.name}
                </span>
                <span className="text-[10px] text-unjong-muted">{m.code}</span>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="font-semibold text-unjong-primary">
                {m.price}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] text-unjong-success font-semibold">
                <TrendingUp size={10} />+{m.changePct.toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function VolumeCard() {
  return (
    <CardContainer
      title="Volume · 거래량 폭증"
      emoji="🔥"
      subtitle="전일 대비 3배+"
      hint="Layer 1 — KIS volume-rank API 연결 예정"
    >
      <ul className="space-y-2">
        {VOLUME_SURGE.map((v) => (
          <li
            key={v.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-unjong-primary truncate">
                {v.name}
              </span>
              <span className="text-[10px] text-unjong-muted font-mono">
                {v.volume} 주
              </span>
            </div>
            <span className="text-[11px] font-bold text-unjong-accent flex-shrink-0">
              {v.ratio}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function ScalperDisclosureCard() {
  return (
    <CardContainer
      title="공시 · 실시간"
      emoji="📄"
      subtitle="DART"
      hint="Layer 1 — DART Open API 연결 (기존 V3 재활용)"
    >
      <ul className="space-y-2">
        {DISCLOSURES.map((d, i) => (
          <li
            key={`${d.code}-${i}`}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={12} className="text-unjong-muted flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {d.name}
                </span>
                <span className="text-[10px] text-unjong-muted truncate">
                  {d.type}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-unjong-muted flex-shrink-0">
              {d.time}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}
```

---

## 작업 4 — `components/cards/LongtermCards.tsx` (장타창 3개)

```tsx
import { Calendar, FileText, BarChart3 } from "lucide-react";
import { CardContainer } from "./CardContainer";

// ─── 더미 데이터 ───

const LONGTERM_DISCLOSURES = [
  { code: "005930", name: "삼성전자", type: "현금배당 결정 (배당금 ₩1,361)", time: "어제" },
  { code: "000660", name: "SK하이닉스", type: "분기보고서 제출", time: "어제" },
  { code: "035720", name: "카카오", type: "자기주식 처분 신탁 계약", time: "2일 전" },
  { code: "035420", name: "NAVER", type: "회사분할 결정", time: "3일 전" },
  { code: "207940", name: "삼성바이오로직스", type: "유상증자 결정 (₩2조)", time: "1주 전" },
];

const EARNINGS_CALENDAR = [
  { code: "005930", name: "삼성전자", date: "2026-07-31", consensus: "12.4조" },
  { code: "000660", name: "SK하이닉스", date: "2026-07-29", consensus: "5.8조" },
  { code: "035720", name: "카카오", date: "2026-08-02", consensus: "3,400억" },
  { code: "035420", name: "NAVER", date: "2026-08-05", consensus: "4,200억" },
];

const SECTORS = [
  { name: "반도체", changePct: 2.1, status: "up" as const },
  { name: "자동차", changePct: 0.8, status: "up" as const },
  { name: "2차전지", changePct: 3.4, status: "up" as const },
  { name: "바이오", changePct: -1.3, status: "down" as const },
  { name: "금융", changePct: 0.4, status: "up" as const },
  { name: "조선", changePct: -0.7, status: "down" as const },
  { name: "건설", changePct: -2.1, status: "down" as const },
  { name: "유통", changePct: 0.2, status: "up" as const },
];

// ─── 카드 ───

export function LongtermDisclosureCard() {
  return (
    <CardContainer
      title="공시 · 실적·배당·증자"
      emoji="📊"
      subtitle="DART"
      hint="Layer 1 — DART 필터링 (실적·배당·증자만)"
    >
      <ul className="space-y-2">
        {LONGTERM_DISCLOSURES.map((d, i) => (
          <li
            key={`${d.code}-${i}`}
            className="flex items-start justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-start gap-2 min-w-0">
              <FileText size={12} className="text-unjong-muted flex-shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {d.name}
                </span>
                <span className="text-[10px] text-unjong-muted leading-tight">
                  {d.type}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-unjong-muted flex-shrink-0">
              {d.time}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function EarningsCalendarCard() {
  return (
    <CardContainer
      title="분기 실적 캘린더"
      emoji="📅"
      subtitle="발표 예정"
      hint="Layer 1 — 자체 캘린더 + 컨센서스 데이터"
    >
      <ul className="space-y-2">
        {EARNINGS_CALENDAR.map((e) => (
          <li
            key={e.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar size={12} className="text-unjong-muted flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {e.name}
                </span>
                <span className="text-[10px] text-unjong-muted">{e.date}</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-unjong-accent flex-shrink-0">
              {e.consensus}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function SectorCard() {
  return (
    <CardContainer
      title="섹터 히트맵"
      emoji="🗺️"
      subtitle="업종별 등락"
      hint="Layer 1 — KIS sector API + 히트맵 그래픽"
    >
      <div className="grid grid-cols-2 gap-1.5">
        {SECTORS.map((s) => (
          <div
            key={s.name}
            className={`flex items-center justify-between rounded px-2 py-1.5 text-xs cursor-pointer ${
              s.status === "up"
                ? "bg-unjong-success/10 hover:bg-unjong-success/20"
                : "bg-unjong-danger/10 hover:bg-unjong-danger/20"
            }`}
          >
            <span className="font-medium text-unjong-primary">{s.name}</span>
            <span
              className={`font-semibold text-[11px] ${
                s.status === "up" ? "text-unjong-success" : "text-unjong-danger"
              }`}
            >
              {s.status === "up" ? "+" : ""}
              {s.changePct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}
```

⚠️ `bg-unjong-success/10` 같은 opacity 클래스가 작동 안 하면 `bg-emerald-50`, `bg-red-50` 등으로 폴백.

---

## 작업 5 — `components/cards/UsCards.tsx` (미국주식창 3개)

```tsx
import { TrendingUp, TrendingDown, Newspaper } from "lucide-react";
import { CardContainer } from "./CardContainer";

// ─── 더미 데이터 ───

const GLOBAL_INDICES = [
  { name: "S&P 500", value: "5,234.12", changePct: 0.87, isUp: true },
  { name: "Nasdaq", value: "16,891.50", changePct: 1.12, isUp: true },
  { name: "Dow", value: "39,127.14", changePct: 0.45, isUp: true },
  { name: "Russell 2000", value: "2,108.55", changePct: -0.23, isUp: false },
  { name: "VIX", value: "18.42", changePct: -2.14, isUp: false },
];

const US_MOVERS = [
  { code: "NVDA", name: "NVIDIA", price: "$880.50", changePct: 5.4 },
  { code: "TSLA", name: "Tesla", price: "$247.18", changePct: 4.2 },
  { code: "AAPL", name: "Apple", price: "$195.34", changePct: 2.1 },
  { code: "META", name: "Meta", price: "$528.40", changePct: 1.8 },
  { code: "MSFT", name: "Microsoft", price: "$432.10", changePct: 1.5 },
];

const US_NEWS = [
  { title: "Fed signals dovish pivot — rate cut probability rises", source: "Bloomberg", time: "1h ago" },
  { title: "NVIDIA beats Q2 earnings, raises full-year guidance", source: "CNBC", time: "3h ago" },
  { title: "Tesla announces new Gigafactory in India", source: "Reuters", time: "5h ago" },
  { title: "Apple Vision Pro 2 launch confirmed for Q4 2026", source: "WSJ", time: "8h ago" },
  { title: "Inflation data comes in below expectations", source: "Bloomberg", time: "12h ago" },
];

// ─── 카드 ───

export function GlobalIndicesCard() {
  return (
    <CardContainer
      title="글로벌 지수"
      emoji="🌐"
      subtitle="S&P/Nasdaq/Dow/VIX"
      hint="Layer 1 — Yahoo Finance 실시간 + VIX 추가"
    >
      <ul className="space-y-2">
        {GLOBAL_INDICES.map((idx) => (
          <li
            key={idx.name}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <span className="font-medium text-unjong-primary">{idx.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-unjong-primary tabular-nums">
                {idx.value}
              </span>
              <span
                className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                  idx.isUp ? "text-unjong-success" : "text-unjong-danger"
                }`}
              >
                {idx.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {idx.isUp ? "+" : ""}
                {idx.changePct.toFixed(2)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function UsMoversCard() {
  return (
    <CardContainer
      title="미국 Movers"
      emoji="🇺🇸"
      subtitle="정규장 TOP"
      hint="Layer 1 — Yahoo Finance Movers API"
    >
      <ul className="space-y-2">
        {US_MOVERS.map((m, i) => (
          <li
            key={m.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-unjong-muted font-mono w-4 text-right">
                {i + 1}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary">{m.code}</span>
                <span className="text-[10px] text-unjong-muted truncate">
                  {m.name}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="font-semibold text-unjong-primary tabular-nums">
                {m.price}
              </span>
              <span className="text-[10px] text-unjong-success font-semibold">
                +{m.changePct.toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function UsNewsCard() {
  return (
    <CardContainer
      title="미국 뉴스"
      emoji="📰"
      subtitle="Bloomberg/CNBC/WSJ"
      hint="Layer 1 — RSS 통합 + 8-K (SEC EDGAR) 추가"
    >
      <ul className="space-y-3">
        {US_NEWS.map((n, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <Newspaper size={12} className="text-unjong-muted flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0 gap-0.5">
              <span className="font-medium text-unjong-primary leading-snug">
                {n.title}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-unjong-muted">
                <span className="font-semibold">{n.source}</span>
                <span>·</span>
                <span>{n.time}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}
```

---

## 작업 6 — 각 페이지에서 카드 import + 그리드 배치

### `app/(windows)/scalper/page.tsx` 업데이트

```tsx
import type { Metadata } from "next";
import {
  MoversCard,
  VolumeCard,
  ScalperDisclosureCard,
} from "@/components/cards/ScalperCards";

export const metadata: Metadata = {
  title: "단타창",
  description:
    "운종(雲從) 단타창 — 장중 09:00~15:30 액티브 트레이더의 데스크. " +
    "Movers · Volume · VI · NetBuy · 공시 · 테마 · 공매도.",
};

export default function ScalperPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* 페이지 헤더 */}
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <h1 className="text-xl font-bold text-unjong-primary">⚡ 단타창</h1>
        <p className="mt-1 text-xs text-unjong-muted">
          장중 09:00~15:30 — 액티브 트레이더의 데스크
        </p>
      </div>

      {/* 카드 그리드 (Layer 0: 3개 / Layer 1: 7개 확장 예정) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MoversCard />
        <VolumeCard />
        <ScalperDisclosureCard />
      </div>

      {/* Layer 1 안내 */}
      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-4 text-center">
        <p className="text-xs text-unjong-muted">
          Layer 1 예정 카드: VI 발동/해제 · NetBuy + 거래원 · 테마 TOP10 · 공매도 잔고
        </p>
      </div>
    </div>
  );
}
```

### `app/(windows)/longterm/page.tsx` 업데이트

```tsx
import type { Metadata } from "next";
import {
  LongtermDisclosureCard,
  EarningsCalendarCard,
  SectorCard,
} from "@/components/cards/LongtermCards";

export const metadata: Metadata = {
  title: "장타창",
  description:
    "운종(雲從) 장타창 — 가치투자자·장기보유자의 데스크. " +
    "공시 · 분기실적 · 저평가 · 배당 · 신저가 · 섹터 · 관리종목.",
};

export default function LongtermPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <h1 className="text-xl font-bold text-unjong-primary">🌳 장타창</h1>
        <p className="mt-1 text-xs text-unjong-muted">
          저녁·주말 — 가치투자자·장기보유자의 데스크
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <LongtermDisclosureCard />
        <EarningsCalendarCard />
        <SectorCard />
      </div>

      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-4 text-center">
        <p className="text-xs text-unjong-muted">
          Layer 1 예정 카드: 저평가 종목 랭킹 · 배당 캘린더 + 수익률 TOP · 52주 신저가 우량주 · 관리종목·투자유의
        </p>
      </div>
    </div>
  );
}
```

### `app/(windows)/us/page.tsx` 업데이트

```tsx
import type { Metadata } from "next";
import {
  GlobalIndicesCard,
  UsMoversCard,
  UsNewsCard,
} from "@/components/cards/UsCards";

export const metadata: Metadata = {
  title: "미국주식창",
  description:
    "운종(雲從) 미국주식창 — 미장 투자자의 새벽 데스크. " +
    "S&P/Nasdaq/VIX · Pre/After · M7 · Movers · 환율 · 뉴스+8K · FOMC.",
};

export default function UsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <h1 className="text-xl font-bold text-unjong-primary">🌙 미국주식창</h1>
        <p className="mt-1 text-xs text-unjong-muted">
          새벽 22:30~05:00 — 미장 투자자의 데스크
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <GlobalIndicesCard />
        <UsMoversCard />
        <UsNewsCard />
      </div>

      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-4 text-center">
        <p className="text-xs text-unjong-muted">
          Layer 1 예정 카드: Pre/After-hours TOP · Magnificent 7 · USD/KRW 환율 + 시계 · FOMC·CPI·NFP 캘린더
        </p>
      </div>
    </div>
  );
}
```

---

## 작업 7 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

**확인 사항**:
- 빌드 성공, TypeScript 오류 0
- 3개 라우트 빌드됨 (`/scalper` `/longterm` `/us`)
- 새 컴포넌트 4개 (`components/cards/*.tsx`) 컴파일 OK
- `bg-unjong-success/10` 같은 opacity 클래스 작동 여부 확인 — 안 되면 폴백

---

## 작업 8 — git commit + push

빌드 성공 확인 후:

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/cards
git add "app/(windows)"
git add docs/STEP_92_COMMAND.md
git status
git commit -m "feat: STEP 92 - 메인 카드 그리드 (창별 3개씩 Layer 0)

- components/cards/CardContainer.tsx — 공통 wrapper (헤더+바디+힌트 푸터)
- components/cards/ScalperCards.tsx — Movers / Volume / 공시 (단타창)
- components/cards/LongtermCards.tsx — 공시 / 분기실적 / 섹터 (장타창)
- components/cards/UsCards.tsx — 글로벌지수 / 미국Movers / 미국뉴스 (미국주식창)
- 각 page.tsx 에 카드 import + 반응형 그리드 (md:2 xl:3)
- Layer 1 예정 카드 4개씩 점선 안내 박스로 시각화
- 모든 데이터 더미 (Layer 1 에서 실 API 연결)
- 다음 STEP 93: 우측 사이드패널 (종목 클릭 시 차트/호가/체결)"
git push
```

---

## 검증 체크리스트

- [ ] `components/cards/` 폴더 + 4개 컴포넌트 파일 존재
- [ ] CardContainer wrapper 가 9개 카드 (3창 × 3) 에 일관 적용
- [ ] 3개 페이지의 카드 그리드 정상 표시 (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`)
- [ ] Layer 1 예정 카드 4개씩 점선 박스 안내
- [ ] `npm run build` 성공
- [ ] git commit + push 완료
- [ ] opacity 클래스 (`/10`) 폴백 여부 보고

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 92 완료. 메인 카드 그리드 (창별 3개씩) 끝.
- CardContainer 공통 wrapper
- 9개 카드 (3창 × 3) 더미 시각화:
  · 단타창: Movers (TOP5), Volume (3배+), 공시 (실시간)
  · 장타창: 공시 (실적·배당), 분기실적 캘린더, 섹터 히트맵 (2×4 그리드)
  · 미국주식창: 글로벌 지수 (+VIX), 미국 Movers, 미국 뉴스
- 반응형 그리드 (모바일 1열 / 태블릿 2열 / 데스크탑 3열)
- Layer 1 예정 카드 4개씩 점선 박스로 자리 안내
- 빌드 클린, git push 완료 (커밋 [해시])
- opacity 클래스 폴백 여부: [yes/no]

다음 STEP 93 (우측 사이드패널 — 종목 클릭 시 차트/호가/체결) 명령서 받을 준비 됨.

브라우저에서 확인:
  http://localhost:3333/scalper → Movers/Volume/공시 카드 3개
  http://localhost:3333/longterm → 공시/실적/섹터 카드 3개
  http://localhost:3333/us → 지수/Movers/뉴스 카드 3개
```

---

## ⚠️ 주의 사항

1. **모든 데이터 더미** — Layer 1 에서 실 API 연결. 지금 실데이터 끌어오려 시도 X
2. **CardContainer wrapper 통일** — 9개 카드 디자인 일관성. Layer 1 확장 쉽게
3. **그리드 반응형** — `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` 표준. 모바일 우선
4. **카드 안 내용 스크롤** — `overflow-y-auto + min-h-0` (CardContainer 안에 이미 적용)
5. **Layer 1 안내 박스** — 점선 테두리로 "여기 카드 더 들어옴" 시각화. 사용자 기대치 명확
6. **기존 V3 위젯 import 안 함** — STEP 91 WatchlistPanel 같은 의존성 함정 회피
7. **console.log 남기지 말 것** — CLAUDE.md 규칙
8. **빌드 깨지면 즉시 멈추고 보고** — 강제 진행 금지
