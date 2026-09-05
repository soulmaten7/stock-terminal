<!-- 2026-06-28 -->
# STEP 447 — 정렬 컬럼헤더 통합 + 리스트 아이콘 정리(별만)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_447_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **정렬을 컬럼 헤더에 통합** — 별도 정렬탭(관심순/가나다↑↓) 제거 → **등록업체명·채널명 헤더 클릭 = ↑↓ 정렬**, **관심은 ⭐ 헤더**.
2. **리스트 행 아이콘 정리** — 신고·바로가기 아이콘 제거, **즐겨찾기(⭐)만** 남김. (신고·바로가기는 미리보기에 있음.)

## 전제
- 최신 main + STEP 446. 파일 2개: `components/toolbox/AdvisorDirectory.tsx` + `app/api/advisors/route.ts`(**재시작**).

---

## (1) `components/toolbox/AdvisorDirectory.tsx` — 6곳

### (1-a) SortKey 교체 + SORTS 상수 제거
**찾기:**
```tsx
type SortKey = 'interest' | 'name_asc' | 'name_desc';
const SORTS: { key: SortKey; label: string; dir?: 'up' | 'down' }[] = [
  { key: 'interest', label: '관심순' },
  { key: 'name_asc', label: '가나다', dir: 'up' },
  { key: 'name_desc', label: '가나다', dir: 'down' },
];
```
**바꾸기:**
```tsx
type SortKey = 'interest' | 'company_asc' | 'company_desc' | 'channel_asc' | 'channel_desc';
```

### (1-b) 정렬 토글·화살표 헬퍼 (return 직전)
**찾기:**
```tsx
  return (
    <section className="min-w-0">
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
```
**바꾸기:**
```tsx
  const sortToggle = (col: 'company' | 'channel') => {
    setSort((prev) => (prev === `${col}_asc` ? `${col}_desc` : `${col}_asc`) as SortKey);
    setPage(1);
  };
  const sortArrow = (col: 'company' | 'channel') =>
    sort === `${col}_asc` ? <ArrowUp size={11} /> : sort === `${col}_desc` ? <ArrowDown size={11} /> : <ArrowUp size={11} className="opacity-20" />;

  return (
    <section className="min-w-0">
      <p className="mb-3 rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-[11px] leading-relaxed text-unjong-muted">
```

### (1-c) 정렬탭 렌더 제거
**찾기:**
```tsx
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex gap-1">
              {SORTS.map(({ key, label, dir }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSort(key)}
                  className={`flex shrink-0 items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    sort === key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                  }`}
                >
                  {label}
                  {dir === 'up' ? <ArrowUp size={12} /> : dir === 'down' ? <ArrowDown size={12} /> : null}
                </button>
              ))}
            </div>
            {/* 모바일 전용(미리보기 칸 없음): 등록 버튼을 정렬 옆에 */}
```
**바꾸기:**
```tsx
          <div className="flex shrink-0 items-center gap-2">
            {/* 모바일 전용(미리보기 칸 없음): 등록 버튼 */}
```

### (1-d) 컬럼 헤더 → 클릭 정렬 (4.5rem 컬럼)
**찾기:**
```tsx
              <div className="grid grid-cols-[1.75rem_1.5fr_1fr_7rem] items-center gap-2 border-b border-l-2 border-l-transparent border-b-unjong-border px-2 py-1.5 text-[11px] font-medium text-unjong-muted">
                <span className="text-center">#</span>
                <span>등록업체명</span>
                <span>채널명</span>
                <span />
              </div>
```
**바꾸기:**
```tsx
              <div className="grid grid-cols-[1.75rem_1.5fr_1fr_4.5rem] items-center gap-2 border-b border-l-2 border-l-transparent border-b-unjong-border px-2 py-1.5 text-[11px] font-medium text-unjong-muted">
                <span className="text-center">#</span>
                <button type="button" onClick={() => sortToggle('company')} className={`flex items-center gap-0.5 ${sort.startsWith('company') ? 'text-unjong-primary' : 'hover:text-unjong-primary'}`}>등록업체명 {sortArrow('company')}</button>
                <button type="button" onClick={() => sortToggle('channel')} className={`flex items-center gap-0.5 ${sort.startsWith('channel') ? 'text-unjong-primary' : 'hover:text-unjong-primary'}`}>채널명 {sortArrow('channel')}</button>
                <button type="button" onClick={() => { setSort('interest'); setPage(1); }} className={`flex items-center justify-end gap-0.5 ${sort === 'interest' ? 'text-unjong-accent' : 'hover:text-unjong-primary'}`}>관심 <Star size={11} fill={sort === 'interest' ? 'currentColor' : 'none'} /></button>
              </div>
```

