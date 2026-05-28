<!-- 2026-05-27 -->
# STEP 97 — 장타창 카드 4개 추가 (저평가 · 배당TOP · 신저가 · 관리종목)

> **목표**: 장타창 카드 3개 → 7개 완성. 가치투자자 채팅 흐름과 화면 정보 100% 동기화.
> **세션**: #25 (Layer 1)
> **전제**: STEP 95-D 완료 (`03fd1ed`), 단타창 7개 + 헤더 통합 완성
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 5-3 (장타창 카드 7개)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_97_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **Layer 0 단계 — 더미 데이터로 시각화만**
2. **카드 패턴 STEP 96 (단타창) 과 동일** — CardContainer wrapper 재사용
3. **카드 id = ContextNav 매핑과 정확히 일치** — `card-value`, `card-dividend`, `card-lows`, `card-warning`
4. **그리드 = 2열** (`md:grid-cols-2`) — STEP 95-D 패턴
5. **빌드 깨지면 즉시 보고**

---

## 작업 1 — `components/cards/LongtermCards.tsx` 확장

기존 3개 카드 (LongtermDisclosureCard / EarningsCalendarCard / SectorCard) 에 4개 추가.

### 추가할 더미 데이터 (파일 상단 const 영역)

```tsx
// ─── 저평가 종목 랭킹 (PER/PBR/ROE 조합) ───
const VALUE_STOCKS = [
  { code: "105560", name: "KB금융", per: 6.2, pbr: 0.5, roe: 11.2, score: "A+" },
  { code: "029780", name: "삼성카드", per: 7.8, pbr: 0.7, roe: 9.5, score: "A" },
  { code: "316140", name: "우리금융지주", per: 5.9, pbr: 0.4, roe: 10.8, score: "A+" },
  { code: "055550", name: "신한지주", per: 6.5, pbr: 0.5, roe: 10.3, score: "A" },
  { code: "012330", name: "현대모비스", per: 8.2, pbr: 0.6, roe: 8.5, score: "B+" },
];

// ─── 배당 캘린더 + 수익률 TOP ───
const DIVIDEND_TOP = [
  { code: "030200", name: "KT", yield: 6.45, exDate: "12/27", dividend: "1,950원" },
  { code: "029780", name: "삼성카드", yield: 5.82, exDate: "12/27", dividend: "2,400원" },
  { code: "086790", name: "하나금융지주", yield: 5.43, exDate: "12/27", dividend: "3,800원" },
  { code: "138930", name: "BNK금융지주", yield: 5.21, exDate: "12/27", dividend: "510원" },
  { code: "000990", name: "DB하이텍", yield: 4.85, exDate: "06/30", dividend: "1,800원" },
];

// ─── 52주 신저가 우량주 ───
const LOWS_52W = [
  { code: "051910", name: "LG화학", price: "380,000", lowPct: -32, marketCap: "27조", grade: "우량" as const },
  { code: "096770", name: "SK이노베이션", price: "95,800", lowPct: -28, marketCap: "9.5조", grade: "우량" as const },
  { code: "005490", name: "POSCO홀딩스", price: "342,500", lowPct: -24, marketCap: "30조", grade: "우량" as const },
  { code: "068270", name: "셀트리온", price: "165,200", lowPct: -19, marketCap: "35조", grade: "우량" as const },
  { code: "009830", name: "한화솔루션", price: "28,400", lowPct: -22, marketCap: "4.6조", grade: "우량" as const },
];

// ─── 관리종목·투자유의·단기과열 ───
const WARNING_STOCKS = [
  { code: "000000", name: "△△텔레콤", type: "관리종목" as const, reason: "영업적자 2년 연속", severity: "high" as const },
  { code: "000001", name: "○○에너지", type: "투자유의" as const, reason: "자본잠식 50% 초과", severity: "high" as const },
  { code: "000002", name: "××바이오", type: "단기과열" as const, reason: "거래량 급증 + 주가 급등", severity: "medium" as const },
  { code: "000003", name: "□□건설", type: "관리종목" as const, reason: "감사보고서 의견거절", severity: "high" as const },
  { code: "000004", name: "▽▽전자", type: "투자유의" as const, reason: "관리종목 지정 우려", severity: "medium" as const },
];
```

