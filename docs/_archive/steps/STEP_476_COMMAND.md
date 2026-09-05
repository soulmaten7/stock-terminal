<!-- 2026-07-01 -->
# STEP 476 — US 종목표 모바일 최종 디자인 (KR 475+477+478 미러)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_476_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (`components/toolbox/UsMarketBoard.tsx` 1파일)
확정된 KR 모바일 디자인을 US에 그대로 적용:
- **바텀시트 스냅포인트** (50vh→66vh, overscroll 차단) — STEP 475
- **모바일 카드형** (티커+종목명 강조, 현재가 작게, 우측 기간% ) — STEP 477
- **모바일 정렬 헤더 = PC 동일** (종목명·현재가 정렬 + 기간 커스텀 드롭다운) — STEP 478

> US 차이만: 상태 `period`(KR `mobilePeriod`), `periodCell(r)`, 종목명=티커+회사명, `formatPrice(_, 'US')`, 표 `sm:min-w-[600px]`. 클라이언트 컴포넌트 → HMR 즉시.

---

## 1) 시트 스냅 상태 + 드래그 핸들러

**찾을 것:**
```tsx
  // 모바일 하단 시트: 핸들을 잡고 아래로 드래그하면 닫힘 (리딩방 시트와 동일)
  const [sheetDragY, setSheetDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  function onSheetTouchStart(e: ReactTouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onSheetTouchMove(e: ReactTouchEvent) {
    if (dragStartY.current === null) return;
    setSheetDragY(Math.max(0, e.touches[0].clientY - dragStartY.current));
  }
  function onSheetTouchEnd() {
    if (sheetDragY > 90) setSelectedStock(null);
    setSheetDragY(0);
    dragStartY.current = null;
  }
```
**바꿀 것:**
```tsx
  // 모바일 하단 시트 스냅포인트: 50vh 기본 → 위로 끌면 66vh, 아래로 끌면 축소/닫힘
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);
  function onSheetTouchStart(e: ReactTouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onSheetTouchMove(e: ReactTouchEvent) {
    if (dragStartY.current === null) return;
    setSheetDragY(e.touches[0].clientY - dragStartY.current);
  }
  function onSheetTouchEnd() {
    const dy = sheetDragY;
    if (dy < -60) setSheetExpanded(true);
    else if (dy > 90) {
      if (sheetExpanded) setSheetExpanded(false);
      else setSelectedStock(null);
    }
    setSheetDragY(0);
    dragStartY.current = null;
  }
```

## 2) 모바일 기간 드롭다운 상태·ref 추가

**찾을 것:**
```tsx
  const [periodOpen, setPeriodOpen] = useState(false); // 기간 커스텀 드롭다운 열림
  const periodRef = useRef<HTMLDivElement>(null);
```
**바꿀 것:**
```tsx
  const [periodOpen, setPeriodOpen] = useState(false); // 기간 커스텀 드롭다운 열림(데스크탑)
  const periodRef = useRef<HTMLDivElement>(null);
  const [periodOpenM, setPeriodOpenM] = useState(false); // 기간 커스텀 드롭다운 열림(모바일)
  const periodRefM = useRef<HTMLDivElement>(null);
```

## 3) 바깥 클릭 닫기 — 모바일 드롭다운 포함

**찾을 것:**
```tsx
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
```
**바꿀 것:**
```tsx
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (periodRefM.current && !periodRefM.current.contains(e.target as Node)) setPeriodOpenM(false);
```

## 4) 모바일 정렬 헤더 + 표를 sm 이상에서만

