<!-- 2026-06-23 -->
# STEP 374 — [속도] 리딩방 탭 캐시 + 스켈레톤 (탭 속도 마무리)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_374_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
STEP 373에서 피드 5개 + 종목·상품 표는 캐시했지만 **리딩방 탭(AdvisorDirectory)은 빠짐** → 나갔다 들어오면 또 로딩. 같은 `lib/clientCache.ts`(373에서 생성) 재사용해서 리딩방도 **재방문 즉시 표시**(stale-while-revalidate) + 로딩 **스켈레톤**. 이걸로 "모든 탭" 속도 마무리.

변경: **1파일** `components/toolbox/AdvisorDirectory.tsx`. 컴포넌트만 → 클린 재시작 불필요(빌드 + 새로고침).

> 리딩방은 필터(platform·sort·page·검색q)가 있어 **캐시 키 = `advisors:{platform}:{sort}:{page}:{q}`**. 기본 화면(all·interest·1·"")이 재방문 시 즉시 뜨고, 필터/페이지 바꾼 것도 각각 캐시됨.

---

## ① 임포트 추가

**찾기:**
```tsx
import { useEffect, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useState } from 'react';
import { getCache, setCache } from '@/lib/clientCache';
```

## ② 초기 상태 — 기본 화면 캐시값으로 시작 (재방문 즉시)

**찾기:**
```tsx
  const [results, setResults] = useState<Advisor[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
```
**바꾸기:**
```tsx
  const cachedInit = getCache<{ results: Advisor[]; total: number; searching: boolean }>('advisors:all:interest:1:');
  const [results, setResults] = useState<Advisor[]>(cachedInit?.results ?? []);
  const [total, setTotal] = useState(cachedInit?.total ?? 0);
  const [searching, setSearching] = useState(cachedInit?.searching ?? false);
  const [loading, setLoading] = useState(cachedInit === undefined);
```

## ③ fetch 이펙트 — 캐시 즉시 표시 후 백그라운드 갱신

**찾기:**
```tsx
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/advisors?platform=${platform}&sort=${sort}&page=${page}&q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setResults(j.results ?? []);
        setTotal(j.total ?? 0);
        setSearching(!!j.searching);
      } catch {
        setResults([]); setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [platform, sort, page, q]);
```
**바꾸기:**
```tsx
  useEffect(() => {
    const cacheKey = `advisors:${platform}:${sort}:${page}:${q}`;
    const cached = getCache<{ results: Advisor[]; total: number; searching: boolean }>(cacheKey);
    if (cached) { setResults(cached.results); setTotal(cached.total); setSearching(cached.searching); setLoading(false); }
    else { setLoading(true); }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/advisors?platform=${platform}&sort=${sort}&page=${page}&q=${encodeURIComponent(q)}`);
        const j = await r.json();
        const nextResults = j.results ?? [];
        const nextTotal = j.total ?? 0;
        const nextSearching = !!j.searching;
        setResults(nextResults); setTotal(nextTotal); setSearching(nextSearching);
        setCache(cacheKey, { results: nextResults, total: nextTotal, searching: nextSearching });
      } catch {
        if (!cached) { setResults([]); setTotal(0); }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [platform, sort, page, q]);
```

## ④ 로딩 → 스켈레톤

**찾기:**
```tsx
          {loading ? (
            <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>
          ) : results.length === 0 ? (
```
**바꾸기:**
```tsx
          {loading ? (
            <ul className="space-y-2 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="h-16 animate-pulse rounded-lg bg-unjong-background" />
              ))}
            </ul>
          ) : results.length === 0 ? (
```

---

## ✅ 빌드 검증 (필수)
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 다음.
- ❌ 에러 → 메시지 출력 후 멈춤(커밋 금지).

## ✅ 런타임 검증 (컴포넌트만 → 새로고침이면 됨)
1. 홈에서 **리딩방·검증** 탭 클릭 — 첫 방문은 스켈레톤 잠깐 후 목록.
2. 다른 탭 갔다가 **리딩방 다시** → **즉시 표시**(로딩/스켈레톤 없음).
3. 리딩방 안에서 플랫폼 필터·정렬·페이지 바꿔보고, 다시 그 조합으로 오면 즉시.
4. 검색은 그대로 동작(250ms 디바운스 유지).

## 📦 커밋·푸시 (빌드 통과 시에만)
```bash
cd ~/stock-terminal && git add -A && git commit -m "perf(toolbox): 리딩방(AdvisorDirectory) 클라이언트 캐시 + 스켈레톤 — 모든 탭 재방문 즉시 (STEP 374)" && git push
```

---

> **한 줄 요약**: 리딩방 탭도 373 캐시 재사용(필터별 키) → 재방문 즉시 + 스켈레톤. 이걸로 전 탭 속도 마무리. 컴포넌트만이라 새로고침이면 적용.
