<!-- 2026-06-18 -->
# STEP 278 — 랭킹 탭도 티커 밑 스티키 고정 (+ 하위 오프셋 재조정)

## 🔧 실행 (Sonnet — className 오프셋 변경)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_278_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 277 결과 커밋. 빌드 ✓.
- **결과 커밋 예정**: STEP 278.

> ⚠️ STEP 277과 동일하게 픽셀 오프셋이 살짝 어긋날 수 있음(탭 높이 가정 ~38px). 적용 후 겹침/틈이 보이면 숫자만 미세조정.

---

## 🎯 목표

STEP 277에서 필터바·컬럼헤더·미리보기를 티커 밑에 고정함. 이번엔 **랭킹 탭(주식/ETF/ETN/리츠/리딩방 리스트)도 티커 바로 밑에 고정**.

새 스택(위→아래): **티커(36px) → 탭(~38px) → 필터+기간칩 → 컬럼헤더**.
→ 탭이 새로 36px 자리에 들어가므로, 그 아래 요소들의 sticky top을 **탭 높이(약 38px)만큼 내림**:
- 필터바: `top-9`(36px) → `top-[74px]` (36+38)
- 컬럼헤더(thead): `top-[80px]` → `top-[118px]` (74+44)
- 미리보기 박스: `top-9` → `top-[74px]` (탭이 미리보기 위도 덮으므로 탭 밑으로)

---

## 📄 파일 1 — `components/home-v6/HomeRankingTabs.tsx` (탭바 고정)

**찾기:**
```tsx
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
```
**바꾸기:**
```tsx
      <div className="sticky top-9 z-20 mb-4 flex items-center gap-1 border-b border-unjong-border bg-unjong-surface">
```

---

## 📄 파일 2 — `components/home-v6/HomePerfRanking.tsx` (ETF·ETN·리츠)

### (2-A) 필터바 오프셋 ↓
**찾기:** `sticky top-9 z-20 flex flex-wrap items-center gap-x-2`
**바꾸기:** `sticky top-[74px] z-20 flex flex-wrap items-center gap-x-2`

### (2-B) 컬럼헤더 오프셋 ↓
**찾기:** `sticky top-[80px] z-10 border-b border-unjong-border bg-unjong-surface text-xs text-unjong-muted`
**바꾸기:** `sticky top-[118px] z-10 border-b border-unjong-border bg-unjong-surface text-xs text-unjong-muted`

---

## 📄 파일 3 — `components/market/MarketClient.tsx` (주식)

### (3-A) 필터바 오프셋 ↓
**찾기:** `sticky top-9 z-20 flex flex-wrap items-center gap-x-1`
**바꾸기:** `sticky top-[74px] z-20 flex flex-wrap items-center gap-x-1`

### (3-B) 컬럼헤더 오프셋 ↓
**찾기:** `sticky top-[80px] z-10 bg-unjong-surface text-xs text-unjong-muted border-b border-unjong-border`
**바꾸기:** `sticky top-[118px] z-10 bg-unjong-surface text-xs text-unjong-muted border-b border-unjong-border`

---

## 📄 파일 4 — `components/home-v6/HomeStockDetail.tsx` (미리보기 박스)

**찾기:** `<div className="sticky top-9 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">`
**바꾸기:** `<div className="sticky top-[74px] overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">`

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333) — **넓은 화면**에서 스크롤:
1. **랭킹 탭(주식/ETF/ETN/리츠/리딩방 리스트)**이 티커 바로 밑에 고정돼, 스크롤 중에도 탭 전환이 되는지.
2. 그 밑으로 **필터+기간칩 → 컬럼헤더**가 순서대로 겹침 없이 붙는지.
3. **미리보기 박스**도 탭/필터 밑에 고정되는지.
4. 겹침/틈 있으면 → 그 모습 알려주면 오프셋(탭 `top-9`, 필터 `top-[74px]`, 컬럼헤더 `top-[118px]`) 미세조정.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat: 랭킹 탭도 티커 밑 스티키 고정 + 하위 요소 오프셋 재조정 (STEP 278)" && git push
```

---

> **한 줄 요약**: 랭킹 탭을 티커 밑에 추가 고정(top-9)하고, 필터바·컬럼헤더·미리보기 sticky 오프셋을 탭 높이만큼 내림.
