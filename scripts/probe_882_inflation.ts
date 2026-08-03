// STEP 882 §3 — driver6(터미널 인플레) 재확인·재측정: 851의 3안 재현 + 터미널 비중 재측정 + i 민감도 4점.
// 읽기만 · DB 쓰기 없음. companyfacts는 866 캐시(/tmp/866_cf) 재사용(startingSales·fixedCapitalRateMarginal 조달용).
// 실행: NODE_OPTIONS="--max-old-space-size=8192" npx tsx scripts/probe_882_inflation.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { computeDrivers } from "../lib/revdcf/drivers";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "../lib/revdcf/engine";

const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;
const q = (a: number[], p: number) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))] : null; };

async function main() {
  const sb = createAdminClient();
  const asOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data!.as_of as string;

  type BaseRow = { cik: number; symbol: string; wacc: number; share_price: number; shares: number; debt: number; non_operating_assets: number; operating_margin: number; working_capital_rate: number; verdict: string; gap_years: number | null };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("cik,symbol,wacc,share_price,shares,debt,non_operating_assets,operating_margin,working_capital_rate,verdict,gap_years").eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] 모집단 n=${rows.length}(515 기대)`);

  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;

  type Row = BaseRow & { startingSales: number; salesGrowth: number; startingMargin: number; fixedCapitalRateMarginal: number };
  const out: Row[] = [];
  let noMarginal = 0, cfMissing = 0;
  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { cfMissing++; continue; }
    let j: { facts?: { "us-gaap"?: Record<string, unknown> } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { cfMissing++; continue; }
    const dr = computeDrivers((j.facts?.["us-gaap"] as never) ?? {}, {} as never);
    if (!dr.ok) { cfMissing++; continue; }
    if (dr.drivers.fixedCapitalRateMarginal == null) { noMarginal++; continue; } // 880 결정과 동일 모집단(계산불가 50사 제외)
    out.push({ ...r, startingSales: dr.drivers.startingSales, salesGrowth: dr.drivers.salesGrowth, startingMargin: dr.drivers.startingMargin, fixedCapitalRateMarginal: dr.drivers.fixedCapitalRateMarginal });
  }
  console.error(`[1] 계산가능 n=${out.length}(marginal없음 ${noMarginal}·cf없음/불가 ${cfMissing}) — 880 결정(marginal 채택)과 동일 모집단 사용`);

  function driversFor(r: Row, tax: number): RevDcfDrivers {
    return { startingSales: r.startingSales, salesGrowth: r.salesGrowth, operatingMargin: +r.operating_margin, startingMargin: r.startingMargin, taxRate: tax, fixedCapitalRate: r.fixedCapitalRateMarginal, workingCapitalRate: +r.working_capital_rate };
  }
  function marketFor(r: Row, inflation: number): RevDcfMarket {
    return { wacc: +r.wacc, inflation, sharePrice: +r.share_price, sharesOutstanding: +r.shares, debt: +r.debt, nonOperatingAssets: +r.non_operating_assets };
  }
  function runAt(r: Row, inflation: number) {
    return runRevDcf(driversFor(r, usTax), marketFor(r, inflation), { maxYears: 25 });
  }

  // ══════════════════════════ §2① 851의 3안 재현(i=0 / i=0.016 / i=0.025) — 현재 데이터로 ══════════════════════════
  function summarizeI(inflation: number) {
    let years = 0, belowOne = 0, overCap = 0, valueDestroying = 0, invalid = 0;
    const gaps: number[] = [];
    for (const r of out) {
      const res = runAt(r, inflation);
      if (res.verdict.kind === "years") { years++; gaps.push(res.verdict.gap); }
      else if (res.verdict.kind === "below_one") belowOne++;
      else if (res.verdict.kind === "over_cap") overCap++;
      else if (res.verdict.kind === "value_destroying") valueDestroying++;
      else invalid++;
    }
    return { n: out.length, years, belowOne, overCap, valueDestroying, invalid, gapMedian: q(gaps, 0.5), gapP25: q(gaps, 0.25), gapP75: q(gaps, 0.75) };
  }
  const threeOptionRerun = { i0: summarizeI(0), i0016: summarizeI(0.016), i0025: summarizeI(0.025) };

  // ══════════════════════════ §2② 터미널 비중 재측정(scale-invariant: startingSales=1 등) ══════════════════════════
  function residualShareAt(r: Row, inflation: number, N: number): number | null {
    const d: RevDcfDrivers = { startingSales: 1, salesGrowth: r.salesGrowth, operatingMargin: +r.operating_margin, startingMargin: r.startingMargin, taxRate: usTax, fixedCapitalRate: r.fixedCapitalRateMarginal, workingCapitalRate: +r.working_capital_rate };
    const m: RevDcfMarket = { wacc: +r.wacc, inflation, sharePrice: 1, sharesOutstanding: 1, debt: 0, nonOperatingAssets: 0 };
    const res = runRevDcf(d, m, { maxYears: 25 });
    const y = res.years[N];
    if (!y || !Number.isFinite(y.corporateValue) || y.corporateValue === 0) return null;
    return y.pvResidual / y.corporateValue;
  }
  const shares1025: number[] = [];
  for (const r of out) {
    const res = runAt(r, 0.025);
    const N = res.verdict.kind === "years" ? res.verdict.gap : res.verdict.kind === "over_cap" ? 25 : null;
    if (N == null) continue;
    const s = residualShareAt(r, 0.025, N);
    if (s != null) shares1025.push(s);
  }
  const terminalWeight = { n: shares1025.length, median: q(shares1025, 0.5), p25: q(shares1025, 0.25), p75: q(shares1025, 0.75), note: "각 종목의 실제 GAP 크로싱 연차(N)에서 pvResidual/corporateValue — i=0.025(현행) 기준. 원전 관찰(도미노 N=5/8/25 → 86.3/80.1/59.3%)과는 성격이 다름(원전은 특정 N 고정, 이건 종목별 실제 크로싱 연차)" };

  // ══════════════════════════ §2③ i 민감도 4점 ══════════════════════════
  const iSensitivity = { i016: summarizeI(0.016), i020: summarizeI(0.020), i025: summarizeI(0.025), i030: summarizeI(0.030) };

  // ══════════════════════════ §2④ i vs rf 관계 ══════════════════════════
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { riskfree_rate: number; expected_inflation: number };
  const iVsRf = { our_i: +gi.expected_inflation, our_rf: +gi.riskfree_rate, i_lt_rf: +gi.expected_inflation < +gi.riskfree_rate, source_i: 0.016, source_rf: 0.0065, source_i_gt_rf: 0.016 > 0.0065, note: "원전은 i>rf(1.6%>0.65%)였으나 우리는 i<rf(2.5%<3.95%) — 배선 구조상 damodaran_global_inputs가 둘 다 같은 갱신에서 나오므로 시장금리 역전(장단기 역전 등) 없는 한 i<rf가 유지될 가능성이 높으나, 두 값이 독립적으로 조달되는 건 아니므로 이론상 뒤집힐 수 있음(가정 검증은 안 함)" };

  const output = { asOf, threeOptionRerun, terminalWeight, iSensitivity, iVsRf, note: "재료만 — ③판정은 §4에서 별도" };
  writeFileSync("docs/probe_882_inflation.json", JSON.stringify(output, null, 2));
  console.error(JSON.stringify(output, null, 2));

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,887 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
