/**
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

// STEP 951 §1 — 창 계산의 유일한 출처. 코드와 docs/REVDCF_SPEC.md가 같은 5줄을 가리킨다(규칙 5-2 ⑤):
//   ① 기준은 매출(REV 후보 태그의 coalesce 결과) 하나다 — 태그마다 따로 창을 잡지 않는다.
//   ② 10-K 연간 항목만 센다(annualMap의 isAnnual·기간 300~400일 필터).
//   ③ calYear(end)로 귀속 연도를 구한다(5월 경계 규칙 그대로).
//   ④ 가장 최신 연도부터 거꾸로 연속 size개를 잡는다 — 비연속이면 창을 만들지 않는다(reason: "NON_CONTIGUOUS").
//     연속을 요구하는 이유: CAGR의 nSpan이 실제 경과연수와 달라지면 성장률이 틀린다.
//   ⑤ 상한 maxYear를 둔다(호출부가 오늘 날짜에서 유도해 인자로 넘긴다) — 데이터 오류로 미래 연도가 들어오는 것을 막는다.
export function resolveYearWindow(gaap: Gaap, opts: { size: number; maxYear: number }): { years: number[] | null; reason?: string; latestAvailable: number | null } {
  const revVals = coalesceMap(gaap, REV, "flow").vals;
  const allYears = Object.keys(revVals).map(Number).filter((y) => y <= opts.maxYear).sort((a, b) => a - b);
  const latestAvailable = allYears.length ? allYears[allYears.length - 1] : null;
  if (allYears.length < opts.size) return { years: null, reason: "TOO_FEW_YEARS", latestAvailable };
  const top = allYears.slice(-opts.size);
  for (let i = 1; i < top.length; i++) { if (top[i] !== top[i - 1] + 1) return { years: null, reason: "NON_CONTIGUOUS", latestAvailable }; }
  return { years: top, latestAvailable };
}

// ── 태그 union (840/847/849 확정) ────────────────────────────────────────────
const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
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
const DEBT_LT = ["LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations"];
const DEBT_CUR = ["LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"];
const FIN_LEASE = ["FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent"];
const DEBT_TOTAL_SINGLE = ["DebtAndCapitalLeaseObligations"]; // 단일 총액 태그(있으면 우선)
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
  const window = resolveYearWindow(gaap, { size: WINDOW_SIZE, maxYear });

  // ── STEP 947 §2-3 — fundamentals(Q1 밸류에이션 재료) 선수집. driver 5년 게이트 전부보다 앞에서 끝낸다.
  //    아래 각 유무 게이트가 반환하는 skip 경로에도 fundamentals가 실린다. 게이트 조건식·순서·skipReason 문자열은 불변.
  //    STEP 951: 앵커 연도(ly)는 이제 resolveYearWindow가 본 최신 연도 — 창이 아예 안 잡혀도(window.years===null) 단일
  //    시점 값은 구할 수 있으면 구한다(947 설계 유지: skip 경로에도 부분 데이터).
  const revCo = coalesceMap(gaap, REV, "flow");
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
  flags.revenueTag = revenueTag; flags.revenueCheck = revenueCheck;

  // STEP 951 — 계산에 쓸 연도 집합: 창이 잡혔으면 그 5개, 아니면(fundamentals 전용) 앵커 1개뿐(또는 0개).
  const computeYears = window.years ?? (ly != null ? [ly] : []);
  const rev: Record<number, number> = {}; for (const y of computeYears) rev[y] = revTagMap[y] ?? revCo.vals[y];

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
  if (fRevenue != null && ly != null) sourceTags.revenue = revTagMap[ly] != null ? revenueTag : (revCo.tagAt[ly] ?? revenueTag);
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
  const lyCheck = latestYear(years, revCo.vals);
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
  const sharesDil = annualMap(gaap, SHARES_DIL[0], "flow", "shares");
  let sharesTag = "WeightedAverageNumberOfDilutedSharesOutstanding";
  let shares = sharesDil[latestYear(years, sharesDil) ?? -1];
  if (shares == null) { for (const t of SHARES_MORE) { const m = annualMap(gaap, t, t.startsWith("Weighted") ? "flow" : "stock", "shares"); const v = m[latestYear(years, m) ?? -1]; if (v != null) { shares = v; sharesTag = t; break; } } }
  const deiSh = annualMap(dei, "EntityCommonStockSharesOutstanding", "stock", "shares");
  if (shares == null) { shares = deiSh[latestYear(years, deiSh) ?? -1]; sharesTag = "dei:EntityCommonStockSharesOutstanding"; }
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

  const single = annualMap(gaap, DEBT_TOTAL_SINGLE[0], "stock");
  const debtMap = hasAll(years, single) || single[lastY] != null ? single : sumMaps(years, coalesceMap(gaap, DEBT_LT, "stock").vals, coalesceMap(gaap, DEBT_CUR, "stock").vals, sumMaps(years, annualMap(gaap, FIN_LEASE[0], "stock"), annualMap(gaap, FIN_LEASE[1], "stock")));
  const debtLy = latestYear(years, debtMap);
  const debt = debtLy != null ? debtMap[debtLy] : 0; // 무차입이면 0 (결측 아님)
  flags.debtIsZeroOrMissing = debtLy == null;
  // 🔴 862: 부채 태그 부재 시 무차입(정상·값0) vs 진짜 결측(이자비용 있는데 태그 못 잡음) 분리
  if (debtLy == null) {
    const iMap = annualMap(gaap, "InterestExpense", "flow"); const iLy = latestYear(years, iMap);
    flags.debtStatus = iLy != null && Math.abs(iMap[iLy]) > 0 ? "missing" : "zero";
  } else flags.debtStatus = "present";

  const nonOpCash = coalesceMap(gaap, CASH_NONOP, "stock").vals, sec = coalesceMap(gaap, SECURITIES, "stock").vals;
  const nonOpMap = sumMaps(years, nonOpCash, sec);
  const nonOpLy = latestYear(years, nonOpMap);
  const nonOperatingAssets = nonOpLy != null ? nonOpMap[nonOpLy] : (nonOpCash[lastY] ?? 0);

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
