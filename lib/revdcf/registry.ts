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
  /** ✅ T3~T8 판독완료 (STEP 847: T4/T5/T6 원전 절차 실측 대조 · T3 마진=OI/rev · T7 WACC=조립) */
  readStatus: { T3: "판독완료", T4: "판독완료", T5: "판독완료", T6: "판독완료", T7: "판독완료", T8: "판독완료", T9: "해당없음", T10: "해당없음" },
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
      "wacc.xls": { table: "damodaran_wacc + damodaran_global_inputs + damodaran_credit_spread", note: "업종 WACC 재료 + 상단 스칼라(무위험·ERP·스프레드·인플레) + 등급별 credit_spread 7밴드(847·부채비용용). Cost of Capital 열은 대조용만(§12)" },
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
    divergence: "원전 T2는 과거 CAGR이 아니라 가이던스·Value Line·컨센서스. 847 실측: 무료 8-K 가이던스 매출 존재율 63.3%·~1년. FMP 컨센서스(2~3년) 키 미보유. → 우리는 과거 CAGR 기준선 + (선택)가이던스 오버레이",
    open: "🔶 N≈1년만 근거값(무료 가이던스)·이후 과거 외삽. FMP 구매 시 2~3년 확장",
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
    open: "✅ 847 T3 판독: 마진=영업이익÷매출. 도미노 시작마진 원전 17.39% = 우리 17.39%(정확 일치)",
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
      "✅(배선) 852 이중 산정: level(PP&E÷매출 5년평균·저분산·설비무거운 기업 과대) + marginal(원전 T5 5년누적 순고정÷5년누적Δ매출·저편향·M&A포함). 둘 다 저장·판정 갈림 68종목(16.6%)이면 화면에 '방법에 따라 다름'. 도미노: T8 15% vs level 6.9% vs marginal 14%(marginal이 근접). 기본값=level(안정)·불일치 시 병기. 🔴 원전대조판정(875 강등): level은 원전·다모다란 어디에도 근거 없음(자본집약도≠재투자율) — ③판정 대기, 코드 주판정은 여전히 level(`:191`). marginal은 도미노 앵커로 원전 T5 `I20` 11.6%와 정확 일치(11.617%·875) — 계산불가 50·극단 133 남음",
    open: "🔶 갈림 68종목만 method-dependent 표시(화면 STEP). marginal 재료 없는 종목은 level만. 🔴 driver5 원전채택 여부 875에서 재개방 — 제3안(sales-to-capital 등) 878이 재료 수집",
  },
  {
    id: "incrementalWorkingCapitalRate",
    ko: "증분 운전자본율",
    primary: "T8 Inputs!C11 (T4에서 산출)",
    ours: "(유동자산−현금−유동부채)÷매출 5년 평균 × Δ매출",
    klass: "A",
    divergence:
      "✅(배선) 847 T4 판독+실측: 원전은 무이자유동부채만 차감(~~단기차입금 미차감 → 태그부족 우회 가설~~ 🔴 정정(875): 가설이 아니다 — `Tutorial 4` B23이 \"Other non-interest bearing current liabilities\"라 명시한다. **원전의 설계**다). 그러나 원전 정의는 재고·미지급 세부 태그가 희소해 604 중 26%만 확보(844식 91%보다 나쁨)·한계형 변동 여전 SD 40%p → 844 수준형 유지. ✅ 원전대조판정(875·2026-08-03 장은태 승인): 현행(수준형) 유지 — 다모다란 \"% of revenues\" 실무 권고 + 원전 증분식 불안정성 문헌 + 원전식 전환해도 결과 안 크게 안 바뀜. 근거였던 A안 커버리지 12.6%는 876에서 철회(불완전 태그 매핑의 커버리지였음 — 확장해도 29.5%·B안 99.8%엔 못 미침, 도미노 자체가 재현 안 됨)",
  },
  {
    id: "taxRate",
    ko: "세율",
    primary: "T8 Inputs!C15 = **현금세율**",
    ours: "US 한계세율 (countrytaxrates.xls · US 행)",
    klass: "B",
    divergence:
      "✅ 847 실측으로 확정: 원전 무차입 현금세율(T6)은 우리 604 중 58%만 5년확보(병목 interest 427)·이상값 16.2%·회사내 변동 SD 8.1%. 한계세율은 상수·전종목·안정 → 채택. (원전은 현금세율이나 조달·안정성 열위)",
  },
  {
    id: "costOfCapital",
    ko: "자본비용 (WACC)",
    primary: "T8 Inputs!C16 (T7에서 산출)",
    ours: "CAPM 조립: 무위험 + 하향식베타×ERP / 부채비용은 합성등급 스프레드",
    klass: "B",
    divergence: "🔴 다모다란 완성 WACC(Cost of Capital 열) 차용 금지 — 세율 불일치. ✅(배선완료) 849: 구성요소 조립(`lib/revdcf/compute.ts`·`assembleWacc`)으로 배선. 94업종 검산 차 중앙 0.08%p. GAP은 WACC 3점(−1/기준/+1%p)으로 산출(단일 금지). 🔴 원전대조판정 미결 — 877이 베타·YTM·세율·도미노WACC(0.05354) 대조표를 진행표에 기록만 했고 판정은 안 냈다(registry에서도 미결로 유지)",
    open: "🔶 rf = damodaran(연·ERP와 짝) 채택·FRED 일간 변형 후속 · 도미노 우리 WACC 7.19%(2026 rf 3.95%) vs 원전 5.357%(2020 0.65%) → GAP 8→23년(차이 거의 전부 WACC)",
  },
  {
    id: "inflation",
    ko: "인플레이션 (잔여가치)",
    primary: "T8 Inputs!C17 = 1.6%",
    ours: "✅ `expected_inflation`(damodaran DB·0.025) — 터미널 = NOPAT×(1+i)÷(WACC−i)",
    klass: "B",
    divergence: "✅(A분류 값선택 확정) 851: i=인플레(실질 0 성장)가 정석. i=0(영구 실질감소·부자연)·T8 0.016(도미노 전용) 기각. 3안 실측 GAP 중앙 16/16/14 = WACC(밴드 6년) 대비 2차적. '어느 값 쓸지'는 A분류 규칙. 🔴 원전대조판정(차이9행 의미의 ③)은 별개 축 — 851은 \"i에 어떤 값을 쓸지\"를 정한 것이지 \"원전 값(1.6%)을 채택할지\"를 판정한 게 아니다(851 자신이 0.016을 \"도미노 전용\"이라 기각). 진행표의 🔴 대기는 이 축 기준으로는 맞다(878 확인·판정 안 냄)",
  },
  { id: "sharePrice", ko: "주가", primary: "T8 Inputs!C21", ours: "기존 시세 파이프라인", klass: "B", divergence: null },
  {
    id: "sharesOutstanding",
    ko: "주식수",
    primary: "T8 Inputs!C22",
    ours: "SEC 희석주식수(WeightedAvgDiluted) — 커버 90%",
    klass: "B",
    divergence: "✅ 849: 희석 채택(T8 39.35=희석·dei 38.67=기본). 옵션희석 무시 시 주당가치 과대",
  },
  { id: "debt", ko: "부채", primary: "T8 Inputs!C25", ours: "SEC LT+당기+금융리스(영업리스 제외)·최적태그 DebtAndCapitalLeaseObligations", klass: "B", divergence: "✅ 849: 영업리스 제외(T8 정합·ROU 이중계상 회피). 커버 core 76%/리스포함 91%·도미노 4114(장부) vs 4170(시장가)" },
  {
    id: "nonOperatingAssets",
    ko: "비영업자산 (현금·유가증권)",
    primary: "T8 Inputs!C27",
    ours: "현금+제한현금+단기투자 전액(A안·원전 T8)",
    klass: "B",
    divergence: "✅ 849: A(전액) 채택. B(−매출2%)와 GAP 동일(shift $1.87/주) → 원전 그대로",
  },
];

