import type { Metadata } from "next";
import {
  LongtermDisclosureCard,
  EarningsCalendarCard,
  SectorCard,
} from "@/components/cards/LongtermCards";

export const metadata: Metadata = {
  title: "장타창",
  description:
    "운종(雲從) 장타창 — 가치투자자·장기보유자의 데스크. " +
    "공시 · 분기실적 · 저평가 · 배당 · 신저가 · 섹터 · 관리종목.",
};

export default function LongtermPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
        <h1 className="text-xl font-bold text-unjong-primary">🌳 장타창</h1>
        <p className="mt-1 text-xs text-unjong-muted">
          저녁·주말 — 가치투자자·장기보유자의 데스크
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <LongtermDisclosureCard />
        <EarningsCalendarCard />
        <SectorCard />
      </div>

      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-4 text-center">
        <p className="text-xs text-unjong-muted">
          Layer 1 예정 카드: 저평가 종목 랭킹 · 배당 캘린더 + 수익률 TOP · 52주 신저가 우량주 · 관리종목·투자유의
        </p>
      </div>
    </div>
  );
}
