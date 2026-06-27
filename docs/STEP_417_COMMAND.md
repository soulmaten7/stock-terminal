<!-- 2026-06-26 -->
# STEP 417 — 종목표 정렬 재설계(헤더 클릭 정렬·현재가 기본·# 번호화)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_417_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
KR(`MarketBoard.tsx`)·US(`UsMarketBoard.tsx`) 두 종목표의 **정렬 UX를 동일하게 재설계**한다. 컬럼은 그대로 `# | 종목명 | 현재가 | [기간 ▼] | ⭐`.

1. **`#` = 행 번호 전용** — 지금 KR의 `#`는 클릭하면 거래대금(`'amount'`)순 정렬이 걸린다. **이 정렬 클릭을 제거**하고 순수 순번 카운터로만 둔다(US `#`는 이미 클릭 없음).
2. **헤더 클릭 정렬 3개** — `종목명`(이름순), `현재가`(가격순), `[기간 ▼]`(선택 기간순, 기존 드롭다운+정렬 유지). 클릭 시 **오름↔내림 토글** + **▲(asc)/▼(desc)** 표시. 비활성 정렬 헤더는 **흐린 ↕**(클릭 가능 암시), 활성은 accent.
3. **기본 정렬 = 현재가 내림차순(`'price'` desc)** — 로드 시·하위탭(주식/ETF/…) 전환 시 모두 현재가 내림차순으로 리셋.
4. **`'amount'`(거래대금) 정렬 옵션 제거** — 화면에 거래대금 컬럼이 없으니 정렬 옵션에서 뺀다. API가 거래대금순으로 내려와도 클라 기본 정렬은 현재가 내림차순. (거래대금 컬럼 추가 시 부활 — 보류.)

## 전제
- 최신 main(STEP 416 `11aca41` 직후). **배포 X(배치)** — 이 STEP은 **로컬 빌드 + 로컬 커밋만**. push·vercel 안 함.
- 두 파일은 **중심 라이브 표** — 정렬·검색·페이지네이션·⭐·하위탭(주식/ETF/ETN/리츠·주식/ETF)·증권사 사이드바·모바일 바텀시트·통화 포맷·기간 드롭다운 표시·US lazy/DB 기간값·KR 데이터 흐름 **깨면 안 됨**.
- KR·US **동일 동작**. 모든 찾기 앵커는 현재 파일과 **글자 단위 일치**.
- 아이콘 규격은 STEP 410/411 그대로: 활성 = lucide `ChevronUp`/`ChevronDown` 18px `strokeWidth={2.5}` accent, 비활성 = `ArrowUpDown` 18px muted.

> 설계 메모(중요): 두 파일은 정렬 상태 모양이 달랐다.
> - **KR**: `sortKey: PeriodKey | 'amount'` + `mobilePeriod`(표시 기간). `sortField`/`sorted`가 기간 숫자만 처리.
> - **US**: `sortKey`가 없고 `period`(표시 기간) + `sortDir`로 항상 기간 정렬.
> 이번에 둘 다 `sortKey: 'name' | 'price' | PeriodKey`로 통일한다. **`#`는 정렬 키가 아니다**(순번). 기간 컬럼을 정렬하면 `sortKey`에 현재 선택 기간(`mobilePeriod`/`period`) 값을 넣는다 → 드롭다운으로 기간을 바꾸면 그 기간으로 정렬, 옆 화살표로 오름/내림 토글. 종목명·현재가 헤더는 각각 `clickHeader('name')`/`clickHeader('price')`.

---

## 1단계 — `components/toolbox/MarketBoard.tsx` (KR)

### (A) 정렬 상태 — `'amount'` 제거, 기본 `'price'` desc
> `sortKey` 타입을 `'name' | 'price' | PeriodKey`로 바꾸고 초기값을 `'price'`로. `sortDir` 기본은 이미 `'desc'`(유지).

