/**
 * 🔴 STEP 1055 §2-4 불변 검증용 스냅샷 — `git show HEAD:lib/revdcf/drivers.ts`(STEP1055 이전, 죽은 태그 4개
 * 제거 전·새 필드 7개 배선 전)를 그대로 추출했다. `scripts/probe_1055_invariance.ts`가 import한다.
 * 977의 선례(`scripts/_step977_tmp/drivers_old.ts`)와 같은 방식 — 정리(삭제)하면 이 스냅샷을 import하는
 * 검증 스크립트가 `npm run build`를 깨뜨린다(980 복구 이력) — 수정·삭제하지 말 것(비교 기준 스냅샷).
 *
 * 역DCF driver 산출 (STEP 850) — SEC companyfacts 원자료 → driver 1~5 + 시작값 + 시장 부분(부채·비영업·주식수).
 *
 * 🔴 정의는 REVDCF_SPEC §B-4/§12 A(고정): driver 4·5 = 수준형 · 매출 = 항등식 선택 · 세율 = 한계세율.
 * 🔴 결측은 조용히 0으로 채우지 않는다 — 필수 5년 미확보면 skipReason.
 * 🔴 태그 union은 840/847/849 확정 목록(추측 금지). WACC 조립·주가는 배치(DB 필요)에서.
 * 🔴 STEP 951 — 관측 창은 종목별 실재 최신 5개 연도(resolveYearWindow). 하드코딩 연도 배열 없음(규칙 5-2).
 *   창은 모듈 레벨 가변 상태가 아니라 인자로 전달된다 — route.ts가 워커 6개로 병렬 처리하므로
 *   모듈 레벨 let을 쓰면 워커끼리 서로의 창을 덮어쓴다(레이스). sumMaps·hasAll·latestYear가 전부 years를 인자로 받는 이유.
 */

type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
export type Gaap = Record<string, { units?: Record<string, Fact[]> }>;

// STEP 951 — 창 "크기"(5년, 원전 T8 관측기간)는 방법론 고정값(규칙 5-2의 f) — 어느 5개 "연도"인지는 종목별로 연다(x).
const WINDOW_SIZE = 5;

const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));

// STEP 963 — export만 추가(동작 무변경). 검증 스크립트가 특정 연도(과거 as_of의 fiscal_year)를 고정해
//   재추출할 때 이 로직을 재사용하기 위함 — resolveYearWindow는 "오늘 기준 최신"을 고르므로 그대로 못 씀.
export function annualMap(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const arr = g[tag]?.units?.[unit];
  const by: Record<number, { val: number; filed: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; if (!e.end) continue; }
    const y = calYear(e.end); const prev = by[y];
    // 🔴 제출버전(vintage) 정책 — 장은태 판정 2026-08-09(STEP 965). 같은 회계연도에 여러 제출이 있으면
    //   **가장 최근 제출값**을 쓴다(재작성 반영). 근거 ① 분자가 오늘 시총이므로 분모도 오늘 기준 최신 재무여야
    //   시점이 맞는다 ② 외부(stockanalysis.com)도 최신값을 쓴다 — WDC·DD 실측 일치(STEP 964)
    //   ③ 영향 4~6%대이며 최대폭은 사업분할 회계반영으로 원인 규명됨(STEP 964). 대가: 「그 시점 정보만으로
    //   판단」이라는 성질을 잃는다 — 백테스트를 도입하면 이 정책을 재검토해야 한다. 정본 = docs/REVDCF_SPEC.md 제출버전 절.
    if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: String(e.filed) };
  }
  const o: Record<number, number> = {}; for (const y of Object.keys(by)) o[+y] = by[+y].val; return o;
}
export function coalesceMap(g: Gaap, tags: string[], kind: "flow" | "stock", unit = "USD"): { vals: Record<number, number>; tagAt: Record<number, string> } {
  const vals: Record<number, number> = {}, tagAt: Record<number, string> = {};
  for (const t of tags) { const m = annualMap(g, t, kind, unit); for (const y of Object.keys(m)) { const yy = +y; if (vals[yy] == null) { vals[yy] = m[yy]; tagAt[yy] = t; } } }
  return { vals, tagAt };
}
// STEP 965 §2 — annualMap의 선택 로직(위 filed 최신값 우선)은 그대로 두고, 그 선택이 실제로 재작성을
//   거쳤는지(같은 연도에 값이 서로 다른 제출이 2개 이상 있었는지)만 사후 확인하는 기록 전용 함수.
//   annualMap의 필터(isAnnual·기간 300~400일·fp==FY)를 그대로 복제한다 — annualMap 자체는 건드리지 않는다.
//   🔴 filed만 다르고 값이 같은 단순 재제출은 재작성이 아니다(값이 실제로 달라야만 true).
export function detectRestated(g: Gaap, tag: string, kind: "flow" | "stock", year: number, unit = "USD"): boolean {
  const arr = g[tag]?.units?.[unit];
  if (!Array.isArray(arr)) return false;
  const valsAtYear = new Set<number>();
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; if (!e.end) continue; }
    if (calYear(e.end) !== year) continue;
    valsAtYear.add(e.val);
  }
  return valsAtYear.size > 1;
}
// STEP 951 §2 — years를 인자로 받는다(모듈 레벨 상태 금지·워커 병렬 레이스 방지). 기본값 없음 — 호출부 누락 시 컴파일 오류.
const sumMaps = (years: number[], ...ms: Record<number, number>[]): Record<number, number> => { const o: Record<number, number> = {}; for (const y of years) { let s: number | null = null; for (const m of ms) if (m[y] != null) s = (s ?? 0) + m[y]; if (s != null) o[y] = s; } return o; };
// STEP 951 — has5 → hasAll로 개명(5를 이름에 박은 것 자체가 가변 길이 창과 모순).
const hasAll = (years: number[], m: Record<number, number>) => years.every((y) => m[y] != null);
const latestYear = (years: number[], m: Record<number, number>): number | null => { for (let i = years.length - 1; i >= 0; i--) if (m[years[i]] != null) return years[i]; return null; };

