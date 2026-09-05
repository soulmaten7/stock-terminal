<!-- 2026-06-23 -->
# STEP 373 — [속도] 탭 전환 클라이언트 캐시 + 피드 스켈레톤

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_373_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
탭을 누를 때마다 데이터를 **매번 새로 fetch**하고, 탭 전환 시 컴포넌트가 unmount→remount 돼서 **재방문해도 또 처음부터 로딩**하던 문제 해결.
→ **클라이언트 캐시(stale-while-revalidate)**: 한 번 받은 탭 데이터를 메모리에 저장 → 같은 탭 재방문 시 **즉시 표시**, 백그라운드로만 갱신. 첫 방문만 로딩.
→ 피드 로딩도 "불러오는 중…" 텍스트 → **스켈레톤**(종목·상품처럼 매끈).

변경: **새 파일 1 (`lib/clientCache.ts`) + 피드 5개 + MarketBoard**. 전부 컴포넌트(클라) → **API 라우트 안 건드림 → 클린 재시작 불필요**(빌드 + 새로고침이면 됨).

---

## ① 새 파일 — `lib/clientCache.ts`

```ts
// 탭 전환 즉시 표시용 클라이언트 캐시 (세션 한정, stale-while-revalidate)
// 한 번 받은 탭 데이터를 메모리에 저장 → 같은 탭 재방문 시 즉시 표시, 백그라운드로만 갱신.
const store = new Map<string, unknown>();

export function getCache<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function setCache(key: string, value: unknown): void {
  store.set(key, value);
}
```

---

## ② `components/toolbox/NewsFeed.tsx`

**찾기:**
```tsx
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
```
**바꾸기:**
```tsx
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
```

**찾기:**
```tsx
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
```
**바꾸기:**
```tsx
  const cacheKey = 'news:' + (query ?? '');
  const [items, setItems] = useState<NewsItem[]>(() => getCache<NewsItem[]>(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => getCache(cacheKey) === undefined);
```

**찾기:**
```tsx
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
```
**바꾸기:**
```tsx
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache(cacheKey, list); setLoading(false); } })
```

**찾기:**
```tsx
  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">최신 뉴스 불러오는 중…</p>;
```
**바꾸기:**
```tsx
  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
```

---

## ③ `components/toolbox/DartFeed.tsx`

**찾기:**
```tsx
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
```
**바꾸기:**
```tsx
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
```

**찾기:**
```tsx
  const [items, setItems] = useState<DartItem[]>([]);
  const [loading, setLoading] = useState(true);
```
**바꾸기:**
```tsx
  const [items, setItems] = useState<DartItem[]>(() => getCache<DartItem[]>('dart') ?? []);
  const [loading, setLoading] = useState(() => getCache('dart') === undefined);
```

**찾기:**
```tsx
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
```
**바꾸기:**
```tsx
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache('dart', list); setLoading(false); } })
```

**찾기:**
```tsx
  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">최신 공시 불러오는 중…</p>;
```
**바꾸기:**
```tsx
  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
```

---

## ④ `components/toolbox/MacroFeed.tsx`

**찾기:**
```tsx
import { useEffect, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useState } from 'react';
import { getCache, setCache } from '@/lib/clientCache';
```

**찾기:**
```tsx
  const [kr, setKr] = useState<Indicator[]>([]);
  const [us, setUs] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
```
**바꾸기:**
```tsx
  const cached = getCache<{ kr: Indicator[]; us: Indicator[] }>('macro');
  const [kr, setKr] = useState<Indicator[]>(cached?.kr ?? []);
  const [us, setUs] = useState<Indicator[]>(cached?.us ?? []);
  const [loading, setLoading] = useState(cached === undefined);
```

**찾기:**
```tsx
      .then((j) => { if (!cancelled) { setKr(j.kr ?? []); setUs(j.us ?? []); setLoading(false); } })
```
**바꾸기:**
```tsx
      .then((j) => { if (!cancelled) { const k = j.kr ?? []; const u = j.us ?? []; setKr(k); setUs(u); setCache('macro', { kr: k, us: u }); setLoading(false); } })
```

