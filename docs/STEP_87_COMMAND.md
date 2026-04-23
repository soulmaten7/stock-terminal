# STEP 87 — 회귀 핫픽스 + UI 디테일 개선

**작성일**: 2026-04-23
**실행 명령어**:
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표**:
1. STEP 85 회귀 핫픽스 (섹터 히트맵 KR·US 둘 다 빈 데이터 — Yahoo v3 인스턴스화 누락)
2. 히트맵 모바일 반응형 (grid-cols 반응형 전환)
3. 섹터 타일 툴팁 (hover 시 섹터명+등락률+종목수)
4. 종목 클릭 → 호가창 동기화 (VolumeTop10/NetBuyTop/ThemeTop10 3개 위젯에 store 연결)

**전제 상태**: 이전 커밋 `24259ce` (STEP 85+86 완료). 빌드 에러는 없으나 sectors API 500 에러 상태.

**MCP 진단 근거**:
- `/api/home/sectors?market=US` → 500 `"Call const yahooFinance = new YahooFinance() first"`
- `/api/home/sectors?market=KR` → 200 `{sectors:[]}` (DB empty + ETF 폴백도 같은 에러로 실패)
- MoversPair/Screener/News는 정상 동작

---

## Phase 0 — P0 회귀 핫픽스: Yahoo Finance v3 인스턴스화

### 수정할 파일: `app/api/home/sectors/route.ts`

**문제 라인** (STEP 85에서 내가 잘못 준 코드):
```typescript
import yahooFinance from 'yahoo-finance2';  // ❌ v2 방식
```

**수정**:
```typescript
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();  // ✅ v3 방식
```

### 변경 방법 (3번째 줄 수정)

1. 3번째 줄 `import yahooFinance from 'yahoo-finance2';`를 찾는다.
2. 다음으로 교체:
```typescript
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
```

나머지 파일 내용은 손대지 말 것. 함수 내부에서 `yahooFinance.quote(...)` 호출은 그대로 동작함.

### 캐시 초기화 이유

서버 메모리 캐시(`_krCache`, `_usCache`)에 이전 에러 시점의 빈 결과가 박혀있을 수 있음. 수정 후 **`npm run dev` 재시작 필수**. HMR로는 모듈 전역 변수가 초기화 안 됨.

### 검증
```bash
# 서버 재시작 후
curl -s 'http://localhost:3333/api/home/sectors?market=US' | head -c 400
curl -s 'http://localhost:3333/api/home/sectors?market=KR' | head -c 400
```

응답에 `sectors` 배열이 비어있지 않아야 함 (US는 11개, KR은 10개 전후 기대).

---

## Phase 1 — 섹터 히트맵 모바일 반응형

### 파일 1: `components/widgets/SectorHeatmapWidget.tsx`

63번 줄 + 71번 줄의 `grid-cols-4`를 반응형으로:

**63번 줄** (로딩 스켈레톤):
```tsx
// 변경 전
<div className="flex-1 grid grid-cols-4 gap-1.5 p-3">
// 변경 후
<div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 p-3">
```

**71번 줄** (실제 타일):
```tsx
// 변경 전
<div className="flex-1 grid grid-cols-4 gap-1.5 p-3 content-start">
// 변경 후
<div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 p-3 content-start">
```

### 파일 2: `app/market-map/MarketMapClient.tsx`

MarketMapClient 내부의 히트맵 그리드(좌측 col-span-8 내부)에서 `grid-cols-4`를 반응형으로:

```tsx
// 변경 전
<div className="grid grid-cols-4 gap-2">
// 변경 후
<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
```

(해당 파일 내 `grid-cols-4`가 여러 개 있으면 **히트맵 그리드만** — 로딩 스켈레톤과 실제 타일 둘 다. 우측 종목 리스트는 건드리지 말 것.)

---

## Phase 2 — 섹터 타일 툴팁

### 파일 1: `components/widgets/SectorHeatmapWidget.tsx`

타일 `<div>` 요소에 `title` 속성 추가 (72~84번 줄 부근):

