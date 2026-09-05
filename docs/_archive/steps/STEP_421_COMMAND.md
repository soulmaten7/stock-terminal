<!-- 2026-06-26 -->
# STEP 421 — 기간 라벨 '전' 표기 + 드롭다운 박스 크기 맞춤

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_421_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
국내·미국 주식 표의 **기간 선택 드롭다운**에 작은 UI 다듬기 2가지:

- **FIX A — 라벨에 "전" 붙이기**: `1일 → 1일전`, `1주일 → 1주일전`, `1개월 → 1개월전`, `3개월 → 3개월전`, `6개월 → 6개월전`, `1년 → 1년전`. "며칠 전 대비"라는 의미가 더 직관적. **표시 텍스트만** 변경 — key/field/정렬 로직은 그대로.
  - 라벨이 나오는 모든 곳에 적용: 드롭다운 버튼, 드롭다운 옵션 목록, 선택된 기간 컬럼 헤더(전부 `PERIODS`/`DROPDOWN_PERIODS` 배열의 `label`에서 옴 → 배열만 고치면 됨), **그리고 클릭 시트(바텀시트)의 기간별 수익률 블록**(여기는 `['1일', …]` 하드코딩이라 직접 고쳐야 함).
- **FIX B — 드롭다운 박스 폭 일치**: 현재 팝업이 트리거 버튼보다 넓거나 어긋남. **버튼 = 팝업 폭**을 같게 → 깔끔히 정렬. 고정폭(`w-[4.75rem]`, 가장 긴 "3개월전" + 화살표 수용) 컨테이너로 감싸고 버튼 `w-full`, 팝업 `left-0 right-0`(= 버튼과 같은 폭). 동작 불변.

> 변경 2파일: `components/toolbox/MarketBoard.tsx`(국내), `components/toolbox/UsMarketBoard.tsx`(미국). **표시·레이아웃만** → 컴포넌트 변경이므로 새로고침/HMR이면 충분.
> 정렬·필드·캐시·API 전부 그대로. 라벨 텍스트와 드롭다운 박스 폭만 손댐.

---

## 전제 상태
- STEP 420 완료 후 상태 — 양쪽 표에 **커스텀 기간 드롭다운**(버튼 + `absolute` 팝업) 적용됨.
- STEP 419 완료 — 클릭 시트에 현재가 + 기간별 수익률 블록(`['1일'…'1년']` 하드코딩) 존재.
- 작업 전 `git status` 클린(미커밋 변경 없음) 확인 후 진행.

---

## 📄 1. `components/toolbox/MarketBoard.tsx` (국내)

### 1-A) PERIODS 배열 라벨 — "전" 추가 (드롭다운 버튼·옵션·헤더 전부 여기서 옴)
**찾기:**
```tsx
const PERIODS: { key: PeriodKey; label: string; field: keyof Row; hideSm?: boolean }[] = [
  { key: '1d', label: '1일', field: 'changePercent' },
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m', hideSm: true },
  { key: '3m', label: '3개월', field: 'r3m', hideSm: true },
  { key: '6m', label: '6개월', field: 'r6m', hideSm: true },
  { key: '1y', label: '1년', field: 'r1y' },
];
```
**바꾸기:**
```tsx
const PERIODS: { key: PeriodKey; label: string; field: keyof Row; hideSm?: boolean }[] = [
  { key: '1d', label: '1일전', field: 'changePercent' },
  { key: '1w', label: '1주일전', field: 'r1w' },
  { key: '1m', label: '1개월전', field: 'r1m', hideSm: true },
  { key: '3m', label: '3개월전', field: 'r3m', hideSm: true },
  { key: '6m', label: '6개월전', field: 'r6m', hideSm: true },
  { key: '1y', label: '1년전', field: 'r1y' },
];
```

### 1-B) FIX B — 드롭다운 버튼·팝업 폭 일치 (래퍼 고정폭 + 버튼 w-full + 팝업 left-0 right-0)
**찾기:**
```tsx
                      <div ref={periodRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setPeriodOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={periodOpen}
                          className="flex items-center gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none hover:border-unjong-accent"
                        >
                          {DROPDOWN_PERIODS.find((p) => p.key === mobilePeriod)?.label ?? '기간'}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute right-0 top-full z-50 mt-1 min-w-[5rem] overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
```
**바꾸기:**
```tsx
                      <div ref={periodRef} className="relative w-[4.75rem]">
                        <button
                          type="button"
                          onClick={() => setPeriodOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={periodOpen}
                          className="flex w-full items-center justify-between gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none hover:border-unjong-accent"
                        >
                          {DROPDOWN_PERIODS.find((p) => p.key === mobilePeriod)?.label ?? '기간'}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
```

### 1-C) 클릭 시트 기간별 수익률 — 하드코딩 라벨 "전" 추가
**찾기:**
```tsx
                {([
                  ['1일', selectedStock.changePercent],
                  ['1주일', selectedStock.r1w],
                  ['1개월', selectedStock.r1m],
                  ['3개월', selectedStock.r3m],
                  ['6개월', selectedStock.r6m],
                  ['1년', selectedStock.r1y],
                ] as [string, number | null | undefined][]).map(([label, v]) => (
```
**바꾸기:**
```tsx
                {([
                  ['1일전', selectedStock.changePercent],
                  ['1주일전', selectedStock.r1w],
                  ['1개월전', selectedStock.r1m],
                  ['3개월전', selectedStock.r3m],
                  ['6개월전', selectedStock.r6m],
                  ['1년전', selectedStock.r1y],
                ] as [string, number | null | undefined][]).map(([label, v]) => (
```

