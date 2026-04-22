# Widget Spec — Watchlist (관심종목)

> **상태**: STEP 51 Phase A 진행 중
> **우선순위**: P0
> **주 레퍼런스**: 키움 영웅문 관심종목, Koyfin Watchlist
> **보조 레퍼런스**: 토스증권 관심종목, 네이버증권 관심종목
> **관련 파일**:
> - 홈 위젯: `components/widgets/WatchlistWidget.tsx`
> - 상세 페이지: `app/watchlist/page.tsx` + `components/watchlist/WatchlistPageClient.tsx`
> - API: `/api/kis/price?symbol=`
> - DB 헬퍼: `lib/watchlist.ts`

---

## 1. 목적

사용자가 관심있는 종목 5~50개를 한 화면에 모아보고, 실시간 가격·등락률·거래량 변화를 추적. 홈 위젯은 "오늘 내 관심종목은 어떻게 움직이고 있나" 한눈에 요약, 상세 페이지는 편집·관리·확장된 정보.

## 2. 레퍼런스 벤치마크 요약

### 키움 영웅문 관심종목 (주 레퍼런스)
- 핵심 컬럼: **종목명 | 현재가 | 전일비(원) | 대비율(%) | 거래량**
- 색상 규칙: **상승 = 빨강 (#FF3B30계열), 하락 = 파랑 (#0051CC계열), 보합 = 검정** (한국 표준)
- 컬럼 우클릭 → 컨텍스트 메뉴 (편집/삭제/정렬)
- 관심1/관심2... 그룹 탭 (최대 30개)

### Koyfin Watchlist (보조)
- 30+ 컬럼 중 사용자가 10~15개 선택 가능 (컬럼 커스터마이징)
- 다중 Watchlist 그룹 (예: "배당주", "AI 테마", "미국 기술주")
- 엑셀 복사 (Ctrl+A → Ctrl+C)
- 드래그 재정렬

### 네이버증권 관심종목 (보조)
- 심플: 종목명 | 현재가 | 전일비 | 등락률 | 거래량
- 여러 그룹 탭

## 3. 현재 상태 분석

### 홈 위젯 (`WatchlistWidget.tsx`, 138줄)
- ✅ 10초 자동 갱신
- ✅ 상승 빨강 / 하락 파랑 색상
- ✅ 비로그인 시 DEFAULT_SYMBOLS 5개 (삼성전자/SK하이닉스/NAVER/LG엔솔/카카오)
- ✅ 로그인 시 Supabase `getWatchlistSymbols()` 기반
- ❌ **종목명 클릭 시 종목 상세로 이동 안 됨** (단순 span)
- ❌ **전일비(원) 컬럼 없음** — 등락률만 있음
- ⚠️ 4컬럼 (종목 | 현재가 | 등락률 | 거래량) — 키움 5컬럼 대비 전일비 빠짐

### 상세 페이지 (`WatchlistPageClient.tsx`, 184줄)
- ✅ 8컬럼: 종목명 | 종목코드 | 현재가 | 등락률 | 거래량 | 시가총액 | 추가일 | 삭제
- ✅ 종목명 클릭 → `/stocks/{symbol}` 이동
- ✅ 10초 갱신
- ✅ 삭제 버튼
- ✅ 빈 상태 / 비로그인 상태 처리 (CTA 버튼)
- ❌ **전일비(원) 컬럼 없음**
- ❌ **인라인 심볼 추가 폼 없음** — 종목 추가하려면 `/screener` 페이지로 가야 함
- ❌ **컬럼 클릭 정렬 없음**
- ❌ 다중 그룹 탭 없음 (단일 리스트만)
- ❌ 컬럼 커스터마이징 없음
- ❌ 드래그 재정렬 없음

## 4. 로드맵 (Phase A/B/C)

### Phase A — 기본 개선 (STEP 51, 지금)
🔴 **필수 4가지**:
1. 홈 위젯: 종목명 클릭 → `/stocks/{symbol}` 링크 추가
2. 홈 위젯 + 상세 페이지: **전일비(원) 컬럼 추가** — 등락률과 함께 표시
3. 상세 페이지: **인라인 심볼 추가 폼** — 종목코드 입력 → 엔터 → 즉시 리스트 갱신
4. 상세 페이지: **컬럼 클릭 정렬** — 종목명/현재가/등락률/거래량/시가총액 기준

### Phase B — 다중 그룹 + 컬럼 커스터마이징 (STEP 52~53 예정)
- DB 스키마 변경 필요 (`watchlist_groups` 테이블 추가, `watchlist_items.group_id` 컬럼)
- UI: 탭 기반 그룹 전환 ("내 관심1" / "배당주" / "AI 테마" 등)
- 컬럼 드롭다운 (체크박스 15개 중 사용자가 선택)

### Phase C — 드래그 재정렬 + 엑셀 복사 (STEP 54 예정)
- `@dnd-kit/sortable` 도입
- `navigator.clipboard.writeText` 로 TSV 복사

## 5. Phase A 상세 스펙

### 5.1 API 응답 확인 (KIS Price)

`/api/kis/price?symbol=005930` 응답에 아래 필드가 있어야 함:
- `price` (현재가)
- `changePercent` (등락률 %)
- `change` 또는 `changeAmount` (전일비 원) — **추가 필요 시 API 핸들러 수정**
- `volume` (거래량)
- `name` (종목명)

Claude Code 첫 단계: `app/api/kis/price/route.ts` 를 열어 `change` 필드가 응답에 포함되는지 확인.
- 이미 있으면 스킵
- 없으면 KIS 응답 파싱 코드에 추가 (`output.prdy_vrss` 같은 필드 매핑)

### 5.2 홈 위젯 변경 (WatchlistWidget.tsx)

**5.2.1 Row 인터페이스에 `change` 추가**
```tsx
interface Row {
  symbol: string;
  name: string;
  price: number;
  change: number;          // ← 신규 (전일비 원)
  changePercent: number;
  volume: number;
}
```

**5.2.2 `fetchPrice` 에 change 매핑**
```tsx
return {
  symbol,
  name: d.name || fallbackName,
  price: d.price ?? 0,
  change: d.change ?? 0,     // ← 신규
  changePercent: d.changePercent ?? 0,
  volume: d.volume ?? 0,
};
```

**5.2.3 레이아웃: 4컬럼 → 5컬럼 (종목 | 현재가 | 전일비 | 등락률 | 거래량)**

현재: `grid-cols-4`
변경: `grid-cols-5`

컬럼 헤더 추가:
```tsx
<span role="columnheader" className="text-right">전일비</span>
```

본문 셀 추가 (종목 / 현재가 다음, 등락률 앞):
```tsx
<span role="cell" className={`text-right ${r.change >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
  {r.price > 0 ? `${r.change >= 0 ? '+' : ''}${fmtPrice(r.change)}` : '—'}
</span>
```

**5.2.4 종목명 셀을 Link 로 교체**
```tsx
import Link from 'next/link';
// ...
<Link
  href={`/stocks/${r.symbol}`}
  role="cell"
  className="font-bold text-black truncate hover:text-[#0ABAB5]"
>
  {r.name}
</Link>
```

### 5.3 상세 페이지 변경 (WatchlistPageClient.tsx)

**5.3.1 PriceData + Row 인터페이스 `change` 추가**
```tsx
interface PriceData {
  name: string;
  price: number;
  change: number;          // ← 신규
  changePercent: number;
  volume: number;
  marketCap: number;
}
```

**5.3.2 fetchPrice 매핑 추가 (d.change ?? 0)**

**5.3.3 테이블 컬럼 추가 (종목코드 다음, 현재가 다음에 "전일비" 삽입)**

헤더:
```tsx
<th className="px-4 py-2.5 text-right font-bold text-[#666] text-xs">전일비</th>
```

본문 cell:
```tsx
<td className={`px-4 py-2.5 text-right ${r.change >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
  {r.price > 0 ? `${r.change >= 0 ? '+' : ''}${fmtNum(r.change)}` : '—'}
</td>
```

**5.3.4 인라인 심볼 추가 폼**

테이블 상단 (`<div className="px-4 py-3 border-b ...">` 다음) 에 추가:
```tsx
<form
  onSubmit={handleAdd}
  className="px-4 py-3 border-b border-[#F0F0F0] flex items-center gap-2"
>
  <input
    type="text"
    value={newSymbol}
    onChange={(e) => setNewSymbol(e.target.value)}
    placeholder="종목코드 (예: 005930)"
    className="px-3 py-1.5 text-sm border border-[#E5E7EB] focus:border-[#0ABAB5] focus:outline-none"
    maxLength={6}
    pattern="[0-9]{6}"
  />
  <button
    type="submit"
    disabled={!newSymbol.trim() || adding}
    className="px-4 py-1.5 text-sm font-bold text-white bg-[#0ABAB5] hover:bg-[#089A95] disabled:bg-[#CCC]"
  >
    {adding ? '추가 중…' : '추가'}
  </button>
  {addError && (
    <span className="text-xs text-[#FF3B30]">{addError}</span>
  )}
</form>
```

상태 및 핸들러 추가:
```tsx
import { addToWatchlist } from '@/lib/watchlist';
// ...
const [newSymbol, setNewSymbol] = useState('');
const [adding, setAdding] = useState(false);
const [addError, setAddError] = useState<string | null>(null);

const handleAdd = async (e: FormEvent) => {
  e.preventDefault();
  if (!user) return;
  const sym = newSymbol.trim();
  if (!/^\d{6}$/.test(sym)) {
    setAddError('6자리 종목코드만 입력');
    return;
  }
  setAdding(true);
  setAddError(null);
  const ok = await addToWatchlist(user.id, sym);
  if (ok) {
    setNewSymbol('');
    await loadAll(); // 재조회
  } else {
    setAddError('추가 실패 (중복 또는 DB 오류)');
  }
  setAdding(false);
};
```

Claude Code 작업: `lib/watchlist.ts` 에 `addToWatchlist(userId, symbol)` 이 있는지 확인. 없으면 추가.

**5.3.5 컬럼 클릭 정렬**

정렬 상태:
```tsx
type SortKey = 'name' | 'price' | 'change' | 'changePercent' | 'volume' | 'marketCap';
type SortDir = 'asc' | 'desc';

const [sortKey, setSortKey] = useState<SortKey>('createdAt' as any);
const [sortDir, setSortDir] = useState<SortDir>('desc');

const sortedRows = [...rows].sort((a, b) => {
  const av = a[sortKey];
  const bv = b[sortKey];
  const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
  return sortDir === 'asc' ? cmp : -cmp;
});

const toggleSort = (key: SortKey) => {
  if (sortKey === key) {
    setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
  } else {
    setSortKey(key);
    setSortDir('desc');
  }
};
```

헤더 th 를 클릭 가능하게:
```tsx
<th
  onClick={() => toggleSort('price')}
  className="px-4 py-2.5 text-right font-bold text-[#666] text-xs cursor-pointer hover:text-black"
>
  현재가 {sortKey === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
</th>
```

동일 패턴으로 name, change, changePercent, volume, marketCap 헤더 적용. 종목코드/추가일/삭제는 정렬 제외.

`<tbody>` 에서 `rows` 대신 `sortedRows` 사용.

## 6. Phase A 완료 조건

- [ ] KIS price API 응답에 `change` 필드 확인 (없으면 추가)
- [ ] `WatchlistWidget.tsx`: 5컬럼 + 전일비 컬럼 + 종목명 Link
- [ ] `WatchlistPageClient.tsx`: 전일비 컬럼 + 인라인 추가 폼 + 컬럼 정렬
- [ ] `lib/watchlist.ts`: `addToWatchlist` 함수 존재 확인
- [ ] 빌드 성공 (`npm run build`)
- [ ] 로컬 테스트: 홈 위젯 종목명 클릭 → `/stocks/005930` 이동 확인
- [ ] 로컬 테스트: `/watchlist` 에서 "005930" 추가 → 즉시 리스트 반영
- [ ] 로컬 테스트: "등락률" 헤더 클릭 → 정렬 방향 토글

## 7. Phase A 범위 밖 (나중 STEP)

- 다중 그룹 탭 (Phase B)
- 컬럼 커스터마이징 (Phase B)
- 드래그 재정렬 (Phase C)
- 엑셀 복사 (Phase C)
- 우클릭 컨텍스트 메뉴 (Phase C)
