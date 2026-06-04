import type { Metadata } from "next";
import HotDiscussionsModule from "@/components/home-v5/HotDiscussionsModule";

export const metadata: Metadata = { title: "토론" };

export default function DiscussionPage() {
  return (
    <div className="max-w-[1480px] mx-auto px-4 py-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">토론</h1>
        <p className="mt-1 text-sm text-unjong-muted">
          종목 토론을 한곳에서 — 솔직한 의견과 검증된 정보. (오늘의 추천·업종/테마별 토론은 순차 확장 예정)
        </p>
      </header>
      <HotDiscussionsModule />
    </div>
  );
}
