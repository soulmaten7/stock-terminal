/**
 * 역DCF 원장 (Registry) — 이 모델이 쓰는 모든 재료의 단일 정본
 *
 * 🔴 규칙 (CLAUDE.md ⓪ 원전 인벤토리 · REVDCF_SPEC §12)
 *  1. **값을 적지 않는다. 좌표를 적는다.** (파일·시트·셀·태그·API 경로)
 *     외부 값은 갱신되므로 숫자를 박으면 조용히 틀린 값이 된다.
 *  2. 모든 항목에 **분류**를 붙인다: A=계산법/규칙 · B=외부소스값 · C=관찰값(계산입력 금지)
 *  3. 원전과 다르면 **`divergence`에 사유를 반드시** 적는다. 비워두면 안 된다.
 *  4. 🔴 **새 작업 착수 전 이 파일을 먼저 읽는다.** 검색·설계는 그다음.
 *
 * 생성 배경(2026-08-01): 원전이 튜토리얼 10개 + 계산 스프레드시트 8개를 공개하는데
 * #8만 읽고 driver 1~6을 임의로 설계한 사실이 드러남. 같은 실수 반복 방지용.
 */

// ────────────────────────────────────────────────────────────────
// 1. 원전 산출물 인벤토리 — 무엇이 공개돼 있는가
// ────────────────────────────────────────────────────────────────

/**
 * 🔴 원본은 전부 `data/sources/`에 저장돼 있다 (CLAUDE.md 규칙 ⓪).
 *    판단이 갈리면 요약이 아니라 거기 있는 원본을 다시 연다.
 *    - data/sources/expectations-investing/T3~T10.xlsx  (원전 계산 시트)
 *    - data/sources/damodaran/*.xls                      (재료 데이터셋 8개)
 *    - data/sources/text/*.html                          (원문 페이지 raw)
 *    목록·갱신주기 = data/sources/README.md
 */
export const LOCAL_SOURCE_DIR = "data/sources/" as const;

export const PRIMARY_SOURCE = {
  name: "Expectations Investing (Rappaport & Mauboussin, 2001/2021)",
  site: "https://www.expectationsinvesting.com",
  tutorialIndex: "https://www.expectationsinvesting.com/online-tutorials",
  localDir: "data/sources/expectations-investing/",
  localText: "data/sources/text/EI_tutorial_*.html",
  /** 계산 스프레드시트. 패턴: /s/Online-Tutorial-{n}.xlsx (1·2번은 파일 없음 = 404) */
  workbooks: {
    T3: { topic: "영업이익률", sheets: ["Inputs", "Tutorial 3", "Margins"], driver: 2 },
    T4: {
      topic: "증분 순운전자본",
      sheets: ["Inputs", "Tutorial 4", "Working Capital Analysis", "Cash Conversion Cycle"],
      driver: 4,
    },
    T5: { topic: "증분 고정자본", sheets: ["Inputs", "Tutorial 5", "Cash Flow Method"], driver: 5 },
    T6: { topic: "현금세율", sheets: ["Inputs", "Tutorial 6", "Cash Tax Rate"], driver: 3 },
    T7: { topic: "자본비용(WACC)", sheets: ["Inputs", "Tutorial 8", "WACC"], driver: 6 },
    T8: {
      topic: "PIE 분석(역산기 본체)",
      sheets: ["Inputs", "Tutorial 8", "Price Implied Expectations"],
      driver: null,
    },
    T9: { topic: "M&A 분석", sheets: ["Inputs", "Tutorial 9", "SVAR & Premium at Risk"], driver: null },
    T10: { topic: "실물옵션", sheets: ["Inputs", "Tutorial 10", "Real Options Calculations"], driver: null },
  },
  /** 🔴 미독: T3·T4·T5·T6·T7 (해당 driver 설계 전 반드시 판독할 것) */
  readStatus: { T3: "미독", T4: "미독", T5: "미독", T6: "미독", T7: "미독", T8: "판독완료", T9: "해당없음", T10: "해당없음" },
} as const;

