import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "미국주식창",
  description:
    "운종(雲從) 미국주식창 — 미장 투자자의 새벽 데스크. " +
    "S&P/Nasdaq/VIX · Pre/After · M7 · Movers · 환율 · 뉴스+8K · FOMC.",
};

export default function UsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h1 className="text-2xl font-bold text-unjong-primary">🌙 미국주식창</h1>
        <p className="mt-2 text-sm text-unjong-muted">
          새벽 22:30~05:00 — 미장 투자자의 데스크
        </p>
      </div>

      <div className="rounded-lg border border-unjong-border bg-unjong-surface p-6">
        <h2 className="text-sm font-medium text-unjong-muted">
          메인 카드 7개 자리 (STEP 92 + Layer 1)
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-unjong-muted">
          <li>1. 글로벌 지수 (S&P/Nasdaq/Dow/VIX)</li>
          <li>2. Pre-market / After-hours TOP ⭐신규</li>
          <li>3. Magnificent 7 ⭐신규</li>
          <li>4. 미국 Movers</li>
          <li>5. USD/KRW 환율 + 미국 시계 ⭐신규</li>
          <li>6. 미국 뉴스 + 8-K (SEC EDGAR)</li>
          <li>7. FOMC·CPI·NFP 캘린더</li>
        </ul>
      </div>
    </div>
  );
}
