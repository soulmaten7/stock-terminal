# STEP 51 — Watchlist Phase A: 전일비 컬럼 + 인라인 추가 + 컬럼 정렬 + 종목명 링크

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표**
Watchlist 위젯과 상세 페이지를 레퍼런스 플랫폼(키움 영웅문 / Koyfin) 수준으로 1차 업그레이드.

4가지 변경:
1. **홈 위젯**: 종목명 클릭 → `/stocks/{symbol}` 링크 추가
2. **홈 위젯 + 상세 페이지**: 전일비(원) 컬럼 추가 — 등락률 옆에
3. **상세 페이지**: 인라인 심볼 추가 폼 (6자리 코드 입력 → 엔터 → 즉시 추가)
4. **상세 페이지**: 컬럼 클릭 정렬 (종목명/현재가/전일비/등락률/거래량/시가총액)

**사전 확인 완료 (추가 작업 불필요)**
- `/api/kis/price` 응답에 `change: parseInt(o.prdy_vrss, 10)` 이미 존재 → API 수정 불필요
- `lib/watchlist.ts` 에 `addToWatchlist(userId, symbol, country='KR')` 이미 존재 → lib 수정 불필요

**전제 상태 (이전 커밋)**
- STEP 50 완료 커밋: `2540882`
- `components/widgets/WatchlistWidget.tsx` (138줄)
- `components/watchlist/WatchlistPageClient.tsx` (184줄)
- 상세 스펙 문서: `docs/WIDGET_SPEC_Watchlist.md`

---

## Part A. 홈 위젯 수정 (`components/widgets/WatchlistWidget.tsx`)

### A-1. Import에 Link 추가

**수정 전 (1~6줄):**
```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import WidgetCard from '@/components/home/WidgetCard';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlistSymbols } from '@/lib/watchlist';
```

**수정 후:**
```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import WidgetCard from '@/components/home/WidgetCard';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlistSymbols } from '@/lib/watchlist';
```

### A-2. Row 인터페이스에 `change` 추가

**수정 전 (16~22줄):**
```tsx
interface Row {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
}
```

**수정 후:**
```tsx
interface Row {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}
```

### A-3. `fetchPrice` 리턴에 `change` 매핑

**수정 전 (34~49줄 중 return 부분):**
```tsx
    return {
      symbol,
      name: d.name || fallbackName,
      price: d.price ?? 0,
      changePercent: d.changePercent ?? 0,
      volume: d.volume ?? 0,
    };
```

**수정 후:**
```tsx
    return {
      symbol,
      name: d.name || fallbackName,
      price: d.price ?? 0,
      change: d.change ?? 0,
      changePercent: d.changePercent ?? 0,
      volume: d.volume ?? 0,
    };
```

catch 블록도 수정:
```tsx
  } catch {
    return { symbol, name: fallbackName, price: 0, change: 0, changePercent: 0, volume: 0 };
  }
```

### A-4. 헤더 grid-cols-4 → grid-cols-5 + 전일비 컬럼 추가

**수정 전 (100~107줄):**
```tsx
      <div role="table" aria-label="관심종목 목록" className="w-full">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-4 px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">종목</span>
            <span role="columnheader" className="text-right">현재가</span>
            <span role="columnheader" className="text-right">등락률</span>
            <span role="columnheader" className="text-right">거래량</span>
          </div>
        </div>
```

**수정 후:**
```tsx
      <div role="table" aria-label="관심종목 목록" className="w-full">
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-5 px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]">
            <span role="columnheader">종목</span>
            <span role="columnheader" className="text-right">현재가</span>
            <span role="columnheader" className="text-right">전일비</span>
            <span role="columnheader" className="text-right">등락률</span>
            <span role="columnheader" className="text-right">거래량</span>
          </div>
        </div>
```

### A-5. 본문 row 도 grid-cols-5 + 종목명 Link + 전일비 셀

**수정 전 (110~130줄):**
```tsx
          {rows.map((r) => (
            <div
              key={r.symbol}
              role="row"
              className="grid grid-cols-4 px-3 py-2.5 text-sm hover:bg-[#F8F9FA] border-b border-[#F0F0F0]"
            >
              <span role="cell" className="font-bold text-black truncate">{r.name}</span>
              <span role="cell" className="text-right text-black">
                {r.price > 0 ? fmtPrice(r.price) : '—'}
              </span>
              <span
                role="cell"
                className={`text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
              >
                {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
              </span>
              <span role="cell" className="text-right text-[#666]">
                {r.volume > 0 ? fmtVol(r.volume) : '—'}
              </span>
            </div>
          ))}