### (1-e) `<li>` 그리드 액션 컬럼 7rem → 4.5rem
**찾기:**
```tsx
                    className={`group grid grid-cols-[1.75rem_1.5fr_1fr_7rem] items-center gap-2 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
```
**바꾸기:**
```tsx
                    className={`group grid grid-cols-[1.75rem_1.5fr_1fr_4.5rem] items-center gap-2 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
```

### (1-f) 리스트 행 액션 — 신고·바로가기 제거(별만)
**찾기:**
```tsx
                    <span className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFav(a)}
                        aria-label={favs.has(a.biz_no) ? '즐겨찾기 해제' : '즐겨찾기'}
                        title="관심(즐겨찾기)"
                        className={`flex shrink-0 items-center gap-0.5 text-xs tabular-nums transition-colors ${favs.has(a.biz_no) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={favs.has(a.biz_no) ? 'currentColor' : 'none'} />
                        {a.favorite_count > 0 ? <span>{a.favorite_count}</span> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => openReport(a)}
                        title="신고하기"
                        aria-label="신고하기"
                        className="flex shrink-0 items-center gap-0.5 text-xs text-unjong-muted hover:text-red-500"
                      >
                        <Siren size={13} /> {a.report_count > 0 ? a.report_count : ''}
                      </button>
                      {a.homepage ? (
                        <a
                          href={a.homepage}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          title="바로가기"
                          className="flex shrink-0 items-center rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-unjong-accent hover:text-unjong-accent"
                        >
                          <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </span>
```
**바꾸기:**
```tsx
                    <span className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFav(a)}
                        aria-label={favs.has(a.biz_no) ? '즐겨찾기 해제' : '즐겨찾기'}
                        title="관심(즐겨찾기)"
                        className={`flex shrink-0 items-center gap-0.5 text-xs tabular-nums transition-colors ${favs.has(a.biz_no) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={favs.has(a.biz_no) ? 'currentColor' : 'none'} />
                        {a.favorite_count > 0 ? <span>{a.favorite_count}</span> : null}
                      </button>
                    </span>
```

---

## (2) `app/api/advisors/route.ts` — 정렬 키 처리

### (2-a) sort 파싱
**찾기:**
```ts
  const sortParam = sp.get("sort");
  const sort = sortParam === "name_desc" ? "name_desc" : sortParam === "interest" ? "interest" : "name_asc";
```
**바꾸기:**
```ts
  const sortParam = sp.get("sort") ?? "";
  const sort = ["interest", "company_asc", "company_desc", "channel_asc", "channel_desc"].includes(sortParam) ? sortParam : "interest";
```

### (2-b) order 로직
**찾기:**
```ts
  if (sort === "interest") {
    query = query.order("favorite_count", { ascending: false }).order("company_name", { ascending: true });
  } else {
    query = query.order("company_name", { ascending: sort === "name_asc" });
  }
```
**바꾸기:**
```ts
  if (sort === "interest") {
    query = query.order("favorite_count", { ascending: false }).order("company_name", { ascending: true });
  } else if (sort === "channel_asc" || sort === "channel_desc") {
    query = query.order("info_name", { ascending: sort === "channel_asc", nullsFirst: false }).order("company_name", { ascending: true });
  } else {
    query = query.order("company_name", { ascending: sort === "company_asc" });
  }
```

---

## 클린 재시작 (API 라우트 변경)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

## 확인 (localhost)
- 정렬탭(관심순/가나다↑↓) 사라지고 → **컬럼 헤더 클릭으로 정렬**:
  - "등록업체명" 클릭 → 가나다 ↑, 다시 클릭 → ↓ (화살표 표시)
  - "채널명" 클릭 → 채널명(금감원 영업명) 기준 ↑↓
  - "관심 ⭐" 클릭 → 관심순(즐겨찾기 누적)
- 리스트 행: **별(⭐)만** 남고 신고·바로가기 아이콘 사라짐. (신고·바로가기는 미리보기 카드에 그대로.)
- 빌드 에러 없음(SORTS 제거, Siren/ExternalLink/openReport는 미리보기에서 계속 사용).

## 참고
- 채널명 정렬은 금감원 `info_name` 기준(없는 곳은 뒤로). OG 폴백 채널명까지 정렬엔 미반영 — 표시는 OG 폴백, 정렬은 금감원 필드.

## 빌드·커밋
- 보류. 확인 후 STEP 444~447 묶어 커밋. push·배포는 사용자 지시 시.
