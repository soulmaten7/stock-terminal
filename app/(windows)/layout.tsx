import type { ReactNode } from "react";
import { UnjongHeader } from "@/components/header/UnjongHeader";
import { UnjongSidebar } from "@/components/sidebar/UnjongSidebar";
import { StockDetailPanel } from "@/components/sidepanel/StockDetailPanel";

export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-unjong-background">
      <UnjongHeader />

      <div className="flex flex-1 overflow-hidden">
        <UnjongSidebar />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
        <StockDetailPanel />
      </div>
    </div>
  );
}
