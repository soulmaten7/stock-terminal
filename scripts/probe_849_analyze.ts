// STEP 849 analyze — §2 WACC 조립 검산(업종) + §3 부채 + §4 비영업 A/B + §5 주식수 + §6 도미노 재현.
// 실행: npx tsx scripts/probe_849_analyze.ts   (DB 읽기 + docs/probe_849_raw.json + 엔진)
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { readFileSync } from "fs";
import { createAdminClient } from "../lib/supabase/admin";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

const q = (a: number[], p: number) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? +s[Math.floor((s.length - 1) * p)].toFixed(4) : null; };
const DPZ_CIK = "1286681";
const YS = ["2019", "2020", "2021", "2022", "2023", "2024"];

async function main() {
  const sb = createAdminClient();
  const out: Record<string, unknown> = {};
  const globals = (await sb.from("damodaran_global_inputs").select("*").single()).data as { riskfree_rate: number; erp: number };
  const usTax = Number((await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate);
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const rf = Number(globals.riskfree_rate), erp = Number(globals.erp);

  // ── §2 업종 WACC 조립 검산 (94 업종: 우리 조립 vs 다모다란 cost_of_capital) ──
  const betas = (await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, de_ratio, std_dev_equity")).data as Record<string, number | string>[];
  const waccs = (await sb.from("damodaran_wacc").select("industry, cost_of_capital")).data as Record<string, number | string>[];
  const wmap = new Map(waccs.map((w) => [w.industry as string, Number(w.cost_of_capital)]));
  const diffs: number[] = []; const rows: unknown[] = [];
  for (const b of betas) {
    const ind = b.industry as string; const coc = wmap.get(ind); if (coc == null) continue;
    const spread = creditSpreadFor(Number(b.std_dev_equity), spreads); if (spread == null) continue;
    const asm = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: Number(b.unlevered_beta_cash_adj), taxRate: usTax, deRatio: Number(b.de_ratio), creditSpread: spread });
    diffs.push(asm.wacc - coc);
    rows.push({ ind, assembled: +asm.wacc.toFixed(4), damodaran: +coc.toFixed(4), diff: +(asm.wacc - coc).toFixed(4) });
  }
  out.wacc_industry_check = { n: diffs.length, diff_median: q(diffs, 0.5), diff_p10: q(diffs, 0.1), diff_p90: q(diffs, 0.9), note: "우리 조립(marginal tax 0.2563) vs 다모다란 완성(eff_tax). 차이는 세율 정의 차 위주" };

  // ── 849 raw (604 부채·주식수·현금+증권) ──
  type M = Record<string, number>;
  type PerRow = { cik: string; debtCore: M; debtWithLease: M; sharesDei: M; sharesGaap: M; sharesDilutedWavg: M; cash: M; securities: M; cashPlusSec: M };
  const raw = JSON.parse(readFileSync("docs/probe_849_raw.json", "utf8")) as { perCik: Record<string, PerRow & { _err?: unknown }> };
  const per = Object.entries(raw.perCik).filter(([, v]) => !v._err).map(([cik, v]) => ({ ...v, cik })) as PerRow[];
  const has5 = (m: M) => ["2020", "2021", "2022", "2023", "2024"].every((y) => m && m[y] != null);

  // §3 부채 커버리지
  out.debt = {
    coverage: { debtCore5yr: per.filter((p) => has5(p.debtCore)).length, debtWithLease5yr: per.filter((p) => has5(p.debtWithLease)).length, total: per.length },
    note: "debtCore=LongTermDebt(+AndCapitalLease)+current · withLease=+operating/finance lease. DPZ는 별도 태그(아래)",
  };

  // §5 주식수 커버리지 + 태그 선택
  out.shares = {
    coverage: { dei: per.filter((p) => has5(p.sharesDei)).length, gaap: per.filter((p) => has5(p.sharesGaap)).length, dilutedWavg: per.filter((p) => has5(p.sharesDilutedWavg)).length, total: per.length },
  };

  // §4 비영업 A vs B는 §6 DPZ 엔진에서 직접 산출(shift = 0.02×sales/shares).

  // ── §6 도미노 전 입력 재현 + WACC 조립 + GAP ──
  // DPZ 부채: DebtAndCapitalLeaseObligations 총액(별도 조회)
  const dpzFacts = await (await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK0001286681.json`, { headers: { "User-Agent": process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app" } })).json();
  const gd = dpzFacts.facts["us-gaap"], deid = dpzFacts.facts["dei"];
  const calY = (e: string) => { const y = +e.slice(0, 4), m = +e.slice(5, 7); return m <= 5 ? y - 1 : y; };
  const pick = (src: Record<string, { units?: Record<string, { form?: string; fp?: string; start?: string; end: string; val: number }[]> }>, tags: string[], unit = "USD", ty = 2019): number | null => {
    for (const t of tags) { const arr = src[t]?.units?.[unit]; if (!arr) continue; for (const e of arr) { if (!/^10-K/.test(String(e.form)) || e.val == null) continue; if (e.fp && e.fp !== "FY") continue; if (!e.start && calY(e.end) === ty) return e.val; } } return null;
  };
  const debtTotal = pick(gd, ["DebtAndCapitalLeaseObligations"]) ?? ((pick(gd, ["LongTermDebtAndCapitalLeaseObligations"]) ?? 0) + (pick(gd, ["LongTermDebtAndCapitalLeaseObligationsCurrent"]) ?? 0));
  const nonOpRestr = pick(gd, ["CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"]);
  const nonOpCashOnly = pick(gd, ["CashAndCashEquivalentsAtCarryingValue"]);
  const marketSec = pick(gd, ["MarketableSecuritiesNoncurrent", "MarketableSecuritiesCurrent"]) ?? 0;
  const sharesDei19 = pick(deid, ["EntityCommonStockSharesOutstanding"], "shares", 2019);
  const sharesDei20 = pick(deid, ["EntityCommonStockSharesOutstanding"], "shares", 2020);

  // WACC 조립 (도미노 업종 Restaurant/Dining · D/E는 T8 시장가치 기준)
  const rd = (await sb.from("damodaran_beta").select("unlevered_beta_cash_adj, de_ratio, std_dev_equity").eq("industry", "Restaurant/Dining").single()).data as { unlevered_beta_cash_adj: number; de_ratio: number; std_dev_equity: number };
  const equityMV = 39.35 * 418; // T8 = 16448.3
  const debtM = (debtTotal ?? 4114) / 1e6;
  const deRatioDpz = debtM / equityMV;
  const spreadDpz = creditSpreadFor(Number(rd.std_dev_equity), spreads)!;
  const asmDpz = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: Number(rd.unlevered_beta_cash_adj), taxRate: usTax, deRatio: deRatioDpz, creditSpread: spreadDpz });

  // 엔진: T8 드라이버 + 우리 조달(debt·nonop·shares·조립WACC)
  const D: RevDcfDrivers = { startingSales: 3618.8, salesGrowth: 0.07, operatingMargin: 0.175, startingMargin: 0.1739, taxRate: 0.165, fixedCapitalRate: 0.15, workingCapitalRate: 0.10 };
  const nonOpA = ((nonOpRestr ?? nonOpCashOnly) ?? 0) / 1e6 + marketSec / 1e6; // A: 현금+제한현금+증권
  const nonOpB = nonOpA - 0.02 * 3618.8; // B: −매출2%
  const sharesM = (sharesDei20 ?? sharesDei19 ?? 39.35e6) / 1e6;
  const mkMarket = (wacc: number, nonOp: number): RevDcfMarket => ({ wacc, inflation: 0.016, sharePrice: 418, sharesOutstanding: sharesM, debt: debtM, nonOperatingAssets: nonOp });
  const gapOf = (wacc: number, nonOp: number) => { const r = runRevDcf(D, mkMarket(wacc, nonOp), { maxYears: 100 }); return r.verdict.kind === "years" ? String(r.verdict.gap) : r.verdict.kind === "over_cap" ? `25+(${((r.verdict as { explainedPct: number }).explainedPct * 100).toFixed(0)}%)` : r.verdict.kind; };

  out.dpz = {
    debt_reproduced_M: +debtM.toFixed(1), t8_debt: 4170,
    nonOp_A_M: +nonOpA.toFixed(1), nonOp_B_M: +nonOpB.toFixed(1), t8_nonOp: 391.9, cashOnly_M: nonOpCashOnly ? +(nonOpCashOnly / 1e6).toFixed(1) : null, restrictedInclusive_M: nonOpRestr ? +(nonOpRestr / 1e6).toFixed(1) : null,
    shares_dei2019_M: sharesDei19 ? +(sharesDei19 / 1e6).toFixed(2) : null, shares_dei2020_M: sharesDei20 ? +(sharesDei20 / 1e6).toFixed(2) : null, t8_shares: 39.35,
    assembledWacc: +asmDpz.wacc.toFixed(4), t8_wacc: 0.05357, deRatio: +deRatioDpz.toFixed(4), creditSpread: spreadDpz,
    gap_ourWacc_nonOpA: gapOf(asmDpz.wacc, nonOpA),
    gap_t8Wacc_nonOpA: gapOf(0.05357, nonOpA),
    sensitivity: computeGapWithSensitivity(D, mkMarket(asmDpz.wacc, nonOpA), { maxYears: 100 }),
    nonOp_AvsB_gap: { A: gapOf(0.05357, nonOpA), B: gapOf(0.05357, nonOpB), shiftPerShare: +((0.02 * 3618.8) / sharesM).toFixed(2) },
  };
  console.log(JSON.stringify(out, null, 2));
  const fs = await import("node:fs"); fs.writeFileSync("docs/probe_849_output.json", JSON.stringify(out, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