```tsx
{sectors.map((s) => (
  <div
    key={s.sector}
    title={`${s.sector} · ${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%${s.count > 1 ? ` · ${s.count}개 종목` : ''}`}
    className="rounded p-1.5 flex flex-col justify-between min-h-[52px] cursor-help"
    style={{ background: heatColor(s.change) }}
  >
    <span className="text-[10px] font-medium leading-tight" style={{ color: textColor(s.change) }}>
      {s.sector}
    </span>
    <span className="text-xs font-bold tabular-nums" style={{ color: textColor(s.change) }}>
      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
    </span>
  </div>
))}
```

**변경 포인트**:
- `title={...}` 추가 — 브라우저 기본 툴팁 (가볍고 접근성 OK)
- `className`에 `cursor-help` 추가

### 파일 2: `app/market-map/MarketMapClient.tsx`

히트맵 타일 `<button>` 요소에 동일 `title` 추가:

```tsx
<button
  key={s.sector}
  onClick={() => openSector(s.sector)}
  title={`${s.sector} · ${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}% · ${s.count}개 종목`}
  className={`h-28 rounded p-3 flex flex-col justify-between text-left transition-all hover:scale-[1.02] ${
    selectedSector === s.sector ? 'ring-2 ring-[#0ABAB5]' : ''
  }`}
  style={{ background: heatColor(s.change) }}
>
```

---

## Phase 3 — 종목 클릭 → 호가창 동기화 (3개 위젯 연결)

**배경**: `OrderBookWidget`과 `TickWidget`이 `useSelectedSymbolStore`의 `selectedSymbol`을 구독하므로, 어느 위젯이든 `setSelected(...)` 호출하면 자동으로 호가/체결이 해당 종목으로 전환. 현재 연결 안 된 3개 위젯을 연결.

### 파일 1: `components/widgets/VolumeTop10Widget.tsx`

**Import 추가** (최상단):
```tsx
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
```

**컴포넌트 내부** (hooks 선언부):
```tsx
const setSelected = useSelectedSymbolStore((s) => s.setSelected);
```

**행 클릭 핸들러 추가**: 종목 리스트 렌더 부분에서 각 `<li>` 또는 `<tr>`에 `onClick` 추가:
```tsx
onClick={() => setSelected({ code: item.symbol, name: item.name, market: 'KR' })}
className="... cursor-pointer"
```

정확한 위치는 파일 내 `.map(...)` 루프의 리스트 아이템 요소. 이미 `hover:bg-*` 등 hover 스타일 있으면 그 요소에 `onClick` 추가.

### 파일 2: `components/widgets/NetBuyTopWidget.tsx`

동일 패턴 적용:
1. `useSelectedSymbolStore` import
2. `setSelected` hook
3. 종목 행에 `onClick={() => setSelected({ code, name, market: 'KR' })}` + `cursor-pointer`

### 파일 3: `components/widgets/ThemeTop10Widget.tsx`

테마 내부 종목이 표시되는 위젯. 테마 자체는 클릭 시 테마 상세로 이동하거나 필터링일 수 있으나, **종목 리스트가 보이면 종목 행에** 동일 패턴 적용.

위젯 구조 먼저 확인:
```bash
cat /sessions/admiring-modest-johnson/mnt/OTMarketing/components/widgets/ThemeTop10Widget.tsx | head -90
```

- 테마명만 나열된다면 → 생략 (store 연결 불필요, 대신 href="/themes" 링크로 이동)
- 테마 + 대표종목이 같이 나열된다면 → 대표 종목 클릭에 `setSelected` 추가

판단 후 적용. 애매하면 이 파일은 skip하고 1,2만 적용.

### 검증 방법 (Claude Code가 직접)

```bash
# 빌드 OK 확인 후
npm run dev
```

그다음 Chrome MCP 검증은 사용자(또는 Claude Code가 curl)로:
```bash
# 서버 재시작 후 홈 페이지에서 거래량 TOP 아이템 클릭 시
# 호가/체결창의 종목명이 바뀌는지 확인
```

---

## Phase 4 — 빌드 검증 + 문서 + Git

### 4-1. 빌드 검증
```bash
npm run build 2>&1 | tail -30
```

빌드 에러 있으면 **중단** + 에러 내용 보고.

### 4-2. 로컬 API 검증
```bash
curl -s 'http://localhost:3333/api/home/sectors?market=US' | python3 -c "import sys, json; d=json.load(sys.stdin); print('US sectors:', len(d.get('sectors', [])))"
curl -s 'http://localhost:3333/api/home/sectors?market=KR' | python3 -c "import sys, json; d=json.load(sys.stdin); print('KR sectors:', len(d.get('sectors', [])))"
```

둘 다 0이 아니어야 함.

### 4-3. 문서 업데이트 (4개 파일 날짜 → `2026-04-23`)

**`docs/CHANGELOG.md`** 최상단 엔트리 추가:
```markdown
## 2026-04-23 — STEP 87: 회귀 핫픽스 + UI 디테일

- 🔥 회귀 수정: yahoo-finance2 v3 인스턴스화 누락 → 섹터 히트맵 KR·US 복구
- 섹터 히트맵 모바일 반응형 (grid-cols-2 → md:3 → lg:4)
- 섹터 타일 툴팁 추가 (title 속성, cursor-help)
- 종목 클릭 → 호가창 동기화 (Volume/NetBuy/Theme 3개 위젯 store 연결)
```

**`session-context.md`**, **`CLAUDE.md`**, **`docs/NEXT_SESSION_START.md`** 도 헤더 날짜 업데이트.

### 4-4. Git commit + push
```bash
cd ~/Desktop/OTMarketing
git add -A
git commit -m "STEP 87: 섹터 API 회귀 핫픽스 + UI 디테일 (반응형/툴팁/호가창 동기화)"
git push
```

---

## 완료 보고 형식

```
✅ STEP 87 완료
- Phase 0: Yahoo v3 인스턴스화 — ✅ (/api/home/sectors?market=US 응답 N개)
- Phase 1: 반응형 — ✅
- Phase 2: 툴팁 — ✅
- Phase 3: 호가창 동기화 — ✅ (Volume/NetBuy/Theme 중 적용: X개)
- Phase 4: 빌드 + push — ✅ (커밋 해시: xxxxxxx)
- 주의사항: (있으면)
```

---

## 롤백 (문제 시)
```bash
git reset --hard HEAD~1
git push --force-with-lease  # ⚠️ 사용자 확인 필수
```
