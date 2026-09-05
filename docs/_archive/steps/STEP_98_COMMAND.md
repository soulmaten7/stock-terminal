<!-- 2026-05-27 -->
# STEP 98 — 미국주식창 카드 4개 추가 (Pre/After · M7 · 환율·시계 · FOMC)

> **목표**: 미국주식창 카드 3개 → 7개 완성. 미장 투자자 채팅 흐름과 화면 정보 100% 동기화. **21개 카드 (3창 × 7개) 시각화 완성**.
> **세션**: #25 (Layer 1)
> **전제**: STEP 97 완료 (`c08696d`), 단타창·장타창 7개씩 완성
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 5-3 (미국주식창 카드 7개)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_98_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **Layer 0 단계 — 더미 데이터로 시각화만**
2. **카드 패턴 STEP 96/97 과 동일** — CardContainer wrapper 재사용
3. **카드 id = ContextNav 매핑과 정확히 일치** — `card-prepost`, `card-m7`, `card-forex`, `card-fomc`
4. **그리드 = 2열** (`md:grid-cols-2`) — STEP 95-D 패턴
5. **한국 미장 투자자 시각** — 환율 + 한국·미국 시간 차이 반영
6. **이게 마지막 카드 STEP** — 21개 카드 완성 (3창 × 7개)

---

## 작업 1 — `components/cards/UsCards.tsx` 확장

기존 3개 카드 (GlobalIndicesCard / UsMoversCard / UsNewsCard) 에 4개 추가.

### 추가할 더미 데이터 (파일 상단 const 영역)

```tsx
// ─── Pre-market / After-hours 변동 TOP ───
const PRE_AFTER_HOURS = [
  { code: "NVDA", name: "NVIDIA", session: "Pre" as const, price: "$895.20", changePct: 2.4, volume: "524K" },
  { code: "TSLA", name: "Tesla", session: "AH" as const, price: "$242.85", changePct: -1.8, volume: "1.2M" },
  { code: "META", name: "Meta", session: "AH" as const, price: "$544.80", changePct: 3.1, volume: "856K" },
  { code: "AAPL", name: "Apple", session: "Pre" as const, price: "$197.10", changePct: 0.9, volume: "312K" },
  { code: "MSFT", name: "Microsoft", session: "Pre" as const, price: "$437.50", changePct: 1.2, volume: "287K" },
  { code: "AMD", name: "AMD", session: "AH" as const, price: "$152.30", changePct: -2.1, volume: "642K" },
];

// ─── Magnificent 7 ───
const MAGNIFICENT_7 = [
  { code: "NVDA", name: "NVIDIA", price: "$880.50", changePct: 5.4, marketCap: "$2.17T" },
  { code: "AAPL", name: "Apple", price: "$195.34", changePct: 2.1, marketCap: "$3.01T" },
  { code: "MSFT", name: "Microsoft", price: "$432.10", changePct: 1.5, marketCap: "$3.21T" },
  { code: "GOOG", name: "Alphabet", price: "$172.85", changePct: 0.8, marketCap: "$2.14T" },
  { code: "AMZN", name: "Amazon", price: "$186.42", changePct: 1.2, marketCap: "$1.94T" },
  { code: "META", name: "Meta", price: "$528.40", changePct: 1.8, marketCap: "$1.34T" },
  { code: "TSLA", name: "Tesla", price: "$247.18", changePct: 4.2, marketCap: "$786B" },
];

// ─── FOMC·CPI·NFP 캘린더 ───
const ECON_CALENDAR = [
  { date: "12/18", event: "FOMC 회의", importance: "high" as const, daysLeft: 21 },
  { date: "12/12", event: "CPI 발표 (11월)", importance: "high" as const, daysLeft: 15 },
  { date: "12/05", event: "NFP 발표 (11월)", importance: "high" as const, daysLeft: 8 },
  { date: "11/28", event: "GDP 발표 (Q3 잠정)", importance: "medium" as const, daysLeft: 1 },
  { date: "12/03", event: "ISM 제조업 PMI", importance: "medium" as const, daysLeft: 6 },
  { date: "12/06", event: "소비자심리지수", importance: "low" as const, daysLeft: 9 },
];
```

### 카드 컴포넌트 4개 추가

기존 UsCards.tsx 의 끝에 추가:

