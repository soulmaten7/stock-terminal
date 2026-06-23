<!-- 2026-06-23 -->
# STEP 359 — [정체성] 리뷰·좋아요 제거 → 관심(즐겨찾기)로 일원화

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_359_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
검증 불가능한 평가(별점·후기)는 "안 속는 곳" 정체성과 충돌 → 제거. 좋아요(♥)도 같은 '미검증 인기 신호'라 함께 제거하고 **관심=즐겨찾기 하나로 일원화**.
- 제거: 별점·후기·리뷰신고 + 관리자 리뷰섹션(STEP 356~358) + 좋아요(♥) + 추천순 정렬.
- 유지: 금감원 등록·신고(사실), 즐겨찾기(관심), 리딩방 신고 모달.

> **DB는 보존**(room_reviews·room_review_reports·room_likes 테이블 그대로 둠 — 되살리기 쉽게). 이 STEP은 앱 코드만 정리.
> 변경: 파일 5개 삭제 + `AdvisorDirectory.tsx`(7곳) + `app/admin/page.tsx`(4곳).
> ⚠️ **API 라우트 삭제 → dev 서버 클린 재시작 필수.**

---

## 🗑️ 1) 파일 삭제
```bash
cd ~/stock-terminal
rm -rf app/api/reviews app/api/admin/reviews
rm -f components/toolbox/RoomReviews.tsx components/admin/AdminReviews.tsx
```

---

## 📄 2) `components/toolbox/AdvisorDirectory.tsx` — 7곳

### A) import (Heart·RoomReviews 제거)
**찾기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Heart, Star, Globe } from 'lucide-react';
import RoomSubmitModal from './RoomSubmitModal';
import SelectDropdown from './SelectDropdown';
import RoomReviews from './RoomReviews';
```
**바꾸기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, Globe } from 'lucide-react';
import RoomSubmitModal from './RoomSubmitModal';
import SelectDropdown from './SelectDropdown';
```

### B) 타입에서 like 필드 제거
**찾기:**
```tsx
  address: string | null;
  like_count: number;
  report_count: number;
  platform: string;
  source: string;
  intro: string | null;
  liked: boolean;
};
```
**바꾸기:**
```tsx
  address: string | null;
  report_count: number;
  platform: string;
  source: string;
  intro: string | null;
};
```

### C) 추천순 정렬 제거
**찾기:**
```tsx
const SORTS = [['name_asc', '가나다 오름차순'], ['name_desc', '가나다 내림차순'], ['popular', '추천순']] as const;
type PlatformKey = 'all' | 'telegram' | 'kakao' | 'naver' | 'etc';
type SortKey = 'name_asc' | 'name_desc' | 'popular';
```
**바꾸기:**
```tsx
const SORTS = [['name_asc', '가나다 오름차순'], ['name_desc', '가나다 내림차순']] as const;
type PlatformKey = 'all' | 'telegram' | 'kakao' | 'naver' | 'etc';
type SortKey = 'name_asc' | 'name_desc';
```

### D) PreviewBody 시그니처 (onLike·리뷰 props 제거)
**찾기:**
```tsx
function PreviewBody({ a, onLike, onReport, isLoggedIn, onRequireLogin }: { a: Advisor; onLike: () => void; onReport: () => void; isLoggedIn: boolean; onRequireLogin: () => void }) {
```
**바꾸기:**
```tsx
function PreviewBody({ a, onReport }: { a: Advisor; onReport: () => void }) {
```

### E) PreviewBody 안: ♥ 버튼 + RoomReviews 제거
**찾기:**
```tsx
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button type="button" onClick={onLike} className={`flex items-center gap-1 ${a.liked ? 'text-red-500' : 'text-unjong-muted hover:text-red-500'}`}>
          <Heart size={13} className={a.liked ? 'fill-red-500' : ''} /> {a.like_count}
        </button>
        <button type="button" onClick={onReport} className="flex items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> 신고 {a.report_count}
        </button>
      </div>
      {a.homepage ? (
        <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
          바로가기 <ExternalLink size={13} />
        </a>
      ) : null}
      <RoomReviews bizNo={a.biz_no} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
    </div>
```
**바꾸기:**
```tsx
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button type="button" onClick={onReport} className="flex items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> 신고 {a.report_count}
        </button>
      </div>
      {a.homepage ? (
        <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
          바로가기 <ExternalLink size={13} />
        </a>
      ) : null}
    </div>
```

