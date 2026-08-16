// STEP 1054 §2-2~2-5 — 재료 다섯(총자산·총부채·이익잉여금·영업현금흐름·배당)의 실제 공급 실측.
// 🔴 DB 쓰기 0. lib/revdcf/drivers.ts는 import만(annualMap·coalesceMap·resolveYearWindow·DEBT_LT·DEBT_CUR·
//   FIN_LEASE·DEBT_TOTAL_SINGLE·NET_INCOME) — 배열에 아무것도 추가하지 않는다.
// 🔴 REV·COST 배열은 drivers.ts가 export하지 않으므로(모듈 비공개 const) 원문(drivers.ts:93,106)을
//   읽기 전용으로 그대로 복사해 참조한다 — drivers.ts 자체는 건드리지 않는다(⓪-3b).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { annualMap, coalesceMap, resolveYearWindow, DEBT_LT, NET_INCOME } from "../lib/revdcf/drivers";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";

const CACHE_DIR = "docs/probe_951_cache";

// drivers.ts:93 원문 그대로 복사(비공개 const라 import 불가) — 읽기 전용 참조.
const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];

// ── §2-3 후보 태그(5개념) ──────────────────────────────────────────────────
const CAND_ASSETS = ["Assets"];
const CAND_LIAB = ["Liabilities"];
const CAND_LIAB_SE = ["LiabilitiesAndStockholdersEquity"]; // 재구성 가능성 확인용(자산−자기자본)
const CAND_RE = ["RetainedEarningsAccumulatedDeficit", "RetainedEarnings"];
const CAND_CFO = ["NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations"];
const CAND_DIV_PAID = ["PaymentsOfDividends", "PaymentsOfDividendsCommonStock"];
const CAND_DIV_DECLARED = ["CommonStockDividendsPerShareDeclared"];
const CAND_DIV_CASHPAID_PS = ["CommonStockDividendsPerShareCashPaid"]; // 참고용(선언/지급 둘 다 아닌 제3의 변형)

type Gaap = Record<string, { units?: Record<string, any[]> }>;

function tierCoverage(map: Record<number, number>, refLy: number | null): { any: boolean; latest: boolean; consec2: boolean; usedFallback: boolean } {
  const years = Object.keys(map).map(Number);
  const any = years.length > 0;
  let latest = false, usedFallback = false;
  let ly = refLy;
  if (ly == null) { usedFallback = true; ly = years.length ? Math.max(...years) : null; }
  if (ly != null) latest = map[ly] != null;
  const maxY = years.length ? Math.max(...years) : null;
  const consec2 = maxY != null && map[maxY] != null && map[maxY - 1] != null;
  return { any, latest, consec2, usedFallback };
}

