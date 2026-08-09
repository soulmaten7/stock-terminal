/**
 * STEP 947 §5 — Q1 밸류에이션 4축(PER·PBR·PSR·EV/EBITDA). 순수 함수만 — DB·네트워크 접근 없음.
 *
 * 🔴 원전 없음(규칙 5-1 트랙) — EI 튜토리얼 8편 실측: P/E 0회·price-to-book 0회·price-sales 0회·EBITDA 1회.
 * 정의는 여기(VALUATION_SPEC) 한 곳에 고정하고 docs/VALUATION_SPEC.md에 그대로 공개한다(규칙 5-2 ⑤ — 문서·코드가 같은 것을 가리킨다).
 * 이 객체가 정의의 유일한 출처다 — 계산 함수(computeValuation)는 이 객체가 서술하는 식을 그대로 구현한다.
 */
export const VALUATION_SPEC = {
  per: {
    // 🔴 STEP 963(2026-08-09 장은태 위임→Cowork 판정) — 보통주 귀속 순이익 기준으로 확정.
    //   근거: Damodaran pedata.xls FAQ "Price per share divided by EPS" — GAAP EPS(FASB ASC 260) 자체가
    //   이미 "보통주 귀속 순이익÷보통주식수"다. 입력값(netIncome)은 drivers.ts의 NET_INCOME 태그 우선순위
    //   변경으로 이미 보통주 기준이 됨(NetIncomeLossAvailableToCommonStockholdersBasic 최우선) — 이 함수 자체는 무수정.
    formula: "marketCap / netIncomeAvailableToCommon",
    basis: "annual", // 장은태 판정 2026-08-08: 연간(FY) 고정. 분기 TTM은 이 STEP 범위 밖.
    unavailableWhen: ["netIncome <= 0", "netIncome == null"],
  },
  pbr: {
    // 🔴 STEP 963 — 보통주 장부가 기준으로 확정. 근거: Damodaran pbv.pdf(보통주 시가총액에는 보통주 장부가를 대응시킨다).
    //   입력값(equity)은 route.ts가 us_fundamentals.common_equity(drivers.ts가 우선주·비지배지분을 뺀 값)를
    //   넘긴다 — 이 함수 자체는 무수정(어떤 값이 들어오든 그대로 나눈다).
    formula: "marketCap / commonEquity",
    unavailableWhen: ["equity <= 0", "equity == null"],
  },
  psr: {
    formula: "marketCap / revenue",
    unavailableWhen: ["revenue <= 0", "revenue == null"],
  },
  evEbitda: {
    // 🔴 EV 근거 = Damodaran vebitda.pdf: "Market Value of Equity + Market Value of Debt - Cash".
    //   현금을 분자에서 빼면 분모(EBITDA)에서도 현금수익이 빠져야 정합한데, 우리 EBITDA는 영업이익+D&A라
    //   애초에 이자수익이 안 들어간다 — 정합한다.
    formula: "(marketCap + debt - nonOperatingAssets) / (operatingIncome + dna)",
    unavailableWhen: ["ebitda <= 0", "operatingIncome == null", "dna == null"],
  },
} as const;

export interface ValuationInputs {
  marketCap: number | null;
  netIncome: number | null;
  equity: number | null;
  revenue: number | null;
  operatingIncome: number | null;
  dna: number | null;
  // 🔴 debt·nonOperatingAssets는 driver 파이프라인 전체가 성공(ok:true)해야만 채워진다(computeDrivers §2-3 —
  //   fundamentals 5종과 달리 이 둘은 5년 게이트 뒤에서 계산됨). null = "무차입"이 아니라 "아직 모른다" — 0으로 채우지 않는다.
  debt: number | null;
  nonOperatingAssets: number | null;
}

export interface ValuationResult {
  per: number | null;
  pbr: number | null;
  psr: number | null;
  evEbitda: number | null;
  ev: number | null;
  ebitda: number | null;
  unavailable: Record<string, string>;
}

/** 순수 계산. VALUATION_SPEC이 서술하는 4개 식을 그대로 구현한다. */
export function computeValuation(inp: ValuationInputs): ValuationResult {
  const unavailable: Record<string, string> = {};

  if (inp.marketCap == null || !(inp.marketCap > 0)) {
    return { per: null, pbr: null, psr: null, evEbitda: null, ev: null, ebitda: null, unavailable: { per: "MISSING_MARKET_CAP", pbr: "MISSING_MARKET_CAP", psr: "MISSING_MARKET_CAP", evEbitda: "MISSING_MARKET_CAP" } };
  }
  const marketCap = inp.marketCap;

  // PER = marketCap / netIncome(호출부가 보통주 귀속 순이익을 넘긴다, STEP 963). 음수·0 이익은 계산하지 않는다(관행 — 음수 PER은 무의미, Stock Analysis 용어 페이지).
  let per: number | null = null;
  if (inp.netIncome == null) unavailable.per = "MISSING_NET_INCOME";
  else if (!(inp.netIncome > 0)) unavailable.per = "NEGATIVE_EARNINGS";
  else per = marketCap / inp.netIncome;

  // PBR = marketCap / equity(호출부가 보통주 장부가=commonEquity를 넘긴다, Damodaran pbv.pdf, STEP 963 확정) — 음수(자본잠식)는 계산하지 않는다.
  let pbr: number | null = null;
  if (inp.equity == null) unavailable.pbr = "MISSING_EQUITY";
  else if (!(inp.equity > 0)) unavailable.pbr = "NEGATIVE_EQUITY";
  else pbr = marketCap / inp.equity;

  // PSR = marketCap / revenue.
  let psr: number | null = null;
  if (inp.revenue == null) unavailable.psr = "MISSING_REVENUE";
  else if (!(inp.revenue > 0)) unavailable.psr = "NEGATIVE_REVENUE";
  else psr = marketCap / inp.revenue;

  // EV/EBITDA = (marketCap + debt - nonOperatingAssets) / (operatingIncome + dna).
  let ev: number | null = null, ebitda: number | null = null, evEbitda: number | null = null;
  if (inp.operatingIncome == null) unavailable.evEbitda = "MISSING_OPERATING_INCOME";
  else if (inp.dna == null) unavailable.evEbitda = "MISSING_DNA";
  else if (inp.debt == null || inp.nonOperatingAssets == null) unavailable.evEbitda = "MISSING_MARKET_DATA"; // driver 전체 성공 전이라 debt·비영업자산 미수집
  else {
    ebitda = inp.operatingIncome + inp.dna;
    ev = marketCap + inp.debt - inp.nonOperatingAssets;
    if (!(ebitda > 0)) unavailable.evEbitda = "NEGATIVE_EBITDA";
    else evEbitda = ev / ebitda;
  }

  return { per, pbr, psr, evEbitda, ev, ebitda, unavailable };
}
