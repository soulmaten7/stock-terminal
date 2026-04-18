'use client';

/**
 * ChatSidebar — 1400px+ viewport 에서만 보이는 좌측 고정 사이드바.
 * 1400px 미만은 FloatingChat 이 담당.
 * 데이터·구독은 ChatProvider 가 전담. 여기는 UI 래핑만.
 */

import ChatPanel from './ChatPanel';

export default function ChatSidebar() {
  return (
    <aside className="hidden min-[1400px]:flex w-[320px] shrink-0 flex-col bg-white border-r border-[#E5E7EB] sticky top-0 h-screen z-10">
      <ChatPanel />
    </aside>
  );
}
