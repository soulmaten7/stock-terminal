# STEP 30 — Phase 2-D 관심종목 생태계 완성

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `a38cfe4 feat: wire KIS API data into /net-buy tabs (Phase 2-B complete)`
- Supabase `watchlists` 테이블 + `lib/watchlist.ts` CRUD 함수 이미 존재 (`getWatchlist` / `addToWatchlist` / `removeFromWatchlist` / `isInWatchlist`)
- `WatchlistPanel.tsx`는 정상 작동 (채팅 패널용 좁은 UI)
- **현재 빈틈 3가지**:
  1. `/screener`(종목 발굴) 테이블에 관심종목 추가 버튼 없음 — 발굴→찜 여정 끊김
  2. `/watchlist` 페이지가 `WidgetDetailStub` + `Math.random()` stub — 로그인 유저도 가짜 데이터 봄 (CLAUDE.md 절대규칙 "숫자 만들기 금지" 위반 상태)
  3. 홈 `WatchlistWidget`이 하드코딩 5종목(삼성전자·SK하이닉스·NAVER·LG엔솔·카카오) — 로그인 유저의 실제 관심종목 반영 안 됨

## 목표
관심종목 생태계 완성. 발굴→찜→홈위젯→전체페이지가 모두 같은 Supabase 데이터로 연결.

---

## 변경 1: `lib/watchlist.ts` — 헬퍼 추가

파일 끝에 추가:

```ts
export async function getWatchlistSymbols(userId: string): Promise<string[]> {
  const items = await getWatchlist(userId);
  return items.map((i: { symbol: string }) => i.symbol);
}
```

---

## 변경 2: `components/screener/ScreenerClient.tsx` — ⭐ 버튼

### 2-1. import 추가 (기존 import 블록 맨 아래)
```ts
import { Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { addToWatchlist, removeFromWatchlist, getWatchlistSymbols } from '@/lib/watchlist';
```

### 2-2. 컴포넌트 내부 state 추가 (`const [data, setData] = ...` 바로 아래)
```ts
const { user } = useAuthStore();
const [watched, setWatched] = useState<Set<string>>(new Set());
```

### 2-3. 관심종목 로드 useEffect 추가 (기존 searchParams useEffect 아래, API 호출 useEffect 위)
```ts
useEffect(() => {
  if (!user) { setWatched(new Set()); return; }
  getWatchlistSymbols(user.id).then((syms) => setWatched(new Set(syms)));
}, [user]);
```

### 2-4. 토글 핸들러 추가 (`applyPreset` 함수 아래)
```ts
const toggleWatch = async (symbol: string) => {
  if (!user) {
    alert('관심종목은 로그인 후 이용 가능합니다.');
    return;
  }
  const wasWatched = watched.has(symbol);
  // Optimistic update
  setWatched((prev) => {
    const next = new Set(prev);
    if (wasWatched) next.delete(symbol); else next.add(symbol);
    return next;
  });
  const ok = wasWatched
    ? await removeFromWatchlist(user.id, symbol)
    : await addToWatchlist(user.id, symbol);
  if (!ok) {
    // Rollback on failure
    setWatched((prev) => {
      const next = new Set(prev);
      if (wasWatched) next.add(symbol); else next.delete(symbol);
      return next;
    });
  }
};
```

### 2-5. 테이블 `<thead>` 수정 — 맨 오른쪽에 빈 th 추가
```tsx
<thead className="bg-[#F5F5F5] text-xs text-[#999999] font-bold">
  <tr>
    <th className="text-left px-3 py-2">종목</th>
    <th className="text-left px-3 py-2">시장</th>
    <th className="text-left px-3 py-2">섹터</th>
    <th className="text-right px-3 py-2">시가총액</th>
    <th className="text-center px-3 py-2 w-10">⭐</th>
  </tr>
</thead>
```

### 2-6. `stocks.map` 테이블 행에 마지막 `<td>` 추가
기존:
```tsx
<td className="text-right px-3 py-2 font-mono-price font-bold">{formatMarketCap(s.market_cap)}</td>
```
바로 아래에 이어서:
```tsx
<td className="text-center px-3 py-2">
  <button
    onClick={() => toggleWatch(s.symbol)}
    className={`p-1 transition-colors ${watched.has(s.symbol) ? 'text-[#0ABAB5]' : 'text-[#CCC] hover:text-[#0ABAB5]'}`}
    aria-label={watched.has(s.symbol) ? '관심종목 제거' : '관심종목 추가'}
  >
    <Star className="w-4 h-4" fill={watched.has(s.symbol) ? 'currentColor' : 'none'} />
  </button>
</td>
```

### 2-7. 빈 상태 colspan 수정
기존 `colSpan={4}` 두 곳 → `colSpan={5}`로 변경 (로딩 중, 조건에 맞는 종목이 없습니다 두 메시지)

---

