<!-- 2026-05-28 -->
# STEP 100 — 카드 → 우측 패널 연결 강화 (Layer 1-C)

> **목표**: 21개 카드 모두 종목 클릭 시 우측 종목상세 패널 자동 업데이트. Layer 1 첫 STEP (가장 가벼움, 1~2일 예상 → 단일 STEP 으로 압축).
> **세션**: #26 시작 (Layer 1 진입)
> **전제**: 세션 #25 종료 (`8d9c0ec` 또는 그 이후), Layer 0 + 21개 카드 디테일 완성
> **참조 스펙**: `docs/SESSION_KICKOFF.md` 섹션 4-3 (Layer 1-C)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_100_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **종목 카드만 클릭 연결** — 종목 코드/이름이 있는 카드만 `setSelectedSymbol` 호출
2. **종목 아닌 카드는 비활성 유지** — 섹터·환율+시계·FOMC·글로벌지수 등은 그대로
3. **테마 카드는 대표 종목 클릭** — 테마명이 아니라 "대표 · 삼성전자" 부분 클릭 시 동작
4. **WatchlistPanel 패턴 그대로** — STEP 93 의 패턴 재사용
5. **빌드 깨지면 즉시 보고**

---

## 작업 1 — `unjongSelectedSymbolStore` 인터페이스 재확인

```bash
cd ~/stock-terminal
cat stores/unjongSelectedSymbolStore.ts | head -40
```

기대 인터페이스:
```ts
type SelectedSymbol = {
  code: string;
  name: string;
  price?: string;
  changePct?: number;
  market?: "KOSPI" | "KOSDAQ" | "US" | "ETF";
};

setSelectedSymbol(symbol: SelectedSymbol | null) → void;
```

WatchlistPanel.tsx 의 onClick 패턴을 참고:
```tsx
onClick={() =>
  setSelectedSymbol({
    code: item.code,
    name: item.name,
    price: item.price,
    changePct: item.changePct,
    market: item.code.match(/^[A-Z]+$/)
      ? "US"
      : item.code.startsWith("0")
      ? "KOSPI"
      : "KOSDAQ",
  })
}
```

---

## 작업 2 — `ScalperCards.tsx` 종목 클릭 연결 (단타창 7개)

각 카드의 `<li>` 또는 종목 영역에 `onClick` 추가. `useSelectedSymbol` import.

### 2-1. MoversCard
```tsx
"use client";

import { useSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

export function MoversCard() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <CardContainer id="card-movers" detailHref="/scalper/movers" ...>
      <ul className="space-y-2">
        {MOVERS.map((m, i) => (
          <li
            key={m.code}
            onClick={() =>
              setSelectedSymbol({
                code: m.code,
                name: m.name,
                price: m.price,
                changePct: m.changePct,
                market: m.code.startsWith("0") ? "KOSPI" : "KOSDAQ",
              })
            }
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            {/* 기존 내용 그대로 */}
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}
```

### 2-2. VolumeCard
- `VOLUME_SURGE` 의 `code`, `name` 사용
- `price` 는 없음 → 그냥 종목명만으로 setSelectedSymbol (price·changePct 생략)

```tsx
onClick={() =>
  setSelectedSymbol({
    code: v.code,
    name: v.name,
    market: v.code.startsWith("0") ? "KOSPI" : "KOSDAQ",
  })
}
```

### 2-3. ViCard
- `VI_EVENTS` 의 `code`, `name`, `price`, `changePct` 모두 사용

### 2-4. NetBuyBrokerCard
- `NETBUY_WITH_BROKERS` 의 `code`, `name` 사용
- `price`, `changePct` 는 없음 → 생략

### 2-5. ScalperDisclosureCard
- `DISCLOSURES` 의 `code`, `name` 사용
- 종목 클릭 시 setSelectedSymbol

### 2-6. ThemeTop10Card — 부분 클릭
- `THEME_TOP10` 의 `name` (테마명) 은 클릭 비활성
- `leader` (대표 종목) 클릭 시만 setSelectedSymbol
- 대표 종목명이 한국명이라 code 찾기 어려움 → **이 카드는 Layer 1-A 에서 처리, 지금은 비활성**

