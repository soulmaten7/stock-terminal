// STEP 999 §2-3 — FRED 무위험수익률(4.65%)로 교체 시 WACC·verdict 변화(계산만, DB 쓰기 0).
// 🔴 이미 저장된 revdcf_results 20건(고부채·무차입·소형·대형·verdict 다양)을 그대로 읽어
//   assembleWacc()의 riskFree만 3.95%→4.65%로 바꾸고 runRevDcf()를 다시 돌린다.
//   creditSpread는 저장된 wacc로부터 역산(같은 리스크프리미엄 구조를 보존하기 위함).
import { assembleWacc } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

const ERP = 0.0446; // damodaran_global_inputs.erp(불변, 이번 STEP은 riskfree만 검증)
const RISKFREE_DAMODARAN = 0.0395; // damodaran_global_inputs.riskfree_rate(as_of 2026-01-05)
const RISKFREE_FRED = 0.0465; // FRED DGS10(2026-08-07, 999에서 실측)
const REVDCF_DEFAULT_MAX_YEARS = 25;

type Row = {
  symbol: string; verdict: string; gap_years: number | null; wacc: number; beta_unlevered: number; de_ratio: number;
  share_price: number; shares: number; debt: number; non_operating_assets: number;
  sales_growth: number; operating_margin: number; starting_margin: number; tax_rate: number;
  fixed_capital_rate: number; working_capital_rate: number; starting_sales: number;
};

