'use client';

import { ReactNode } from 'react';
import VerticalNav from '@/components/layout/VerticalNav';

interface LayoutShellProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function LayoutShell({ children, footer }: LayoutShellProps) {
  return (
    <>
      <div className="flex flex-1">
        <VerticalNav />
        <main className="flex-1 min-w-0">
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      {footer}
    </>
  );
}
