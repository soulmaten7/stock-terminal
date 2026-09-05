<!-- 2026-06-25 -->
# STEP 410 — 종목표 UI 리파인(통화·드롭다운1일·자동정렬·간격·증권사높이)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_410_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
KR(`MarketBoard.tsx`)·US(`UsMarketBoard.tsx`) 종목표를 **동일하게** 다듬는다 — 둘 다 구조가 똑같아야 함.
1. **현재가 통화 현지화** — KR `358,500원` / US `$275.15` (시장별 통화, 나중에 JP `¥` 등 확장).
2. **드롭다운을 "1일"부터** — 고정 `1일` 컬럼 제거, 컬럼을 `# | 종목명 | 현재가 | [기간 ▼] | ⭐`로 축소. 드롭다운 옵션 = 1일·1주일·1개월·3개월·6개월·1년(기본 **1일**).
3. **드롭다운 선택 시 자동 정렬 + 기본정렬 버그 수정** — 로드 기본 = 거래대금(amount) 내림차순(삼성전자/SK하이닉스 선두, KR의 STEP 409 잔초 페니주 14원 버그 제거). 드롭다운 변경 시 해당 기간 내림차순 자동 정렬(US는 1일만 정렬, 긴 기간은 lazy라 amount 유지).
4. **정렬 아이콘 크게·직관적** — `↕` 대신 lucide `ArrowUpDown`/`ChevronUp`/`ChevronDown`(16px), 드롭다운과 간격.
5. **컬럼 간격 ↑ + 종목명 로고 키우기** — 컬럼 줄었으니 `현재가|[기간▼]|⭐` 가로 패딩 ↑, `StockLogo` 24→32(약 +33%).
6. **증권사 바로가기 리스트 높이 정렬** — 종목표 헤더(드롭다운 때문에 높음)와 증권사 "최근 분기 거래대금순" 서브헤더 높이를 맞춰 두 리스트 행이 나란히 정렬.

## 전제
- 최신 main. STEP 409 직후(KR 표는 `현재가 | 1일 | [기간 ▼] | ⭐`). 배포 X(배치) — **로컬 빌드 + 로컬 커밋만**(push·vercel 금지).
- KR은 중심 라이브 표 — 정렬·⭐·페이지네이션·검색·주식/ETF/ETN/리츠 탭·사이드바·모바일·행클릭 시트·US lazy-period 깨면 안 됨.
- 새 파일 `lib/currency.ts`(통화 헬퍼) 생성. 기존 `lib/utils/format.ts`는 건드리지 않음(별 헬퍼).

---

## 1단계 — 새 파일 `lib/currency.ts` 생성

아래 내용으로 **새 파일** `lib/currency.ts` 작성:
```ts
// 시장별 현재가 통화 포맷 — KR 원(접미·소수0) / US $(접두·소수2). JP ¥ 등 확장 대비.
const CURRENCY: Record<string, { sym: string; pos: 'pre' | 'suf'; frac: number; locale: string }> = {
  KR: { sym: '원', pos: 'suf', frac: 0, locale: 'ko-KR' },
  US: { sym: '$', pos: 'pre', frac: 2, locale: 'en-US' },
};

export function formatPrice(v: number, country: string): string {
  const c = CURRENCY[country] ?? CURRENCY.US;
  const n = (v ?? 0).toLocaleString(c.locale, { minimumFractionDigits: c.frac, maximumFractionDigits: c.frac });
  return c.pos === 'pre' ? `${c.sym}${n}` : `${n}${c.sym}`;
}
```

---

## 2단계 — `components/toolbox/MarketBoard.tsx` (KR)

### (A) import — lucide 정렬 아이콘 + formatPrice 추가
찾기:
```ts
import { Star, X } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import BrokerRanking from './BrokerRanking';
```
바꾸기:
```ts
import { Star, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import BrokerRanking from './BrokerRanking';
```

### (B) 드롭다운 옵션에 1일 포함 + 기본 선택값 1일
STEP 409의 `DROPDOWN_PERIODS`(1일 제외)를 **PERIODS 전체**(1일 포함)로 되돌린다.
찾기:
```ts
// 단일 기간 컬럼 드롭다운 옵션 — 1일 고정 컬럼 이후를 한 컬럼으로(US 표와 동일). 1일 제외.
const DROPDOWN_PERIODS = PERIODS.filter((p) => p.key !== '1d');
```
바꾸기:
```ts
// 단일 기간 컬럼 드롭다운 옵션 — 1일부터(고정 1일 컬럼 제거, US 표와 동일). 전 기간 포함.
const DROPDOWN_PERIODS = PERIODS;
```