### 카드 컴포넌트 4개 추가

기존 LongtermCards.tsx 의 끝에 추가:

```tsx
import { Gem, Coins, TrendingDown, AlertTriangle } from "lucide-react";

// ───────── 저평가 종목 카드 ─────────
export function ValueScreenCard() {
  return (
    <CardContainer
      id="card-value"
      title="저평가 종목 랭킹"
      emoji="💎"
      subtitle="PER · PBR · ROE 조합"
      hint="Layer 1 — quant_factors DB + 동종 업종 비교"
    >
      <ul className="space-y-2">
        {VALUE_STOCKS.map((v) => (
          <li
            key={v.code}
            className="flex flex-col gap-1 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gem size={11} className="text-unjong-accent" />
                <span className="font-medium text-unjong-primary">
                  {v.name}
                </span>
                <span className="text-[10px] text-unjong-muted">{v.code}</span>
              </div>
              <span className="text-[10px] font-bold text-unjong-accent bg-amber-100 px-1.5 py-0.5 rounded">
                {v.score}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] pl-5">
              <span>
                <span className="text-unjong-muted">PER</span>{" "}
                <span className="font-semibold text-unjong-primary">{v.per.toFixed(1)}</span>
              </span>
              <span>
                <span className="text-unjong-muted">PBR</span>{" "}
                <span className="font-semibold text-unjong-primary">{v.pbr.toFixed(1)}</span>
              </span>
              <span>
                <span className="text-unjong-muted">ROE</span>{" "}
                <span className="font-semibold text-unjong-success">{v.roe.toFixed(1)}%</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

// ───────── 배당 TOP 카드 ─────────
export function DividendTopCard() {
  return (
    <CardContainer
      id="card-dividend"
      title="배당 캘린더 + 수익률 TOP"
      emoji="💰"
      subtitle="배당락일 임박 순"
      hint="Layer 1 — DART 배당 공시 + 자체 캘린더"
    >
      <ul className="space-y-2">
        {DIVIDEND_TOP.map((d) => (
          <li
            key={d.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <Coins size={11} className="text-unjong-accent" />
                <span className="font-medium text-unjong-primary truncate">
                  {d.name}
                </span>
              </div>
              <span className="text-[10px] text-unjong-muted pl-5">
                {d.dividend} · 배당락 {d.exDate}
              </span>
            </div>
            <span className="text-sm font-bold text-unjong-success flex-shrink-0">
              {d.yield.toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

// ───────── 52주 신저가 우량주 카드 ─────────
export function Lows52WCard() {
  return (
    <CardContainer
      id="card-lows"
      title="52주 신저가 우량주"
      emoji="📉"
      subtitle="줍줍 시그널 (시총 1조+ 필터)"
      hint="Layer 1 — stock_prices + 시가총액 필터"
    >
      <ul className="space-y-2">
        {LOWS_52W.map((s) => (
          <li
            key={s.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <TrendingDown size={11} className="text-unjong-danger" />
                <span className="font-medium text-unjong-primary truncate">
                  {s.name}
                </span>
                <span className="text-[9px] font-bold text-unjong-accent bg-amber-100 px-1 py-0.5 rounded">
                  {s.grade}
                </span>
              </div>
              <span className="text-[10px] text-unjong-muted pl-5">
                시총 {s.marketCap}
              </span>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="font-semibold text-unjong-primary tabular-nums">
                {s.price}
              </span>
              <span className="text-[10px] text-unjong-danger font-semibold">
                52주最 {s.lowPct.toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

// ───────── 관리종목·투자유의 카드 ─────────
export function WarningStockCard() {
  return (
    <CardContainer
      id="card-warning"
      title="관리종목·투자유의"
      emoji="⚠️"
      subtitle="위험 회피 시그널"
      hint="Layer 1 — KRX 공식 지정 종목 데이터"
    >
      <ul className="space-y-2">
        {WARNING_STOCKS.map((w, i) => {
          const typeColor =
            w.type === "관리종목"
              ? "bg-red-100 text-red-700"
              : w.type === "투자유의"
              ? "bg-orange-100 text-orange-700"
              : "bg-yellow-100 text-yellow-700";
          return (
            <li
              key={`${w.code}-${i}`}
              className="flex items-start justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-start gap-2 min-w-0">
                <AlertTriangle size={11} className="text-unjong-danger flex-shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-unjong-primary truncate">
                      {w.name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeColor}`}>
                      {w.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-unjong-muted leading-tight mt-0.5">
                    {w.reason}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}
