'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCountryStore, type Country } from '@/stores/countryStore';
import { createClient } from '@/lib/supabase/client';

const COUNTRIES: { code: Country; name: string; flag: string }[] = [
  { code: 'KR', name: '한국', flag: '🇰🇷' },
  { code: 'US', name: '미국', flag: '🇺🇸' },
];

export default function Header() {
  const router = useRouter();
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
      <div className="px-6 h-[60px] flex items-center gap-4">
        {/* ── 로고 ── */}
        <Link href="/" className="shrink-0 hover:opacity-80 flex items-center gap-1.5">
          <span className="text-lg font-bold tracking-wider text-unjong-primary">
            UNJONG
          </span>
          <span className="text-sm text-unjong-muted">운종</span>
        </Link>

        {/* ── 우측 아이콘 ── */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <div ref={countryRef} className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen(!countryOpen)}
              className="text-base p-1 hover:opacity-70 transition-opacity"
              aria-label="국가 선택"
              title={currentCountry.name}
            >
              {currentCountry.flag}
            </button>
            {countryOpen && (
              <div className="absolute top-full mt-2 right-0 bg-unjong-surface border border-unjong-border shadow-lg overflow-hidden z-50 min-w-[140px]">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCountry(c.code); setCountryOpen(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-unjong-background ${
                      country === c.code ? 'text-unjong-accent font-bold' : 'text-unjong-primary'
                    }`}
                  >
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
            <>
              <Link href="/auth/login" className="p-1 text-unjong-muted hover:text-unjong-primary transition-colors" title="로그인">
                <User size={18} />
              </Link>
            </>
          ) : (
            <>
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="p-1 text-unjong-muted hover:text-unjong-primary transition-colors"
                >
                  <User size={18} />
                </button>
                {profileOpen && (
                  <div className="absolute top-full mt-2 right-0 w-48 bg-unjong-surface border border-unjong-border shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-unjong-border">
                      <p className="text-sm font-bold text-unjong-primary">{user.nickname}</p>
                      <p className="text-sm text-unjong-muted">{user.email}</p>
                    </div>
                    <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>
                      마이페이지
                    </Link>
                    <div className="border-t border-unjong-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-unjong-danger font-bold hover:bg-unjong-background"
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
    </header>
  );
}
