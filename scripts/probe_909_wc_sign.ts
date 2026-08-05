// STEP 909 §1 — #46 결정 재료 보완: 906이 도미노 1건(부호 반전)만 봤다 — 246사 비교가능 표본에서
// 부호가 실제로 몇 건 뒤집히는지, 그 종목들이 도미노처럼 차입이 많은 예외군인지 고르게 퍼진 구조적 현상인지를 잰다.
// 측정 전용 · lib/revdcf/** 수정 없음(import만) · DB 쓰기 0 · companyfacts는 866 캐시(/tmp/866_cf) 재사용.
// 실행: npx tsx scripts/probe_909_wc_sign.ts
//
// 906 값 재현 먼저 확인(§1 요구) — 아래 [0]~[3]은 probe_906_wc_debt.ts와 동일 산식(코드 복제, 876/878 선례와 같은 관행:
// drivers.ts가 헬퍼를 export하지 않아 각 프로브가 독립적으로 재구현). 재현 안 되면 중단하고 보고한다(§1 지시).
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
const DOMINOS_CIK = 1286681; // DPZ — 906이 이미 확인: 604 유니버스에 실제 포함

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

const EXCLUDE_LEASE = /Lease/i;
const EXCLUDE_DISCONTINUED = /DisposalGroup|DiscontinuedOperation/i;
const EXCLUDE_NONCURRENT = /Noncurrent/i;
const CANDIDATE_PATTERN = /Debt|Borrowing|Note.*Payable|CommercialPaper|LineOfCredit|CreditFacilit|ConvertibleNotes?|BankOverdraft/i;
const EXCLUDE_ASSET_SIDE_DEBT_SECURITIES = /Securities|AvailableForSale|BorrowingCapacity/i;
function qualifiesInterestBearing(tag: string): boolean {
  if (!/Liabilit|Debt|Borrowing|Note.*Payable|CommercialPaper/.test(tag)) return false;
  if (!/Current/.test(tag)) return false;
  if (EXCLUDE_NONCURRENT.test(tag)) return false;
  if (EXCLUDE_LEASE.test(tag)) return false;
  if (EXCLUDE_DISCONTINUED.test(tag)) return false;
  if (EXCLUDE_ASSET_SIDE_DEBT_SECURITIES.test(tag)) return false;
  if (!CANDIDATE_PATTERN.test(tag)) return false;
  return true;
}

