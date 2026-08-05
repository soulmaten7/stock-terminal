// STEP 906 §2 — #46 실측: driver4가 유동부채 전액(이자부 포함)을 차감해 단기차입금이 운전자본에 섞이는 크기.
// 875(2026-08-03)의 driver4 ③판정 재검토 조건: "단기차입금 혼입의 크기를 재고 그것이 판정에 유의미하면 다시 연다."
// 측정 전용 · lib/revdcf/** 수정 없음(import만) · DB 쓰기 0 · companyfacts는 866 캐시(/tmp/866_cf) 재사용.
// 실행: npx tsx scripts/probe_906_wc_debt.ts
//
// 방법(876과 동일 원칙 — 목록을 미리 정하지 않고 실제 존재하는 태그를 먼저 센 뒤 채택한다):
// [1] 604 유니버스(최신 as_of·skip_reason null)에서 이자부 유동부채 후보 태그를 전수 스캔·빈도표.
// [2] 상위 빈도 태그(union-sum, 회사·연도별 존재하는 것만 합산 — 876의 accrued 버킷과 동일 원리)로
//     "이자부 유동부채[y]"를 구성 → liabCur_nonInterest[y] = liabCur[y] − interestBearing[y].
// [3] 현행(liabCur 전액) vs 이자부제외 workingCapitalRate로 재계산 → GAP·판정 이동(비교가능/계산불가포함 양 정의).
// [4] 도미노(T4.xlsx) 직접 재검증 — 875가 놓친 2018·2019 데이터가 'Tutorial 4' 시트에 실제로 있음(906이 재개봉해 발견).
// [5] 차입비율과 변화폭의 상관.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfMarket, type RevDcfVerdict } from "../lib/revdcf/engine";

const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;
const YS = [2020, 2021, 2022, 2023, 2024];

type Fact = { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string };
type Gaap = Record<string, { units?: Record<string, Fact[]> }>;
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
const has5 = (m: Record<number, number>) => YS.every((y) => m[y] != null);
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }
function mean(a: number[]): number { return a.reduce((x, y) => x + y, 0) / a.length; }

// 명시적 제외 — 이자부와 무관한 개념(리스는 별도 취급·중단영업·비유동)
const EXCLUDE_LEASE = /Lease/i;
const EXCLUDE_DISCONTINUED = /DisposalGroup|DiscontinuedOperation/i;
const EXCLUDE_NONCURRENT = /Noncurrent/i;
// 이자부 후보 패턴 — drivers.ts의 DEBT_CUR·FIN_LEASE(current)에 이미 쓰인 것과 같은 개념군 + 추가 후보(단기차입금류)
const CANDIDATE_PATTERN = /Debt|Borrowing|Note.*Payable|CommercialPaper|LineOfCredit|CreditFacilit|ConvertibleNotes?|BankOverdraft/i;

// [1차 스캔에서 발견 후 추가] 자산측(보유 채권·투자증권) 태그 — 이름에 "Debt"가 들어가지만 부채가 아니다.
// "BorrowingCapacity"는 실제 차입액이 아니라 한도 공시라 금액을 더하면 오염된다. 둘 다 명시 배제.
const EXCLUDE_ASSET_SIDE_DEBT_SECURITIES = /Securities|AvailableForSale|BorrowingCapacity/i;

function qualifiesInterestBearing(tag: string): boolean {
  if (!/Liabilit|Debt|Borrowing|Note.*Payable|CommercialPaper/.test(tag)) return false;
  if (!/Current/.test(tag)) return false;
  if (EXCLUDE_NONCURRENT.test(tag)) return false;
  if (EXCLUDE_LEASE.test(tag)) return false; // 리스는 별개 개념(원전도 안 다룸) — 906 범위 밖, 기록만
  if (EXCLUDE_DISCONTINUED.test(tag)) return false;
  if (EXCLUDE_ASSET_SIDE_DEBT_SECURITIES.test(tag)) return false;
  if (!CANDIDATE_PATTERN.test(tag)) return false;
  return true;
}

