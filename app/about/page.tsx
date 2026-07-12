export const metadata = { title: "서비스 소개" };

const PILLARS: { t: string; d: string }[] = [
  { t: "무기", d: "기관이 쓰는 분석의 눈을 개인 손에. TR-AI 렌즈가 모멘텀·밸류·퀄리티 등 검증된 기법으로 종목을 읽어드려요." },
  { t: "직시", d: "시세·뉴스·공시를 1차 재료 그대로. 데이터가 없으면 지어내지 않고 “데이터 부족”이라 말합니다." },
  { t: "자립", d: "사고팔 신호는 없습니다. 검증된 시각을 나란히 놓아드릴 뿐, 결정은 당신 몫이에요." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-unjong-primary">트릴리언 소개</h1>
      <p className="text-base font-semibold text-unjong-accent">종목을 보는 눈을, 누구에게나.</p>
      <p className="mt-1 text-sm text-unjong-muted">모든 시각을 데이터로 — 판단은 당신입니다.</p>

      <p className="mt-8 mb-10 text-sm leading-relaxed text-unjong-muted">
        예측도, 추천도 하지 않습니다. 전문가들이 쓰는 검증된 기법으로 종목을{" "}
        <span className="font-medium text-unjong-primary">데이터로 보여드리고</span>, 판단은 당신에게 맡깁니다.
      </p>

      <div className="space-y-4">
        {PILLARS.map((p) => (
          <section key={p.t} className="rounded-xl border border-unjong-border bg-unjong-surface p-5">
            <h2 className="mb-1 text-base font-bold text-unjong-primary">{p.t}</h2>
            <p className="text-sm leading-relaxed text-unjong-muted">{p.d}</p>
          </section>
        ))}
      </div>

      <blockquote className="mt-10 border-l-2 border-unjong-accent pl-4 text-sm italic leading-relaxed text-unjong-muted">
        “사람이 할 수 있는 가장 좋은 일은, 다른 사람이 더 많이 알도록 돕는 것이다.”
        <footer className="mt-1 text-xs not-italic text-unjong-muted/80">— 찰리 멍거</footer>
      </blockquote>

      <p className="mt-10 text-xs leading-relaxed text-unjong-muted">
        트릴리언은 금융상품의 매매·중개·투자자문을 제공하지 않으며, 어떠한 거래도 중개하지 않습니다. 트릴리언이 제공하는 정보는 참고용이며, 투자 권유나 자문이 아닙니다.
      </p>
    </div>
  );
}
