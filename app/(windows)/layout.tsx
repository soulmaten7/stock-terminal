import type { ReactNode } from "react";
import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import { StockDetailPanel } from "@/components/sidepanel/StockDetailPanel";
import { ContextNav } from "@/components/header/ContextNav";

export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-unjong-background min-h-screen">
      {/* ─── 좌측 컬럼: 채팅 (sticky top 500px) + Layer 2 placeholder ─── */}
      <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
        <div className="sticky top-0 h-[500px] flex flex-col">
          <ChatPanel />
        </div>
        <div className="border-t border-unjong-border bg-unjong-background p-3 text-[10px] text-unjong-muted text-center italic">
          Layer 2 — 광고·텔레그램 링크 영역
        </div>
      </aside>

      {/* ─── 가운데 컬럼: ContextNav + 종목상세 + 카드 ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <ContextNav />
        <main className="flex-1 p-4 space-y-4">
          <StockDetailPanel inline />
          {children}
        </main>
      </div>

      {/* ─── 우측 컬럼: 관심종목 (자연 길이) ─── */}
      <aside className="w-[300px] flex-shrink-0 border-l border-unjong-border bg-unjong-surface">
        <WatchlistPanel />
      </aside>
    </div>
  );
}
