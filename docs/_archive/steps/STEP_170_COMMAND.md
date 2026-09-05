<!-- 2026-06-06 -->
# STEP 170 — 헤더 한 줄 통합 (토스식: 로고+네비+검색+아이콘 단일 헤더)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_170_COMMAND.md 파일 내용대로 실행해줘`

## 목표
토스처럼 **헤더 한 줄**에 [로고 · 네비(홈/마켓/토론·평가/MY) · 검색 · 우측 아이콘] 전부. 지금은 Header(로고+아이콘) 줄 + MainNav(탭+검색) 줄로 **2줄**이라 콘텐츠가 밀려 관심 레일이 헤더에서 멀어 보임.
- Header 에 네비 탭 + 검색 통합 → 단일 60px 헤더
- `app/layout.tsx` 에서 `<MainNav />` 행 제거 → 콘텐츠(관심 레일 포함) 한 줄만큼 위로 → **레일이 헤더 바로 밑에 밀착**(토스 동일)

## 전제 상태
- HEAD: `7b3d0fc`(STEP 169) 이상
- 변경: `components/layout/Header.tsx`(전체 교체) · `app/layout.tsx`(MainNav 제거 2곳)
- `components/header/MainNav.tsx` 는 미사용이 되지만 **삭제하지 않음**(빌드 무영향, 추후 참고)

---

## 작업 1/2 — `components/layout/Header.tsx` (파일 전체 교체)

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCountryStore, type Country } from '@/stores/countryStore';
import { createClient } from '@/lib/supabase/client';
import { HeaderSearch } from '@/components/header/HeaderSearch';

const COUNTRIES: { code: Country; name: string; flag: string }[] = [
  { code: 'KR', name: '한국', flag: '🇰🇷' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
];

// 토스식 상단 4탭 (운종). 뉴스는 종목 안+홈으로, 평가·검증은 토론·평가로 통합. 거래·코인 제외.
const MENU = [
  { href: '/', label: '홈', match: (p: string) => p === '/' },
  { href: '/market', label: '마켓', match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: '/discussion', label: '토론·평가', match: (p: string) => /^\/(discussion|product|room|reviews)/.test(p) },
  { href: '/mypage', label: 'MY', match: (p: string) => p.startsWith('/mypage') },
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
      <div className="px-6 h-[60px] flex items-center gap-5">
        {/* ── 로고 ── */}
        <Link href="/" className="shrink-0 hover:opacity-80 flex items-center gap-1.5">
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

        {/* ── 검색 (남은 폭) ── */}
        <div className="flex-1 min-w-0 max-w-2xl">
          <HeaderSearch />
        </div>

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

          <button type="button" className="p-1 text-unjong-muted hover:text-unjong-primary transition-colors" aria-label="알림">
            <Bell size={18} />
          </button>

          {!user ? (
            <Link href="/auth/login" className="p-1 text-unjong-muted hover:text-unjong-primary transition-colors" title="로그인">
              <User size={18} />
            </Link>
          ) : (
            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="p-1 text-unjong-muted hover:text-unjong-primary transition-colors">
                <User size={18} />
              </button>
              {profileOpen && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-unjong-surface border border-unjong-border shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-unjong-border">
                    <p className="text-sm font-bold text-unjong-primary">{user.nickname}</p>
                    <p className="text-sm text-unjong-muted">{user.email}</p>
                  </div>
                  <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>마이페이지</Link>
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
> 변경점: 로고 + **네비 탭(MENU)** + **검색(HeaderSearch)** + 우측 아이콘을 **한 줄(60px)**에. 네비/검색 로직은 MainNav 에서 그대로 가져옴.

---

## 작업 2/2 — `app/layout.tsx` (MainNav 행 제거, 2곳)

### ① import 삭제
아래 줄을 **삭제**:
```tsx
import { MainNav } from '@/components/header/MainNav';
```

### ② 렌더에서 제거
**찾기:**
```tsx
            <Header />
            <MainNav />
            <LayoutShell footer={<Footer />}>
```
**바꾸기:**
```tsx
            <Header />
            <LayoutShell footer={<Footer />}>
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/layout/Header.tsx app/layout.tsx && git commit -m "feat(v7): 헤더 한 줄 통합 — 로고+네비+검색+아이콘 단일 헤더, MainNav 행 제거 → 관심 레일 상단 밀착 (STEP 170)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 헤더가 **한 줄**: 로고 · 홈/마켓/토론·평가/MY · 검색창 · 🇰🇷🔔👤 (토스처럼)
- [ ] MainNav(둘째 줄) 사라지고, **관심 레일이 헤더 바로 밑에 밀착**해 위로 올라왔는지
- [ ] 검색·국가·프로필 드롭다운·active 탭(홈 굵게) 정상
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- `HeaderSearch` 가 헤더 폭에서 너무 길면 `max-w-2xl` 숫자 조정.
- active 탭 표시는 밑줄 → **굵게(bold)**로 변경(한 줄 헤더라 밑줄 대신). 원하면 밑줄도 가능.
- `MainNav.tsx` 미사용 파일로 남음(삭제 안 함) — 빌드 영향 0.

---
> STEP 170 = 헤더 단일 줄 통합. 전제 `7b3d0fc`. 다음: #3 랭킹 로고 · #2 hover 상세 · #4 카테고리 탭. 문서 묶어 갱신.