`hideSm` 필드는 더 이상 헤더에서 쓰지 않지만 PERIODS 정의에 남아 있어도 무방(타입 OK, 미사용). 그대로 둔다.

### (C) 기본 선택 기간을 1일로
찾기:
```ts
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1w'); // 단일 기간 컬럼 선택값(데스크탑·모바일 공용)
```
바꾸기:
```ts
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d'); // 단일 기간 컬럼 선택값(데스크탑·모바일 공용) — 기본 1일
```

### (D) 드롭다운 변경 시 자동 정렬 — onChange에서 정렬 키 동기화
드롭다운 핸들러를 기간 선택 + 해당 기간 내림차순 정렬로 묶는다.
찾기:
```ts
                      <select value={mobilePeriod} onChange={(e) => setMobilePeriod(e.target.value as PeriodKey)} className="rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none">
```
바꾸기:
```ts
                      <select value={mobilePeriod} onChange={(e) => { const k = e.target.value as PeriodKey; setMobilePeriod(k); setSortKey(k); setSortDir('desc'); setPage(0); }} className="rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none">
```

> 기본정렬 버그: KR 초기 `sortKey='amount'` / `sortDir='desc'`는 이미 코드에 있고(`useState<...>('amount')`), 그게 거래대금 내림차순 = 삼성전자·SK하이닉스 선두라 **로드 시점은 정상**. STEP 409에서 깨졌던 건 페니주가 위로 오던 현상인데, 기본이 amount-desc면 해결. (sortField는 `sortKey==='amount'`일 때 null → 정렬 안 함 = API의 amount 내림차순 원순서 유지 = 정상.) 이 STEP은 추가로 **드롭다운을 만지면 그 기간으로 자동 정렬**되게만 보강. amount 기본값은 손대지 않는다(`useState<PeriodKey | 'amount'>('amount')` 유지).

### (E) 정렬 토글 아이콘 — `↕`/`▲`/`▼` → lucide 16px + 간격
찾기:
```ts
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label="선택 기간으로 정렬"
                        title="선택 기간순 정렬"
                        className={`shrink-0 hover:text-unjong-primary ${sortKey === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-muted'}`}
                      >
                        {sortKey === mobilePeriod ? (sortDir === 'desc' ? '▼' : '▲') : '↕'}
                      </button>
```
바꾸기:
```ts
                      <button
                        type="button"
                        onClick={() => clickHeader(mobilePeriod)}
                        aria-label="선택 기간으로 정렬"
                        title="선택 기간순 정렬"
                        className={`ml-1.5 shrink-0 hover:text-unjong-primary ${sortKey === mobilePeriod ? 'text-unjong-accent' : 'text-unjong-muted'}`}
                      >
                        {sortKey === mobilePeriod ? (sortDir === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />) : <ArrowUpDown size={16} />}
                      </button>
```

### (F) 고정 1일 컬럼 헤더 제거 + 현재가/기간 헤더 간격 ↑ + 헤더 높이 고정(증권사 정렬용)
표 헤더에서 `현재가`·`1일`·기간 select 줄을 한 번에 교체한다. (1일 `<th>` 통째 삭제, 현재가/기간 패딩 ↑, `<tr>`에 고정 높이 `h-[46px]`.)
찾기:
```ts
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
                    <button type="button" onClick={() => { setSortKey('amount'); setSortDir('desc'); }} title="거래대금순" className={`hover:text-unjong-primary ${sortKey === 'amount' ? 'font-bold text-unjong-accent' : ''}`}>#</button>
                  </th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
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
```
바꾸기:
```ts
                <tr className="h-[46px] border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
                    <button type="button" onClick={() => { setSortKey('amount'); setSortDir('desc'); }} title="거래대금순" className={`hover:text-unjong-primary ${sortKey === 'amount' ? 'font-bold text-unjong-accent' : ''}`}>#</button>
                  </th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">현재가</th>
                  {/* 단일 기간 컬럼: 드롭다운으로 기간 선택(1일부터) + 옆 토글로 해당 기간 정렬(데스크탑·모바일 동일, US 미러) */}
                  <th className="w-[116px] whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-medium sm:pr-4">
```

> 주: 위에서 고정 `1일` `<th>`(현재가 다음, 기간 select 앞) 전체를 삭제했다. 표는 `# | 종목명 | 현재가 | [기간 ▼] | ⭐`가 된다. `min-w` 합이 줄어 모바일 `min-w-[320px]`는 여유. `table-fixed`이므로 너비 합이 100% 미만이면 `w-full`인 종목명 컬럼이 늘어남(레이아웃 안전).

### (G) 현재가 셀 — formatPrice('KR') + 패딩 ↑ / 고정 1일 셀 제거 / 기간 셀 패딩 ↑ / 로고 24→32
표 본문 행에서 종목명·현재가·1일·기간 셀을 교체한다.
찾기:
```ts
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <StockLogo code={r.symbol} name={r.name} size={24} />
                        <span title={r.name} className="truncate font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{r.price ? r.price.toLocaleString() : '—'}</td>
                    <td className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(r.changePercent)}`}>{pct(r.changePercent)}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