---

## 📄 2. `components/toolbox/UsMarketBoard.tsx` (미국 — KR 미러)

### 2-A) PERIODS 배열 라벨 — "전" 추가
**찾기:**
```tsx
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1d', label: '1일', field: 'changePercent' },
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m' },
  { key: '3m', label: '3개월', field: 'r3m' },
  { key: '6m', label: '6개월', field: 'r6m' },
  { key: '1y', label: '1년', field: 'r1y' },
];
```
**바꾸기:**
```tsx
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1d', label: '1일전', field: 'changePercent' },
  { key: '1w', label: '1주일전', field: 'r1w' },
  { key: '1m', label: '1개월전', field: 'r1m' },
  { key: '3m', label: '3개월전', field: 'r3m' },
  { key: '6m', label: '6개월전', field: 'r6m' },
  { key: '1y', label: '1년전', field: 'r1y' },
];
```

### 2-B) FIX B — 드롭다운 버튼·팝업 폭 일치 (KR과 동일)
**찾기:**
```tsx
                      <div ref={periodRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setPeriodOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={periodOpen}
                          className="flex items-center gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none hover:border-unjong-accent"
                        >
                          {PERIODS.find((p) => p.key === period)?.label ?? '기간'}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute right-0 top-full z-50 mt-1 min-w-[5rem] overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
```
**바꾸기:**
```tsx
                      <div ref={periodRef} className="relative w-[4.75rem]">
                        <button
                          type="button"
                          onClick={() => setPeriodOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={periodOpen}
                          className="flex w-full items-center justify-between gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none hover:border-unjong-accent"
                        >
                          {PERIODS.find((p) => p.key === period)?.label ?? '기간'}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
```

### 2-C) 클릭 시트 기간별 수익률 — 하드코딩 라벨 "전" 추가
**찾기:**
```tsx
                {([
                  ['1일', selectedStock.changePercent],
                  ['1주일', selectedStock.r1w],
                  ['1개월', selectedStock.r1m],
                  ['3개월', selectedStock.r3m],
                  ['6개월', selectedStock.r6m],
                  ['1년', selectedStock.r1y],
                ] as [string, number | null | undefined][]).map(([label, v]) => (
```
**바꾸기:**
```tsx
                {([
                  ['1일전', selectedStock.changePercent],
                  ['1주일전', selectedStock.r1w],
                  ['1개월전', selectedStock.r1m],
                  ['3개월전', selectedStock.r3m],
                  ['6개월전', selectedStock.r6m],
                  ['1년전', selectedStock.r1y],
                ] as [string, number | null | undefined][]).map(([label, v]) => (
```

---

## ✅ 검증 (빌드 + 로컬 커밋만 — push·vercel 없음)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx
git commit -m "feat(STEP 421): 기간 라벨 '전' 표기(1일전~1년전) + 기간 드롭다운 버튼·목록 폭 일치"
```

> ⚠️ **NO push / NO vercel** — 로컬 빌드 + 로컬 커밋까지만. 원격 푸시·배포는 별도 STEP에서.

---

## ✅ 확인 체크리스트
개발 서버(컴포넌트 → HMR/새로고침):
- [ ] **국내(KR)** 표 기간 드롭다운 **버튼**에 선택값이 `…전`(예: `1일전`, `3개월전`)으로 표시.
- [ ] **국내(KR)** 드롭다운 **옵션 목록**이 전부 `1일전 / 1주일전 / 1개월전 / 3개월전 / 6개월전 / 1년전`.
- [ ] **국내(KR)** 기간 **컬럼 헤더**(선택된 기간)도 `…전` 라벨로 표시.
- [ ] **국내(KR)** 종목 행 클릭 → **바텀시트** 기간별 수익률 라벨이 `1일전 ~ 1년전`.
- [ ] **미국(US)** 동일 — 드롭다운 버튼·옵션·헤더·시트 라벨 모두 `…전`.
- [ ] **드롭다운 박스**: 버튼과 펼쳐진 목록 **폭이 일치**하고 좌우 정렬이 깔끔(목록이 버튼보다 넓거나 어긋나지 않음). KR·US 동일.
- [ ] 가장 긴 `3개월전`/`1개월전`/`6개월전` 라벨이 버튼·목록 안에서 **잘리지 않음**(고정폭 `4.75rem` 수용).
- [ ] 표 가로 스크롤(`overflow-x-auto`)·정렬·페이지네이션 등 **기존 동작 변화 없음**(라벨·폭만 바뀜).

---

## ⏭️ 스킵 / 보류
- key/field/정렬 로직·API·캐시 **불변** — 본 STEP 범위 아님(표시 텍스트 + 드롭다운 폭만).
- 4개 문서 헤더 날짜 갱신·CHANGELOG·세션 인수인계 문서는 **세션 종료 루틴에서** 처리(본 STEP은 코드 2파일 + 로컬 커밋까지만).
- `git push` / vercel 배포 보류.

---

> **한 줄 요약**: KR·US 두 표의 기간 라벨을 `1일전~1년전`으로 바꾸고(배열 + 시트 하드코딩 양쪽), 기간 드롭다운 버튼·목록 폭을 `4.75rem` 고정으로 일치 → 직관성·정렬 개선. 동작·정렬·API는 그대로, 로컬 빌드+커밋까지만.
