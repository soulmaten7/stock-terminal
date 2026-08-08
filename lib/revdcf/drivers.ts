/**
 * 역DCF driver 산출 (STEP 850) — SEC companyfacts 원자료 → driver 1~5 + 시작값 + 시장 부분(부채·비영업·주식수).
 *
 * 🔴 정의는 REVDCF_SPEC §B-4/§12 A(고정): driver 4·5 = 수준형 · 매출 = 항등식 선택 · 세율 = 한계세율.
 * 🔴 결측은 조용히 0으로 채우지 않는다 — 필수 5년 미확보면 skipReason.
 * 🔴 태그 union은 840/847/849 확정 목록(추측 금지). WACC 조립·주가는 배치(DB 필요)에서.
 */

type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
type Gaap = Record<string, { units?: Record<string, Fact[]> }>;

const YS = [2020, 2021, 2022, 2023, 2024]; // 5년
const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));

function annualMap(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const arr = g[tag]?.units?.[unit];
  const by: Record<number, { val: number; filed: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; if (!e.end) continue; }
    const y = calYear(e.end); const prev = by[y];
    if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: String(e.filed) };
  }
  const o: Record<number, number> = {}; for (const y of Object.keys(by)) o[+y] = by[+y].val; return o;
}
function coalesceMap(g: Gaap, tags: string[], kind: "flow" | "stock", unit = "USD"): { vals: Record<number, number>; tagAt: Record<number, string> } {
  const vals: Record<number, number> = {}, tagAt: Record<number, string> = {};
  for (const t of tags) { const m = annualMap(g, t, kind, unit); for (const y of Object.keys(m)) { const yy = +y; if (vals[yy] == null) { vals[yy] = m[yy]; tagAt[yy] = t; } } }
  return { vals, tagAt };
}
const sumMaps = (...ms: Record<number, number>[]): Record<number, number> => { const o: Record<number, number> = {}; for (const y of YS) { let s: number | null = null; for (const m of ms) if (m[y] != null) s = (s ?? 0) + m[y]; if (s != null) o[y] = s; } return o; };
const has5 = (m: Record<number, number>) => YS.every((y) => m[y] != null);
const latestYear = (m: Record<number, number>): number | null => { for (let i = YS.length - 1; i >= 0; i--) if (m[YS[i]] != null) return YS[i]; return null; };

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
const NET_INCOME = ["NetIncomeLoss", "ProfitLoss", "NetIncomeLossAvailableToCommonStockholdersBasic"];
// 🔴 2번째(...IncludingPortionAttributableToNoncontrollingInterest)는 비지배지분이 섞인다. sourceTags로 어느 태그를 썼는지 반드시 기록.
const EQUITY = ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest", "CommonStockholdersEquity"];

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

  // ── STEP 947 §2-3 — fundamentals(Q1 밸류에이션 재료) 선수집. driver 5년 게이트 전부보다 앞에서 끝낸다.
  //    아래 각 유무 게이트가 반환하는 skip 경로에도 fundamentals가 실린다. 게이트 조건식·순서·skipReason 문자열은 불변.
  // 매출: 항등식으로 태그 선택(최신연도) → 그 태그 계열, 결측연도는 coalesce 폴백
  const revCo = coalesceMap(gaap, REV, "flow");
  const ly = latestYear(revCo.vals); // has5 판정 전이라 null일 수 있다(revCo.vals가 아예 비어있는 경우)
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
  const rev: Record<number, number> = {}; for (const y of YS) rev[y] = revTagMap[y] ?? revCo.vals[y];
  flags.revenueTag = revenueTag; flags.revenueCheck = revenueCheck;

  // 영업이익: OperatingIncomeLoss → 매출−총비용(CostsAndExpenses·852 GE 등) → Pretax+Interest 재구성
  const pretax = coalesceMap(gaap, PRETAX, "flow").vals, interest = coalesceMap(gaap, INTEREST, "flow").vals;
  const oi: Record<number, number> = {}; let ebitSource = "OperatingIncomeLoss", srcRevCae = false, srcRecon = false;
  for (const y of YS) {
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
  for (const y of YS) {
    if (dnaTot[y] != null) { dna[y] = dnaTot[y]; if (dnaSrc === "none") dnaSrc = "total"; }
    else if (depr[y] != null && amort[y] != null) { dna[y] = depr[y] + amort[y]; dnaSrc = dnaSrc === "total" ? "mixed" : "split"; }
  }
  flags.dnaSource = dnaSrc;

  // STEP 947: 순이익·자기자본(새 태그 2종) — 최신 회계연도(ly) 단일 시점
  const niCo = coalesceMap(gaap, NET_INCOME, "flow");
  const eqCo = coalesceMap(gaap, EQUITY, "stock");
  const sourceTags: Record<string, string> = {};
  const fNetIncome: number | null = ly != null ? niCo.vals[ly] ?? null : null;
  if (fNetIncome != null && ly != null) sourceTags.netIncome = niCo.tagAt[ly];
  const fEquity: number | null = ly != null ? eqCo.vals[ly] ?? null : null;
  if (fEquity != null && ly != null) sourceTags.equity = eqCo.tagAt[ly];
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
  const fundamentals: DriverFundamentals = { netIncome: fNetIncome, equity: fEquity, revenue: fRevenue, operatingIncome: fOperatingIncome, dna: fDna, fiscalYear: ly, sourceTags };

  // ── 여기부터 기존 driver 파이프라인 게이트(조건식·순서·skipReason 문자열 전부 불변, fundamentals만 얹는다) ──
  if (!has5(revCo.vals)) return { ok: false, skipReason: "INSUFFICIENT_HISTORY", flags: { ...flags, missing: "revenue<5yr" }, fundamentals };
  // 🔴 896 §4: 세 MISSING_TAG 원인(영업이익/PP&E/영업현금흐름)이 한 코드로 뭉쳐 flags.missing이 화면에 안 보이던 문제(895 §3-1) —
  //   조건식·순서·flags는 그대로 두고 반환하는 skipReason 문자열만 원인별로 나눈다. 과거 행은 "MISSING_TAG"로 남는다(REVDCF_SPEC §10).
  if (!has5(oi)) return { ok: false, skipReason: "MISSING_TAG_OPERATING_INCOME", flags: { ...flags, missing: "operatingIncome<5yr" }, fundamentals };

  // driver 5 재료: PP&E · driver 4 재료: 유동자산·유동부채·운영현금
  const ppe = coalesceMap(gaap, PPE, "stock").vals;
  const assetsCur = annualMap(gaap, "AssetsCurrent", "stock"), liabCur = annualMap(gaap, "LiabilitiesCurrent", "stock");
  const cashOp = coalesceMap(gaap, CASH_OP, "stock").vals;
  if (!has5(ppe)) return { ok: false, skipReason: "MISSING_TAG_PPE", flags: { ...flags, missing: "ppe<5yr" }, fundamentals };
  // 🔴 유동/비유동 미구분(유동성배열법) = 이 기법의 재무형식과 안 맞음 → 회수 아니라 재분류(838: 금융인접 신호)
  if (!has5(assetsCur) || !has5(liabCur)) return { ok: false, skipReason: "NOT_APPLICABLE_SECTOR", flags: { ...flags, missing: "unclassifiedBalanceSheet" }, fundamentals };
  if (!has5(cashOp)) return { ok: false, skipReason: "MISSING_TAG_OPERATING_CASH", flags: { ...flags, missing: "operatingCash<5yr" }, fundamentals };

  // 시장 부분: 주식수(희석→기본→발행→dei)·부채·비영업자산 — 최신연도
  const sharesDil = annualMap(gaap, SHARES_DIL[0], "flow", "shares");
  let sharesTag = "WeightedAverageNumberOfDilutedSharesOutstanding";
  let shares = sharesDil[latestYear(sharesDil) ?? -1];
  if (shares == null) { for (const t of SHARES_MORE) { const m = annualMap(gaap, t, t.startsWith("Weighted") ? "flow" : "stock", "shares"); const v = m[latestYear(m) ?? -1]; if (v != null) { shares = v; sharesTag = t; break; } } }
  const deiSh = annualMap(dei, "EntityCommonStockSharesOutstanding", "stock", "shares");
  if (shares == null) { shares = deiSh[latestYear(deiSh) ?? -1]; sharesTag = "dei:EntityCommonStockSharesOutstanding"; }
  if (shares == null || !(shares > 0)) {
    // 🔴 STEP 854 §3 — 멀티클래스 주식(A/B/C 등). companyfacts는 차원(class dimension) 팩트를 제외하므로 통합 주식수 총계가
    //   존재하지 않는다(V·STZ·FWONA·WMG·COKE). 클래스별 전환비율·권리가 달라 강제 합산은 시총을 왜곡 → 합치지 않고
    //   별도 사유로 정직히 건너뛴다(회수 불가·개수만 보고). 여기 도달 = 5년 영업이력 게이트(매출·영업이익·PP&E·현금)를 전부
    //   통과한 실제 상장사인데 희석→기본→발행→dei 전 폴백이 통합 총계를 못 낸 경우 = 통합 주식수가 클래스로만 존재.
    //   시그니처 확정(confirmed) = dei 커버페이지 태그는 있으나 최신 통합값 없음. 그 외는 추론(inferred).
    const deiTagPresent = !!(dei as Gaap)?.["EntityCommonStockSharesOutstanding"];
    const deiRecent = latestYear(deiSh);
    const confirmed = deiTagPresent && (deiRecent == null || deiRecent < (ly as number) - 1);
    return { ok: false, skipReason: "MULTI_CLASS_SHARES", flags: { ...flags, missing: "shares", multiClass: true, multiClassInferred: !confirmed }, fundamentals };
  }
  flags.sharesTag = sharesTag;

  const single = annualMap(gaap, DEBT_TOTAL_SINGLE[0], "stock");
  const debtMap = has5(single) || single[ly as number] != null ? single : sumMaps(coalesceMap(gaap, DEBT_LT, "stock").vals, coalesceMap(gaap, DEBT_CUR, "stock").vals, sumMaps(annualMap(gaap, FIN_LEASE[0], "stock"), annualMap(gaap, FIN_LEASE[1], "stock")));
  const debtLy = latestYear(debtMap);
  const debt = debtLy != null ? debtMap[debtLy] : 0; // 무차입이면 0 (결측 아님)
  flags.debtIsZeroOrMissing = debtLy == null;
  // 🔴 862: 부채 태그 부재 시 무차입(정상·값0) vs 진짜 결측(이자비용 있는데 태그 못 잡음) 분리
  if (debtLy == null) {
    const iMap = annualMap(gaap, "InterestExpense", "flow"); const iLy = latestYear(iMap);
    flags.debtStatus = iLy != null && Math.abs(iMap[iLy]) > 0 ? "missing" : "zero";
  } else flags.debtStatus = "present";

  const nonOpCash = coalesceMap(gaap, CASH_NONOP, "stock").vals, sec = coalesceMap(gaap, SECURITIES, "stock").vals;
  const nonOpMap = sumMaps(nonOpCash, sec);
  const nonOpLy = latestYear(nonOpMap);
  const nonOperatingAssets = nonOpLy != null ? nonOpMap[nonOpLy] : (nonOpCash[ly as number] ?? 0);

  // ── driver 계산 (백만 단위 무관 — 비율이라 상쇄) ──────────────────────────
  const firstY = YS[0], lastY = ly as number; // has5(revCo.vals) 게이트 위에서 이미 확인 — non-null 보장
  const nSpan = lastY - firstY; // 4
  const salesGrowth = nSpan > 0 && rev[firstY] > 0 ? (rev[lastY] / rev[firstY]) ** (1 / nSpan) - 1 : 0;
  const operatingMargin = mean(YS.filter((y) => rev[y] > 0).map((y) => oi[y] / rev[y]));
  const startingMargin = rev[lastY] > 0 ? oi[lastY] / rev[lastY] : operatingMargin;
  // driver 5 — 이중 산정 (852): level=PP&E÷매출 5년평균 · marginal=원전 T5 5년누적 순고정÷5년누적Δ매출
  const fixedCapitalRateLevel = mean(YS.filter((y) => rev[y] > 0).map((y) => ppe[y] / rev[y]));
  const capex = coalesceMap(gaap, CAPEX, "flow").vals;
  // 🔴 862 D&A 우선체인 — STEP 947에서 fundamentals 수집 블록으로 이동(dna·dnaSrc는 위에서 이미 계산됨), 여기서는 재사용만.
  const acq = coalesceMap(gaap, ACQ, "flow").vals, capsw = coalesceMap(gaap, CAPSW, "flow").vals, othinv = coalesceMap(gaap, OTHINV, "flow").vals;
  let fixedCapitalRateMarginal: number | null = null;
  const invYears = YS.slice(1); // 2021~2024 (Δ매출 있는 해)
  if (invYears.every((y) => capex[y] != null && dna[y] != null)) {
    let cumNet = 0; for (const y of invYears) cumNet += Math.abs(capex[y]) + Math.abs(acq[y] ?? 0) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0) - Math.abs(dna[y]);
    const cumDRev = rev[lastY] - rev[firstY];
    if (cumDRev !== 0) fixedCapitalRateMarginal = cumNet / cumDRev;
  }
  const workingCapitalRate = mean(YS.filter((y) => rev[y] > 0).map((y) => (assetsCur[y] - cashOp[y] - liabCur[y]) / rev[y]));
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
