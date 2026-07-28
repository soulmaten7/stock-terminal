// 렌즈 겉면 카피 — 언어별 맵(원본 = docs/LENS_COPY.md). 이름=영문 앵커(코드 별도)·설명만 언어별.
// 원칙: 각 언어답게(직역 아님)·짧고 구체·번역 안전. 자동번역 X. 기본 ko, ?lang=en 지원. 다음: ja·zh 열 추가.
// what=겉면 한 줄(뭔지) · about=알아보기(개념·유래·왜 쓰나) · note=자세히(백테스트 근거·한계).
// ⚠️ note의 en은 "정확 번역" — 통계·수치·레퍼런스(t값·샤프·βHML·STEP번호·%·$5+)를 한 글자도 바꾸지 않는다(검증 결과가 곧 신뢰).

export type Locale = "ko" | "en";
// question = 카드 제목용 초보자 질문형(STEP 787) — name·nameEn(학술 앵커)은 6곳 소비처(문장·pill·프롬프트)가 있어 rename 대신 이 필드를 신설.
// shortLabel = 종합 카드의 강점/주의 나열용 짧은 쉬운 라벨(STEP 788) — question(질문형·긴 문장)과도, name(학술 앵커)과도 다른 세 번째 용도.
type LensText = { name: string; question: string; shortLabel: string; what: string; about: string; note: string };
type FscoreText = { name: string; subtitle: string; question: string; shortLabel: string; what: string; na: string; about: string };

