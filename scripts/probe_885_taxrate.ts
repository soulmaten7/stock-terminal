// STEP 885 §1 — 세율 순효과 실측(§10 #50). 881과 같은 형식으로 "세율만" 격리.
// 읽기만 · DB 쓰기 없음. 883/884와 동일 모집단(marginal 채택 후 464사) 재사용.
// 실행: NODE_OPTIONS="--max-old-space-size=8192" npx tsx scripts/probe_885_taxrate.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;
const YS = [2020, 2021, 2022, 2023, 2024];
const q = (a: number[], p: number) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))] : null; };

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

// 847과 동일 태그(scripts/probe_847_extract.mjs 재사용)
const OI = ["OperatingIncomeLoss"];
const PRETAX = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"];
const TAX_EXP = ["IncomeTaxExpenseBenefit"];
const CASH_TAX = ["IncomeTaxesPaidNet", "IncomeTaxesPaid"];
const INTEREST = ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestIncomeExpenseNet"];

// 847식: 연도별 unlev = cashTax + |interest|×bookRate(=taxExp/pretax) → rate = unlev/oi. 유효연도(3개 이상)만 회사 평균.
function cashTaxRateFor(gaap: Gaap): { rate: number | null; validYears: number } {
  const oi = coalesceMap(gaap, OI, "flow"), pretax = coalesceMap(gaap, PRETAX, "flow"), taxExp = coalesceMap(gaap, TAX_EXP, "flow"), cashTax = coalesceMap(gaap, CASH_TAX, "flow"), interest = coalesceMap(gaap, INTEREST, "flow");
  const ctr: number[] = [];
  for (const y of YS) {
    const o = oi[y], p = pretax[y], t = taxExp[y], c = cashTax[y], i = interest[y];
    if (o == null || p == null || t == null || c == null || i == null) continue;
    if (p === 0 || o === 0) continue;
    const bookRate = t / p;
    const unlev = c + Math.abs(i) * bookRate;
    ctr.push(unlev / o);
  }
  if (ctr.length < 3) return { rate: null, validYears: ctr.length };
  return { rate: ctr.reduce((a, b) => a + b, 0) / ctr.length, validYears: ctr.length };
}