찾기:
```ts
  const [sortKey, setSortKey] = useState<PeriodKey | 'amount'>('amount');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d'); // 단일 기간 컬럼 선택값(데스크탑·모바일 공용) — 기본 1일
```
바꾸기:
```ts
  const [sortKey, setSortKey] = useState<'name' | 'price' | PeriodKey>('price'); // 기본 현재가 정렬
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 기본 내림차순
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d'); // 단일 기간 컬럼 선택값(데스크탑·모바일 공용) — 기본 1일
```

### (B) 하위탭 전환 시 정렬 리셋(현재가 내림차순)
> 탭 변경 effect는 지금 검색·페이지만 리셋한다. 정렬도 `price`/`desc`로 리셋 추가.

찾기:
```ts
  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    const ck = 'market:' + tab;
```
바꾸기:
```ts
  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    setSortKey('price'); // 하위탭 전환 시 현재가 내림차순으로 리셋
    setSortDir('desc');
    const ck = 'market:' + tab;
```

### (C) `sortField` 제거 + `sorted` useMemo — name·price·기간 3분기
> 기존 `sortField`(amount면 null) 줄과 `sorted` useMemo를 한 번에 교체한다. `name`=한글 로캘 문자열 비교, `price`=숫자, 기간키=기간 필드 숫자(null 항상 뒤). `mobileField`(셀 표시용)는 유지.

찾기:
```ts
  const sortField = sortKey === 'amount' ? null : (PERIODS.find((p) => p.key === sortKey)?.field ?? null);
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)?.field ?? PERIODS[0].field;
  const PAGE_SIZE = 50;
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    if (!sortField) return base;
    return [...base].sort((a, b) => {
      const av = a[sortField] as number | null | undefined;
      const bv = b[sortField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [rows, sortField, sortDir, search]);
```
바꾸기:
```ts
  // 셀 표시용 기간 필드(드롭다운 선택) — 정렬과 별개. 정렬은 sortKey('name'|'price'|기간)로 결정.
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)?.field ?? PERIODS[0].field;
  // 기간 정렬 시 사용할 필드(sortKey가 기간키일 때만). name·price는 별도 분기.
  const sortPeriodField = PERIODS.find((p) => p.key === sortKey)?.field ?? null;
  const PAGE_SIZE = 50;
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortKey === 'name') {
      // 종목명: 한글 로캘 문자열 비교
      return [...base].sort((a, b) => a.name.localeCompare(b.name, 'ko') * dir);
    }
    if (sortKey === 'price') {
      // 현재가: 숫자 비교
      return [...base].sort((a, b) => ((a.price ?? 0) - (b.price ?? 0)) * dir);
    }
    // 기간키: 해당 기간 필드 숫자 비교, null은 항상 뒤로
    if (!sortPeriodField) return base;
    return [...base].sort((a, b) => {
      const av = a[sortPeriodField] as number | null | undefined;
      const bv = b[sortPeriodField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [rows, sortKey, sortPeriodField, sortDir, search]);
```

### (D) `clickHeader` — 정렬 키 타입 확장
> `clickHeader`가 기간키만 받던 걸 `'name'|'price'|기간키` 모두 받게 한다. 토글 로직은 동일(같은 키면 방향 전환, 다른 키면 desc로).

찾기:
```ts
  function clickHeader(k: PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }
```
바꾸기:
```ts
  function clickHeader(k: 'name' | 'price' | PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  // 정렬 헤더 화살표 — 활성(현재 정렬 키)=▲/▼ accent, 비활성=흐린 ↕(클릭 가능 암시).
  function sortArrow(k: 'name' | 'price' | PeriodKey) {
    if (sortKey !== k) return <ArrowUpDown size={14} className="shrink-0 text-unjong-muted opacity-60" />;
    return sortDir === 'desc'
      ? <ChevronDown size={14} strokeWidth={2.5} className="shrink-0 text-unjong-accent" />
      : <ChevronUp size={14} strokeWidth={2.5} className="shrink-0 text-unjong-accent" />;
  }
```

