<!-- 2026-06-18 -->
# STEP 273 — 기간칩(1일~1년) 표 카드 상단 바로 이동 · 우측 정렬 통일

## 🔧 실행 (Sonnet — 정확한 find/replace 명세 제공)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_273_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: `3bbef6e` (STEP 272). 빌드 ✓.
- **결과 커밋 예정**: STEP 273.

---

## 🎯 목표

홈 랭킹 탭(주식·ETF·ETN·리츠)에서 기간칩(`1일 1주일 1개월 3개월 6개월 1년`)의 위치가 탭마다 제각각이다(ETF/ETN/리츠는 좌측, 주식은 필터 뒤). 이걸 **표 카드(순위·종목명·현재가·대비) 바로 위, 표 카드 폭 안에서 우측 정렬**된 헤더 바로 통일한다. 그래야 모든 탭에서 위치가 고정돼 UI가 안 깨진다.

- 우측 정렬 기준 = **표 카드(2/3 폭) 오른쪽 끝** (미리보기 패널 위가 아님).
- 기존 안내문(`거래대금 상위 · KRX` / `기간 수익률 · 최근 시세 기준`)은 그 바 **왼쪽에 유지**.
- **주식 탭의 국내/미국/코스피/코스닥 필터는 위에 그대로** 두고, **기간칩만** 표 위로 이동.
- 대상 컴포넌트 3개: `MarketClient`(주식) · `HomeEtfRanking`(ETF) · `HomePerfRanking`(ETN·리츠).

**결과 모양(ETF 예시)**:
```
┌─────────────────────────────────────────┐   ┌────────┐
│ 거래대금 상위·KRX ········ [1일][1주]…[1년] │   │ 미리보기 │  ← 표 카드 상단 바, 칩 우측정렬
│ 순위  종목명       현재가   1일전 대비      │   │        │
│ ...                                       │   │        │
└─────────────────────────────────────────┘   └────────┘
```

> 핵심: 각 표 `<section>` 카드의 **맨 위에 기간칩 헤더 바를 삽입**하고, 기존에 그리드 위에 떠 있던 기간칩 줄은 **삭제**한다.

---

## 📄 파일 1 — `components/home-v6/HomeEtfRanking.tsx`

### (1-A) 그리드 위 기존 기간칩 줄 삭제
**찾기:**
```tsx
      {/* 기간칩 (위, 풀폭 — 주식과 동일 위치/스타일) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-unjong-muted">
          {asset === "etf" ? (period === "1d" ? "거래대금 상위 · KRX (실시간 아님)" : "기간 수익률 · 최근 시세 기준") : ""}
        </span>
      </div>

```
**→ 통째로 삭제(빈 줄 포함).**

### (1-B) 표 `<section>` 맨 위에 기간칩 바 삽입
**찾기:**
```tsx
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {asset === "fund" ? (
```
**바꾸기:**
```tsx
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {/* 기간칩 헤더 바 — 표 바로 위, 우측 정렬 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-unjong-border px-3 py-2">
            <span className="text-[11px] text-unjong-muted">
              {period === "1d" ? "거래대금 상위 · KRX (실시간 아님)" : "기간 수익률 · 최근 시세 기준"}
            </span>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1 gap-y-2">
              {PERIODS.map((p) => (
                <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {asset === "fund" ? (
```

---

## 📄 파일 2 — `components/home-v6/HomePerfRanking.tsx`

### (2-A) 그리드 위 기존 기간칩 줄 삭제
**찾기:**
```tsx
      {/* 기간칩 (위, 풀폭 — 주식·ETF와 동일) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-unjong-muted">기간 수익률 · 최근 시세 기준</span>
      </div>

```
**→ 통째로 삭제(빈 줄 포함).**

### (2-B) 표 `<section>` 맨 위에 기간칩 바 삽입
**찾기:**
```tsx
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {loading ? (
```
**바꾸기:**
```tsx
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {/* 기간칩 헤더 바 — 표 바로 위, 우측 정렬 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-unjong-border px-3 py-2">
            <span className="text-[11px] text-unjong-muted">기간 수익률 · 최근 시세 기준</span>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1 gap-y-2">
              {PERIODS.map((p) => (
                <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
```

---

## 📄 파일 3 — `components/market/MarketClient.tsx`

### (3-A) 필터 줄에서 기간칩만 제거 (국내/미국/시장 필터는 유지)
**찾기:**
```tsx
          ))}

        <span className="mx-1.5 h-5 w-px bg-unjong-border" />
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
      </div>
```
**바꾸기:**
```tsx
          ))}
      </div>
```
> (시장 필터 MARKETS.map의 닫는 `))}`는 그대로 두고, 그 뒤의 구분선 `<span>`과 PERIODS.map만 제거하는 것.)

### (3-B) 표 `<section>` 맨 위에 기간칩 바 삽입
**찾기:**
```tsx
          <section className={`overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft ${embedded ? "min-w-0 xl:col-span-2" : ""}`}>
            {loading ? (
```
**바꾸기:**
```tsx
          <section className={`overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft ${embedded ? "min-w-0 xl:col-span-2" : ""}`}>
            {/* 기간칩 헤더 바 — 표 바로 위, 우측 정렬 */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-unjong-border px-3 py-2">
              <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1 gap-y-2">
                {PERIODS.map((p) => (
                  <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
```
> 주식 탭은 좌측 안내문 없이 기간칩만 우측 정렬(ml-auto). 국내/미국/코스피/코스닥 필터는 (3-A) 이후에도 위쪽 필터 줄에 그대로 남는다.

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 + 미사용 변수/임포트 경고 없을 것(`PERIODS`·`chip`·`period`·`setPeriod`는 여전히 사용됨).

개발 서버(`npm run dev`, 포트 3333) 눈 확인:
1. 홈 → **주식 / ETF / ETN / 리츠** 4개 탭 모두 → 기간칩이 **표 카드 바로 위, 우측 정렬**로 동일 위치에 보일 것.
2. 주식 탭 → **국내/미국/코스피/코스닥 필터는 그대로** 위에 있고, 기간칩만 표 위로 내려옴.
3. 기간칩 클릭 시 정렬·라벨(`{기간}전 대비`) 정상 동작.
4. `/market` 단독 페이지(비-embedded)도 깨지지 않는지 확인(표 위 우측 정렬 칩).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "style: 기간칩을 표 카드 상단 바로 이동·우측정렬 통일 (주식·ETF·ETN·리츠) (STEP 273)" && git push
```

---

> **한 줄 요약**: 흩어져 있던 기간칩을 각 표 `<section>` 카드 맨 위 헤더 바로 옮기고 우측 정렬 → 4개 탭에서 위치 고정, UI 안 깨짐.
