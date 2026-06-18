"use client";

import { useState, useEffect, Fragment, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import HomePerfRanking from "./HomePerfRanking";
import HomeRoomRanking from "./HomeRoomRanking";

const TABS = [
  { key: "stock", label: "주식" },
  { key: "etf", label: "ETF" },
  { key: "etn", label: "ETN" },
  { key: "reit", label: "리츠" },
  { key: "room", label: "리딩방 리스트" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const isTab = (t: string | null): t is TabKey => !!t && TABS.some((x) => x.key === t);

export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabKey>(isTab(urlTab) ? urlTab : "stock");

  // URL ?tab 동기화 — 새로고침 시 탭 유지 + 헤더 홈/로고(=/) 클릭 시 '주식'으로 리셋
  useEffect(() => {
    const t = searchParams.get("tab");
    setTab(isTab(t) ? t : "stock");
  }, [searchParams]);

  function selectTab(k: TabKey) {
    setTab(k);
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    if (k === "stock") p.delete("tab");
    else p.set("tab", k);
    const qs = p.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <div>
      <div className="sticky top-9 z-20 mb-4 flex items-center gap-1 border-b border-unjong-border bg-unjong-surface">
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
      {tab === "etf" && <HomePerfRanking apiPath="/api/krx/etf-performance" emptyLabel="ETF" />}
      {tab === "etn" && <HomePerfRanking apiPath="/api/krx/etn-performance" emptyLabel="ETN" noChart />}
      {tab === "reit" && <HomePerfRanking apiPath="/api/yahoo/reit-performance" emptyLabel="리츠" />}
      {tab === "room" && <HomeRoomRanking platforms={["telegram", "kakao"]} kind="room" />}
    </div>
  );
}
