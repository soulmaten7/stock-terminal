<!-- 2026-06-22 -->
# STEP 352 — [디자인] B 미드나잇+민트 적용 (토큰·헤더 다크·푸터·메타)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_352_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
브랜드 컬러 **B(#0E1116 미드나잇 + #2DD4BF 민트)** 전면 적용:
- 색 토큰 remap(accent→민트, primary→미드나잇) → 컴포넌트 전체 자동 반영(액티브 탭·링크·⭐ 등).
- **헤더 다크화**(미드나잇 바 + 흰 글씨 + 민트 액센트 + 민트 아바타) — "대형 플랫폼" 시그니처.
- **푸터 다크화**(미드나잇 + 민트 hover) + **태그라인 → "흩어진 금융정보를 한눈에"**.
- 메타(타이틀·OG) → 영문 브랜드 Trillion + 허브 태그라인.

> 변경 4파일: `app/globals.css`(토큰) · `Header.tsx`(전체) · `Footer.tsx`(전체) · `app/layout.tsx`(메타).
> 언어설정은 **보류**(한국 완성 후). 헤더 '한국/미국'은 시장 토글로 유지.

---

## 📄 1) `app/globals.css` — 색 토큰 remap (4곳)

**찾기:** `  --color-accent: #0ABAB5;`
**바꾸기:** `  --color-accent: #2DD4BF;`

**찾기:** `  --color-accent-dark: #088F8C;`
**바꾸기:** `  --color-accent-dark: #14A89B;`

**찾기:** `  --color-unjong-primary: #0F1E3D;`
**바꾸기:** `  --color-unjong-primary: #0E1116;`

**찾기:** `  --color-unjong-accent: #D4AF37;`
**바꾸기:** `  --color-unjong-accent: #2DD4BF;`

---

## 📄 2) `components/layout/Header.tsx` — 전체 교체 (다크 헤더)

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
    <header className="border-b border-white/10 bg-[#0E1116]">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-5 px-6">
        {/* 로고 */}
        <Link href="/" onClick={resetHome} className="flex shrink-0 items-center gap-1.5 hover:opacity-80">
          <span className="text-lg font-bold tracking-wide text-white">Trillion</span>
          <span className="text-sm text-white/45">트릴리언</span>
        </Link>

        {/* 네비 탭 */}
        <nav className="flex shrink-0 items-center" aria-label="메인 네비">
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
                    ? 'px-3 py-2 text-sm font-bold text-white'
                    : 'px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:text-white'
                }
              >
                {m.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* 우측 아이콘 */}
        <div className="flex shrink-0 items-center gap-3">
          <div ref={countryRef} className="relative">
            <button type="button" onClick={() => setCountryOpen(!countryOpen)} className="p-1 text-base transition-opacity hover:opacity-70" aria-label="국가 선택" title={currentCountry.name}>
              {currentCountry.flag}
            </button>
            {countryOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden border border-unjong-border bg-unjong-surface shadow-lg">
                {COUNTRIES.map((c) => (
                  <button key={c.code} onClick={() => { setCountry(c.code); setCountryOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-unjong-background ${country === c.code ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}>
                    <span className="text-lg">{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 즐겨찾기 */}
          <Link href="/favorites" className="p-1 text-white/70 transition-colors hover:text-[#2DD4BF]" aria-label="즐겨찾기" title="즐겨찾기">
            <Star size={18} />
          </Link>

          {!user ? (
            <Link href="/auth/login" className="p-1 text-white/70 transition-colors hover:text-white" title="로그인">
              <User size={18} />
            </Link>
          ) : (
            <div ref={profileRef} className="relative">
              <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2DD4BF] text-xs font-bold text-[#0E1116] transition-opacity hover:opacity-90" aria-label="프로필 메뉴" title={user.nickname || user.email || ''}>
                {(user.nickname || user.email || 'U').charAt(0).toUpperCase()}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden border border-unjong-border bg-unjong-surface shadow-lg">
                  <div className="border-b border-unjong-border px-4 py-3">
                    <p className="text-sm font-bold text-unjong-primary">{user.nickname}</p>
                    <p className="text-sm text-unjong-muted">{user.email}</p>
                  </div>
                  <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>마이페이지</Link>
                  {user.role === 'admin' ? (
                    <Link href="/admin" className="block px-4 py-2.5 text-sm font-semibold text-unjong-accent hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>관리자</Link>
                  ) : null}
                  <div className="border-t border-unjong-border" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-unjong-danger hover:bg-unjong-background">
                    <LogOut className="h-4 w-4" /> 로그아웃
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

## 📄 3) `components/layout/Footer.tsx` — 전체 교체 (다크 푸터 + 허브 태그라인)

```tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0E1116]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold text-white">
              Trillion <span className="text-sm font-medium text-white/45">트릴리언</span>
            </p>
            <p className="mt-2 text-sm text-white/70">흩어진 금융정보를 한눈에</p>
          </div>

          {/* 서비스 */}
          <div>
            <h4 className="mb-4 font-bold text-white">서비스</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">서비스 소개</Link></li>
            </ul>
          </div>

          {/* 약관·정책 */}
          <div>
            <h4 className="mb-4 font-bold text-white">약관·정책</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">이용약관</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">개인정보처리방침</Link></li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <h4 className="mb-4 font-bold text-white">문의</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>카카오톡: @트릴리언</li>
              <li>이메일: 도메인 확정 후 안내</li>
              <li>운영시간: 평일 09:00 ~ 18:00</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/10 bg-[#15191F]">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="mb-3 text-sm leading-relaxed text-white/80">
            본 사이트는 공개된 금융 데이터·정보를 정리하여 제공하며, 투자 권유 또는 투자 자문이 아닙니다.
            모든 투자 판단과 그에 따른 결과의 책임은 이용자 본인에게 있습니다.
            본 사이트는 제공하는 정보의 정확성·완전성을 보장하지 않습니다.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-white/80">
            트릴리언의 &lsquo;신고&rsquo;·평가·인증 표시는 사실 제공을 위한 것이며, 대상의 안전성·수익성을 보증하지 않습니다.
            신고되지 않은 익명 리딩방은 특히 주의하시기 바랍니다.
          </p>
          <div className="text-sm text-white/60">
            <p>상호명: 원트릴리언 | 대표자: [추후 입력] | 사업자등록번호: 210-39-33812 | 주소: [추후 입력]</p>
          </div>
          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/70">
            &copy; 2026 Trillion. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## 📄 4) `app/layout.tsx` — 메타(영문 브랜드 + 허브 태그라인)

**찾기:**
```tsx
  title: {
    default: "트릴리언 — 투자상품에 속지 않게 돕는 곳",
    template: "%s | 트릴리언",
  },
  description:
    "트릴리언 — 정확한 정보 + 솔직한 토론 + 검증된 신뢰로 투자상품에 속지 않게 돕는 곳. " +
    "주식·상품·리딩방을 한곳에서 교차검증하세요.",
```
**바꾸기:**
```tsx
  title: {
    default: "Trillion — 흩어진 금융정보를 한눈에",
    template: "%s | Trillion",
  },
  description:
    "흩어진 금융정보를 한곳에 모아 한눈에 — 시세·뉴스·공시·거시지표·ETF·공모주, 그리고 리딩방 검증까지. Trillion.",
```

**찾기:**
```tsx
  authors: [{ name: "트릴리언" }],
  openGraph: {
    title: "트릴리언",
    description: "투자상품에 속지 않게 돕는 곳 — 정확한 정보 + 솔직한 토론 + 검증된 신뢰",
    type: "website",
    locale: "ko_KR",
  },
```
**바꾸기:**
```tsx
  authors: [{ name: "Trillion" }],
  openGraph: {
    title: "Trillion",
    description: "흩어진 금융정보를 한눈에 — 시세·뉴스·공시·거시·리딩방 검증",
    type: "website",
    locale: "ko_KR",
  },
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트·CSS·메타 → HMR/새로고침, 안 되면 새로고침):
1. **헤더 = 미드나잇 다크바** + `Trillion 트릴리언`(흰 글씨) + ⭐·아이콘 흰색, 아바타 **민트** 원.
2. **앱 전체 액센트 = 민트**(게이트웨이 액티브 탭은 미드나잇 pill, 링크·⭐·hover·"+리딩방 등록" 등은 민트).
3. **푸터 = 미드나잇** + hover 민트 + 태그라인 "흩어진 금융정보를 한눈에" + 사업자정보.
4. 브라우저 탭 제목 = "Trillion — 흩어진 금융정보를 한눈에".

> ⚠️ 지수 티커·일부 컴포넌트는 다음 패스에서 미세조정(보고 나서). 이번엔 "B 룩" 기본 적용.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/globals.css components/layout/Header.tsx components/layout/Footer.tsx app/layout.tsx && git commit -m "design(brand): B 미드나잇+민트 적용 — 토큰 remap + 헤더/푸터 다크 + 허브 태그라인 (STEP 352)" && git push
```

---

> **한 줄 요약**: 브랜드 컬러 B(미드나잇+민트) 전면 — 토큰 remap으로 앱 전체 민트 액센트 + 헤더/푸터 다크 + 태그라인 허브. 대형 플랫폼 룩 1차.