// STEP987 DB 조회 결과를 그대로 하드코딩(재조회 없이 재현 가능하게, 999 실행 시점 스냅샷)
const SAMPLE: Row[] = [
  { symbol: "AAL", verdict: "years", gap_years: 2, wacc: 0.06546329926701039, beta_unlevered: 0.7579038179118688, de_ratio: 2.921280773603731, share_price: 15.02082861862607, shares: 661052000, debt: 29007000000, non_operating_assets: 1056000000, sales_growth: 0.16281693181179624, operating_margin: 0.025984405466420744, starting_margin: 0.026851902696172644, tax_rate: 0.2563, fixed_capital_rate: 0.14375176760534927, working_capital_rate: -0.16975523531037195, starting_sales: 54633000000 },
  { symbol: "ADSK", verdict: "years", gap_years: 15, wacc: 0.09445695606716255, beta_unlevered: 1.2481994174665423, de_ratio: 0.046238099695102806, share_price: 251.47891140465117, shares: 215000000, debt: 2500000000, non_operating_assets: 2597000000, sales_growth: 0.13215635222408295, operating_margin: 0.1967074349565571, starting_margin: 0.2189841798501249, tax_rate: 0.2563, fixed_capital_rate: 0.19078014184397163, working_capital_rate: -0.520570753603808, starting_sales: 7206000000 },
  { symbol: "ANET", verdict: "years", gap_years: 7, wacc: 0.07907140405680055, beta_unlevered: 0.8872512120358865, de_ratio: 0, share_price: 189.34683261581876, shares: 1275700000, debt: 0, non_operating_assets: 1965300000, sales_growth: 0.32204469075067665, operating_margin: 0.37921532131594093, starting_margin: 0.42818437211987964, tax_rate: 0.2563, fixed_capital_rate: 0.07377795694478217, working_capital_rate: 0.911926137025629, starting_sales: 9005700000 },
  { symbol: "BAX", verdict: "over_cap", gap_years: null, wacc: 0.07309073009940815, beta_unlevered: 0.8569477958661521, de_ratio: 0.658884689861407, share_price: 27.996391547758286, shares: 513000000, debt: 9463000000, non_operating_assets: 1968000000, sales_growth: -0.019106424575676018, operating_margin: -0.02591453951179019, starting_margin: -0.027392387050871575, tax_rate: 0.2563, fixed_capital_rate: 2.073170731707317, working_capital_rate: 0.10613097952102771, starting_sales: 11244000000 },
  { symbol: "CDE", verdict: "years", gap_years: 13, wacc: 0.07653679377738994, beta_unlevered: 0.8308962073401722, de_ratio: 0.0035770450127295956, share_price: 30.35310217906961, shares: 614666000, debt: 66737000, non_operating_assets: 555705000, sales_growth: 0.25562618950766836, operating_margin: 0.0848630096269378, starting_margin: 0.3415313850461276, tax_rate: 0.2563, fixed_capital_rate: 0.5160203928237175, working_capital_rate: -0.03507336041626504, starting_sales: 2070126000 },
  { symbol: "CDNS", verdict: "years", gap_years: 23, wacc: 0.0951696940190078, beta_unlevered: 1.2481994174665423, de_ratio: 0, share_price: 334.43715911485776, shares: 273312000, debt: 0, non_operating_assets: 3155530000, sales_growth: 0.15384783430991567, operating_margin: 0.2881633587652784, starting_margin: 0.28168961434718853, tax_rate: 0.2563, fixed_capital_rate: 0.774121025854283, working_capital_rate: -0.08155487179100415, starting_sales: 5296759000 },
  { symbol: "CHTR", verdict: "value_destroying", gap_years: null, wacc: 0.0493841726313989, beta_unlevered: 0.36287690746362616, de_ratio: 4.586438432242159, share_price: 149.98902512228582, shares: 137743676, debt: 94756000000, non_operating_assets: 598000000, sales_growth: 0.01463254021326188, operating_margin: 0.22577720681165742, starting_margin: 0.23565925439076935, tax_rate: 0.2563, fixed_capital_rate: 3.214424320827943, working_capital_rate: -0.1715852818045575, starting_sales: 54774000000 },
  { symbol: "CMCSA", verdict: "value_destroying", gap_years: null, wacc: 0.05165439132297264, beta_unlevered: 0.36287690746362616, de_ratio: 1.1059466760554504, share_price: 24.11044746939876, shares: 3709000000, debt: 98900000000, non_operating_assets: 10573000000, sales_growth: 0.0153699728268617, operating_margin: 0.16833193442344963, starting_margin: 0.16710452925056787, tax_rate: 0.2563, fixed_capital_rate: -1.3553673859601203, working_capital_rate: -0.13168959249198778, starting_sales: 123707000000 },
  { symbol: "CMG", verdict: "years", gap_years: 5, wacc: 0.07442212925303648, beta_unlevered: 0.7830073823550779, de_ratio: 0, share_price: 30.2920057440102, shares: 1342616000, debt: 0, non_operating_assets: 1084500000, sales_growth: 0.12118067534312083, operating_margin: 0.14611091408368176, starting_margin: 0.16232288838105519, tax_rate: 0.2563, fixed_capital_rate: 0.22774760536617228, working_capital_rate: -0.014183378928398827, starting_sales: 11925601000 },
  { symbol: "EIX", verdict: "below_one", gap_years: null, wacc: 0.04782457665704033, beta_unlevered: 0.31457840775745605, de_ratio: 1.4557541936754443, share_price: 67.62159088082902, shares: 386000000, debt: 37998000000, non_operating_assets: 720000000, sales_growth: 0.0669693030691505, operating_margin: 0.1759364204598699, starting_margin: 0.36718952218253353, tax_rate: 0.2563, fixed_capital_rate: 2.7883046237533997, working_capital_rate: -0.16977467332445773, starting_sales: 19317000000 },
  { symbol: "EXC", verdict: "below_one", gap_years: null, wacc: 0.048457239467698754, beta_unlevered: 0.31457840775745605, de_ratio: 1.1144410120057768, share_price: 45.30267067193676, shares: 1012000000, debt: 51093000000, non_operating_assets: 1201000000, sales_growth: 0.07837607258801715, operating_margin: 0.1816419199228136, starting_margin: 0.21221864951768488, tax_rate: 0.2563, fixed_capital_rate: 2.553164556962025, working_capital_rate: -0.11629280736954255, starting_sales: 24258000000 },
  { symbol: "GEN", verdict: "years", gap_years: 2, wacc: 0.09003220513647982, beta_unlevered: 1.2481994174665423, de_ratio: 0.4674793869196521, share_price: 28.32362494345719, shares: 619000000, debt: 8196000000, non_operating_assets: 411000000, sales_growth: 0.15640033634544181, operating_margin: 0.36965550773126105, starting_margin: 0.424, tax_rate: 0.2563, fixed_capital_rate: 2.7264065335753176, working_capital_rate: -0.6559890940806887, starting_sales: 5000000000 },
  { symbol: "GME", verdict: "over_cap", gap_years: null, wacc: 0.07978259794483464, beta_unlevered: 1.0018775790318082, de_ratio: 0.4939324790090498, share_price: 15.354051065379712, shares: 549100000, debt: 4164300000, non_operating_assets: 9037200000, sales_growth: -0.11845923101457423, operating_margin: -0.012666729369117146, starting_margin: 0.06394115540373013, tax_rate: 0.2563, fixed_capital_rate: 0.017725134408602152, working_capital_rate: 0.16301768683910453, starting_sales: 3629900000 },
  { symbol: "GPN", verdict: "value_destroying", gap_years: null, wacc: 0.05042478820844978, beta_unlevered: 0.32770838684759396, de_ratio: 1.0307867314063222, share_price: 94.17697636441771, shares: 242008000, debt: 23493260000, non_operating_assets: 9116414000, sales_growth: -0.024903262157284445, operating_margin: 0.17839047938851124, starting_margin: 0.2276994263340271, tax_rate: 0.2563, fixed_capital_rate: -3.003648439142959, working_capital_rate: -0.30563732341216604, starting_sales: 7705878000 },
  { symbol: "IP", verdict: "over_cap", gap_years: null, wacc: 0.06836091632360916, beta_unlevered: 0.7489917958635104, de_ratio: 0.4523026777376788, share_price: 43.29131814119043, shares: 505700000, debt: 9902000000, non_operating_assets: 1145000000, sales_growth: 0.0510930063472812, operating_margin: 0.02935718681312773, starting_margin: -0.1191926884996192, tax_rate: 0.2563, fixed_capital_rate: -0.2095527979395926, working_capital_rate: 0.06833644921545855, starting_sales: 23634000000 },
  { symbol: "LAD", verdict: "below_one", gap_years: null, wacc: 0.06496809515381738, beta_unlevered: 0.713248607812822, de_ratio: 1.1886611653370307, share_price: 328.74278299212597, shares: 25400000, debt: 9925400000, non_operating_assets: 391300000, sales_growth: 0.13308666705208827, operating_margin: 0.05638324675920768, starting_margin: 0.04237290387379799, tax_rate: 0.2563, fixed_capital_rate: 0.3244906506701254, working_capital_rate: 0.030029082640778203, starting_sales: 37634900000 },
  { symbol: "LVS", verdict: "years", gap_years: 4, wacc: 0.07380147808027063, beta_unlevered: 0.8756884427797555, de_ratio: 0.5413915166518921, share_price: 42.488449292929296, shares: 693000000, debt: 15941000000, non_operating_assets: 3966000000, sales_growth: 0.3241586222889401, operating_margin: 0.05933267355860698, starting_margin: 0.21648613351770762, tax_rate: 0.2563, fixed_capital_rate: -0.06763065011954913, working_capital_rate: -0.3305867378591259, starting_sales: 13017000000 },
  { symbol: "TDG", verdict: "years", gap_years: 4, wacc: 0.0746744927426525, beta_unlevered: 0.8693772823914925, de_ratio: 0.43914125619232613, share_price: 1162.0226727147767, shares: 58200000, debt: 29699000000, non_operating_assets: 2808000000, sales_growth: 0.16476258146743805, operating_margin: 0.4241329178303843, starting_margin: 0.471634016532669, tax_rate: 0.2563, fixed_capital_rate: 0.8455244235060749, working_capital_rate: 0.10146442338883069, starting_sales: 8831000000 },
  { symbol: "VTRS", verdict: "over_cap", gap_years: null, wacc: 0.07730961934789536, beta_unlevered: 0.915135973481584, de_ratio: 0.7708355723051564, share_price: 15.493461927251637, shares: 1206900000, debt: 14413900000, non_operating_assets: 1348000000, sales_growth: -0.054266354745488465, operating_margin: -0.007747104607698008, starting_margin: -0.18687896480098803, tax_rate: 0.2563, fixed_capital_rate: 2.4593904355635385, working_capital_rate: 0.1508490872443597, starting_sales: 14250400000 },
  { symbol: "WYNN", verdict: "years", gap_years: 6, wacc: 0.07175798478536938, beta_unlevered: 0.8756884427797555, de_ratio: 1.0088629922049062, share_price: 101.25210978195179, shares: 104243000, debt: 10648371000, non_operating_assets: 1560095000, sales_growth: 0.17351938683026114, operating_margin: 0.06251889478535144, starting_margin: 0.15668197083633842, tax_rate: 0.2563, fixed_capital_rate: -0.2477088309733097, working_capital_rate: -0.19271557694321242, starting_sales: 7137924000 },
];