export const MATERIAL_SOURCES = {
  damodaran: {
    base: "https://pages.stern.nyu.edu/~adamodar/pc/datasets/",
    localDir: "data/sources/damodaran/", // 🔴 git 제외(.gitignore) — 로컬만. 원본 정본 = Storage(아래)
    snapshotAsOf: "2026-01-05",
    refresh: "연 1회 · 1월 첫 2주 (원문 확인 2026-08-01)",
    /** STEP 846: 원본 xls는 Supabase Storage 버킷 `sources`에 날짜 폴더로 보관(연 1회 과거본 누적) */
    storage: { bucket: "sources", path: "damodaran/{as_of}/{file}", asOfExample: "damodaran/2026-01-05/wacc.xls" },
    /** STEP 846: 표 데이터는 Postgres로 배선됨(as_of 컬럼·연 1회 새 as_of로 적재). 값은 여기 적지 않는다 — DB에서 읽는다. */
    tables: {
      "indname.xls": { table: "damodaran_industry", note: "회사→업종. 매칭키 = is_us_listed + ticker_norm 생성컬럼(§5). US 상장 6,937사" },
      "taxrate.xls": { table: "damodaran_tax_rate", note: "업종별 실효세율 94 (eff_all/eff_money/eff_agg/cash_*)" },
      "countrytaxrates.xls": { table: "damodaran_country_tax", note: "국가별 한계세율. driver 3 기본값 = US 행(0.2563)" },
      "wacc.xls": { table: "damodaran_wacc + damodaran_global_inputs", note: "업종 WACC 재료 + 상단 스칼라(무위험·ERP·스프레드·인플레). Cost of Capital 열은 대조용만(§12)" },
      "betas.xls": { table: "damodaran_beta", note: "업종별 베타·무차입베타·현금조정 무차입베타(driver 6 하향식)" },
      "capex.xls": { table: "damodaran_capex", note: "업종 CapEx·Net CapEx/Sales (driver 5 대조)" },
      "wcdata.xls": { table: "damodaran_working_capital", note: "업종 WC/Sales (driver 4 대조 · 폴백 금지)" },
      "totalbeta.xls": { table: null, note: "총베타 — 미검토·미배선" },
    },
  },
  sec: {
    base: "https://data.sec.gov",
    endpoints: {
      companyfacts: "/api/xbrl/companyfacts/CIK##########.json — 값 추출 정본",
      companyconcept: "/api/xbrl/companyconcept/CIK##########/us-gaap/{tag}.json",
      frames: "/api/xbrl/frames/{ns}/{tag}/{unit}/CY####[Q#][I].json — 횡단면 카운트용",
      submissions: "/submissions/CIK##########.json — SIC·form·거래소",
      bulk: "https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip (1.39GB · 매일 03:00 ET 재컴파일)",
    },
    frameRule:
      "🔴 frames = '가장 마지막에 제출된 사실 1건' + 기간 365일±30일(연간)에 맞는 것만. 정정본·53주 결산·전환기는 누락 → 개별 판정에 쓰지 말 것",
  },
} as const;

// ────────────────────────────────────────────────────────────────
// 2. 입력 변수 원장 — 원전 1:1 대조
// ────────────────────────────────────────────────────────────────

type Klass = "A" | "B" | "C";

export interface RegistryEntry {
  id: string;
  ko: string;
  /** 원전에서의 좌표 (없으면 우리가 추가한 항목) */
  primary: string | null;
  /** 우리 정의·조달처 */
  ours: string;
  klass: Klass;
  /** 🔴 원전과 다르면 반드시 사유. 같으면 null */
  divergence: string | null;
  /** 미결이면 무엇이 미결인지 */
  open?: string;
}

