<!-- 2026-06-23 -->
# STEP 360 — [정렬] 관심(즐겨찾기 누적)순 + 가나다 화살표 아이콘

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_360_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
리딩방 정렬을 **관심순(전체 누적 즐겨찾기 수) · 가나다↑ · 가나다↓**로. 기본=관심순.
- 관심순 = 모든 사용자의 즐겨찾기 합산(카운트만 노출, 누가 했는지 비공개).
- 각 행에 관심 수 표시(0이면 숨김). 안전 보증 아님 문구는 유지.

> **DB는 이미 완료** (Cowork이 MCP로 `advisor_directory` 뷰에 `favorite_count` 추가).
> 변경: `app/api/advisors/route.ts`(3곳) + `components/toolbox/AdvisorDirectory.tsx`(7곳).
> ⚠️ **API 라우트 수정 → dev 서버 클린 재시작 필수.**

---

## 📄 1) `app/api/advisors/route.ts` — 3곳

### 1-1) favorite_count 조회 추가
**찾기:**
```ts
    .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, like_count, report_count, platform, source, intro", { count: "exact" });
```
**바꾸기:**
```ts
    .select("biz_no, company_name, info_name, representative, valid_from, valid_to, homepage, phone, address, like_count, report_count, favorite_count, platform, source, intro", { count: "exact" });
```

### 1-2) sort 파라미터 (popular → interest)
**찾기:**
```ts
  const sort = sortParam === "name_desc" ? "name_desc" : sortParam === "popular" ? "popular" : "name_asc";
```
**바꾸기:**
```ts
  const sort = sortParam === "name_desc" ? "name_desc" : sortParam === "interest" ? "interest" : "name_asc";
```

### 1-3) 정렬 기준
**찾기:**
```ts
  if (sort === "popular") {
    query = query.order("like_count", { ascending: false }).order("company_name", { ascending: true });
  } else {
    query = query.order("company_name", { ascending: sort === "name_asc" });
  }
```
**바꾸기:**
```ts
  if (sort === "interest") {
    query = query.order("favorite_count", { ascending: false }).order("company_name", { ascending: true });
  } else {
    query = query.order("company_name", { ascending: sort === "name_asc" });
  }
```

---

## 📄 2) `components/toolbox/AdvisorDirectory.tsx` — 7곳

### 2-1) 아이콘 import (ArrowUp·ArrowDown)
**찾기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, Globe } from 'lucide-react';
```
**바꾸기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, Globe, ArrowUp, ArrowDown } from 'lucide-react';
```

### 2-2) 타입에 favorite_count
**찾기:**
```tsx
  address: string | null;
  report_count: number;
  platform: string;
  source: string;
  intro: string | null;
};
```
**바꾸기:**
```tsx
  address: string | null;
  report_count: number;
  favorite_count: number;
  platform: string;
  source: string;
  intro: string | null;
};
```

### 2-3) SORTS·SortKey 재구성 (관심순 추가 + 화살표)
**찾기:**
```tsx
const SORTS = [['name_asc', '가나다 오름차순'], ['name_desc', '가나다 내림차순']] as const;
type PlatformKey = 'all' | 'telegram' | 'kakao' | 'naver' | 'etc';
type SortKey = 'name_asc' | 'name_desc';
```
**바꾸기:**
```tsx
type PlatformKey = 'all' | 'telegram' | 'kakao' | 'naver' | 'etc';
type SortKey = 'interest' | 'name_asc' | 'name_desc';
const SORTS: { key: SortKey; label: string; dir?: 'up' | 'down' }[] = [
  { key: 'interest', label: '관심순' },
  { key: 'name_asc', label: '가나다', dir: 'up' },
  { key: 'name_desc', label: '가나다', dir: 'down' },
];
```

### 2-4) 기본 정렬 = 관심순
**찾기:**
```tsx
  const [sort, setSort] = useState<SortKey>('name_asc');
```
**바꾸기:**
```tsx
  const [sort, setSort] = useState<SortKey>('interest');
```

