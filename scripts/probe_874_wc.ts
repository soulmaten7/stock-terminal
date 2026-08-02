// STEP 874 — 차이 3·4행(driver 4 운전자본 · driver 5 고정자본) 원전식 실측. 측정 전용 · lib/revdcf/** 수정 금지(import만).
// 금지: revdcf_results·us_market_cap 쓰기 · data/us_symbols.json 수정 · 화면/플래그 변경 · 채택 여부 판정 · driver6/다음행 제안 · 새 산식 발명(A/B 두 안만).
// 실행: npx tsx scripts/probe_874_wc.ts
//
// §2 driver4: A안(원전 세부 태그 그대로) vs B안(집계 태그 근사) — 필요현금=매출×2%(T4 원전 그대로), 무이자 유동부채만 차감(T4 B23).
// §3 결과변화: 기존 엔진 import만(runRevDcf) — workingCapitalRate를 A/B로, fixedCapitalRate를 marginal로 교체해 재실행. 수정 없음.
//   companyfacts는 866이 캐시해 둔 /tmp/866_cf 재사용(재다운로드 금지).
// 🔴 drivers.ts가 내부 헬퍼(annualMap 등)를 export하지 않아 이 파일 안에서 companyfacts 파싱 로직을 별도로 재구현했다(동일 규칙 — 852/862와 동일 태그 정의).
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
function coalesceMap(g: Gaap, tags: string[], kind: "flow" | "stock"): { vals: Record<number, number>; tagAt: Record<number, string> } {
  const vals: Record<number, number> = {}, tagAt: Record<number, string> = {};
  for (const t of tags) { const m = annualMap(g, t, kind); for (const y of Object.keys(m)) { const yy = +y; if (vals[yy] == null) { vals[yy] = m[yy]; tagAt[yy] = t; } } }
  return { vals, tagAt };
}
const has5 = (m: Record<number, number>) => YS.every((y) => m[y] != null);
function mean(a: number[]): number { return a.reduce((x, y) => x + y, 0) / a.length; }
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }

// A안 태그(T4 원전 세부 항목 그대로)
const AR = ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent"];
const INV = ["InventoryNet"];
const OTHER_CA = ["OtherAssetsCurrent"];
const AP = ["AccountsPayableCurrent"];
const ACCRUED = ["AccruedLiabilitiesCurrent"]; // "무이자 미지급성 항목 등"(T4 B23) — 표준 태그 한 종만 존재, 광고기금부채 등 회사고유 항목은 캡처 못 함(한계로 명시)
// B안(집계 근사) 재사용 태그 — drivers.ts 852의 동일 정의를 여기서도 그대로 씀(export 안 돼 재선언)
const CASH_OP = ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"];
const SECURITIES = ["ShortTermInvestments", "MarketableSecuritiesCurrent", "AvailableForSaleSecuritiesCurrent", "OtherShortTermInvestments"];
const DEBT_CUR = ["LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"];
const SHORT_TERM_BORROW = ["ShortTermBorrowings", "ShortTermBankLoansAndNotesPayable"];

async function main() {
  const sb = createAdminClient();
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const asOf = latest.as_of;
  await run(sb, asOf);
}