export const INPUTS: RegistryEntry[] = [
  {
    id: "salesGrowth",
    ko: "매출 성장률",
    primary: "T8 Inputs!C6",
    ours: "SEC 매출 5년 CAGR (항등식으로 선택된 매출 태그)",
    klass: "A",
    divergence: null,
    open: "🔴 원전 T2(매출·성장률 산출법) 미독",
  },
  {
    id: "startingSales",
    ko: "시작 매출",
    primary: "T8 Inputs!C7",
    ours: "SEC 최근 회계연도 매출",
    klass: "A",
    divergence: null,
  },
  {
    id: "operatingMargin",
    ko: "영업이익률",
    primary: "T8 Inputs!C8",
    ours: "SEC 영업이익÷매출 5년 평균 (+10년 병기)",
    klass: "A",
    divergence: "원전은 단일 예측치. 우리는 5년/10년 병기해 순환성을 노출",
    open: "🔴 원전 T3(마진 산출법) 미독",
  },
  {
    id: "startingMargin",
    ko: "시작 영업이익률",
    primary: "T8 Inputs!C9",
    ours: "SEC 최근 회계연도",
    klass: "A",
    divergence: null,
  },
  {
    id: "incrementalFixedCapitalRate",
    ko: "증분 고정자본율",
    primary: "T8 Inputs!C10 (T5에서 산출)",
    ours: "PP&E÷매출(자본집약도) 5년 평균 × Δ매출",
    klass: "A",
    divergence:
      "🔴 원전은 한계형(순capex÷Δ매출). 우리 실측 연도간 변동 ±80%p로 불안정 → 수준형 채택(변동 2.34%p)",
    open: "🔴 원전 T5 미독 — 원전의 실제 산출 절차 확인 필요",
  },
  {
    id: "incrementalWorkingCapitalRate",
    ko: "증분 운전자본율",
    primary: "T8 Inputs!C11 (T4에서 산출)",
    ours: "(유동자산−현금−유동부채)÷매출 5년 평균 × Δ매출",
    klass: "A",
    divergence:
      "🔴 원전은 한계형(ΔWC÷Δ매출). 실측 변동 94.95%p → 수준형(4.89%p) 채택. 다모다란도 한계형을 '사업이 변하는 기업'에 한정",
    open: "🔴 원전 T4 미독 · 이자부 유동부채 차감 불가(태그 60.5%)",
  },
  {
    id: "taxRate",
    ko: "세율",
    primary: "T8 Inputs!C15 = **현금세율**",
    ours: "US 한계세율 (countrytaxrates.xls · US 행)",
    klass: "B",
    divergence:
      "🔴 현금세율은 이자 세금방패를 이미 반영 → WACC 세후 부채비용에서 이중계산. 다모다란: '매 기간 동일 세율이면 한계세율이 안전'",
    open: "🔴 원전 T6(현금세율) 미독 — 기각한 방법의 원전 절차를 안 읽었다",
  },
  {
    id: "costOfCapital",
    ko: "자본비용 (WACC)",
    primary: "T8 Inputs!C16 (T7에서 산출)",
    ours: "CAPM 조립: 무위험 + 하향식베타×ERP / 부채비용은 합성등급 스프레드",
    klass: "B",
    divergence: "🔴 다모다란 완성 WACC(Cost of Capital 열) 차용 금지 — 그 안의 세율 25%와 우리 세율이 어긋남",
    open: "🔴 원전 T7 미독 (T7 Inputs에 베타=1, 세율 16.5% 사용 확인됨)",
  },
  {
    id: "inflation",
    ko: "인플레이션 (잔여가치)",
    primary: "T8 Inputs!C17 = 1.6%",
    ours: "🔴 미정 — 현재 설계는 0 (터미널 = NOPAT÷WACC)",
    klass: "B",
    divergence: "원전 잔여가치 = NOPAT×(1+i)÷(WACC−i). 우리는 i=0이 더 보수적이라 판단했으나 원전과 다름",
    open: "🔴 재검토 — 원전 방식으로 갈지 결정 필요",
  },
  { id: "sharePrice", ko: "주가", primary: "T8 Inputs!C21", ours: "기존 시세 파이프라인", klass: "B", divergence: null },
  {
    id: "sharesOutstanding",
    ko: "주식수",
    primary: "T8 Inputs!C22",
    ours: "SEC dei",
    klass: "B",
    divergence: null,
    open: "🔴 기본주/희석주 미정",
  },
  { id: "debt", ko: "부채", primary: "T8 Inputs!C25", ours: "SEC 부채 태그", klass: "B", divergence: null, open: "🔴 태그 확정 필요" },
  {
    id: "nonOperatingAssets",
    ko: "비영업자산 (현금·유가증권)",
    primary: "T8 Inputs!C27",
    ours: "SEC 현금 태그 union",
    klass: "B",
    divergence: null,
    open: "🔴 '초과현금' 정의 미정 (총현금 vs 운영필요분 차감)",
  },
];

// ────────────────────────────────────────────────────────────────
// 3. 역산기 구조 — 원전 T8 수식 (구현 시 이대로)
// ────────────────────────────────────────────────────────────────

export const PIE_FORMULAS = {
  sales: "매출(t) = 매출(t-1) × (1 + g)",
  operatingProfit: "영업이익(t) = 매출(t) × 마진",
  nopat: "NOPAT(t) = 영업이익(t) × (1 − 세율)",
  incrementalFixed: "증분고정(t) = (매출t − 매출t-1) × 고정자본율",
  incrementalWorking: "증분운전(t) = (매출t − 매출t-1) × 운전자본율",
  fcf: "FCF(t) = NOPAT(t) − 증분고정(t) − 증분운전(t)",
  pvFcf: "FCF 현가 = FCF(t) ÷ (1+WACC)^t",
  residual: "🔴 원전: 잔여가치(N) = NOPAT(N)×(1+i) ÷ (WACC−i) ÷ (1+WACC)^N   [i=인플레]",
  corporateValue: "기업가치(N) = 누적FCF현가(N) + 잔여가치현가(N)",
  shareholderValue: "주주가치(N) = 기업가치(N) + 비영업자산 − 부채",
  perShare: "주당가치(N) = 주주가치(N) ÷ 주식수",
  mifp:
    'MIFP = IF(주가 > 25년가치, "25+", IF(주가 < 1년가치, "<1", LOOKUP(주가, 주당가치배열, 연차배열)))',
  thresholdMargin:
    "임계마진 = 현재마진×(1+i)/(1+g) + [g×(고정자본율+운전자본율)×(WACC−i)] ÷ [(1+g)(1−세율)(1+WACC)]  — 가치를 파괴하지 않으려면 필요한 최소 마진",
  horizon: "🔴 원전 지평 = **25년** (New Constructs는 100년). 초과 시 '25년이 주가의 몇 %를 설명하는가'를 표시",
} as const;

/** 🔴 구현 검증 기준: 도미노 사례를 재현해야 한다 */
export const REFERENCE_CASE = {
  company: "Domino's Pizza",
  asOf: "2020-09",
  workbook: "T8",
  expect: { valueAtYear0PerShare: 285, sharePrice: 418, mifpYears: 8 },
  note: "우리 역산기가 T8 Inputs 값을 그대로 받아 위 결과를 재현하면 '원전 구조 재현'이 증명된다",
} as const;