```
바꾸기:
```ts
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StockLogo code={r.symbol} name={r.name} size={32} />
                        <span title={r.name} className="truncate font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'KR') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
```

> 고정 1일 `<td>`(`pctColor(r.changePercent)`)를 삭제했다 — 1일은 이제 드롭다운에서 선택(`mobileField`가 `1d`면 `changePercent` 표시). `mobileField`는 `PERIODS.find(...).field`로 이미 1일=`changePercent` 매핑됨(기존 로직 그대로).

### (H) 증권사 서브헤더 높이 = 표 헤더 높이(데스크탑 aside)
찾기:
```ts
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
```
바꾸기:
```ts
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="flex h-[46px] items-center border-b border-unjong-border px-1 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
```

> 표 헤더 `<tr>`를 `h-[46px]`로 고정했으므로(2-F), 증권사 서브헤더도 `h-[46px] flex items-center`로 맞추면 첫 종목 행과 첫 증권사 행이 같은 y에서 시작. 그 아래 행들은 둘 다 `py-2.5`(종목 `<tr>` / ListRow) 라 자연 정렬.

---

## 3단계 — `components/toolbox/UsMarketBoard.tsx` (US)

### (A) import — lucide 정렬 아이콘 + formatPrice 추가, usd 헬퍼 제거
찾기:
```ts
import { Star, X } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import BrokerRanking from './BrokerRanking';
```
바꾸기:
```ts
import { Star, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import BrokerRanking from './BrokerRanking';
```

### (B) PERIODS에 1일 추가(드롭다운 1일부터) + PeriodKey에 '1d'
US PERIODS는 `1w`부터였다 — `1d`(field=`changePercent`)를 맨 앞에 넣는다.
찾기:
```ts
// 기간 드롭다운: 현재가+1일 고정 후 단일 컬럼을 선택 기간으로 표시(KR 모바일 select 방식을 전 폭 재사용).
type PeriodKey = '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m' },
  { key: '3m', label: '3개월', field: 'r3m' },
  { key: '6m', label: '6개월', field: 'r6m' },
  { key: '1y', label: '1년', field: 'r1y' },
];
```
바꾸기:
```ts
// 기간 드롭다운: 현재가 다음 단일 컬럼을 선택 기간으로 표시(1일부터). 1일=changePercent(리스트 행에 있음·non-lazy), 1주일~1년=lazy(periodMap).
type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1d', label: '1일', field: 'changePercent' },
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m' },
  { key: '3m', label: '3개월', field: 'r3m' },
  { key: '6m', label: '6개월', field: 'r6m' },
  { key: '1y', label: '1년', field: 'r1y' },
];
```

### (C) usd() 제거 — formatPrice로 대체
찾기:
```ts
function usd(v?: number | null): string {
  if (v == null || !v) return '—';
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

```
바꾸기:
```ts
```

> 위 블록(함수 정의 + 뒤따르는 빈 줄 1개)을 통째로 삭제. 이후 `usd(...)` 호출 3곳(현재가 셀·데스크탑 헤더 없음·바텀시트)을 모두 `formatPrice(..., 'US')`로 바꾼다(아래 (F)(H)).

### (D) 기본 선택 기간 1d
찾기:
```ts
  const [period, setPeriod] = useState<PeriodKey>('1w');
```
바꾸기:
```ts
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 기본 1일
```

### (E) 정렬 상태 + 자동 정렬 로직 — sorted를 1일/거래대금 기준으로
US는 정렬 상태가 없었다(amount 고정). `sortDir`만 추가하고, `period==='1d'`면 `changePercent` 정렬, 그 외 기간은 amount-desc 유지(긴 기간 lazy라 전 행 데이터 없음 — 옵션 A).
찾기:
```ts
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 기본 1일
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
```
바꾸기:
```ts
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 기본 1일
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 1일 정렬 방향 토글(긴 기간은 amount 고정이라 무영향)
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
```

찾기:
```ts
  const PAGE_SIZE = 50;
  // 거래대금(amount) 내림차순 고정(최다거래 우선) + 검색 필터(티커·이름).
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    return [...base].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }, [rows, search]);
```
바꾸기:
```ts
  const PAGE_SIZE = 50;
  // 기본=거래대금(amount) 내림차순(최다거래 우선). 드롭다운 '1일' 선택 시 changePercent 정렬(데이터가 리스트 행에 있음).
  // '1주일~1년'은 lazy(periodMap)라 전 행이 안 채워져 정렬 불가 → amount-desc 유지(옵션 A). 검색 필터(티커·이름) 공통.
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    if (period === '1d') {
      const dir = sortDir === 'desc' ? -1 : 1;
      return [...base].sort((a, b) => ((a.changePercent ?? 0) - (b.changePercent ?? 0)) * dir);
    }
    return [...base].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }, [rows, search, period, sortDir]);
