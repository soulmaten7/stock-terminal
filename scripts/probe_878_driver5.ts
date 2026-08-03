// STEP 878 §3 — driver5 제3안 재료 수집(측정 전용·판정 금지). companyfacts는 866 캐시(/tmp/866_cf) 재사용.
// 실행: npx tsx scripts/probe_878_driver5.ts
//
// 3안-A capex-only: production marginal 공식(drivers.ts:179-184)에서 인수(acquisitions)만 제거.
// 3안-B sales-to-capital(다모다란 원문 확인 후 반영 — 세션 내 WebSearch/WebFetch로 1차 확인):
//   "Sales to Capital = Revenues / (Book Equity + Book Debt − Cash)"(Damodaran, valspr24 session11 slide195).
//   즉 투자율(레벨) = 1/(Sales to Capital) = (Book Equity+Book Debt−Cash) / Revenue — 5년 평균(레벨형, 마진널 아님).
// 3안-C Δ매출 하한 marginal: production marginal과 동일하되 |cumDRev|가 revenue 평균×k보다 작으면 계산불가(null) 처리.
//   k는 임의로 정하지 않고 전체 515사의 |cumDRev|/meanRevenue 분포에서 유도(하위 5분위·p05)한다.
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
function coalesceMap(g: Gaap, tags: string[], kind: "flow" | "stock"): Record<number, number> {
  const vals: Record<number, number> = {};
  for (const t of tags) { const m = annualMap(g, t, kind); for (const y of Object.keys(m)) { const yy = +y; if (vals[yy] == null) vals[yy] = m[yy]; } }
  return vals;
}
const has5 = (m: Record<number, number>) => YS.every((y) => m[y] != null);
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }

const CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"];
const CAPSW = ["PaymentsToDevelopSoftware", "CapitalizedComputerSoftwareAdditions"];
const OTHINV = ["PaymentsForProceedsFromOtherInvestingActivities"];
const ACQ = ["PaymentsToAcquireBusinessesNetOfCashAcquired"];
const DNA_TOTAL = ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndDepletion", "DepreciationAmortizationAndAccretionNet"];
const DEPR_ONLY = ["Depreciation"];
const AMORT_ONLY = ["AmortizationOfIntangibleAssets"];
const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
const CASH_OP = ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"];
const EQUITY = ["StockholdersEquity"];
const DEBT_LT = ["LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations"];
const DEBT_CUR = ["LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"];
const FIN_LEASE = ["FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent"];
const DEBT_TOTAL_SINGLE = ["DebtAndCapitalLeaseObligations"];

function sumMapsIfAll(...ms: Record<number, number>[]): Record<number, number> {
  const o: Record<number, number> = {};
  for (const y of YS) { let has = true, s = 0; for (const m of ms) { if (m[y] == null) { has = false; break; } s += m[y]; } if (has) o[y] = s; }
  return o;
}

function dnaFor(gaap: Gaap): Record<number, number> {
  const dnaTot = coalesceMap(gaap, DNA_TOTAL, "flow"), depr = coalesceMap(gaap, DEPR_ONLY, "flow"), amort = coalesceMap(gaap, AMORT_ONLY, "flow");
  const dna: Record<number, number> = {};
  for (const y of YS) { if (dnaTot[y] != null) dna[y] = dnaTot[y]; else if (depr[y] != null && amort[y] != null) dna[y] = depr[y] + amort[y]; }
  return dna;
}

