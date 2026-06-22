<!-- 2026-06-22 -->
# STEP 349 — [기능] 리딩방·검증 즐겨찾기(⭐) + 즐겨찾기 페이지 합류

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_349_COMMAND.md 파일 내용대로 실행해줘
```

- **DB**: `room_favorites`(user_id·biz_no·position·created_at, RLS 본인 행만) 테이블은 **Supabase MCP로 이미 생성 완료**(운종 ref). STEP엔 DB 작업 없음.

---

## 🎯 목표
리딩방·검증 리스트 각 행에 **즐겨찾기(⭐) 토글** 추가(좋아요와 별개, 개인 북마크, 키=`biz_no`) + **즐겨찾기 페이지에 "리딩방·검증" 섹션**(드래그 순서).

> 신규 2파일(rooms/favorite route·RoomFavoritesClient) + 수정 2파일(AdvisorDirectory·favorites page).

---

## 📄 파일 1 — `app/api/rooms/favorite/route.ts` (신규)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 리딩방 즐겨찾기 토글
export async function POST(req: NextRequest) {
  const { biz_no, favorite } = await req.json().catch(() => ({}));
  if (!biz_no || favorite === undefined) return NextResponse.json({ error: 'biz_no and favorite required' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (favorite) {
    await supabase.from('room_favorites').upsert({ user_id: user.id, biz_no }, { onConflict: 'user_id,biz_no' });
  } else {
    await supabase.from('room_favorites').delete().eq('user_id', user.id).eq('biz_no', biz_no);
  }
  return NextResponse.json({ ok: true, biz_no, favorite });
}

// 내 리딩방 즐겨찾기 목록 (커스텀 순서)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorites: [], auth: false });

  const { data: favs } = await supabase
    .from('room_favorites')
    .select('biz_no, position, created_at')
    .eq('user_id', user.id)
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  const bizNos = (favs ?? []).map((f: { biz_no: string }) => f.biz_no);
  if (bizNos.length === 0) return NextResponse.json({ favorites: [], auth: true });

  const { data: rooms } = await supabase
    .from('advisor_directory')
    .select('biz_no, company_name, info_name, homepage, platform')
    .in('biz_no', bizNos);

  type R = { biz_no: string; company_name: string; info_name: string | null; homepage: string | null; platform: string };
  const byBiz = new Map<string, R>((rooms ?? []).map((r: R) => [r.biz_no, r]));
  const favorites = bizNos
    .map((b: string) => byBiz.get(b))
    .filter((r): r is R => !!r)
    .map((r) => ({ biz_no: r.biz_no, name: (r.info_name && r.info_name.trim()) || r.company_name, homepage: r.homepage, platform: r.platform }));
  return NextResponse.json({ favorites, auth: true });
}

// 드래그 순서 저장 (order = biz_no 배열)
export async function PUT(req: NextRequest) {
  const { order } = await req.json().catch(() => ({}));
  if (!Array.isArray(order)) return NextResponse.json({ error: 'order array required' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await Promise.all(
    order.map((biz_no: string, i: number) =>
      supabase.from('room_favorites').update({ position: i }).eq('user_id', user.id).eq('biz_no', biz_no)
    )
  );
  return NextResponse.json({ ok: true });
}
```

---

## 📄 파일 2 — `components/toolbox/AdvisorDirectory.tsx` (3곳)

### 2-1 import에 Star 추가
**찾기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Heart, Globe } from 'lucide-react';
```
**바꾸기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Heart, Star, Globe } from 'lucide-react';
```

### 2-2 즐겨찾기 상태·로더·토글 추가 (toggleLike 함수 다음)
**찾기:**
```tsx
    } catch {
      apply(wasLiked, wasLiked ? 1 : -1);
      setLoginNotice(true);
    }
  }

  function openReport(a: Advisor) {
```
**바꾸기:**
```tsx
    } catch {
      apply(wasLiked, wasLiked ? 1 : -1);
      setLoginNotice(true);
    }
  }

  const [favs, setFavs] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!isLoggedIn) { setFavs(new Set()); return; }
    fetch('/api/rooms/favorite')
      .then((r) => r.json())
      .then((j) => setFavs(new Set((j.favorites ?? []).map((f: { biz_no: string }) => f.biz_no))))
      .catch(() => {});
  }, [isLoggedIn]);
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

  function openReport(a: Advisor) {
```

### 2-3 행에 ⭐ 버튼 추가 (좋아요 버튼 왼쪽)
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
```
**바꾸기:**
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
                    <button
                      type="button"
                      onClick={() => toggleLike(a)}
                      aria-label="좋아요"
                      className={`flex shrink-0 items-center gap-0.5 text-xs ${a.liked ? 'text-red-500' : 'text-unjong-muted hover:text-red-500'}`}
                    >
                      <Heart size={13} className={a.liked ? 'fill-red-500' : ''} /> {a.like_count}
                    </button>
```

---

## 📄 파일 3 — `components/favorites/RoomFavoritesClient.tsx` (신규)

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { GripVertical, X, ExternalLink, Globe } from 'lucide-react';