```

> KR과의 차이(문서화): KR은 전 기간 데이터(kr-performance 일괄)라 어느 기간이든 정렬. US 주식은 1주일~1년이 lazy(보이는 50종목만 us-quote로 채움)라 전체 정렬 불가 → '1일'만 정렬, 그 외엔 거래대금-desc 유지하되 컬럼은 lazy 값을 **표시**는 함. ETF 탭도 동일 코드 경로(ETF 1일=changePercent, 긴 기간 r필드 표시 — 정렬은 1일만, 긴 기간 amount; ETF amount 없으면 0 동률 → API 원순서 유지).

### (F) 고정 1일 컬럼 헤더 제거 + 현재가/기간 헤더 간격 ↑ + 정렬 토글 + 헤더 높이 고정
찾기:
```ts
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">#</th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
                  <th className="w-[96px] whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                  <th className="w-[72px] whitespace-nowrap px-2 py-2.5 text-right font-medium">1일</th>
                  {/* 기간 드롭다운(KR 모바일 select 마크업 재사용) — 표시 필드만 변경, refetch 없음 */}
                  <th className="w-[88px] whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium">
                    <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className={`rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none ${tab === 'stock' && periodLoading ? 'opacity-60' : ''}`}>
                      {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </th>
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
                </tr>
```
바꾸기:
```ts
                <tr className="h-[46px] border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">#</th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">현재가</th>
                  {/* 기간 드롭다운(1일부터) — '1일'은 자동 정렬(changePercent), 긴 기간은 표시만(lazy, amount 정렬 유지). KR 미러 */}
                  <th className="w-[116px] whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-medium sm:pr-4">
                    <span className="inline-flex items-center justify-end gap-0.5">
                      <select value={period} onChange={(e) => { setPeriod(e.target.value as PeriodKey); setSortDir('desc'); setPage(0); }} className={`rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none ${tab === 'stock' && periodLoading ? 'opacity-60' : ''}`}>
                        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => { if (period === '1d') setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); }}
                        aria-label="선택 기간으로 정렬"
                        title={period === '1d' ? '1일 등락순 정렬' : '긴 기간은 거래대금순 고정(표시만)'}
                        className={`ml-1.5 shrink-0 hover:text-unjong-primary ${period === '1d' ? 'text-unjong-accent' : 'cursor-default text-unjong-border'}`}
                      >
                        {period === '1d' ? (sortDir === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />) : <ArrowUpDown size={16} />}
                      </button>
                    </span>
                  </th>
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
                </tr>
