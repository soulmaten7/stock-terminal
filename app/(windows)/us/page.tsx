import type { Metadata } from "next";
import {
  GlobalIndicesCard,
  UsMoversCard,
  UsNewsCard,
} from "@/components/cards/UsCards";

export const metadata: Metadata = {
  title: "미국주식창",
  description:
    "운종(雲從) 미국주식창 — 미장 투자자의 새벽 데스크. " +
    "S&P/Nasdaq/VIX · Pre/After · M7 · Movers · 환율 · 뉴스+8K · FOMC.",
};

export default function UsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <h1 className="text-xl font-bold text-unjong-primary">🌙 미국주식창</h1>
        <p className="mt-1 text-xs text-unjong-muted">
          새벽 22:30~05:00 — 미장 투자자의 데스크
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <GlobalIndicesCard />
        <UsMoversCard />
        <UsNewsCard />
      </div>

      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-4 text-center">
        <p className="text-xs text-unjong-muted">
          Layer 1 예정 카드: Pre/After-hours TOP · Magnificent 7 · USD/KRW 환율 + 시계 · FOMC·CPI·NFP 캘린더
        </p>
      </div>
    </div>
  );
}
