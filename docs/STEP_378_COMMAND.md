<!-- 2026-06-24 -->
# STEP 378 — [모바일 ②] MarketBoard 종목·상품 표 (핵심)

> 📱 마스터 플랜 `docs/MOBILE_BUILD_PLAN.md`. 모바일 최대 리스크 = 720px 넓은 표. **데스크탑 외형 불변(전부 `sm:`로 복원).** 빌드 통과 시에만 커밋.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_378_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
종목·상품 표(현재가 + 1일·1주일·1개월·3개월·6개월·1년 = 8컬럼, `min-w-[720px]`)가 375px에서 너무 넓어 가로 스크롤 과함.
→ 모바일에선 **현재가·1일·1주일·1년** 4개만 보이고 **1개월·3개월·6개월은 `sm:`(640)부터** 표시. 표 최소폭도 모바일 540으로 축소.
→ 데스크탑(≥640)은 6기간 전부 그대로.

변경 1파일: `components/toolbox/MarketBoard.tsx` (4곳).

---

## ① 표 최소폭 — 모바일 축소
찾기:
```tsx
            <table className="w-full min-w-[720px] text-sm">
```
바꾸기:
```tsx
            <table className="w-full min-w-[540px] text-sm sm:min-w-[720px]">
```

## ② PERIODS — 모바일 숨김 플래그 추가
찾기:
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
바꾸기:
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

## ③ thead 기간 컬럼 — 모바일 숨김 클래스
찾기:
```tsx
                    <th key={p.key} className="whitespace-nowrap px-2 py-2.5 text-right font-medium">
```
바꾸기:
```tsx
                    <th key={p.key} className={`whitespace-nowrap px-2 py-2.5 text-right font-medium ${p.hideSm ? 'hidden sm:table-cell' : ''}`}>
```
> ⚠️ 이건 `key={p.key}` 있는 `<th>`만(현재가 `<th>`는 `key` 없으니 건드리지 말 것).

## ④ tbody 기간 셀 — 모바일 숨김 클래스
찾기:
```tsx
                      return <td key={p.key} className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>;
```
바꾸기:
```tsx
                      return <td key={p.key} className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(v)} ${p.hideSm ? 'hidden sm:table-cell' : ''}`}>{pct(v)}</td>;
```

---

## ✅ 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
무에러 시:
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(mobile): 종목·상품 표 모바일 4컬럼(1개월·3개월·6개월 sm부터) + min-w 540 (STEP 378)" && git push
```
> 빌드 실패 시 커밋하지 말고 에러 출력 후 멈춤(메시지 남기고 다음 STEP 진행 가능).

## 🌅 아침 시각 확인 포인트
- 375px: 표가 **현재가·1일·1주일·1년**만 → 가로 스크롤 거의 없음. ▼정렬 화살표 정상.
- ≥640px: 6기간 전부 복원(데스크탑 동일).
- (선택, 아침에 논의) 종목명 컬럼 좌측 sticky 고정으로 스크롤 시 이름 유지 — 시각 확인 후 결정.

---

> **한 줄 요약**: 모바일 표 = 핵심 4컬럼만(나머지 `sm:`부터) + 최소폭 540. 데스크탑 8컬럼 불변.
