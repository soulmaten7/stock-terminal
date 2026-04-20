'use client';

import { ReactNode } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatProvider from '@/components/chat/ChatProvider';
import FloatingChat from '@/components/chat/FloatingChat';
import VerticalNav from '@/components/layout/VerticalNav';

interface LayoutShellProps {
  children: ReactNode;
  footer: ReactNode;
}

export default function LayoutShell({ children, footer }: LayoutShellProps) {
  return (
    <>
      {/* 채팅 데이터·구독 전담 (UI 없음) */}
      <ChatProvider />

      <div className="flex flex-1">
        <VerticalNav />
        {/* 1400px+ : 좌측 고정 사이드바 */}
        <ChatSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      {footer}

      {/* 1400px- : 둥둥이 FAB + 바텀시트/사이드오버레이 */}
      <FloatingChat />
    </>
  );
}
