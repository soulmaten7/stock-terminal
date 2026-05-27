import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "단타창",
  description:
    "운종(雲從) 단타창 — 장중 09:00~15:30 액티브 트레이더의 데스크. " +
    "Movers · Volume · VI · NetBuy · 공시 · 테마 · 공매도.",
};

export default function ScalperPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h1 className="text-2xl font-bold text-unjong-primary">⚡ 단타창</h1>
        <p className="mt-2 text-sm text-unjong-muted">
          장중 09:00~15:30 — 액티브 트레이더의 데스크
        </p>
      </div>

      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h2 className="text-sm font-medium text-unjong-muted">
          메인 카드 7개 자리 (STEP 92 + Layer 1)
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-unjong-muted">
          <li>1. Movers (등락률 TOP)</li>
          <li>2. Volume 폭증</li>
          <li>3. VI 발동/해제 ⭐신규</li>
          <li>4. NetBuy + 거래원 ⭐거래원 신규</li>
          <li>5. 공시 실시간</li>
          <li>6. 테마 TOP10</li>
          <li>7. 공매도 잔고 ⭐신규</li>
        </ul>
      </div>
    </div>
  );
}
