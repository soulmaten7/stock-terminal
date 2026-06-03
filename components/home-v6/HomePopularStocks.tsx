import PlaceholderCard from "./PlaceholderCard";

export default function HomePopularStocks() {
  return (
    <section>
      <h2 className="text-lg font-bold text-unjong-primary mb-3">이용자 인기 종목</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <PlaceholderCard title="가장 많이 본 종목" note="이용자 관심 집계 — 계좌·로그인 연동 후 제공" />
        <PlaceholderCard title="관심 등록 TOP" note="이용자 관심 집계 — 추후 제공" />
        <PlaceholderCard title="토론 활발 종목" note="토론 집계 — 추후 제공" />
      </div>
    </section>
  );
}
