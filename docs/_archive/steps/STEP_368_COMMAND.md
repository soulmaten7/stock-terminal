<!-- 2026-06-23 -->
# STEP 368 — [완성도] 종목·상품 랜딩 안정화 (거래대금순 기본 + 스켈레톤)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_368_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
기본 랜딩(종목·상품)이 ① 첫 로딩이 "불러오는 중…"만 ② 기간 컬럼(1주~1년)이 대부분 "—"라 미완성으로 보임. 원인·수정:
1. **빈 컬럼** — 기간 수익률은 yahoo 대형주 UNIVERSE만 있음. 기본 정렬이 '1일'이라 **오늘 급등 소형주(데이터 없음)가 맨 위** → "—". → **기본 정렬을 거래대금순**(KRX 원래 순서=대형주 우선=기간 데이터 참)으로.
2. **느린 첫인상** — KRX 콜드 로드(첫 요청)가 느림(이후 5분 캐시로 빠름). → **스켈레톤**으로 가림.

> 변경 1파일 4곳: `components/toolbox/MarketBoard.tsx`. 컴포넌트 → **새로고침이면 충분**.

---

## 📄 `components/toolbox/MarketBoard.tsx` — 4곳

### 1) 기본 정렬 = 거래대금('amount')
**찾기:**
```tsx
  const [sortKey, setSortKey] = useState<PeriodKey>('1d');
```
**바꾸기:**
```tsx
  const [sortKey, setSortKey] = useState<PeriodKey | 'amount'>('amount');
```

### 2) 정렬 로직 — 'amount'면 원래 순서(거래대금) 유지
**찾기:**
```tsx
  const sortField = PERIODS.find((p) => p.key === sortKey)!.field;
  const sorted = useMemo(() => {
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

### 3) '#' 헤더 = 거래대금순 복귀 버튼
**찾기:**
```tsx
                  <th className="px-2 py-2.5 text-left font-medium">#</th>
```
**바꾸기:**
```tsx
                  <th className="px-2 py-2.5 text-left font-medium">
                    <button type="button" onClick={() => { setSortKey('amount'); setSortDir('desc'); }} title="거래대금순" className={`hover:text-unjong-primary ${sortKey === 'amount' ? 'font-bold text-unjong-accent' : ''}`}>#</button>
                  </th>
```

### 4) 로딩 → 스켈레톤 펄스바
**찾기:**
```tsx
          {loading ? (
            <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>
          ) : sorted.length === 0 ? (
```
**바꾸기:**
```tsx
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트 → 새로고침):
1. 홈 첫 화면(종목·상품) → 로딩 중 **회색 펄스 스켈레톤**(텍스트 "불러오는 중…" 아님).
2. 로드되면 **거래대금 상위(삼성전자·SK하이닉스 등)** 가 위로 → 기간 컬럼(1주~1년)이 **숫자로 차 있음**(빈칸 거의 없음). '#' 헤더 민트색 강조.
3. '1일' 등 기간 헤더 클릭 → 그 기준 정렬(기존대로). '#' 다시 누르면 거래대금순 복귀.

> 참고: 소형주는 yahoo 기간데이터가 없어 일부 "—"는 남음(정상). 핵심은 **첫 화면이 대형주+데이터로 꽉 차 보이는 것**.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/MarketBoard.tsx && git commit -m "fix(market): 종목·상품 기본 거래대금순(데이터 풍부) + 스켈레톤 로딩 (STEP 368)" && git push
```

---

> **한 줄 요약**: 종목·상품 기본 정렬을 거래대금순(대형주=기간데이터 참)으로 + 스켈레톤 로딩. 랜딩 빈컬럼·느린 첫인상 해소. 컴포넌트라 새로고침.
