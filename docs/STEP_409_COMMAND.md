<!-- 2026-06-25 -->
# STEP 409 — KR 표 드롭다운 통일(데스크탑도 기간 드롭다운, KR↔US 동일)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_409_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
KR 종목·상품 표(`components/toolbox/MarketBoard.tsx`)의 **데스크탑**을 US 표(`UsMarketBoard.tsx`)와 동일하게 **단일 기간 드롭다운 컬럼**으로 통일.
- 현재 데스크탑: `# | 종목명 | 현재가 | 1일 | 1주일 | 1개월 | 3개월 | 6개월 | 1년 | ⭐` (모든 기간을 한 번에 노출)
- 변경 후(데스크탑·모바일 동일): `# | 종목명 | 현재가 | 1일 | [기간 ▼] | ⭐` — `1일`은 고정 컬럼, `[기간 ▼]`은 1주일·1개월·3개월·6개월·1년 드롭다운이 단일 컬럼을 구동.
- **두 분기(데스크탑 all-columns + 모바일 select)를 하나의 코드 경로로 통합** — 모바일은 이미 STEP 381에서 select였고, 데스크탑만 다중 컬럼이었음. 이제 양쪽 폭이 같은 단일 드롭다운 컬럼을 공유(US와 동일).

## 전제
- 최신 main. 배포 X(배치) — **로컬 빌드 + 로컬 커밋만**(push X, vercel X).
- **표시만 바꿈 — 데이터 변경 없음.** 행 데이터에 `r1w/r1m/r3m/r6m/r1y`가 이미 들어있음(`/api/krx/kr-performance` 머지). 라우트·fetch·서브탭(주식/ETF/ETN/리츠)·서버 머지 로직 일절 건드리지 않음.
- 보존 대상(전부 유지): 정렬(거래대금 기본 + 기간별 정렬), ⭐ 관심종목, 페이지네이션(50/page), 검색, 주식/ETF/ETN/리츠 서브탭, BrokerRanking 사이드바, 종목 클릭 바텀시트.

## 설계 메모(왜 이렇게 바꾸나)
- 모바일 select는 이미 존재하나 기존 `PERIODS`(1일 포함)를 옵션으로 썼고, 상태 `mobilePeriod` 기본값이 `'1d'`였음. 통일된 단일 컬럼은 US처럼 **`1일`을 고정 컬럼으로 분리**하고 드롭다운은 **1주일~1년만** 담음 → 드롭다운 전용 부분집합 `DROPDOWN_PERIODS` 추가, `mobilePeriod` 기본값을 `'1w'`로 변경(상태/setter 이름은 재사용 — 새 상태 추가 안 함).
- **기간별 정렬 보존**: US 드롭다운은 정렬 비연동이지만 KR은 "기간별 랭킹" 기능을 유지해야 함 → 드롭다운 옆에 작은 정렬 토글(▼/▲) 버튼을 둬 `clickHeader(선택기간)` 호출. 1년 선택 후 토글하면 1년 기준 정렬됨. `1일` 컬럼도 클릭 정렬 유지, `#`는 거래대금 정렬 유지(기본 sort = amount 불변).
- `PERIODS` 배열·`sortField`/`mobileField` 룩업·`clickHeader`/`sortKey`/`sortDir` 로직은 그대로 둠(정렬 엔진 무변경). 표시 마크업(헤더 cell, 바디 cell)만 교체.

---

## 1단계 — `components/toolbox/MarketBoard.tsx` 4곳 수정

### (A) 드롭다운 전용 기간 부분집합 추가 (1주일~1년, 1일 제외)
`PERIODS` 배열 정의 **바로 아래**에 `DROPDOWN_PERIODS`를 추가. (US의 `PERIODS`와 동일 구성 — 1일 없음.)

찾기:
```ts
const PERIODS: { key: PeriodKey; label: string; field: keyof Row; hideSm?: boolean }[] = [
  { key: '1d', label: '1일', field: 'changePercent' },
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m', hideSm: true },
  { key: '3m', label: '3개월', field: 'r3m', hideSm: true },
  { key: '6m', label: '6개월', field: 'r6m', hideSm: true },
  { key: '1y', label: '1년', field: 'r1y' },
];
```
바꾸기:
```ts
const PERIODS: { key: PeriodKey; label: string; field: keyof Row; hideSm?: boolean }[] = [
  { key: '1d', label: '1일', field: 'changePercent' },
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m', hideSm: true },
  { key: '3m', label: '3개월', field: 'r3m', hideSm: true },
  { key: '6m', label: '6개월', field: 'r6m', hideSm: true },
  { key: '1y', label: '1년', field: 'r1y' },
];
// 단일 기간 컬럼 드롭다운 옵션 — 1일 고정 컬럼 이후를 한 컬럼으로(US 표와 동일). 1일 제외.
const DROPDOWN_PERIODS = PERIODS.filter((p) => p.key !== '1d');
```

### (B) 단일 기간 컬럼 상태 기본값 — `'1d'` → `'1w'`
드롭다운에 1일이 없으므로 기본 선택을 1주일로 변경(상태/setter 이름은 그대로 재사용).

찾기:
```ts
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d');
```
바꾸기:
```ts
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1w'); // 단일 기간 컬럼 선택값(데스크탑·모바일 공용)
```