### (E) `#` 헤더 — 정렬 버튼 제거(순번만)
찾기:
```tsx
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
                    <button type="button" onClick={() => { setSortKey('amount'); setSortDir('desc'); }} title="거래대금순" className={`hover:text-unjong-primary ${sortKey === 'amount' ? 'font-bold text-unjong-accent' : ''}`}>#</button>
                  </th>
```
바꾸기:
```tsx
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">#</th>
```

### (F) `종목명` 헤더 — 클릭 정렬(이름순) + 화살표
찾기:
```tsx
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
```
바꾸기:
```tsx
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">
                    <button
                      type="button"
                      onClick={() => clickHeader('name')}
                      aria-label={sortKey === 'name' ? `종목명 ${sortDir === 'desc' ? '내림차순' : '오름차순'}` : '종목명순 정렬'}
                      title="종목명순 정렬(클릭 시 오름/내림 전환)"
                      className={`inline-flex items-center gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'name' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      종목명{sortArrow('name')}
                    </button>
                  </th>
```

### (G) `현재가` 헤더 — 클릭 정렬(가격순) + 화살표
찾기:
```tsx
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">현재가</th>
```
바꾸기:
```tsx
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">
                    <button
                      type="button"
                      onClick={() => clickHeader('price')}
                      aria-label={sortKey === 'price' ? `현재가 ${sortDir === 'desc' ? '내림차순' : '오름차순'}` : '현재가순 정렬'}
                      title="현재가순 정렬(클릭 시 오름/내림 전환)"
                      className={`inline-flex items-center justify-end gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'price' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      현재가{sortArrow('price')}
                    </button>
                  </th>
```

### (H) 기간 헤더 — 드롭다운 유지 + 화살표 헬퍼로 통일
> 기존 드롭다운(기간 선택 시 그 기간으로 자동 정렬) + 옆 토글은 유지하되, 화살표를 `sortArrow(mobilePeriod)`로 통일(다른 두 헤더와 동일 규격). 드롭다운 onChange는 그대로 `setSortKey(k)`로 해당 기간 정렬.

찾기:
```tsx
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label={sortKey === mobilePeriod ? `선택 기간 ${sortDir === 'desc' ? '오름차순' : '내림차순'}으로 정렬` : '선택 기간으로 정렬'}
                        title="선택 기간순 정렬(클릭 시 오름/내림 전환)"
                        className={`shrink-0 transition-colors hover:text-unjong-primary ${sortKey === mobilePeriod ? 'text-unjong-accent' : 'text-unjong-muted'}`}
                      >
                        {sortKey === mobilePeriod ? (sortDir === 'desc' ? <ChevronDown size={18} strokeWidth={2.5} /> : <ChevronUp size={18} strokeWidth={2.5} />) : <ArrowUpDown size={18} />}
                      </button>
```
바꾸기:
```tsx
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label={sortKey === mobilePeriod ? `선택 기간 ${sortDir === 'desc' ? '오름차순' : '내림차순'}으로 정렬` : '선택 기간으로 정렬'}
                        title="선택 기간순 정렬(클릭 시 오름/내림 전환)"
                        className="shrink-0 transition-colors hover:text-unjong-primary"
                      >
                        {sortArrow(mobilePeriod)}
                      </button>
```

> 주: 기간 화살표가 16→14px로 작아지지만(다른 두 헤더와 통일) 정렬 동작·드롭다운은 동일. 비활성일 때 흐린 `↕`(`ArrowUpDown`)으로 표시돼 클릭 가능 암시도 일관됨.

---

## 2단계 — `components/toolbox/UsMarketBoard.tsx` (US)

### (A) import — `ArrowUpDown` 추가
> US는 STEP 411에서 `ArrowUpDown`을 뺐다. 비활성 화살표용으로 다시 추가.

찾기:
```ts
import { Star, X, ChevronUp, ChevronDown } from 'lucide-react';
```
바꾸기:
```ts
import { Star, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
```

### (B) 정렬 상태 — `sortKey` 추가(기본 `'price'` desc), `period`(표시 기간) 유지
> US는 `sortKey`가 없었다. `sortKey: 'name'|'price'|PeriodKey` 추가. `period`는 **표시 기간 컬럼 선택값**으로 그대로 두고(셀 표시·기간 정렬 대상), `sortDir`도 유지.

찾기:
```ts
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 기본 1일
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 선택 기간 정렬 방향 토글(전 기간 적용)
```
바꾸기:
```ts
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 표시 기간 컬럼 선택값(셀 표시·기간 정렬 대상) — 기본 1일
  const [sortKey, setSortKey] = useState<'name' | 'price' | PeriodKey>('price'); // 정렬 키 — 기본 현재가
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 정렬 방향 — 기본 내림차순
```

### (C) 하위탭 전환 시 정렬 리셋(현재가 내림차순)
찾기:
```ts
  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    const key = CACHE_KEYS[tab];
```
바꾸기:
```ts
  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    setSortKey('price'); // 하위탭 전환 시 현재가 내림차순으로 리셋
    setSortDir('desc');
    const key = CACHE_KEYS[tab];
```

### (D) `sorted` useMemo — name·price·기간 3분기
> 기존엔 항상 `periodField`로 정렬했다. `sortKey` 3분기로 교체. name=영문 로캘, price=숫자, 기간키=`sortKey`의 기간 필드(null 뒤). `periodField`(셀 표시용)는 유지.

찾기:
```ts
  const PAGE_SIZE = 50;
  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'changePercent';
  // 선택 기간으로 전 종목 정렬(1일~1년 모두 행에 데이터 있음). null은 항상 뒤로. 검색 필터(티커·이름) 공통.
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    return [...base].sort((a, b) => {
      const av = a[periodField] as number | null | undefined;
      const bv = b[periodField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [rows, search, periodField, sortDir]);
```
바꾸기:
```ts
  const PAGE_SIZE = 50;
  // 셀 표시용 기간 필드(드롭다운 선택) — 정렬과 별개.
  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'changePercent';
  // 기간 정렬 시 사용할 필드(sortKey가 기간키일 때만). name·price는 별도 분기.
  const sortPeriodField = PERIODS.find((p) => p.key === sortKey)?.field ?? null;
  // sortKey(name|price|기간)로 전 종목 정렬. 기간은 null 항상 뒤로. 검색 필터(티커·이름) 공통.
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortKey === 'name') {
      // 종목명(회사명): 영문 로캘 문자열 비교
      return [...base].sort((a, b) => a.name.localeCompare(b.name, 'en') * dir);
    }
    if (sortKey === 'price') {
      // 현재가: 숫자 비교
      return [...base].sort((a, b) => ((a.price ?? 0) - (b.price ?? 0)) * dir);
    }
    // 기간키: 해당 기간 필드 숫자 비교, null은 항상 뒤로
    if (!sortPeriodField) return base;
    return [...base].sort((a, b) => {
      const av = a[sortPeriodField] as number | null | undefined;
      const bv = b[sortPeriodField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [rows, search, sortKey, sortPeriodField, sortDir]);
```

### (E) `clickHeader` + `sortArrow` 헬퍼 추가(KR과 동일)
> US엔 `clickHeader`가 없었다(인라인 `setSortDir`). KR과 동일한 `clickHeader`/`sortArrow`를 추가한다. `periodCell` 함수 바로 위에 삽입.

찾기:
```ts
  // 기간 셀 값: 선택 기간 필드를 행에서 직접 읽음(주식=us-list 조인, ETF=etf-performance). null=데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    return r[periodField] as number | null | undefined;
  }
```
바꾸기:
```ts
  function clickHeader(k: 'name' | 'price' | PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  // 정렬 헤더 화살표 — 활성(현재 정렬 키)=▲/▼ accent, 비활성=흐린 ↕(클릭 가능 암시). KR 미러.
  function sortArrow(k: 'name' | 'price' | PeriodKey) {
    if (sortKey !== k) return <ArrowUpDown size={14} className="shrink-0 text-unjong-muted opacity-60" />;
    return sortDir === 'desc'
      ? <ChevronDown size={14} strokeWidth={2.5} className="shrink-0 text-unjong-accent" />
      : <ChevronUp size={14} strokeWidth={2.5} className="shrink-0 text-unjong-accent" />;
  }

  // 기간 셀 값: 선택 기간 필드를 행에서 직접 읽음(주식=us-list 조인, ETF=etf-performance). null=데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    return r[periodField] as number | null | undefined;
  }
```

### (F) `종목명` 헤더 — 클릭 정렬(이름순) + 화살표
찾기:
```tsx
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
```
바꾸기:
```tsx
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">
                    <button
                      type="button"
                      onClick={() => clickHeader('name')}
                      aria-label={sortKey === 'name' ? `종목명 ${sortDir === 'desc' ? '내림차순' : '오름차순'}` : '종목명순 정렬'}
                      title="종목명순 정렬(클릭 시 오름/내림 전환)"
                      className={`inline-flex items-center gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'name' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      종목명{sortArrow('name')}
                    </button>
                  </th>
```

### (G) `현재가` 헤더 — 클릭 정렬(가격순) + 화살표
찾기:
```tsx
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">현재가</th>
```
바꾸기:
```tsx
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">
                    <button
                      type="button"
                      onClick={() => clickHeader('price')}
                      aria-label={sortKey === 'price' ? `현재가 ${sortDir === 'desc' ? '내림차순' : '오름차순'}` : '현재가순 정렬'}
                      title="현재가순 정렬(클릭 시 오름/내림 전환)"
                      className={`inline-flex items-center justify-end gap-1 transition-colors hover:text-unjong-primary ${sortKey === 'price' ? 'font-bold text-unjong-accent' : ''}`}
                    >
                      현재가{sortArrow('price')}
                    </button>
                  </th>
```

### (H) 기간 헤더 — 드롭다운 onChange가 기간 정렬 세팅 + 화살표 토글 → `sortKey` 사용
> 기존 드롭다운 onChange는 `setSortDir('desc')`만 했고(항상 기간 정렬이라 OK), 토글도 인라인 `setSortDir`였다. 이제 `sortKey`가 따로 있으니: 드롭다운 변경 시 `setSortKey(k)`(그 기간으로 정렬) + `setSortDir('desc')`, 토글은 `clickHeader(period)`, 화살표는 `sortArrow(period)`.

찾기:
```tsx
                      <select value={period} onChange={(e) => { setPeriod(e.target.value as PeriodKey); setSortDir('desc'); setPage(0); }} className="rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none">
                        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                        aria-label={`선택 기간 ${sortDir === 'desc' ? '오름차순' : '내림차순'}으로 정렬`}
                        title="선택 기간순 정렬(클릭 시 오름/내림 전환)"
                        className="shrink-0 text-unjong-accent transition-colors hover:text-unjong-primary"
                      >
                        {sortDir === 'desc' ? <ChevronDown size={18} strokeWidth={2.5} /> : <ChevronUp size={18} strokeWidth={2.5} />}
                      </button>
```
바꾸기:
```tsx
                      <select value={period} onChange={(e) => { const k = e.target.value as PeriodKey; setPeriod(k); setSortKey(k); setSortDir('desc'); setPage(0); }} className="rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none">
                        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => clickHeader(period)}
                        aria-label={sortKey === period ? `선택 기간 ${sortDir === 'desc' ? '오름차순' : '내림차순'}으로 정렬` : '선택 기간으로 정렬'}
                        title="선택 기간순 정렬(클릭 시 오름/내림 전환)"
                        className="shrink-0 transition-colors hover:text-unjong-primary"
                      >
                        {sortArrow(period)}
                      </button>
