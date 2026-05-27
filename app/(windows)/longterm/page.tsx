import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "장타창",
  description:
    "운종(雲從) 장타창 — 가치투자자·장기보유자의 데스크. " +
    "공시 · 분기실적 · 저평가 · 배당 · 신저가 · 섹터 · 관리종목.",
};

export default function LongtermPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h1 className="text-2xl font-bold text-unjong-primary">🌳 장타창</h1>
        <p className="mt-2 text-sm text-unjong-muted">
          저녁·주말 — 가치투자자·장기보유자의 데스크
        </p>
      </div>

      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h2 className="text-sm font-medium text-unjong-muted">
          메인 카드 7개 자리 (STEP 92 + Layer 1)
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-unjong-muted">
          <li>1. 공시 (실적·배당·증자·자사주)</li>
          <li>2. 분기 실적 캘린더</li>
          <li>3. 저평가 종목 랭킹 ⭐신규</li>
          <li>4. 배당 캘린더 + 수익률 TOP</li>
          <li>5. 52주 신저가 우량주 ⭐신규</li>
          <li>6. 섹터 히트맵</li>
          <li>7. 관리종목·투자유의 ⭐신규</li>
        </ul>
      </div>
    </div>
  );
}
