export const metadata = { title: "서비스 소개" };

const PILLARS: { t: string; d: string }[] = [
  { t: "정확한 정보", d: "흩어진 금융·투자 정보를 한곳에 정리해, 출발점에서 헤매지 않게 합니다." },
  { t: "솔직한 토론", d: "정제된 커뮤니티에서 과장 없이 의견을 나눕니다." },
  { t: "검증된 신뢰", d: "리딩방·유사투자자문을 금융감독원 신고 정보로 교차검증합니다." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-unjong-primary">트릴리언 소개</h1>
      <p className="mb-8 text-base font-medium text-unjong-accent">흩어진 금융정보를 한눈에</p>

      <p className="mb-10 text-sm leading-relaxed text-unjong-muted">
        트릴리언은 정확한 정보, 솔직한 토론, 검증된 신뢰로 투자자가 잘못된 정보나 과장된
        상품에 속지 않도록 돕는 플랫폼입니다. 주식·상품·리딩방을 한곳에서 교차검증하세요.
      </p>

      <div className="space-y-5">
        {PILLARS.map((p) => (
          <section key={p.t} className="rounded-xl border border-unjong-border bg-unjong-surface p-5">
            <h2 className="mb-1 text-base font-bold text-unjong-primary">{p.t}</h2>
            <p className="text-sm leading-relaxed text-unjong-muted">{p.d}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-xs leading-relaxed text-unjong-muted">
        트릴리언은 금융상품의 매매·중개·투자자문을 제공하지 않으며, 어떠한 거래도 중개하지
        않습니다. 정보·대화·허브·신뢰의 역할만 합니다. 트릴리언이 제공하는 정보는 참고용이며,
        투자 권유나 자문이 아닙니다.
      </p>
    </div>
  );
}
