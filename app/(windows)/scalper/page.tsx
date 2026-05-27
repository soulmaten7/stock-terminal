import type { Metadata } from "next";
import {
  MoversCard,
  VolumeCard,
  ScalperDisclosureCard,
  ViCard,
  NetBuyBrokerCard,
  ThemeTop10Card,
  ShortInterestCard,
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
          장중 09:00~15:30 — 액티브 트레이더의 데스크 · 카드 7개 완성 (STEP 96)
        </p>
      </div>

      {/* 카드 그리드 7개 (1행 속도·2행 분석·3행 위험) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MoversCard />
        <VolumeCard />
        <ViCard />
        <NetBuyBrokerCard />
        <ScalperDisclosureCard />
        <ThemeTop10Card />
        <ShortInterestCard />
      </div>

      {/* Layer 1 진행 상황 안내 */}
      <div className="rounded-lg border border-dashed border-unjong-accent bg-unjong-surface p-4">
        <p className="text-xs font-semibold text-unjong-primary mb-1">
          🚧 Layer 1 — 실데이터 연결 진행 중
        </p>
        <p className="text-[11px] text-unjong-muted leading-relaxed">
          현재 모든 카드 더미. Layer 1 에서 실데이터 연결:
          <br />
          · Movers · Volume · 공시 · 테마 → 기존 V3 데이터 재활용
          <br />
          · VI · 거래원 · 공매도 → KIS API 추가 호출 + KRX 데이터 신규
          <br />
          채팅 메시지 (좌측) 가 화면 정보와 일치하면 운종 본질 활성.
        </p>
      </div>
    </div>
  );
}