## 변경 3: `components/watchlist/WatchlistPageClient.tsx` 신규 생성

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Star } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlist, removeFromWatchlist } from '@/lib/watchlist';

interface PriceData {
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface Row extends PriceData {
  id: number;
  symbol: string;
  createdAt: string;
}

async function fetchPrice(symbol: string): Promise<PriceData> {
  try {
    const r = await fetch(`/api/kis/price?symbol=${symbol}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
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
}

function fmtNum(n: number): string {
  return n.toLocaleString('ko-KR');
}

function fmtMarketCap(n: number): string {
  if (n <= 0) return '—';
  // marketCap 단위가 억원(KIS hts_avls는 억원 단위)
  const 조 = n / 10000;
  return 조 >= 1 ? `${조.toFixed(2)}조` : `${n.toLocaleString('ko-KR')}억`;
}

function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

export default function WatchlistPageClient() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) { setRows([]); setLoading(false); return; }
    const items = await getWatchlist(user.id);
    if (items.length === 0) { setRows([]); setLoading(false); return; }
    const prices = await Promise.all(
      items.map((it: { symbol: string }) => fetchPrice(it.symbol))
    );
    const merged: Row[] = items.map((it: { id: number; symbol: string; created_at: string }, i: number) => ({
      id: it.id,
      symbol: it.symbol,
      createdAt: it.created_at,
      ...prices[i],
    }));
    setRows(merged);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    loadAll();
    const t = setInterval(loadAll, 10_000);
    return () => clearInterval(t);
  }, [authLoading, loadAll]);

  const handleRemove = async (symbol: string) => {
    if (!user) return;
    const ok = await removeFromWatchlist(user.id, symbol);
    if (ok) setRows((prev) => prev.filter((r) => r.symbol !== symbol));
  };

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">관심종목</h1>
        <p className="text-sm text-[#666]">
          등록한 관심종목의 실시간 가격을 10초 간격으로 갱신합니다. KIS API 기반.
        </p>
      </div>

      {authLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[#999]">로딩 중…</div>
      ) : !user ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-10 h-10 text-[#999] mb-4" />
          <p className="text-black font-bold text-lg mb-2">로그인이 필요합니다</p>
          <p className="text-[#999] text-sm mb-4">로그인 후 관심종목을 관리하세요</p>
          <Link href="/auth/login" className="px-6 py-2 bg-[#0ABAB5] text-white font-bold hover:bg-[#088F8C]">
            로그인
          </Link>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[#999]">로딩 중…</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-10 h-10 text-[#999] mb-4" />
          <p className="text-black font-bold text-lg mb-2">관심종목이 없습니다</p>
          <p className="text-[#999] text-sm mb-4">종목 발굴 페이지에서 ⭐를 눌러 추가하세요</p>
          <Link href="/screener" className="px-6 py-2 bg-[#0ABAB5] text-white font-bold hover:bg-[#088F8C]">
            종목 발굴 가기
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
```

---

## 변경 4: `app/watchlist/page.tsx` 전체 교체

```tsx
import type { Metadata } from 'next';
import WatchlistPageClient from '@/components/watchlist/WatchlistPageClient';

export const metadata: Metadata = { title: '관심종목 — StockTerminal' };

export default function WatchlistPage() {
  return <WatchlistPageClient />;
}
```

---

## 변경 5: `components/widgets/WatchlistWidget.tsx` — 로그인 유저 반영

기존 코드를 아래로 **전체 교체**:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import WidgetCard from '@/components/home/WidgetCard';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlistSymbols } from '@/lib/watchlist';

// 비로그인 유저용 기본 관심종목
const DEFAULT_SYMBOLS = [
  { symbol: '005930', name: '삼성전자' },
  { symbol: '000660', name: 'SK하이닉스' },
  { symbol: '035420', name: 'NAVER' },
  { symbol: '373220', name: 'LG에너지솔루션' },
  { symbol: '035720', name: '카카오' },
];

interface Row {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
}

function fmtPrice(n: number): string {
  return n.toLocaleString('ko-KR');
}

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('ko-KR');
}

async function fetchPrice(symbol: string, fallbackName: string): Promise<Row> {
  try {
    const res = await fetch(`/api/kis/price?symbol=${symbol}`);
    if (!res.ok) throw new Error('fetch failed');
    const d = await res.json();
    return {
      symbol,
      name: d.name || fallbackName,
      price: d.price ?? 0,
      changePercent: d.changePercent ?? 0,
      volume: d.volume ?? 0,
    };
  } catch {
    return { symbol, name: fallbackName, price: 0, changePercent: 0, volume: 0 };
  }
}

export default function WatchlistWidget() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [symbols, setSymbols] = useState<{ symbol: string; name: string }[]>(DEFAULT_SYMBOLS);

  // 유저의 관심종목 심볼 로드
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setSymbols(DEFAULT_SYMBOLS); return; }
    getWatchlistSymbols(user.id).then((syms) => {
      if (syms.length === 0) {
        setSymbols([]); // 빈 상태 표시
      } else {
        setSymbols(syms.slice(0, 5).map((s) => ({ symbol: s, name: s })));
      }
    });
  }, [user, authLoading]);

  // 가격 폴링
  const loadPrices = useCallback(async () => {
    if (symbols.length === 0) { setRows([]); setLoading(false); return; }
    const results = await Promise.all(symbols.map((s) => fetchPrice(s.symbol, s.name)));
    setRows(results);
    setLoading(false);
    setLastUpdate(new Date());
  }, [symbols]);

  useEffect(() => {
    loadPrices();
    const t = setInterval(loadPrices, 10_000);
    return () => clearInterval(t);
  }, [loadPrices]);

  const subtitle = user ? 'KIS API · 내 관심종목' : 'KIS API · 기본 5종목';

  return (
    <WidgetCard
      title="관심종목"
      subtitle={subtitle}
      className="h-full"
      href="/watchlist"
      action={
        loading ? (
          <span className="text-[10px] text-[#BBB]">로딩 중…</span>
        ) : lastUpdate ? (
          <span className="text-[10px] text-[#999]">
            {lastUpdate.toTimeString().slice(0, 5)}
          </span>
        ) : undefined
      }
    >
      {user && symbols.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-[#999] mb-3">관심종목이 없습니다</p>
          <Link href="/screener" className="text-xs font-bold text-[#0ABAB5] hover:underline">
            종목 발굴에서 추가 →
          </Link>
        </div>
      ) : (
        <div role="table" aria-label="관심종목 목록" className="w-full">
          <div role="rowgroup">
            <div role="row" className="grid grid-cols-4 px-3 py-2 text-xs text-[#999] font-bold border-b border-[#F0F0F0]">
              <span role="columnheader">종목</span>
              <span role="columnheader" className="text-right">현재가</span>
              <span role="columnheader" className="text-right">등락률</span>
              <span role="columnheader" className="text-right">거래량</span>
            </div>
          </div>
          <div role="rowgroup">
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
            {!loading && rows.length === 0 && (
              <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
            )}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
```

---

## 검증 순서

1. **빌드**
   ```bash
   npm run build
   ```
   에러 없이 통과.

2. **비로그인 시각 확인** (로그아웃 상태)
   - `http://localhost:3000/screener` → 각 행 오른쪽 ⭐ 표시 (회색 빈 별). 클릭 시 "로그인 후 이용 가능합니다" alert.
   - `http://localhost:3000/watchlist` → 로그인 유도 화면.
   - `http://localhost:3000/` 홈 → `WatchlistWidget`이 DEFAULT_SYMBOLS 5종목 표시 (이전과 동일).

3. **로그인 후 시각 확인**
   - 로그인 → `/screener` → 이미 찜한 종목은 민트색 채워진 별, 아닌 건 빈 별. 클릭 시 즉시 색상 토글 (optimistic).
   - `/watchlist` → 처음엔 "관심종목이 없습니다" → 발굴 가기 버튼. 발굴에서 2~3개 찜 후 돌아오면 실시간 가격 테이블 표시.
   - 홈 `WatchlistWidget` → 내가 찜한 종목으로 변경됨 (max 5개). 관심종목 0개면 "발굴에서 추가 →" 링크.
   - `/watchlist`에서 🗑️ 클릭 → 해당 종목 즉시 사라짐. 새로고침해도 유지.

4. **네트워크 탭 확인**
   - `/screener` 진입 시: Supabase `watchlists` select 1회 + stocks API
   - `/watchlist` 진입 시: Supabase select 1회 + `/api/kis/price?symbol=XXX` 병렬 호출 (종목 수만큼)
   - 10초마다 price 재호출

## 커밋 메시지
```
feat: complete watchlist ecosystem (Phase 2-D)

- Add ⭐ button to screener rows (optimistic toggle, login-gated)
- Replace /watchlist stub with real Supabase + KIS data
  (name/price/change/volume/marketCap/createdAt + delete)
- Home WatchlistWidget now reflects logged-in user's watchlist
  (falls back to DEFAULT_SYMBOLS when logged out)
- Add getWatchlistSymbols helper to lib/watchlist.ts
- Empty state links from widget/page to /screener for discovery
```

## 완료 후 공유
- 빌드 성공 여부
- 비로그인/로그인 2가지 상태 스크린샷 (스크리너 ⭐ / 관심종목 페이지 / 홈 위젯)
- 발굴에서 ⭐ 클릭 → 홈 위젯 갱신되는지 (새로고침 필요할 수 있음)

## 다음 단계 예고
이 커밋 확인되면 곧바로 **STEP 31 — Phase 2-C 경제 캘린더 홈 미니 위젯** 명령서 작성. API는 여러 후보(FRED / ECOS / Investing.com RSS) 비교해서 가장 적합한 걸 선택해 진행.
