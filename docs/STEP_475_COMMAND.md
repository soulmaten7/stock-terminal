<!-- 2026-07-01 -->
# STEP 475 (B) — 모바일 카드형 종목 리스트 + 바텀시트 스냅포인트 (KR MarketBoard)

## ▶ 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_475_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (`components/toolbox/MarketBoard.tsx` 1파일)
1. **모바일 종목명 잘림 해결** — 데스크탑 표를 모바일에 그대로 쓰던 걸(종목명 "효…"), **모바일 전용 카드형**으로: 1줄=종목명 풀 / 2줄=현재가(좌 고정)+선택기간 수익률(우 고정)+기간 태그. **데스크탑 표는 그대로.**
2. **바텀시트 스냅포인트** — 종목 클릭 시 시트가 화면 끝까지 올라와 '당겨서 새로고침' 충돌하던 걸: **기본 50vh → 위로 끌면 66vh(2/3)**, 100% 금지. 스크롤 영역 `overscroll-contain`으로 새로고침 차단.

> ⚠️ 클라이언트 컴포넌트라 HMR 즉시 반영(클린 재시작 불필요). 모바일은 **실제 폰 or 브라우저 반응형(≤640px)** 으로 확인.
> ℹ️ US `UsMarketBoard.tsx`도 같은 구조 — **동일 패턴은 STEP 476(다음)** 에서 미러(플레이북 §4-2 B 필수 표준).

---

## 1) 시트 스냅 상태 + 드래그 핸들러 교체

**찾을 것** (현재):
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
**바꿀 것**:
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
    setSheetDragY(e.touches[0].clientY - dragStartY.current); // 음수=위로, 양수=아래로
  }
  function onSheetTouchEnd() {
    const dy = sheetDragY;
    if (dy < -60) setSheetExpanded(true);          // 위로 끌기 → 확장(66vh)
    else if (dy > 90) {
      if (sheetExpanded) setSheetExpanded(false);  // 아래로: 확장상태면 축소(50vh)
      else setSelectedStock(null);                 // 기본상태면 닫기
    }
    setSheetDragY(0);
    dragStartY.current = null;
  }
```

## 2) 데스크탑 표를 모바일에서 숨기고, 그 앞에 모바일 정렬바 추가

**찾을 것**:
```tsx
            <table className="w-full min-w-[320px] table-fixed text-sm sm:min-w-[760px]">
```
**바꿀 것** (모바일 정렬바 + 표를 sm 이상에서만):
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
            <table className="hidden w-full table-fixed text-sm sm:table sm:min-w-[760px]">
```

## 3) 표 닫은 뒤에 모바일 카드 리스트 추가

**찾을 것** (표 끝 + 조건 닫힘):
```tsx
              </tbody>
            </table>
          )}
```
**바꿀 것**:
```tsx
              </tbody>
            </table>
            {/* 모바일 전용 카드 리스트 — 1줄 종목명 풀, 2줄 현재가(좌)+선택기간 수익률(우) */}
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
                      <p className="truncate font-medium text-unjong-primary">{r.name}</p>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="tabular-nums text-unjong-primary">{r.price ? formatPrice(r.price, 'KR') : '—'}</span>
                        <span className={`shrink-0 tabular-nums font-semibold ${pctColor(r[mobileField] as number | null | undefined)}`}>
                          <span className="mr-1 text-[10px] font-normal text-unjong-muted">{PERIODS.find((p) => p.key === mobilePeriod)?.label}</span>
                          {pct(r[mobileField] as number | null | undefined)}
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

## 4) 바텀시트 — 스냅 높이(50/66vh) + overscroll 차단 + 내부 스크롤

**찾을 것** (시트 컨테이너~내용 전체, `<div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh]...` 부터 그 닫는 `</div>`까지):
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
                <p className="font-bold leading-snug text-unjong-primary">{selectedStock.name}</p>
                <p className="font-mono text-xs text-unjong-muted">
                  {selectedStock.symbol} · {selectedStock.price ? selectedStock.price.toLocaleString() : '—'}
                  <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                </p>
              </div>
            </div>
            {/* 종목 정보 — 현재가 + 기간별 수익률 (증권사 목록 위) */}
            <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs text-unjong-muted">현재가</span>
                <span className="text-base font-bold tabular-nums text-unjong-primary">{selectedStock.price ? formatPrice(selectedStock.price, 'KR') : '—'}</span>
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
**바꿀 것** (컨테이너=고정 높이 스냅 + flex-col, 핸들=고정, 내용=내부 스크롤 `overscroll-contain`):
```tsx
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl border-t border-unjong-border bg-unjong-surface shadow-xl"
            style={{ height: sheetExpanded ? '66vh' : '50vh', transform: `translateY(${Math.max(0, sheetDragY)}px)`, transition: sheetDragY ? 'none' : 'transform 0.2s ease, height 0.2s ease' }}
          >
            {/* 드래그 핸들 — 위로 끌면 확장, 아래로 끌면 축소/닫힘 */}
            <div
              className="flex shrink-0 touch-none cursor-grab justify-center pb-3 pt-2 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            {/* 내부 스크롤 — overscroll-contain으로 '당겨서 새로고침' 차단 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              <div className="mb-3 flex items-center gap-3">
                <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.name}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.symbol} · {selectedStock.price ? selectedStock.price.toLocaleString() : '—'}
                    <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                  </p>
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-background p-3">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs text-unjong-muted">현재가</span>
                  <span className="text-base font-bold tabular-nums text-unjong-primary">{selectedStock.price ? formatPrice(selectedStock.price, 'KR') : '—'}</span>
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

## 5) 빌드 검증
```bash
npm run build
```
(클라이언트 컴포넌트만 수정 → dev 켜져 있으면 HMR 자동 반영. 클린 재시작 불필요.)

## 6) 라이브 검증 (모바일 or 브라우저 반응형 ≤640px)
- [ ] 종목명이 **한 줄에 풀로** 보임(잘림 없음), 그 밑에 현재가(좌)+수익률(우)+기간 태그.
- [ ] 정렬 드롭다운(현재가/종목명/기간별) + 방향(↓/↑) 동작.
- [ ] 종목 탭 → 시트가 **화면 절반(50vh)** 만 올라옴. 위로 끌면 **2/3(66vh)** 까지만. 100% 안 감.
- [ ] 시트 안에서 아래로 당겨도 **페이지 새로고침 안 됨**. 핸들 아래로 끌면 축소→닫힘.
- [ ] 데스크탑(≥640px)은 기존 표 그대로.

## 7) 커밋 (배포는 사용자 판단)
```bash
git add components/toolbox/MarketBoard.tsx && git commit -m "feat(mobile): KR 종목 카드형 리스트(종목명 풀+현재가/수익률) + 바텀시트 스냅포인트(50/66vh·overscroll 차단) (STEP 475)"
```

## ⚠️ 다음
- **STEP 476 = US `UsMarketBoard.tsx`에 동일 패턴 미러**(플레이북 §4-2 B). Cowork이 이어서 작성.
