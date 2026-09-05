<!-- 2026-06-22 -->
# STEP 348 — [기능] 즐겨찾기 페이지(/favorites) + 드래그 순서 + 헤더 ⭐→페이지

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_348_COMMAND.md 파일 내용대로 실행해줘
```

- **DB**: `link_hub_favorites.position`(integer) 컬럼은 **Supabase MCP로 이미 적용 완료**(운종 ref). STEP에선 DB 작업 없음.

---

## 🎯 목표
헤더 ⭐ = 드롭다운 → **`/favorites` 페이지 이동**. 페이지에서 즐겨찾기 링크를 **드래그로 순서 변경**(서버 저장) + 해제(X). (리딩방 즐겨찾기는 STEP 349.)

> 신규 2파일(page·FavoritesClient) + 수정 2파일(favorite route 전체교체·Header 전체교체).

---

## 📄 파일 1 — `app/api/toolbox/favorite/route.ts` (전체 교체: POST + GET순서 + PUT재정렬)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 즐겨찾기 토글
export async function POST(req: NextRequest) {
  const { linkId, favorite } = await req.json().catch(() => ({}));
  if (!linkId || favorite === undefined) {
    return NextResponse.json({ error: 'linkId and favorite required' }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (favorite) {
    await supabase.from('link_hub_favorites').upsert(
      { user_id: user.id, link_id: linkId },
      { onConflict: 'user_id,link_id' }
    );
  } else {
    await supabase.from('link_hub_favorites').delete().eq('user_id', user.id).eq('link_id', linkId);
  }
  return NextResponse.json({ ok: true, linkId, favorite });
}

// 즐겨찾기 목록 (커스텀 순서: position 우선, 신규는 뒤)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorites: [], auth: false });

  const { data: favs } = await supabase
    .from('link_hub_favorites')
    .select('link_id, position, created_at')
    .eq('user_id', user.id)
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const ids = (favs ?? []).map((f: { link_id: number }) => f.link_id);
  if (ids.length === 0) return NextResponse.json({ favorites: [], auth: true });

  const { data: links } = await supabase
    .from('link_hub')
    .select('id, site_name, site_url, category')
    .in('id', ids);

  type L = { id: number; site_name: string; site_url: string; category: string };
  const byId = new Map<number, L>((links ?? []).map((l: L) => [l.id, l]));
  const favorites = ids
    .map((id: number) => byId.get(id))
    .filter((l): l is L => !!l)
    .map((l) => ({ id: l.id, name: l.site_name, url: l.site_url, category: l.category }));

  return NextResponse.json({ favorites, auth: true });
}

// 드래그 순서 저장 (order = link_id 배열)
export async function PUT(req: NextRequest) {
  const { order } = await req.json().catch(() => ({}));
  if (!Array.isArray(order)) return NextResponse.json({ error: 'order array required' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await Promise.all(
    order.map((linkId: number, i: number) =>
      supabase.from('link_hub_favorites').update({ position: i }).eq('user_id', user.id).eq('link_id', linkId)
    )
  );
  return NextResponse.json({ ok: true });
}
```

---

## 📄 파일 2 — `app/favorites/page.tsx` (신규)

```tsx
import FavoritesClient from '@/components/favorites/FavoritesClient';

export const metadata = { title: '즐겨찾기' };

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">⭐ 즐겨찾기</h1>
        <p className="mt-1 text-sm text-unjong-muted">카테고리에서 별표한 링크 모음 — 드래그로 순서를 바꿀 수 있어요.</p>
      </div>
      <FavoritesClient />
    </main>
  );
}
```

---

## 📄 파일 3 — `components/favorites/FavoritesClient.tsx` (신규)

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GripVertical, X, ExternalLink } from 'lucide-react';

type Fav = { id: number; name: string; url: string; category: string };

function host(u: string) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }

export default function FavoritesClient() {
  const [items, setItems] = useState<Fav[]>([]);
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/toolbox/favorite')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.favorites ?? []); setAuth(j.auth !== false); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const persist = (next: Fav[]) => {
    fetch('/api/toolbox/favorite', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((x) => x.id) }),
    }).catch(() => {});
  };

  const onDragEnter = (i: number) => {
    const from = dragIdx.current;
    if (from === null || from === i) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      dragIdx.current = i;
      return next;
    });
  };
  const onDragEnd = () => { dragIdx.current = null; persist(items); };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    fetch('/api/toolbox/favorite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: id, favorite: false }),
    }).catch(() => {});
  };

  if (loading) return <p className="py-16 text-center text-sm text-unjong-muted">불러오는 중…</p>;
  if (!auth) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-16 text-center">
        <p className="text-sm text-unjong-muted">로그인하면 즐겨찾기를 모아볼 수 있어요.</p>
        <Link href="/auth/login" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">로그인 →</Link>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-16 text-center">
        <p className="text-sm leading-relaxed text-unjong-muted">아직 즐겨찾기가 없어요.<br />카테고리 목록에서 ⭐를 눌러 추가하세요.</p>
        <Link href="/" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">카테고리 보러가기 →</Link>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {items.map((f, i) => (
        <li
          key={f.id}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://www.google.com/s2/favicons?domain=${host(f.url)}&sz=64`} alt="" draggable={false} className="h-5 w-5 shrink-0" />
          <a href={f.url} target="_blank" rel="noopener noreferrer" draggable={false} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{f.name}</span>
            <span className="hidden shrink-0 text-xs text-unjong-muted sm:inline">{host(f.url)}</span>
            <ExternalLink size={11} className="shrink-0 text-unjong-border" />
          </a>
          <button type="button" onClick={() => remove(f.id)} aria-label="즐겨찾기 해제" className="shrink-0 text-unjong-border transition-colors hover:text-unjong-danger">
            <X size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
