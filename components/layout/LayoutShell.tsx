'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface LayoutShellProps {
  children: ReactNode;
  footer: ReactNode;
  floatingChat: ReactNode;
}

export default function LayoutShell({ children, footer, floatingChat }: LayoutShellProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <main className={isHome ? '' : 'flex-1'}>
        {children}
      </main>
      {footer}
      {/* Floating chat only on non-home pages (home has embedded sidebar chat) */}
      {!isHome && floatingChat}
    </>
  );
}
