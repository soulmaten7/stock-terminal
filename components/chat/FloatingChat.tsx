'use client';

/**
 * FloatingChat — 1400px 미만 (모바일·태블릿) 에서만 보이는 둥둥이 채팅.
 *  - 닫힘: 우측 하단 원형 FAB + 언리드 배지
 *  - 열림: 모바일(<768px) → 바텀시트 85vh / 태블릿(768-1399px) → 우측 400px 사이드 오버레이
 *  - 상태 유지: chatStore 의 panelOpen, 메시지·필터도 store 공유
 *  - 1400px 경계 판정은 matchMedia 로 처리 (CSS hidden/flex 충돌 회피)
 */

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import ChatPanel from './ChatPanel';

export default function FloatingChat() {
  const { panelOpen, unreadCount, setPanelOpen } = useChatStore();
  const [showFloating, setShowFloating] = useState(false);

  // 1400px 미만에서만 렌더. SSR 대비 초기값 false → mount 후 실제 값 반영
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1399.98px)');
    const sync = () => setShowFloating(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // 1400px+ 로 리사이즈되면 열린 패널 강제 종료
  // (ChatSidebar 가 인계받으므로 오버레이·body scroll lock 해제 필요)
  useEffect(() => {
    if (!showFloating && panelOpen) {
      setPanelOpen(false);
    }
  }, [showFloating, panelOpen, setPanelOpen]);

  // 열림 상태에서 body 스크롤 잠금 (모바일 바텀시트 UX)
  useEffect(() => {
    if (!panelOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [panelOpen]);

  // ESC 로 닫기
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, setPanelOpen]);

  // 1400px+ 에서는 완전 unmount → FAB·오버레이 DOM 흔적 없음
  if (!showFloating) return null;

  return (
    <>
      {/* FAB */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          aria-label="실시간 채팅 열기"
          className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-[#0ABAB5] text-white shadow-lg flex items-center justify-center hover:bg-[#099b96] active:scale-95 transition"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#FF3B30] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Overlay + Panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPanelOpen(false)}
            aria-hidden="true"
          />

          {/* Panel — 모바일: 바텀시트 / 태블릿: 우측 사이드 */}
          <div
            className="
              absolute bg-white shadow-2xl flex flex-col overflow-hidden
              inset-x-0 bottom-0 h-[85vh] rounded-t-2xl
              md:inset-y-0 md:right-0 md:bottom-auto md:left-auto md:h-full md:w-[400px] md:rounded-none md:rounded-l-2xl
            "
          >
            {/* 모바일 그립 (시각적 힌트) */}
            <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0">
              <span className="block w-10 h-1 rounded-full bg-[#E5E7EB]" />
            </div>

            <div className="flex-1 min-h-0">
              <ChatPanel onClose={() => setPanelOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
