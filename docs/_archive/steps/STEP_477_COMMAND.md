<!-- 2026-07-01 -->
# STEP 477 — KR 모바일 리스트 개편 (컬럼 헤더식 정렬 + 종목명 강조)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_477_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (`components/toolbox/MarketBoard.tsx` 1파일 · STEP 475 모바일 개편)
STEP 475의 모바일 정렬이 단일 select라 이상했음. 사용자 피드백 반영:
1. **정렬을 컬럼 헤더식으로** — 데스크탑처럼 `[종목명 ⇅] [현재가 ⇅] … [기간 ▾ ⇅]`. 종목명·현재가는 왼쪽(카드의 이름/가격이 왼쪽 스택), 기간 드롭다운은 오른쪽(% 위). **종목명 정렬 복구.**
2. **종목명 강조** — 종목명 `굵게(bold)+15px`, 현재가는 `작게(12px)+연하게(muted)`. (상세는 종목 눌러서 시트로 보므로 카드는 종목명이 주인공.)

> 클라이언트 컴포넌트 → HMR 즉시. 모바일/반응형(≤640px)로 확인.

---

## 1) 모바일 정렬바 → 컬럼 헤더식으로 교체

**찾을 것** (STEP 475에서 넣은 단일 select 바 전체):
```tsx
            <div className="mb-3 flex items-center gap-2 sm:hidden">
              <span className="text-xs text-unjong-muted">정렬</span>
              <select
                value={sortKey}
                onChange={(e) => {
                  const v = e.target.value as 'name' | 'price' | PeriodKey;
                  setSortKey(v); setSortDir('desc'); setPage(0);
                  if (v !== 'name' && v !== 'price') setMobilePeriod(v as PeriodKey);
                }}
                className="rounded-lg border border-unjong-border bg-unjong-surface px-2 py-1.5 text-xs font-medium text-unjong-primary outline-none"
              >
                <option value="price">현재가</option>
                <option value="name">종목명</option>
                <option value="1d">1일 수익률</option>
                <option value="1w">1주일 수익률</option>
                <option value="1m">1개월 수익률</option>
                <option value="3m">3개월 수익률</option>
                <option value="6m">6개월 수익률</option>
                <option value="1y">1년 수익률</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                aria-label="정렬 방향 전환"
                className="rounded-lg border border-unjong-border px-2 py-1.5 text-xs font-medium text-unjong-muted"
              >
                {sortDir === 'desc' ? '↓ 내림' : '↑ 오름'}
              </button>
            </div>
```
**바꿀 것** (컬럼 헤더식 — `clickHeader`·`sortArrow` 재사용, 데스크탑과 동일 동작):
```tsx
            <div className="mb-1.5 flex items-center gap-3 border-b border-unjong-border pb-2 text-xs sm:hidden">
              <button
                type="button"
                onClick={() => clickHeader('name')}
                className={`inline-flex items-center gap-0.5 transition-colors ${sortKey === 'name' ? 'font-bold text-unjong-accent' : 'text-unjong-muted'}`}
              >
                종목명{sortArrow('name')}
              </button>
              <button
                type="button"
                onClick={() => clickHeader('price')}
                className={`inline-flex items-center gap-0.5 transition-colors ${sortKey === 'price' ? 'font-bold text-unjong-accent' : 'text-unjong-muted'}`}
              >
                현재가{sortArrow('price')}
              </button>
              <div className="flex-1" />
              <span className="inline-flex items-center gap-1">
                <select
                  value={mobilePeriod}
                  onChange={(e) => { const p = e.target.value as PeriodKey; setMobilePeriod(p); setSortKey(p); setSortDir('desc'); setPage(0); }}
                  aria-label="기간 선택 및 정렬"
                  className={`rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs outline-none ${sortKey === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                >
                  {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <button type="button" onClick={() => clickHeader(mobilePeriod)} aria-label="선택 기간 정렬 방향" className="text-unjong-muted">
                  {sortArrow(mobilePeriod)}
                </button>
              </span>
            </div>
```

## 2) 카드 종목명 — 굵게 + 크게

**찾을 것:**
```tsx
                      <p className="truncate font-medium text-unjong-primary">{r.name}</p>
```
**바꿀 것:**
```tsx
                      <p className="truncate text-[15px] font-bold leading-tight text-unjong-primary">{r.name}</p>
```

## 3) 카드 현재가 — 작게 + 연하게 (종목명 강조)

**찾을 것:**
```tsx
                        <span className="tabular-nums text-unjong-primary">{r.price ? formatPrice(r.price, 'KR') : '—'}</span>
```
**바꿀 것:**
```tsx
                        <span className="text-xs tabular-nums text-unjong-muted">{r.price ? formatPrice(r.price, 'KR') : '—'}</span>
```
> % 값 옆 기간 태그(예: `1일전`)는 그대로 둔다 — 우측 기간 드롭다운과 상하로 대응됨.

---

## 4) 빌드 + 검증
```bash
npm run build
```
- [ ] 모바일 상단에 `[종목명 ⇅] [현재가 ⇅] … [기간 ▾ ⇅]` 헤더 — 각각 눌러 정렬(재클릭 방향 전환), 활성은 민트색.
- [ ] 종목명이 **굵고 크게**, 현재가는 그 아래 작고 연하게, 우측 `1일전 +5.01%`.
- [ ] 데스크탑(≥640px) 표 그대로.

## 5) 커밋
```bash
git add components/toolbox/MarketBoard.tsx && git commit -m "feat(mobile): KR 종목 리스트 컬럼 헤더식 정렬(종목명·현재가·기간) + 종목명 강조·현재가 축소 (STEP 477)" && git push
```

## ⚠️ US
- 이 KR 디자인 확정되면 **STEP 476(US)을 같은 방식으로 업데이트** 후 실행. (지금 476 실행 보류.)
