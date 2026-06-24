<!-- 2026-06-24 -->
# STEP 391 — [P3 견고성] non-null 방어 + effect 가드 + 캐시 로그아웃 클리어

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_391_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표 (작고 안전한 견고성 3종)
1. **non-null 단언 방어**: `PERIODS.find(...)!.field` — find가 undefined면 크래시. `?.field ?? fallback`로 방어.
2. **관심종목 effect unmount 가드**: 탭 빠르게 전환 시 unmount 후 setState 경고 → `cancelled` 플래그.
3. **캐시 로그아웃 클리어**: 공용 PC에서 로그아웃 시 메모리 캐시 비워 다음 사용자가 신선한 데이터 받게.

변경 3파일: `lib/clientCache.ts`, `components/layout/Header.tsx`, `components/toolbox/MarketBoard.tsx`.

---

## ① `lib/clientCache.ts` — clearCache 추가
**찾기:**
```ts
export function setCache(key: string, value: unknown): void {
  store.set(key, value);
}
```
**바꾸기:**
```ts
export function setCache(key: string, value: unknown): void {
  store.set(key, value);
}

// 로그아웃 시 호출 — 메모리 캐시 비워 다음 사용자가 신선한 데이터 받게.
export function clearCache(): void {
  store.clear();
}
```

## ② `components/layout/Header.tsx` — 로그아웃 시 캐시 클리어

**②-A 임포트** — 찾기:
```tsx
import { User, Star, LogOut } from 'lucide-react';
```
바꾸기:
```tsx
import { User, Star, LogOut } from 'lucide-react';
import { clearCache } from '@/lib/clientCache';
```

**②-B handleLogout** — 찾기:
```tsx
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    setProfileOpen(false);
    router.push('/');
  };
```
바꾸기:
```tsx
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    clearCache();
    setProfileOpen(false);
    router.push('/');
  };
```

## ③ `components/toolbox/MarketBoard.tsx`

**③-A non-null 단언 방어** — 찾기:
```tsx
  const sortField = sortKey === 'amount' ? null : PERIODS.find((p) => p.key === sortKey)!.field;
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)!.field;
```
바꾸기:
```tsx
  const sortField = sortKey === 'amount' ? null : (PERIODS.find((p) => p.key === sortKey)?.field ?? null);
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)?.field ?? PERIODS[0].field;
```

**③-B 관심종목 effect unmount 가드** — 찾기:
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
```
바꾸기:
```tsx
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.watchlist) setWatchSet(new Set((j.watchlist as { symbol: string }[]).map((w) => w.symbol)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn]);
```

---

## ✅ 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
무에러 시:
```bash
cd ~/stock-terminal && git add -A && git commit -m "fix(robustness): PERIODS find 방어 + 관심종목 effect 가드 + 로그아웃 캐시 클리어 (STEP 391)" && git push
```
> 빌드 실패 시 멈추고 알려줘.

## ✅ 런타임 (새로고침)
- 표·정렬·드롭다운 평소대로 동작(방어만 추가, 외형 동일).
- 로그아웃 → 재로그인/다른 계정 시 이전 캐시 안 남음.

---

> **한 줄 요약**: 작은 견고성 3종 — find 옵셔널체이닝 방어, 관심종목 effect 가드, 로그아웃 시 캐시 비우기. 외형 불변.
