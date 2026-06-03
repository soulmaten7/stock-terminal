"use client";

import { useEffect, useState } from "react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import MarketNewsModule from "@/components/home-v5/MarketNewsModule";
import HotDiscussionsModule from "@/components/home-v5/HotDiscussionsModule";
import HotRoomReviewsModule from "@/components/home-v5/HotRoomReviewsModule";
import HotProductReviewsModule from "@/components/home-v5/HotProductReviewsModule";
import HomeBannerSlot from "./HomeBannerSlot";
import HomeIndexBar from "./HomeIndexBar";
import HomeBriefing from "./HomeBriefing";
import HomeGlobalRanking from "./HomeGlobalRanking";
import HomeSectorTheme from "./HomeSectorTheme";
import HomeCryptoSlot from "./HomeCryptoSlot";
import HomeQuickLinks from "./HomeQuickLinks";
import HomeEtfPicks from "./HomeEtfPicks";
import HomePopularStocks from "./HomePopularStocks";
import HomeRightRail from "./HomeRightRail";

export default function HomeClientV6() {
  const [fssCount, setFssCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count } = await createAnonClient()
        .from("fss_advisors").select("*", { count: "exact", head: true }).eq("status", "active");
      if (!cancelled) setFssCount(count ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-[1480px] mx-auto px-6 py-5">
      <HomeBannerSlot fssCount={fssCount} />
      <HomeIndexBar />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-5">
        <main className="space-y-6 min-w-0">
          <HomeBriefing />
          <MarketNewsModule />
          <section>
            <h2 className="text-lg font-bold text-unjong-primary mb-3 flex items-center gap-1.5">
              🛡️ 검증·평가 <span className="text-xs text-unjong-muted font-normal">금감원 신고 + 실사용자 평가</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <HotRoomReviewsModule /><HotProductReviewsModule />
            </div>
          </section>
          <HomeGlobalRanking />
          <HomeSectorTheme />
          <HotDiscussionsModule />
          <HomeCryptoSlot />
          <HomeQuickLinks />
          <HomeEtfPicks />
          <HomePopularStocks />
        </main>
        <HomeRightRail />
      </div>
      {/* 푸터는 전역 LayoutShell 이 렌더 (중복 방지) */}
    </div>
  );
}
