'use client';

import { ReactNode } from 'react';

interface LayoutShellProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function LayoutShell({ children, footer }: LayoutShellProps) {
  return (
    <>
      <main className="flex-1 min-w-0 min-h-[calc(100svh_-_61px)]">
        {children}
      </main>
      {footer}
    </>
  );
}
