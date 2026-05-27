import type { Metadata } from "next";
import {
  MoversCard,
  VolumeCard,
  ScalperDisclosureCard,
} from "@/components/cards/ScalperCards";

export const metadata: Metadata = {
  title: "단타창",
  description:
    "운종(雲從) 단타창 — 장중 09:00~15:30 액티브 트레이더의 데스크. " +
    "Movers · Volume · VI · NetBuy · 공시 · 테마 · 공매도.",
};

export default function ScalperPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* 페이지 헤더 */}
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <h1 className="text-xl font-bold text-unjong-primary">⚡ 단타창</h1>
        <p className="mt-1 text-xs text-unjong-muted">
          장중 09:00~15:30 — 액티브 트레이더의 데스크
        </p>
      </div>

      {/* 카드 그리드 (Layer 0: 3개 / Layer 1: 7개 확장 예정) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MoversCard />
        <VolumeCard />
        <ScalperDisclosureCard />
      </div>

      {/* Layer 1 예정 카드 안내 */}
      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-4 text-center">
        <p className="text-xs text-unjong-muted">
          Layer 1 예정 카드: VI 발동/해제 · NetBuy + 거래원 · 테마 TOP10 · 공매도 잔고
        </p>
      </div>
    </div>
  );
}