```

---

## 📄 파일 4 — `components/layout/Header.tsx` (전체 교체: ⭐ 드롭다운 → /favorites 링크)

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Star, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCountryStore, type Country } from '@/stores/countryStore';
import { createClient } from '@/lib/supabase/client';
import { useHomeReset } from '@/stores/homeResetStore';

const COUNTRIES: { code: Country; name: string; flag: string }[] = [
  { code: 'KR', name: '한국', flag: '🇰🇷' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
];

const MENU = [
  { href: '/', label: '주식', match: (p: string) => p === '/' },
  { href: '/coin', label: '코인', match: (p: string) => /^\/coin/.test(p) },
] as const;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { user } = useAuthStore();
  const { country, setCountry } = useCountryStore();
  const [countryOpen, setCountryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const currentCountry = COUNTRIES.find((c) => c.code === country)!;
  const resetHome = useHomeReset((s) => s.reset);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    setProfileOpen(false);
    router.push('/');
  };

  return (
    <header className="bg-unjong-surface border-b border-unjong-border">
      <div className="mx-auto max-w-7xl px-6 h-[60px] flex items-center gap-5">
        {/* ── 로고 ── */}
        <Link href="/" onClick={resetHome} className="shrink-0 hover:opacity-80 flex items-center gap-1.5">
          <span className="text-lg font-bold tracking-wider text-unjong-primary">UNJONG</span>
          <span className="text-sm text-unjong-muted">운종</span>
        </Link>

        {/* ── 네비 탭 ── */}
        <nav className="flex items-center shrink-0" aria-label="메인 네비">
          {MENU.map((m) => {
            const isActive = m.match(pathname);
            return (
              <Link
                key={m.label}
                href={m.href}
                onClick={() => { if (m.href === '/') resetHome(); }}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'px-3 py-2 text-sm font-bold text-unjong-primary'
                    : 'px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary transition-colors'
                }
              >
                {m.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* ── 우측 아이콘 ── */}
        <div className="flex items-center gap-3 shrink-0">
          <div ref={countryRef} className="relative">
            <button type="button" onClick={() => setCountryOpen(!countryOpen)} className="text-base p-1 hover:opacity-70 transition-opacity" aria-label="국가 선택" title={currentCountry.name}>
              {currentCountry.flag}
            </button>
            {countryOpen && (
              <div className="absolute top-full mt-2 right-0 bg-unjong-surface border border-unjong-border shadow-lg overflow-hidden z-50 min-w-[140px]">
                {COUNTRIES.map((c) => (
                  <button key={c.code} onClick={() => { setCountry(c.code); setCountryOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-unjong-background ${country === c.code ? 'text-unjong-accent font-bold' : 'text-unjong-primary'}`}>
                    <span className="text-lg">{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 즐겨찾기 페이지 */}
          <Link href="/favorites" className="p-1 text-unjong-muted transition-colors hover:text-unjong-accent" aria-label="즐겨찾기" title="즐겨찾기">
            <Star size={18} />
          </Link>

          {!user ? (
            <Link href="/auth/login" className="p-1 text-unjong-muted hover:text-unjong-primary transition-colors" title="로그인">
              <User size={18} />
            </Link>
          ) : (
            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex h-7 w-7 items-center justify-center rounded-full bg-unjong-primary text-xs font-bold text-white transition-opacity hover:opacity-90" aria-label="프로필 메뉴" title={user.nickname || user.email || ''}>
                {(user.nickname || user.email || 'U').charAt(0).toUpperCase()}
              </button>
              {profileOpen && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-unjong-surface border border-unjong-border shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-unjong-border">
                    <p className="text-sm font-bold text-unjong-primary">{user.nickname}</p>
                    <p className="text-sm text-unjong-muted">{user.email}</p>
                  </div>
                  <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>마이페이지</Link>
                  {user.role === 'admin' ? (
                    <Link href="/admin" className="block px-4 py-2.5 text-sm font-semibold text-unjong-accent hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>관리자</Link>
                  ) : null}
                  <div className="border-t border-unjong-border" />
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-unjong-danger font-bold hover:bg-unjong-background">
                    <LogOut className="w-4 h-4" /> 로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ GET/PUT 라우트 변경 → dev 서버 완전 재시작
```bash
pkill -f "next dev" 2>/dev/null; cd ~/stock-terminal && rm -rf .next && npm run dev
```
1. 헤더 ⭐ 클릭 → **`/favorites` 페이지** 이동.
2. 로그인 후 카테고리에서 ⭐ 몇 개 추가 → /favorites에 목록.
3. **드래그**로 순서 바꾸고 새로고침 → 순서 유지(저장됨).
4. X 버튼 → 즐겨찾기 해제(목록에서 사라짐).
5. 콘솔: `fetch('/api/toolbox/favorite').then(r=>r.json()).then(console.log)` → `{favorites:[...순서대로...], auth:true}`.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/toolbox/favorite/route.ts app/favorites/page.tsx components/favorites/FavoritesClient.tsx components/layout/Header.tsx && git commit -m "feat(favorites): 즐겨찾기 페이지(/favorites) + 드래그 순서 저장 + 헤더 ⭐→페이지 (STEP 348)" && git push
```

---

> **DB 직접변경(git 아님)**: `link_hub_favorites.position`(integer) 컬럼 추가(Supabase MCP, 운종 ref).
> **한 줄 요약**: 헤더 ⭐ → 즐겨찾기 페이지. 드래그로 순서 커스텀(position 저장)·해제. 리딩방 즐겨찾기는 STEP 349.
