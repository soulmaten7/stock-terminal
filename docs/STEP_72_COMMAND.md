# STEP 72 — 종합 탭 5블록 실데이터 연결

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 71 완료 — selectedSymbolStore + 종합 탭 구조 골격 + 뉴스/공시/재무 탭 placeholder.

**목표:**
우측 종목상세 패널의 "종합" 탭 5개 블록에 실데이터를 연결. 블록 순서 = 조회 빈도 순.
1. **스냅샷 헤더** (시세·시고저·거래량·시총·PER·배당)
2. **핵심 투자지표** (PER · PBR · 시총 · 배당 · 52주 신고/신저)
3. **투자자 수급 미니** 🇰🇷 (외인·기관·개인 당일/5일 순매수, US 티커는 블록 숨김)
4. **뉴스 하이라이트 3건**
5. **공시 하이라이트 3건**
6. **재무 미니** (매출·영업이익 4분기 막대)

**원칙:**
- **기존 API 훅/라우트 재활용** — 새 API 라우트 추가 금지. 기존 위젯(OrderBookWidget, NewsFeedWidget, DartFilingsWidget, NetBuyTopWidget, TickWidget 등)이 이미 쓰고 있는 데이터 소스를 그대로 사용.
- 해당 블록 데이터 소스가 **기존 코드에 없으면 TODO 주석만 남기고 placeholder 유지** — 별도 STEP 73에서 API 확장.
- 각 블록 끝날 때마다 빌드 안 돌림. **마지막에 한 번만 `npm run build`** 검증. 에러 나면 로그와 함께 중단.

---

## 작업 0 — 기존 데이터 소스 전수 조사 (필수 선행)

아래 탐색을 순서대로 실행하고 결과 요약 보고:

```bash
# 1) 기존 데이터 페치 훅 위치
ls lib/hooks/ 2>/dev/null || echo "no lib/hooks"
find lib -name "use*.ts" -type f 2>/dev/null | head -20

# 2) 기존 API 라우트
find app/api -type d 2>/dev/null | head -30

# 3) 시세·스냅샷 관련 훅/API
grep -rln "quote\|snapshot\|currentPrice\|시세" lib/ app/api/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20

# 4) 뉴스 / 공시 / 재무 / 수급 관련
grep -rln "news\|filing\|disclosure\|financial\|netBuy\|수급" lib/ app/api/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -30

# 5) 기존 위젯이 쓰는 훅 확인
grep -rn "import.*use" components/widgets/ components/home/ --include="*.tsx" 2>/dev/null | head -30
```

**이 결과에 따라 블록별로 다음 중 하나 결정:**
- **(a) 기존 훅 재활용 가능** — import해서 연결
- **(b) 기존 API 라우트는 있지만 훅이 없음** — `useEffect + fetch` 로 해당 블록 내부에서 간단 fetch
- **(c) 데이터 소스 없음** — TODO 주석만 남기고 placeholder 유지, 보고에 명시

결과를 아래 표로 요약 보고:

```
| 블록 | 소스 상태 | 사용할 훅/라우트 | 결정 |
|------|----------|----------------|------|
| 스냅샷 헤더 | (a/b/c) | ...             | ...  |
| 핵심 투자지표 | ... | ... | ... |
| 수급 미니 🇰🇷 | ... | ... | ... |
| 뉴스 3 | ... | ... | ... |
| 공시 3 | ... | ... | ... |
| 재무 미니 | ... | ... | ... |
```

**중단 조건:** 없음. 소스 상태 (c)면 해당 블록은 placeholder 유지하고 다른 블록만 연결.

---

## 작업 1 — `SnapshotHeader` 시세 연결

**조건부:**
- (a) 기존 시세 훅 존재 → import해서 `price / change / changePct / open / high / low / volume / marketCap / per / dividendYield` 표시
- (b) 기존 quote API 라우트만 존재 → SnapshotHeader 내부에서 `useEffect + fetch`
- (c) 소스 없음 → **placeholder 유지**, 파일 상단에 다음 TODO만 남기고 넘어감:
  ```tsx
  // TODO(STEP 73): 시세 API 라우트 신설 후 연결
  ```

**표시 포맷 공통 규칙:**
- 현재가: 천 단위 콤마, KR=원 기호 없음, US=`$` 앞에
- 등락률: `+`/`-` 부호 + 소수 2자리, `+`는 `#0ABAB5` / `-`는 `#FF4D4D` / `0`은 `#444`
- 시고저: 천 단위 콤마
- 거래량: 한국어 단위 축약 (`1,234,567` → `123.4만`, `1.23억`)
- 시총: `15.3조`, `128.5억$`
- PER: `12.3배`, N/A는 `—`
- 배당수익률: `2.34%`, N/A는 `—`