```tsx
import { Sunrise, Moon, Star, DollarSign, Clock, CalendarCheck } from "lucide-react";

// ───────── Pre-market / After-hours 카드 ─────────
export function PreAfterMarketCard() {
  return (
    <CardContainer
      id="card-prepost"
      title="Pre-market / After-hours"
      emoji="🌅"
      subtitle="시간외 변동 TOP"
      hint="Layer 1 — Yahoo Finance pre/post-market quote"
    >
      <ul className="space-y-2">
        {PRE_AFTER_HOURS.map((item, i) => {
          const isUp = item.changePct >= 0;
          const isPre = item.session === "Pre";
          return (
            <li
              key={`${item.code}-${i}`}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isPre
                      ? "bg-amber-100 text-amber-700"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {isPre ? "Pre" : "AH"}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-unjong-muted truncate">
                    {item.name} · {item.volume}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary tabular-nums">
                  {item.price}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    isUp ? "text-unjong-success" : "text-unjong-danger"
                  }`}
                >
                  {isUp ? "+" : ""}
                  {item.changePct.toFixed(1)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

// ───────── Magnificent 7 카드 ─────────
export function Magnificent7Card() {
  return (
    <CardContainer
      id="card-m7"
      title="Magnificent 7"
      emoji="⭐"
      subtitle="미국 7대 대장주"
      hint="Layer 1 — Yahoo Finance batch quote"
    >
      <ul className="space-y-1.5">
        {MAGNIFICENT_7.map((m) => {
          const isUp = m.changePct >= 0;
          return (
            <li
              key={m.code}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Star size={11} className="text-unjong-accent flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary">{m.code}</span>
                  <span className="text-[10px] text-unjong-muted">
                    {m.marketCap}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary tabular-nums">
                  {m.price}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    isUp ? "text-unjong-success" : "text-unjong-danger"
                  }`}
                >
                  {isUp ? "+" : ""}
                  {m.changePct.toFixed(2)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

// ───────── USD/KRW + 미국 시계 카드 ─────────
export function ForexClockCard() {
  return (
    <CardContainer
      id="card-forex"
      title="USD/KRW + 미국 시계"
      emoji="💱"
      subtitle="환율 · 시장 상태"
      hint="Layer 1 — 한국은행 환율 + 실시간 미국 시간"
    >
      <div className="space-y-3">
        {/* 환율 */}
        <div className="rounded-lg border border-unjong-border p-3 bg-unjong-background">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-unjong-muted uppercase">
              USD / KRW
            </span>
            <DollarSign size={12} className="text-unjong-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-unjong-primary tabular-nums">
              1,387.50
            </span>
            <span className="text-xs font-semibold text-unjong-success">
              +0.20% (+₩2.80)
            </span>
          </div>
        </div>

        {/* 미국 시계 + 시장 상태 */}
        <div className="rounded-lg border border-unjong-border p-3 bg-unjong-background">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-unjong-muted uppercase">
              미국 시간 (EST)
            </span>
            <Clock size={12} className="text-unjong-accent" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xl font-bold text-unjong-primary tabular-nums">
              09:34
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
              REGULAR
            </span>
          </div>
          <div className="space-y-0.5 text-[10px] text-unjong-muted">
            <div className="flex justify-between">
              <span>한국 시간</span>
              <span className="font-semibold text-unjong-primary">23:34</span>
            </div>
            <div className="flex justify-between">
              <span>마감까지</span>
              <span className="font-semibold text-unjong-primary">6h 26m</span>
            </div>
          </div>
        </div>
      </div>
    </CardContainer>
  );
}

// ───────── FOMC·CPI·NFP 캘린더 카드 ─────────
export function FOMCCalendarCard() {
  return (
    <CardContainer
      id="card-fomc"
      title="FOMC·CPI·NFP 캘린더"
      emoji="📅"
      subtitle="미국 거시 이벤트"
      hint="Layer 1 — Investing.com 위젯 또는 자체 수집"
    >
      <ul className="space-y-2">
        {ECON_CALENDAR.map((e, i) => {
          const importanceColor =
            e.importance === "high"
              ? "bg-red-100 text-red-700"
              : e.importance === "medium"
              ? "bg-orange-100 text-orange-700"
              : "bg-slate-100 text-slate-600";
          const importanceDots =
            e.importance === "high"
              ? "★★★"
              : e.importance === "medium"
              ? "★★"
              : "★";
          return (
            <li
              key={`${e.date}-${i}`}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-start gap-2 min-w-0">
                <CalendarCheck size={11} className="text-unjong-muted flex-shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-unjong-primary tabular-nums">
                      {e.date}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${importanceColor}`}>
                      {importanceDots}
                    </span>
                  </div>
                  <span className="text-[10px] text-unjong-muted leading-tight">
                    {e.event}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-unjong-accent flex-shrink-0">
                D-{e.daysLeft}
              </span>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}
```

⚠️ `bg-amber-100`, `bg-indigo-100`, `bg-emerald-100`, `bg-red-100`, `bg-orange-100`, `bg-slate-100`, `text-emerald-600` 등 표준 Tailwind 사용 (STEP 96/97 폴백 패턴 동일).

⚠️ `lucide-react` 아이콘 import: `Sunrise`, `Moon`, `Star`, `DollarSign`, `Clock`, `CalendarCheck`.

⚠️ **CardContainer 에 `id` prop 전달** — 4개 카드 모두 명시.

---

## 작업 2 — 기존 3개 카드 id 확인·추가

UsCards.tsx 의 기존 3개 카드에 id 가 있는지 확인:

```tsx
export function GlobalIndicesCard() {
  return <CardContainer id="card-indices" ...>...</CardContainer>;
}

export function UsMoversCard() {
  return <CardContainer id="card-movers" ...>...</CardContainer>;
}

export function UsNewsCard() {
  return <CardContainer id="card-news" ...>...</CardContainer>;
}
```

없으면 추가. ContextNav 매핑과 일치해야 함:
- card-indices → 지수+VIX
- card-prepost → Pre/After ⭐신규
- card-m7 → M7 ⭐신규
- card-movers → Movers
- card-forex → 환율+시계 ⭐신규
- card-news → 뉴스+8K
- card-fomc → FOMC ⭐신규

---

## 작업 3 — `app/(windows)/us/page.tsx` 업데이트

7개 카드 import + 그리드 배치.

```tsx
import type { Metadata } from "next";
import {
  GlobalIndicesCard,
  PreAfterMarketCard,
  Magnificent7Card,
  UsMoversCard,
  ForexClockCard,
  UsNewsCard,
  FOMCCalendarCard,
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
      {/* 카드 그리드 7개 (2열, 4행) — 페이지 헤더 박스 / Layer 1 안내 박스 없음 (STEP 95-D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlobalIndicesCard />
        <PreAfterMarketCard />
        <Magnificent7Card />
        <UsMoversCard />
        <ForexClockCard />
        <UsNewsCard />
        <FOMCCalendarCard />
      </div>
    </div>
  );
}
```

### 카드 배치 순서 — 미장 투자자 동선

```
[1행] 지수+VIX        Pre/After         ← 시장 분위기 + 시간외
[2행] M7              Movers            ← 대장주 + 등락 TOP
[3행] 환율+시계       뉴스+8K           ← 환차 + 정보 흐름
[4행] FOMC 캘린더     (빈 칸)            ← 거시 이벤트
```

→ **분위기·시간외** (장 전후) → **종목** (대장주 + Movers) → **환율·뉴스** (한국 미장 투자자 핵심) → **이벤트** (거시 일정)

---

## 작업 4 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- UsCards.tsx 의 새 카드 4개 정상 컴파일
- us 페이지에 카드 7개 표시
- 각 카드 id 정상

---

## 작업 5 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/cards/UsCards.tsx
git add "app/(windows)/us/page.tsx"
git add docs/STEP_98_COMMAND.md
git status
git commit -m "feat: STEP 98 - 미국주식창 카드 4개 추가 (Pre/After · M7 · 환율·시계 · FOMC)

- PreAfterMarketCard: Pre/After-hours 시간외 변동 TOP (6건 더미)
  · NVDA Pre +2.4% · TSLA AH -1.8% · META AH +3.1%
- Magnificent7Card: 미국 7대 대장주 한 화면 (NVDA/AAPL/MSFT/GOOG/AMZN/META/TSLA)
  · 시가총액 + 등락률 표시
- ForexClockCard: USD/KRW 환율 + 미국 시계 + 한국 시간 + 마감까지
  · REGULAR/PRE-MARKET/AFTER-HOURS 상태 배지
- FOMCCalendarCard: FOMC·CPI·NFP·GDP·PMI 미국 거시 이벤트 (6건)
  · 중요도 ★★★/★★/★ 표시 + D-day

- us/page.tsx: 카드 3개 → 7개 그리드 (md:grid-cols-2, 4행)
- 모든 카드에 id 추가 (ContextNav 앵커 점프 연결):
  card-prepost · card-m7 · card-forex · card-fomc

미장 투자자 채팅 메시지 100% 화면 동기화:
- 'NVDA AH 변동성' → PreAfterMarketCard
- 'M7 다 빨강' → Magnificent7Card
- '환율 1387 위로' → ForexClockCard
- 'FOMC 매파적' → FOMCCalendarCard

🏁 21개 카드 (3창 × 7개) 시각화 완성.
다음: Layer 1 실데이터 연결 또는 Layer 2 광고 허브."
git push
```

---

## 검증 체크리스트

- [ ] UsCards.tsx 에 4개 신규 카드 (`PreAfterMarketCard`, `Magnificent7Card`, `ForexClockCard`, `FOMCCalendarCard`)
- [ ] 3개 더미 데이터 상수 추가 (`PRE_AFTER_HOURS`, `MAGNIFICENT_7`, `ECON_CALENDAR`)
- [ ] 기존 3개 카드 (`GlobalIndicesCard`, `UsMoversCard`, `UsNewsCard`) 도 id prop 있는지 확인 (없으면 추가)
- [ ] us/page.tsx 가 7개 카드 import + 2열 그리드
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
🏁 STEP 98 완료. 미국주식창 카드 4개 추가 (7개 완성).
21개 카드 (3창 × 7개) 시각화 100% 완성.

신규 카드 더미 시각화:
- Pre/After (PreAfter): NVDA Pre +2.4% · TSLA AH -1.8% · META AH +3.1% (6건)
- M7 (Magnificent7): 7대 대장주 시총·등락 한 화면
- 환율+시계 (Forex+Clock): USD/KRW 1,387.50 · EST 09:34 REGULAR · 한국 23:34
- FOMC 캘린더: 12/18 FOMC ★★★ · 12/12 CPI ★★★ · 12/05 NFP ★★★

미장 채팅 ↔ 화면 동기화 100%:
- 'NVDA AH 변동성' → PreAfterMarketCard ✅
- 'M7 다 빨강' → Magnificent7Card ✅
- '환율 1387 위로' → ForexClockCard ✅
- 'FOMC 매파적' → FOMCCalendarCard ✅

빌드 클린, git push 완료 (커밋 [해시])

운종 Layer 0 + 카드 21개 시각화 완성:
- Layer 0 (8 STEP) ✅
- 단타창 7개 ✅
- 장타창 7개 ✅
- 미국주식창 7개 ✅
- 헤더 4단 통합 + ContextNav ✅
- 좌측 사이드 비율 고정 ✅

다음 단계 후보:
1. Layer 1 시작 — Supabase Realtime 채팅 실시간
2. Layer 1 시작 — 카드 실데이터 연결 (KIS · Yahoo)
3. Layer 2 시작 — 광고 허브 + 사이트 모아보기
4. 헤더 또는 카드 디자인 추가 미세조정
```

---

## ⚠️ 주의 사항

1. **더미 데이터만** — 실 API 호출 시도 X
2. **CardContainer wrapper 재사용** — STEP 96/97 패턴 동일
3. **id 명명 일관성** — ContextNav 의 `/us` 매핑과 정확히 일치 (`card-prepost`, `card-m7`, `card-forex`, `card-fomc`)
4. **2열 그리드 (`md:grid-cols-2`)** — xl:grid-cols-3 절대 X
5. **페이지 헤더 박스 / Layer 1 안내 박스 추가 X** — STEP 95-D 에서 제거됨, 유지
6. **ForexClockCard 의 시간은 정적 더미** — Layer 1 에서 실시간 시계 (1초마다 갱신) 연결
7. **색상은 표준 Tailwind 폴백** — `bg-amber-100`, `bg-indigo-100`, `bg-emerald-100` 등
8. **console.log 남기지 말 것**
9. **빌드 깨지면 즉시 보고**
