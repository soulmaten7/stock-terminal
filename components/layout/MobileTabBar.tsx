'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Sun, Search, Star, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// 하단 탭 4개(목업 확정·STEP 766, 필드 대전환 STEP 767b로 오늘=루트·탐색=/explore 갱신) — 오늘·탐색·관심·마이. 새 아이콘 팩 없이 lucide-react 기존 세트 재사용.
const TABS = [
  { key: 'today', href: '/', Icon: Sun, match: (p: string) => p === '/' },
  { key: 'explore', href: '/explore', Icon: Search, match: (p: string) => p === '/explore' || p.startsWith('/stock/') },
  { key: 'watchlist', href: '/favorites', Icon: Star, match: (p: string) => p === '/favorites' },
  { key: 'my', href: '/mypage', Icon: User, match: (p: string) => p === '/mypage' },
] as const;

export default function MobileTabBar() {
  const t = useTranslations('Nav');
  const pathname = usePathname() ?? '/';
  const { user } = useAuthStore();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0E1116] pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const href = tab.key === 'my' && !user ? '/auth/login' : tab.href;
          return (
            <Link
              key={tab.key}
              href={href}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 active:bg-white/5 ${active ? 'text-[#2DD4BF]' : 'text-white/70'}`}
              aria-current={active ? 'page' : undefined}
            >
              <tab.Icon size={22} />
              <span className="text-[11px] font-medium">{t(tab.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