### (C) 테이블 헤더 — 다중 기간 컬럼 + 모바일 select 분기를 단일 드롭다운 컬럼으로 통합
데스크탑 전용 모바일 select(`sm:hidden`)와 데스크탑 다중 컬럼 루프(`sm:table-cell`)를 **모두 제거**하고, US와 동일하게 `1일`(고정) + `[기간 ▼]`(드롭다운, 정렬 토글 포함) 한 쌍으로 교체.

찾기:
```tsx
                  <th className="w-[88px] whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                  <th className="w-[84px] whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium sm:hidden">
                    <select value={mobilePeriod} onChange={(e) => setMobilePeriod(e.target.value as PeriodKey)} className="rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none">
                      {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </th>
                  {PERIODS.map((p) => (
                    <th key={p.key} className="hidden w-[84px] whitespace-nowrap px-2 py-2.5 text-right font-medium sm:table-cell">
                      <button
                        type="button"
                        onClick={() => clickHeader(p.key)}
                        className={`inline-flex items-center gap-0.5 hover:text-unjong-primary ${sortKey === p.key ? 'font-bold text-unjong-accent' : ''}`}
                      >
                        {p.label}{sortKey === p.key ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
                      </button>
                    </th>
                  ))}
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
```
바꾸기:
```tsx
                  <th className="w-[88px] whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                  <th className="w-[72px] whitespace-nowrap px-2 py-2.5 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => clickHeader('1d')}
                      className={`inline-flex items-center gap-0.5 hover:text-unjong-primary ${sortKey === '1d' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      1일{sortKey === '1d' ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
                    </button>
                  </th>
                  {/* 단일 기간 컬럼: 드롭다운으로 기간 선택 + 옆 토글로 해당 기간 정렬(데스크탑·모바일 동일, US 미러) */}
                  <th className="w-[92px] whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium">
                    <span className="inline-flex items-center justify-end gap-0.5">
                      <select value={mobilePeriod} onChange={(e) => setMobilePeriod(e.target.value as PeriodKey)} className="rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none">
                        {DROPDOWN_PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label="선택 기간으로 정렬"
                        title="선택 기간순 정렬"
                        className={`shrink-0 hover:text-unjong-primary ${sortKey === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-muted'}`}
                      >
                        {sortKey === mobilePeriod ? (sortDir === 'desc' ? '▼' : '▲') : '↕'}
                      </button>
                    </span>
                  </th>
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
```

### (D) 테이블 바디 셀 — 모바일 단일 셀 + 데스크탑 다중 셀을 단일 (1일 + 선택기간) 셀로 통합
데스크탑 전용 모바일 셀(`sm:hidden`)과 데스크탑 다중 셀 루프(`sm:table-cell`)를 제거하고, `1일`(고정) + 선택기간(`mobileField`) 한 쌍으로 교체.

찾기:
```tsx
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{r.price ? r.price.toLocaleString() : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums sm:hidden ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
                    {PERIODS.map((p) => {
                      const v = r[p.field] as number | null | undefined;
                      return <td key={p.key} className={`hidden whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums sm:table-cell ${pctColor(v)}`}>{pct(v)}</td>;
                    })}
```
바꾸기:
```tsx
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{r.price ? r.price.toLocaleString() : '—'}</td>
                    <td className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(r.changePercent)}`}>{pct(r.changePercent)}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
```

> 참고: 표 최소폭(`sm:min-w-[760px]`)은 그대로 둬도 무방(컬럼이 줄어 여유만 늘 뿐, 레이아웃·정렬 깨지지 않음). 굳이 손대지 말 것.

## 2단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/toolbox/MarketBoard.tsx
git commit -m "feat(STEP 409): KR 표 데스크탑 기간 드롭다운 통일 — KR↔US 동일 UI"
```

## 확인
- [ ] 빌드 통과(타입 에러 없음). `mobileField`는 그대로 사용되므로 미사용 변수 경고 없음. `PERIODS`도 `sortField`/`mobileField`/`DROPDOWN_PERIODS`에서 계속 참조됨.
- [ ] 데스크탑·모바일 **동일** 컬럼: `# | 종목명 | 현재가 | 1일 | [기간 ▼] | ⭐`. 데스크탑에서 1주일·1개월·3개월·6개월·1년이 더 이상 동시에 보이지 않고 드롭다운 하나로 선택.
- [ ] 드롭다운에서 1년 선택 후 옆 토글(↕→▼/▲) 클릭 시 1년 기준 정렬 동작(asc/desc 토글). `1일` 헤더 클릭 정렬, `#` 거래대금 정렬, 기본 sort = 거래대금(amount) 유지.
- [ ] ⭐ 관심종목 토글, 페이지네이션(50/page·… 페이지번호), 검색, 주식/ETF/ETN/리츠 서브탭, BrokerRanking 우측 사이드바, 모바일 종목 클릭 바텀시트 — 전부 평소와 동일.

## 스킵/보류
- 데이터 fetch(krx/ranking + kr-performance 머지)·서브탭 라우트 일절 변경 안 함(표시 전용).
- push·vercel 배포 안 함(배치 — 다음 배포 STEP에서 일괄).