**찾기:**
```tsx
  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">지표 불러오는 중…</p>;
```
**바꾸기:**
```tsx
  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
```

---

## ⑤ `components/toolbox/DividendFeed.tsx`

**찾기:**
```tsx
import { useEffect, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useState } from 'react';
import { getCache, setCache } from '@/lib/clientCache';
```

**찾기:**
```tsx
  const [items, setItems] = useState<DivItem[]>([]);
  const [loading, setLoading] = useState(true);
```
**바꾸기:**
```tsx
  const [items, setItems] = useState<DivItem[]>(() => getCache<DivItem[]>('dividend') ?? []);
  const [loading, setLoading] = useState(() => getCache('dividend') === undefined);
```

**찾기:**
```tsx
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
```
**바꾸기:**
```tsx
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache('dividend', list); setLoading(false); } })
```

**찾기:**
```tsx
  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">배당 정보 불러오는 중…</p>;
```
**바꾸기:**
```tsx
  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
```

---

## ⑥ `components/toolbox/IpoFeed.tsx`

**찾기:**
```tsx
import { useEffect, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useState } from 'react';
import { getCache, setCache } from '@/lib/clientCache';
```

**찾기:**
```tsx
  const [items, setItems] = useState<IpoItem[]>([]);
  const [loading, setLoading] = useState(true);
```
**바꾸기:**
```tsx
  const [items, setItems] = useState<IpoItem[]>(() => getCache<IpoItem[]>('ipo') ?? []);
  const [loading, setLoading] = useState(() => getCache('ipo') === undefined);
```

**찾기:**
```tsx
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
```
**바꾸기:**
```tsx
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache('ipo', list); setLoading(false); } })
```

**찾기:**
```tsx
  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">청약일정 불러오는 중…</p>;
```
**바꾸기:**
```tsx
  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
```

---

## ⑦ `components/toolbox/MarketBoard.tsx` (종목·상품 표 — 재방문 즉시)

**찾기:**
```tsx
import { useEffect, useMemo, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useMemo, useState } from 'react';
import { getCache, setCache } from '@/lib/clientCache';
```

**찾기:**
```tsx
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
```
**바꾸기:**
```tsx
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('market:stock') ?? []);
  const [loading, setLoading] = useState(() => getCache('market:stock') === undefined);
```

**찾기:**
```tsx
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);
```
**바꾸기:**
```tsx
  useEffect(() => {
    let cancelled = false;
    const ck = 'market:' + tab;
    const cached = getCache<Row[]>(ck);
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setCache(ck, r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);
```

---

## ✅ 빌드 검증 (필수)
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 다음.
- ❌ 에러 → 메시지 출력 후 멈춤(커밋 금지).

## ✅ 런타임 검증 (컴포넌트만 변경 → 클린 재시작 불필요, 새로고침이면 됨)
> 이미 dev 서버 떠 있으면 브라우저 **새로고침**만. (안 떠 있으면 `npm run dev`)
1. 홈에서 탭 여러 개 클릭(뉴스→공시→거시→공모주→종목·상품) — 각 첫 방문은 **스켈레톤** 잠깐 후 표시.
2. **이미 본 탭으로 다시 전환** → **즉시 표시**(로딩/스켈레톤 없음). ← 이게 이번 핵심.
3. 종목·상품 나갔다 다시 → 표가 **바로** 뜸(다시 9초 로딩 X).

## 📦 커밋·푸시 (빌드 통과 시에만)
```bash
cd ~/stock-terminal && git add -A && git commit -m "perf(toolbox): 탭 데이터 클라이언트 캐시(stale-while-revalidate) + 피드 스켈레톤 — 재방문 즉시 표시 (STEP 373)" && git push
```

---

> **한 줄 요약**: 탭 데이터 메모리 캐시 → 재방문 즉시 표시(백그라운드 갱신) + 피드 스켈레톤. 컴포넌트만 변경이라 새로고침이면 적용. 빌드 통과 시 커밋.
