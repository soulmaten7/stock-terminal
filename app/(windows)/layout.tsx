import type { ReactNode } from "react";
import { UnjongHeader } from "@/components/header/UnjongHeader";
import { UnjongSidebar } from "@/components/sidebar/UnjongSidebar";

export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-unjong-background">
      <UnjongHeader />

      {/* 본문 (좌측 + 메인 + 우측) */}
      <div className="flex flex-1 overflow-hidden">
        <UnjongSidebar />

        {/* 메인 영역 — 각 창의 컨텐츠 (STEP 92) */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>

        {/* 우측 사이드패널 — 종목 클릭 시 (STEP 93) */}
        <aside className="hidden xl:flex w-[360px] flex-shrink-0 border-l border-unjong-border bg-unjong-surface p-3 text-xs text-unjong-muted">
          종목 미선택 상태 · STEP 93 에서 차트·호가·체결 패널 연결
        </aside>
      </div>
    </div>
  );
}
