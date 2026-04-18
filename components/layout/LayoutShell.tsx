'use client';

import { ReactNode } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';

interface LayoutShellProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function LayoutShell({ children, footer }: LayoutShellProps) {
  return (
    <>
      <div className="flex flex-1">
        <ChatSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      {footer}
    </>
  );
}
