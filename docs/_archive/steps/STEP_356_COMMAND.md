<!-- 2026-06-23 -->
# STEP 356 — [MVP 2.0] 리딩방 별점·리뷰 시스템 (즉시공개 + 종합별점 1개)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_356_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
리딩방(AdvisorDirectory)에 **별점(1~5) + 후기** 추가. 트러스트파일럿 금융판의 핵심 차별화.
- **모더레이션**: 즉시 공개 + 사후관리(관리자 숨김). 별점은 **종합 1개**.
- **위치**: ① 리스트 행에 평균별점 배지 / ② 미리보기 상단 평균 / ③ 리뷰 작성 / ④ 리뷰 목록 (②③④는 미리보기=PC 우측·폰 하단시트 안).

> **DB는 이미 생성 완료** (Cowork이 Supabase MCP로 `room_reviews` 테이블 + RLS 적용함). 이 STEP은 **앱 코드만** 만든다.
> 변경: 신규 2 라우트 + 신규 1 컴포넌트 + `AdvisorDirectory.tsx` 편집.
> ⚠️ **새 API 라우트라 dev 서버는 클린 재시작 필수** (Turbopack 라우트 캐시).

---

## 📄 1) 신규 파일 `app/api/reviews/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewRow = { id: number; user_id: string; nickname: string | null; rating: number; content: string | null; created_at: string };

// 리뷰 목록 + 평균 + 내가 쓴 것
export async function GET(req: NextRequest) {
  const target_id = (req.nextUrl.searchParams.get("target_id") ?? "").trim().slice(0, 100);
  if (!target_id) return NextResponse.json({ error: "target_id 필요" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("room_reviews")
    .select("id, user_id, nickname, rating, content, created_at")
    .eq("target_id", target_id)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as ReviewRow[];
  const count = rows.length;
  const avg = count ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const mineRow = user ? rows.find((r) => r.user_id === user.id) ?? null : null;

  const reviews = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    content: r.content,
    created_at: r.created_at,
    nickname: r.nickname || "익명",
    mine: !!user && r.user_id === user.id,
  }));

  return NextResponse.json({
    reviews,
    avg,
    count,
    mine: mineRow ? { id: mineRow.id, rating: mineRow.rating, content: mineRow.content } : null,
  });
}

// 리뷰 작성/수정 (1인 1리딩방 = upsert)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: { target_id?: string; target_type?: string; rating?: number; content?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }

  const target_id = String(body.target_id ?? "").trim().slice(0, 100);
  const target_type = String(body.target_type ?? "fss_advisor").trim().slice(0, 40);
  const rating = Math.round(Number(body.rating));
  const content = String(body.content ?? "").trim().slice(0, 2000) || null;
  if (!target_id) return NextResponse.json({ error: "target_id 필요" }, { status: 400 });
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "별점은 1~5" }, { status: 400 });

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nickname =
    (typeof meta.nickname === "string" && meta.nickname) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (user.email ? user.email.split("@")[0] : null);

  const { error } = await supabase
    .from("room_reviews")
    .upsert(
      { target_id, target_type, user_id: user.id, nickname, rating, content, updated_at: new Date().toISOString() },
      { onConflict: "user_id,target_id" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: all } = await supabase
    .from("room_reviews")
    .select("rating")
    .eq("target_id", target_id)
    .eq("status", "visible");
  const ratings = (all ?? []).map((r: { rating: number }) => r.rating);
  const count = ratings.length;
  const avg = count ? Math.round((ratings.reduce((s, x) => s + x, 0) / count) * 10) / 10 : 0;

  return NextResponse.json({ ok: true, avg, count });
}

// 내 리뷰 삭제
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: { id?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const { error } = await supabase.from("room_reviews").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## 📄 2) 신규 파일 `app/api/reviews/summary/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 여러 리딩방의 평균별점·리뷰수를 한 번에 (리스트 배지용)
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("ids") ?? "").trim();
  if (!raw) return NextResponse.json({ summary: {} });
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 200);
  if (ids.length === 0) return NextResponse.json({ summary: {} });

  const supabase = await createClient();
  const { data } = await supabase
    .from("room_reviews")
    .select("target_id, rating")
    .in("target_id", ids)
    .eq("status", "visible");

  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of (data ?? []) as { target_id: string; rating: number }[]) {
    (acc[r.target_id] ??= { sum: 0, count: 0 });
    acc[r.target_id].sum += r.rating;
    acc[r.target_id].count += 1;
  }
  const summary: Record<string, { avg: number; count: number }> = {};
  for (const [k, v] of Object.entries(acc)) {
    summary[k] = { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count };
  }
  return NextResponse.json({ summary });
}
```

---

## 📄 3) 신규 파일 `components/toolbox/RoomReviews.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';

