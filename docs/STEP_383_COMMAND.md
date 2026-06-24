<!-- 2026-06-24 -->
# STEP 383 — 전체 페이지네이션(~2,600) + 🔍검색

> STEP 382 완료 후 실행. **데스크탑 외형 불변**. 빌드 통과 시에만 커밋.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_383_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
- 주식 탭: 거래대금 상위 100 → **전 종목(~2,600)** 로드(API 한도 3000으로 확장).
- ETF·ETN·리츠: 이미 전량 반환 중, 변경 없음.
- **검색**: 종목명·코드 실시간 필터(빈 칸이면 전체 표시).
- **페이지네이션**: 50행씩, 이전·다음 버튼 + "N / M 페이지 (총 K 종목)".
- 탭·검색 변경 시 페이지 자동 리셋.

변경 2파일: `app/api/krx/ranking/route.ts`, `components/toolbox/MarketBoard.tsx`.

---

## ① `app/api/krx/ranking/route.ts` — 한도 200 → 3000

**찾기:**
```ts
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "100", 10) || 100, 200);
```
**바꾸기:**
```ts
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "100", 10) || 100, 3000);
```

---

## ② `components/toolbox/MarketBoard.tsx` — 5곳 수정

### ②-A fetch limit 100 → 2600 (주식 탭만)

**찾기:**
```ts
      const j = await (await fetch('/api/krx/ranking?market=all&sort=amount&limit=100')).json();
```
**바꾸기:**
```ts
      const j = await (await fetch('/api/krx/ranking?market=all&sort=amount&limit=2600')).json();
```

### ②-B search·page 상태 추가 — mobilePeriod 바로 아래

**찾기:**
```tsx
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
```
**바꾸기:**
```tsx
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
```

### ②-C 탭 변경 시 페이지·검색 리셋 — 기존 탭 useEffect 안에 추가

**찾기:**
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
**바꾸기:**
```tsx
  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    const ck = 'market:' + tab;
    const cached = getCache<Row[]>(ck);
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setCache(ck, r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);
```

### ②-D sorted useMemo에 검색 필터 + 페이지네이션 변수 추가

**찾기:**
```tsx
  const sortField = sortKey === 'amount' ? null : PERIODS.find((p) => p.key === sortKey)!.field;
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)!.field;
  const sorted = useMemo(() => {
    if (!sortField) return rows.slice(0, 100); // 거래대금순(원래 순서) — 대형주 우선이라 기간 데이터가 차 있음
    return [...rows].sort((a, b) => {
      const av = a[sortField] as number | null | undefined;
      const bv = b[sortField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    }).slice(0, 100);
  }, [rows, sortField, sortDir]);
```
**바꾸기:**
```tsx
  const sortField = sortKey === 'amount' ? null : PERIODS.find((p) => p.key === sortKey)!.field;
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)!.field;
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
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
```

### ②-E 검색 입력 + 표 tbody + 페이지네이션 UI

**찾기:**
```tsx
        <div className="min-w-0 flex-1 overflow-x-auto">
          {loading ? (
```
**바꾸기:**
```tsx
        <div className="min-w-0 flex-1 overflow-x-auto">
          {/* 검색 */}
          <div className="mb-2 flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="종목명·코드 검색"
              className="w-full max-w-xs rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="text-xs text-unjong-muted hover:text-unjong-accent">초기화</button>}
          </div>
          {loading ? (
```

**찾기 (tbody map — sorted → paginated):**
```tsx
                {sorted.map((r, i) => (
```
**바꾸기:**
```tsx
                {paginated.map((r, i) => (
```

> ⚠️ `i`는 페이지 내 인덱스가 됨. 절대 순위가 필요하면 `page * PAGE_SIZE + i + 1`로 계산. 현재는 그냥 인덱스 번호로도 충분.

**찾기 (tbody 위 sorted.length === 0 조건):**
```tsx
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">데이터가 없습니다. 잠시 후 다시 시도해 주세요.</p>
          ) : (
```
**바꾸기:**
```tsx
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">{search ? `"${search}" 검색 결과 없음` : '데이터가 없습니다. 잠시 후 다시 시도해 주세요.'}</p>
          ) : (
```

**찾기 (표 닫는 태그 바로 뒤 — 페이지네이션 UI 삽입):**
```tsx
            </table>
          )}
        </div>
```
**바꾸기:**
```tsx
            </table>
          )}
          {/* 페이지네이션 */}
          {!loading && sorted.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-unjong-border px-2 py-2.5 text-xs text-unjong-muted">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded px-2 py-1 hover:bg-unjong-background disabled:opacity-30"
              >
                ← 이전
              </button>
              <span>{page + 1} / {totalPages} 페이지 (총 {sorted.length.toLocaleString()} 종목)</span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded px-2 py-1 hover:bg-unjong-background disabled:opacity-30"
              >
                다음 →
              </button>
            </div>
          )}
        </div>
```

> `sorted.map` → `paginated.map`으로 교체하면 tbody `i`는 0부터 49(한 페이지 내 인덱스). 절대 순위가 필요하면 `page * PAGE_SIZE + i + 1` 사용.

---

## ✅ 빌드 검증
```bash
cd ~/stock-terminal && npm run build
```

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(market): 전체 종목 페이지네이션(50/p) + 검색 필터 (STEP 383)" && git push
```

---

> **한 줄 요약**: 주식 탭 전 종목(~2,600) 로드 + 검색 입력(실시간 필터) + 50행 페이지네이션. 탭·검색 바뀌면 페이지 0으로 리셋.
