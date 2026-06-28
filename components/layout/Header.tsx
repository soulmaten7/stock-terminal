'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Star, LogOut } from 'lucide-react';
import { clearCache } from '@/lib/clientCache';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { useHomeReset } from '@/stores/homeResetStore';

// 헤더 = 언어 선택(시장 선택 아님 — 시장은 페이지의 한국/미국 토글이 담당).
const LANGS: { code: 'ko' | 'en'; name: string; flag: string; ready: boolean }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷', ready: true },
  { code: 'en', name: 'English', flag: '🇺🇸', ready: false }, // 영어 번역 준비 중(i18n)
];

const MENU = [
  { href: '/', label: '주식', match: (p: string) => p === '/' },
] as const;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { user } = useAuthStore();
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const currentLang = LANGS[0]; // 현재 한국어(번역 추가 전까지 고정 표시)
  const resetHome = useHomeReset((s) => s.reset);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    clearCache();
    setProfileOpen(false);
    router.push('/');
  };

  return (
    <header className="border-b border-white/10 bg-[#0E1116]">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
        {/* 로고 */}
        <Link href="/" onClick={resetHome} className="flex shrink-0 items-center gap-2 hover:opacity-80">
          <svg width="22" height="22" viewBox="0 0 100 100" className="shrink-0" aria-hidden="true">
            <rect x="16" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="42.5" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="69" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="42.5" y="35" width="15" height="43" rx="2.5" fill="#2DD4BF" />
          </svg>
          <span className="text-lg font-bold tracking-wide text-white">Trillion</span>
          <span className="hidden text-sm text-white/45 sm:inline">트릴리언</span>
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
          {/* 언어 선택 (시장 선택 아님 — 시장은 페이지의 한국/미국 토글) */}
          <div ref={langRef} className="relative">
            <button type="button" onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 p-1 text-sm text-white/80 transition-opacity hover:opacity-70" aria-label="언어 선택" title="언어 선택">
              <span className="hidden font-medium sm:inline">{currentLang.name}</span>
              <span className="text-base">{currentLang.flag}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[170px] overflow-hidden border border-unjong-border bg-unjong-surface shadow-lg">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLangOpen(false)}
                    disabled={!l.ready}
                    className={`flex w-full items-center gap-2 px-4 py-3 text-sm ${
                      l.ready
                        ? `hover:bg-unjong-background ${l.code === currentLang.code ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`
                        : 'cursor-not-allowed text-unjong-muted'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-base">{l.flag}</span>
                    {!l.ready && <span className="ml-auto text-[11px] text-unjong-muted">준비 중</span>}
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
                  <Link href="/advertise" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>광고 문의</Link>
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