```tsx
// 테마 카드는 onClick 추가 X. 그대로 두기.
// 단, hover 효과는 유지 (cursor-default 로 변경)
```

### 2-7. ShortInterestCard
- `SHORT_INTEREST` 의 `code`, `name` 사용

⚠️ **테마 카드 (ThemeTop10Card) 는 이 STEP 에서 제외** — leader 종목명만 있고 code 없음. Layer 1-A 에서 처리.

---

## 작업 3 — `LongtermCards.tsx` 종목 클릭 연결 (장타창)

### 종목 카드 (5개) — 클릭 연결
- LongtermDisclosureCard (LONGTERM_DISCLOSURES)
- EarningsCalendarCard (EARNINGS_CALENDAR)
- ValueScreenCard (VALUE_STOCKS)
- DividendTopCard (DIVIDEND_TOP)
- Lows52WCard (LOWS_52W)
- WarningStockCard (WARNING_STOCKS) — 가짜 종목 (000000 등) 이지만 그대로 연결

### 종목 아닌 카드 (1개) — 비활성
- SectorCard — 섹터명만 있음, 종목 X. 그대로 비활성

각 카드 onClick 패턴:
```tsx
onClick={() =>
  setSelectedSymbol({
    code: item.code,
    name: item.name,
    market: item.code.match(/^[A-Z]+$/) ? "US" : item.code.startsWith("0") ? "KOSPI" : "KOSDAQ",
  })
}
```

LongtermDisclosureCard 의 li 는 `cursor-pointer` 가 이미 있을 텐데 onClick 추가.

---

## 작업 4 — `UsCards.tsx` 종목 클릭 연결 (미국주식창)

### 종목 카드 (4개) — 클릭 연결
- PreAfterMarketCard (PRE_AFTER_HOURS) — code (NVDA·TSLA·META 등)
- Magnificent7Card (MAGNIFICENT_7) — code
- UsMoversCard (US_MOVERS) — code
- UsNewsCard (US_NEWS) — 종목 코드가 없는 뉴스 헤드라인이라 비활성 또는 별도 처리

미국 종목의 market 은 `"US"`:
```tsx
onClick={() =>
  setSelectedSymbol({
    code: item.code,
    name: item.name,
    price: item.price,
    changePct: item.changePct,
    market: "US",
  })
}
```

### 종목 아닌 카드 (3개) — 비활성
- GlobalIndicesCard — 지수 (S&P, Nasdaq 등)
- ForexClockCard — 환율 + 시계
- FOMCCalendarCard — 이벤트 일정
- UsNewsCard — 뉴스 (종목 코드 없음)

---

## 작업 5 — 비활성 카드의 cursor 처리

종목 아닌 카드의 `<li>` 에서 `cursor-pointer` 제거하고 `cursor-default` 적용:

```tsx
// 비활성 카드의 li
className="... cursor-default"
// (hover 효과는 유지 또는 제거 둘 다 OK)
```

또는 비활성 카드의 onClick 자체를 제거하면 자연스럽게 cursor: auto.

---

