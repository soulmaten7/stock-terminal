// STEP 879 §2/§3 — driver5 D안(다모다란 원문 권고: 음수 재투자율 → 평균으로 대체) 실측 + C안 k 민감도(p05/p10/p25).
// 측정 전용·판정 금지. companyfacts는 866 캐시(/tmp/866_cf) 재사용. 878과 같은 515사 모집단.
// 실행: NODE_OPTIONS="--max-old-space-size=8192" npx tsx scripts/probe_879_driver5_d.ts
//
// D안 설계(878 ③ 원문 직인용 기반 · 우리 해석 표시):
//   원문(growth.htm): "현재 연도의 재투자율(음수)은 최근 몇 년간의 평균 재투자율로 대체될 수 있다."
//   - 평균 대상 = 그 회사 "자신의" 과거 — 원문의 "industry averages" 문장은 다른 상황(최근 급팽창한 성숙기업)을 말하는
//     별개 문단이라 여기 끌어오지 않는다(878/879 §2① 대조).
//   - N(몇 년) = 원문 미제시. 🔴 우리 해석: 우리 데이터가 허용하는 최대치 — 연간 관측치 4개(2021~2024, 각 연도의
//     순투자/ΔRev 비율)를 평균한다. 이는 "분포에서 유도하는 k"와 다른 성격(N은 데이터가 있는 만큼 쓰는 것이지
//     튜닝 대상이 아니다) — 그렇게 다르다는 것 자체를 보고에 명시한다.
//   - 적용 범위 = 원문 그대로 "음수일 때만"(|value|>1 같은 극단값엔 적용 안 함 — 원문이 그 범위를 언급하지 않음).
//   - 대체 후에도 음수면? 원문 침묵 — 그대로 사용(추가 가드 없음), 잔여 음수 건수를 별도 보고.
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

  type BaseRow = { cik: number; symbol: string; verdict: string; gap_years: number | null };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results")
      .select("cik,symbol,verdict,gap_years")
      .eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] baseline n=${rows.length} (515 기대 · 878과 동일 모집단)`);

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

  // 1차 패스: C안 k 유도(878과 동일 방법 재현 — p05/p10/p25 전부 이미 878 JSON에 있으나 재계산해 대조)
  const cumDRevRatios: number[] = [];
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
  const kP05 = percentile(cumDRevRatios, 5)!, kP10 = percentile(cumDRevRatios, 10)!, kP25 = percentile(cumDRevRatios, 25)!;
  console.error(`[1] k 재현: n=${cumDRevRatios.length} p05=${kP05.toFixed(4)} p10=${kP10.toFixed(4)} p25=${kP25.toFixed(4)}`);

  type Row = {
    cik: number; symbol: string; oldVerdict: string; oldGapYears: number | null;
    rateMarginal: number | null;
    rateD: number | null; dReplaced: boolean; dAnnualRatiosUsed: number;
    rateC_p05: number | null; rateC_p10: number | null; rateC_p25: number | null;
    newVerdictD: string | null; newGapD: number | null;
    newVerdictC05: string | null; newGapC05: number | null;
    newVerdictC10: string | null; newGapC10: number | null;
    newVerdictC25: string | null; newGapC25: number | null;
  };
  const out: Row[] = [];
  let cfMissing = 0, noRefData = 0;

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

    const capex = coalesceMap(gaap, CAPEX, "flow"), capsw = coalesceMap(gaap, CAPSW, "flow"), othinv = coalesceMap(gaap, OTHINV, "flow"), acq = coalesceMap(gaap, ACQ, "flow");
    const dna = dnaFor(gaap);
    const invYears = YS.slice(1); // 2021~2024
    const cumDRev = rev[YS[4]] - rev[YS[0]];
    const meanRev = YS.reduce((a, y) => a + rev[y], 0) / YS.length;

    let rateMarginal: number | null = null;
    if (invYears.every((y) => capex[y] != null && dna[y] != null) && cumDRev !== 0) {
      let cumNet = 0; for (const y of invYears) cumNet += Math.abs(capex[y]) + Math.abs(acq[y] ?? 0) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0) - Math.abs(dna[y]);
      rateMarginal = cumNet / cumDRev;
    }

    // ── D안: 음수면 연간 관측치(2021~2024, 각 연도 순투자/ΔRev_t) 평균으로 대체. 양수·계산불가는 손대지 않음. ──
    let rateD: number | null = rateMarginal;
    let dReplaced = false, dAnnualRatiosUsed = 0;
    if (rateMarginal != null && rateMarginal < 0 && invYears.every((y) => capex[y] != null && dna[y] != null)) {
      const annualRatios: number[] = [];
      for (const y of invYears) {
        const dRevY = rev[y] - rev[y - 1];
        if (dRevY === 0) continue;
        const netInvY = Math.abs(capex[y]) + Math.abs(acq[y] ?? 0) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0) - Math.abs(dna[y]);
        annualRatios.push(netInvY / dRevY);
      }
      if (annualRatios.length > 0) {
        rateD = annualRatios.reduce((a, b) => a + b, 0) / annualRatios.length;
        dReplaced = true; dAnnualRatiosUsed = annualRatios.length;
      }
      // annualRatios.length===0(전 연도 ΔRev=0)이면 대체 불가 — rateMarginal(음수) 그대로 유지, dReplaced=false로 기록
    }

    // ── C안: k=p05/p10/p25 세 값 ──
    function rateCFor(k: number): number | null {
      if (!(invYears.every((y) => capex[y] != null && dna[y] != null) && cumDRev !== 0)) return null;
      if (meanRev > 0 && Math.abs(cumDRev) / meanRev < k) return null;
      let cumNetC = 0; for (const y of invYears) cumNetC += Math.abs(capex[y]) + Math.abs(acq[y] ?? 0) + Math.abs(capsw[y] ?? 0) + Math.abs(othinv[y] ?? 0) - Math.abs(dna[y]);
      return cumNetC / cumDRev;
    }
    const rateC_p05 = rateCFor(kP05), rateC_p10 = rateCFor(kP10), rateC_p25 = rateCFor(kP25);

    const ind = indByT.get(r.symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    const mcap = mcapBy.get(r.symbol.toUpperCase());
    if (!ind || !beta || !mcap) { noRefData++; continue; }
    const deRatio = dr.market.debt / mcap;
    const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
    const sharePrice = mcap / dr.market.shares;
    const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
    const drvBase = { ...dr.drivers, taxRate: usTax };
    const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : null);

    const runD = rateD != null ? runRevDcf({ ...drvBase, fixedCapitalRate: rateD }, market, { maxYears: 25 }) : null;
    const runC05 = rateC_p05 != null ? runRevDcf({ ...drvBase, fixedCapitalRate: rateC_p05 }, market, { maxYears: 25 }) : null;
    const runC10 = rateC_p10 != null ? runRevDcf({ ...drvBase, fixedCapitalRate: rateC_p10 }, market, { maxYears: 25 }) : null;
    const runC25 = rateC_p25 != null ? runRevDcf({ ...drvBase, fixedCapitalRate: rateC_p25 }, market, { maxYears: 25 }) : null;

    out.push({
      cik: r.cik, symbol: r.symbol, oldVerdict: r.verdict, oldGapYears: r.gap_years,
      rateMarginal, rateD, dReplaced, dAnnualRatiosUsed,
      rateC_p05, rateC_p10, rateC_p25,
      newVerdictD: runD?.verdict.kind ?? null, newGapD: runD ? gnum(runD.verdict) : null,
      newVerdictC05: runC05?.verdict.kind ?? null, newGapC05: runC05 ? gnum(runC05.verdict) : null,
      newVerdictC10: runC10?.verdict.kind ?? null, newGapC10: runC10 ? gnum(runC10.verdict) : null,
      newVerdictC25: runC25?.verdict.kind ?? null, newGapC25: runC25 ? gnum(runC25.verdict) : null,
    });
  }
  writeFileSync("docs/probe_879_driver5_d_rows.json", JSON.stringify(out, null, 2));
  console.error(`[2] 계산 완료 n=${out.length}(cf없음/불가 ${cfMissing} · 참조없음 ${noRefData})`);

  function summarize(field: "rateD" | "rateC_p05" | "rateC_p10" | "rateC_p25") {
    const v = out.map((o) => o[field]).filter((x): x is number => x != null);
    return { n: v.length, pctOfN: +((v.length / rows.length) * 100).toFixed(1), median: percentile(v, 50), p25: percentile(v, 25), p75: percentile(v, 75), negative: v.filter((x) => x < 0).length, absOver1: v.filter((x) => Math.abs(x) > 1).length };
  }
  function migration(field: "newVerdictD" | "newVerdictC05" | "newVerdictC10" | "newVerdictC25") {
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
  function gapSummary(field: "newGapD" | "newGapC05" | "newGapC10" | "newGapC25") {
    const g = out.filter((o) => o[field] != null).map((o) => o[field] as number);
    return { n: g.length, p25: percentile(g, 25), p50: percentile(g, 50), p75: percentile(g, 75) };
  }

  const negBefore = out.filter((o) => o.rateMarginal != null && o.rateMarginal < 0).length;
  const dReplacedCount = out.filter((o) => o.dReplaced).length;
  const dCouldNotReplace = out.filter((o) => o.rateMarginal != null && o.rateMarginal < 0 && !o.dReplaced).length;
  const dStillNegativeAfter = out.filter((o) => o.rateD != null && o.rateD < 0).length;

  // 도미노 앵커: T5 도미노 자체 marginal=+11.6%(양수) → D안은 음수에만 개입하므로 도미노는 대체가 발동하지 않는다.
  const dominoD = { anchorable: "not_distinguishable" as const, note: "도미노(DPZ) 자체의 marginal 재투자율은 +11.6%(양수)라 D안의 '음수 시 대체' 규칙이 발동하지 않는다 — D는 도미노에서 marginal과 완전히 동일한 값을 낸다(A안이 그랬듯 이 케이스로는 D 자체가 검증되지 않는다·878 §3 도미노=원전 어디에도 음수 케이스 사례가 없음)" };

  const output = {
    asOf, n: out.length, universe: rows.length,
    sourceQuote: {
      negativeRule: "\"For most firms, this negative reinvestment rate will be a temporary phenomenon reflecting lumpy capital expenditures or volatile working capital. For these firms, the current year's reinvestment rate (which is negative) can be replaced with an average reinvestment rate over the last few years.\"",
      averagingTarget: "회사 자신의 과거 — 원문 그대로(\"an average reinvestment rate\"). 🔴 industry-average 문장은 별개 문단(급팽창 후 성숙기업 이슈)이라 이 규칙에 끌어오지 않음(879 §2① 확인)",
      nYears: "원문 미제시(\"the last few years\"만). 🔴 원문 아님·우리 해석: 데이터가 허용하는 최대치(연간 관측치 4개=2021~2024)를 사용 — k처럼 분포에서 튜닝한 값이 아니라 데이터 한계",
      scope: "원문은 음수 재투자율에만 적용. 🔴 |값|>1 극단값엔 원문이 언급 없음 — D안도 그 범위를 넘지 않음(양수·계산불가엔 무개입)",
      afterStillNegative: "원문 침묵 — 대체 후 여전히 음수/이상이면 무엇을 하라는 서술 없음. D안은 그대로 사용(추가 가드 없음)하고 잔여 건수를 보고",
    },
    dMechanics: { negativeBefore: negBefore, replaced: dReplacedCount, couldNotReplace_allYearDRevZero: dCouldNotReplace, stillNegativeAfterReplace: dStillNegativeAfter },
    optionD: { distribution: summarize("rateD"), gap: gapSummary("newGapD"), verdict: migration("newVerdictD"), domino: dominoD },
    optionC_kSensitivity: {
      p05: { k: kP05, distribution: summarize("rateC_p05"), gap: gapSummary("newGapC05"), verdict: migration("newVerdictC05") },
      p10: { k: kP10, distribution: summarize("rateC_p10"), gap: gapSummary("newGapC10"), verdict: migration("newVerdictC10") },
      p25: { k: kP25, distribution: summarize("rateC_p25"), gap: gapSummary("newGapC25"), verdict: migration("newVerdictC25") },
      note: "878의 p05 결과(커버리지443/86.0%·유출41/유입8)와 이 재계산이 일치하는지 확인용 — k가 커질수록 계산불가(커버리지↓) 늘고 판정이동은 어떻게 변하는지 사실만. 채택 제안 없음",
    },
    note: "재료만 — 제안 없음. ③판정 칸은 대기 그대로. 어느 안도 채택 언급 없음.",
  };
  writeFileSync("docs/probe_879_driver5_d.json", JSON.stringify(output, null, 2));

  console.error(`\n=== D안(음수→평균대체) ===`);
  console.error(JSON.stringify({ dMechanics: output.dMechanics, optionD: output.optionD }, null, 2));
  console.error(`\n=== C안 k민감도(p05/p10/p25) ===`);
  console.error(JSON.stringify(output.optionC_kSensitivity, null, 2));

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,887 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