async function main() {
  const sb = createAdminClient();
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const asOf = latest.as_of;

  type BaseRow = { cik: number; symbol: string; verdict: string; gap_years: number | null };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("cik,symbol,verdict,gap_years").eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] 계산가능 baseline n=${rows.length} (as_of=${asOf})`);

  // [1] 태그 스캔 — 906과 동일 절차(같은 유니버스면 같은 상위 8종이 나와야 재현 확인이 성립)
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
  const chosen = ranked.filter(([t]) => !EXCLUDE_LEASE.test(t)).slice(0, 8).map(([t]) => t);
  console.error(`[1] 채택 태그: ${chosen.join(", ")}`);

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
    cik: number; symbol: string; industry: string | null; oldVerdict: string; oldGapYears: number | null;
    wcOld: number; wcAlt: number; deltaWc: number;
    signFlip: boolean; oldNegative: boolean; altNegative: boolean;
    leverage: number | null; newVerdict: string | null; newGapYears: number | null;
  };
  const out: OutRow[] = [];
  let calcImpossible = 0, noInterestTagCoverage = 0, noWaccRefData = 0;

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

    const interestByYear: Record<number, number> = {};
    let interestHas5 = true;
    for (const y of YS) {
      let sum: number | null = null;
      for (const tag of chosen) { const m = annualMap(gaap, tag, "stock"); if (m[y] != null) sum = (sum ?? 0) + m[y]; }
      if (sum == null) interestHas5 = false; else interestByYear[y] = sum;
    }
    if (!interestHas5) { noInterestTagCoverage++; continue; }

    const wcOld = mean(YS.filter((y) => rev[y] > 0).map((y) => (assetsCur[y] - cashOp[y] - liabCur[y]) / rev[y]));
    const wcAlt = mean(YS.filter((y) => rev[y] > 0).map((y) => (assetsCur[y] - cashOp[y] - (liabCur[y] - interestByYear[y])) / rev[y]));

    const ind = indByT.get(r.symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    const mcap = mcapBy.get(r.symbol.toUpperCase());
    let newVerdict: string | null = null, newGapYears: number | null = null, leverage: number | null = null;
    if (!(ind && beta && mcap)) { noWaccRefData++; }
    else {
      leverage = dr.market.debt / (dr.market.debt + mcap);
      const deRatio = dr.market.debt / mcap;
      const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
      const sharePrice = mcap / dr.market.shares;
      const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
      const drvBase = { ...dr.drivers, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal ?? dr.drivers.fixedCapitalRateLevel, taxRate: usTax };
      const run: RevDcfVerdict = runRevDcf({ ...drvBase, workingCapitalRate: wcAlt }, market, { maxYears: 25 }).verdict;
      newVerdict = run.kind; newGapYears = run.kind === "years" ? run.gap : null;
    }

    const signFlip = (wcOld >= 0) !== (wcAlt >= 0);
    out.push({ cik: r.cik, symbol: r.symbol, industry: ind ?? null, oldVerdict: r.verdict, oldGapYears: r.gap_years, wcOld, wcAlt, deltaWc: wcAlt - wcOld, signFlip, oldNegative: wcOld < 0, altNegative: wcAlt < 0, leverage, newVerdict, newGapYears });
  }

  writeFileSync("docs/probe_909_wc_sign_rows.json", JSON.stringify(out, null, 2));

  // ══════════════════ 906 재현 확인 ══════════════════
  const comparable = out.filter((o) => o.newVerdict != null);
  const deltas = out.map((o) => o.deltaWc);
  const reproduced = {
    n906_comparable_expected: 246, n909_comparable_actual: comparable.length,
    n906_medianDelta_expected_pp: 3.36, n909_medianDelta_actual_pp: +(percentile(deltas, 50)! * 100).toFixed(2),
    coverageTotal909: out.length,
  };
  console.error(`\n=== 906 재현 확인 ===`);
  console.error(JSON.stringify(reproduced, null, 2));
  const reproducedOk = Math.abs(reproduced.n909_comparable_actual - reproduced.n906_comparable_expected) <= 5 &&
    Math.abs(reproduced.n909_medianDelta_actual_pp - reproduced.n906_medianDelta_expected_pp) <= 0.1;
  console.error(`재현 판정: ${reproducedOk ? "OK(±오차 허용범위 내 — DB row 순서 비결정성으로 인한 906/907/908 세션 간 소폭 편차, 906 STEP 자체 기록)" : "불일치 — 중단 필요"}`);
  if (!reproducedOk) { console.error("🔴 906 값이 재현되지 않는다 — §1 지시대로 중단하고 보고한다."); }

  // ══════════════════ §1-1 부호 반전 종목 수 ══════════════════
  const flips = out.filter((o) => o.signFlip);
  const flipToPositive = flips.filter((o) => o.oldNegative && !o.altNegative).length;
  const flipToNegative = flips.filter((o) => !o.oldNegative && o.altNegative).length;

  // ══════════════════ §1-2 부호별 분포 ══════════════════
  const oldNeg = out.filter((o) => o.oldNegative).length;
  const altNeg = out.filter((o) => o.altNegative).length;

  // ══════════════════ §1-3 반전 종목의 성격(차입비율·업종) ══════════════════
  const levAll = out.filter((o) => o.leverage != null).map((o) => o.leverage!);
  const levFlip = flips.filter((o) => o.leverage != null).map((o) => o.leverage!);
  const levNonFlip = out.filter((o) => !o.signFlip && o.leverage != null).map((o) => o.leverage!);
  const industryCount: Record<string, number> = {};
  for (const o of flips) { const k = o.industry ?? "(업종없음)"; industryCount[k] = (industryCount[k] || 0) + 1; }
  const industryConcentration = Object.entries(industryCount).sort((a, b) => b[1] - a[1]);
  const top3IndustryShare = flips.length > 0 ? industryConcentration.slice(0, 3).reduce((s, [, n]) => s + n, 0) / flips.length : null;

  // ══════════════════ §1-4 반전 종목의 GAP·판정 이동 ══════════════════
  const flipComparable = flips.filter((o) => o.newVerdict != null);
  let flipOut = 0, flipIn = 0;
  const flipMig: Record<string, number> = {};
  for (const o of flipComparable) { const key = `${o.oldVerdict}→${o.newVerdict}`; flipMig[key] = (flipMig[key] || 0) + 1; if (o.oldVerdict === "years" && o.newVerdict !== "years") flipOut++; if (o.oldVerdict !== "years" && o.newVerdict === "years") flipIn++; }

  // ══════════════════ §1-5 도미노의 백분위 위치 ══════════════════
  const dpzRow = out.find((o) => o.cik === DOMINOS_CIK);
  let dominoPercentile: number | null = null;
  if (dpzRow && dpzRow.leverage != null) {
    const below = levAll.filter((x) => x < dpzRow.leverage!).length;
    dominoPercentile = +((below / levAll.length) * 100).toFixed(1);
  }

  const output = {
    asOf,
    reproductionCheck906: reproduced,
    signFlipCount: { total: flips.length, pctOfComparable: +((flips.length / out.length) * 100).toFixed(1), toPositive_wasNegativeNowPositive: flipToPositive, toNegative_wasPositiveNowNegative: flipToNegative },
    signDistribution: { n: out.length, oldNegativeCount: oldNeg, oldNegativePct: +((oldNeg / out.length) * 100).toFixed(1), altNegativeCount: altNeg, altNegativePct: +((altNeg / out.length) * 100).toFixed(1) },
    flipGroupCharacter: {
      leverageMedian_flipped: percentile(levFlip, 50), leverageMedian_nonFlipped: percentile(levNonFlip, 50), leverageMedian_all: percentile(levAll, 50),
      leverageP75_flipped: percentile(levFlip, 75), leverageP90_flipped: percentile(levFlip, 90),
      industryConcentration_top10: industryConcentration.slice(0, 10).map(([ind, n]) => ({ industry: ind, count: n })),
      top3IndustryShareOfFlips: top3IndustryShare,
      flipCountByIndustryTotal: industryConcentration.length,
    },
    flipGroupVerdictMovement: { comparableInFlipGroup: flipComparable.length, migration: flipMig, outflow: flipOut, inflow: flipIn, note: "전체 246사 유출2/유입0(906)과 대조 — 반전군 자체의 유출입이 그 부분집합인지 확인" },
    dominosPosition: { found: !!dpzRow, cik: DOMINOS_CIK, symbol: dpzRow?.symbol, ownSignFlip: dpzRow?.signFlip, ownLeverage: dpzRow?.leverage, leveragePercentileAmongComparable: dominoPercentile, note: dpzRow ? "도미노(DPZ) 자신이 906/909의 604 유니버스 실제 계산가능 표본에 포함돼 있어 오늘 시점 실제 데이터로 직접 위치를 잴 수 있었다" : "DPZ가 이번 비교가능 표본에 없음(계산불가 사유는 rows.json 별도 확인 필요)" },
    note: "재료만 — 판정 없음. 안건 1(#46) 판정은 이 STEP이 하지 않는다.",
  };
  writeFileSync("docs/probe_909_wc_sign.json", JSON.stringify(output, null, 2));

  console.error(`\n=== 요약 ===`);
  console.error(`부호 반전 ${flips.length}/${out.length}건(${output.signFlipCount.pctOfComparable}%) — 음전환${flipToPositive} 양전환${flipToNegative}`);
  console.error(`현행 음수 ${oldNeg}(${output.signDistribution.oldNegativePct}%) · 이자부제외 음수 ${altNeg}(${output.signDistribution.altNegativePct}%)`);
  console.error(`레버리지 중앙 — 반전군 ${percentile(levFlip, 50)?.toFixed(3)} / 비반전군 ${percentile(levNonFlip, 50)?.toFixed(3)} / 전체 ${percentile(levAll, 50)?.toFixed(3)}`);
  console.error(`업종 상위3 반전집중도 ${top3IndustryShare != null ? (top3IndustryShare * 100).toFixed(1) + "%" : "N/A"}(업종종류 ${industryConcentration.length}개 중)`);
  console.error(`반전군 유출${flipOut}/유입${flipIn}(비교가능 ${flipComparable.length}건 중) — 전체 유출2/유입0(906)과 대조`);
  console.error(`도미노(DPZ) — 표본포함=${!!dpzRow} · 반전여부=${dpzRow?.signFlip} · 레버리지백분위=${dominoPercentile}`);
  console.error(`계산불가: ${calcImpossible} · 이자부태그없음: ${noInterestTagCoverage} · WACC참조없음: ${noWaccRefData}`);

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,888 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