## 작업 6 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build 2>&1 | grep -E "(error TS|Error:|✓|Failed)" | head -10
```

확인:
- 빌드 성공, TypeScript 오류 0
- 3개 카드 파일 (Scalper/Longterm/Us) 정상 컴파일
- useSelectedSymbol import 정상

---

## 작업 7 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/cards/ScalperCards.tsx
git add components/cards/LongtermCards.tsx
git add components/cards/UsCards.tsx
git add docs/STEP_100_COMMAND.md
git status
git commit -m "feat: STEP 100 - 카드 → 우측 패널 연결 강화 (Layer 1-C)

종목 카드 (총 15개) 클릭 → setSelectedSymbol 호출 → 우측 종목상세 자동 업데이트:

단타창 (5개 + 1개 보류):
- MoversCard ✅
- VolumeCard ✅
- ViCard ✅
- NetBuyBrokerCard ✅
- ScalperDisclosureCard ✅
- ShortInterestCard ✅
- ThemeTop10Card ⏸️ (대표종목 code 없어 Layer 1-A 에서 처리)

장타창 (6개):
- LongtermDisclosureCard ✅
- EarningsCalendarCard ✅
- ValueScreenCard ✅
- DividendTopCard ✅
- Lows52WCard ✅
- WarningStockCard ✅

미국주식창 (4개):
- PreAfterMarketCard ✅
- Magnificent7Card ✅
- UsMoversCard ✅
- UsNewsCard ⏸️ (헤드라인만, 종목 code 없음)

비활성 (종목 아닌 카드, 5개):
- SectorCard (섹터명)
- GlobalIndicesCard (지수)
- ForexClockCard (환율·시계)
- FOMCCalendarCard (이벤트)
- ThemeTop10Card (테마명)

Layer 1-C 완성. 카드 어떤 종목 클릭하든 우측 종목상세 자동 변경.
다음: Layer 1-A (카드 21개 실데이터) 또는 Layer 1-B (Supabase Realtime 채팅)"
git push
```

---

## 검증 체크리스트

- [ ] 단타창 종목 카드 6개 onClick 연결 (테마 제외)
- [ ] 장타창 종목 카드 6개 onClick 연결 (섹터 제외)
- [ ] 미국주식창 종목 카드 3개 onClick 연결 (지수/환율/FOMC/뉴스 제외)
- [ ] 비활성 카드 cursor 처리 (cursor-pointer 제거 또는 cursor-default)
- [ ] WatchlistPanel 패턴과 동일한 onClick 구조
- [ ] market 자동 분류 (KOSPI/KOSDAQ/US)
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 100 완료. 카드 → 우측 패널 연결 강화 (Layer 1-C) 끝.

연결된 종목 카드 (15개):
- 단타창: Movers · Volume · VI · NetBuy · 공시 · 공매도 (6개)
- 장타창: 공시 · 분기실적 · 저평가 · 배당TOP · 신저가 · 관리종목 (6개)
- 미국주식창: Pre/After · M7 · 미국Movers (3개)

비활성 카드 (5개): 섹터 · 지수 · 환율시계 · FOMC · 테마 · 미국뉴스
→ 종목 코드 없거나 종목 아닌 카드 (의도된 비활성)

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  /scalper 의 Movers 카드 → 에코프로비엠 클릭 → 우측 종목상세 자동 변경 ✅
  /longterm 의 저평가 카드 → KB금융 클릭 → 우측 자동 변경 ✅
  /us 의 M7 카드 → NVDA 클릭 → 우측 자동 변경 ✅

다음 STEP 후보:
- STEP 101: Layer 1-A (단타창 7개 카드 실데이터 — KIS API 연결)
- STEP 101: Layer 1-B (Supabase Realtime 채팅 실시간)
- STEP 101: 테마 카드 대표종목 매핑 (한국명 → code) — 짧은 작업
```

---

## ⚠️ 주의 사항

1. **테마 카드 (ThemeTop10Card)** — 대표 종목명만 있고 code 없음. 이 STEP 에서 비활성. Layer 1-A 에서 한국명 → code 매핑 후 연결
2. **미국 뉴스 카드 (UsNewsCard)** — 헤드라인만 있고 종목 코드 없음. 비활성 유지
3. **WarningStockCard** — 가짜 종목 (000000~000004) 이지만 그대로 setSelectedSymbol 호출. Layer 1-A 에서 실 KRX 데이터로 교체 시 자동 정상화
4. **WatchlistPanel 패턴 그대로** — 동일한 setSelectedSymbol 인터페이스 유지
5. **클라이언트 컴포넌트** — `"use client"` 디렉티브가 각 카드 컴포넌트 파일 상단에 이미 있을 텐데, 없으면 추가
6. **빌드 깨지면 즉시 보고** — 카드 파일 3개 한 번에 수정하니 신중히
7. **console.log 남기지 말 것** — CLAUDE.md 규칙