**유틸 함수 없으면 파일 하단에 로컬 헬퍼로 추가:**
```tsx
function formatKrw(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '--';
  return n.toLocaleString('ko-KR');
}
function formatPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '--';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}
```

---

## 작업 2 — `OverviewTab` 블록 1: 핵심 투자지표

동일 원칙. 가능한 경우 SnapshotHeader와 **같은 훅에서 가져온 데이터를 props로 내려주거나 selectedSymbolStore 기반으로 동일 훅 재호출**.

**실데이터 필드:**
- `per` (배)
- `pbr` (배)
- `marketCap` (시총, 축약 표기)
- `dividendYield` (%)
- `high52w` (52주 신고가)
- `low52w` (52주 신저가)

소스 없으면 TODO 유지.

---

## 작업 3 — `OverviewTab` 블록 2: 투자자 수급 미니 🇰🇷 (US 숨김)

**필수: US 티커일 때 블록 자체를 렌더하지 않음.**

```tsx
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
// ...
const selected = useSelectedSymbolStore((s) => s.selected);
if (selected?.market !== 'KR') return null;
```

**표시 구조 (2×3 그리드):**
```
┌──────────────────────────┐
│ 투자자 수급 🇰🇷         │
├────────┬────────┬────────┤
│ 외인   │ 기관   │ 개인   │
│ 당일 ~ │ 당일 ~ │ 당일 ~ │
│ 5일 ~  │ 5일 ~  │ 5일 ~  │
└────────┴────────┴────────┘
```

- 순매수 값: `+`/`-` 부호, 천 단위 콤마, 단위 `주` 또는 `억` 축약
- `+` = `#0ABAB5` (매수 우위) / `-` = `#FF4D4D` (매도 우위)

데이터 소스는 기존 `NetBuyTopWidget` 이 쓰는 훅/API를 선택 종목 기준으로 재호출. 소스 없으면 TODO 유지.

---

## 작업 4 — `OverviewTab` 블록 3: 뉴스 하이라이트 3건