```

> 주: US도 기간 화살표가 18→14px로 작아지지만 KR과 통일. 비활성(다른 헤더로 정렬 중)일 땐 흐린 `↕` 표시. 드롭다운으로 기간을 고르면 즉시 그 기간 내림차순 정렬(`sortKey=k`). 셀 표시값(`periodCell`)은 `period`로 그대로 따라옴.

---

## 3단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx
git commit -m "feat(STEP 417): 종목표 정렬 재설계 — 종목명·현재가·기간 헤더 클릭 정렬, 기본 현재가↓, # 번호화"
```
**push·vercel 안 함**(다음 배치 배포 때 함께).

---

## 확인
- [ ] `npm run build` 타입·빌드 통과(경고 없게 — KR `'amount'` 분기 제거 후 `sortKey` 타입 일관, US `ArrowUpDown` 다시 사용됨).
- [ ] **KR**: 탭(주식/ETF/ETN/리츠) 진입 시 **현재가 내림차순**(▼ accent). `종목명`·`현재가`·`[기간▼]` 헤더 클릭 시 그 기준 정렬 + 클릭마다 ▲↔▼ 전환, 비활성 헤더는 흐린 `↕`. `#`는 클릭해도 정렬 안 됨(순번만). 탭 바꾸면 다시 현재가↓로 리셋. 드롭다운 기간 선택 시 그 기간 정렬. 검색·페이지네이션·⭐·증권사 사이드바·모바일 바텀시트 정상.
- [ ] **US**: 동일 동작 — 탭(주식/ETF) 진입 시 현재가↓, 종목명(회사명)·현재가·기간 헤더 클릭 정렬+화살표, `#` 클릭 안 됨, 탭 전환 리셋, 드롭다운 기간 정렬, 검색·페이지·⭐·사이드바·바텀시트 정상.
- [ ] KR·US **정렬 UX 동일**(헤더 클릭·화살표 규격·기본 현재가↓·# 순번·탭 전환 리셋).

## 스킵 / 보류
- **거래대금(`'amount'`) 정렬 = 제거**. 화면에 거래대금 컬럼이 없어 의미가 약했고, 기본 정렬이 현재가↓로 바뀜. → **추후 거래대금 컬럼을 표에 추가하는 STEP**에서 `'amount'` 정렬 옵션 부활(헤더 클릭 대상에 포함).
- US `Row`의 `amount?` 필드·`fetchRows`의 `amount` 매핑은 **그대로 둠**(정렬엔 미사용이나 향후 거래대금 컬럼 부활 대비 — 타입/빌드 무해).
- KR `PERIODS`의 `hideSm` 등 기존 미사용 필드는 손대지 않음(타입 OK).

## 리스크 메모
- **정렬 상태 모양 통일**: KR(`sortKey: PeriodKey|'amount'`+`mobilePeriod`) / US(`period`+`sortDir`, no sortKey) → 둘 다 `sortKey: 'name'|'price'|PeriodKey`로 맞춤. KR `mobilePeriod`·US `period`는 **표시 기간 컬럼 선택값**으로 유지(셀 값·기간 정렬 대상). 정렬 키와 표시 기간이 분리돼, 기간이 아닌 키(name/price)로 정렬 중에도 기간 컬럼은 선택 기간 값을 계속 표시한다.
- **한글/영문 로캘**: KR `localeCompare(b.name, 'ko')`, US `'en'`. US 종목명 셀은 심볼(bold)+회사명이지만 정렬은 `r.name`(회사명) 기준 — 요구사항대로. 티커순 정렬이 필요하면 후속 STEP.
- **화살표 px 변화**: 기간 토글이 18→14px로 작아짐(다른 두 헤더와 통일). 정렬·드롭다운 동작은 불변. 비활성 시 흐린 `↕`로 클릭 가능 암시 일관화.
- **셀 표시 불변**: KR `mobileField`/US `periodCell`는 그대로라 기간 컬럼 % 표시·… 로딩·null `—` 모두 기존과 동일. 통화 포맷·⭐·검색·페이지·사이드바·하위탭 바이트 동일.