// ────────────────────────────────────────────────────────────────
// 2-b. 🔴 원전에 **없는** 우리 추가물 (2026-08-02 신설)
//
//  원전(Expectations Investing)은 **투자자가 고른 종목 하나**를 분석하는 책이다.
//  우리는 전 종목을 자동으로 돌린다 → 원전에 대응물이 없는 항목이 생긴다.
//  🔴 이 항목들은 "원전 수준"이라 말할 수 없다. 근거를 밖에서 가져와야 하고,
//     밖이 서로 다르면 **다르다고 적는다**(빌린 권위 금지).
// ────────────────────────────────────────────────────────────────

export interface OurAddition {
  id: string;
  ko: string;
  /** 원전에 대응물이 없는 이유 */
  whyAbsentInPrimary: string;
  /** 우리가 지금 무엇을 하고 있나 */
  ours: string;
  /** 외부 관행 — 🔴 일치하지 않으면 그 사실을 적는다 */
  externalPractice: string;
  status: "확정" | "재개방" | "미결";
}

export const OUR_ADDITIONS: OurAddition[] = [
  {
    id: "sensitivity",
    ko: "자본비용 3점 밴드 (−1%p / 기준 / +1%p)",
    whyAbsentInPrimary:
      "T8은 MIFP를 단일 숫자(r117)로 끝내고 민감도는 '스프레드시트에서 직접 바꿔 보라'(r121)로 넘긴다 — 종목 하나만 분석하니까",
    ours: "전 종목 자동이라 사람이 직접 바꿔볼 수 없어 3점을 미리 산출",
    externalPractice: "Morningstar = 불확실성 등급(트리 300개 분산). New Constructs = 100개 예측기간 시나리오. 방식은 다르나 '단일 숫자로 끝내지 않는다'는 공통",
    status: "확정",
  },
  {
    id: "distribution",
    ko: "시장 분포 내 위치 (rank + 3분류)",
    whyAbsentInPrimary: "원전엔 백분위·분포 개념이 없다(855 §7 T8 개봉 확인)",
    ours: "전 종목 × 매일 산출의 부산물 — 이게 우리 해자다(계산식이 아니라 분포)",
    externalPractice: "개인용 계산기(GuruFocus·TIKR·StockInvestorIQ)엔 없음. NC는 등급으로 제공",
    status: "확정",
  },
  {
    id: "universe",
    ko: "🔴 유니버스 (어떤 종목을 담을까)",
    whyAbsentInPrimary:
      "🔴 원전 튜토리얼 02·08 개봉: liquidity·trading volume·universe·screening **전부 0건**. 투자자가 이미 종목을 골라온 상태를 전제하므로 이 문제가 발생하지 않는다",
    ours:
      "🔴 물려받은 시작 목록 1,000 → 616종목/604발행사. **근거 없는 승계**(기존 7렌즈 lens_scores에서 가져옴). A-7 '정식 종료'는 '이 목록 안에서의 종료'로 격하",
    externalPractice:
      "🔴 3주체가 전부 다름 — NC=지수 사다리(S&P500→400→600→R3000)+3개월 평균거래량 순(**이유 서술 0건**·2,748사) / Morningstar Quant=유동성 하한만(**지수 무관**·US 4,379사) / Damodaran=**컷 없음**(주가>0 전 상장사 48,156·'제외 말고 남기되 결측 아닌 기업만 값을 보고'). 발췌 = data/sources/text/EXTERNAL_UNIVERSE_QUOTES.md",
    status: "재개방",
  },
  {
    id: "liquidity",
    ko: "🔴 유동성 컷 (FALR ≥ 0.75)",
    whyAbsentInPrimary: "위와 동일 — 원전에 유동성 개념 자체가 없다",
    ours:
      "🔴 **확정 취소.** 문서(REVDCF_SPEC A-4)엔 '확정'이었으나 전 저장소 grep 결과 계산 경로엔 **0건** — engine·drivers·compute·배치·크론·API 어디에도 없다(유일한 히트는 probe_revdcf_us.ts §6 주석 '구현 안 함, 오는지만'). 분자(1년 거래대금)도 없어 계산 불가였다. 851 '표시 25년 컷'이 코드에 없던 것과 같은 유형(2회차)",
    externalPractice:
      "🔴 FALR(S&P 지수 편입 기준)을 쓰는 역DCF 주체는 **없다**. Morningstar만 유동성 하한을 쓰는데 기준이 다르다(60일 중앙 거래대금 현지통화 5,000/일 — 미국 상장사엔 사실상 안 걸림) 그리고 **이유를 명시**한다('모델 부정확·편향 완화'). Damodaran은 명시적으로 안 쓴다('표본 편향')",
    status: "재개방",
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
  expect: { valueAtYear1PerShare: 285, sharePrice: 418, mifpYears: 8 },
  /** ✅ STEP 848 재현 통과 — lib/revdcf/engine.ts · engine.test.ts */
  reproduced: { valueAtYear1PerShare: 285.2, mifp: 8, monotonic: "up", passed: true, at: "2026-08-01 STEP 848" },
  note: "엔진이 T8 Inputs를 그대로 받아 value(year1)=$285.2·MIFP=8 재현 → '원전 구조 재현' 증명(조달 검증은 847 §5 별개). 🔴 GAP은 WACC에 극도로 민감(WACC±1%p→below_one/15년) — driver 6 신중",
} as const;