기존 `NewsFeedWidget` 이 쓰는 훅/API를 활용하되, 다음과 같이 제한:
- 선택 종목 기준 필터링 가능하면 필터, 아니면 상위 3건
- 포맷: 제목 (text-xs, black, font-medium) / 시간 (text-[10px], #999) / 출처 (text-[10px], #999)
- 클릭 시 원문 새 탭 (`target="_blank" rel="noopener noreferrer"`)
- 4번째부터는 **"뉴스 탭으로"** 링크 (탭 전환 트리거, `activeTab` state 변경)

탭 전환을 위해서는 OverviewTab이 부모 `StockDetailPanel`의 setActiveTab을 받아야 함. props로 내려주기:

```tsx
// StockDetailPanel.tsx
<OverviewTab onNavigateTab={setActiveTab} />

// OverviewTab.tsx
interface Props { onNavigateTab: (tab: DetailTab) => void; }
export default function OverviewTab({ onNavigateTab }: Props) { ... }

// 블록 하단
<button onClick={() => onNavigateTab('news')} className="text-[11px] text-[#0ABAB5] hover:underline">
  뉴스 전체 보기 →
</button>
```

공시·재무 블록 하단에도 동일한 "탭으로 이동" 링크 추가 (`disclosures` / `financials`).

---

## 작업 5 — `OverviewTab` 블록 4: 공시 하이라이트 3건

기존 `DartFilingsWidget` 훅/API 활용. KR=DART / US=SEC.
- 선택 종목 필터 가능하면 필터, 아니면 상위 3건
- 포맷: 제목 / 시간
- 클릭 시 원문 새 탭
- 하단 "공시 전체 보기 →" 링크 (onNavigateTab('disclosures'))

---

## 작업 6 — `OverviewTab` 블록 5: 재무 미니

**구조:** 매출·영업이익 최근 4분기 막대 그래프 (아이콘 없이 순수 CSS 막대).

```
매출  ████████░░░  ██████████  ███████░░░  ██████████░
영업이익  ███░░░░  █████░░  ██████  ████░░░
          24Q1     24Q2     24Q3     24Q4
```

- 가로 스택 or 세로 스택 — SVG 없이 `div` + CSS width %만으로 구현
- 정확한 숫자는 hover 시 tooltip (`title` attr 로 충분)
- 데이터 소스 없으면 placeholder (회색 막대 4개 + "Coming soon")

**막대 스타일:**
- 매출: `bg-[#0ABAB5]` (틸)
- 영업이익: `bg-[#5B6670]` (차콜)
- 높이 6px, 너비는 4분기 중 최댓값 기준 %

하단 "재무 전체 보기 →" 링크.

---

## 작업 7 — 종목 변경 시 activeTab 초기화 정책

`StockDetailPanel.tsx`:
```tsx
import { useEffect } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
// ...
const selectedCode = useSelectedSymbolStore((s) => s.selected?.code);
useEffect(() => {
  setActiveTab('overview');
}, [selectedCode]);
```

종목 변경하면 항상 "종합" 탭으로 복귀.

---

## 작업 8 — `SnapshotHeader` · 수급 · 재무 등에서 선택 없음 상태 처리

`selected === null` 일 때:
- SnapshotHeader: 기존 STEP 71 의 "종목을 선택하세요" 유지
- OverviewTab 5블록: 각 블록 내용 대신 `<p className="text-[11px] text-[#BBB]">종목을 선택하세요</p>` 한 줄

혹은 OverviewTab 최상단에서 한 번에 조기 반환:
```tsx
if (!selected) {
  return <div className="py-8 text-center text-xs text-[#999]">좌측에서 종목을 선택하세요</div>;
}
```

**후자 채택** — 5블록 전체를 공통 안내 한 줄로 대체.

---

## 작업 9 — 빌드 검증

```bash
npm run build
```

**에러 발생 시 즉시 중단**하고 로그 공유.

---

## 작업 10 — 문서 4개 갱신

- `CLAUDE.md` 날짜 확인
- `docs/CHANGELOG.md` 상단:
  ```
  - feat(dashboard): 종합 탭 5블록 실데이터 연결 (STEP 72)
  ```
- `session-context.md`:
  - STEP 72 완료 블록 추가 (블록별 소스 상태 a/b/c 요약 포함)
  - TODO: "STEP 73 — 뉴스/공시/재무 탭 상세 구현 + 빠진 API 보강"
- `docs/NEXT_SESSION_START.md`: 다음 할 일 = STEP 73

---

## 작업 11 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): 종합 탭 5블록 실데이터 연결 (STEP 72)

- SnapshotHeader: 선택 종목 시세/시고저/거래량/시총/PER/배당 연결
- OverviewTab 블록 1 (핵심 투자지표): PER/PBR/시총/배당/52주 신고저
- OverviewTab 블록 2 (수급 미니 🇰🇷): 외인/기관/개인 당일·5일 순매수, US 자동 숨김
- OverviewTab 블록 3 (뉴스 3): 선택 종목 기준, "전체 보기" 링크
- OverviewTab 블록 4 (공시 3): 동일 패턴
- OverviewTab 블록 5 (재무 미니): 매출·영업이익 4분기 CSS 막대
- 종목 변경 시 activeTab 'overview'로 초기화
- 데이터 소스 없는 블록은 TODO 주석 + placeholder 유지

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 72 완료

블록별 소스 상태:
- 스냅샷 헤더: (a/b/c) / <훅/라우트>
- 투자지표: (a/b/c) / <...>
- 수급 미니: (a/b/c) / <...>
- 뉴스 3: (a/b/c) / <...>
- 공시 3: (a/b/c) / <...>
- 재무 미니: (a/b/c) / <...>

- 종목 변경 시 overview 탭 자동 복귀 구현
- 선택 없음 상태: 공통 안내 한 줄
- npm run build: 성공
- 4개 문서 갱신
- git commit: <hash>
- git push: success

STEP 73 예고: 뉴스/공시/재무 탭 상세 구현 + 소스 (c) 블록 API 보강
```

---

## 주의사항

- **새 API 라우트 금지** — 이번엔 기존 것만 재활용. 소스 없는 블록은 placeholder.
- **SSR 주의** — `'use client'` 유지, `useSelectedSymbolStore`는 클라이언트 전용.
- **hydration mismatch 주의** — `useEffect(() => setMounted(true), [])` 패턴 필요한 훅 있으면 주의.
- **스타일 일관성** — 기존 위젯들(ChartWidget, OrderBookWidget 등)의 헤더·색상·타이포그래피와 맞출 것.
- **수급 블록 US 숨김** — `selected?.market !== 'KR'` 시 `return null`, DOM에 아예 없어야 함.
- **부분 빌드 허용** — 블록 중 일부가 소스 (c)여도 빌드 통과하면 OK. 보고에 명시.
