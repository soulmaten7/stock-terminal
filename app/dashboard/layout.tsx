import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import TickerBar from "@/components/layout/TickerBar";
import TopNav from "@/components/layout/TopNav";
import Footer from "@/components/layout/Footer";
import LayoutShell from "@/components/layout/LayoutShell";

/**
 * V3 보존 페이지 (/dashboard) 전용 레이아웃.
 * 운종 3창 (/scalper /longterm /us) 에는 적용 안 됨.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-screen-2xl mx-auto flex-1 flex flex-col">
      <Header />
      <TickerBar />
      <TopNav />
      <LayoutShell footer={<Footer />}>
        {children}
      </LayoutShell>
    </div>
  );
}
