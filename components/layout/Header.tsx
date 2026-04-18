'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, User, Star, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCountryStore, type Country } from '@/stores/countryStore';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/screener', label: '스크리너' },
  { href: '/link-hub', label: '도구함' },
];

const COUNTRIES: { code: Country; name: string; flag: string }[] = [
  { code: 'KR', name: '한국', flag: '🇰🇷' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { country, setCountry } = useCountryStore();
  const [countryOpen, setCountryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const countryRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentCountry = COUNTRIES.find((c) => c.code === country)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/stocks?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().setUser(null);
    setProfileOpen(false);
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-[#E5E7EB]">
      <div className="max-w-[1920px] mx-auto px-6 h-[72px] flex items-center justify-between gap-8">
        {/* ── Left: Logo ── */}
        <Link
          href="/"
          scroll={true}
          onClick={() => window.scrollTo(0, 0)}
          className="shrink-0 hover:opacity-80"
        >
          <span className="font-display text-xl font-black text-black tracking-[0.15em] uppercase leading-none">
            STOCK TERMINAL
          </span>
        </Link>

        {/* ── Center: Nav ── */}
        <nav className="flex items-center gap-10">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm tracking-wide transition-colors ${
                isActive(item.href)
                  ? 'text-[#0ABAB5] font-bold'
                  : 'text-black hover:text-[#0ABAB5]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── Right: Search | Country | Bell | Watchlist | Profile ── */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-black hover:opacity-60"
            title="검색"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          <div ref={countryRef} className="relative">
            <button
              onClick={() => setCountryOpen(!countryOpen)}
              className="text-xl hover:opacity-60"
              title="국가 선택"
            >
              {currentCountry.flag}
            </button>
            {countryOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-[#E5E7EB] shadow-lg overflow-hidden z-50 min-w-[140px]">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c.code);
                      setCountryOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-[#F5F5F5] ${
                      country === c.code ? 'text-[#0ABAB5] font-bold' : 'text-black'
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="text-black hover:opacity-60" title="알림">
            <Bell className="w-5 h-5" />
          </button>

          {!user ? (
            <>
              <Link href="/stocks" className="text-black hover:opacity-60" title="관심종목">
                <Star className="w-5 h-5" />
              </Link>
              <Link href="/auth/login" className="text-black hover:opacity-60" title="로그인">
                <User className="w-5 h-5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/stocks?tab=watchlist"
                className="text-black hover:opacity-60"
                title="관심종목"
              >
                <Star className="w-5 h-5" />
              </Link>
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="text-black hover:opacity-60"
                >
                  <User className="w-5 h-5" />
                </button>
                {profileOpen && (
                  <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-[#E5E7EB] shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#F0F0F0]">
                      <p className="text-sm font-bold text-black">{user.nickname}</p>
                      <p className="text-xs text-[#999999]">{user.email}</p>
                    </div>
                    <Link
                      href="/mypage"
                      className="block px-4 py-2.5 text-sm text-black hover:bg-[#F5F5F5]"
                      onClick={() => setProfileOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <Link
                      href="/stocks?tab=watchlist"
                      className="block px-4 py-2.5 text-sm text-black hover:bg-[#F5F5F5]"
                      onClick={() => setProfileOpen(false)}
                    >
                      관심종목
                    </Link>
                    <div className="border-t border-[#E5E7EB]" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-[#FF4D4D] font-bold hover:bg-[#FFF5F5]"
                    >
                      <LogOut className="w-4 h-4" /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Search Bar (toggle) ── */}
      {searchOpen && (
        <div className="bg-white border-t border-[#E5E7EB]">
          <div className="max-w-[1920px] mx-auto px-6 py-3">
            <form onSubmit={handleSearch}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="종목명 또는 코드를 검색하세요"
                className="w-full bg-transparent border-none text-black text-sm placeholder:text-[#999999] focus:outline-none"
              />
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