async function main() {
  const sb = createAdminClient();
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const asOf = latest.as_of;

  type BaseRow = { cik: number; symbol: string; verdict: string; gap_years: number | null; sales_growth: number; operating_margin: number; starting_margin: number; tax_rate: number; working_capital_rate: number; wacc: number; debt: number; non_operating_assets: number; shares: number; share_price: number };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results")
      .select("cik,symbol,verdict,gap_years,sales_growth,operating_margin,starting_margin,tax_rate,working_capital_rate,wacc,debt,non_operating_assets,shares,share_price")
      .eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] baseline n=${rows.length} (515 기대 · 874·875와 동일 모집단)`);

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

  // ══════════════════════════ [1] 3안 계산 ══════════════════════════
  type Row = {
    cik: number; symbol: string; oldVerdict: string; oldGapYears: number | null;
    rateA: number | null; rateB: number | null; rateC: number | null;
    newVerdictA: string | null; newGapA: number | null;
    newVerdictB: string | null; newGapB: number | null;
    newVerdictC: string | null; newGapC: number | null;
    cumDRevAbs: number | null; meanRev: number | null;
  };
  const out: Row[] = [];
  let cfMissing = 0, noRefData = 0;
  const cumDRevRatios: number[] = []; // |cumDRev|/meanRev — k 유도용

  // 1차 패스: cumDRev/meanRev 분포만 먼저 모아 k(p05)를 유도
  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) continue;
    let j: { facts?: { "us-gaap"?: Gaap } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { continue; }
    const gaap = j.facts?.["us-gaap"] ?? {};
    const rev = coalesceMap(gaap, REV, "flow");
    if (!has5(rev)) continue;
    const cumDRev = rev[YS[4]] - rev[YS[0]];
    const meanRev = YS.reduce((a, y) => a + rev[y], 0) / YS.length;
    if (meanRev > 0) cumDRevRatios.push(Math.abs(cumDRev) / meanRev);
  }
  const kThreshold = percentile(cumDRevRatios, 5)!; // p05 — 하위 5%를 "너무 작다"로 정의
  console.error(`[1] k 유도: |cumDRev|/meanRev 분포 n=${cumDRevRatios.length} · p05=${kThreshold.toFixed(4)} · p25=${percentile(cumDRevRatios, 25)!.toFixed(4)} · p50=${percentile(cumDRevRatios, 50)!.toFixed(4)}`);

  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { cfMissing++; continue; }
    let j: { facts?: { "us-gaap"?: Gaap } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { cfMissing++; continue; }
    const gaap = j.facts?.["us-gaap"] ?? {};
    const dr = computeDrivers(gaap, {});
    if (!dr.ok) { cfMissing++; continue; }
    const rev = coalesceMap(gaap, REV, "flow");
    if (!has5(rev)) { cfMissing++; continue; }
    const cumDRev = rev[YS[4]] - rev[YS[0]];
    const meanRev = YS.reduce((a, y) => a + rev[y], 0) / YS.length;

    // ── 3안-A: capex-only(인수 제거) ──
    const capex = coalesceMap(gaap, CAPEX, "flow"), capsw = coalesceMap(gaap, CAPSW, "flow"), othinv = coalesceMap(gaap, OTHINV, "flow");
    const dna = dnaFor(gaap);
    const invYears = YS.slice(1);
    let rateA: number | null = null;
    if (invYears.every((y) => capex[y] != null && dna[y] != null) && cumDRev !== 0) {
      let cumNetA = 0; for (const y of invYears) cumNetA += Math.abs(capex[y]) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0) - Math.abs(dna[y]);
      rateA = cumNetA / cumDRev;
    }

    // ── 3안-B: sales-to-capital(다모다란) — 레벨형 5년 평균 (BookEquity+BookDebt−Cash)/Revenue ──
    const equity = coalesceMap(gaap, EQUITY, "stock");
    const single = annualMap(gaap, DEBT_TOTAL_SINGLE[0], "stock");
    const debtMap = has5(single) ? single : sumMapsIfAll(coalesceMap(gaap, DEBT_LT, "stock"), coalesceMap(gaap, DEBT_CUR, "stock"));
    const finLease = sumMapsIfAll(annualMap(gaap, FIN_LEASE[0], "stock"), annualMap(gaap, FIN_LEASE[1], "stock"));
    const cash = coalesceMap(gaap, CASH_OP, "stock");
    let rateB: number | null = null;
    if (has5(equity) && has5(debtMap) && has5(cash) && has5(rev)) {
      const ratios: number[] = [];
      for (const y of YS) { const debtY = debtMap[y] + (finLease[y] ?? 0); const invested = equity[y] + debtY - cash[y]; if (rev[y] > 0) ratios.push(invested / rev[y]); }
      if (ratios.length === 5) rateB = ratios.reduce((a, b) => a + b, 0) / 5;
    }

    // ── 3안-C: Δ매출 하한 marginal(production 공식 그대로 + 하한 가드) ──
    const acq = coalesceMap(gaap, ACQ, "flow");
    let rateC: number | null = null;
    if (invYears.every((y) => capex[y] != null && dna[y] != null) && cumDRev !== 0) {
      if (meanRev > 0 && Math.abs(cumDRev) / meanRev < kThreshold) rateC = null; // 하한 미달 → 계산불가
      else { let cumNetC = 0; for (const y of invYears) cumNetC += Math.abs(capex[y]) + Math.abs(acq[y] ?? 0) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0) - Math.abs(dna[y]); rateC = cumNetC / cumDRev; }
    }

    const ind = indByT.get(r.symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    const mcap = mcapBy.get(r.symbol.toUpperCase());
    if (!ind || !beta || !mcap) { noRefData++; continue; }
    const deRatio = dr.market.debt / mcap;
    const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
    const sharePrice = mcap / dr.market.shares;
    const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
    const drvBase = { ...dr.drivers, taxRate: usTax };
    const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : null);

    const runA = rateA != null ? runRevDcf({ ...drvBase, fixedCapitalRate: rateA }, market, { maxYears: 25 }) : null;
    const runB = rateB != null ? runRevDcf({ ...drvBase, fixedCapitalRate: rateB }, market, { maxYears: 25 }) : null;
    const runC = rateC != null ? runRevDcf({ ...drvBase, fixedCapitalRate: rateC }, market, { maxYears: 25 }) : null;

    out.push({
      cik: r.cik, symbol: r.symbol, oldVerdict: r.verdict, oldGapYears: r.gap_years,
      rateA, rateB, rateC,
      newVerdictA: runA?.verdict.kind ?? null, newGapA: runA ? gnum(runA.verdict) : null,
      newVerdictB: runB?.verdict.kind ?? null, newGapB: runB ? gnum(runB.verdict) : null,
      newVerdictC: runC?.verdict.kind ?? null, newGapC: runC ? gnum(runC.verdict) : null,
      cumDRevAbs: Math.abs(cumDRev), meanRev,
    });
  }
  writeFileSync("docs/probe_878_driver5_rows.json", JSON.stringify(out, null, 2));
  console.error(`[2] 계산 완료 n=${out.length}(cf없음/불가 ${cfMissing} · 참조없음 ${noRefData})`);

  function summarize(field: "rateA" | "rateB" | "rateC") {
    const v = out.map((o) => o[field]).filter((x): x is number => x != null);
    return { n: v.length, pctOfN: +((v.length / rows.length) * 100).toFixed(1), median: percentile(v, 50), p25: percentile(v, 25), p75: percentile(v, 75), negative: v.filter((x) => x < 0).length, absOver1: v.filter((x) => Math.abs(x) > 1).length };
  }
  function migration(field: "newVerdictA" | "newVerdictB" | "newVerdictC") {
    const mig: Record<string, number> = {}; let yearsOut = 0, yearsIn = 0, comparable = 0, yearsOutNull = 0;
    for (const o of out) {
      const nv = o[field];
      if (nv == null) { if (o.oldVerdict === "years") yearsOutNull++; continue; }
      comparable++; const key = `${o.oldVerdict}→${nv}`; mig[key] = (mig[key] || 0) + 1;
      if (o.oldVerdict === "years" && nv !== "years") yearsOut++;
      if (o.oldVerdict !== "years" && nv === "years") yearsIn++;
    }
    return { comparable, migration: mig, yearsOut, yearsIn, yearsOutIncludingNull: yearsOut + yearsOutNull, asymmetry: yearsIn > 0 ? +(yearsOut / yearsIn).toFixed(2) : null, asymmetryIncludingNull: yearsIn > 0 ? +((yearsOut + yearsOutNull) / yearsIn).toFixed(2) : null };
  }
  function gapSummary(field: "newGapA" | "newGapB" | "newGapC") {
    const g = out.filter((o) => o[field] != null).map((o) => o[field] as number);
    return { n: g.length, p25: percentile(g, 25), p50: percentile(g, 50), p75: percentile(g, 75) };
  }

  // ══════════════════════════ [3] 도미노 앵커 ══════════════════════════
  // 3안-A: T5 도미노 원본에서 인수(acquisitions)는 이미 전부 0 — 인수를 빼도 값이 안 바뀐다(875의 marginal 앵커와 동일 11.617%).
  // 3안-B: 다모다란 정의(Book Equity+Book Debt−Cash)를 도미노로 재현하려면 Book Equity가 필요하나
  //   T4·T8 어디에도 Book(장부) Equity가 없다(T8엔 Market Value of Equity 16448.3만 있음) — 앵커 테스트 불가.
  // 3안-C: 도미노 Δ매출(2014→2019)=1,624.943, 평균매출=2,647.06 → 비율 0.614로 매우 커서 어떤 합리적 k에도 하한 미달일 수 없음 → marginal과 동일하게 11.617% 재현.
  const domino = {
    optionA: { anchorable: true, note: "T5 도미노 원본 인수(acquisitions)는 전 연도 0 — 인수를 제거해도 값이 바뀌지 않는다. 875의 marginal 앵커(11.617%≈원전 11.6%)와 동일하게 재현됨. 즉 이 수정 자체는 도미노로는 검증되지 않는다(인수가 있는 실제 기업에서만 차이가 남)" },
    optionB: { anchorable: false, reason: "다모다란 정의(Book Equity+Book Debt−Cash)에 필요한 Book(장부) Equity가 T4·T8 어디에도 없다 — T8은 Market Value of Equity(16448.3)만 기록. 앵커 테스트 불가" },
    optionC: { anchorable: true, note: `도미노 Δ매출(2014→2019)=1624.943 · 평균매출≈2647.06 → 비율 0.614(≫k=${kThreshold.toFixed(4)}) — 하한 가드가 걸리지 않아 marginal과 동일하게 11.617%로 재현` },
  };

  const output = {
    asOf, n: out.length, universe: rows.length,
    kDerivation: { method: "|5년누적Δ매출| ÷ 5년평균매출의 분포에서 p05를 채택 — 임의 상수 아님", nSample: cumDRevRatios.length, p05: kThreshold, p10: percentile(cumDRevRatios, 10), p25: percentile(cumDRevRatios, 25), p50: percentile(cumDRevRatios, 50) },
    optionA_capexOnly: { distribution: summarize("rateA"), gap: gapSummary("newGapA"), verdict: migration("newVerdictA"), domino: domino.optionA },
    optionB_salesToCapital: { definition: "Damodaran: Sales to Capital = Revenues/(Book Equity+Book Debt−Cash) → 투자율(레벨) = 1/(Sales to Capital) = (BookEquity+BookDebt−Cash)/Revenue, 5년 평균", distribution: summarize("rateB"), gap: gapSummary("newGapB"), verdict: migration("newVerdictB"), domino: domino.optionB },
    optionC_deltaSalesFloor: { kThreshold, distribution: summarize("rateC"), gap: gapSummary("newGapC"), verdict: migration("newVerdictC"), domino: domino.optionC },
    currentComparison: { level: { median: 0.193, negative: 0, absOver1: 71 }, marginal: { median: 0.272, negative: 101, absOver1: 133, yearsOut: 41, yearsOutIncludingNull: 57, asymmetry: 5.13, asymmetryIncludingNull: 7.13 }, note: "874/875 기존 실측값 그대로 인용(재계산 안 함)" },
    note: "재료만 — 제안 없음. ③판정 칸은 대기 그대로. 세 안 중 무엇을 채택하자는 언급 없음.",
  };
  writeFileSync("docs/probe_878_driver5.json", JSON.stringify(output, null, 2));

  console.error(`\n=== 3안-A(capex-only) ===`);
  console.error(JSON.stringify(output.optionA_capexOnly, null, 2));
  console.error(`\n=== 3안-B(sales-to-capital) ===`);
  console.error(JSON.stringify(output.optionB_salesToCapital, null, 2));
  console.error(`\n=== 3안-C(Δ매출하한 marginal) ===`);
  console.error(JSON.stringify(output.optionC_deltaSalesFloor, null, 2));

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,887 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
