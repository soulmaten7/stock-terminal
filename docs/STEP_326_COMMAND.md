<!-- 2026-06-20 -->
# STEP 326 — [UI] 종목·상품: 증권사 헤더 줄맞춤 + 텍스트 변경 + 부제 제거

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_326_COMMAND.md 파일 내용대로 실행해줘
```
- **전제**: STEP 325(`MarketBoard` 좌:표 / 우:증권사).

---

## 🎯 목표 (UI 통일감)
1. 증권사 섹션 헤더 텍스트: `증권사 / 거래대금순 · 최근 분기 근사치` → **`증권사 바로가기 / 최근 분기 거래대금순`**.
2. 그 헤더를 **하위탭(주식·ETF·ETN·리츠)과 같은 줄 우측(증권사 컬럼 위)**으로 이동 → 좌(하위탭)↔우(증권사 헤더) 칼럼이 아래 표↔증권사 리스트와 정확히 정렬.
3. 종목·상품 **부제 한 줄 제거**(`기간별 수익률 · 지연 시세… 정렬`) — 표에 다 나오니 군더더기.

> 변경 2파일: `BrokerRanking.tsx`(헤더 숨김 옵션) · `MarketBoard.tsx`(2곳).
> 참고: "지연 시세(참고용)" 문구도 같이 사라짐 — 필요하면 작게 다시 넣어줄게(지연 시세는 표준이라 필수는 아님).

---

## 📄 파일 1 — `components/toolbox/BrokerRanking.tsx` (헤더 숨김 옵션)

**찾기:**
```tsx
export default function BrokerRanking() {
  return (
    <section className="min-w-0">
      <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />
```
**바꾸기:**
```tsx
export default function BrokerRanking({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <section className="min-w-0">
      {!hideHeader && <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />}
```

---

## 📄 파일 2 — `components/toolbox/MarketBoard.tsx` (수정 2곳)

### 1 — 부제 제거 + 하위탭 줄을 "컨트롤 줄"로(우측에 증권사 헤더)

**찾기:**
```tsx
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">종목·상품</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">기간별 수익률 · 지연 시세(참고용) · 기간 컬럼을 누르면 그 기준 순으로 정렬</p>
      </div>

      <div className="mb-2 flex gap-1 overflow-x-auto">
        {SUBTABS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setTab(s.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
```
**바꾸기:**
```tsx
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">종목·상품</h2>
      </div>

      {/* 컨트롤 줄: 좌=하위탭 / 우(w-72)=증권사 바로가기 헤더 */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {SUBTABS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setTab(s.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="hidden w-72 shrink-0 lg:block">
          <p className="text-sm font-bold text-unjong-primary">증권사 바로가기</p>
          <p className="text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
        </div>
      </div>
```

### 2 — 증권사 리스트는 헤더 숨김(헤더가 위로 이동했으니)

**찾기:**
```tsx
        {/* 우측: 증권사 순위 — 기존 미리보기 자리, 스크롤 따라오게 sticky */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-11">
            <BrokerRanking />
          </div>
        </aside>
```
**바꾸기:**
```tsx
        {/* 우측: 증권사 리스트(헤더는 위 컨트롤 줄로 이동) — 스크롤 따라오게 sticky */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-11">
            <BrokerRanking hideHeader />
          </div>
        </aside>
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러 (`BrokerRanking`는 기본 `hideHeader=false`라 독립 '증권사' 탭은 그대로).

개발 서버:
1. 종목·상품 헤더가 **"종목·상품"** 한 줄(부제 없음).
2. **하위탭 줄 우측에 "증권사 바로가기 / 최근 분기 거래대금순"** — 그 아래 증권사 리스트와 칼럼 정렬.
3. 표(좌) / 증권사 리스트(우) 그대로, 헤더만 컨트롤 줄로 올라감.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/BrokerRanking.tsx components/toolbox/MarketBoard.tsx && git commit -m "ui(market): 증권사 헤더 '증권사 바로가기/최근 분기 거래대금순' + 하위탭 줄 우측 정렬, 종목·상품 부제 제거 (STEP 326)" && git push
```

---

> **한 줄 요약**: 증권사 헤더 텍스트·위치를 하위탭 줄 우측으로 정렬, 종목·상품 부제 제거. BrokerRanking에 hideHeader 옵션 추가.
