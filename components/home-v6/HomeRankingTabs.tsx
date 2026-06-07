"use client";

import { useState, type ReactNode } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import SectorRanking from "./SectorRanking";
import InvestorTrend from "./InvestorTrend";
import HomeEtfRanking from "./HomeEtfRanking";
import HomeRoomRanking from "./HomeRoomRanking";

const TABS = [
  { key: "chart", label: "실시간 차트" },
  { key: "category", label: "지금 뜨는 카테고리" },
  { key: "investor", label: "국내 투자자 동향" },
  { key: "etf", label: "투자상품 랭킹" },
  { key: "room", label: "리딩방 랭킹" },
  { key: "channel", label: "주식 관련 채널 랭킹" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const [tab, setTab] = useState<TabKey>("chart");

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary"
                : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary"
            }
          >
            {t.label}
          </button>
        ))}

        {/* 오른쪽 자투리 공간: 시장 시간 안내 (넓은 화면만 — 좁으면 탭 우선) */}
        <div className="ml-auto hidden items-center gap-4 pb-2 pr-1 text-xs text-unjong-muted xl:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
            국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
            해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
          </span>
        </div>
      </div>

      {tab === "chart" && <MarketClient embedded onHover={onHover} detailSlot={detailSlot} />}
      {tab === "category" && <SectorRanking />}
      {tab === "investor" && <InvestorTrend />}
      {tab === "etf" && <HomeEtfRanking />}
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
      {tab === "channel" && (
        <HomeRoomRanking platforms={["youtube", "discord", "instagram", "facebook", "naver_band", "naver_cafe", "other"]} kind="channel" />
      )}
    </div>
  );
}
