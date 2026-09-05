<!-- 2026-06-20 -->
# STEP 333 — [UI] 특수 탭 중복 헤더 제거 (유튜브·종목·상품·리딩방)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_333_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
링크 카테고리(STEP 332)에 이어, **특수 탭의 중복 헤더도 제거** (탭에 이미 이름이 떠 있어 중복):
- 유튜브: `한국 주식 유튜브 Top 100 / …` 제거
- 종목·상품: `종목·상품` 제거
- 리딩방·검증: `리딩방·검증 / 금감원 신고…` 제거 — **단 출처·주의 안내 박스는 유지**(법적 고지)

> 변경 3파일: `MarketBoard.tsx`(1) · `YoutubeRanking.tsx`(2) · `AdvisorDirectory.tsx`(2). `SectionHeader.tsx`는 BrokerRanking에서 계속 쓰므로 유지.

---

## 📄 1) `components/toolbox/MarketBoard.tsx` — 종목·상품 헤더 제거

**찾기:**
```tsx
    <section className="min-w-0">
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">종목·상품</h2>
      </div>

      {/* 컨트롤 줄: 좌=하위탭 / 우(w-72)=증권사 바로가기 헤더 */}
```
**바꾸기:**
```tsx
    <section className="min-w-0">
      {/* 컨트롤 줄: 좌=하위탭 / 우(w-72)=증권사 바로가기 헤더 */}
```

---

## 📄 2) `components/toolbox/YoutubeRanking.tsx` — 유튜브 헤더 제거 (2곳)

### 2-1 안 쓰는 SectionHeader import 제거
**찾기:**
```tsx
import ListRow from './ListRow';
import SectionHeader from './SectionHeader';
```
**바꾸기:**
```tsx
import ListRow from './ListRow';
```

### 2-2 헤더 + 안 쓰는 week 변수 제거
**찾기:**
```tsx
  const week = channels[0]?.week_label ?? '';
  return (
    <section className="min-w-0">
      <SectionHeader title="한국 주식 유튜브 Top 100" subtitle={`${week} · 구독자순 · 매주 갱신`} />
      <div>
```
**바꾸기:**
```tsx
  return (
    <section className="min-w-0">
      <div>
```

---

## 📄 3) `components/toolbox/AdvisorDirectory.tsx` — 리딩방 헤더 제거 (2곳, 안내박스 유지)

### 3-1 안 쓰는 SectionHeader import 제거
**찾기:**
```tsx
import SelectDropdown from './SelectDropdown';
import SectionHeader from './SectionHeader';
```
**바꾸기:**
```tsx
import SelectDropdown from './SelectDropdown';
```

### 3-2 헤더만 제거 (출처·주의 안내 `<p>`는 유지)
**찾기:**
```tsx
    <section className="min-w-0">
      <SectionHeader title="리딩방·검증" subtitle="금융감독원 신고 유사투자자문 조회" />
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
```
**바꾸기:**
```tsx
    <section className="min-w-0">
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러 (유튜브·리딩방의 SectionHeader import 제거 → unused 경고 없음).

개발 서버 (각 탭 새로고침/이동):
1. **유튜브** — 헤더 없이 바로 랭킹 리스트.
2. **종목·상품** — 헤더 없이 바로 하위탭(주식·ETF·ETN·리츠).
3. **리딩방·검증** — `리딩방·검증` 제목 사라지고, **출처·주의 안내 박스가 맨 위**(유지).

> ⚠️ HMR이 또 안 잡으면 dev 서버 재시작 후 확인.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/MarketBoard.tsx components/toolbox/YoutubeRanking.tsx components/toolbox/AdvisorDirectory.tsx && git commit -m "ui(gateway): 특수 탭(유튜브·종목·상품·리딩방) 중복 헤더 제거, 리딩방 안내박스 유지 (STEP 333)" && git push
```

---

> **한 줄 요약**: 모든 탭에서 카테고리명 반복 헤더 제거 — 유튜브·종목·상품·리딩방 헤더 삭제(리딩방 법적 고지 박스는 유지).
