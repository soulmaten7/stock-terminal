<!-- 2026-06-18 -->
# STEP 277 — 필터바·컬럼헤더·미리보기 박스 "티커 밑" 스티키 고정

## 🔧 실행 (Sonnet — className 변경 위주)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_277_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: `752fd52` (STEP 276). 빌드 ✓.
- **결과 커밋 예정**: STEP 277.

> ⚠️ 이건 **레이아웃 스티키**라 픽셀 오프셋이 살짝 안 맞을 수 있음. 적용 후 화면 보고 어긋나면(겹침/틈) 오프셋(`top-9`=36px 티커, `top-[80px]`=티커+필터바)만 미세조정하면 됨.

---

## 🎯 목표

홈 랭킹을 스크롤해도 **티커(상단 36px) 바로 밑에** 아래 3개를 고정:
1. 필터+기간칩 바 (주식 탭은 국가/시장 필터도 포함)
2. 표 컬럼헤더(순위·종목명·현재가·OO전 대비)
3. 미리보기 박스(차트+종목 토론)

원리/주의:
- 티커(`HomeIndexStrip`)는 `sticky top-0 h-9`(36px), 헤더는 비고정 → 스티키는 **뷰포트 기준** 가능.
- 표 카드의 `overflow-hidden`·`overflow-x-auto`가 스티키를 가둠 → **데스크톱(xl)에서만 `overflow-visible`로 해제**(모바일은 기존 유지).
- 미리보기가 지금 안 붙던 이유 = grid `items-start`라 스티키가 움직일 공간이 없어서 → **`items-start` 제거**(셀이 표 높이만큼 늘어나 스티키 동작).

> 우측 레일·탭은 고정 안 함(그대로 스크롤).

---

## 📄 파일 1 — `components/home-v6/HomePerfRanking.tsx` (ETF·ETN·리츠)

### (1-A) grid에서 items-start 제거
**찾기:** `<div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">`
**바꾸기:** `<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">`

### (1-B) 카드 overflow를 xl에서 해제
**찾기:** `<section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">`
**바꾸기:** `<section className="overflow-hidden xl:overflow-visible rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">`

### (1-C) 필터+기간칩 바 스티키
**찾기:** `<div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-unjong-border px-3 py-2">`
**바꾸기:** `<div className="sticky top-9 z-20 flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-unjong-border bg-unjong-surface px-3 py-2">`

### (1-D) 표 래퍼 overflow xl 해제
**찾기:** `<div className="overflow-x-auto">`
**바꾸기:** `<div className="overflow-x-auto xl:overflow-visible">`

### (1-E) 컬럼헤더(thead tr) 스티키
**찾기:** `<tr className="border-b border-unjong-border text-xs text-unjong-muted">`
**바꾸기:** `<tr className="sticky top-[80px] z-10 border-b border-unjong-border bg-unjong-surface text-xs text-unjong-muted">`

---

## 📄 파일 2 — `components/market/MarketClient.tsx` (주식)

### (2-A) grid items-start 제거
**찾기:** `<div className={embedded ? "grid grid-cols-1 items-start gap-4 xl:grid-cols-3" : ""}>`
**바꾸기:** `<div className={embedded ? "grid grid-cols-1 gap-4 xl:grid-cols-3" : ""}>`

### (2-B) 카드 overflow xl 해제
**찾기:**
```tsx
          <section className={`overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft ${embedded ? "min-w-0 xl:col-span-2" : ""}`}>
```
**바꾸기:**
```tsx
          <section className={`overflow-hidden xl:overflow-visible rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft ${embedded ? "min-w-0 xl:col-span-2" : ""}`}>
```

### (2-C) 필터 헤더 바 스티키
**찾기:** `<div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-unjong-border px-3 py-2">`
**바꾸기:** `<div className="sticky top-9 z-20 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-unjong-border bg-unjong-surface px-3 py-2">`

### (2-D) 표 래퍼 overflow xl 해제
**찾기:** `<div className="overflow-x-auto">`
**바꾸기:** `<div className="overflow-x-auto xl:overflow-visible">`

### (2-E) 컬럼헤더(thead tr) 스티키
**찾기:** `<tr className="text-xs text-unjong-muted border-b border-unjong-border">`
**바꾸기:** `<tr className="sticky top-[80px] z-10 bg-unjong-surface text-xs text-unjong-muted border-b border-unjong-border">`

> (참고: `/market` 단독 페이지엔 티커가 없어 스크롤 시 상단에 36px 정도 여백이 생길 수 있음 — 사소함. 홈이 우선.)

---

## 📄 파일 3 — `components/home-v6/HomeStockDetail.tsx` (미리보기 박스)

### (3-A) 미리보기 스티키 오프셋 티커 밑으로
**찾기:** `<div className="sticky top-5 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">`
**바꾸기:** `<div className="sticky top-9 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">`

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333) — **데스크톱 넓은 화면**에서:
1. 주식/ETF/ETN/리츠 탭에서 100개를 스크롤 → **필터+기간칩 바**와 **컬럼헤더(순위·종목명·현재가·대비)**가 티커 바로 밑에 계속 붙어 있는지.
2. **미리보기 박스(차트+종목 토론)**도 티커 밑에 고정돼 스크롤 중 계속 보이는지.
3. 우측 레일(실시간채팅·관심종목)·탭은 그대로 스크롤되는지.
4. 겹침/틈 있으면 → 오프셋만 알려주면 미세조정(현재: 티커 36px → 필터바 `top-9`, 컬럼헤더 `top-[80px]`).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat: 필터바·컬럼헤더·미리보기 박스 티커 밑 스티키 고정 (홈 랭킹) (STEP 277)" && git push
```

---

> **한 줄 요약**: 홈 랭킹 스크롤 시 필터바·컬럼헤더·미리보기를 티커 밑에 스티키 고정. 카드 overflow를 xl에서 풀고 grid items-start 제거가 핵심.