async function main() {
  const sb = createAdminClient();
  const popRows = await fetchAllRows<{ symbol: string; cik: number }>(
    () => sb.from("us_fundamentals").select("symbol, cik"),
    [{ column: "symbol" }]
  );
  const population = popRows.filter((r) => r.cik != null).map((r) => r.symbol);
  console.log(`모집단(us_fundamentals): ${population.length}`);

  const sectorRows = await fetchAllRows<{ symbol: string; sector: string | null }>(
    () => sb.from("us_sector_wide").select("symbol, sector"),
    [{ column: "symbol" }]
  );
  const sectorBySym = new Map(sectorRows.map((r) => [r.symbol, r.sector]));

  const cacheFiles = new Set(fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json")));
  const targets = population.filter((s) => cacheFiles.has(`${s}.json`));
  console.log(`캐시 존재(분석 대상): ${targets.length} / 모집단 ${population.length}`);

  // ── §2-2 태그 빈도표 ──────────────────────────────────────────────────
  const tagFreq: Record<string, number> = {};
  let processed = 0, jsonErrors = 0;

  // ── §2-3/2-4 커버리지 누적 ──────────────────────────────────────────────
  const covAcc: Record<string, { any: number; latest: number; consec2: number; fallback: number }> = {};
  const covInit = () => ({ any: 0, latest: 0, consec2: 0, fallback: 0 });
  for (const k of ["assets", "liab", "liabSE", "re_accDef_only", "re_coalesced", "cfo", "divPaid", "divDeclared", "divCashPaidPS"]) covAcc[k] = covInit();

  // ── §2-5 모델 완성 가능성 누적 ────────────────────────────────────────
  let piotroskiSignal = { roa: 0, cfo: 0, droa: 0, accrual: 0, dlever: 0, dliquid: 0, eqoffer: 0, dmargin: 0, dturn: 0 };
  let piotroskiAll9 = 0;
  let noReferenceYear = 0; // REV 태그 자체가 없어 기준연도(ly)를 못 잡은 종목수
  const altman = { manuZ: 0, nonManuZpp: 0, unclassified: 0, sectorMissing: 0 };
  let divYieldEligible = 0, divStreakEligible = 0, ddmEligible = 0, divZeroExcluded = 0;
  let assetGrowthEligible = 0;
  let bmEligible = 0; // 장부가(자기자본) 존재 — 기존 us_fundamentals.equity 재사용(회사 스캔 불필요, 아래 별도 카운트)

  const maxYear = new Date().getFullYear();

  for (const symbol of targets) {
    let raw: any;
    try {
      raw = JSON.parse(fs.readFileSync(`${CACHE_DIR}/${symbol}.json`, "utf8"));
    } catch {
      jsonErrors++;
      continue;
    }
    const gaap: Gaap = raw.facts?.["us-gaap"] ?? {};
    processed++;

    for (const tag of Object.keys(gaap)) tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;

    const window = resolveYearWindow(gaap, { size: 5, maxYear });
    const refLy = window.latestAvailable; // REV 태그가 있으면 non-null(5년 연속 여부와 무관)
    if (refLy == null) noReferenceYear++;

    const assetsMap = annualMap(gaap, "Assets", "stock");
    const liabMap = annualMap(gaap, "Liabilities", "stock");
    const liabSEMap = annualMap(gaap, "LiabilitiesAndStockholdersEquity", "stock");
    const reAccDefOnly = annualMap(gaap, "RetainedEarningsAccumulatedDeficit", "stock");
    const reCoalesced = coalesceMap(gaap, CAND_RE, "stock").vals;
    const cfoMap = coalesceMap(gaap, CAND_CFO, "flow").vals;
    const divPaidMap = coalesceMap(gaap, CAND_DIV_PAID, "flow").vals;
    // 🔴 단위 버그 수정(2차 실행) — 주당 배당은 USD가 아니라 "USD/shares" 단위로 보고된다(실측 확인, AAPL 예시).
    const divDeclaredMap = annualMap(gaap, "CommonStockDividendsPerShareDeclared", "flow", "USD/shares");
    const divCashPaidPSMap = annualMap(gaap, "CommonStockDividendsPerShareCashPaid", "flow", "USD/shares");

    const bump = (key: string, m: Record<number, number>) => {
      const t = tierCoverage(m, refLy);
      if (t.any) covAcc[key].any++;
      if (t.latest) covAcc[key].latest++;
      if (t.consec2) covAcc[key].consec2++;
      if (t.usedFallback && t.any) covAcc[key].fallback++;
    };
    bump("assets", assetsMap);
    bump("liab", liabMap);
    bump("liabSE", liabSEMap);
    bump("re_accDef_only", reAccDefOnly);
    bump("re_coalesced", reCoalesced);
    bump("cfo", cfoMap);
    bump("divPaid", divPaidMap);
    bump("divDeclared", divDeclaredMap);
    bump("divCashPaidPS", divCashPaidPSMap);

    // ── §2-5 Piotroski 9신호 「성립(=계산 가능)」 판정 — t=refLy, t-1=refLy-1 ──
    if (refLy != null) {
      const t = refLy, tm1 = refLy - 1;
      const niCo = coalesceMap(gaap, NET_INCOME, "flow").vals;
      const revCo = coalesceMap(gaap, REV, "flow").vals;
      const cae = annualMap(gaap, "CostsAndExpenses", "flow");
      const gp = annualMap(gaap, "GrossProfit", "flow");
      const cost = annualMap(gaap, "CostOfRevenue", "flow"); // 근사(COST 배열 전체 아님, 총매출-총비용/GrossProfit 우선)
      const assetsCur = annualMap(gaap, "AssetsCurrent", "stock");
      const liabCur = annualMap(gaap, "LiabilitiesCurrent", "stock");
      const dLT = coalesceMap(gaap, DEBT_LT, "stock").vals;
      // 🔴 단위 버그 수정(2차 실행) — 주식수는 USD가 아니라 "shares" 단위로 보고된다(drivers.ts:367도 이 단위를 명시 전달).
      const sharesWtd = annualMap(gaap, "WeightedAverageNumberOfDilutedSharesOutstanding", "flow", "shares");
      const sharesBasic = annualMap(gaap, "WeightedAverageNumberOfSharesOutstandingBasic", "flow", "shares");
      const has2 = (m: Record<number, number>) => m[t] != null && m[tm1] != null;

      if (niCo[t] != null && assetsMap[t] != null) piotroskiSignal.roa++;
      if (cfoMap[t] != null) piotroskiSignal.cfo++;
      if (has2(niCo) && has2(assetsMap)) piotroskiSignal.droa++;
      if (cfoMap[t] != null && niCo[t] != null) piotroskiSignal.accrual++;
      if (has2(dLT) && has2(assetsMap)) piotroskiSignal.dlever++;
      if (has2(assetsCur) && has2(liabCur)) piotroskiSignal.dliquid++;
      const sharesT = sharesWtd[t] ?? sharesBasic[t]; const sharesTm1 = sharesWtd[tm1] ?? sharesBasic[tm1];
      if (sharesT != null && sharesTm1 != null) piotroskiSignal.eqoffer++;
      const gmT = gp[t] != null ? gp[t] : (revCo[t] != null && cost[t] != null ? revCo[t] - cost[t] : null);
      const gmTm1 = gp[tm1] != null ? gp[tm1] : (revCo[tm1] != null && cost[tm1] != null ? revCo[tm1] - cost[tm1] : null);
      if (gmT != null && gmTm1 != null && revCo[t] != null && revCo[tm1] != null) piotroskiSignal.dmargin++;
      if (has2(revCo) && has2(assetsMap)) piotroskiSignal.dturn++;

      const all9 =
        niCo[t] != null && assetsMap[t] != null &&
        cfoMap[t] != null &&
        has2(niCo) && has2(assetsMap) &&
        has2(dLT) &&
        has2(assetsCur) && has2(liabCur) &&
        sharesT != null && sharesTm1 != null &&
        gmT != null && gmTm1 != null && has2(revCo) &&
        has2(revCo) && has2(assetsMap);
      if (all9) piotroskiAll9++;

      // ── Altman Z/Z″ 「성립」 — X1~X5(제조업) / X1~X4(비제조업, Z″) 원자료 존재 여부 ──
      const ebit = annualMap(gaap, "OperatingIncomeLoss", "flow");
      const x1ok = assetsCur[t] != null && liabCur[t] != null && assetsMap[t] != null;
      const x2ok = reCoalesced[t] != null && assetsMap[t] != null;
      const x3ok = ebit[t] != null && assetsMap[t] != null;
      const x4ok = liabMap[t] != null; // 분자(자기자본 시가 또는 장부가)는 별도 소스(us_fundamentals/시총) — 여기선 분모(총부채)만 확인
      const x5ok = revCo[t] != null && assetsMap[t] != null;
      const sector = sectorBySym.get(symbol);
      if (sector == null) altman.sectorMissing++;
      const manuSectors = new Set(["Industrials", "Materials", "Information Technology", "Consumer Discretionary", "Energy"]);
      const isManu = sector != null && manuSectors.has(sector);
      if (sector != null) {
        if (isManu) { if (x1ok && x2ok && x3ok && x4ok && x5ok) altman.manuZ++; }
        else { if (x1ok && x2ok && x3ok && x4ok) altman.nonManuZpp++; }
      } else {
        altman.unclassified++;
      }

      // ── 배당 「성립」 ──
      const hasAnyDivPaid = Object.keys(divPaidMap).length > 0;
      const hasAnyDivDeclared = Object.keys(divDeclaredMap).length > 0;
      if (hasAnyDivPaid || hasAnyDivDeclared) divYieldEligible++;
      else divZeroExcluded++;
      const divYears = Object.keys(divPaidMap).map(Number).sort((a, b) => a - b);
      if (divYears.length >= 3) divStreakEligible++; // 연속 증가 여부를 판단하려면 최소 3개년(전전년 대비 전년, 전년 대비 금년)
      if (hasAnyDivPaid && niCo[t] != null) ddmEligible++; // DDM 성립 근사: 배당+순이익(성장률 재료) 둘 다 있음

      // ── 자산성장(연속 2년 Assets) ──
      if (has2(assetsMap)) assetGrowthEligible++;
    }
  }

  console.log(`처리 완료: ${processed}건, JSON 오류: ${jsonErrors}건, 기준연도(ly) 없음: ${noReferenceYear}건`);

  // 상위 200 태그
  const sorted = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]);
  const top200 = sorted.slice(0, 200).map(([tag, n]) => ({ tag, n, pct: +(100 * n / processed).toFixed(1) }));

  // 역방향 대조: drivers.ts가 실제 참조하는 태그 전부(복사 목록, ⓪ 주석 참조) — 각각의 빈도 조회
  const DRIVERS_TS_TAGS = [
    ...REV, "InterestIncomeExpenseNet", "NoninterestIncome",
    "CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices", "CostOfSales", "CostOfOperatingRevenues", "CostOfRevenues",
    "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic",
    "InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt",
    "PropertyPlantAndEquipmentNet", "PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization", "PropertyPlantAndEquipmentExcludingLessorAssetUnderOperatingLeaseAfterAccumulatedDepreciation", "PropertyPlantAndEquipmentOtherNet", "PublicUtilitiesPropertyPlantAndEquipmentNet",
    "CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
    "PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements",
    "PaymentsToDevelopSoftware", "CapitalizedComputerSoftwareAdditions",
    "PaymentsForProceedsFromOtherInvestingActivities", "PaymentsToAcquireBusinessesNetOfCashAcquired",
    "DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndDepletion", "DepreciationAmortizationAndAccretionNet",
    "Depreciation", "AmortizationOfIntangibleAssets",
    "WeightedAverageNumberOfSharesOutstandingBasic", "CommonStockSharesOutstanding",
    "ShortTermInvestments", "MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesCurrent", "OtherShortTermInvestments",
    ...DEBT_LT, "LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent", "ConvertibleDebtCurrent", "ConvertibleNotesPayableCurrent", "NotesPayableCurrent", "SeniorNotesCurrent", "UnsecuredDebtCurrent", "MediumtermNotesCurrent", "LongTermConstructionLoanCurrent", "ShortTermBorrowings", "OtherBorrowings",
    "FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent",
    "DebtAndCapitalLeaseObligations", "LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities",
    "WeightedAverageNumberOfDilutedSharesOutstanding",
    ...NET_INCOME,
    "StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest", "CommonStockholdersEquity",
    "PreferredStockValue", "PreferredStockValueOutstanding", "MinorityInterest",
    "GrossProfit", "CostsAndExpenses", "OperatingIncomeLoss", "AssetsCurrent", "LiabilitiesCurrent",
  ];
  const driversTagSet = new Set(DRIVERS_TS_TAGS);
  const deadTags = DRIVERS_TS_TAGS.filter((t) => !(tagFreq[t] > 0));
  const missingHighFreqCandidates = sorted.filter(([tag, n]) => !driversTagSet.has(tag) && n >= processed * 0.3).slice(0, 60).map(([tag, n]) => ({ tag, n, pct: +(100 * n / processed).toFixed(1) }));

  const out = {
    processed, jsonErrors, noReferenceYear,
    top200,
    driversTsTagCount: DRIVERS_TS_TAGS.length,
    deadTags,
    missingHighFreqCandidates,
    candidateFreq: Object.fromEntries([
      "Assets", "Liabilities", "LiabilitiesAndStockholdersEquity", "RetainedEarnings", "RetainedEarningsAccumulatedDeficit",
      "NetCashProvidedByUsedInOperatingActivities", "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
      "PaymentsOfDividends", "PaymentsOfDividendsCommonStock", "CommonStockDividendsPerShareDeclared", "CommonStockDividendsPerShareCashPaid",
    ].map((t) => [t, tagFreq[t] ?? 0])),
    coverage: covAcc,
    piotroski: { signal: piotroskiSignal, all9: piotroskiAll9, refYearBase: processed - noReferenceYear },
    altman,
    dividends: { yieldEligible: divYieldEligible, streakEligible: divStreakEligible, ddmEligible, zeroOrNoDataExcluded: divZeroExcluded },
    assetGrowthEligible,
  };
  fs.writeFileSync("docs/probe_1054_analysis.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ processed, jsonErrors, noReferenceYear, deadTagsCount: deadTags.length, missingHighFreqCount: missingHighFreqCandidates.length }, null, 2));
  console.log("candidateFreq:", JSON.stringify(out.candidateFreq, null, 2));
  console.log("coverage:", JSON.stringify(covAcc, null, 2));
  console.log("piotroski:", JSON.stringify(out.piotroski, null, 2));
  console.log("altman:", JSON.stringify(altman, null, 2));
  console.log("dividends:", JSON.stringify(out.dividends, null, 2));
  console.log("assetGrowthEligible:", assetGrowthEligible);
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
