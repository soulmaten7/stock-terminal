<!-- 2026-06-24 -->
# STEP 381 — [모바일] 종목·상품 표 재설계: 기간 드롭다운 + # 간격

> 데스크탑(≥640) 외형 **불변**(6기간 컬럼 그대로). 모바일만 변경. 빌드 통과 시에만 커밋. 적용 후 **실제 폰으로 확인** 필요.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_381_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
1. **기간 드롭다운**: 모바일에서 기간 6컬럼(1일~1년)을 옆으로 드래그하는 대신, **현재가 옆 한 칸 + 드롭다운**(1일/1주일/1개월/3개월/6개월/1년)으로 골라 보게. 데스크탑은 6컬럼 전부 그대로.
2. **# ↔ 종목명 간격** 모바일에서 축소(불필요한 빈 공간 제거).

변경 1파일: `components/toolbox/MarketBoard.tsx`.
> 동작: 모바일은 기간 6컬럼 전부 `sm:`부터(숨김) + 드롭다운으로 고른 1개 기간만 표시. 데스크탑(`sm:`)은 드롭다운 숨기고 6컬럼 표시.

---

## ① 상태 추가 — 모바일 선택 기간

찾기:
```tsx
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
```
바꾸기:
```tsx
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d');
```

찾기:
```tsx
  const sortField = sortKey === 'amount' ? null : PERIODS.find((p) => p.key === sortKey)!.field;
```
바꾸기:
```tsx
  const sortField = sortKey === 'amount' ? null : PERIODS.find((p) => p.key === sortKey)!.field;
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)!.field;
```

## ② 표 최소폭 — 모바일 더 축소(컬럼 줄어듦)
찾기:
```tsx
            <table className="w-full min-w-[540px] text-sm sm:min-w-[720px]">
```
바꾸기:
```tsx
            <table className="w-full min-w-[320px] text-sm sm:min-w-[720px]">
```

## ③ thead — # 간격 + 종목명 간격
찾기:
```tsx
                  <th className="px-2 py-2.5 text-left font-medium">
```
바꾸기:
```tsx
                  <th className="py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
```

찾기:
```tsx
                  <th className="w-full px-2 py-2.5 text-left font-medium">종목명</th>
```
바꾸기:
```tsx
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
```

## ④ thead — 현재가 뒤에 모바일 드롭다운 th 추가 + 기간 컬럼 전부 데스크탑 전용
찾기:
```tsx
                  <th className="whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                  {PERIODS.map((p) => (
                    <th key={p.key} className={`whitespace-nowrap px-2 py-2.5 text-right font-medium ${p.hideSm ? 'hidden sm:table-cell' : ''}`}>
```
바꾸기:
```tsx
                  <th className="whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                  <th className="whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium sm:hidden">
                    <select value={mobilePeriod} onChange={(e) => setMobilePeriod(e.target.value as PeriodKey)} className="rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none">
                      {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </th>
                  {PERIODS.map((p) => (
                    <th key={p.key} className="hidden whitespace-nowrap px-2 py-2.5 text-right font-medium sm:table-cell">
```

## ⑤ tbody — # 간격 + 종목명 간격
찾기:
```tsx
                    <td className="px-2 py-2.5 tabular-nums text-unjong-muted">{i + 1}</td>
```
바꾸기:
```tsx
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{i + 1}</td>
```

찾기:
```tsx
                    <td className="px-2 py-2.5">
```
바꾸기:
```tsx
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
```

## ⑥ tbody — 현재가 뒤에 모바일 값 td 추가 + 기간 td 전부 데스크탑 전용
찾기:
```tsx
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{r.price ? r.price.toLocaleString() : '—'}</td>
                    {PERIODS.map((p) => {
                      const v = r[p.field] as number | null | undefined;
                      return <td key={p.key} className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(v)} ${p.hideSm ? 'hidden sm:table-cell' : ''}`}>{pct(v)}</td>;
                    })}
```
바꾸기:
```tsx
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{r.price ? r.price.toLocaleString() : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums sm:hidden ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
                    {PERIODS.map((p) => {
                      const v = r[p.field] as number | null | undefined;
                      return <td key={p.key} className={`hidden whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums sm:table-cell ${pctColor(v)}`}>{pct(v)}</td>;
                    })}
```

> 참고: `PERIODS`의 `hideSm` 속성은 이제 안 쓰이지만 남겨둬도 무해(삭제 불필요).

---

## ✅ 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
무에러 시:
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(mobile): 종목·상품 표 기간 드롭다운(모바일) + # 간격 축소 (STEP 381)" && git push
```
> 빌드 실패 시 커밋 말고 에러 출력 후 멈춤.

## 🌅 실제 폰 확인 (중요)
- 375px: 표 = **# · 종목명 · 현재가 · [1일 ▼]** 4칸. 드롭다운에서 1주일/1개월/1년 고르면 그 컬럼 값으로 바뀜.
- # 와 종목명 사이 간격 좁아짐.
- ≥640px(데스크탑): 6기간 컬럼 전부 그대로(드롭다운 안 보임).
- 드롭다운이 OS 기본 피커로 뜨는지/글자 잘리는지 확인 → 어색하면 Cowork에 말하기.

---

> **한 줄 요약**: 모바일 표 = 기간 드롭다운 1칸(가로 드래그 제거) + # 간격 축소. 데스크탑 6컬럼 불변. 폰 확인 필수.