```

> US는 STEP 409에서 정렬 토글이 없었으므로(amount 고정) KR과 마크업을 맞춰 `<select>`+토글을 같은 `<span>`에 넣었다. 토글은 `1일`일 때만 방향 전환, 그 외엔 비활성(거래대금 고정 안내). 고정 `1일` `<th>` 삭제 → `# | 종목명 | 현재가 | [기간 ▼] | ⭐`.

### (G) periodCell — 1일이면 changePercent, 그 외는 기존(ETF=r필드 / 주식=periodMap)
US 본문 기간 셀이 1일을 표시하도록 보강(1일은 lazy 아님).
찾기:
```ts
  // 기간 셀 값 통합: ETF 행은 r필드, 주식 행은 periodMap. undefined면 아직 로딩 중(…)·null이면 데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    if (tab === 'etf') return r[periodField] as number | null | undefined;
    return periodMap[`${r.symbol}|${period}`];
  }
```
바꾸기:
```ts
  // 기간 셀 값 통합: 1일=changePercent(리스트 행, non-lazy). ETF 긴 기간=r필드, 주식 긴 기간=periodMap(lazy). undefined=로딩 중(…)·null=데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    if (period === '1d') return r.changePercent;
    if (tab === 'etf') return r[periodField] as number | null | undefined;
    return periodMap[`${r.symbol}|${period}`];
  }
```

> lazy effect(`us-quote` fetch)는 `if (tab !== 'stock') return;` 이후 `periodMap[`${s}|${period}`] === undefined`만 요청하는데, `period==='1d'`는 periodCell이 먼저 changePercent를 반환하므로 셀 표시엔 영향 없음. 다만 effect는 여전히 `1d` 키로 us-quote를 부를 수 있음 → 불필요 호출 가드 추가(아래 (G2)).

### (G2) lazy effect — 1일은 fetch 스킵
찾기:
```ts
  useEffect(() => {
    if (tab !== 'stock') return;
    if (visibleSyms.length === 0) return;
```
바꾸기:
```ts
  useEffect(() => {
    if (tab !== 'stock') return;
    if (period === '1d') return; // 1일은 리스트 행 changePercent 사용 — lazy fetch 불필요
    if (visibleSyms.length === 0) return;
```

### (H) 본문 행 — 로고 24→32 + 현재가 formatPrice('US') + 패딩 ↑ + 고정 1일 셀 제거
찾기:
```ts
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <StockLogo code={r.symbol} name={r.name} size={24} />
                        <span className="min-w-0">
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
                          <span title={r.name} className="ml-1.5 truncate text-xs text-unjong-muted">{r.name}</span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{usd(r.price)}</td>
                    <td className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(r.changePercent)}`}>{pct(r.changePercent)}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums ${pctColor(periodCell(r))}`}>{periodCell(r) === undefined ? <span className="text-unjong-muted">…</span> : pct(periodCell(r))}</td>
```
바꾸기:
```ts
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StockLogo code={r.symbol} name={r.name} size={32} />
                        <span className="min-w-0">
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
                          <span title={r.name} className="ml-1.5 truncate text-xs text-unjong-muted">{r.name}</span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{formatPrice(r.price, 'US')}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(periodCell(r))}`}>{periodCell(r) === undefined ? <span className="text-unjong-muted">…</span> : pct(periodCell(r))}</td>
```

> 고정 1일 `<td>` 삭제. `formatPrice(r.price,'US')`는 `r.price`가 0/NaN이면 `$0.00`을 반환(기존 usd는 `—`였음). US 리스트는 가격이 항상 있어 실무상 무해하나, 0 표기를 피하려면 `{r.price ? formatPrice(r.price, 'US') : '—'}`로 감싸도 됨. KR과 마크업을 맞추려 KR도 `r.price ?`를 유지했으므로 US도 동일하게 가드하려면 아래 대안 사용:
> 대안(권장, KR과 일치): `<td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'US') : '—'}</td>`

### (I) 바텀시트 현재가 — usd → formatPrice('US')
찾기:
```ts
                  {selectedStock.name} · {usd(selectedStock.price)}
```
바꾸기:
```ts
                  {selectedStock.name} · {selectedStock.price ? formatPrice(selectedStock.price, 'US') : '—'}