### 2-5) 정렬탭 렌더 (객체 구조 + 화살표 아이콘)
**찾기:**
```tsx
              {SORTS.map(([s, label]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    sort === s ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                  }`}
                >
                  {label}
                </button>
              ))}
```
**바꾸기:**
```tsx
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
```

### 2-6) toggleFav — 관심 수 낙관적 ±1
**찾기:**
```tsx
  async function toggleFav(a: Advisor) {
    if (!isLoggedIn) { setLoginNotice(true); return; }
    const isFav = favs.has(a.biz_no);
    setFavs((prev) => { const n = new Set(prev); if (isFav) n.delete(a.biz_no); else n.add(a.biz_no); return n; });
    try {
      await fetch('/api/rooms/favorite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_no: a.biz_no, favorite: !isFav }),
      });
    } catch {
      setFavs((prev) => { const n = new Set(prev); if (isFav) n.add(a.biz_no); else n.delete(a.biz_no); return n; });
    }
  }
```
**바꾸기:**
```tsx
  async function toggleFav(a: Advisor) {
    if (!isLoggedIn) { setLoginNotice(true); return; }
    const isFav = favs.has(a.biz_no);
    const delta = isFav ? -1 : 1;
    setFavs((prev) => { const n = new Set(prev); if (isFav) n.delete(a.biz_no); else n.add(a.biz_no); return n; });
    setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, favorite_count: Math.max(0, x.favorite_count + delta) } : x));
    setSelected((s) => (s && s.biz_no === a.biz_no ? { ...s, favorite_count: Math.max(0, s.favorite_count + delta) } : s));
    try {
      await fetch('/api/rooms/favorite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_no: a.biz_no, favorite: !isFav }),
      });
    } catch {
      setFavs((prev) => { const n = new Set(prev); if (isFav) n.add(a.biz_no); else n.delete(a.biz_no); return n; });
      setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, favorite_count: Math.max(0, x.favorite_count - delta) } : x));
      setSelected((s) => (s && s.biz_no === a.biz_no ? { ...s, favorite_count: Math.max(0, s.favorite_count - delta) } : s));
    }
  }
```

### 2-7) 리스트 행: 즐겨찾기 별 옆에 관심 수
**찾기:**
```tsx
                    <button
                      type="button"
                      onClick={() => toggleFav(a)}
                      aria-label={favs.has(a.biz_no) ? '즐겨찾기 해제' : '즐겨찾기'}
                      title="즐겨찾기"
                      className={`shrink-0 transition-colors ${favs.has(a.biz_no) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                    >
                      <Star size={14} fill={favs.has(a.biz_no) ? 'currentColor' : 'none'} />
                    </button>
```
**바꾸기:**
```tsx
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
```

---

## ✅ 검증 (라우트 수정 → 클린 재시작 필수)
```bash
npm run build
```
빌드 무에러.

dev 서버 **클린 재시작**:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저(로그인):
1. 리딩방·검증 탭 → 정렬탭 = **관심순 · 가나다↑ · 가나다↓**, 기본 선택 = 관심순.
2. 아무 리딩방 별(즐겨찾기) 누르면 → 그 행 별 옆 숫자 +1, 해제 시 -1.
3. 다른 탭 갔다 돌아오거나 새로고침 → 관심순이면 즐겨찾기 많은 곳이 위로.
4. 관심 수 0이면 숫자 숨김(별만).

> 참고: 관심순은 '인기 참고용'이지 안전·수익 보증 아님(기존 상단 문구 유지).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/advisors/route.ts components/toolbox/AdvisorDirectory.tsx && git commit -m "feat(sort): 관심(즐겨찾기 누적)순 정렬 + 가나다 화살표 아이콘 (STEP 360)" && git push
```

---

> **한 줄 요약**: 리딩방 정렬 = 관심(누적 즐겨찾기)순 기본 + 가나다↑↓. 뷰 favorite_count는 MCP로 완료. 라우트 수정이라 **클린 재시작 필수**.
