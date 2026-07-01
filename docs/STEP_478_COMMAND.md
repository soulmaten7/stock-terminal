<!-- 2026-07-01 -->
# STEP 478 — KR 모바일 정렬 헤더를 PC와 동일하게 (기간 커스텀 드롭다운)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_478_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (`components/toolbox/MarketBoard.tsx` 1파일)
모바일 정렬 헤더를 **데스크탑(PC)과 동일하게** 맞춘다. 종목명·현재가 정렬 버튼(+정렬 아이콘)은 이미 있음. **유일한 문제 = 기간이 native `<select>`라 OS 팝업이 엉뚱한 위치에 뜸** → 데스크탑과 똑같은 **커스텀 드롭다운**(버튼 바로 아래 인플레이스)으로 교체. 종목명 정렬 아이콘 유지(가나다순 가능).

> 카드 종목명 강조·현재가 축소는 STEP 477 유지. 이번엔 드롭다운만 PC식으로.

---

## 1) 모바일용 기간 드롭다운 상태·ref 추가

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

## 2) 바깥 클릭 닫기 — 모바일 드롭다운도 포함

**찾을 것:**
```tsx
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
```
**바꿀 것:**
```tsx
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
      if (periodRefM.current && !periodRefM.current.contains(e.target as Node)) setPeriodOpenM(false);
```

## 3) 모바일 헤더의 native `<select>` → 커스텀 드롭다운 (PC 미러)

**찾을 것** (STEP 477에서 넣은 `<span>` 안 native select 블록 전체):
```tsx
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
```
**바꿀 것** (데스크탑과 동일한 커스텀 드롭다운 — 버튼 바로 아래 열림):
```tsx
              <span className="inline-flex items-center gap-1">
                <div ref={periodRefM} className="relative w-[4.75rem]">
                  <button
                    type="button"
                    onClick={() => setPeriodOpenM((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={periodOpenM}
                    className={`flex w-full items-center justify-between gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs outline-none hover:border-unjong-accent ${sortKey === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                  >
                    {PERIODS.find((p) => p.key === mobilePeriod)?.label ?? '기간'}
                    <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpenM ? 'rotate-180' : ''}`} />
                  </button>
                  {periodOpenM ? (
                    <div role="listbox" className="absolute right-0 top-full z-50 mt-1 w-[4.75rem] overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                      {PERIODS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          role="option"
                          aria-selected={p.key === mobilePeriod}
                          onClick={() => { setMobilePeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpenM(false); }}
                          className={`block w-full px-2 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button type="button" onClick={() => clickHeader(mobilePeriod)} aria-label="선택 기간 정렬 방향" className="shrink-0 text-unjong-muted">
                  {sortArrow(mobilePeriod)}
                </button>
              </span>
```

---

## 4) 빌드 + 검증
```bash
npm run build
```
- [ ] 모바일 헤더 = PC와 동일: `종목명 ⇅` `현재가 ⇅` … `[1일전 ▾] ⇅` (셋 다 눌러 정렬, 종목명=가나다순).
- [ ] 기간 `1일전 ▾` 누르면 **버튼 바로 아래**에 목록 열림(OS 팝업 X, 위치 정상).
- [ ] 활성 정렬=민트, 재클릭 방향 전환.

## 5) 커밋
```bash
git add components/toolbox/MarketBoard.tsx && git commit -m "fix(mobile): KR 종목 정렬 헤더 PC 동일화 — 기간 native select→커스텀 드롭다운 (STEP 478)" && git push
```

## ⚠️ US
- KR 확정되면 STEP 476(US)도 이 최종 디자인(STEP 475 시트 + 477 카드 + 478 드롭다운)으로 한 번에 반영해 실행.