type Review = { id: number; rating: number; content: string | null; created_at: string; nickname: string; mine: boolean };
type Mine = { id: number; rating: number; content: string | null } | null;

function timeAgo(s: string): string {
  const t = new Date(s).getTime();
  if (!t) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Stars({ value, onPick, size = 14 }: { value: number; onPick?: (n: number) => void; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          className={onPick ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n}점`}
        >
          <Star size={size} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-unjong-border'} />
        </button>
      ))}
    </span>
  );
}

export default function RoomReviews({ bizNo, isLoggedIn, onRequireLogin }: { bizNo: string; isLoggedIn: boolean; onRequireLogin: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [mine, setMine] = useState<Mine>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const j = await (await fetch(`/api/reviews?target_id=${encodeURIComponent(bizNo)}`)).json();
      setReviews(j.reviews ?? []);
      setAvg(j.avg ?? 0);
      setCount(j.count ?? 0);
      setMine(j.mine ?? null);
      if (j.mine) { setRating(j.mine.rating); setContent(j.mine.content ?? ''); }
      else { setRating(0); setContent(''); }
    } catch {
      setReviews([]); setAvg(0); setCount(0); setMine(null);
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setOpen(false); load(); }, [bizNo]);

  async function submit() {
    if (!isLoggedIn) { onRequireLogin(); return; }
    if (!(rating >= 1 && rating <= 5)) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: bizNo, target_type: 'fss_advisor', rating, content }),
      });
      if (!r.ok) throw new Error();
      setOpen(false);
      await load();
    } catch {
      onRequireLogin();
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!mine) return;
    setSubmitting(true);
    try {
      await fetch('/api/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: mine.id }) });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border-t border-unjong-border pt-3">
      {/* 평균 (②) */}
      <div className="mb-2 flex items-center gap-2">
        <Stars value={Math.round(avg)} />
        <span className="text-sm font-bold text-unjong-primary">{avg ? avg.toFixed(1) : '-'}</span>
        <span className="text-xs text-unjong-muted">· 리뷰 {count}</span>
        {!open ? (
          <button type="button" onClick={() => { if (!isLoggedIn) { onRequireLogin(); return; } setOpen(true); }} className="ml-auto text-xs font-semibold text-unjong-accent">
            {mine ? '내 리뷰 수정' : '리뷰 쓰기'}
          </button>
        ) : null}
      </div>

      {/* 작성 (③) */}
      {open ? (
        <div className="mb-3 rounded-lg border border-unjong-border p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <Stars value={rating} onPick={setRating} size={18} />
            <span className="text-xs text-unjong-muted">{rating ? `${rating}점` : '별점 선택'}</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="경험을 남겨주세요 (선택)"
            className="w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-2.5 py-2 text-xs text-unjong-primary outline-none focus:border-unjong-accent"
          />
          <div className="mt-2 flex items-center gap-2">
            {mine ? (
              <button type="button" onClick={remove} disabled={submitting} className="mr-auto flex items-center gap-1 text-xs text-unjong-muted hover:text-red-500">
                <Trash2 size={13} /> 삭제
              </button>
            ) : null}
            <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-lg border border-unjong-border px-3 py-1.5 text-xs font-medium text-unjong-muted hover:bg-unjong-background">취소</button>
            <button type="button" onClick={submit} disabled={!rating || submitting} className="rounded-lg bg-unjong-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{submitting ? '저장 중…' : '등록'}</button>
          </div>
        </div>
      ) : null}

      {/* 목록 (④) */}
      {loading ? (
        <p className="py-3 text-center text-xs text-unjong-muted">리뷰 불러오는 중…</p>
      ) : reviews.length === 0 ? (
        <p className="py-3 text-center text-xs text-unjong-muted">아직 리뷰가 없어요. 첫 리뷰를 남겨보세요.</p>
      ) : (
        <ul className="space-y-2">
          {reviews.map((rv) => (
            <li key={rv.id} className="border-t border-unjong-border pt-2 first:border-0 first:pt-0">
              <div className="flex items-center gap-1.5">
                <Stars value={rv.rating} size={12} />
                <span className="text-xs font-semibold text-unjong-primary">{rv.nickname}{rv.mine ? ' (나)' : ''}</span>
                <span className="ml-auto text-[11px] text-unjong-muted">{timeAgo(rv.created_at)}</span>
              </div>
              {rv.content ? <p className="mt-1 text-xs leading-relaxed text-unjong-muted">{rv.content}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 📄 4) `components/toolbox/AdvisorDirectory.tsx` — 6곳 편집

### 4-1) import 추가
**찾기:**
```tsx
import SelectDropdown from './SelectDropdown';
```
**바꾸기:**
```tsx
import SelectDropdown from './SelectDropdown';
import RoomReviews from './RoomReviews';
```

### 4-2) PreviewBody 시그니처 + 리뷰 렌더
**찾기:**
```tsx
function PreviewBody({ a, onLike, onReport }: { a: Advisor; onLike: () => void; onReport: () => void }) {
```
**바꾸기:**
```tsx
function PreviewBody({ a, onLike, onReport, isLoggedIn, onRequireLogin }: { a: Advisor; onLike: () => void; onReport: () => void; isLoggedIn: boolean; onRequireLogin: () => void }) {
```

**찾기:** (PreviewBody 맨 끝 — 바로가기 버튼 직후 닫는 부분)
```tsx
      {a.homepage ? (
        <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
          바로가기 <ExternalLink size={13} />
        </a>
      ) : null}
    </div>
  );
}
```
**바꾸기:**
```tsx
      {a.homepage ? (
        <a href={a.homepage} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white">
          바로가기 <ExternalLink size={13} />
        </a>
      ) : null}
      <RoomReviews bizNo={a.biz_no} isLoggedIn={isLoggedIn} onRequireLogin={onRequireLogin} />
    </div>
  );
}
```

### 4-3) summary 상태 추가
**찾기:**
```tsx
  const [favs, setFavs] = useState<Set<string>>(new Set());
```
**바꾸기:**
```tsx
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

### 4-4) 리스트 행에 평균별점 배지 (①)
**찾기:**
```tsx
                      <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{roomNameOf(a)}</span>
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" /> : null}
```
**바꾸기:**
```tsx
                      <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{roomNameOf(a)}</span>
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" /> : null}
                      {summary[a.biz_no]?.count ? (
                        <span className="ml-1 inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-amber-500">
                          <Star size={12} className="fill-amber-400 text-amber-400" /> {summary[a.biz_no]?.avg?.toFixed(1)}
                        </span>
                      ) : null}
```

### 4-5) PreviewBody 호출부 2곳에 props 전달 (데스크탑 + 모바일 — 동일 문자열이라 모두 교체)
**찾기:**
```tsx
              <PreviewBody a={selected} onLike={() => toggleLike(selected)} onReport={() => openReport(selected)} />
```
**바꾸기:**
```tsx
              <PreviewBody a={selected} onLike={() => toggleLike(selected)} onReport={() => openReport(selected)} isLoggedIn={isLoggedIn} onRequireLogin={() => setLoginNotice(true)} />
```
> 이 문자열은 파일에 2번 나옴(데스크탑 aside + 모바일 하단시트). **둘 다 똑같이 교체**.

---

## ✅ 검증 (새 API 라우트 → 클린 재시작 필수)
```bash
npm run build
```
빌드 무에러 확인.

dev 서버 **반드시 클린 재시작**:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저(로그인 상태):
1. 리딩방·검증 탭 → 아무 리딩방 클릭 → 미리보기 하단에 **평균별점 + 리뷰 쓰기 + 목록** 보임.
2. 별점 선택 + 후기 작성 → 등록 → 목록에 바로 뜨고 평균 갱신.
3. 리스트 행 이름 옆에 **⭐평균** 배지(리뷰 있는 곳만).
4. 새로고침해도 유지(즉시 공개). 비로그인 시 '리뷰 쓰기' 누르면 로그인 안내.
5. 폰 폭(하단시트)에서도 동일 동작.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/reviews components/toolbox/RoomReviews.tsx components/toolbox/AdvisorDirectory.tsx && git commit -m "feat(reviews): 리딩방 별점·후기 시스템 — 즉시공개+종합별점, 평균배지/작성/목록 (STEP 356)" && git push
```

---

> **한 줄 요약**: MVP 2.0 1차 — 리딩방 별점(1~5)+후기. DB(room_reviews)는 MCP로 생성 완료, 이 STEP은 API 2개+RoomReviews 컴포넌트+AdvisorDirectory 연결. 새 라우트라 **클린 재시작 필수**.