// STEP 967 §3 — 순수 창탐색 로직을 연도→값 맵 인자로 분리(동작 무변경 — resolveYearWindow가 REV로 이 함수를
//   부르던 것을 그대로 옮겼을 뿐). 은행형 매출 폴백(computeDrivers 안)이 같은 로직을 재사용하기 위함 — 창 탐색
//   알고리즘을 두 번 구현하지 않는다.
function findContiguousWindow(vals: Record<number, number>, opts: { size: number; maxYear: number }): { years: number[] | null; reason?: string; latestAvailable: number | null } {
  const allYears = Object.keys(vals).map(Number).filter((y) => y <= opts.maxYear).sort((a, b) => a - b);
  const latestAvailable = allYears.length ? allYears[allYears.length - 1] : null;
  if (allYears.length < opts.size) return { years: null, reason: "TOO_FEW_YEARS", latestAvailable };
  const top = allYears.slice(-opts.size);
  for (let i = 1; i < top.length; i++) { if (top[i] !== top[i - 1] + 1) return { years: null, reason: "NON_CONTIGUOUS", latestAvailable }; }
  return { years: top, latestAvailable };
}
// STEP 951 §1 — 창 계산의 유일한 출처. 코드와 docs/REVDCF_SPEC.md가 같은 5줄을 가리킨다(규칙 5-2 ⑤):
//   ① 기준은 매출(REV 후보 태그의 coalesce 결과) 하나다 — 태그마다 따로 창을 잡지 않는다.
//   ② 10-K 연간 항목만 센다(annualMap의 isAnnual·기간 300~400일 필터).
//   ③ calYear(end)로 귀속 연도를 구한다(5월 경계 규칙 그대로).
//   ④ 가장 최신 연도부터 거꾸로 연속 size개를 잡는다 — 비연속이면 창을 만들지 않는다(reason: "NON_CONTIGUOUS").
//     연속을 요구하는 이유: CAGR의 nSpan이 실제 경과연수와 달라지면 성장률이 틀린다.
//   ⑤ 상한 maxYear를 둔다(호출부가 오늘 날짜에서 유도해 인자로 넘긴다) — 데이터 오류로 미래 연도가 들어오는 것을 막는다.
export function resolveYearWindow(gaap: Gaap, opts: { size: number; maxYear: number }): { years: number[] | null; reason?: string; latestAvailable: number | null } {
  const revVals = coalesceMap(gaap, REV, "flow").vals;
  return findContiguousWindow(revVals, opts);
}