### F) toggleLike 함수 + 리뷰 summary state/effect 제거 (한 덩어리)
**찾기:**
```tsx
  async function toggleLike(a: Advisor) {
    if (!isLoggedIn) { setLoginNotice(true); return; }
    const wasLiked = a.liked;
    const apply = (liked: boolean, delta: number) => {
      setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, liked, like_count: x.like_count + delta } : x));
      setSelected((s) => (s && s.biz_no === a.biz_no ? { ...s, liked, like_count: s.like_count + delta } : s));
    };
    apply(!wasLiked, wasLiked ? -1 : 1);
    try {
      const r = await fetch('/api/likes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: a.biz_no, target_type: 'fss_advisor' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'fail');
      setResults((prev) => prev.map((x) => x.biz_no === a.biz_no ? { ...x, liked: j.liked, like_count: j.count } : x));
      setSelected((s) => (s && s.biz_no === a.biz_no ? { ...s, liked: j.liked, like_count: j.count } : s));
    } catch {
      apply(wasLiked, wasLiked ? 1 : -1);
      setLoginNotice(true);
    }
  }

  const [summary, setSummary] = useState<Record<string, { avg: number; count: number }>>({});
  useEffect(() => {
    const ids = results.map((r) => r.biz_no).filter(Boolean);
    if (ids.length === 0) { setSummary({}); return; }
    let cancelled = false;
    fetch(`/api/reviews/summary?ids=${encodeURIComponent(ids.join(','))}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setSummary(j.summary ?? {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [results]);

  const [favs, setFavs] = useState<Set<string>>(new Set());
```
**바꾸기:**
```tsx
  const [favs, setFavs] = useState<Set<string>>(new Set());
```

### G) 리스트 행: ⭐배지 + ♥버튼 제거
**찾기:**
```tsx
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" /> : null}
                      {summary[a.biz_no]?.count ? (
                        <span className="ml-1 inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-amber-500">
                          <Star size={12} className="fill-amber-400 text-amber-400" /> {summary[a.biz_no]?.avg?.toFixed(1)}
                        </span>
                      ) : null}
                    </button>
```
**바꾸기:**
```tsx
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" /> : null}
                    </button>
```

**찾기:**
```tsx
                    <button
                      type="button"
                      onClick={() => toggleLike(a)}
                      aria-label="좋아요"
                      className={`flex shrink-0 items-center gap-0.5 text-xs ${a.liked ? 'text-red-500' : 'text-unjong-muted hover:text-red-500'}`}
                    >
                      <Heart size={13} className={a.liked ? 'fill-red-500' : ''} /> {a.like_count}
                    </button>
                    <button
                      type="button"
                      onClick={() => openReport(a)}
```
**바꾸기:**
```tsx
                    <button
                      type="button"
                      onClick={() => openReport(a)}
```

### H) PreviewBody 호출부 2곳 (replace all — onLike·리뷰 props 제거)
**찾기:** (이 문자열을 **2곳 모두** 교체)
```tsx
<PreviewBody a={selected} onLike={() => toggleLike(selected)} onReport={() => openReport(selected)} isLoggedIn={isLoggedIn} onRequireLogin={() => setLoginNotice(true)} />
```
**바꾸기:**
```tsx
<PreviewBody a={selected} onReport={() => openReport(selected)} />
```

---

## 📄 3) `app/admin/page.tsx` — 4곳 (리뷰 섹션 제거)

### 3-1) import
**찾기:**
```tsx
import AdminReports from '@/components/admin/AdminReports';
import AdminReviews from '@/components/admin/AdminReviews';
```
**바꾸기:**
```tsx
import AdminReports from '@/components/admin/AdminReports';
```

### 3-2) Review 타입
**찾기:**
```tsx
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };
type Review = { id: number; target_id: string; nickname: string | null; rating: number; content: string | null; status: string; report_count: number; created_at: string };
```
**바꾸기:**
```tsx
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };
```

### 3-3) 리뷰 조회
**찾기:**
```tsx
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(300);
  const { data: reviewsData } = await admin.from('room_reviews').select('id, target_id, nickname, rating, content, status, report_count, created_at').order('report_count', { ascending: false }).order('created_at', { ascending: false }).limit(300);
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];
  const reviews = (reviewsData ?? []) as Review[];
```
**바꾸기:**
```tsx
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(300);
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];
```

### 3-4) ⭐리뷰 섹션 제거
**찾기:**
```tsx
      {/* 리뷰 관리 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">⭐ 리뷰 ({reviews.length}) · 신고순</h2>
        <AdminReviews initial={reviews} />
      </section>

      {/* 자가등록 */}
```
**바꾸기:**
```tsx
      {/* 자가등록 */}
```

---

## ✅ 검증 (라우트 삭제 → 클린 재시작 필수)
```bash
npm run build
```
빌드 무에러. (`/api/reviews*` 참조 0, `Heart`·`summary`·`toggleLike` 잔여 0)

dev 서버 **클린 재시작**:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
1. 리딩방·검증 탭 → 미리보기에 **별점·후기·♥ 없음**. 신고(리딩방)·즐겨찾기·바로가기만.
2. 리스트 행: ⭐배지·♥ 없음. 즐겨찾기(별)·신고만.
3. 정렬 탭: 가나다 오름/내림만(추천순 없음).
4. `/admin`: ⭐리뷰 섹션 없음(🚨신고·📝자가등록만).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add -A && git commit -m "refactor(trust): 미검증 평가(별점·후기·좋아요) 제거 → 관심(즐겨찾기) 일원화 (STEP 359)" && git push
```

---

> **한 줄 요약**: 검증 불가 평가(별점·후기·♥) 제거 → 즐겨찾기로 일원화. DB는 dormant 보존. 다음: 관심(즐겨찾기)순 정렬 + 사실(등록·신고) 우선.