async function main() {
  const sb = createAdminClient();
  const asOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data!.as_of as string;

  type BaseRow = { cik: number; symbol: string; wacc: number; beta_unlevered: number; de_ratio: number; share_price: number; shares: number; debt: number; non_operating_assets: number; operating_margin: number; working_capital_rate: number; verdict: string; gap_years: number | null; flags: { industry?: string } };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("cik,symbol,wacc,beta_unlevered,de_ratio,share_price,shares,debt,non_operating_assets,operating_margin,working_capital_rate,verdict,gap_years,flags").eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] 모집단 n=${rows.length}(515 기대·883/884와 동일 소스)`);

  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { riskfree_rate: number; erp: number };
  const rf = +gi.riskfree_rate, erp = +gi.erp;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaRows = (await sb.from("damodaran_beta").select("industry, std_dev_equity")).data as { industry: string; std_dev_equity: number }[];
  const stdDevByInd = new Map(betaRows.map((b) => [b.industry, +b.std_dev_equity]));

  type Row = BaseRow & { startingSales: number; salesGrowth: number; startingMargin: number; fixedCapitalRateMarginal: number; cashTaxRate: number | null; cashTaxValidYears: number; creditSpread: number | null };
  const out: Row[] = [];
  let noMarginal = 0, cfMissing = 0, noIndustryMatch = 0;
  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { cfMissing++; continue; }
    let j: { facts?: { "us-gaap"?: Gaap } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { cfMissing++; continue; }
    const gaap = j.facts?.["us-gaap"] ?? {};
    const dr = computeDrivers(gaap as never, {} as never);
    if (!dr.ok) { cfMissing++; continue; }
    if (dr.drivers.fixedCapitalRateMarginal == null) { noMarginal++; continue; } // 880 결정과 동일 모집단
    const { rate: cashTaxRate, validYears } = cashTaxRateFor(gaap);
    const ind = r.flags?.industry;
    const sd = ind ? stdDevByInd.get(ind) : undefined;
    const creditSpread = sd != null ? creditSpreadFor(sd, spreads) : null;
    if (creditSpread == null) noIndustryMatch++;
    out.push({ ...r, startingSales: dr.drivers.startingSales, salesGrowth: dr.drivers.salesGrowth, startingMargin: dr.drivers.startingMargin, fixedCapitalRateMarginal: dr.drivers.fixedCapitalRateMarginal, cashTaxRate, cashTaxValidYears: validYears, creditSpread });
  }
  console.error(`[1] 계산가능 n=${out.length}(marginal없음 ${noMarginal}·cf없음/불가 ${cfMissing}·업종/스프레드매칭실패 ${noIndustryMatch})`);

  const withCashTax = out.filter((r) => r.cashTaxRate != null);
  const coverage = { n: out.length, cashTaxAvailable: withCashTax.length, pct: +((withCashTax.length / out.length) * 100).toFixed(1), note: "847 원측정 58%(604 모집단 기준)와 다른 모집단(464·marginal채택후) — 직접 비교 불가, 재측정치로 병기" };

  function waccWithTax(r: Row, tax: number): number | null {
    if (r.creditSpread == null) return null;
    const asm = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +r.beta_unlevered, taxRate: tax, deRatio: +r.de_ratio, creditSpread: r.creditSpread });
    return asm.wacc;
  }
  function driversFor(r: Row, nopatTax: number): RevDcfDrivers {
    return { startingSales: r.startingSales, salesGrowth: r.salesGrowth, operatingMargin: +r.operating_margin, startingMargin: r.startingMargin, taxRate: nopatTax, fixedCapitalRate: r.fixedCapitalRateMarginal, workingCapitalRate: +r.working_capital_rate };
  }
  function marketFor(r: Row, wacc: number): RevDcfMarket {
    return { wacc, inflation: 0.025, sharePrice: +r.share_price, sharesOutstanding: +r.shares, debt: +r.debt, nonOperatingAssets: +r.non_operating_assets };
  }

  function runScenario(nopatTaxOf: (r: Row) => number | null, waccTaxOf: (r: Row) => number | null) {
    let years = 0, belowOne = 0, overCap = 0, valueDestroying = 0, invalid = 0, notComputable = 0;
    const gaps: number[] = [];
    const migration: Record<string, number> = {};
    let yearsOut = 0, yearsIn = 0, yearsOutNull = 0;
    const dRows: { symbol: string; nopatTax: number; wacc: number; oldVerdict: string; newVerdict: string; newGap: number | null }[] = [];
    for (const r of withCashTax) {
      const nopatTax = nopatTaxOf(r), waccTax = waccTaxOf(r);
      if (nopatTax == null) { notComputable++; if (r.verdict === "years") yearsOutNull++; continue; }
      const wacc = waccTax == null ? null : waccWithTax(r, waccTax);
      if (wacc == null) { notComputable++; if (r.verdict === "years") yearsOutNull++; continue; }
      const res = runRevDcf(driversFor(r, nopatTax), marketFor(r, wacc), { maxYears: 25 });
      const kind = res.verdict.kind;
      const key = `${r.verdict}→${kind}`; migration[key] = (migration[key] || 0) + 1;
      if (r.verdict === "years" && kind !== "years") yearsOut++;
      if (r.verdict !== "years" && kind === "years") yearsIn++;
      if (kind === "years") { years++; gaps.push((res.verdict as { gap: number }).gap); }
      else if (kind === "below_one") belowOne++;
      else if (kind === "over_cap") overCap++;
      else if (kind === "value_destroying") valueDestroying++;
      else invalid++;
      if (dRows.length < 5) dRows.push({ symbol: r.symbol, nopatTax, wacc, oldVerdict: r.verdict, newVerdict: kind, newGap: kind === "years" ? (res.verdict as { gap: number }).gap : null });
    }
    return {
      n: withCashTax.length - notComputable, notComputable, years, belowOne, overCap, valueDestroying, invalid,
      gapP25: q(gaps, 0.25), gapMedian: q(gaps, 0.5), gapP75: q(gaps, 0.75),
      migration, yearsOut, yearsIn, yearsOutIncludingNull: yearsOut + yearsOutNull,
      asymmetry: yearsIn > 0 ? +(yearsOut / yearsIn).toFixed(2) : null, asymmetryIncludingNull: yearsIn > 0 ? +((yearsOut + yearsOutNull) / yearsIn).toFixed(2) : null,
      sample: dRows,
    };
  }

  const baseline = runScenario((r) => usTax, (r) => usTax); // 현행(기준) — 참고용, cashTax 확보 종목만으로 재현
  const scenarioA = runScenario((r) => r.cashTaxRate, (r) => r.cashTaxRate); // 원전이 실제로 하는 것 — 양쪽 다 현금세율
  const scenarioB = runScenario((r) => r.cashTaxRate, (r) => usTax); // NOPAT만 현금세율
  const scenarioC = runScenario((r) => usTax, (r) => r.cashTaxRate); // WACC만 현금세율

  // 도미노 앵커: T8 드라이버 그대로 tax=0.165(현금세율)를 NOPAT·WACC 양쪽에 — 이미 engine.test.ts가 검증(GAP=8·value(1)≈285). 여기선 재확인만.
  const DPZ_D: RevDcfDrivers = { startingSales: 3618.8, salesGrowth: 0.07, operatingMargin: 0.175, startingMargin: 0.1739, taxRate: 0.165, fixedCapitalRate: 0.15, workingCapitalRate: 0.10 };
  const DPZ_M: RevDcfMarket = { wacc: 0.05357, inflation: 0.016, sharePrice: 418, sharesOutstanding: 39.35, debt: 4170, nonOperatingAssets: 391.9 };
  const dominoAnchor = { scenarioA_bookTax0165_bothSides: runRevDcf(DPZ_D, DPZ_M).verdict, note: "engine.test.ts가 이미 검증하는 것과 동일 설정(taxRate=0.165 NOPAT·WACC 양쪽) — 원전이 실제로 하는 시나리오A를 도미노에 적용하면 이미 알려진 GAP=8 재현과 동치임을 재확인" };

  // B·C 상쇄 방향/크기: A(양쪽)의 WACC 중앙값 vs 기준 WACC 중앙값, B/C 각각의 방향성
  const waccBase = withCashTax.map((r) => +r.wacc).filter(Number.isFinite);
  const waccA = withCashTax.map((r) => (r.cashTaxRate != null && r.creditSpread != null) ? waccWithTax(r, r.cashTaxRate) : null).filter((x): x is number => x != null);
  const waccC = withCashTax.map((r) => (r.cashTaxRate != null && r.creditSpread != null) ? waccWithTax(r, r.cashTaxRate) : null).filter((x): x is number => x != null); // C의 WACC=A의 WACC(같은 세율식) — B는 baseline WACC 그대로
  const offsetAnalysis = {
    wacc_median_base_taxUs: q(waccBase, 0.5), wacc_median_cashTax: q(waccA, 0.5),
    note: "B(NOPAT만 현금세율)는 WACC 불변(기준과 동일) — NOPAT 감소 방향(세율↑→GAP↑)만 단독 관찰 가능. C(WACC만 현금세율)는 NOPAT 불변 — WACC 하락(세율↑→세후부채비용↓→WACC↓→GAP↓) 방향만 단독 관찰 가능. A는 둘의 합성.",
  };

  const output = {
    asOf, coverage, offsetAnalysis, dominoAnchor,
    baseline_taxUs_bothSides: baseline, scenarioA_cashTax_bothSides: scenarioA, scenarioB_cashTax_NOPAT_only: scenarioB, scenarioC_cashTax_WACC_only: scenarioC,
    note: "재료만 — driver3 판정(현행 유지)은 §1 지시대로 바꾸지 않음. 대가·재검토조건 채우기는 보고에서.",
  };
  writeFileSync("docs/probe_885_taxrate.json", JSON.stringify(output, null, 2));
  console.error(JSON.stringify(output, null, 2));

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,887 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
