import type { Metadata } from "next";
import MarketNewsModule from "@/components/home-v5/MarketNewsModule";

export const metadata: Metadata = { title: "뉴스" };

export default function NewsPage() {
  return (
    <div className="px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">뉴스</h1>
        <p className="mt-1 text-sm text-unjong-muted">
          시장 헤드라인 — 한경·매경·머니투데이·이데일리·연합. (속보·많이 본·토픽·리서치는 순차 확장 예정)
        </p>
      </header>
      <MarketNewsModule />
    </div>
  );
}
