'use client';

import { useState, useRef, useEffect } from 'react';
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { User, Star, LogOut } from 'lucide-react';
import { clearCache } from '@/lib/clientCache';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';

// 헤더 = 언어 선택(시장 선택 아님 — 시장은 페이지의 한국/미국 토글이 담당).
// 언어명은 t()로 감싸지 않는다 — 언어는 항상 자기 언어로 표기한다(한국어는 언제나 '한국어').
const LANGS: { code: 'ko' | 'en'; name: string; flag: string }[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export default function Header() {
  const t = useTranslations('Header');
  const locale = useLocale();
  // PC 메뉴 순서·라벨(필드 대전환 STEP 767b) — 오늘(루트)·탐색·소개. 관심은 우측 별 아이콘이 담당(메뉴 중복 금지). 모바일은 하단 탭바가 전담(nav 자체를 sm:flex로 숨김).
  const MENU = [
    { href: '/', label: t('today'), ready: true, match: (p: string) => p === '/' },
    { href: '/explore', label: t('explore'), ready: true, match: (p: string) => p === '/explore' },
    // { href: '/coin', label: t('coin'), ready: false, match: (p: string) => p === '/coin' }, // 준비 중 — 추후 코인 시장 (베타 전 숨김·데이터 없어 노출 시 전문성↓. 복구=이 줄 주석만 해제)
    { href: '/about', label: t('about'), ready: true, match: (p: string) => p === '/about' }, // 소개(무엇/어떻게) — 온보딩 진입점
  ] as const;
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { user } = useAuthStore();
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false); // '코인' 클릭 시 준비중 안내 팝오버
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const currentLang = LANGS.find((l) => l.code === locale) ?? LANGS[0];

  // 언어 전환 = 지금 보는 페이지 그대로 로케일만 교체.
  // pathname은 로케일이 벗겨진 경로(/en/about → /about)라 그대로 넘기면 되고,
  // 쿼리는 렌더가 아닌 클릭 시점에 읽는다(useSearchParams를 쓰면 Suspense 경계가 강제돼 정적 렌더가 깨진다).
  const switchLocale = (next: 'ko' | 'en') => {
    setLangOpen(false);
    if (next === locale) return;
    // 명시 선택을 1년 쿠키로 직접 심는다(STEP 800 §1 · routing.ts localeCookie:false라 next-intl은 안 심음).
    // 이 쿠키만 선택을 바꾼다 — URL 방문(/en 링크)으론 안 바뀜 → 미들웨어가 이 값으로 로케일 지속.
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    router.replace({ pathname, query }, { locale: next });
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (coinRef.current && !coinRef.current.contains(e.target as Node)) setCoinOpen(false);
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
        <Link href="/" className="flex shrink-0 items-center gap-2 hover:opacity-80">
          <svg viewBox="0 0 100 100" className="h-6 w-6 shrink-0 lg:h-8 lg:w-8" aria-hidden="true">
            <rect x="16" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="42.5" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="69" y="22" width="15" height="14" rx="2.5" fill="#2DD4BF" />
            <rect x="42.5" y="35" width="15" height="43" rx="2.5" fill="#2DD4BF" />
          </svg>
          <span className="flex flex-col justify-center leading-none">
            <span className="flex items-baseline gap-2">
              <span className="text-lg font-bold leading-none tracking-wide text-white">Trillion</span>
              {locale === 'ko' && <span className="hidden text-sm text-white/65 sm:inline">트릴리언</span>}
            </span>
            <span className="mt-0.5 hidden text-[11px] font-normal leading-none text-white/65 lg:block">{t('tagline')}</span>
          </span>
        </Link>

        {/* 네비 탭 */}
        <nav className="hidden shrink-0 items-center sm:flex" aria-label={t('mainNav')}>
          {MENU.map((m) => {
            const isActive = m.match(pathname);
            // 준비 중 탭(코인 등): 클릭 시 팝오버
            if (!m.ready) {
              return (
                <div key={m.label} ref={coinRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setCoinOpen((o) => !o)}
                    aria-haspopup="true"
                    aria-expanded={coinOpen}
                    className="px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                  >
                    {m.label}
                  </button>
                  {coinOpen && (
                    <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-unjong-border bg-unjong-surface px-3 py-1.5 text-xs font-medium text-unjong-primary shadow-lg">
                      {t('comingSoon')}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={m.label}
                href={m.href}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'px-3 py-2 text-sm font-bold text-white'
                    : 'px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white'
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
            <button type="button" onClick={() => setLangOpen(!langOpen)} className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-1 text-sm text-white/80 transition-opacity hover:opacity-70" aria-label={t('language')} title={t('language')}>
              <span className="hidden font-medium sm:inline">{currentLang.name}</span>
              <span className="text-base">{currentLang.flag}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[170px] overflow-hidden border border-unjong-border bg-unjong-surface shadow-lg">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => switchLocale(l.code)}
                    lang={l.code}
                    aria-current={l.code === currentLang.code ? 'true' : undefined}
                    className={`flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-unjong-background ${
                      l.code === currentLang.code ? 'font-bold text-unjong-accent' : 'text-unjong-primary'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-base">{l.flag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 즐겨찾기 — PC 전용(모바일은 하단 탭바 '관심'이 담당·STEP 768) */}
          <Link href="/favorites" className="hidden p-1 text-white/70 transition-colors hover:text-[#2DD4BF] sm:block" aria-label={t('favorites')} title={t('favorites')}>
            <Star size={18} />
          </Link>

          {/* 로그인/프로필 — PC 전용(모바일은 하단 탭바 '마이'가 담당·STEP 768) */}
          <div className="hidden sm:block">
            {!user ? (
              <Link href="/auth/login" className="p-1 text-white/70 transition-colors hover:text-white" title={t('login')}>
                <User size={18} />
              </Link>
            ) : (
              <div ref={profileRef} className="relative">
                <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2DD4BF] text-xs font-bold text-[#0E1116] transition-opacity hover:opacity-90" aria-label={t('profileMenu')} title={user.nickname || user.email || ''}>
                  {(user.nickname || user.email || 'U').charAt(0).toUpperCase()}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden border border-unjong-border bg-unjong-surface shadow-lg">
                    <div className="border-b border-unjong-border px-4 py-3">
                      <p className="text-sm font-bold text-unjong-primary">{user.nickname}</p>
                      <p className="text-sm text-unjong-muted">{user.email}</p>
                    </div>
                    <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>{t('mypage')}</Link>
                    <Link href="/advertise" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>{t('adInquiry')}</Link>
                    <div className="border-t border-unjong-border" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-unjong-danger hover:bg-unjong-background">
                      <LogOut className="h-4 w-4" /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
