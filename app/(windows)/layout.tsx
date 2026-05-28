import type { ReactNode } from "react";
import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import { StockDetailPanel } from "@/components/sidepanel/StockDetailPanel";
import { ContextNav } from "@/components/header/ContextNav";

export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-unjong-background min-h-screen">
      {/* ─── 좌측 컬럼: 채팅 (sticky top) + Layer 2 placeholder ─── */}
      <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
        <div className="sticky top-0 h-[500px] flex flex-col">
          <ChatPanel />
        </div>
        <div className="border-t border-unjong-border bg-unjong-background p-3 text-[10px] text-unjong-muted text-center italic">
          Layer 2 — 광고·텔레그램 링크 영역
        </div>
      </aside>

      {/* ─── 우측 영역: ContextNav + 1행(종목상세+관심종목) + 2행(카드 풀폭) ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <ContextNav />

        {/* 1행: 종목상세 (flex-1) + 관심종목 (300px) 가로 배치 */}
        <div className="flex gap-4 px-4 pt-4 items-stretch">
          <div className="flex-1 min-w-0">
            <StockDetailPanel inline />
          </div>
          <aside className="w-[300px] flex-shrink-0 flex flex-col">
            <WatchlistPanel />
          </aside>
        </div>

        {/* 2행~: 카드 그리드 우측 영역 풀폭 */}
        <main className="px-4 py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
