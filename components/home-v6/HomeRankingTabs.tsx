"use client";

import { useState, useEffect, Fragment, type ReactNode } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import HomeEtfRanking from "./HomeEtfRanking";
import HomePerfRanking from "./HomePerfRanking";
import HomeRoomRanking from "./HomeRoomRanking";
import HomeEtnRanking from "./HomeEtnRanking";

const TABS = [
  { key: "stock", label: "주식" },
  { key: "etf", label: "ETF" },
  { key: "etn", label: "ETN" },
  { key: "reit", label: "리츠" },
  { key: "room", label: "리딩방 리스트" },
] as const;
type TabKey = (typeof TABS)[number]["key"];


export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const [tab, setTab] = useState<TabKey>("stock");

  // 새로고침해도 현재 탭 유지 (URL ?tab=)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.key === t)) setTab(t as TabKey);
  }, []);

  function selectTab(k: TabKey) {
    setTab(k);
    const p = new URLSearchParams(window.location.search);
    p.set("tab", k);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
        {TABS.map((t) => (
          <Fragment key={t.key}>
            {/* 리딩방 리스트 앞 구분선 — '상품'과 '검증 디렉토리' 경계 */}
            {t.key === "room" && <span className="mx-1 h-4 w-px bg-unjong-border" aria-hidden />}
            <button
              type="button"
              onClick={() => selectTab(t.key)}
              className={
                tab === t.key
                  ? "-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary"
                  : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary"
              }
            >
              {t.label}
            </button>
          </Fragment>
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

      {tab === "stock" && <MarketClient embedded onHover={onHover} detailSlot={detailSlot} />}
      {tab === "etf" && <HomeEtfRanking fixedAsset="etf" />}
      {tab === "etn" && <HomeEtnRanking />}
      {tab === "reit" && <HomePerfRanking apiPath="/api/yahoo/reit-performance" emptyLabel="리츠" />}
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
    </div>
  );
}
