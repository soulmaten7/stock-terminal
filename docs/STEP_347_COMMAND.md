<!-- 2026-06-22 -->
# STEP 347 — [기능] 헤더 알림(Bell) → 즐겨찾기(Star) 드롭다운

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_347_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
헤더의 **알림(빈 껍데기 Bell 버튼)** → **즐겨찾기(Star) 드롭다운**. 카테고리에서 별표(⭐)해둔 링크를 헤더에서 바로 모아보고 클릭 → 새 탭. 사용자 맞춤 모음. (홈 사이드는 안 건드림 — 조잡함 방지.)

> 변경 2파일: `app/api/toolbox/favorite/route.ts`(GET 추가) · `components/layout/Header.tsx`(Bell→Star 드롭다운). 즐겨찾기 저장은 기존 `link_hub_favorites` DB 그대로 사용.

---

## 📄 파일 1 — `app/api/toolbox/favorite/route.ts` (GET 추가)

**찾기:**
```ts
  return NextResponse.json({ ok: true, linkId, favorite });
}
```
**바꾸기:**
```ts
  return NextResponse.json({ ok: true, linkId, favorite });
}

// 헤더 즐겨찾기 드롭다운 — 로그인 유저가 별표한 링크 목록
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorites: [], auth: false });

  const { data: favs } = await supabase
    .from('link_hub_favorites')
    .select('link_id')
    .eq('user_id', user.id);
  const ids = (favs ?? []).map((f: { link_id: number }) => f.link_id);
  if (ids.length === 0) return NextResponse.json({ favorites: [], auth: true });

  const { data: links } = await supabase
    .from('link_hub')
    .select('id, site_name, site_url, category')
    .in('id', ids);

  const favorites = (links ?? []).map((l: { id: number; site_name: string; site_url: string; category: string }) => ({
    id: l.id, name: l.site_name, url: l.site_url, category: l.category,
  }));
  return NextResponse.json({ favorites, auth: true });
}
```

---

## 📄 파일 2 — `components/layout/Header.tsx` (4곳)

### 1 — import Bell → Star
**찾기:**
```tsx
import { User, Bell, LogOut } from 'lucide-react';
```
**바꾸기:**
```tsx
import { User, Star, LogOut } from 'lucide-react';
```

### 2 — 즐겨찾기 상태/로더 추가 (resetHome 선언 아래)
**찾기:**
```tsx
  const resetHome = useHomeReset((s) => s.reset);
```
**바꾸기:**
```tsx
  const resetHome = useHomeReset((s) => s.reset);

  const [favOpen, setFavOpen] = useState(false);
  const [favorites, setFavorites] = useState<{ id: number; name: string; url: string }[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const favRef = useRef<HTMLDivElement>(null);

  const loadFavs = async () => {
    setFavLoading(true);
    try {
      const r = await fetch('/api/toolbox/favorite');
      const j = await r.json();
      setFavorites(j.favorites ?? []);
    } catch {
      /* noop */
    } finally {
      setFavLoading(false);
    }
  };
  const favHost = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
```

### 3 — 바깥 클릭 닫기에 favRef 추가
**찾기:**
```tsx
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
```
**바꾸기:**
```tsx
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (favRef.current && !favRef.current.contains(e.target as Node)) setFavOpen(false);
```

### 4 — Bell 버튼 → Star 드롭다운으로 교체
**찾기:**
```tsx
          <button type="button" className="p-1 text-unjong-muted hover:text-unjong-primary transition-colors" aria-label="알림">
            <Bell size={18} />
          </button>
```
**바꾸기:**
```tsx
          {/* 즐겨찾기 */}
          <div ref={favRef} className="relative">
            <button
              type="button"
              onClick={() => { const next = !favOpen; setFavOpen(next); if (next) loadFavs(); }}
              className="p-1 text-unjong-muted transition-colors hover:text-unjong-accent"
              aria-label="즐겨찾기"
              title="즐겨찾기"
            >
              <Star size={18} />
            </button>
            {favOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden border border-unjong-border bg-unjong-surface shadow-lg">
                <div className="flex items-center gap-1.5 border-b border-unjong-border px-4 py-2.5">
                  <Star size={14} className="text-unjong-accent" fill="currentColor" />
                  <span className="text-sm font-bold text-unjong-primary">즐겨찾기</span>
                </div>
                {!user ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm leading-relaxed text-unjong-muted">로그인하면 카테고리에서 별표한<br />링크를 모아볼 수 있어요.</p>
                    <Link href="/auth/login" onClick={() => setFavOpen(false)} className="mt-2 inline-block text-sm font-semibold text-unjong-accent">로그인 →</Link>
                  </div>
                ) : favLoading ? (
                  <p className="px-4 py-6 text-center text-sm text-unjong-muted">불러오는 중…</p>
                ) : favorites.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm leading-relaxed text-unjong-muted">아직 즐겨찾기가 없어요.<br />카테고리 목록에서 ⭐를 눌러 추가하세요.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto py-1">
                    {favorites.map((f) => (
                      <li key={f.id}>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setFavOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-unjong-background"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`https://www.google.com/s2/favicons?domain=${favHost(f.url)}&sz=64`} alt="" className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate text-sm text-unjong-primary">{f.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ GET 라우트 추가 → dev 서버 재시작 (Header는 HMR이지만 새 GET 엔드포인트라)
```bash
pkill -f "next dev" 2>/dev/null; cd ~/stock-terminal && rm -rf .next && npm run dev
```
1. 헤더 우측 **🔔 → ⭐** 변경 확인.
2. **로그아웃 상태** ⭐ 클릭 → "로그인하면…" 안내.
3. **로그인 후** 카테고리에서 링크 ⭐ 몇 개 추가 → 헤더 ⭐ 클릭 → 그 링크들이 favicon+이름으로 목록, 클릭 시 새 탭.
4. 콘솔: `fetch('/api/toolbox/favorite').then(r=>r.json()).then(console.log)` → `{favorites:[...], auth:true}`.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/toolbox/favorite/route.ts components/layout/Header.tsx && git commit -m "feat(header): 알림(Bell) → 즐겨찾기(Star) 드롭다운 — 카테고리 별표 링크 모아보기 (STEP 347)" && git push
```

---

> **한 줄 요약**: 헤더 빈 알림 버튼을 즐겨찾기 드롭다운으로 — 별표한 카테고리 링크를 헤더에서 바로 모아보고 새 탭으로. 사용자 맞춤 모음.