**찾을 것:**
```tsx
            <table className="w-full min-w-[320px] table-fixed text-sm sm:min-w-[600px]">
```
**바꿀 것:**
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
                <div ref={periodRefM} className="relative w-[4.75rem]">
                  <button
                    type="button"
                    onClick={() => setPeriodOpenM((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={periodOpenM}
                    className={`flex w-full items-center justify-between gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs outline-none hover:border-unjong-accent ${sortKey === period ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                  >
                    {PERIODS.find((p) => p.key === period)?.label ?? '기간'}
                    <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpenM ? 'rotate-180' : ''}`} />
                  </button>
                  {periodOpenM ? (
                    <div role="listbox" className="absolute right-0 top-full z-50 mt-1 w-[4.75rem] overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                      {PERIODS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          role="option"
                          aria-selected={p.key === period}
                          onClick={() => { setPeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpenM(false); }}
                          className={`block w-full px-2 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === period ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button type="button" onClick={() => clickHeader(period)} aria-label="선택 기간 정렬 방향" className="shrink-0 text-unjong-muted">
                  {sortArrow(period)}
                </button>
              </span>
            </div>
            <table className="hidden w-full table-fixed text-sm sm:table sm:min-w-[600px]">
```

## 5) 표 닫은 뒤 모바일 카드 리스트

**찾을 것:**
```tsx
              </tbody>
            </table>
          )}
```
**바꿀 것:**
```tsx
              </tbody>
            </table>
            {/* 모바일 전용 카드 리스트 — 1줄 티커·종목명, 2줄 현재가(좌)+선택기간 수익률(우) */}
            <div className="sm:hidden">
              {paginated.map((r, i) => (
                <Fragment key={r.symbol}>
                  <div
                    onClick={() => { setSheetExpanded(false); setSelectedStock((s) => (s?.symbol === r.symbol ? null : r)); }}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 active:bg-unjong-background"
                  >
                    <span className="w-5 shrink-0 text-center text-xs tabular-nums text-unjong-muted">{page * PAGE_SIZE + i + 1}</span>
                    <StockLogo code={r.symbol} name={r.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] leading-tight text-unjong-primary"><span className="font-bold">{r.symbol}</span><span className="ml-1.5 text-xs text-unjong-muted">{r.name}</span></p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xs tabular-nums text-unjong-muted">{r.price ? formatPrice(r.price, 'US') : '—'}</span>
                        <span className={`shrink-0 text-[13px] tabular-nums font-semibold ${pctColor(periodCell(r))}`}>
                          <span className="mr-1 text-[10px] font-normal text-unjong-muted">{PERIODS.find((p) => p.key === period)?.label}</span>
                          {periodCell(r) === undefined ? '…' : pct(periodCell(r))}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                      aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                      className={`shrink-0 transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border'}`}
                    >
                      <Star size={18} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  {(i + 1) % 10 === 0 && i + 1 < paginated.length ? <AdSlotRow slot="broker" /> : null}
                </Fragment>
              ))}
            </div>
          )}
```

## 6) 바텀시트 — 스냅 높이 + overscroll 차단 + 내부 스크롤

**찾을 것** (`<div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh]...` 부터 그 닫는 `</div>`까지):
```tsx
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface px-4 pb-4 pt-2 shadow-xl"
            style={{ transform: `translateY(${sheetDragY}px)`, transition: sheetDragY ? 'none' : 'transform 0.2s ease' }}
          >
            {/* 드래그 핸들 — 잡고 아래로 내리면 닫힘 (바깥 터치로도 닫힘) */}
            <div
              className="flex touch-none cursor-grab justify-center pb-3 pt-1 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            <div className="mb-3 flex items-center gap-3">
              <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-snug text-unjong-primary">{selectedStock.symbol}</p>
                <p className="font-mono text-xs text-unjong-muted">
                  {selectedStock.name} · {selectedStock.price ? formatPrice(selectedStock.price, 'US') : '—'}
                  <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                </p>
              </div>
            </div>
            {/* 종목 정보 — 현재가 + 기간별 수익률 (증권사 목록 위) */}
            <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs text-unjong-muted">현재가</span>
                <span className="text-base font-bold tabular-nums text-unjong-primary">{selectedStock.price ? formatPrice(selectedStock.price, 'US') : '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                {([
                  ['1일전', selectedStock.changePercent],
                  ['1주일전', selectedStock.r1w],
                  ['1개월전', selectedStock.r1m],
                  ['3개월전', selectedStock.r3m],
                  ['6개월전', selectedStock.r6m],
                  ['1년전', selectedStock.r1y],
                ] as [string, number | null | undefined][]).map(([label, v]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-[11px] text-unjong-muted">{label}</span>
                    <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
            <BrokerRanking hideHeader />
          </div>
```
**바꿀 것:**
```tsx
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl border-t border-unjong-border bg-unjong-surface shadow-xl"
            style={{ height: sheetExpanded ? '66vh' : '50vh', transform: `translateY(${Math.max(0, sheetDragY)}px)`, transition: sheetDragY ? 'none' : 'transform 0.2s ease, height 0.2s ease' }}
          >
            <div
              className="flex shrink-0 touch-none cursor-grab justify-center pb-3 pt-2 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              <div className="mb-3 flex items-center gap-3">
                <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.symbol}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.name} · {selectedStock.price ? formatPrice(selectedStock.price, 'US') : '—'}
                    <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                  </p>
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs text-unjong-muted">현재가</span>
                  <span className="text-base font-bold tabular-nums text-unjong-primary">{selectedStock.price ? formatPrice(selectedStock.price, 'US') : '—'}</span>
                </div>
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
                  {([
                    ['1일전', selectedStock.changePercent],
                    ['1주일전', selectedStock.r1w],
                    ['1개월전', selectedStock.r1m],
                    ['3개월전', selectedStock.r3m],
                    ['6개월전', selectedStock.r6m],
                    ['1년전', selectedStock.r1y],
                  ] as [string, number | null | undefined][]).map(([label, v]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-[11px] text-unjong-muted">{label}</span>
                      <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
              <BrokerRanking hideHeader />
            </div>
          </div>
```

---

## 7) 빌드 + 검증
```bash
npm run build
```
- [ ] 미국 → 종목·상품 모바일: 티커 굵게+종목명, 현재가 작게, 우측 기간%. 헤더 `종목명 ⇅ 현재가 ⇅ [1일전 ▾] ⇅` (PC 동일, 드롭다운 제자리 열림).
- [ ] 종목 탭 → 시트 50→66vh 스냅, 새로고침 안 됨. 데스크탑 표 그대로.

## 8) 커밋
```bash
git add components/toolbox/UsMarketBoard.tsx && git commit -m "feat(mobile): US 종목표 모바일 최종 디자인 — 카드형+시트 스냅+PC식 정렬 헤더 (KR 475/477/478 미러) (STEP 476)" && git push
```
