'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Sun, Star, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

// 하단 탭 3개(2026-09-05 ORDER_트릴리언모델잔재정리_0905 — /explore 폐지로 4→3, 탐색은
// 렌즈 랭킹 전용 페이지였음). 종목상세는 홈에서 리포트를 클릭해 들어가는 흐름이라 "오늘" 탭이 활성.
const TABS = [
  { key: 'today', href: '/', Icon: Sun, match: (p: string) => p === '/' || p.startsWith('/stock/') },
  { key: 'watchlist', href: '/favorites', Icon: Star, match: (p: string) => p === '/favorites' },
  { key: 'my', href: '/mypage', Icon: User, match: (p: string) => p === '/mypage' },
] as const;

export default function MobileTabBar() {
  const t = useTranslations('Nav');
  const pathname = usePathname() ?? '/';
  const { user, isLoading: authLoading } = useAuthStore();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0E1116] pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          // 하이드레이션 중(authLoading)엔 로그인으로 고정하지 않는다 — 로그인 사용자가 튕기던 버그(STEP 804 §6).
          const href = tab.key === 'my' && !authLoading && !user ? '/auth/login' : tab.href;
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
