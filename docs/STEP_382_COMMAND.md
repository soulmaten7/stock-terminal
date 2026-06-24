<!-- 2026-06-24 -->
# STEP 382 — 관심종목(⭐): DB+API + 행 별 + /favorites 표시

> `watchlist` 테이블은 `001_initial_schema.sql`에 이미 있음. `name_ko` 컬럼만 마이그레이션으로 추가. 빌드 통과 시에만 커밋.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_382_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
종목·상품 표 각 행에 ⭐ 별 버튼 → Supabase `watchlist` 저장 → `/favorites` 페이지 관심종목 섹션.
변경: DB 마이그레이션 1 · API 1 · 컴포넌트 3 · 페이지 2.

---

## ① `supabase/migrations/027_watchlist_name.sql` — 신규 파일

```sql
-- 2026-06-24 · watchlist 테이블에 name_ko 컬럼 추가
-- 종목명을 저장해 즐겨찾기 표시 시 별도 조회 불필요
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS name_ko TEXT;
```

파일 저장 후 **Supabase MCP로 적용**:
```
mcp__claude_ai_Supabase__execute_sql 으로
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS name_ko TEXT;
실행 (프로젝트: 운종 전용, ref qxkmwlkchyxfzxbonhtj)
```

---

## ② `app/api/watchlist/route.ts` — 신규 파일

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ watchlist: [], auth: false });

  const { data } = await supabase
    .from('watchlist')
    .select('symbol, name_ko, market, country')
    .eq('user_id', user.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  return NextResponse.json({ watchlist: data ?? [], auth: true });
}

export async function POST(req: NextRequest) {
  const { symbol, name_ko, market, country, add } = await req.json().catch(() => ({}));
  if (!symbol || !market || add === undefined) {
    return NextResponse.json({ error: 'symbol, market, add required' }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (add) {
    await supabase.from('watchlist').upsert(
      { user_id: user.id, symbol, name_ko: name_ko ?? symbol, market, country: country ?? 'KR' },
      { onConflict: 'user_id,symbol,market' }
    );
  } else {
    await supabase.from('watchlist').delete()
      .eq('user_id', user.id).eq('symbol', symbol).eq('market', market);
  }
  return NextResponse.json({ ok: true, symbol, add });
}
```

---

## ③ `components/favorites/WatchlistClient.tsx` — 신규 파일

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';

type WatchItem = { symbol: string; name_ko: string | null; market: string; country: string };

export default function WatchlistClient() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.watchlist ?? []); setAuth(j.auth !== false); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const remove = (symbol: string, market: string) => {
    setItems((prev) => prev.filter((x) => !(x.symbol === symbol && x.market === market)));
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, market, add: false }),
    }).catch(() => {});
  };

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>;
  if (!auth) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm text-unjong-muted">로그인하면 관심종목을 모아볼 수 있어요.</p>
        <Link href="/auth/login" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">로그인 →</Link>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm leading-relaxed text-unjong-muted">관심종목이 없어요.<br />종목·상품 탭에서 ⭐를 눌러 추가하세요.</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {items.map((f) => (
        <li key={`${f.symbol}:${f.market}`} className="flex items-center gap-2 border-b border-unjong-border px-3 py-2.5 last:border-0">
          <StockLogo code={f.symbol} name={f.name_ko ?? f.symbol} size={22} />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary">{f.name_ko ?? f.symbol}</span>
          <span className="shrink-0 font-mono text-xs text-unjong-muted">{f.symbol}</span>
          <button type="button" onClick={() => remove(f.symbol, f.market)} aria-label="관심종목 해제" className="shrink-0 text-unjong-border transition-colors hover:text-unjong-danger">
            <X size={15} />
          </button>
        </li>
      ))}
    </ul>
  );
}
```

---

## ④ `components/toolbox/MarketBoard.tsx` — 4곳 수정

### ④-A 임포트에 Star 추가
**찾기:**
```tsx
import { useEffect, useMemo, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
```

### ④-B 컴포넌트 시그니처 + watchSet 상태 추가
**찾기:**
```tsx
export default function MarketBoard() {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('market:stock') ?? []);
  const [loading, setLoading] = useState(() => getCache('market:stock') === undefined);
  const [sortKey, setSortKey] = useState<PeriodKey | 'amount'>('amount');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d');
```
**바꾸기:**
```tsx
export default function MarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('market:stock') ?? []);
  const [loading, setLoading] = useState(() => getCache('market:stock') === undefined);
  const [sortKey, setSortKey] = useState<PeriodKey | 'amount'>('amount');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
```

### ④-C 관심종목 로드 + toggleWatch 함수 — 기존 탭 effect 바로 위에 삽입
**찾기:**
```tsx
  useEffect(() => {
    let cancelled = false;
    const ck = 'market:' + tab;
```
**바꾸기:**
```tsx
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => {
        if (j.watchlist) setWatchSet(new Set((j.watchlist as { symbol: string }[]).map((w) => w.symbol)));
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const toggleWatch = (r: Row) => {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    const add = !watchSet.has(r.symbol);
    setWatchSet((prev) => { const n = new Set(prev); add ? n.add(r.symbol) : n.delete(r.symbol); return n; });
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: r.symbol, name_ko: r.name, market: 'KRX', country: 'KR', add }),
    }).catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    const ck = 'market:' + tab;
```

### ④-D 별 th + td 추가 (thead에 1줄, tbody 행마다 1줄)

**찾기 (thead):**
```tsx
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
```
**바꾸기:**
```tsx
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0"><Star size={12} className="text-unjong-muted" /></th>
                  <th className="py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
```

**찾기 (tbody — # 번호 td):**
```tsx
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{i + 1}</td>
```
**바꾸기:**
```tsx
                    <td className="py-2.5 pl-2 pr-0">
                      <button
                        type="button"
                        onClick={() => toggleWatch(r)}
                        aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                        className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{i + 1}</td>
```

---

## ⑤ `components/toolbox/ToolboxClient.tsx` — isLoggedIn MarketBoard에 전달

**찾기:**
```tsx
            <MarketBoard />
```
**바꾸기:**
```tsx
            <MarketBoard isLoggedIn={isLoggedIn} />
```

---

## ⑥ `app/favorites/page.tsx` — 관심종목 섹션 추가

**찾기:**
```tsx
import FavoritesClient from '@/components/favorites/FavoritesClient';
import RoomFavoritesClient from '@/components/favorites/RoomFavoritesClient';
```
**바꾸기:**
```tsx
import FavoritesClient from '@/components/favorites/FavoritesClient';
import RoomFavoritesClient from '@/components/favorites/RoomFavoritesClient';
import WatchlistClient from '@/components/favorites/WatchlistClient';
```

**찾기:**
```tsx
      <section className="mb-7">
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">링크</h2>
```
**바꾸기:**
```tsx
      <section className="mb-7">
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">관심종목</h2>
        <WatchlistClient />
      </section>

      <section className="mb-7">
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">링크</h2>
```

---

## ✅ 빌드 검증 (필수)
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 커밋.
- ❌ 에러 → 메시지 출력 후 멈춤(커밋 금지).

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(watchlist): 관심종목 ⭐ DB+API+행별버튼+/favorites 섹션 (STEP 382)" && git push
```

---

> **한 줄 요약**: `watchlist` name_ko 마이그레이션 + `/api/watchlist` GET/POST + MarketBoard 행별 ⭐ + `/favorites` 관심종목 섹션. 로그아웃 상태 클릭 → 로그인 페이지.