// ── 태그 union (840/847/849 확정) ────────────────────────────────────────────
const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
// 🔴 STEP 967 — 은행형 매출 폴백. 은행은 손익계산서가 이자·비이자 구조라 위 REV 4종을 안 쓴다(REV 태그 자체가 없음).
//   기존 REV 경로가 5년 창을 못 만들 때만(computeDrivers §3-1 게이트 직전) 시도하는 폴백 — REV 경로가 성립하는
//   회사는 이 상수들을 아예 참조하지 않는다(값 무변경).
//   🔑 섹터 라벨이 아니라 태그 존재 여부로 분기한다 — STEP963이 업종별 차등을 배제한 이유(섹터분류 오류가
//   계산정의 오류로 번짐, 분류 정확도가 100%가 아님)는 여기 해당 안 된다. 이 분기의 기준은 "그 회사가 은행
//   섹터인가"가 아니라 "REV 4종 태그가 5년 연속 존재하는가"뿐이므로 섹터 라벨의 정확도에 의존하지 않는다.
//   정의 근거(①-A) = FDIC 감독매뉴얼(Examination Policies Manual §5.1 EARNINGS)·FDIC Quarterly Banking Profile
//   용어: "Net operating revenue = net interest income + noninterest income."
//   실측(STEP967, us_fundamentals.fiscal_year IS NULL 197건 전량, SEC 신규호출 0) — 이 두 태그만으로 20/197 회복
//   (전부 미국 지역은행). 변형 태그는 발견되지 않아 추가하지 않는다(규칙 5-2 ③ 실측 선행 — 쓰이지 않는 파라미터 금지).
const REV_BANK_NII = ["InterestIncomeExpenseNet"];
const REV_BANK_NONINT = ["NoninterestIncome"];
const COST = ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices", "CostOfSales", "CostOfOperatingRevenues", "CostOfRevenues"];
const PRETAX = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"];
const INTEREST = ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestIncomeExpenseNet"];
const PPE = ["PropertyPlantAndEquipmentNet", "PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization", "PropertyPlantAndEquipmentExcludingLessorAssetUnderOperatingLeaseAfterAccumulatedDepreciation", "PropertyPlantAndEquipmentOtherNet", "PublicUtilitiesPropertyPlantAndEquipmentNet"]; // 852: GM 등 리스제공자 변형 추가
// 852: 운전자본 차감용 현금 — CVX 등이 후기연도 제한현금포함 태그로 전환 → coalesce
const CASH_OP = ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"];
// driver 5 한계형(원전 T5) 재료 — 852
const CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"];
const CAPSW = ["PaymentsToDevelopSoftware", "CapitalizedComputerSoftwareAdditions"];
const OTHINV = ["PaymentsForProceedsFromOtherInvestingActivities"];
const ACQ = ["PaymentsToAcquireBusinessesNetOfCashAcquired"];
// 🔴 862: D&A 회수. 합계 태그(4종·우선순위) → 없으면 분리(감가 Depreciation + 무형 AmortizationOfIntangibleAssets 둘 다) 합산 → 없으면 결측.
//   합계와 분리를 union으로 섞으면 이중계상/누락 → 분리 처리. DepreciationNonproduction(부분값)·단독 Depreciation(무형 누락 위험)은 미사용.
const DNA_TOTAL = ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndDepletion", "DepreciationAmortizationAndAccretionNet"];
const DEPR_ONLY = ["Depreciation"];
const AMORT_ONLY = ["AmortizationOfIntangibleAssets"];
const SHARES_MORE = ["WeightedAverageNumberOfSharesOutstandingBasic", "CommonStockSharesOutstanding"]; // 852 폴백
const CASH_NONOP = ["CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "CashAndCashEquivalentsAtCarryingValue"]; // 비영업(제한현금 포함 우선)
const SECURITIES = ["ShortTermInvestments", "MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesCurrent", "OtherShortTermInvestments"];
// 부채: LT + 당기 + 금융리스 (영업리스 제외 · §3 결정) · §5: AndCapitalLeaseObligationsCurrent 추가
// 🔴 STEP 969 — debt=0인 103종목(us_fundamentals) 전수 스캔으로 배열 밖 태그를 찾아 확장. 정의를 SEC 10-K
//   R-file(us-gaap 공식 Definition 텍스트가 렌더링에 포함됨, 969 §1 실측 방법)로 직접 대조해 확인된 것만 추가 —
//   이름만 비슷한 태그(예: IncludingCurrentMaturities 변형)는 원문 대조 없이 넣지 않는다. 이중계상 방지:
//   신규 태그는 전부 DEBT_LT/DEBT_CUR(coalesceMap이 연도별로 "처음 값이 있는 태그 하나만" 쓰는 배열)에만 추가하거나
//   DEBT_TOTAL_SINGLE(단일 총액, LT+CUR 합산보다 항상 우선)에만 추가한다 — 같은 개념을 두 배열에 동시에 넣지 않는다.
export const DEBT_LT = ["LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations", "ConvertibleDebtNoncurrent", "ConvertibleLongTermNotesPayable", "LongTermNotesPayable", "SeniorLongTermNotes", "UnsecuredLongTermDebt", "OtherLongTermDebtNoncurrent"];
export const DEBT_CUR = ["LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent", "ConvertibleDebtCurrent", "ConvertibleNotesPayableCurrent", "NotesPayableCurrent", "SeniorNotesCurrent", "UnsecuredDebtCurrent", "MediumtermNotesCurrent", "LongTermConstructionLoanCurrent", "ShortTermBorrowings", "OtherBorrowings"];
export const FIN_LEASE = ["FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent"];
// 🔴 969 — GM 사례(§1): 세그먼트(Automotive/GM Financial) 차원 태그(DebtCurrent 등)가 companyfacts에서
//   차원 팩트라 제외되고(854의 멀티클래스 주식과 같은 구조적 제약), 대신 이 단일 합계 태그만 노출된다.
//   SEC 10-K R-file 정의 대조로 확인: "Amount of debt and lease obligation" 계열의 총액 버전.
//   GM FY2025 검산: 우리(태그 원문값)=$131,574M vs stockanalysis.com FY2025=$130,277M(1.0%차, §3-2).
export const DEBT_TOTAL_SINGLE = ["DebtAndCapitalLeaseObligations", "LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities"]; // 단일 총액 태그(있으면 우선)
// 🔴 969 §2 — "확정0(태그 자체가 없음)"과 "모름(태그는 있는데 못 잡음)"을 가르는 스캔용. 위 배열에 실제로 들어간
//   전체 태그 목록(대조 배제용) + 부채꼴이지만 소음인 패턴(운영리스 공시·매도가능증권으로서의 채무증권·수취채권·
//   현금흐름표 동사형 항목)을 제외한다 — 969 §1 실측(103종목 전수 스캔)으로 확정한 소음 분류 그대로.
export const DEBT_KNOWN_TAGS = new Set([...DEBT_LT, ...DEBT_CUR, ...FIN_LEASE, ...DEBT_TOTAL_SINGLE]);
export const DEBT_KEYWORD_RE = /Debt|Borrowing|Notes|Loan|Lease/i;
export const DEBT_NOISE_RE = /^(RepaymentsOf|ProceedsFrom|Payments|GainsLosses|GainLoss|Amortization|Interest|Induced|Provision|Impairment|Deferred|Increase|AllowanceFor|RightOfUseAssetObtainedInExchangeFor)|OperatingLease|AvailableForSale|HeldToMaturity|LeaseCost|LesseeOperatingLease|SubleaseIncome|LeaseExpense|LeaseIncome|LeaseRightOfUse|NotesReceivable|LoansReceivable|NotesAndLoansReceivable|LeaseLiabilityUndiscounted|SalesTypeLease|SalesTypeAndDirectFinancingLease|NetInvestmentInLease|LeaseholdImprovements|DebtSecurities|DebtInstrument|AccountsAndNotesReceivable|LineOfCreditFacility|MaturitiesRepaymentsOfPrincipal|LeaseLiabilityPaymentsDue|LeasePrincipalPayments|TradingSecuritiesDebt|LeasePayment|DebtIssuanceCostsIncurredDuring|DebtAndEquitySecurities|LiabilitiesOtherThanLongtermDebt|FinanceLeaseInterest/i;
// 🔴 STEP 977 §1 — lag 원인 판별(debt 전용). 969의 UNRESOLVED_DEBT 스캔(위 DEBT_KNOWN_TAGS·DEBT_KEYWORD_RE·
//   DEBT_NOISE_RE)과 정확히 같은 규칙을 "특정 연도"에 재사용하기 위해 별도 함수로 뽑았다 — 🔴 기존
//   UNRESOLVED_DEBT 스캔 코드(아래 computeDrivers 안)는 건드리지 않는다(계산 경로 불변 보장, 이 함수는 순수 관측용).
function hasUnresolvedDebtTagAtYear(gaap: Gaap, year: number): boolean {
  for (const tag of Object.keys(gaap)) {
    if (DEBT_KNOWN_TAGS.has(tag) || !DEBT_KEYWORD_RE.test(tag) || DEBT_NOISE_RE.test(tag)) continue;
    const m = annualMap(gaap, tag, "stock");
    if (m[year] != null) return true;
  }
  return false;
}
const SHARES_DIL = ["WeightedAverageNumberOfDilutedSharesOutstanding"];
// STEP 947 §2 — Q1 밸류에이션(PER·PBR) 재료. 역DCF driver와 무관 — 새 축 2개만 추가.
// 🔴 STEP 963 — 보통주 귀속 순이익을 최우선으로. GAAP EPS 정의(FASB ASC 260) 자체가 이미 "보통주 귀속 순이익÷보통주식수"라
//   Damodaran pedata.xls FAQ의 "price/EPS"는 우선주가 있는 기업에서 이미 우선주배당을 뺀 값을 뜻한다(963 조사 확정).
//   배열 순서만 바꾼다 — coalesceMap은 연도별로 첫 번째로 값이 있는 태그를 쓰므로, 이 태그가 없는 해만 NetIncomeLoss로 폴백.
export const NET_INCOME = ["NetIncomeLossAvailableToCommonStockholdersBasic", "NetIncomeLoss", "ProfitLoss"];
// 🔴 2번째(...IncludingPortionAttributableToNoncontrollingInterest)는 비지배지분이 섞인다. sourceTags로 어느 태그를 썼는지 반드시 기록.
export const EQUITY = ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest", "CommonStockholdersEquity"];
// STEP 963 — 보통주 장부가(commonEquity) 계산용. EQUITY(총자기자본)에서 이 둘을 뺀다(Damodaran pbv.pdf: 보통주 시총엔 보통주 장부가).
export const PREFERRED = ["PreferredStockValue", "PreferredStockValueOutstanding"];
export const NCI = ["MinorityInterest"];

const REL = 0.01; // 항등식 허용오차

export interface DriverBundle {
  startingSales: number; salesGrowth: number; operatingMargin: number; startingMargin: number;
  fixedCapitalRate: number; // 🔴 880: 이 함수의 기본값은 level이지만, 주 판정에 어느 값을 쓸지는 이 타입이 정하지 않는다 — 그건 소비처(route.ts)가 정한다. 880부터 route.ts는 이 필드를 marginal로 덮어써서 엔진에 넘긴다(:191 참조)
  fixedCapitalRateLevel: number; // PP&E÷매출 5년평균
  fixedCapitalRateMarginal: number | null; // 원전 T5 5년누적 순고정÷5년누적Δ매출 (재료 없으면 null)
  workingCapitalRate: number;
}
export interface DriverMarketPartial { debt: number; nonOperatingAssets: number; shares: number; latestYear: number }
// STEP 947 §2 — Q1 밸류에이션 재료. driver 5년 게이트보다 앞에서 모으므로 skip 경로(ok:false)에도 실린다(§2-3).
// 값이 없으면 null(0으로 채우지 않는다·§2-4). sourceTags = 필드명 → 실제로 채택한 us-gaap 태그(또는 재구성 방식명).
export interface DriverFundamentals {
  netIncome: number | null;
  equity: number | null;
  // STEP 963 — 보통주 장부가(PBR 분모 후보). equity(총자기자본)는 그대로 남기고 새 필드로 병기(비교 가능하게).
  commonEquity: number | null;
  preferredStock: number | null;
  minorityInterest: number | null;
  revenue: number | null;
  operatingIncome: number | null;
  dna: number | null;
  fiscalYear: number | null;
  sourceTags: Record<string, string>;
}
export type DriverResult =
  | { ok: true; drivers: DriverBundle; market: DriverMarketPartial; flags: Record<string, unknown>; fundamentals: DriverFundamentals }
  | { ok: false; skipReason: string; flags: Record<string, unknown>; fundamentals: DriverFundamentals };

const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

/** companyfacts(us-gaap, dei) → driver 1~5 + 시장 부분. taxRate는 한계세율(배치가 DB에서 주입). */
export function computeDrivers(gaap: Gaap, dei: Gaap): DriverResult {
  const flags: Record<string, unknown> = { growthIsHistorical: true };

  // STEP 951 §3-1 — 함수 진입 직후 창을 계산한다. maxYear는 오늘 날짜에서 유도(코드에 숫자로 안 박음·규칙 5-2).
  const maxYear = new Date().getFullYear();
  // 🔴 STEP 967 — 이하 재할당 가능(let). 표준 REV 창이 안 잡힐 때만 은행형 폴백으로 덮어쓴다(아래).
  let window = resolveYearWindow(gaap, { size: WINDOW_SIZE, maxYear });
  const revCo = coalesceMap(gaap, REV, "flow"); // STEP 967 — 폴백 게이트 조건에도 쓰므로 위로 끌어올림(동작 무변경, 위치만 이동)

  // STEP 967 §3 — 은행형 매출 폴백. 🔴 REV 태그가 "완전히 전무"할 때만 시도한다 — window.years==null만으로 트리거하면
  //   REV 데이터가 일부(3~4년) 있어 표준 경로가 이미 특정 연도(ly)를 앵커로 skip 판정을 내린 종목까지 건드리게
  //   된다(실측으로 발견: `BRBS`[REV 2018~2020 보유]·`CBU`·`PRK`[REV 2022~2025 보유]가 은행형 창[NII+NonInt]으로
  //   갈아타며 fiscalYear·revenue 등 fundamentals가 통째로 바뀜 — 930건 불변 검증에서 실제로 잡힌 회귀).
  //   🔴 REV coalesce 결과가 0년(태그 자체가 없음)일 때만 폴백을 시도해야 "기존 REV 경로 무변경"이 지켜진다.
  let revenuePath: "standard" | "bank" = "standard";
  let bankRevVals: Record<number, number> = {};
  if (window.years == null && Object.keys(revCo.vals).length === 0) {
    const niiCo = coalesceMap(gaap, REV_BANK_NII, "flow");
    const nonIntCo = coalesceMap(gaap, REV_BANK_NONINT, "flow");
    // 🔴 두 시리즈 다 값이 있는 연도만 유효(부분합 금지) — 한쪽만 있으면 그 해의 "총매출"을 대표할 수 없다.
    //   sumMaps는 이미 있는 함수를 그대로 재사용한다(신규 합산 로직 없음) — years 인자를 "둘 다 있는 연도"로
    //   미리 좁혀서 넘기므로 sumMaps 내부의 "있는 것만 더한다" 동작이 결과적으로 "둘 다 있을 때만" 합산이 된다.
    const bothYears = Object.keys(niiCo.vals).map(Number).filter((y) => nonIntCo.vals[y] != null);
    const candidateBankRev = sumMaps(bothYears, niiCo.vals, nonIntCo.vals);
    const bankWindow = findContiguousWindow(candidateBankRev, { size: WINDOW_SIZE, maxYear });
    if (bankWindow.years != null) {
      bankRevVals = candidateBankRev;
      window = bankWindow;
      revenuePath = "bank";
    }
  }
  flags.revenuePath = revenuePath;

  // ── STEP 947 §2-3 — fundamentals(Q1 밸류에이션 재료) 선수집. driver 5년 게이트 전부보다 앞에서 끝낸다.
  //    아래 각 유무 게이트가 반환하는 skip 경로에도 fundamentals가 실린다. 게이트 조건식·순서·skipReason 문자열은 불변.
  //    STEP 951: 앵커 연도(ly)는 이제 resolveYearWindow가 본 최신 연도 — 창이 아예 안 잡혀도(window.years===null) 단일
  //    시점 값은 구할 수 있으면 구한다(947 설계 유지: skip 경로에도 부분 데이터).
  const ly = window.latestAvailable;
  const gp = annualMap(gaap, "GrossProfit", "flow"), cost = coalesceMap(gaap, COST, "flow").vals;
  const cae = annualMap(gaap, "CostsAndExpenses", "flow"), oiMap = annualMap(gaap, "OperatingIncomeLoss", "flow");
  let revenueTag: string | null = null, revenueCheck = "unverified";
  const revVals: [string, number][] = ly != null
    ? REV.map((t) => [t, annualMap(gaap, t, "flow")[ly]] as [string, number | undefined]).filter((x): x is [string, number] => x[1] != null)
    : [];
  const id1 = (ly != null && gp[ly] != null && cost[ly] != null) ? revVals.filter(([, rv]) => Math.abs(rv - cost[ly] - gp[ly]) <= REL * Math.abs(rv)) : [];
  const id2 = (ly != null && cae[ly] != null && oiMap[ly] != null) ? revVals.filter(([, rv]) => Math.abs(rv - cae[ly] - oiMap[ly]) <= REL * Math.abs(rv)) : [];
  if (id1.length === 1) { revenueTag = id1[0][0]; revenueCheck = "id1"; }
  else if (id2.length === 1) { revenueTag = id2[0][0]; revenueCheck = "id2"; }
  else { revenueTag = (ly != null ? revCo.tagAt[ly] : undefined) ?? REV[0]; revenueCheck = "unverified"; }
  const revTagMap = annualMap(gaap, revenueTag, "flow");
  // 🔴 STEP 967 — 은행형 경로에서는 위 REV 항등식 판정(id1/id2, GrossProfit·CostsAndExpenses 기반)이 무의미하다
  //   (은행은 그 개념 자체가 없다) — flags를 실제 채택 경로로 덮어써 오표시를 막는다.
  flags.revenueTag = revenuePath === "bank" ? "InterestIncomeExpenseNet+NoninterestIncome" : revenueTag;
  flags.revenueCheck = revenuePath === "bank" ? "bank_fallback" : revenueCheck;

  // STEP 951 — 계산에 쓸 연도 집합: 창이 잡혔으면 그 5개, 아니면(fundamentals 전용) 앵커 1개뿐(또는 0개).
  const computeYears = window.years ?? (ly != null ? [ly] : []);
  // 🔴 STEP 967 — 은행형 경로는 revTagMap·revCo가 비어 있으므로(REV 태그 자체가 없어 창이 안 잡혔던 것) bankRevVals로 대체.
  const rev: Record<number, number> = {}; for (const y of computeYears) rev[y] = revenuePath === "bank" ? bankRevVals[y] : (revTagMap[y] ?? revCo.vals[y]);

  // 영업이익: OperatingIncomeLoss → 매출−총비용(CostsAndExpenses·852 GE 등) → Pretax+Interest 재구성
  const pretax = coalesceMap(gaap, PRETAX, "flow").vals, interest = coalesceMap(gaap, INTEREST, "flow").vals;
  const oi: Record<number, number> = {}; let ebitSource = "OperatingIncomeLoss", srcRevCae = false, srcRecon = false;
  for (const y of computeYears) {
    if (oiMap[y] != null) oi[y] = oiMap[y];
    else if (rev[y] != null && cae[y] != null) { oi[y] = rev[y] - cae[y]; srcRevCae = true; }
    else if (pretax[y] != null && interest[y] != null) { oi[y] = pretax[y] + Math.abs(interest[y]); srcRecon = true; }
  }
  ebitSource = srcRevCae ? "Rev-CostsAndExpenses" : srcRecon ? "Pretax+Interest" : "OperatingIncomeLoss";
  flags.ebitSource = ebitSource;

  // STEP 947: D&A(원래 driver 5 자리에서 계산하던 것을 fundamentals용으로 앞당김 — 862 우선체인 그대로: 합계 태그 → 분리합산 → 결측)
  const dnaTotCo = coalesceMap(gaap, DNA_TOTAL, "flow"); const dnaTot = dnaTotCo.vals;
  const depr = coalesceMap(gaap, DEPR_ONLY, "flow").vals, amort = coalesceMap(gaap, AMORT_ONLY, "flow").vals;
  const dna: Record<number, number> = {}; let dnaSrc = "none";
  for (const y of computeYears) {
    if (dnaTot[y] != null) { dna[y] = dnaTot[y]; if (dnaSrc === "none") dnaSrc = "total"; }
    else if (depr[y] != null && amort[y] != null) { dna[y] = depr[y] + amort[y]; dnaSrc = dnaSrc === "total" ? "mixed" : "split"; }
  }
  flags.dnaSource = dnaSrc;

  // STEP 947: 순이익·자기자본(새 태그 2종) — 최신 회계연도(ly) 단일 시점. STEP 951: fiscalYear가 이제 새 창의 최신 연도를 따른다.
  const niCo = coalesceMap(gaap, NET_INCOME, "flow");
  const eqCo = coalesceMap(gaap, EQUITY, "stock");
  const sourceTags: Record<string, string> = {};
  const fNetIncome: number | null = ly != null ? niCo.vals[ly] ?? null : null;
  if (fNetIncome != null && ly != null) sourceTags.netIncome = niCo.tagAt[ly];
  const fEquity: number | null = ly != null ? eqCo.vals[ly] ?? null : null;
  if (fEquity != null && ly != null) sourceTags.equity = eqCo.tagAt[ly];
  // STEP 963 — commonEquity = equity에서 비지배지분(EQUITY가 NCI포함 태그일 때만)·우선주를 뺀 값.
  const prefCo = coalesceMap(gaap, PREFERRED, "stock");
  const nciCo = coalesceMap(gaap, NCI, "stock");
  const fPreferredStock: number | null = ly != null ? prefCo.vals[ly] ?? null : null;
  const fMinorityInterest: number | null = ly != null ? nciCo.vals[ly] ?? null : null;
  let fCommonEquity: number | null = null;
  if (fEquity != null) {
    if (sourceTags.equity === "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest") {
      if (fMinorityInterest != null) fCommonEquity = fEquity - fMinorityInterest;
      else { fCommonEquity = fEquity; flags.commonEquityNciNotSubtracted = true; } // NCI 태그가 없어 못 뺐음을 표시(0으로 간주 안 함)
    } else {
      fCommonEquity = fEquity; // StockholdersEquity·CommonStockholdersEquity는 이미 NCI 미포함
    }
    fCommonEquity = fCommonEquity - (fPreferredStock ?? 0);
  }
  if (fPreferredStock == null) flags.preferredStockUnknown = true; // "우선주 없음"과 "태그 누락"을 구분할 수 없음을 표시
  if (fPreferredStock != null && ly != null) sourceTags.preferredStock = prefCo.tagAt[ly];
  if (fMinorityInterest != null && ly != null) sourceTags.minorityInterest = nciCo.tagAt[ly];
  const fRevenue: number | null = ly != null ? rev[ly] ?? null : null;
  if (fRevenue != null && ly != null) {
    // 🔴 STEP 967 — 은행형 경로는 단일 태그가 아니라 두 태그의 합이므로, ebitSource의 기존 관행(재구성값은
    //   합성 라벨로 표시 — 예 "Rev-CostsAndExpenses")과 같은 방식으로 합성 라벨을 남긴다(원시 태그명 아님).
    sourceTags.revenue = revenuePath === "bank" ? "InterestIncomeExpenseNet+NoninterestIncome" : (revTagMap[ly] != null ? revenueTag : (revCo.tagAt[ly] ?? revenueTag));
  }
  const fOperatingIncome: number | null = ly != null ? oi[ly] ?? null : null;
  if (fOperatingIncome != null && ly != null) {
    sourceTags.operatingIncome = oiMap[ly] != null ? "OperatingIncomeLoss" : (rev[ly] != null && cae[ly] != null ? "Rev-CostsAndExpenses" : "Pretax+Interest");
  }
  const fDna: number | null = ly != null ? dna[ly] ?? null : null;
  if (fDna != null && ly != null) {
    sourceTags.dna = dnaTot[ly] != null ? (dnaTotCo.tagAt[ly] ?? "DepreciationDepletionAndAmortization") : "Depreciation+AmortizationOfIntangibleAssets";
  }
  // STEP 965 §2 — 재작성(vintage) 감지·기록. 값 선택은 그대로(annualMap 무변경) — 이미 채택된 태그가
  //   같은 연도에 서로 다른 값을 낸 제출을 2개 이상 가졌는지만 사후 확인한다. 단일 태그 조회(coalesceMap)로
  //   구한 필드만 검사 — operatingIncome·dna는 재구성(Rev-CostsAndExpenses 등) 경로가 있어 단일 태그 전제가
  //   깨지므로 이번엔 범위 밖(감지 안 함 ≠ 재작성 없음, "확인 안 함"으로 남긴다).
  const restated: string[] = [];
  if (ly != null) {
    if (sourceTags.netIncome && detectRestated(gaap, sourceTags.netIncome, "flow", ly)) restated.push("netIncome");
    if (sourceTags.equity && detectRestated(gaap, sourceTags.equity, "stock", ly)) restated.push("equity");
    if (sourceTags.revenue && detectRestated(gaap, sourceTags.revenue, "flow", ly)) restated.push("revenue");
    if (sourceTags.preferredStock && detectRestated(gaap, sourceTags.preferredStock, "stock", ly)) restated.push("preferredStock");
    if (sourceTags.minorityInterest && detectRestated(gaap, sourceTags.minorityInterest, "stock", ly)) restated.push("minorityInterest");
  }
  flags.restated = restated;

  const fundamentals: DriverFundamentals = { netIncome: fNetIncome, equity: fEquity, commonEquity: fCommonEquity, preferredStock: fPreferredStock, minorityInterest: fMinorityInterest, revenue: fRevenue, operatingIncome: fOperatingIncome, dna: fDna, fiscalYear: ly, sourceTags };

  // ── STEP 951 §3-1 — 창 게이트. 기존 skipReason("INSUFFICIENT_HISTORY") 그대로 재사용, 새 사유는 flags.windowReason에만. ──
  if (window.years == null) return { ok: false, skipReason: "INSUFFICIENT_HISTORY", flags: { ...flags, missing: "revenue<5yr", windowReason: window.reason, latestAvailable: window.latestAvailable }, fundamentals };
  const years = window.years;

  // STEP 951 §3-3 — 창 일치성 방어 점검: resolveYearWindow가 본 최신 연도(ly)와 창의 끝(years 마지막)이 같아야 한다.
  //   다르면 그 자체가 버그다(정상 동작에서는 항상 같아야 함 — resolveYearWindow가 스스로 구성한 창이므로).
  // 🔴 STEP 967 — 은행형 경로는 창을 bankRevVals로 구성했으므로 대조 대상도 bankRevVals여야 한다(revCo는 이 경로에서 비어 있음).
  const lyCheck = latestYear(years, revenuePath === "bank" ? bankRevVals : revCo.vals);
  if (lyCheck !== years[years.length - 1]) return { ok: false, skipReason: "WINDOW_MISMATCH", flags: { ...flags, windowReason: "mismatch", latestAvailable: window.latestAvailable }, fundamentals };

  // STEP 951 §3-4 — 창을 flags에 반드시 남긴다. 과거 행(이 필드 없음)과의 구분선.
  flags.yearWindow = years; flags.windowSize = years.length; flags.latestAvailable = window.latestAvailable;

  // ── 여기부터 기존 driver 파이프라인 게이트(조건식·순서·skipReason 문자열 전부 불변, YS→years로만 교체) ──
  // 🔴 896 §4: 세 MISSING_TAG 원인(영업이익/PP&E/영업현금흐름)이 한 코드로 뭉쳐 flags.missing이 화면에 안 보이던 문제(895 §3-1) —
  //   조건식·순서·flags는 그대로 두고 반환하는 skipReason 문자열만 원인별로 나눈다. 과거 행은 "MISSING_TAG"로 남는다(REVDCF_SPEC §10).
  if (!hasAll(years, oi)) return { ok: false, skipReason: "MISSING_TAG_OPERATING_INCOME", flags: { ...flags, missing: "operatingIncome<5yr" }, fundamentals };

  // driver 5 재료: PP&E · driver 4 재료: 유동자산·유동부채·운영현금
  const ppe = coalesceMap(gaap, PPE, "stock").vals;
  const assetsCur = annualMap(gaap, "AssetsCurrent", "stock"), liabCur = annualMap(gaap, "LiabilitiesCurrent", "stock");
  const cashOp = coalesceMap(gaap, CASH_OP, "stock").vals;
  if (!hasAll(years, ppe)) return { ok: false, skipReason: "MISSING_TAG_PPE", flags: { ...flags, missing: "ppe<5yr" }, fundamentals };
  // 🔴 유동/비유동 미구분(유동성배열법) = 이 기법의 재무형식과 안 맞음 → 회수 아니라 재분류(838: 금융인접 신호)
  if (!hasAll(years, assetsCur) || !hasAll(years, liabCur)) return { ok: false, skipReason: "NOT_APPLICABLE_SECTOR", flags: { ...flags, missing: "unclassifiedBalanceSheet" }, fundamentals };
  if (!hasAll(years, cashOp)) return { ok: false, skipReason: "MISSING_TAG_OPERATING_CASH", flags: { ...flags, missing: "operatingCash<5yr" }, fundamentals };

  // 시장 부분: 주식수(희석→기본→발행→dei)·부채·비영업자산 — 최신연도(창 안에서)
  // 🔴 STEP 977 — sharesYear를 별도로 뽑아둔다(기존에는 latestYear() 결과를 바로 인덱싱만 하고 버렸다).
  //   선택 로직·순서·break 조건 전부 그대로 — 어느 값이 채택되는지는 한 글자도 안 바뀐다(2단계 완전대조로 증명).
  const sharesDil = annualMap(gaap, SHARES_DIL[0], "flow", "shares");
  let sharesTag = "WeightedAverageNumberOfDilutedSharesOutstanding";
  let sharesYear: number | null = latestYear(years, sharesDil);
  let shares = sharesYear != null ? sharesDil[sharesYear] : undefined;
  if (shares == null) { for (const t of SHARES_MORE) { const m = annualMap(gaap, t, t.startsWith("Weighted") ? "flow" : "stock", "shares"); const y = latestYear(years, m); const v = y != null ? m[y] : undefined; if (v != null) { shares = v; sharesTag = t; sharesYear = y; break; } } }
  const deiSh = annualMap(dei, "EntityCommonStockSharesOutstanding", "stock", "shares");
  if (shares == null) { sharesYear = latestYear(years, deiSh); shares = sharesYear != null ? deiSh[sharesYear] : undefined; sharesTag = "dei:EntityCommonStockSharesOutstanding"; }
  const firstY = years[0], lastY = years[years.length - 1];
  if (shares == null || !(shares > 0)) {
    // 🔴 STEP 854 §3 — 멀티클래스 주식(A/B/C 등). companyfacts는 차원(class dimension) 팩트를 제외하므로 통합 주식수 총계가
    //   존재하지 않는다(V·STZ·FWONA·WMG·COKE). 클래스별 전환비율·권리가 달라 강제 합산은 시총을 왜곡 → 합치지 않고
    //   별도 사유로 정직히 건너뛴다(회수 불가·개수만 보고). 여기 도달 = 5년 영업이력 게이트(매출·영업이익·PP&E·현금)를 전부
    //   통과한 실제 상장사인데 희석→기본→발행→dei 전 폴백이 통합 총계를 못 낸 경우 = 통합 주식수가 클래스로만 존재.
    //   시그니처 확정(confirmed) = dei 커버페이지 태그는 있으나 최신 통합값 없음. 그 외는 추론(inferred).
    const deiTagPresent = !!(dei as Gaap)?.["EntityCommonStockSharesOutstanding"];
    const deiRecent = latestYear(years, deiSh);
    const confirmed = deiTagPresent && (deiRecent == null || deiRecent < lastY - 1);
    return { ok: false, skipReason: "MULTI_CLASS_SHARES", flags: { ...flags, missing: "shares", multiClass: true, multiClassInferred: !confirmed }, fundamentals };
  }
  flags.sharesTag = sharesTag;

  // 🔴 969 — DEBT_TOTAL_SINGLE이 이제 2개 태그(GM 사례로 추가)라 coalesceMap으로 전환(동작: 연도별로 첫 값 있는 태그 하나만 채택, 969 §1).
  const singleCo = coalesceMap(gaap, DEBT_TOTAL_SINGLE, "stock");
  const debtMap = hasAll(years, singleCo.vals) || singleCo.vals[lastY] != null
    ? singleCo.vals
    : sumMaps(years, coalesceMap(gaap, DEBT_LT, "stock").vals, coalesceMap(gaap, DEBT_CUR, "stock").vals, sumMaps(years, annualMap(gaap, FIN_LEASE[0], "stock"), annualMap(gaap, FIN_LEASE[1], "stock")));
  const debtLy = latestYear(years, debtMap);
  // 🔴 862: 부채 태그 부재 시 무차입(정상·값0) vs 진짜 결측(이자비용 있는데 태그 못 잡음) 분리 — 969가 아래에서 이 신호를 그대로 재사용.
  const iMap = annualMap(gaap, "InterestExpense", "flow"); const iLy = latestYear(years, iMap);
  flags.debtStatus = debtLy != null ? "present" : (iLy != null && Math.abs(iMap[iLy]) > 0 ? "missing" : "zero");

  // 🔴 969 §2 — 「확정0 / 확정값 / 모름」 3분류. debtLy가 null이면 위 배열로 못 잡은 것 — 그게 "진짜 무차입"인지
  //   "부채꼴 태그가 있는데 우리가 못 알아본 것"인지 직접 스캔해서 가른다(969 §1: 배열 밖 태그 전수조사로 소음 규칙 확정).
  if (debtLy == null) {
    const unresolvedTags: string[] = [];
    for (const tag of Object.keys(gaap)) {
      if (DEBT_KNOWN_TAGS.has(tag) || !DEBT_KEYWORD_RE.test(tag) || DEBT_NOISE_RE.test(tag)) continue;
      const m = annualMap(gaap, tag, "stock");
      if (m[lastY] != null) unresolvedTags.push(tag);
    }
    if (unresolvedTags.length > 0) {
      // 🔴 "모름"이면 skip한다 — 0으로 채우면 WACC의 D/E가 조용히 틀린다(969 대전제).
      return { ok: false, skipReason: "UNRESOLVED_DEBT", flags: { ...flags, debtBasis: "unresolved", debtTagsSeen: unresolvedTags }, fundamentals };
    }
    flags.debtBasis = "none";
  } else {
    flags.debtBasis = "tagged";
    sourceTags.debt = hasAll(years, singleCo.vals) || singleCo.vals[lastY] != null ? (singleCo.tagAt[debtLy] ?? "single") : "combined(LT+CUR+lease)";
  }
  const debt = debtLy != null ? debtMap[debtLy] : 0; // 무차입이면 0 (결측 아님 — debtBasis="none"으로 구분)
  flags.debtIsZeroOrMissing = debtLy == null;

  const nonOpCash = coalesceMap(gaap, CASH_NONOP, "stock").vals, sec = coalesceMap(gaap, SECURITIES, "stock").vals;
  const nonOpMap = sumMaps(years, nonOpCash, sec);
  const nonOpLy = latestYear(years, nonOpMap);
  const nonOperatingAssets = nonOpLy != null ? nonOpMap[nonOpLy] : (nonOpCash[lastY] ?? 0);

  // 🔴 STEP 977 §1 — inputLag 기록(관측만, 계산값 무변경). latestYear()가 목표연도(lastY)보다
  //   몇 해 전 값을 반환했는지를 flags에 남긴다. 976 판정 근거: lag≥1 21건 중 목표연도 대체값이
  //   있는 건 1건뿐이라 상한 도입은 유예한다 — 그래서 이번엔 "기록"까지만 한다.
  //   🔴 lag이 전부 0이면 flags.inputLag 자체를 안 넣는다(저장 낭비 방지, 976 §1-1 실측상 대부분 0).
  const lagOf = (y: number | null) => (y == null ? null : lastY - y);
  const inputLag: Record<string, number> = {};
  const sharesLag = lagOf(sharesYear); if (sharesLag != null && sharesLag > 0) inputLag.shares = sharesLag;
  const debtLag = lagOf(debtLy); if (debtLag != null && debtLag > 0) inputLag.debt = debtLag;
  const ieLag = lagOf(iLy); if (ieLag != null && ieLag > 0) inputLag.interestExpense = ieLag;
  const nonOpLag = lagOf(nonOpLy); if (nonOpLag != null && nonOpLag > 0) inputLag.nonOperatingAssets = nonOpLag;
  if (Object.keys(inputLag).length > 0) {
    flags.inputLag = inputLag;
    // 🔴 976이 12건에 쓴 방법 그대로: debt만 "태그 있는데 못 잡음(tag_miss)" vs "정말 없음(no_value)"을 가른다
    //   (기존 UNRESOLVED_DEBT 스캔과 같은 규칙, 위 hasUnresolvedDebtTagAtYear로 재사용). shares·IE·nonOpAssets는
    //   같은 종류의 스캔 방법이 없다(976이 만들지 않았다·이번에도 새로 만들지 않는다) — "unknown"으로 정직하게 남긴다.
    const cause: Record<string, "no_value" | "tag_miss" | "unknown"> = {};
    if (inputLag.debt != null) cause.debt = hasUnresolvedDebtTagAtYear(gaap, lastY) ? "tag_miss" : "no_value";
    if (inputLag.shares != null) cause.shares = "unknown";
    if (inputLag.interestExpense != null) cause.interestExpense = "unknown";
    if (inputLag.nonOperatingAssets != null) cause.nonOperatingAssets = "unknown";
    flags.inputLagCause = cause;
  }

  // ── driver 계산 (백만 단위 무관 — 비율이라 상쇄) ──────────────────────────
  const nSpan = lastY - firstY; // 4(연속 5년 창이므로 항상 4)
  const salesGrowth = nSpan > 0 && rev[firstY] > 0 ? (rev[lastY] / rev[firstY]) ** (1 / nSpan) - 1 : 0;
  const operatingMargin = mean(years.filter((y) => rev[y] > 0).map((y) => oi[y] / rev[y]));
  const startingMargin = rev[lastY] > 0 ? oi[lastY] / rev[lastY] : operatingMargin;
  // driver 5 — 이중 산정 (852): level=PP&E÷매출 5년평균 · marginal=원전 T5 5년누적 순고정÷5년누적Δ매출
  const fixedCapitalRateLevel = mean(years.filter((y) => rev[y] > 0).map((y) => ppe[y] / rev[y]));
  const capex = coalesceMap(gaap, CAPEX, "flow").vals;
  // 🔴 862 D&A 우선체인 — STEP 947에서 fundamentals 수집 블록으로 이동(dna·dnaSrc는 위에서 이미 계산됨), 여기서는 재사용만.
  const acq = coalesceMap(gaap, ACQ, "flow").vals, capsw = coalesceMap(gaap, CAPSW, "flow").vals, othinv = coalesceMap(gaap, OTHINV, "flow").vals;
  let fixedCapitalRateMarginal: number | null = null;
  const invYears = years.slice(1); // Δ매출 있는 4개 해(창의 첫해 제외)
  if (invYears.every((y) => capex[y] != null && dna[y] != null)) {
    let cumNet = 0; for (const y of invYears) cumNet += Math.abs(capex[y]) + Math.abs(acq[y] ?? 0) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0) - Math.abs(dna[y]);
    const cumDRev = rev[lastY] - rev[firstY];
    if (cumDRev !== 0) fixedCapitalRateMarginal = cumNet / cumDRev;
  }
  const workingCapitalRate = mean(years.filter((y) => rev[y] > 0).map((y) => (assetsCur[y] - cashOp[y] - liabCur[y]) / rev[y]));
  flags.marginalCapexAvailable = fixedCapitalRateMarginal != null;

  return {
    ok: true,
    // 🔴 880: fixedCapitalRate가 여기선 fixedCapitalRateLevel로 채워지지만, 이 함수는 "무엇이 주 판정인지"를 정하지 않는다.
    //   주 판정 = 원전식(marginal, 880 §0 확정) — 소비처(app/api/cron/revdcf/route.ts)가 이 필드를 marginal로 덮어써서 쓴다.
    //   반환 형태를 안 바꾼 이유는 타입 파장(여러 소비처가 DriverBundle.fixedCapitalRate를 참조) 때문.
    drivers: { startingSales: rev[lastY], salesGrowth, operatingMargin, startingMargin, fixedCapitalRate: fixedCapitalRateLevel, fixedCapitalRateLevel, fixedCapitalRateMarginal, workingCapitalRate },
    market: { debt, nonOperatingAssets, shares, latestYear: lastY },
    flags,
    fundamentals,
  };
}
