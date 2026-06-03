"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import { createAnonClient } from "@/lib/supabase/anon-client";
import {
  MoversCard,
  VolumeCard,
  NetBuyBrokerCard,
  ScalperDisclosureCard,
} from "@/components/cards/ScalperCards";
import HotDiscussionsModule from "./HotDiscussionsModule";
import HotChatRoomsModule from "./HotChatRoomsModule";
import MarketNewsModule from "./MarketNewsModule";
import HotProductReviewsModule from "./HotProductReviewsModule";
import HotRoomReviewsModule from "./HotRoomReviewsModule";
import HotReviewPostsModule from "./HotReviewPostsModule";

export default function HomeClientV5() {
  const [fssCount, setFssCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = createAnonClient();
      const { count } = await sb
        .from("fss_advisors")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (!cancelled) setFssCount(count ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* 히어로 — V6 정체성 + 신뢰 지표 */}
      <div className="px-10 pt-5">
        <div className="rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-unjong-primary">투자상품에 속지 않게 돕는 곳</h1>
            <p className="text-sm text-unjong-muted mt-0.5">
              정확한 정보 + 솔직한 토론 + 검증된 신뢰 — 주식·상품·리딩방을 한곳에서 교차검증하세요.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-unjong-background px-4 py-2.5 flex-shrink-0">
            <ShieldCheck size={18} className="text-unjong-accent" />
            <div className="leading-tight">
              <p className="text-xs text-unjong-muted">금감원 신고업체 자동 대조</p>
              <p className="text-sm font-bold text-unjong-primary">
                {fssCount !== null ? `${fssCount.toLocaleString()}개 업체` : "대조 중…"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr_320px] gap-5 px-10 py-5 min-h-[calc(100vh-200px)]">
        {/* 좌측: 대화 */}
        <aside className="space-y-5 sticky top-5 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="h-[400px] flex flex-col">
            <ChatPanel />
          </div>
          <HotChatRoomsModule />
        </aside>

        {/* 가운데: 신뢰 우선 위계 */}
        <main className="space-y-5">
          {/* ① 검증·평가 — 운종 정체성 (맨 위) */}
          <section>
            <h2 className="text-lg font-bold text-unjong-primary mb-3 flex items-center gap-1.5">
              🛡️ 검증·평가
              <span className="text-xs text-unjong-muted font-normal">금감원 신고 여부 + 실사용자 평가</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <HotRoomReviewsModule />
              <HotProductReviewsModule />
            </div>
          </section>

          {/* ② HOT 평가 글 — 추천/비추천 전시 (NEW) */}
          <HotReviewPostsModule />

          {/* ③ HOT 토론 — 대화 */}
          <HotDiscussionsModule />

          {/* ④ 시장 정보 — 위계 한 단계 ↓ (주인공 아님) */}
          <section>
            <h2 className="text-base font-semibold text-unjong-muted mb-3">📊 시장 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <MoversCard />
              <VolumeCard />
              <NetBuyBrokerCard />
              <ScalperDisclosureCard />
            </div>
          </section>

          {/* ⑤ 뉴스 — 카테고리 */}
          <MarketNewsModule />
        </main>

        {/* 우측: 관심 종목 */}
        <aside className="sticky top-5 self-start max-h-[calc(100vh-2rem)]">
          <WatchlistPanel />
        </aside>
      </div>
    </>
  );
}
