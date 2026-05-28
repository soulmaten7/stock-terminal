import type { ReactNode } from "react";
import { ContextNav } from "@/components/header/ContextNav";
import { UnjongSidebar } from "@/components/sidebar/UnjongSidebar";
import { StockDetailPanel } from "@/components/sidepanel/StockDetailPanel";

export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 좌측 사이드 — 채팅 + 관심종목 */}
      <UnjongSidebar />

      {/* 메인 + 우측 패널 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 4단 ContextNav — 채팅창 제외, 메인+우측 폭만 */}
        <ContextNav />

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4">{children}</main>
          <StockDetailPanel />
        </div>
      </div>
    </div>
  );
}
