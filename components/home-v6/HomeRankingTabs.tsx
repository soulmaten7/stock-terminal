"use client";

import { useState, Fragment, type ReactNode } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import HomeEtfRanking from "./HomeEtfRanking";
import HomeRoomRanking from "./HomeRoomRanking";

const TABS = [
  { key: "stock", label: "주식" },
  { key: "etf", label: "ETF" },
  { key: "etn", label: "ETN" },
  { key: "fund", label: "펀드" },
  { key: "reit", label: "리츠" },
  { key: "room", label: "리딩방 리스트" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function ComingSoon({ label }: { label: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-2 text-2xl">🗂️</span>
        <p className="text-sm font-medium text-unjong-primary">{label} 성적표는 준비 중이에요</p>
        <p className="mt-1 text-xs text-unjong-muted">데이터 소스 연동 후 주식·ETF와 같은 기간 수익률 방식으로 제공해요</p>
      </div>
    </section>
  );
}

export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const [tab, setTab] = useState<TabKey>("stock");

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
        {TABS.map((t) => (
          <Fragment key={t.key}>
            {/* 리딩방 리스트 앞 구분선 — '상품'과 '검증 디렉토리' 경계 */}
            {t.key === "room" && <span className="mx-1 h-4 w-px bg-unjong-border" aria-hidden />}
            <button
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
      {tab === "etn" && <ComingSoon label="ETN" />}
      {tab === "fund" && <HomeEtfRanking fixedAsset="fund" />}
      {tab === "reit" && <ComingSoon label="리츠" />}
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
    </div>
  );
}
