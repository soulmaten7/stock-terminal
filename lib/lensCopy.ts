// 렌즈 겉면 카피 — 언어별 맵(원본 = docs/LENS_COPY.md). 이름=영문 앵커(코드 별도)·설명만 언어별.
// 원칙: 각 언어답게(직역 아님)·짧고 구체·번역 안전. 자동번역 X. 기본 ko, ?lang=en 지원. 다음: ja·zh 열 추가.
// what=겉면 한 줄(뭔지) · about=알아보기(개념·유래·왜 쓰나). note(자세히·검증)는 아직 lib/lenses에.

export type Locale = "ko" | "en";
type LensText = { name: string; what: string; about: string };
type FscoreText = { name: string; subtitle: string; what: string; na: string; about: string };

export const LENS_COPY: Record<Locale, {
  momentum: LensText; lowvol: LensText; valuation: LensText; quality: LensText; assetgrowth: LensText; technical: LensText; fscore: FscoreText;
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
    assetgrowth: {
      name: "자산성장",
      what: "회사가 자산(몸집)을 얼마나 빠르게 불리는지 보는 방법 — 너무 공격적으로 키우면 이후 성과가 약한 편이에요.",
      about: "회사가 설비 투자·인수 등으로 자산을 얼마나 공격적으로 늘리는지 보는 지표예요. 2008년 쿠퍼·굴렌·실이 '자산을 빠르게 불린 회사일수록 이후 수익은 오히려 약하다'를 데이터로 밝혔어요(과잉 투자·무리한 확장 경계). 파마·프렌치 5팩터 중 투자 팩터(CMA)이기도 해요 — 자본을 신중히 쓰는 회사를 선호하는 관점이에요.",
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
    assetgrowth: {
      name: "Asset Growth",
      what: "How fast a company is expanding its asset base — growing too aggressively has historically meant weaker returns afterward.",
      about: "Tracks how aggressively a company grows its assets through capex, acquisitions, and the like. Cooper, Gulen, and Schill showed in 2008 that firms expanding fastest tended to underperform later — a caution against overinvestment and empire-building. It's the investment factor (CMA) in the Fama-French five-factor model, favoring companies that spend capital with discipline.",
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

// ── 직관 판정(reading) — 렌즈가 이 종목을 어떻게 읽는지 "판정 문장 + 쉬운 해석"(상태별·언어별). ──
// 원칙: 예측 아님(상단 공통 전제) · 각 기법 시각 · 숫자는 카드에 그대로(근거 수치) · 쉬운말. 상태키=lib/lenses가 계산.
type Reading = { phrase: string; plain: string };
type LensReadings = Record<string, Reading>;

export const LENS_READINGS: Record<Locale, {
  momentum: LensReadings; lowvol: LensReadings; valuation: LensReadings; quality: LensReadings; assetgrowth: LensReadings; technical: LensReadings; fscore: LensReadings;
}> = {
  ko: {
    momentum: {
      up: { phrase: "강하게 오르는 흐름", plain: "최근 꾸준히 오르고 있어요. 이 기법은 오르던 흐름이 한동안 더 이어진다고 봐요." },
      flat: { phrase: "뚜렷한 방향은 없음", plain: "최근 오르내림이 섞여 방향이 뚜렷하지 않아요. 이 기법 시각에선 지금 신호가 약해요." },
      down: { phrase: "힘이 빠지는 흐름", plain: "최근 흐름이 약해지고 있어요. 이 기법은 약한 흐름도 한동안 이어지기 쉽다고 봐요." },
    },
    lowvol: {
      calm: { phrase: "차분하고 안정적", plain: "가격이 크게 출렁이지 않는 편이에요. 하락장에서 방어적으로 버티기 좋은 성격이에요." },
      mid: { phrase: "보통 수준의 변동", plain: "가격 변동이 특별히 크지도 작지도 않은 편이에요." },
      jumpy: { phrase: "출렁임이 큰 편", plain: "가격이 크게 요동치는 편이에요. 변동을 감당할 수 있을 때 어울려요." },
    },
    valuation: {
      cheap: { phrase: "이익 대비 싼 편", plain: "버는 돈에 비해 주가가 낮은 '가치주' 성격이에요. 길게 보는 투자에서 눈여겨보는 특징이에요." },
      mid: { phrase: "보통 수준의 가격", plain: "이익 대비 주가가 특별히 싸지도 비싸지도 않은 편이에요." },
      rich: { phrase: "이익 대비 비싼 편", plain: "버는 돈에 비해 주가가 높은 편이에요. 성장 기대가 미리 반영됐을 수 있어요." },
      na: { phrase: "값을 낼 수 없음", plain: "이익 정보가 없어 이 기법으론 판단하기 어려워요." },
    },
    quality: {
      high: { phrase: "알짜로 잘 버는 우량", plain: "자산 대비 이익을 꾸준히 잘 내는 회사예요. 질 좋은 우량주를 고를 때 눈여겨보는 특징이에요." },
      mid: { phrase: "보통 수준의 수익성", plain: "자산 대비 수익성이 특별히 높지도 낮지도 않은 편이에요." },
      low: { phrase: "수익성이 낮은 편", plain: "자산 대비 벌어들이는 이익이 적은 편이에요." },
      na: { phrase: "값을 낼 수 없음", plain: "은행 등은 매출총이익 구조가 달라 이 기법을 적용하지 않아요." },
    },
    assetgrowth: {
      aggressive: { phrase: "공격적으로 확장 중", plain: "자산을 빠르게 불리는 회사예요. 역사적으로 이렇게 급히 몸집을 키운 회사는 이후 성과가 약한 편이라, 참고해서 볼 신호예요." },
      mid: { phrase: "보통 속도로 성장", plain: "자산을 늘리는 속도가 과하지도 정체도 아닌 편이에요." },
      conservative: { phrase: "보수적으로 운영", plain: "자산을 무리해서 늘리지 않는 편이에요. 역사적으로 자본을 아껴 쓰는 회사가 이후 성과가 나은 편이었어요." },
      na: { phrase: "값을 낼 수 없음", plain: "재무 정보가 부족해 이 기법으론 판단하기 어려워요." },
    },
    technical: {
      up: { phrase: "추세는 위쪽", plain: "지금 가격이 장기 평균선 위에 있어요. 단기 흐름을 빠르게 훑는 참고용이에요." },
      flat: { phrase: "방향은 뚜렷하지 않음", plain: "장기 평균선 근처를 오가는 상태예요. 참고용으로만 보세요." },
      down: { phrase: "추세는 아래쪽", plain: "지금 가격이 장기 평균선 아래에 있어요. 단기 상태를 참고하는 용도예요." },
    },
    fscore: {
      strong: { phrase: "재무가 튼튼한 편", plain: "재무 건전성이 좋은 편이에요 — 9개 중 대부분 통과. 부실할 가능성은 낮아요(단, 오를지 예측은 아니에요)." },
      mid: { phrase: "보통 수준의 재무", plain: "재무 건전성은 중간이에요 — 아주 튼튼하지도, 부실하지도 않아요. 부실 회사를 거를 때 보는 참고용이지 오를지 예측은 아니에요." },
      weak: { phrase: "부실 신호 주의", plain: "재무가 약한 편이에요 — 통과 항목이 적어요. 부실 위험을 참고하는 신호예요(예측은 아님)." },
      na: { phrase: "점수를 낼 수 없음", plain: "은행·보험은 재무 구조가 달라 이 점수를 적용하지 않아요." },
    },
  },
  en: {
    momentum: {
      up: { phrase: "Climbing strongly", plain: "It's been rising steadily. This lens expects an existing uptrend to persist for a while." },
      flat: { phrase: "No clear direction", plain: "Recent moves are mixed, with no clear trend. The signal is weak here right now." },
      down: { phrase: "Losing steam", plain: "The trend has been weakening. This lens expects a weak trend to tend to persist too." },
    },
    lowvol: {
      calm: { phrase: "Calm and steady", plain: "The price doesn't swing much — a defensive profile that tends to hold up in down markets." },
      mid: { phrase: "Average swings", plain: "Volatility is neither especially high nor low." },
      jumpy: { phrase: "Swings a lot", plain: "The price moves sharply. Suits you when you can stomach the swings." },
    },
    valuation: {
      cheap: { phrase: "Cheap vs. earnings", plain: "The price is low relative to what it earns — a value profile worth watching in the long game." },
      mid: { phrase: "Fairly priced", plain: "The price isn't especially cheap or expensive versus earnings." },
      rich: { phrase: "Pricey vs. earnings", plain: "The price is high relative to earnings — growth expectations may be priced in." },
      na: { phrase: "Can't be scored", plain: "No earnings data, so this lens can't judge it." },
    },
    quality: {
      high: { phrase: "A sturdy earner", plain: "It reliably turns assets into profit — a high-quality profile worth watching." },
      mid: { phrase: "Average profitability", plain: "Profitability versus assets is neither especially high nor low." },
      low: { phrase: "Low profitability", plain: "It earns relatively little from its assets." },
      na: { phrase: "Can't be scored", plain: "Banks and the like are built differently, so this lens doesn't apply." },
    },
    assetgrowth: {
      aggressive: { phrase: "Expanding aggressively", plain: "It's growing assets fast. Historically, companies that bulk up this quickly have tended to lag afterward — a signal to watch." },
      mid: { phrase: "Growing at a normal pace", plain: "It's growing assets at neither an excessive nor a stalled pace." },
      conservative: { phrase: "Runs conservatively", plain: "It doesn't overextend its assets. Historically, disciplined spenders have tended to fare better afterward." },
      na: { phrase: "Can't be scored", plain: "Not enough financial data for this lens to judge." },
    },
    technical: {
      up: { phrase: "Trend leans up", plain: "The price sits above its long-term average. A quick read of short-term action, for reference." },
      flat: { phrase: "No clear trend", plain: "It's hovering near its long-term average. Treat this as reference only." },
      down: { phrase: "Trend leans down", plain: "The price sits below its long-term average. For reference on the current state." },
    },
    fscore: {
      strong: { phrase: "Financially sturdy", plain: "It passes many of the 9 checks — solid financial health (not a return forecast)." },
      mid: { phrase: "Middling financials", plain: "It passes about half of the 9 checks." },
      weak: { phrase: "Watch for weakness", plain: "It passes few checks — financials may be weak, so look carefully." },
      na: { phrase: "Can't be scored", plain: "Banks and insurers are built differently, so this score doesn't apply." },
    },
  },
};

// 스펙트럼 3구간 라벨 [왼쪽, 가운데, 오른쪽] — 이 종목이 이 기법 눈엔 어디쯤인지 위치로. 켜지는 칸=lib/lenses가 상태로 계산.
export const SPECTRUM_LABELS: Record<Locale, {
  momentum: [string, string, string]; lowvol: [string, string, string]; valuation: [string, string, string]; quality: [string, string, string]; assetgrowth: [string, string, string]; technical: [string, string, string]; fscore: [string, string, string];
}> = {
  ko: {
    momentum: ["약세", "중립", "강세"],
    lowvol: ["안정적", "보통", "출렁임"],
    valuation: ["싼 편", "보통", "비싼 편"],
    quality: ["낮음", "보통", "알짜"],
    assetgrowth: ["보수적", "보통", "공격적"],
    technical: ["추세 아래", "중립", "추세 위"],
    fscore: ["약함", "보통", "튼튼"],
  },
  en: {
    momentum: ["Weak", "Neutral", "Strong"],
    lowvol: ["Calm", "Average", "Jumpy"],
    valuation: ["Cheap", "Fair", "Pricey"],
    quality: ["Low", "Average", "High"],
    assetgrowth: ["Conservative", "Moderate", "Aggressive"],
    technical: ["Below", "Neutral", "Above"],
    fscore: ["Weak", "Medium", "Strong"],
  },
};

export function pickLocale(v: string | null | undefined): Locale {
  return v === "en" ? "en" : "ko";
}