function deriveCreditSpread(row: Row): number {
  // wacc = costOfEquity*Ew + atCoD*Dw. costOfEquity는 creditSpread와 무관 → atCoD를 역산.
  const releveredBeta = row.beta_unlevered * (1 + (1 - row.tax_rate) * row.de_ratio);
  const costOfEquity = RISKFREE_DAMODARAN + releveredBeta * ERP;
  const debtWeight = row.de_ratio / (1 + row.de_ratio);
  const equityWeight = 1 / (1 + row.de_ratio);
  if (debtWeight === 0) return 0; // 무차입 — creditSpread가 WACC에 영향 없음(값 무관)
  const atCoD = (row.wacc - costOfEquity * equityWeight) / debtWeight;
  return atCoD / (1 - row.tax_rate) - RISKFREE_DAMODARAN;
}

function main() {
  const results: Record<string, unknown>[] = [];
  for (const row of SAMPLE) {
    const creditSpread = deriveCreditSpread(row);

    const waccOld = assembleWacc({ riskFree: RISKFREE_DAMODARAN, erp: ERP, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });
    const waccNew = assembleWacc({ riskFree: RISKFREE_FRED, erp: ERP, unleveredBetaCashAdj: row.beta_unlevered, taxRate: row.tax_rate, deRatio: row.de_ratio, creditSpread });

    // 재현성 검증: waccOld.wacc가 저장된 row.wacc와 거의 같아야 한다(역산이 맞았다는 증거)
    const reconstructionErrorBp = Math.abs(waccOld.wacc - row.wacc) * 10000;

    const drivers: RevDcfDrivers = {
      startingSales: row.starting_sales, salesGrowth: row.sales_growth, operatingMargin: row.operating_margin,
      startingMargin: row.starting_margin, taxRate: row.tax_rate, fixedCapitalRate: row.fixed_capital_rate, workingCapitalRate: row.working_capital_rate,
    };
    const marketOld: RevDcfMarket = { wacc: waccOld.wacc, inflation: 0.025, sharePrice: row.share_price, sharesOutstanding: row.shares, debt: row.debt, nonOperatingAssets: row.non_operating_assets };
    const marketNew: RevDcfMarket = { ...marketOld, wacc: waccNew.wacc };

    const verdictOld = runRevDcf(drivers, marketOld, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict;
    const verdictNew = runRevDcf(drivers, marketNew, { maxYears: REVDCF_DEFAULT_MAX_YEARS }).verdict;

    const verdictChanged = JSON.stringify(verdictOld) !== JSON.stringify(verdictNew);

    results.push({
      symbol: row.symbol, deRatio: row.de_ratio, storedVerdict: row.verdict, storedGapYears: row.gap_years,
      creditSpreadDerived: creditSpread, reconstructionErrorBp,
      waccOld: waccOld.wacc, waccNew: waccNew.wacc, waccDeltaBp: (waccNew.wacc - waccOld.wacc) * 10000,
      verdictOld, verdictNew, verdictChanged,
    });
    console.log(`${row.symbol}: wacc ${(waccOld.wacc * 100).toFixed(2)}%→${(waccNew.wacc * 100).toFixed(2)}% (+${((waccNew.wacc - waccOld.wacc) * 10000).toFixed(0)}bp) verdict ${JSON.stringify(verdictOld)}→${JSON.stringify(verdictNew)} changed=${verdictChanged} recon_err=${reconstructionErrorBp.toFixed(3)}bp`);
  }

  const changedCount = results.filter((r) => r.verdictChanged).length;
  const waccDeltas = results.map((r) => r.waccDeltaBp as number);
  const maxReconErr = Math.max(...results.map((r) => r.reconstructionErrorBp as number));

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({
    sampleSize: SAMPLE.length,
    riskFreeDamodaran: RISKFREE_DAMODARAN, riskFreeFred: RISKFREE_FRED, deltaBp: (RISKFREE_FRED - RISKFREE_DAMODARAN) * 10000,
    verdictChangedCount: changedCount,
    waccDeltaBpStats: { avg: waccDeltas.reduce((a, b) => a + b, 0) / waccDeltas.length, min: Math.min(...waccDeltas), max: Math.max(...waccDeltas) },
    maxReconstructionErrorBp: maxReconErr,
    results,
  }, null, 2));
}

main();