```

⚠️ `bg-amber-100`, `bg-red-100`, `bg-orange-100`, `bg-yellow-100`, `text-red-700`, `text-orange-700`, `text-yellow-700` — STEP 96 의 폴백 패턴 동일.

⚠️ `lucide-react` 아이콘 import 확인: `Gem`, `Coins`, `TrendingDown`, `AlertTriangle`.

⚠️ **CardContainer 에 `id` prop 전달** — STEP 95-C 에서 추가한 patrn. 4개 카드 모두 id 명시.

---

## 작업 2 — 기존 3개 카드에도 id 확인·추가

LongtermCards.tsx 의 기존 3개 카드가 id 가 있는지 확인:

```tsx
export function LongtermDisclosureCard() {
  return <CardContainer id="card-disclosure" ...>...</CardContainer>;
}

export function EarningsCalendarCard() {
  return <CardContainer id="card-earnings" ...>...</CardContainer>;
}

export function SectorCard() {
  return <CardContainer id="card-sector" ...>...</CardContainer>;
}
```

없으면 추가. STEP 95-C 에서 했을 수도 있지만 확인 필수.

ContextNav 매핑과 일치해야 함:
- card-disclosure → 공시
- card-earnings → 분기실적
- card-value → 저평가 ⭐신규
- card-dividend → 배당TOP ⭐신규
- card-lows → 52주신저가 ⭐신규
- card-sector → 섹터
- card-warning → 관리종목 ⭐신규

---

## 작업 3 — `app/(windows)/longterm/page.tsx` 업데이트

7개 카드 import + 그리드 배치.

```tsx
import type { Metadata } from "next";
import {
  LongtermDisclosureCard,
  EarningsCalendarCard,
  ValueScreenCard,
  DividendTopCard,
  Lows52WCard,
  SectorCard,
  WarningStockCard,
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
      {/* 카드 그리드 7개 (2열, 4행) — 페이지 헤더 박스 / Layer 1 안내 박스 모두 제거됨 (STEP 95-D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LongtermDisclosureCard />
        <EarningsCalendarCard />
        <ValueScreenCard />
        <DividendTopCard />
        <Lows52WCard />
        <SectorCard />
        <WarningStockCard />
      </div>
    </div>
  );
}
```

### 카드 배치 순서 — 가치투자자 동선

```
[1행] 공시          분기실적
[2행] 저평가        배당TOP
[3행] 52주신저가    섹터
[4행] 관리종목      (빈 칸)
```

→ **공시·분기실적** (정보 흐름) → **저평가·배당** (매수 기회) → **신저가·섹터** (시장 분석) → **관리종목** (위험 회피)

---

## 작업 4 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- LongtermCards.tsx 의 새 카드 4개 정상 컴파일
- longterm 페이지에 카드 7개 표시
- 각 카드 id 정상 (ContextNav 앵커 점프 작동)

---

## 작업 5 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/cards/LongtermCards.tsx
git add "app/(windows)/longterm/page.tsx"
git add docs/STEP_97_COMMAND.md
git status
git commit -m "feat: STEP 97 - 장타창 카드 4개 추가 (저평가 · 배당TOP · 신저가 · 관리종목)

- ValueScreenCard: PER/PBR/ROE 조합 저평가 랭킹 (5건 더미, A+~B+ 점수)
- DividendTopCard: 배당락일 임박 + 수익률 TOP (5건, KT 6.45% 등)
- Lows52WCard: 52주 신저가 우량주 (시총 1조+ 필터, 5건)
- WarningStockCard: 관리종목/투자유의/단기과열 (5건, 색 구분)

- longterm/page.tsx: 카드 3개 → 7개 그리드 (md:grid-cols-2, 4행)
- 모든 카드에 id 추가 (ContextNav 앵커 점프 연결):
  card-value · card-dividend · card-lows · card-warning

가치투자자 채팅 메시지 100% 화면 동기화:
- 'PER 8 이면 진짜 싸지 않나' → ValueScreenCard
- '배당 컷 없으면 더 살게' → DividendTopCard
- '52주 신저가 우량주 줍줍' → Lows52WCard
- 'ROE 15 넘는 종목 추천' → ValueScreenCard

장타창 시각 정체성 완성. 다음 STEP 98: 미국주식창 카드 4개."
git push
```

---

## 검증 체크리스트

- [ ] LongtermCards.tsx 에 4개 신규 카드 (`ValueScreenCard`, `DividendTopCard`, `Lows52WCard`, `WarningStockCard`)
- [ ] 4개 더미 데이터 상수 추가 (`VALUE_STOCKS`, `DIVIDEND_TOP`, `LOWS_52W`, `WARNING_STOCKS`)
- [ ] 기존 3개 카드 (Disclosure / Earnings / Sector) 도 id prop 있는지 확인 (없으면 추가)
- [ ] longterm/page.tsx 가 7개 카드 import + 2열 그리드
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 97 완료. 장타창 카드 4개 추가 (7개 완성).

신규 카드 더미 시각화:
- 저평가 (Value): KB금융 PER 6.2 ROE 11.2% A+ · 우리금융 PER 5.9 (5건)
- 배당TOP (Dividend): KT 6.45% · 삼성카드 5.82% · 하나금융 5.43% (5건)
- 52주신저가 (Lows): LG화학 -32% 우량 · POSCO -24% (시총 1조+, 5건)
- 관리종목 (Warning): 영업적자/자본잠식/감사거절 색 구분 (5건)

장타창 ↔ 화면 정보 동기화:
- 'PER 8 진짜 싸지 않나' → ValueScreenCard ✅
- '배당 컷 없으면 더 살게' → DividendTopCard ✅
- '52주 신저가 우량주 줍줍' → Lows52WCard ✅
- 'ROE 15 종목 추천' → ValueScreenCard ✅

ContextNav 매핑:
- card-disclosure / card-earnings / card-value / card-dividend / card-lows / card-sector / card-warning

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/longterm → 카드 7개 (2열 × 4행)
  4단 ContextNav 클릭 시 해당 카드로 스크롤 + 금색 깜박임

다음 STEP 98 (미국주식창 카드 4개) 명령서 받을 준비 됨.
```

---

## ⚠️ 주의 사항

1. **더미 데이터만** — 실 API 호출 시도 X
2. **CardContainer wrapper 재사용** — STEP 96 패턴 동일
3. **id 명명 일관성** — ContextNav 의 `/longterm` 매핑과 정확히 일치 (`card-value`, `card-dividend`, `card-lows`, `card-warning`)
4. **2열 그리드 (`md:grid-cols-2`)** — xl:grid-cols-3 절대 X (STEP 95-D 패턴)
5. **페이지 헤더 박스 / Layer 1 안내 박스 추가 X** — STEP 95-D 에서 제거됨, 유지
6. **색상은 표준 Tailwind 폴백** — `bg-amber-100`, `bg-red-100`, `text-red-700` 등
7. **console.log 남기지 말 것**
8. **빌드 깨지면 즉시 보고**