type RoomFav = { biz_no: string; name: string; homepage: string | null; platform: string };

function iconOf(p: string, homepage: string | null): string | null {
  const f = (d: string) => `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
  if (p === 'telegram') return f('telegram.org');
  if (p === 'kakao') return f('kakaocorp.com');
  if (p === 'naver') return f('naver.com');
  if (homepage) { try { return f(new URL(homepage).hostname); } catch { return null; } }
  return null;
}

export default function RoomFavoritesClient() {
  const [items, setItems] = useState<RoomFav[]>([]);
  const [loading, setLoading] = useState(true);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/rooms/favorite')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.favorites ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const persist = (next: RoomFav[]) => {
    fetch('/api/rooms/favorite', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((x) => x.biz_no) }),
    }).catch(() => {});
  };
  const onDragEnter = (i: number) => {
    const from = dragIdx.current;
    if (from === null || from === i) return;
    setItems((prev) => { const n = [...prev]; const [m] = n.splice(from, 1); n.splice(i, 0, m); dragIdx.current = i; return n; });
  };
  const onDragEnd = () => { dragIdx.current = null; persist(items); };
  const remove = (biz_no: string) => {
    setItems((prev) => prev.filter((x) => x.biz_no !== biz_no));
    fetch('/api/rooms/favorite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biz_no, favorite: false }),
    }).catch(() => {});
  };

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>;
  if (items.length === 0) {
    return <p className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center text-sm text-unjong-muted">리딩방·검증에서 ⭐를 누르면 여기 모여요.</p>;
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {items.map((f, i) => {
        const icon = iconOf(f.platform, f.homepage);
        return (
          <li
            key={f.biz_no}
            draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragEnter={() => onDragEnter(i)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={onDragEnd}
            className="group flex items-center gap-2 border-b border-unjong-border px-3 py-2.5 last:border-0 hover:bg-unjong-background"
          >
            <span className="cursor-grab text-unjong-border transition-colors group-hover:text-unjong-muted active:cursor-grabbing" aria-hidden>
              <GripVertical size={16} />
            </span>
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" draggable={false} className="h-5 w-5 shrink-0 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
            ) : <Globe size={16} className="shrink-0 text-unjong-muted" />}
            {f.homepage ? (
              <a href={f.homepage} target="_blank" rel="noopener noreferrer nofollow" draggable={false} className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{f.name}</span>
                <ExternalLink size={11} className="shrink-0 text-unjong-border" />
              </a>
            ) : (
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary">{f.name}</span>
            )}
            <button type="button" onClick={() => remove(f.biz_no)} aria-label="즐겨찾기 해제" className="shrink-0 text-unjong-border transition-colors hover:text-unjong-danger">
              <X size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

---

## 📄 파일 4 — `app/favorites/page.tsx` (전체 교체: 2섹션)

```tsx
import FavoritesClient from '@/components/favorites/FavoritesClient';
import RoomFavoritesClient from '@/components/favorites/RoomFavoritesClient';

export const metadata = { title: '즐겨찾기' };

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">⭐ 즐겨찾기</h1>
        <p className="mt-1 text-sm text-unjong-muted">별표한 링크·리딩방 모음 — 각 섹션에서 드래그로 순서를 바꿀 수 있어요.</p>
      </div>

      <section className="mb-7">
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">링크</h2>
        <FavoritesClient />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">리딩방·검증</h2>
        <RoomFavoritesClient />
      </section>
    </main>
  );
}
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ 신규 라우트 → dev 서버 완전 재시작
```bash
pkill -f "next dev" 2>/dev/null; cd ~/stock-terminal && rm -rf .next && npm run dev
```
1. **리딩방·검증 탭** 각 행에 **⭐** 표시(좋아요 ♡ 왼쪽). 로그인 후 클릭 → 채워짐.
2. **/favorites** 페이지 → "링크" + "리딩방·검증" 두 섹션. 별표한 리딩방이 리딩방 섹션에 뜸.
3. 리딩방 섹션도 드래그로 순서 변경(저장)·X로 해제.
4. 콘솔: `fetch('/api/rooms/favorite').then(r=>r.json()).then(console.log)` → `{favorites:[...], auth:true}`.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/rooms/favorite/route.ts components/toolbox/AdvisorDirectory.tsx components/favorites/RoomFavoritesClient.tsx app/favorites/page.tsx && git commit -m "feat(favorites): 리딩방·검증 즐겨찾기(⭐) + 즐겨찾기 페이지 리딩방 섹션 (STEP 349)" && git push
```

---

> **DB 직접변경(git 아님)**: `room_favorites` 테이블 생성(user_id·biz_no·position, RLS 본인 행만 / Supabase MCP, 운종 ref).
> **한 줄 요약**: 리딩방 행에 즐겨찾기 ⭐(좋아요와 별개) + 즐겨찾기 페이지에 리딩방 섹션(드래그). 즐겨찾기 3종 완성.
