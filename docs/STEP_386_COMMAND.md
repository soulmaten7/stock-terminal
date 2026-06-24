<!-- 2026-06-24 -->
# STEP 386 — 종목 표 컬럼 고정(table-fixed) + 숫자 페이지네이션(리딩방 방식 통일)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_386_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
1. **컬럼 위치 고정**: 표가 `table-auto`라 데이터(현재가 자릿수·기간 "—" vs "+1403%")에 따라 칸 너비가 출렁여 UI가 깨짐 → **`table-fixed` + 칸별 고정폭**으로 데이터 유무와 무관하게 `# 종목명 현재가 1일 1주일 1개월 3개월 6개월 1년 ⭐` 위치 고정. (주식/ETF/ETN/리츠 전부 MarketBoard라 한 번에 적용.)
2. **숫자 페이지네이션**: `← 이전 / 다음 →`만 → `← 1 2 3 … 52 →`(현재 페이지 강조). 리딩방(AdvisorDirectory)의 `pageNumbers()` 동일 방식으로 통일.

변경 1파일: `components/toolbox/MarketBoard.tsx` (8곳).

---

## ① 표 — table-fixed
**찾기:**
```tsx
            <table className="w-full min-w-[320px] text-sm sm:min-w-[720px]">
```
**바꾸기:**
```tsx
            <table className="w-full min-w-[320px] table-fixed text-sm sm:min-w-[760px]">
```

## ② thead 컬럼별 고정폭 (5곳)

**# th** — 찾기:
```tsx
                  <th className="py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
```
바꾸기:
```tsx
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
```

**현재가 th** — 찾기:
```tsx
                  <th className="whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
```
바꾸기:
```tsx
                  <th className="w-[88px] whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
```

**모바일 드롭다운 th** — 찾기:
```tsx
                  <th className="whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium sm:hidden">
```
바꾸기:
```tsx
                  <th className="w-[84px] whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium sm:hidden">
```

**기간 th(map)** — 찾기:
```tsx
                    <th key={p.key} className="hidden whitespace-nowrap px-2 py-2.5 text-right font-medium sm:table-cell">
```
바꾸기:
```tsx
                    <th key={p.key} className="hidden w-[84px] whitespace-nowrap px-2 py-2.5 text-right font-medium sm:table-cell">
```
> (`#`·`종목명`은 그대로 — 종목명 `w-full`이 남는 폭 흡수. ⭐ th는 이미 `w-9`.)

## ③ 종목명 셀 — 고정폭에서 길면 말줄임(truncate)
**찾기:**
```tsx
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <StockLogo code={r.symbol} name={r.name} size={24} />
                        <span className="font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
```
**바꾸기:**
```tsx
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <StockLogo code={r.symbol} name={r.name} size={24} />
                        <span className="truncate font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
```

## ④ pageNumbers() 함수 추가 (clickHeader 아래)
**찾기:**
```tsx
  function clickHeader(k: PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }
```
**바꾸기:**
```tsx
  function clickHeader(k: PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  function pageNumbers(): (number | '…')[] {
    const out: (number | '…')[] = [];
    const cur = page + 1; // page는 0-based, 표시는 1-based
    const win = 2;
    const start = Math.max(1, cur - win);
    const end = Math.min(totalPages, cur + win);
    if (start > 1) { out.push(1); if (start > 2) out.push('…'); }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages) { if (end < totalPages - 1) out.push('…'); out.push(totalPages); }
    return out;
  }
```

## ⑤ 페이지네이션 렌더 — 숫자 방식으로 교체
**찾기:**
```tsx
          {/* 페이지네이션 */}
          {!loading && sorted.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-unjong-border px-2 py-2.5 text-xs text-unjong-muted">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded px-2 py-1 hover:bg-unjong-background disabled:opacity-30"
              >
                ← 이전
              </button>
              <span>{page + 1} / {totalPages} 페이지 (총 {sorted.length.toLocaleString()} 종목)</span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded px-2 py-1 hover:bg-unjong-background disabled:opacity-30"
              >
                다음 →
              </button>
            </div>
          )}
```
**바꾸기:**
```tsx
          {/* 페이지네이션 — 숫자 페이지 (리딩방과 동일 방식) */}
          {!loading && sorted.length > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-center gap-1 border-t border-unjong-border px-2 py-3 text-xs">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">←</button>
              {pageNumbers().map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-1 text-unjong-muted">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage((n as number) - 1)}
                    className={`h-7 min-w-[1.75rem] rounded px-1 tabular-nums transition-colors ${page === (n as number) - 1 ? 'bg-unjong-primary font-bold text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
                  >
                    {n}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">→</button>
              <span className="ml-2 text-unjong-muted">총 {sorted.length.toLocaleString()} 종목</span>
            </div>
          )}
```

---

## ✅ 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
무에러 시:
```bash
cd ~/stock-terminal && git add -A && git commit -m "fix(market): 종목 표 table-fixed 컬럼 고정 + 숫자 페이지네이션(리딩방 방식 통일) (STEP 386)" && git push
```

## 🌅 확인
- 정렬/페이지 바꿔도 `# 종목명 현재가 1일~1년 ⭐` **컬럼 위치 고정**(데이터 "—"든 "+1403%"든).
- 하단 페이지 = `← 1 2 3 … 52 →`, 현재 페이지 민트 강조, 숫자 눌러 이동.
- 긴 종목명은 `…`로 말줄임(칸 안 깨짐). 칸 폭이 화면에서 빡빡하면 알려줘 — px만 미세조정.

---

> **한 줄 요약**: 표 `table-fixed`+칸별 고정폭(컬럼 출렁임 제거) + 숫자 페이지네이션(리딩방 `pageNumbers()` 통일). 1파일.