```

### (J) 증권사 서브헤더 높이 = 표 헤더 높이(데스크탑 aside)
찾기:
```ts
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
```
바꾸기:
```ts
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="flex h-[46px] items-center border-b border-unjong-border px-1 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
```

---

## 4단계 — `components/toolbox/BrokerRanking.tsx` 행 높이 정렬

증권사 행(`ListRow`)은 `py-2.5`로 종목 행(`<tr> py-2.5`)과 이미 같다 — 정렬 핵심은 **서브헤더 높이**(3·H/J에서 `h-[46px]`로 맞춤)와 **행 높이 동일성**. ListRow는 공용이라 건드리지 않고, BrokerRanking 자체는 변경 불필요. 단, 헤더 정렬이 픽셀로 보장되도록 BrokerRanking 컨테이너에 `text-sm` 베이스를 명시해 종목표(`text-sm`)와 행 높이 리듬을 맞춘다(안전·무해).
찾기:
```ts
  return (
    <section className="min-w-0">
      {!hideHeader && <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />}
      <div>
```
바꾸기:
```ts
  return (
    <section className="min-w-0 text-sm">
      {!hideHeader && <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />}
      <div>
```

> ListRow 행은 `gap-3 px-2 py-2.5` + 아이콘 `h-6 w-6`(24px) → 종목 행 `py-2.5` + 로고 32px과 높이 근사. 로고가 32로 커지며 종목 행이 살짝 높아질 수 있으나(아이콘 24 vs 32), 행 내용은 `py-2.5`가 지배하고 32px 로고도 `py-2.5*2(20px)+...`범위라 행 높이 변동은 미미. 완전 일치가 필요하면 후속 STEP에서 ListRow에 `min-h` 부여(이번 범위 외).

---

## 5단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add lib/currency.ts components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/BrokerRanking.tsx
git commit -m "feat(STEP 410): 종목표 UI 리파인 — 통화 현지화·드롭다운 1일부터·자동정렬·간격·로고·증권사 높이"
```

> StockLogo는 `size` prop만 바꿔 호출하므로 컴포넌트 파일 수정 없음 → `git add`에 포함 안 함.

## 확인
- [ ] `npm run build` 통과(타입 — `formatPrice` import, US `usd` 제거 후 잔여 호출 없음, `sortDir` 추가).
- [ ] **KR**: 로드 시 거래대금순(삼성전자·SK하이닉스 선두, 페니주 14원 위로 안 옴). 드롭다운 기본 `1일`. 드롭다운에서 1주일/1개월… 고르면 즉시 그 기간 내림차순 정렬 + 컬럼 표시 동기화. 토글(▲/▼/↕) 16px로 크게, select와 간격. 현재가 `358,500원` 형식. 컬럼은 `# | 종목명 | 현재가 | [기간▼] | ⭐`(고정 1일 컬럼 없음). 로고 커짐. 주식/ETF/ETN/리츠 탭·검색·페이지네이션·⭐·모바일 바텀시트 정상.
- [ ] **US**: 현재가 `$275.15`. 드롭다운 기본 `1일`(=changePercent 표시·정렬). 1주일~1년 선택 시 컬럼엔 lazy 값(… → %) 표시되나 정렬은 거래대금 유지(토글 비활성·회색). 주식/ETF 탭·검색·페이지네이션·⭐·바텀시트·lazy(us-quote) 정상.
- [ ] 데스크탑에서 증권사 "최근 분기 거래대금순" 첫 행이 종목표 첫 행과 같은 높이에서 시작(헤더 `h-[46px]` 정렬).
- [ ] KR·US 구조 동일(컬럼·드롭다운·토글·로고·간격·증권사 정렬).

## 스킵 / 보류
- **US 긴 기간(1주일~1년) 전체 정렬** = 보류. 현재 lazy(보이는 50종목만 us-quote)라 전 종목 정렬 불가. → 다음 STEP에서 **DB 미리계산**(us-performance 일괄 라우트로 r1w~r1y 사전 적재) 후 KR처럼 전 기간 정렬 활성화.
- StockLogo 컴포넌트 자체·ListRow `min-h` 강제 정렬은 이번 범위 외(필요 시 후속).
- `lib/utils/format.ts`의 `formatCurrency`는 손대지 않음(다른 화면용). 종목표 전용으로 `lib/currency.ts` 신설(시장코드 기반 확장).