```

**수정 후:**
```tsx
          {rows.map((r) => (
            <div
              key={r.symbol}
              role="row"
              className="grid grid-cols-5 px-3 py-2.5 text-sm hover:bg-[#F8F9FA] border-b border-[#F0F0F0]"
            >
              <Link
                href={`/stocks/${r.symbol}`}
                role="cell"
                className="font-bold text-black truncate hover:text-[#0ABAB5]"
              >
                {r.name}
              </Link>
              <span role="cell" className="text-right text-black">
                {r.price > 0 ? fmtPrice(r.price) : '—'}
              </span>
              <span
                role="cell"
                className={`text-right ${r.change >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
              >
                {r.price > 0 ? `${r.change >= 0 ? '+' : ''}${fmtPrice(r.change)}` : '—'}
              </span>
              <span
                role="cell"
                className={`text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}
              >
                {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
              </span>
              <span role="cell" className="text-right text-[#666]">
                {r.volume > 0 ? fmtVol(r.volume) : '—'}
              </span>
            </div>
          ))}
```

---

## Part B. 상세 페이지 수정 (`components/watchlist/WatchlistPageClient.tsx`)

### B-1. Import에 FormEvent, addToWatchlist, Plus 아이콘 추가

**수정 전 (1~7줄):**
```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlist, removeFromWatchlist } from '@/lib/watchlist';
```

**수정 후:**
```tsx
'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Star, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/watchlist';
```

### B-2. PriceData 인터페이스에 `change` 추가

**수정 전 (9~15줄):**
```tsx
interface PriceData {
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}
```

**수정 후:**
```tsx
interface PriceData {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}
```

### B-3. fetchPrice 리턴에 `change` 매핑

**수정 전 (23~38줄 중 return 부분 + catch):**
```tsx
    return {
      name: d.name ?? symbol,
      price: d.price ?? 0,
      changePercent: d.changePercent ?? 0,
      volume: d.volume ?? 0,
      marketCap: d.marketCap ?? 0,
    };
  } catch {
    return { name: symbol, price: 0, changePercent: 0, volume: 0, marketCap: 0 };
  }
```

**수정 후:**
```tsx
    return {
      name: d.name ?? symbol,
      price: d.price ?? 0,
      change: d.change ?? 0,
      changePercent: d.changePercent ?? 0,
      volume: d.volume ?? 0,
      marketCap: d.marketCap ?? 0,
    };
  } catch {
    return { name: symbol, price: 0, change: 0, changePercent: 0, volume: 0, marketCap: 0 };
  }
