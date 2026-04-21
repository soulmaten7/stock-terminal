'use client';

import { ReactNode } from 'react';
import VerticalNav from '@/components/layout/VerticalNav';

interface LayoutShellProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function LayoutShell({ children, footer }: LayoutShellProps) {
  return (
    <div className="flex flex-1">
      <VerticalNav />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1">
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