async function main() {
  const sb = createAdminClient();
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const asOf = latest.as_of;

  type BaseRow = { cik: number; symbol: string; verdict: string; gap_years: number | null; working_capital_rate: number; debt: number };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results")
      .select("cik,symbol,verdict,gap_years,working_capital_rate,debt")
      .eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] 계산가능 baseline n=${rows.length} (as_of=${asOf})`);

  // ══════════════════ [1] 태그 전수 스캔 — 목록 미리 정하지 않고 실제 빈도부터 ══════════════════
  const tagCompanyCount: Record<string, number> = {};
  const gaapByCik = new Map<number, Gaap>();
  let cfMissing = 0;
  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { cfMissing++; continue; }
    let j: { facts?: { "us-gaap"?: Gaap } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { cfMissing++; continue; }
    const gaap = j.facts?.["us-gaap"] ?? {};
    gaapByCik.set(r.cik, gaap);
    for (const tag of Object.keys(gaap)) {
      if (!qualifiesInterestBearing(tag)) continue;
      const m = annualMap(gaap, tag, "stock");
      if (has5(m)) tagCompanyCount[tag] = (tagCompanyCount[tag] || 0) + 1;
    }
  }
  const ranked = Object.entries(tagCompanyCount).sort((a, b) => b[1] - a[1]);
  console.error(`[1] 이자부 유동부채 후보 ${ranked.length}종(cf없음 ${cfMissing})`);
  console.error(`  상위 12: ${ranked.slice(0, 12).map(([t, n]) => `${t}=${n}`).join(" · ")}`);

  // 채택 = 빈도 상위 + drivers.ts가 이미 총부채 계산에 쓰는 개념(DEBT_CUR·FIN_LEASE-current)과 겹치는 것 우선.
  // 리스는 별개 개념이라 906 범위에서 명시적으로 제외(원전도 리스를 이 항목에서 다루지 않음).
  const chosen = ranked.filter(([t]) => !EXCLUDE_LEASE.test(t)).slice(0, 8).map(([t]) => t);
  console.error(`[1b] 채택 태그(상위 8): ${chosen.join(", ")}`);

  // ══════════════════ [2]+[3] 604 재계산 ══════════════════
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const rf = +gi.riskfree_rate, erp = +gi.erp, inflation = +gi.expected_inflation;
  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaByInd = new Map(((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[]).map((b) => [b.industry, b]));
  const indRows: { ticker_norm: string; industry_group: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("damodaran_industry").select("ticker_norm, industry_group").eq("is_us_listed", true).range(f, f + 999); const c = (data ?? []) as typeof indRows; indRows.push(...c); if (c.length < 1000) break; }
  const indByT = new Map(indRows.map((r) => [r.ticker_norm, r.industry_group]));
  const mcapRows: { symbol: string; market_cap: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapBy = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), +r.market_cap]));

  type OutRow = {
    cik: number; symbol: string; oldVerdict: string; oldGapYears: number | null;
    wcOld: number; wcAlt: number; deltaWc: number;
    interestBearingShareOfLiabCur: number; // 5년 평균 (이자부÷유동부채)
    newVerdict: string | null; newGapYears: number | null;
    leverage: number | null; // debt / (debt+marketCap)
  };
  const out: OutRow[] = [];
  let calcImpossible = 0, noRefData = 0, interestTagsAllZero = 0, noInterestTagCoverage = 0, noWaccRefData = 0;

  for (const r of rows) {
    const gaap = gaapByCik.get(r.cik);
    if (!gaap) continue;
    const dr = computeDrivers(gaap, {});
    if (!dr.ok) { calcImpossible++; continue; }

    const rev = (() => { const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"]; const vals: Record<number, number> = {}; for (const t of REV) { const m = annualMap(gaap, t, "flow"); for (const y of YS) if (vals[y] == null && m[y] != null) vals[y] = m[y]; } return vals; })();
    const assetsCur = annualMap(gaap, "AssetsCurrent", "stock"), liabCur = annualMap(gaap, "LiabilitiesCurrent", "stock");
    const CASH_OP = ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"];
    const cashOp = (() => { const vals: Record<number, number> = {}; for (const t of CASH_OP) { const m = annualMap(gaap, t, "stock"); for (const y of YS) if (vals[y] == null && m[y] != null) vals[y] = m[y]; } return vals; })();
    if (!has5(rev) || !has5(assetsCur) || !has5(liabCur) || !has5(cashOp)) { calcImpossible++; continue; }

    // 이자부 유동부채[y] = 채택 태그 union-sum(존재하는 것만 더함 — 876의 accrued 버킷과 동일 원리)
    const interestByYear: Record<number, number> = {};
    let interestHas5 = true;
    for (const y of YS) {
      let sum: number | null = null;
      for (const tag of chosen) { const m = annualMap(gaap, tag, "stock"); if (m[y] != null) sum = (sum ?? 0) + m[y]; }
      if (sum == null) { interestHas5 = false; } else interestByYear[y] = sum;
    }

    const wcOld = mean(YS.filter((y) => rev[y] > 0).map((y) => (assetsCur[y] - cashOp[y] - liabCur[y]) / rev[y]));

    let wcAlt: number | null = null, ibShare = 0;
    if (interestHas5) {
      wcAlt = mean(YS.filter((y) => rev[y] > 0).map((y) => (assetsCur[y] - cashOp[y] - (liabCur[y] - interestByYear[y])) / rev[y]));
      ibShare = mean(YS.map((y) => liabCur[y] > 0 ? interestByYear[y] / liabCur[y] : 0));
      if (YS.every((y) => interestByYear[y] === 0)) interestTagsAllZero++;
    } else { noRefData++; noInterestTagCoverage++; }

    const ind = indByT.get(r.symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    const mcap = mcapBy.get(r.symbol.toUpperCase());
    let newVerdict: string | null = null, newGapYears: number | null = null, leverage: number | null = null;
    if (wcAlt != null && !(ind && beta && mcap)) noWaccRefData++;
    if (wcAlt != null && ind && beta && mcap) {
      const deRatio = dr.market.debt / mcap;
      leverage = dr.market.debt / (dr.market.debt + mcap);
      const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
      const sharePrice = mcap / dr.market.shares;
      const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
      const drvBase = { ...dr.drivers, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal ?? dr.drivers.fixedCapitalRateLevel, taxRate: usTax };
      const run: RevDcfVerdict = runRevDcf({ ...drvBase, workingCapitalRate: wcAlt }, market, { maxYears: 25 }).verdict;
      newVerdict = run.kind; newGapYears = run.kind === "years" ? run.gap : null;
    } else if (wcAlt != null) { noRefData++; }

    out.push({ cik: r.cik, symbol: r.symbol, oldVerdict: r.verdict, oldGapYears: r.gap_years, wcOld, wcAlt: wcAlt ?? NaN, deltaWc: wcAlt != null ? wcAlt - wcOld : NaN, interestBearingShareOfLiabCur: ibShare, newVerdict, newGapYears, leverage });
  }

  const comparable = out.filter((o) => o.newVerdict != null);
  writeFileSync("docs/probe_906_wc_debt_rows.json", JSON.stringify(out, null, 2));

  const deltas = comparable.map((o) => o.deltaWc);
  const ibShares = comparable.map((o) => o.interestBearingShareOfLiabCur).filter((x) => x > 0);

  // 이동 집계 — 양 정의(비교가능만 / 계산불가 포함: old verdict가 years인데 alt 계산불가면 "유출"로 산입)
  const mig: Record<string, number> = {};
  let outFlowComparable = 0, inFlowComparable = 0;
  for (const o of comparable) { const key = `${o.oldVerdict}→${o.newVerdict}`; mig[key] = (mig[key] || 0) + 1; if (o.oldVerdict === "years" && o.newVerdict !== "years") outFlowComparable++; if (o.oldVerdict !== "years" && o.newVerdict === "years") inFlowComparable++; }
  const uncomputable = out.filter((o) => o.newVerdict == null);
  const extraOutflowFromUncomputable = uncomputable.filter((o) => o.oldVerdict === "years").length;
  const outFlowIncl = outFlowComparable + extraOutflowFromUncomputable;
  const inFlowIncl = inFlowComparable; // alt 계산불가 종목은 새로 years로 들어올 수 없음(정의상)

  // 차입비율과 변화폭 상관(피어슨)
  function pearson(xs: number[], ys: number[]): number | null {
    const n = xs.length; if (n < 2) return null;
    const mx = mean(xs), my = mean(ys);
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; num += dx * dy; dx2 += dx * dx; dy2 += dy * dy; }
    if (dx2 === 0 || dy2 === 0) return null;
    return num / Math.sqrt(dx2 * dy2);
  }
  const levComp = comparable.filter((o) => o.leverage != null);
  const corrLeverageVsAbsDelta = pearson(levComp.map((o) => o.leverage!), levComp.map((o) => Math.abs(o.deltaWc)));
  const corrLeverageVsDelta = pearson(levComp.map((o) => o.leverage!), levComp.map((o) => o.deltaWc));

  // ══════════════════ [4] 도미노 앵커 — T4.xlsx 직접 재개봉(906이 오늘 다시 열어 확인, 875의 부분전사보다 넓은 창 발견) ══════════════════
  // 🔴 875는 'Tutorial 4' 시트 rows 31-44를 2014~2017(4개년)만 전사했다(TUTORIAL4_YEARS).
  //   906이 openpyxl로 직접 재개봉(2026-08-05)해 보니 이 표는 실제로 2014~2019(6개년) 전부를 담고 있다 — 875의 전사가 불완전했다.
  //   아래 값은 T4.xlsx 'Tutorial 4' 시트 row 31(연도헤더)·32(Cash)·38(Current assets)·39(AP)·40(Current portion of LT debt)·44(Current liabilities) 그대로 전사.
  const REV_D = { 2014: 1993.827, 2015: 2216.528, 2016: 2472.61, 2017: 2787.979, 2018: 3432.844, 2019: 3618.77 };
  const CASH_D = { 2014: 30.855, 2015: 133.449, 2016: 42.815, 2017: 35.768, 2018: 25.438, 2019: 190.615 };
  const CA_D = { 2014: 428.404, 2015: 602.637, 2016: 495.873, 2017: 579.78, 2018: 566.951, 2019: 787.617 };
  const CPLTD_D = { 2014: 0.565, 2015: 59.333, 2016: 38.887, 2017: 32.324, 2018: 35.893, 2019: 43.394 }; // row40, 이자부(단기차입금)
  const CL_NONINT_D = { 2014: 265.043, 2015: 316.65, 2016: 364.811, 2017: 365.961, 2018: 343.85, 2019: 410.437 }; // row44 — T4 자신의 "Current liabilities" 소계, CPLTD 미포함(906이 항등식으로 검증: row44 == AP+Accrued+Advertising+OtherAccrued, 6개년 전부 정확 일치)
  const AR_D = { 2014: 118.395, 2015: 131.582, 2016: 150.369, 2017: 173.677, 2018: 190.091, 2019: 210.26 };
  const INV_D = { 2014: 37.944, 2015: 36.861, 2016: 40.181, 2017: 39.961, 2018: 45.975, 2019: 52.955 };
  const OCA_D = { 2014: 110.356, 2015: 119.805, 2016: 136.012, 2017: 138.612, 2018: 138.454, 2019: 124.518 };
  const YS_D6 = [2014, 2015, 2016, 2017, 2018, 2019] as const;
  const YS_D5 = [2015, 2016, 2017, 2018, 2019] as const;
  const CL_FULL_D: Record<number, number> = {}; for (const y of YS_D6) CL_FULL_D[y] = CL_NONINT_D[y as keyof typeof CL_NONINT_D] + CPLTD_D[y as keyof typeof CPLTD_D];

  function levelMean(liab: Record<number, number>, years: readonly number[]): { mean: number; annual: number[] } {
    const ratios = years.map((y) => (CA_D[y as keyof typeof CA_D] - CASH_D[y as keyof typeof CASH_D] - liab[y]) / REV_D[y as keyof typeof REV_D]);
    return { mean: mean(ratios), annual: ratios };
  }
  const level6_full = levelMean(CL_FULL_D, YS_D6), level6_nonint = levelMean(CL_NONINT_D, YS_D6);
  const level5_full = levelMean(CL_FULL_D, YS_D5), level5_nonint = levelMean(CL_NONINT_D, YS_D5);

  // marginal(endpoint 2014→2019), T4 자신의 필요현금 2% 관례(875의 A_full과 동일 관례 — I31과 같은 정의라 직접 비교 가능)
  function nwcReqCash(y: number, liab: Record<number, number>): number { const reqCash = REV_D[y as keyof typeof REV_D] * 0.02; return reqCash + AR_D[y as keyof typeof AR_D] + INV_D[y as keyof typeof INV_D] + OCA_D[y as keyof typeof OCA_D] - liab[y]; }
  const dRevD = REV_D[2019] - REV_D[2014];
  const marginalReqCash_full = (nwcReqCash(2019, CL_FULL_D) - nwcReqCash(2014, CL_FULL_D)) / dRevD;
  const marginalReqCash_nonint = (nwcReqCash(2019, CL_NONINT_D) - nwcReqCash(2014, CL_NONINT_D)) / dRevD;
  // marginal(actual cash 관례 — production의 현금처리 그대로 endpoint-differenced. I31과 관례가 달라 직접비교 아님, 참고용)
  function nwcActualCash(y: number, liab: Record<number, number>): number { return (CA_D[y as keyof typeof CA_D] - CASH_D[y as keyof typeof CASH_D]) - liab[y]; }
  const marginalActualCash_full = (nwcActualCash(2019, CL_FULL_D) - nwcActualCash(2014, CL_FULL_D)) / dRevD;
  const marginalActualCash_nonint = (nwcActualCash(2019, CL_NONINT_D) - nwcActualCash(2014, CL_NONINT_D)) / dRevD;

  const I31 = 0.005011166545534272; // T4 I31 — 875가 이미 확인한 원전 앵커값(그대로 재사용, 재추출 안 함)

  const dominoAnchor = {
    correction906: "875는 'Tutorial 4' 시트 rows31-44를 2014~2017(4개년)만 전사했다. 906이 openpyxl로 직접 재개봉(2026-08-05)해 보니 실제 표는 2014~2019(6개년) 전부를 담고 있다 — 875의 TUTORIAL4_YEARS가 불완전했다(875를 되돌리지 않음·데이터 자체는 정확했음·창만 좁았음).",
    row44IdentityCheck: "906이 6개년 전부 항등식 검증: row44(Current liabilities) == AccountsPayable+AccruedExpenses+AdvertisingFund+OtherAccrued, CurrentPortionOfLongTermDebt(row40) 미포함 — 6/6년 정확 일치(python openpyxl 직접 개봉, 오차 0). 즉 T4 자신의 '유동부채' 소계가 애초에 이자부 항목을 뺀 채로 보고된다.",
    level_production_style_actualCash: {
      window6yr_2014to2019: { withInterest_current현행: { mean: level6_full.mean, pct: (level6_full.mean * 100).toFixed(3) + "%", annual: level6_full.annual }, nonInterest_이자부제외: { mean: level6_nonint.mean, pct: (level6_nonint.mean * 100).toFixed(3) + "%", annual: level6_nonint.annual } },
      window5yr_2015to2019: { withInterest_current현행: { mean: level5_full.mean, pct: (level5_full.mean * 100).toFixed(3) + "%" }, nonInterest_이자부제외: { mean: level5_full.mean, pct: (level5_nonint.mean * 100).toFixed(3) + "%" } },
      note: "production driver4는 LEVEL(5년 평균 연간비율)이라 이 두 값이 형식상 우리 생산 공식과 같은 구조다. 그러나 I31(0.501%)은 MARGINAL(끝점차) 값이라 이 LEVEL 결과와 직접 비교(어느쪽이 I31에 가까운지)는 형식이 달라 의미가 없다 — 875가 이미 driver4-level에 대해 지적한 구조적 한계와 같은 종류.",
    },
    marginal_matching_I31_definition_reqCash: {
      I31_expected: I31, I31_pct: "0.501%",
      withInterest_현행: { value: marginalReqCash_full, pct: (marginalReqCash_full * 100).toFixed(3) + "%", diffFromI31_pp: ((marginalReqCash_full - I31) * 100).toFixed(3) },
      nonInterest_이자부제외: { value: marginalReqCash_nonint, pct: (marginalReqCash_nonint * 100).toFixed(3) + "%", diffFromI31_pp: ((marginalReqCash_nonint - I31) * 100).toFixed(3), note: "875의 A_full(0.501%)과 정확히 동일 — 906이 오늘 독립 재현" },
      finding: "T4의 필요현금 2% 관례(I31과 동일 정의)로 끝점차를 내면, 이자부 제외가 0.501%로 I31과 정확 일치하고, 이자부 포함은 -2.135%로 부호까지 반전하며 2.6%p 이상 벌어진다. 이 정의(마진·필요현금)는 I31과 형식이 같아 직접 비교가 유효하다.",
    },
    marginal_actualCash_reference_only: {
      note: "참고용 — production의 실제현금 관례를 그대로 끝점차한 것. I31의 필요현금 관례와 달라 '가까움'의 기준으로 쓰지 않는다(다른 관례로는 이자부포함이 더 가깝게 보일 수 있음 — 그 자체가 결론이 관례 선택에 좌우된다는 증거).",
      withInterest_현행: { value: marginalActualCash_full, pct: (marginalActualCash_full * 100).toFixed(3) + "%" },
      nonInterest_이자부제외: { value: marginalActualCash_nonint, pct: (marginalActualCash_nonint * 100).toFixed(3) + "%" },
    },
  };

  const output = {
    asOf, n604Computable: rows.length,
    tagScan: { candidateCount: ranked.length, top12: ranked.slice(0, 12).map(([t, n]) => ({ tag: t, companiesWithFull5yr: n })), chosen },
    coverage: { comparable: comparable.length, uncomputable: uncomputable.length, pctComparable: +((comparable.length / out.length) * 100).toFixed(1), calcImpossible, noRefData, noInterestTagCoverage, noWaccRefData, interestTagsAllZero_amongComparable: interestTagsAllZero },
    contaminationSize: { medianDeltaWc_pp: percentile(deltas, 50)! * 100, p25_pp: percentile(deltas, 25)! * 100, p75_pp: percentile(deltas, 75)! * 100, medianInterestShareOfLiabCur_pct: percentile(ibShares, 50)! * 100, p90InterestShareOfLiabCur_pct: percentile(ibShares, 90)! * 100 },
    verdictMovement: { migration: mig, outflow_comparableOnly: outFlowComparable, inflow_comparableOnly: inFlowComparable, outflow_includingUncomputable: outFlowIncl, inflow_includingUncomputable: inFlowIncl, asymmetryRatio_comparable: inFlowComparable > 0 ? +(outFlowComparable / inFlowComparable).toFixed(2) : null, asymmetryRatio_incl: inFlowIncl > 0 ? +(outFlowIncl / inFlowIncl).toFixed(2) : null },
    leverageBias: { n: levComp.length, pearsonLeverageVsAbsDelta: corrLeverageVsAbsDelta, pearsonLeverageVsSignedDelta: corrLeverageVsDelta, note: "signed delta = wcAlt - wcOld(항상 ≥0에 가까움 — 이자부 제외는 부채를 덜 빼므로 운전자본 비율이 커지는 방향). 양의 상관 = 차입 많은 기업일수록 이자부 제외 시 더 크게 오른다(=현행이 그런 기업에서 더 크게 과소평가한다는 뜻)." },
    dominoAnchor,
    priorRelatedMeasurement_REVDCF_SPEC_line754: {
      quote: "이자부 부채를 못 뺀다(단기차입금 4태그 union 60.5%) → 매출 대비 중앙 2.56%p 과소(90%분위 15.87%p)",
      source: "docs/REVDCF_SPEC.md:754 (§5 B-4 · STEP 844 · 2026-08-01 · driver4 최종화 875보다 이전)",
      discrepancy: "875(2026-08-03, 더 나중·더 권위있는 ③판정)는 driver4 각주에 '그 크기는 미측정'이라 적었다 — 844의 이 수치와 모순된다. 844의 원 스크립트를 찾지 못해(scripts/ 전수 확인 — probe_844류 부재) 오늘 재검증 불가. 906은 이 수치에 의존하지 않고 604 유니버스·현재 drivers.ts로 독립 재측정했다 — 방향(현행이 과소평가)은 일치하나 크기는 906 실측을 정본으로 본다.",
    },
    note: "재료만 — 판정 없음. driver4 ③판정(✅ 현행 유지, 875)은 이 결과와 무관하게 유지. 재검토 조건 충족 여부('유의미'의 기준 미정 — LENS_COMPLETION_STANDARD.md §1에 정의 없음)는 장은태 판단 대기.",
  };
  writeFileSync("docs/probe_906_wc_debt.json", JSON.stringify(output, null, 2));

  console.error(`\n=== 요약 ===`);
  console.error(`계산가능 비교 n=${comparable.length}/${out.length}(${output.coverage.pctComparable}%)`);
  console.error(`혼입 크기(Δ운전자본율) 중앙 ${output.contaminationSize.medianDeltaWc_pp.toFixed(2)}%p (p25 ${output.contaminationSize.p25_pp.toFixed(2)} / p75 ${output.contaminationSize.p75_pp.toFixed(2)})`);
  console.error(`이자부/유동부채 비중 중앙 ${output.contaminationSize.medianInterestShareOfLiabCur_pct.toFixed(2)}% (p90 ${output.contaminationSize.p90InterestShareOfLiabCur_pct.toFixed(2)}%)`);
  console.error(`유출(비교가능) ${outFlowComparable} / 유입(비교가능) ${inFlowComparable} · 유출(계산불가포함) ${outFlowIncl}`);
  console.error(`레버리지-|Δ| 상관 ${corrLeverageVsAbsDelta?.toFixed(3)} · 레버리지-부호있는Δ 상관 ${corrLeverageVsDelta?.toFixed(3)}`);
  console.error(`\n도미노(마진·필요현금관례): 이자부제외=${dominoAnchor.marginal_matching_I31_definition_reqCash.nonInterest_이자부제외.pct}(I31=0.501%) · 이자부포함=${dominoAnchor.marginal_matching_I31_definition_reqCash.withInterest_현행.pct}`);

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,888 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
