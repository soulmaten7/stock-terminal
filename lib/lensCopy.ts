// 렌즈 겉면 카피 — 언어별 맵(원본 = docs/LENS_COPY.md). 이름=영문 앵커(코드 별도)·설명만 언어별.
// 원칙: 각 언어답게(직역 아님)·짧고 구체·번역 안전. 자동번역 X. 기본 ko, ?lang=en 지원. 다음: ja·zh 열 추가.
// what=겉면 한 줄(뭔지) · about=알아보기(개념·유래·왜 쓰나). note(자세히·검증)는 아직 lib/lenses에.

export type Locale = "ko" | "en";
type LensText = { name: string; what: string; about: string };
type FscoreText = { name: string; subtitle: string; what: string; na: string; about: string };

export const LENS_COPY: Record<Locale, {
  momentum: LensText; lowvol: LensText; valuation: LensText; quality: LensText; technical: LensText; fscore: FscoreText;
}> = {
  ko: {
    momentum: {
      name: "모멘텀",
      what: "요즘 강하게 오른 종목이 계속 갈지 보는 방법 — 오르는 흐름이 이어지는 장에 잘 맞아요.",
      about: "오른 주식은 한동안 더 오르는 '관성'이 시장에 있다는 아이디어예요. 1993년 제가디시·티트만이 데이터로 처음 밝혔고, 좋은 소식에 사람들이 천천히 반응하는 심리 때문이라 봐요 — 그래서 최근 강한 주식을 따라가는 추세추종에 씁니다.",
    },
    lowvol: {
      name: "저변동성",
      what: "덜 출렁이는 안정적인 종목인지 보는 방법 — 하락장에서 방어적으로 유용해요.",
      about: "덜 흔들리는 안정적 주식이 크게 요동치는 주식보다 위험 대비 성과가 낫다는 발견이에요(저변동성 이례현상). '대박'을 노려 변동 큰 주식에 사람이 몰려 비싸지고, 지루한 우량주는 저평가되기 때문이라 설명해요 — 방어·위험 관리에 씁니다.",
    },
    valuation: {
      name: "밸류(가치)",
      what: "버는 돈·가진 자산에 비해 주가가 싼지 보는 방법 — 길게 보는 투자에 잘 맞아요.",
      about: "기업의 이익·순자산에 비해 주가가 싼 '가치주'를 사는 접근이에요. 벤저민 그레이엄의 가치투자에서 출발해, 파마·프렌치가 '싼 주식이 장기적으로 낫다'(가치 프리미엄)를 데이터로 정립했어요 — 시장이 인기 없는 주식을 과하게 싸게 판다는 생각이 바탕이에요.",
    },
    quality: {
      name: "퀄리티",
      what: "회사가 자산 대비 돈을 잘 버는 '알짜'인지 보는 방법 — 튼튼한 우량주를 고를 때 잘 맞아요.",
      about: "매출총이익을 자산으로 나눈 '총수익성'으로 회사의 질을 보는 방법이에요. 노비-마르크스가 2013년 '싼 것(가치)만큼 질 좋은 것도 중요하다'며 데이터로 밝혔어요 — 자산을 잘 굴려 꾸준히 돈 버는 회사가 장기적으로 낫다는 생각이 바탕이에요.",
    },
    technical: {
      name: "기술",
      what: "차트로 지금 과열인지·흐름이 위인지 보는 방법 — 현재 상태를 빠르게 훑는 참고용이에요.",
      about: "차트의 가격·패턴으로 '지금 과열인지, 추세가 위인지'를 보는 전통적 기술적 분석이에요. RSI는 1978년 와일더가 만든 과열·침체 지표, 이동평균선은 일정 기간의 평균 가격이에요 — 단기 흐름을 빠르게 훑는 참고 도구예요(단독 신호로는 약함).",
    },
    fscore: {
      name: "F-스코어", subtitle: "재무 건전성",
      what: "회사 재무가 튼튼한지 9가지로 점수 매기는 방법 — 부실한 회사를 거르는 용도예요(수익 예측은 아님).",
      na: "이 종목은 은행·보험이라 점수를 낼 수 없어요 — 그런 회사는 재무 구조가 보통 기업과 달라서요.",
      about: "회계학자 피오트로스키가 2000년 만든, 기업 재무 건강을 9개 항목으로 점수 매기는 체크리스트예요(수익성·부채·효율의 전년 대비 개선). 원래 값싼 가치주 중 '진짜 부실한 곳'을 걸러내려 만들었어요 — 그래서 수익 예측이 아니라 재무 건전성 판단에 씁니다.",
    },
  },
  en: {
    momentum: {
      name: "Momentum",
      what: "Whether a stock that's been climbing keeps climbing — best when trends hold.",
      about: "The idea that stocks which have been rising tend to keep rising for a while — a kind of market inertia. Jegadeesh and Titman first showed it in the data in 1993, often explained by investors reacting slowly to good news. It's the basis of trend-following: ride the recent winners.",
    },
    lowvol: {
      name: "Low Volatility",
      what: "How steady (rather than jumpy) a stock is — handy for playing defense in down markets.",
      about: "The finding that calmer, steadier stocks tend to do better per unit of risk than wild, jumpy ones (the low-volatility anomaly). One story: people chase big-swing names hoping for a jackpot and bid them up, while boring quality names get left cheap. Used for defense and risk management.",
    },
    valuation: {
      name: "Value",
      what: "Whether the price looks cheap next to a company's earnings and assets — suited to the long game.",
      about: "Buying stocks priced cheap relative to a company's earnings and net assets. It traces back to Benjamin Graham's value investing, and Fama and French established in the data that cheap stocks tend to win over the long run (the value premium). The premise: the market oversells unpopular stocks.",
    },
    quality: {
      name: "Quality",
      what: "How efficiently a company turns its assets into profit — good for finding sturdy, high-quality names.",
      about: "Gauges company quality by gross profits divided by assets ('gross profitability'). Novy-Marx showed in 2013 that quality matters as much as cheapness — companies that reliably squeeze profit from their assets tend to do better over the long run.",
    },
    technical: {
      name: "Technical",
      what: "Reads the chart for overheating and which way the trend leans — a quick gut-check, for reference only.",
      about: "Traditional technical analysis — reading price and chart patterns to gauge whether a stock is overheated or which way the trend leans. RSI (Welles Wilder, 1978) flags overbought/oversold; a moving average is just the average price over a period. A quick scan of short-term momentum (weak on its own).",
    },
    fscore: {
      name: "F-Score", subtitle: "financial health",
      what: "Scores a company's financial health across 9 checks — a filter to weed out weak balance sheets (not a return forecast).",
      na: "Can't be scored here — banks and insurers are built differently, so these checks don't apply.",
      about: "A checklist created by accounting professor Piotroski in 2000 that scores financial health on 9 points (year-over-year gains in profitability, debt, and efficiency). It was built to weed out the genuinely weak names among cheap value stocks — so it judges financial health, not future returns.",
    },
  },
};

export function pickLocale(v: string | null | undefined): Locale {
  return v === "en" ? "en" : "ko";
}