```

### B-4. 추가 폼 상태 + 정렬 상태 + 핸들러 추가

WatchlistPageClient 함수 내부 (기존 `loading` 상태 선언 직후, 예: 56~57줄 근처) 에 추가:

```tsx
  // 인라인 추가 폼 상태
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // 정렬 상태
  type SortKey = 'name' | 'price' | 'change' | 'changePercent' | 'volume' | 'marketCap';
  type SortDir = 'asc' | 'desc';
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
```

그리고 `handleRemove` 바로 위에 `handleAdd` 추가:

```tsx
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
      await loadAll();
    } else {
      setAddError('추가 실패 (이미 등록되었거나 DB 오류)');
    }
    setAdding(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedRows = sortKey
    ? [...rows].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp = typeof av === 'string'
          ? av.localeCompare(bv as string)
          : (av as number) - (bv as number);
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : rows;
```

### B-5. 테이블 컨테이너 내부 수정 — 인라인 추가 폼 + 헤더 클릭 정렬 + 전일비 컬럼 + sortedRows 사용

**수정 전 (125~179줄 — `<div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">` 블록 전체):**

현재 구조:
```tsx
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
            <span className="text-sm font-bold text-black">내 관심종목 ({rows.length})</span>
            <span className="text-[10px] text-[#999]">KIS API · 10초 갱신</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">종목명</th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">종목코드</th>
                  <th className="px-4 py-2.5 text-right font-bold text-[#666] text-xs">현재가</th>
                  <th className="px-4 py-2.5 text-right font-bold text-[#666] text-xs">등락률</th>
                  <th className="px-4 py-2.5 text-right font-bold text-[#666] text-xs">거래량</th>
                  <th className="px-4 py-2.5 text-right font-bold text-[#666] text-xs">시가총액</th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">추가일</th>
                  <th className="px-4 py-2.5 text-center font-bold text-[#666] text-xs w-12">삭제</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  ...
```

**수정 후 — 위 전체 블록을 아래 블록으로 교체:**

```tsx
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
            <span className="text-sm font-bold text-black">내 관심종목 ({rows.length})</span>
            <span className="text-[10px] text-[#999]">KIS API · 10초 갱신</span>
          </div>

          {/* 인라인 심볼 추가 폼 */}
          <form
            onSubmit={handleAdd}
            className="px-4 py-3 border-b border-[#F0F0F0] flex items-center gap-2 bg-[#FAFAFA]"
          >
            <Plus className="w-4 h-4 text-[#999]" />
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="6자리 종목코드 (예: 005930)"
              className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-[#E5E7EB] focus:border-[#0ABAB5] focus:outline-none"
              maxLength={6}
              pattern="[0-9]{6}"
              inputMode="numeric"
            />
            <button
              type="submit"
              disabled={!newSymbol.trim() || adding}
              className="px-4 py-1.5 text-sm font-bold text-white bg-[#0ABAB5] hover:bg-[#089A95] disabled:bg-[#CCCCCC] disabled:cursor-not-allowed"
            >
              {adding ? '추가 중…' : '추가'}
            </button>
            {addError && (
              <span className="text-xs text-[#FF3B30]">{addError}</span>
            )}
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                  <th
                    onClick={() => toggleSort('name')}
                    className="px-4 py-2.5 text-left font-bold text-[#666] text-xs cursor-pointer hover:text-black select-none"
                  >
                    종목명 {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">종목코드</th>
                  <th
                    onClick={() => toggleSort('price')}
                    className="px-4 py-2.5 text-right font-bold text-[#666] text-xs cursor-pointer hover:text-black select-none"
                  >
                    현재가 {sortKey === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => toggleSort('change')}
                    className="px-4 py-2.5 text-right font-bold text-[#666] text-xs cursor-pointer hover:text-black select-none"
                  >
                    전일비 {sortKey === 'change' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => toggleSort('changePercent')}
                    className="px-4 py-2.5 text-right font-bold text-[#666] text-xs cursor-pointer hover:text-black select-none"
                  >
                    등락률 {sortKey === 'changePercent' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => toggleSort('volume')}
                    className="px-4 py-2.5 text-right font-bold text-[#666] text-xs cursor-pointer hover:text-black select-none"
                  >
                    거래량 {sortKey === 'volume' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => toggleSort('marketCap')}
                    className="px-4 py-2.5 text-right font-bold text-[#666] text-xs cursor-pointer hover:text-black select-none"
                  >
                    시가총액 {sortKey === 'marketCap' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">추가일</th>
                  <th className="px-4 py-2.5 text-center font-bold text-[#666] text-xs w-12">삭제</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr key={r.id} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                    <td className="px-4 py-2.5">
                      <Link href={`/stocks/${r.symbol}`} className="font-bold text-black hover:text-[#0ABAB5]">
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[#999] text-xs font-mono">{r.symbol}</td>
                    <td className="px-4 py-2.5 text-right text-[#333]">
                      {r.price > 0 ? fmtNum(r.price) : '—'}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${r.change >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {r.price > 0 ? `${r.change >= 0 ? '+' : ''}${fmtNum(r.change)}` : '—'}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#666] text-xs">
                      {r.volume > 0 ? fmtNum(r.volume) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#333]">
                      {fmtMarketCap(r.marketCap)}
                    </td>
                    <td className="px-4 py-2.5 text-[#999] text-xs">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleRemove(r.symbol)}
                        className="text-[#999] hover:text-[#FF3B30] p-1"
                        aria-label="관심종목 제거"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
```

**체크포인트**: `rows.map` 을 `sortedRows.map` 으로 바꾼 것 확인. 헤더 9개 (종목명/종목코드/현재가/**전일비**/등락률/거래량/시가총액/추가일/삭제).

---

## Part C. 빌드 검증

```bash
npm run build
```

성공해야 함. TypeScript 에러 있으면 보고.

흔히 발생 가능한 실수:
- Link import 누락 (홈 위젯)
- FormEvent import 누락 (상세)
- addToWatchlist import 누락 (상세)
- `sortedRows.map` 으로 바꿨는지 (상세)

## Part D. 수동 검증 (사용자가 실행)

Claude Code는 빌드만 확인. 실제 브라우저 검증은 사용자가:

```bash
npm run dev -- -p 3333
```

체크리스트 (사용자가 브라우저에서 확인):
- [ ] 홈 위젯: 컬럼 5개 (종목/현재가/전일비/등락률/거래량)
- [ ] 홈 위젯: 종목명 클릭 → `/stocks/005930` 이동
- [ ] 홈 위젯: 전일비 ± 부호 + 상승 빨강 / 하락 파랑 색상
- [ ] `/watchlist` 테이블 상단에 인라인 추가 폼 보임
- [ ] "005930" 입력 → "추가" 클릭 → 리스트에 삼성전자 즉시 등장
- [ ] 헤더 "등락률" 클릭 → 정렬 토글 (↑/↓ 아이콘 표시)
- [ ] 헤더 "전일비" 클릭 → 정렬 동작
- [ ] 전일비 컬럼 상승 빨강 / 하락 파랑 색상

## Part E. 문서 업데이트

### E-1. 4개 헤더 날짜 오늘로 (이미 2026-04-22 이면 스킵)

### E-2. `docs/CHANGELOG.md` 상단에 블록 추가

```markdown
## 2026-04-22 — STEP 51: Watchlist Phase A

### 변경
- `WatchlistWidget.tsx`: 4컬럼 → 5컬럼 (전일비 추가), 종목명 Link 로 교체
- `WatchlistPageClient.tsx`:
  - 전일비 컬럼 추가 (종목코드/현재가 → 전일비 → 등락률/거래량/시가총액)
  - 인라인 심볼 추가 폼 (6자리 코드 입력 → Enter → 즉시 loadAll)
  - 컬럼 클릭 정렬 6컬럼 (name/price/change/changePercent/volume/marketCap), 토글 방향
- API/DB 변경 없음 — `/api/kis/price` 의 `change` 필드 + `lib/watchlist.addToWatchlist` 이미 존재

### 스펙 문서
- `docs/WIDGET_SPEC_Watchlist.md` 생성 (Phase A/B/C 로드맵 포함)

### 다음 (Phase B)
- 다중 Watchlist 그룹 (DB: `watchlist_groups` 테이블 + `watchlist_items.group_id`)
- 컬럼 커스터마이징 (30+ 컬럼 중 사용자 선택)
```

### E-3. `session-context.md` 에 완료 블록 추가

```markdown
### 2026-04-22 세션 — STEP 51 완료
- [x] Watchlist 위젯 5컬럼화 (전일비 추가)
- [x] 홈 위젯 종목명 Link 추가
- [x] 상세 페이지 인라인 심볼 추가 폼
- [x] 상세 페이지 컬럼 클릭 정렬 (6컬럼)
- [x] 빌드 검증 통과
- [x] `docs/WIDGET_SPEC_Watchlist.md` 스펙 문서 작성
```

### E-4. `docs/NEXT_SESSION_START.md` 업데이트

현재 상태를 STEP 51 완료 시점으로 갱신. 다음 할 일 후보:
- STEP 52: Chart 위젯 (P0) — TradingView 위젯 재확인, 심볼 검색 바 추가
- STEP 53: OrderBook 위젯 (P0) — 키움 영웅문 호가창 스타일
- STEP 54: DartFilingsWidget (P0) — DART 공식 공시유형 뱃지

## Part F. Git commit + push

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
STEP 51: Watchlist Phase A — change column, inline add, sort, stock link

WidgetCard:
- 4→5 columns (add 전일비 between 현재가 and 등락률)
- wrap stock name in <Link href="/stocks/{symbol}">

WatchlistPageClient:
- add 전일비 column (+ color: red up / blue down)
- inline symbol add form (6-digit pattern, loadAll on success)
- header click sorting for 6 columns (name/price/change/pct/volume/cap)

API and DB already had what we need:
- /api/kis/price already returns `change: parseInt(o.prdy_vrss, 10)`
- lib/watchlist already exports addToWatchlist(userId, symbol)

Spec doc: docs/WIDGET_SPEC_Watchlist.md (Phase A/B/C roadmap)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

## Part G. 최종 확인

```bash
git log --oneline -5
```

"STEP 51" 최신 커밋 확인 후 종료.

---

## 체크리스트 요약 (Claude Code 용)

- [ ] Part A-1: WatchlistWidget Link import
- [ ] Part A-2: Row 인터페이스 change 추가
- [ ] Part A-3: fetchPrice return + catch 에 change
- [ ] Part A-4: 헤더 grid-cols-5 + 전일비
- [ ] Part A-5: 본문 row grid-cols-5 + Link + 전일비 cell
- [ ] Part B-1: PageClient imports (FormEvent, Plus, addToWatchlist)
- [ ] Part B-2: PriceData change 추가
- [ ] Part B-3: fetchPrice return + catch change
- [ ] Part B-4: 상태 + handleAdd + toggleSort + sortedRows
- [ ] Part B-5: 테이블 블록 전체 교체 (폼 + 9헤더 + sortedRows.map)
- [ ] Part C: 빌드 성공
- [ ] Part E: 4문서 업데이트
- [ ] Part F: commit + push
- [ ] Part G: 커밋 로그 확인