export const LENS_COPY: Record<Locale, {
  momentum: LensText; lowvol: LensText; valuation: LensText; quality: LensText; assetgrowth: LensText; technical: LensText; fscore: FscoreText;
}> = {
  ko: {
    momentum: {
      name: "모멘텀",
      question: "최근 오름세가 강한가?",
      shortLabel: "오름세",
      what: "요즘 강하게 오른 종목이 계속 갈지 보는 방법 — 오르는 흐름이 이어지는 장에 잘 맞아요.",
      about: "오른 주식은 한동안 더 오르는 '관성'이 시장에 있다는 아이디어예요. 1993년 제가디시·티트만이 데이터로 처음 밝혔고, 좋은 소식에 사람들이 천천히 반응하는 심리 때문이라 봐요 — 그래서 최근 강한 주식을 따라가는 추세추종에 씁니다.",
      note: "12-1 모멘텀(Jegadeesh-Titman): 롱숏(고−저 3분위·150개월) 백테스트에서 방향성이 통계적으로 유의(t≈2.5·샤프 0.71·양(+)의 달 67%), 거래비용 차감·시장/규모/가치(FF3) 조정 후에도 유지 — '추세 지속' 방향은 견고. 단 수익 '수준'은 생존편향·동일가중으로 부풀려져 실전 기대치 아님(방향이 맞다는 뜻이지 수익 보장 아님). 주가 $5+ 투자가능 종목 한정 — 페니스탁 포함 시 역전. · 3중 교차검증(초·중·후반 3구간·STEP559): 3구간 모두 +방향(전체 t≈3.6), 성장주 강세기(fold2)만 약화되나 부호 유지 = 시기 무관 단단.",
    },
    lowvol: {
      name: "저변동성",
      question: "가격이 많이 출렁이나?",
      shortLabel: "가격 출렁임",
      what: "덜 출렁이는 안정적인 종목인지 보는 방법 — 하락장에서 방어적으로 유용해요.",
      about: "덜 흔들리는 안정적 주식이 크게 요동치는 주식보다 위험 대비 성과가 낫다는 발견이에요(저변동성 이례현상). '대박'을 노려 변동 큰 주식에 사람이 몰려 비싸지고, 지루한 우량주는 저평가되기 때문이라 설명해요 — 방어·위험 관리에 씁니다.",
      note: "저변동성: 백테스트(투자가능 $5+·161개월)에서 저변동군 위험이 고변동군의 ~18%로 극적으로 낮고(방어), 위험조정 알파 유의(CAPM t≈3.1·FF3 t≈2.6, 시장베타 음(−)=방어적). 회전율 낮아 거래비용에도 강함 → 위험관리·방어 렌즈로 유효. 단 '저변동이 수익도 더 높다'는 단순 수익차는 통계적으로 약함(롱숏 t≈1.6), 수준도 편향 과대 → 수익 우위 단정 아님, 위험대비가 핵심. 보장 아님. · 3중 교차검증(STEP559): 단순 저−고 수익 롱숏은 3구간서 음수·부호 뒤집힘 = '저변동이 수익도 더 높다'는 아님 재확인. 이 렌즈 근거는 raw 수익이 아니라 위험대비 방어(위험조정 알파·낮은 위험)임.",
    },
    valuation: {
      name: "밸류(가치)",
      question: "버는 것에 비해 싼가?",
      shortLabel: "가격 대비 가치",
      what: "버는 돈·가진 자산에 비해 주가가 싼지 보는 방법 — 길게 보는 투자에 잘 맞아요.",
      about: "기업의 이익·순자산에 비해 주가가 싼 '가치주'를 사는 접근이에요. 벤저민 그레이엄의 가치투자에서 출발해, 파마·프렌치가 '싼 주식이 장기적으로 낫다'(가치 프리미엄)를 데이터로 정립했어요 — 시장이 인기 없는 주식을 과하게 싸게 판다는 생각이 바탕이에요.",
      note: "밸류(가치)는 학계 정설 팩터(Fama-French HML) — 우리 백테스트도 이를 재현(βHML≈0.71). 단 우리 표본(2010~24) 월별 롱숏에선 통계적으로 약함(E/P t≈0.9·B/M t≈1.5, 유의 미달) — 최근 ~15년 가치주 부진(성장주 우위)과 일치. 방향은 +(연 +6~9%)·연1회 리밸런스라 비용 낮으나 '지금 시기 유효'라 단정 못 함. PER·PBR은 단일종목 절대값이라 같은 업종 내 상대비교로(섹터·성장성 무시 오독). 예측·보장 아님. · 3중 교차검증(코호트 3분할·STEP560): fold2(2016~20 성장주 강세기) 방향 역전 = 표본 약함 + 시기 의존(가치주 부진기엔 안 됨). βHML0.72로 학계 HML은 재확인.",
    },
    quality: {
      name: "퀄리티",
      question: "돈을 잘 버는 회사인가?",
      shortLabel: "돈 버는 힘",
      what: "회사가 자산 대비 돈을 잘 버는 '알짜'인지 보는 방법 — 튼튼한 우량주를 고를 때 잘 맞아요.",
      about: "매출총이익을 자산으로 나눈 '총수익성'으로 회사의 질을 보는 방법이에요. 노비-마르크스가 2013년 '싼 것(가치)만큼 질 좋은 것도 중요하다'며 데이터로 밝혔어요 — 자산을 잘 굴려 꾸준히 돈 버는 회사가 장기적으로 낫다는 생각이 바탕이에요.",
      note: "퀄리티(Gross Profitability, Novy-Marx): 매출총이익/총자산. 백테스트(투자가능 $5+·13코호트) 고−저 롱숏 t≈2.9·샤프 0.78·FF3 알파 t≈2.5(시장/규모/가치 넘는 독립 프리미엄)·회전율 낮아 비용 강건 → 검증. 단 수익 '수준'은 생존편향·동일가중으로 과대(방향·유의만 신뢰). ROE는 별도 검증서 유의 미달(대형주 편중)이라 제외. 은행은 매출총이익 구조상 미적용. · 3중 교차검증(코호트 3분할·STEP560): 3/3 구간 +방향·전체 t≈3.2·FF3 알파 t≈2.75(βHML−0.22 독립) = 검증 재확인, 7렌즈 중 가장 단단.",
    },
    assetgrowth: {
      name: "자산성장",
      question: "몸집을 무리하게 불리지 않았나?",
      shortLabel: "몸집 관리",
      what: "회사가 자산(몸집)을 얼마나 빠르게 불리는지 보는 방법 — 너무 공격적으로 키우면 이후 성과가 약한 편이에요.",
      about: "회사가 설비 투자·인수 등으로 자산을 얼마나 공격적으로 늘리는지 보는 지표예요. 2008년 쿠퍼·굴렌·실이 '자산을 빠르게 불린 회사일수록 이후 수익은 오히려 약하다'를 데이터로 밝혔어요(과잉 투자·무리한 확장 경계). 파마·프렌치 5팩터 중 투자 팩터(CMA)이기도 해요 — 자본을 신중히 쓰는 회사를 선호하는 관점이에요.",
      note: "자산성장(Asset Growth·투자팩터 — Cooper-Gulen-Schill 2008 / Fama-French 5팩터 CMA): 총자산 전년比 증가율. 백테스트(투자가능 $5+·13코호트) 저−고(보수−공격) 롱숏 방향은 +(연 ~+8%)이고 시장·규모·가치(FF3)와 독립적(βHML≈0.17 — 밸류의 재포장이 아닌 별개의 '자본 규율' 축)이나, 우리 표본선 통계적으로 유의 미달(t≈1.6). → '자산을 공격적으로 키운 회사가 이후 수익이 약한 편'이라는 방향은 학계 정설(과잉투자 경계)이나 우리 데이터론 확신 못 함(표본 약함). 자본 규율의 참고 축으로 보세요. 예측·보장 아님. 은행 등은 자산 성격이 달라 해석 주의. · 3중 교차검증(코호트 3분할·STEP560): 3구간 방향 3/3 일관(단 각 구간 t<2) — 표본약함이나 방향은 시기 무관 일관(밸류보다 견고).",
    },
    technical: {
      name: "기술",
      question: "지금 흐름이 위인가, 아래인가?",
      shortLabel: "단기 흐름",
      what: "차트로 지금 과열인지·흐름이 위인지 보는 방법 — 현재 상태를 빠르게 훑는 참고용이에요.",
      about: "차트의 가격·패턴으로 '지금 과열인지, 추세가 위인지'를 보는 전통적 기술적 분석이에요. RSI는 1978년 와일더가 만든 과열·침체 지표, 이동평균선은 일정 기간의 평균 가격이에요 — 단기 흐름을 빠르게 훑는 참고 도구예요(단독 신호로는 약함).",
      note: "기술 신뢰도 재검(월별 롱숏·153개월): RSI 침체매수(저RSI−고RSI)는 오히려 손실(연 −8.7%·CAPM 알파 t≈−2.0로 유의하게 음)이고 회전율 66%로 비용 최악 → 평균회귀 완전 기각(과열=모멘텀이 이김). 200일선 위−아래는 방향 +지만 통계 약함(t≈1.6)이고 모멘텀 팩터에 흡수 = 독립 신호 아님(모멘텀의 약한 사촌). → RSI·52주위치·이동평균은 '지금 상태' 표시일 뿐 매매신호 아님, 추세는 모멘텀 렌즈로. 참고용. · 3중 교차검증(STEP559): 200일선 추세 성분은 3구간 견고(t≈2.7)하나 FF3는 모멘텀을 통제하지 못함 — 이 견고함은 모멘텀과 겹치는 신호일 뿐(독립 아님). 이미 모멘텀으로 검증된 방향이라 여기선 참고용 유지.",
    },
    fscore: {
      name: "F-스코어", subtitle: "재무 건전성",
      question: "재무가 튼튼한가?",
      shortLabel: "재무 건전성",
      what: "재무가 튼튼한지 9가지로 점수 매겨요 — 돈 잘 버는지, 빚 감당되는지, 작년보다 나아졌는지.",
      na: "이 종목은 은행·보험이라 점수를 낼 수 없어요 — 그런 회사는 재무 구조가 보통 기업과 달라서요.",
      about: "회계학자 피오트로스키가 2000년 만든, 기업 재무 건강을 9개 항목으로 점수 매기는 체크리스트예요(수익성·부채·효율의 전년 대비 개선). 원래 값싼 가치주 중 '진짜 부실한 곳'을 걸러내려 만들었어요 — 그래서 수익 예측이 아니라 재무 건전성 판단에 씁니다.",
    },
  },
  en: {
    momentum: {
      name: "Momentum",
      question: "Is the recent uptrend strong?",
      shortLabel: "Uptrend",
      what: "Whether a stock that's been climbing keeps climbing — best when trends hold.",
      about: "The idea that stocks which have been rising tend to keep rising for a while — a kind of market inertia. Jegadeesh and Titman first showed it in the data in 1993, often explained by investors reacting slowly to good news. It's the basis of trend-following: ride the recent winners.",
      note: "12-1 Momentum (Jegadeesh-Titman): in our long-short backtest (top−bottom tercile, 150 months) the direction is statistically significant (t≈2.5, Sharpe 0.71, 67% positive months) and it survives transaction costs and adjustment for market/size/value (FF3) — the 'trends persist' direction is robust. But the return 'level' is inflated by survivorship bias and equal weighting, so it is not a realistic expectation (the direction holds; returns are not guaranteed). Limited to investable stocks priced $5+ — including penny stocks reverses the result. · Triple cross-validation (early/middle/late thirds, STEP559): all three folds point the same way (overall t≈3.6); only the growth-led stretch (fold2) weakens, but the sign holds = solid regardless of period.",
    },
    lowvol: {
      name: "Low Volatility",
      question: "Does the price swing a lot?",
      shortLabel: "Price swings",
      what: "How steady (rather than jumpy) a stock is — handy for playing defense in down markets.",
      about: "The finding that calmer, steadier stocks tend to do better per unit of risk than wild, jumpy ones (the low-volatility anomaly). One story: people chase big-swing names hoping for a jackpot and bid them up, while boring quality names get left cheap. Used for defense and risk management.",
      note: "Low Volatility: in our backtest (investable, $5+, 161 months) the low-volatility group carries dramatically less risk — roughly 18% of the high-volatility group's (defensive) — and its risk-adjusted alpha is significant (CAPM t≈3.1, FF3 t≈2.6; negative market beta = defensive). Low turnover makes it robust to transaction costs → it holds up as a risk-management and defense lens. But the plain claim that 'low volatility also earns more' is statistically weak (long-short t≈1.6) and the level is overstated by bias → no claim of higher returns; risk-adjusted performance is the point. Not a guarantee. · Triple cross-validation (STEP559): the plain low−high return long-short is negative and flips sign across the three folds = confirmation that 'low volatility earns more' does not hold. This lens rests on risk-adjusted defense (risk-adjusted alpha, low risk), not on raw returns.",
    },
    valuation: {
      name: "Value",
      question: "Is it cheap for what it earns?",
      shortLabel: "Value",
      what: "Whether the price looks cheap next to a company's earnings and assets — suited to the long game.",
      about: "Buying stocks priced cheap relative to a company's earnings and net assets. It traces back to Benjamin Graham's value investing, and Fama and French established in the data that cheap stocks tend to win over the long run (the value premium). The premise: the market oversells unpopular stocks.",
      note: "Value is an established academic factor (Fama-French HML) — our backtest reproduces it (βHML≈0.71). But in our sample (2010~24) the monthly long-short is statistically weak (E/P t≈0.9, B/M t≈1.5 — short of significance), consistent with value's slump over the past ~15 years (growth has led). The direction is positive (+6~9% a year) and rebalancing once a year keeps costs low, but we cannot claim it 'works in the current period'. PER and PBR are absolute figures for a single stock, so compare within the same industry (ignoring sector and growth invites misreading). Not a prediction or a guarantee. · Triple cross-validation (3 cohort folds, STEP560): fold2 (2016~20, the growth-led stretch) reverses direction = weak sample plus period dependence (it does not work while value is out of favor). βHML 0.72 reconfirms the academic HML.",
    },
    quality: {
      name: "Quality",
      question: "Does it earn well?",
      shortLabel: "Profitability",
      what: "How efficiently a company turns its assets into profit — good for finding sturdy, high-quality names.",
      about: "Gauges company quality by gross profits divided by assets ('gross profitability'). Novy-Marx showed in 2013 that quality matters as much as cheapness — companies that reliably squeeze profit from their assets tend to do better over the long run.",
      note: "Quality (Gross Profitability, Novy-Marx): gross profit / total assets. In our backtest (investable, $5+, 13 cohorts) the high−low long-short shows t≈2.9, Sharpe 0.78 and FF3 alpha t≈2.5 (an independent premium beyond market/size/value), and low turnover makes it robust to costs → verified. But the return 'level' is overstated by survivorship bias and equal weighting (trust the direction and the significance only). ROE fell short of significance in a separate test (skewed toward large caps), so it is excluded. Banks do not apply — gross profit does not work the same way for them. · Triple cross-validation (3 cohort folds, STEP560): 3/3 folds point the same way, overall t≈3.2, FF3 alpha t≈2.75 (βHML−0.22, independent) = verification reconfirmed; the sturdiest of the 7 lenses.",
    },
    assetgrowth: {
      name: "Asset Growth",
      question: "Did it expand too fast?",
      shortLabel: "Asset discipline",
      what: "How fast a company is expanding its asset base — growing too aggressively has historically meant weaker returns afterward.",
      about: "Tracks how aggressively a company grows its assets through capex, acquisitions, and the like. Cooper, Gulen, and Schill showed in 2008 that firms expanding fastest tended to underperform later — a caution against overinvestment and empire-building. It's the investment factor (CMA) in the Fama-French five-factor model, favoring companies that spend capital with discipline.",
      note: "Asset Growth (the investment factor — Cooper-Gulen-Schill 2008 / CMA in the Fama-French 5-factor model): year-over-year growth in total assets. In our backtest (investable, $5+, 13 cohorts) the low−high (conservative−aggressive) long-short points positive (~+8% a year) and is independent of market/size/value (FF3) (βHML≈0.17 — a separate axis of 'capital discipline', not value repackaged), but it falls short of statistical significance in our sample (t≈1.6). → The direction — 'companies that expand assets aggressively tend to earn less afterward' — is academic consensus (a caution against overinvestment), but our data cannot confirm it (weak sample). Treat it as a reference axis for capital discipline. Not a prediction or a guarantee. Banks and the like hold assets of a different nature, so interpret with care. · Triple cross-validation (3 cohort folds, STEP560): the direction is consistent in 3/3 folds (though t<2 within each) — a weak sample, but the direction holds regardless of period (sturdier than value).",
    },
    technical: {
      name: "Technical",
      question: "Is the current trend up or down?",
      shortLabel: "Short-term trend",
      what: "Reads the chart for overheating and which way the trend leans — a quick gut-check, for reference only.",
      about: "Traditional technical analysis — reading price and chart patterns to gauge whether a stock is overheated or which way the trend leans. RSI (Welles Wilder, 1978) flags overbought/oversold; a moving average is just the average price over a period. A quick scan of short-term momentum (weak on its own).",
      note: "Re-examining technical reliability (monthly long-short, 153 months): buying oversold RSI (low RSI − high RSI) actually loses money (−8.7% a year; CAPM alpha t≈−2.0, significantly negative) and its 66% turnover makes the cost drag the worst of the lot → mean reversion is rejected outright (on overheating, momentum wins). Above−below the 200-day line does point the right way, but it is statistically weak (t≈1.6) and is absorbed by the momentum factor = not an independent signal (a weak cousin of momentum). → RSI, 52-week position and moving averages only show 'where things stand now'; they are not trade signals. For trend, use the momentum lens. Reference only. · Triple cross-validation (STEP559): the 200-day trend component is robust across the three folds (t≈2.7), but FF3 does not control for momentum — that robustness is merely a signal overlapping momentum (not independent). The direction is already verified by momentum, so this stays reference-only.",
    },
    fscore: {
      name: "F-Score", subtitle: "financial health",
      question: "Are the financials solid?",
      shortLabel: "Financial health",
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
      up: { phrase: "강한 상승 추세", plain: "최근 꾸준히 오르고 있어요. 이 기법은 오르던 흐름이 한동안 더 이어진다고 봐요." },
      flat: { phrase: "뚜렷한 추세 없음", plain: "최근 오르내림이 섞여 방향이 뚜렷하지 않아요. 이 기법 시각에선 지금 신호가 약해요." },
      down: { phrase: "하락 추세", plain: "최근 흐름이 약해지고 있어요. 이 기법은 약한 흐름도 한동안 이어지기 쉽다고 봐요." },
    },
    lowvol: {
      calm: { phrase: "낮은 변동성", plain: "가격이 크게 출렁이지 않는 편이에요. 하락장에서 방어적으로 버티기 좋은 성격이에요." },
      mid: { phrase: "보통 변동성", plain: "가격 변동이 특별히 크지도 작지도 않은 편이에요." },
      jumpy: { phrase: "높은 변동성", plain: "가격이 크게 요동치는 편이에요. 변동을 감당할 수 있을 때 어울려요." },
    },
    valuation: {
      cheap: { phrase: "이익 대비 싼 편", plain: "버는 돈에 비해 주가가 낮은 '가치주' 성격이에요. 길게 보는 투자에서 눈여겨보는 특징이에요." },
      mid: { phrase: "이익 대비 보통", plain: "이익 대비 주가가 특별히 싸지도 비싸지도 않은 편이에요." },
      rich: { phrase: "이익 대비 비싼 편", plain: "버는 돈에 비해 주가가 높은 편이에요. 성장 기대가 미리 반영됐을 수 있어요." },
      na: { phrase: "산출 불가", plain: "이익 정보가 없어 이 기법으론 판단하기 어려워요." },
    },
    quality: {
      high: { phrase: "높은 수익성", plain: "자산 대비 이익을 꾸준히 잘 내는 회사예요. 질 좋은 우량주를 고를 때 눈여겨보는 특징이에요." },
      mid: { phrase: "보통 수익성", plain: "자산 대비 수익성이 특별히 높지도 낮지도 않은 편이에요." },
      low: { phrase: "낮은 수익성", plain: "자산 대비 벌어들이는 이익이 적은 편이에요." },
      na: { phrase: "산출 불가", plain: "은행 등은 매출총이익 구조가 달라 이 기법을 적용하지 않아요." },
    },
    assetgrowth: {
      aggressive: { phrase: "공격적 확장", plain: "자산을 빠르게 불리는 회사예요. 역사적으로 이렇게 급히 몸집을 키운 회사는 이후 성과가 약한 편이라, 참고해서 볼 신호예요." },
      mid: { phrase: "보통 확장", plain: "자산을 늘리는 속도가 과하지도 정체도 아닌 편이에요." },
      conservative: { phrase: "보수적 운영", plain: "자산을 무리해서 늘리지 않는 편이에요. 역사적으로 자본을 아껴 쓰는 회사가 이후 성과가 나은 편이었어요." },
      na: { phrase: "산출 불가", plain: "재무 정보가 부족해 이 기법으론 판단하기 어려워요." },
    },
    technical: {
      up: { phrase: "상승 추세", plain: "지금 가격이 장기 평균선 위에 있어요. 단기 흐름을 빠르게 훑는 참고용이에요." },
      flat: { phrase: "추세 불분명", plain: "장기 평균선 근처를 오가는 상태예요. 참고용으로만 보세요." },
      down: { phrase: "하락 추세 (200일선 아래)", plain: "지금 가격이 장기 평균선 아래에 있어요. 단기 상태를 참고하는 용도예요." },
    },
    fscore: {
      strong: { phrase: "재무 건전", plain: "재무 건전성이 좋은 편이에요 — 9개 중 대부분 통과. 부실할 가능성은 낮아요(단, 오를지 예측은 아니에요)." },
      mid: { phrase: "재무 보통", plain: "재무 건전성은 중간이에요 — 아주 튼튼하지도, 부실하지도 않아요. 부실 회사를 거를 때 보는 참고용이지 오를지 예측은 아니에요." },
      weak: { phrase: "재무 취약", plain: "재무가 약한 편이에요 — 통과 항목이 적어요. 부실 위험을 참고하는 신호예요(예측은 아님)." },
      na: { phrase: "산출 불가", plain: "은행·보험은 재무 구조가 달라 이 점수를 적용하지 않아요." },
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

// "이 기법 방향" — 그 기법 '방법대로'의 방향(시간축 + 유리/불리/중립 + 정직 꼬리표). 예측 아님(역사적 base-rate 경향).
// 모든 기법이 수익 방향은 아님: 저변동=위험 / F-Score=건전성 / 기술=상태 축을 지킴.
export const LENS_OUTLOOK: Record<Locale, {
  momentum: Record<string, string>; lowvol: Record<string, string>; valuation: Record<string, string>; quality: Record<string, string>; assetgrowth: Record<string, string>; technical: Record<string, string>; fscore: Record<string, string>;
}> = {
  ko: {
    momentum: {
      up: "단기~중기 유리한 편 — 강한 추세는 역사적으로 한동안 이어지는 편이에요 (검증된 경향·보장은 아님).",
      flat: "지금은 뚜렷한 방향 없음 — 추세가 약해 이 기법 신호가 약해요.",
      down: "단기~중기 불리한 편 — 약한 흐름도 한동안 이어지기 쉬운 편이에요 (검증된 경향·보장 아님).",
    },
    lowvol: {
      calm: "위험: 낮은 편(방어적) — 수익 방향이 아니라 '덜 흔들린다'는 관점이에요.",
      mid: "위험: 보통 — 수익 방향이 아니라 변동성 관점이에요.",
      jumpy: "위험: 큰 편 — 크게 출렁여요. 변동을 감당할 수 있을 때 (수익 방향 아님).",
    },
    valuation: {
      cheap: "장기 유리한 편 — 싼 주식은 역사적으로 장기 우위 (가치 프리미엄, 단 최근 표본선 약함).",
      mid: "장기: 중립 — 가격이 특별히 싸지도 비싸지도 않아요.",
      rich: "장기 불리한 편 — 비싼 주식은 역사적으로 장기 수익이 약한 편 (단, 우리 표본선 약함).",
      na: "판단 불가 — 이익 정보가 없어요.",
    },
    quality: {
      high: "장기 유리한 편 — 알짜 우량주는 역사적으로 장기 우위 (검증된 경향).",
      mid: "장기: 중립 — 수익성이 특별히 높지도 낮지도 않아요.",
      low: "장기 불리한 편 — 수익성 낮은 회사는 역사적으로 장기 열위 (검증된 경향).",
      na: "판단 불가 — 은행 등은 이 기법 미적용.",
    },
    assetgrowth: {
      aggressive: "길게 보면 불리한 편 — 몸집을 공격적으로 키운 회사는 이후 성과가 약했어요 (다만 근거는 아직 약해요).",
      mid: "장기: 중립 — 성장 속도가 과하지도 정체도 아니에요.",
      conservative: "길게 보면 유리한 편 — 자본을 아껴 쓴 회사가 이후 더 나았어요 (다만 근거는 아직 약해요).",
      na: "판단 불가 — 재무 정보 부족.",
    },
    technical: {
      up: "단기 상태: 추세 위 — 참고용이에요 (모멘텀과 겹치는 신호).",
      flat: "단기 상태: 방향 불분명 — 참고용.",
      down: "단기 상태: 추세 아래 — 참고용이에요 (모멘텀과 겹치는 신호).",
    },
    fscore: {
      strong: "건전성: 좋은 편 — 부실 가능성 낮아요 (수익 방향 예측은 아님).",
      mid: "건전성: 중간 — 부실 회피 참고용이지 수익 방향은 아니에요.",
      weak: "건전성: 약한 편 — 부실 위험 참고 신호예요 (수익 방향 아님).",
      na: "점수 불가 — 은행·보험 미적용.",
    },
  },
  en: {
    momentum: {
      up: "Short-to-mid term: leans favorable — strong trends have historically tended to persist (validated tendency, not a guarantee).",
      flat: "No clear direction now — the trend is weak, so this lens' signal is faint.",
      down: "Short-to-mid term: leans unfavorable — weak trends have tended to persist too (validated, not a guarantee).",
    },
    lowvol: {
      calm: "Risk: low (defensive) — a risk view, not a return call.",
      mid: "Risk: average — a volatility view, not a return call.",
      jumpy: "Risk: high — it swings a lot; for those who can stomach it (not a return call).",
    },
    valuation: {
      cheap: "Long term: leans favorable — cheap stocks have historically won long-term (value premium; weak in our recent sample).",
      mid: "Long term: neutral — neither especially cheap nor pricey.",
      rich: "Long term: leans unfavorable — pricey stocks have historically lagged long-term (weak in our sample).",
      na: "Can't judge — no earnings data.",
    },
    quality: {
      high: "Long term: leans favorable — high-quality names have historically won long-term (validated).",
      mid: "Long term: neutral — profitability is middling.",
      low: "Long term: leans unfavorable — low-profitability names have historically lagged (validated).",
      na: "Can't judge — doesn't apply to banks etc.",
    },
    assetgrowth: {
      aggressive: "Long term: leans unfavorable — aggressive expanders have historically lagged afterward (weak in our sample).",
      mid: "Long term: neutral — growth pace is moderate.",
      conservative: "Long term: leans favorable — disciplined spenders have historically fared better (weak in our sample).",
      na: "Can't judge — not enough data.",
    },
    technical: {
      up: "Short-term state: trend up — reference only (overlaps momentum).",
      flat: "Short-term state: unclear — reference only.",
      down: "Short-term state: trend down — reference only (overlaps momentum).",
    },
    fscore: {
      strong: "Health: good — low distress odds (not a return forecast).",
      mid: "Health: medium — a distress-avoidance check, not a return call.",
      weak: "Health: weak — a distress-risk flag (not a return call).",
      na: "Can't score — doesn't apply to banks/insurers.",
    },
  },
};

// ── 근거 수치(detail) 라벨 — 키는 언어중립(stable), 표시만 언어별. ──
// 이전엔 한국어 리터럴이 곧 키였음(en 화면에 한국어 라벨 누출) → 키/라벨 분리.
// ⚠️ ko 값은 기존 lib/lenses.ts detail 키와 바이트 동일(KR 화면 무회귀 — lenses.charac.test.ts가 고정).
export type DetailKey =
  | "mom12_1" | "ret1m" | "ret3m" | "ret6m" | "ret12m"
  | "rsi14" | "ma200vs" | "pos52w"
  | "per" | "pbr"
  | "vol"
  | "gpa"
  | "ag";

export const DETAIL_LABELS: Record<Locale, Record<DetailKey, string>> = {
  ko: {
    mom12_1: "12-1모멘텀%", ret1m: "1개월%", ret3m: "3개월%", ret6m: "6개월%", ret12m: "12개월%",
    rsi14: "RSI(14)", ma200vs: "200일선대비%", pos52w: "52주위치%",
    per: "PER", pbr: "PBR",
    vol: "연변동성%",
    gpa: "GP/A%",
    ag: "자산성장%",
  },
  en: {
    mom12_1: "12-1 Momentum %", ret1m: "1M %", ret3m: "3M %", ret6m: "6M %", ret12m: "12M %",
    rsi14: "RSI(14)", ma200vs: "vs MA200 %", pos52w: "52W position %",
    per: "PER", pbr: "PBR",
    vol: "Ann. volatility %",
    gpa: "GP/A %",
    ag: "Asset growth %",
  },
};

// ── short/long 방향 라벨 — 상태키(언어중립) → 표시 라벨(언어별). ──
// 이전엔 lib/momentum·lowvol·technical과 lenses.ts 인라인이 한국어를 직접 반환(en 화면 누출·현재는 미렌더라 잠복).
// ⚠️ 임계값은 렌즈마다 달라(예: 저변동 라벨 25/45 vs 상태 20/40) 계산은 각 계산모듈이 그대로 하고, 여기선 "표시"만 한다.
// ⚠️ ko 값 = 기존 한국어 리터럴과 바이트 동일(KR 무회귀 — lenses.charac.test.ts가 고정).
export const LEVEL_LABELS: Record<Locale, {
  trend: Record<"strong" | "neutral" | "weak", string>;      // 모멘텀 short·long
  rsi: Record<"hot" | "cold" | "neutral", string>;           // 기술 short
  ma: Record<"up" | "down", string>;                         // 기술 long
  per: Record<"cheap" | "mid" | "rich", string>;             // 밸류 long(PER 수준 — verdict 아님)
  vol: Record<"low" | "mid" | "high", string>;               // 저변동 long
  gpa: Record<"high" | "mid" | "low", string>;               // 퀄리티 long
  growth: Record<"aggressive" | "mid" | "conservative", string>; // 자산성장 long
}> = {
  ko: {
    trend: { strong: "강세", neutral: "중립", weak: "약세" },
    rsi: { hot: "과열", cold: "침체", neutral: "중립" },
    ma: { up: "상승추세", down: "하락추세" },
    per: { cheap: "낮음", mid: "보통", rich: "높음" },
    vol: { low: "저변동", mid: "보통", high: "고변동" },
    gpa: { high: "높음", mid: "보통", low: "낮음" },
    growth: { aggressive: "공격적", mid: "보통", conservative: "보수적" },
  },
  en: {
    trend: { strong: "Strong", neutral: "Neutral", weak: "Weak" },
    rsi: { hot: "Overbought", cold: "Oversold", neutral: "Neutral" },
    ma: { up: "Uptrend", down: "Downtrend" },
    per: { cheap: "Low", mid: "Average", rich: "High" },
    vol: { low: "Low volatility", mid: "Average", high: "High volatility" },
    gpa: { high: "High", mid: "Average", low: "Low" },
    growth: { aggressive: "Aggressive", mid: "Moderate", conservative: "Conservative" },
  },
};

// 카드 겉면 headline의 언어별 접두어(숫자 앞 단어). 모멘텀 `12-1`·밸류 `PER`·퀄리티 `GP/A`는 언어중립이라 여기 없음.
export const HEADLINE_PREFIX: Record<Locale, { technical: string; lowvol: string; assetgrowth: string }> = {
  ko: { technical: "200일선", lowvol: "연변동성", assetgrowth: "자산성장" },
  en: { technical: "vs MA200", lowvol: "Ann. vol", assetgrowth: "Asset growth" },
};

// 신뢰도 등급 배지 텍스트 — 렌즈 카드 겉면("얼마나 믿을 만한가"). 색 계열(gradeTier)은 언어 무관이라 별도.
// ⚠️ ko 값은 기존 lib/lenses.ts 리터럴과 바이트 동일(스냅샷 테스트·KR 화면 무회귀). en은 신뢰도 범례(StockLens.readingGuide)와 문구 일치.
export type GradeKey = "verified" | "verifiedDefensive" | "reference" | "weakSignal";

export const LENS_GRADE: Record<Locale, Record<GradeKey, string>> = {
  ko: { verified: "검증", verifiedDefensive: "검증(방어)", reference: "참고용", weakSignal: "약한 신호" },
  en: { verified: "Verified", verifiedDefensive: "Verified (defensive)", reference: "Reference", weakSignal: "Weak signal" },
};

export function pickLocale(v: string | null | undefined): Locale {
  return v === "en" ? "en" : "ko";
}

// 렌즈 이름/상태 문구 공용 조회 — TodayClient·ExploreClient 로컬 lensName/stateLabel과 동일 로직(STEP 778: 신규 daily-brief 라우트용, 기존 2곳은 그대로 둠).
export function lensDisplayName(loc: Locale, key: string): string {
  return (LENS_COPY[loc] as unknown as Record<string, { name: string }>)[key]?.name ?? key;
}
export function lensStateLabel(loc: Locale, key: string, state: string | null): string {
  if (!state) return "—";
  const readings = (LENS_READINGS[loc] as unknown as Record<string, Record<string, { phrase: string }>>)[key];
  return readings?.[state]?.phrase ?? state;
}
// 카드 제목용 초보자 질문형(STEP 787) — name과 별개 필드라 6곳 소비처(문장·pill·프롬프트) 무영향.
export function lensQuestion(loc: Locale, key: string): string {
  return (LENS_COPY[loc] as unknown as Record<string, { question: string }>)[key]?.question ?? key;
}
// 종합 카드의 강점/주의 나열용 짧은 라벨(STEP 788) — question(문장형)보다 짧아 목록에 여러 개 나열해도 안 길어짐.
export function lensShortLabel(loc: Locale, key: string): string {
  return (LENS_COPY[loc] as unknown as Record<string, { shortLabel: string }>)[key]?.shortLabel ?? key;
}