async function run(sb: ReturnType<typeof createAdminClient>, asOf: string) {
  // ══════════════════════════════ [0] 515 baseline (DB 직접 재확인) ══════════════════════════════
  type BaseRow = { cik: number; symbol: string; verdict: string; gap_years: number | null; sales_growth: number; operating_margin: number; starting_margin: number; tax_rate: number; fixed_capital_rate: number; working_capital_rate: number; wacc: number; debt: number; non_operating_assets: number; shares: number; share_price: number };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results")
      .select("cik,symbol,verdict,gap_years,sales_growth,operating_margin,starting_margin,tax_rate,fixed_capital_rate,working_capital_rate,wacc,debt,non_operating_assets,shares,share_price")
      .eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] baseline n=${rows.length} (515 기대)`);

  // ══════════════════════════════ 참조데이터 ══════════════════════════════
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
  console.error(`  참조데이터 로드 완료`);

  // ══════════════════════════════ [1] 종목별 A/B/marginal 재계산 ══════════════════════════════
  type Row = {
    cik: number; symbol: string;
    wcCurrentTag: number | null; // 현행(수준형)
    wcA5yr: number | null; wcAYearly: (number | null)[]; arMissing: number; invMissing: number; otherCaMissing: number; apMissing: number; accruedMissing: number;
    wcB5yr: number | null; wcBYearly: (number | null)[];
    fcMarginal: number | null;
    oldVerdict: string; oldGapYears: number | null;
    newVerdictA: string | null; newGapYearsA: number | null;
    newVerdictB: string | null; newGapYearsB: number | null;
    newVerdictMarginal: string | null; newGapYearsMarginal: number | null;
    newVerdictCombinedA: string | null; newGapYearsCombinedA: number | null; // A(driver4) + marginal(driver5) 동시
  };
  const out: Row[] = [];
  let cfMissing = 0, noIndOrMcap = 0, arTagMissingCnt = 0, invTagMissingCnt = 0, otherCaTagMissingCnt = 0, apTagMissingCnt = 0, accruedTagMissingCnt = 0;

  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { cfMissing++; continue; }
    let j: { facts?: { "us-gaap"?: Gaap; dei?: Gaap } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { cfMissing++; continue; }
    const gaap = j.facts?.["us-gaap"] ?? {};
    const dr = computeDrivers(gaap, j.facts?.["dei"] ?? {});
    if (!dr.ok) { cfMissing++; continue; }
    const ind = indByT.get(r.symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    const mcap = mcapBy.get(r.symbol.toUpperCase());
    if (!ind || !beta || !mcap) { noIndOrMcap++; continue; }
    const deRatio = dr.market.debt / mcap;
    const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
    const sharePrice = mcap / dr.market.shares;
    const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
    const drvBase = { ...dr.drivers, taxRate: usTax };

    const revCo = (() => { const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"]; return coalesceMap(gaap, REV, "flow"); })();
    const rev = revCo.vals;

    // ── A안: 원전 세부 태그 ──
    const arM = coalesceMap(gaap, AR, "stock").vals;
    const invM = coalesceMap(gaap, INV, "stock").vals;
    const otherCaM = coalesceMap(gaap, OTHER_CA, "stock").vals;
    const apM = coalesceMap(gaap, AP, "stock").vals;
    const accruedM = coalesceMap(gaap, ACCRUED, "stock").vals;
    if (!has5(arM)) arTagMissingCnt++; if (!has5(invM)) invTagMissingCnt++; if (!has5(otherCaM)) otherCaTagMissingCnt++;
    if (!has5(apM)) apTagMissingCnt++; if (!has5(accruedM)) accruedTagMissingCnt++;
    const haveA = has5(rev) && has5(arM) && has5(invM) && has5(otherCaM) && has5(apM) && has5(accruedM);
    let wcA5yr: number | null = null; const wcAYearly: (number | null)[] = [];
    if (haveA) {
      const nwcA: Record<number, number> = {};
      for (const y of YS) { const reqCash = rev[y] * 0.02; nwcA[y] = (reqCash + arM[y] + invM[y] + otherCaM[y]) - (apM[y] + accruedM[y]); }
      for (let i = 1; i < YS.length; i++) { const dRev = rev[YS[i]] - rev[YS[i - 1]]; wcAYearly.push(dRev !== 0 ? (nwcA[YS[i]] - nwcA[YS[i - 1]]) / dRev : null); }
      const dRev5 = rev[YS[4]] - rev[YS[0]];
      wcA5yr = dRev5 !== 0 ? (nwcA[YS[4]] - nwcA[YS[0]]) / dRev5 : null;
    } else { for (let i = 1; i < YS.length; i++) wcAYearly.push(null); }

    // ── B안: 집계 태그 근사 ──
    const assetsCurM = annualMap(gaap, "AssetsCurrent", "stock");
    const liabCurM = annualMap(gaap, "LiabilitiesCurrent", "stock");
    const cashOpM = coalesceMap(gaap, CASH_OP, "stock").vals;
    const secM = coalesceMap(gaap, SECURITIES, "stock").vals;
    const debtCurM = coalesceMap(gaap, [...DEBT_CUR, ...SHORT_TERM_BORROW], "stock").vals;
    const haveB = has5(rev) && has5(assetsCurM) && has5(liabCurM) && has5(cashOpM);
    let wcB5yr: number | null = null; const wcBYearly: (number | null)[] = [];
    if (haveB) {
      const nwcB: Record<number, number> = {};
      for (const y of YS) {
        const reqCash = rev[y] * 0.02;
        const opAssets = assetsCurM[y] - cashOpM[y] - (secM[y] ?? 0) + reqCash;
        const opLiabs = liabCurM[y] - (debtCurM[y] ?? 0);
        nwcB[y] = opAssets - opLiabs;
      }
      for (let i = 1; i < YS.length; i++) { const dRev = rev[YS[i]] - rev[YS[i - 1]]; wcBYearly.push(dRev !== 0 ? (nwcB[YS[i]] - nwcB[YS[i - 1]]) / dRev : null); }
      const dRev5 = rev[YS[4]] - rev[YS[0]];
      wcB5yr = dRev5 !== 0 ? (nwcB[YS[4]] - nwcB[YS[0]]) / dRev5 : null;
    } else { for (let i = 1; i < YS.length; i++) wcBYearly.push(null); }

    const fcMarginal = dr.drivers.fixedCapitalRateMarginal;

    const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : null);
    const runA = wcA5yr != null ? runRevDcf({ ...drvBase, workingCapitalRate: wcA5yr }, market, { maxYears: 25 }) : null;
    const runB = wcB5yr != null ? runRevDcf({ ...drvBase, workingCapitalRate: wcB5yr }, market, { maxYears: 25 }) : null;
    const runMarg = fcMarginal != null ? runRevDcf({ ...drvBase, fixedCapitalRate: fcMarginal }, market, { maxYears: 25 }) : null;
    const runCombinedA = (wcA5yr != null && fcMarginal != null) ? runRevDcf({ ...drvBase, workingCapitalRate: wcA5yr, fixedCapitalRate: fcMarginal }, market, { maxYears: 25 }) : null;

    out.push({
      cik: r.cik, symbol: r.symbol,
      wcCurrentTag: r.working_capital_rate,
      wcA5yr, wcAYearly, arMissing: has5(arM) ? 0 : 1, invMissing: has5(invM) ? 0 : 1, otherCaMissing: has5(otherCaM) ? 0 : 1, apMissing: has5(apM) ? 0 : 1, accruedMissing: has5(accruedM) ? 0 : 1,
      wcB5yr, wcBYearly,
      fcMarginal,
      oldVerdict: r.verdict, oldGapYears: r.gap_years,
      newVerdictA: runA?.verdict.kind ?? null, newGapYearsA: runA ? gnum(runA.verdict) : null,
      newVerdictB: runB?.verdict.kind ?? null, newGapYearsB: runB ? gnum(runB.verdict) : null,
      newVerdictMarginal: runMarg?.verdict.kind ?? null, newGapYearsMarginal: runMarg ? gnum(runMarg.verdict) : null,
      newVerdictCombinedA: runCombinedA?.verdict.kind ?? null, newGapYearsCombinedA: runCombinedA ? gnum(runCombinedA.verdict) : null,
    });
  }
  writeFileSync("docs/probe_874_rows.json", JSON.stringify(out, null, 2));
  console.error(`[1] 재계산 n=${out.length} (cf없음 ${cfMissing} · 업종/시총없음 ${noIndOrMcap})`);
  console.error(`  A안 태그 결측(5년 미확보): AR ${arTagMissingCnt} · Inv ${invTagMissingCnt} · OtherCA ${otherCaTagMissingCnt} · AP ${apTagMissingCnt} · Accrued ${accruedTagMissingCnt}`);

  // ══════════════════════════════ [2] 집계 ══════════════════════════════
  function summarize(label: string, xs: (number | null)[]) {
    const v = xs.filter((x): x is number => x != null);
    return { n: v.length, p05: percentile(v, 5), p50: percentile(v, 50), p95: percentile(v, 95), negative: v.filter((x) => x < 0).length, absOver1: v.filter((x) => Math.abs(x) > 1).length, calcImpossible: xs.length - v.length };
  }
  const currentVals = out.map((o) => o.wcCurrentTag);
  const aVals = out.map((o) => o.wcA5yr);
  const bVals = out.map((o) => o.wcB5yr);

  function verdictMigration(newField: "newVerdictA" | "newVerdictB" | "newVerdictMarginal" | "newVerdictCombinedA") {
    const mig: Record<string, number> = {};
    let yearsOut = 0, yearsIn = 0, comparable = 0, yearsOutNullTooCanNotCompute = 0;
    for (const o of out) {
      const nv = o[newField];
      if (nv == null) { if (o.oldVerdict === "years") yearsOutNullTooCanNotCompute++; continue; }
      comparable++;
      const key = `${o.oldVerdict}→${nv}`; mig[key] = (mig[key] || 0) + 1;
      if (o.oldVerdict === "years" && nv !== "years") yearsOut++;
      if (o.oldVerdict !== "years" && nv === "years") yearsIn++;
    }
    return {
      comparable, migration: mig, yearsOut, yearsIn,
      asymmetryRatio: yearsIn > 0 ? +(yearsOut / yearsIn).toFixed(2) : null,
      // 🔴 정의 차이 병기: "판정불가(null)도 잃은 것으로 셀지"는 정의 문제다 — 둘 다 낸다.
      yearsOutIncludingNullAsLost: yearsOut + yearsOutNullTooCanNotCompute,
      asymmetryRatioIncludingNullAsLost: yearsIn > 0 ? +((yearsOut + yearsOutNullTooCanNotCompute) / yearsIn).toFixed(2) : null,
    };
  }
  function gapSummary(newField: "newGapYearsA" | "newGapYearsB" | "newGapYearsMarginal" | "newGapYearsCombinedA") {
    const gs = out.filter((o) => o[newField] != null).map((o) => o[newField] as number);
    return { n: gs.length, p25: percentile(gs, 25), p50: percentile(gs, 50), p75: percentile(gs, 75) };
  }

  const output = {
    asOf, n: out.length,
    driver4: {
      current: summarize("current", currentVals),
      A: summarize("A", aVals),
      B: summarize("B", bVals),
      tagMissing5yr: { AR: arTagMissingCnt, Inventory: invTagMissingCnt, OtherCurrentAssets: otherCaTagMissingCnt, AccountsPayable: apTagMissingCnt, AccruedLiabilities: accruedTagMissingCnt },
      note: "A안=원전 세부 태그(필요현금 매출×2%+AR+Inv+OtherCA − AP−Accrued). B안=집계 근사(AssetsCurrent−현금·단기투자+필요현금 − (LiabilitiesCurrent−이자부유동부채)). B안은 근사 — 원전처럼 무이자 항목만 정확히 골라내지 못하고 이자부 유동부채 태그로 뭉뚱그려 차감.",
    },
    resultChange: {
      A_only: { gap: gapSummary("newGapYearsA"), verdict: verdictMigration("newVerdictA") },
      B_only: { gap: gapSummary("newGapYearsB"), verdict: verdictMigration("newVerdictB") },
      driver5_marginal_only: { gap: gapSummary("newGapYearsMarginal"), verdict: verdictMigration("newVerdictMarginal") },
      driver4A_plus_driver5marginal_combined: { gap: gapSummary("newGapYearsCombinedA"), verdict: verdictMigration("newVerdictCombinedA") },
    },
    currentBaseline: { gap: { n: out.filter((o) => o.oldVerdict === "years").length, p25: percentile(out.filter((o) => o.oldVerdict === "years").map((o) => o.oldGapYears!), 25), p50: percentile(out.filter((o) => o.oldVerdict === "years").map((o) => o.oldGapYears!), 50), p75: percentile(out.filter((o) => o.oldVerdict === "years").map((o) => o.oldGapYears!), 75) } },
    note: "재료만 — 제안 없음. ③판정은 장은태.",
  };
  writeFileSync("docs/probe_874_output.json", JSON.stringify(output, null, 2));

  console.error(`\n=== driver4 요약 ===`);
  console.error(`current: n=${output.driver4.current.n} p50=${(output.driver4.current.p50! * 100).toFixed(2)}% neg=${output.driver4.current.negative}`);
  console.error(`A안: n=${output.driver4.A.n} p50=${output.driver4.A.p50 != null ? (output.driver4.A.p50 * 100).toFixed(2) + "%" : "-"} neg=${output.driver4.A.negative} 계산불가=${output.driver4.A.calcImpossible}`);
  console.error(`B안: n=${output.driver4.B.n} p50=${output.driver4.B.p50 != null ? (output.driver4.B.p50 * 100).toFixed(2) + "%" : "-"} neg=${output.driver4.B.negative} 계산불가=${output.driver4.B.calcImpossible}`);
  console.error(`\n=== 결과변화 요약 ===`);
  console.error(`A안만: GAP p50=${output.resultChange.A_only.gap.p50} · years유출=${output.resultChange.A_only.verdict.yearsOut} 유입=${output.resultChange.A_only.verdict.yearsIn} 비대칭=${output.resultChange.A_only.verdict.asymmetryRatio}`);
  console.error(`B안만: GAP p50=${output.resultChange.B_only.gap.p50} · years유출=${output.resultChange.B_only.verdict.yearsOut} 유입=${output.resultChange.B_only.verdict.yearsIn} 비대칭=${output.resultChange.B_only.verdict.asymmetryRatio}`);
  console.error(`driver5(marginal)만: GAP p50=${output.resultChange.driver5_marginal_only.gap.p50} · years유출=${output.resultChange.driver5_marginal_only.verdict.yearsOut} 유입=${output.resultChange.driver5_marginal_only.verdict.yearsIn} 비대칭=${output.resultChange.driver5_marginal_only.verdict.asymmetryRatio}`);
  console.error(`A+driver5marginal 동시: GAP p50=${output.resultChange.driver4A_plus_driver5marginal_combined.gap.p50} · years유출=${output.resultChange.driver4A_plus_driver5marginal_combined.verdict.yearsOut} 유입=${output.resultChange.driver4A_plus_driver5marginal_combined.verdict.yearsIn} 비대칭=${output.resultChange.driver4A_plus_driver5marginal_combined.verdict.asymmetryRatio}`);

  // 무변경 확인
  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,886 기대)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
