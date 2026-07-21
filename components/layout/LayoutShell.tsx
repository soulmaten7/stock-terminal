'use client';

import { ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import MobileTabBar from './MobileTabBar';

interface LayoutShellProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function LayoutShell({ children, footer }: LayoutShellProps) {
  const pathname = usePathname() ?? '/';
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      <main className="flex-1 min-w-0 min-h-[calc(100svh_-_61px)] pb-16 sm:pb-0">
        {children}
      </main>
      {footer}
      {!isAdmin && <MobileTabBar />}
    </>
  );
}
