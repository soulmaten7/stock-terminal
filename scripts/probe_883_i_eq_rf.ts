// STEP 883 §1① — 인플레 판정에서 안 잰 대안(i=rf) 실측. 883이 안 잰 대안을 "부적합"이라 부른 것을 바로잡는다.
// 읽기만 · DB 쓰기 없음. 882와 동일 모집단 재사용(companyfacts 캐시 /tmp/866_cf).
// 실행: NODE_OPTIONS="--max-old-space-size=8192" npx tsx scripts/probe_883_i_eq_rf.ts
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
  console.error(`[0] 모집단 n=${rows.length}(515 기대·882와 동일 소스)`);

  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { riskfree_rate: number; expected_inflation: number };
  const rf = +gi.riskfree_rate, currentI = +gi.expected_inflation;

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
    if (dr.drivers.fixedCapitalRateMarginal == null) { noMarginal++; continue; } // 880·882와 동일 모집단(계산불가 50사 제외)
    out.push({ ...r, startingSales: dr.drivers.startingSales, salesGrowth: dr.drivers.salesGrowth, startingMargin: dr.drivers.startingMargin, fixedCapitalRateMarginal: dr.drivers.fixedCapitalRateMarginal });
  }
  console.error(`[1] 계산가능 n=${out.length}(marginal없음 ${noMarginal}·cf없음/불가 ${cfMissing})`);

  function driversFor(r: Row): RevDcfDrivers {
    return { startingSales: r.startingSales, salesGrowth: r.salesGrowth, operatingMargin: +r.operating_margin, startingMargin: r.startingMargin, taxRate: usTax, fixedCapitalRate: r.fixedCapitalRateMarginal, workingCapitalRate: +r.working_capital_rate };
  }
  function marketFor(r: Row, inflation: number): RevDcfMarket {
    return { wacc: +r.wacc, inflation, sharePrice: +r.share_price, sharesOutstanding: +r.shares, debt: +r.debt, nonOperatingAssets: +r.non_operating_assets };
  }

  // ── WACC − rf 분포: 터미널 미성립(WACC ≤ i=rf) 종목 수 ──
  const waccMinusRf = out.map((r) => +r.wacc - rf);
  const nonPositive = waccMinusRf.filter((x) => x <= 0).length;
  const divergenceZone = {
    n: out.length,
    waccMinusRf_min: q(waccMinusRf, 0), waccMinusRf_p01: q(waccMinusRf, 0.01), waccMinusRf_p05: q(waccMinusRf, 0.05), waccMinusRf_p10: q(waccMinusRf, 0.10), waccMinusRf_median: q(waccMinusRf, 0.5),
    terminalNotViable_WaccLeRf: nonPositive,
    note: `WACC≤rf(${rf})면 터미널 NOPAT(1+i)/(WACC-i)가 성립하지 않음(0나누기·발산). 이 조건을 만족하는 종목 수 = ${nonPositive}`,
  };

  // ── i=rf 시나리오 실행 ──
  let years = 0, belowOne = 0, overCap = 0, valueDestroying = 0, invalidDivergent = 0;
  const gaps: number[] = [];
  type Migration = Record<string, number>;
  const migration: Migration = {};
  for (const r of out) {
    const res = runRevDcf(driversFor(r), marketFor(r, rf), { maxYears: 25 });
    const newKind = res.verdict.kind === "invalid" ? "invalid" : res.verdict.kind;
    const oldKind = r.verdict; // 저장된 verdict(현재 프로덕션 값 — level 기반, 참고용 표기)
    const key = `${oldKind}→${newKind}`;
    migration[key] = (migration[key] || 0) + 1;
    if (res.verdict.kind === "years") { years++; gaps.push(res.verdict.gap); }
    else if (res.verdict.kind === "below_one") belowOne++;
    else if (res.verdict.kind === "over_cap") overCap++;
    else if (res.verdict.kind === "value_destroying") valueDestroying++;
    else invalidDivergent++; // invalid(WACC<=i 등 발산) — "산출 불가"로 명시 분리, 큰 수로 채우지 않음
  }
  const iEqRfResult = {
    n: out.length, years, belowOne, overCap, valueDestroying, invalid_terminalDivergent: invalidDivergent,
    gapP25: q(gaps, 0.25), gapMedian: q(gaps, 0.5), gapP75: q(gaps, 0.75),
    note: "invalid = WACC<=i(rf) 등으로 터미널이 발산해 산출 불가 — 큰 수로 채우지 않고 별도 집계",
  };

  // 비교용: i=현재값(expected_inflation=0.025)의 동일 실행(882와 같은 방법으로 재현)
  let years25 = 0, belowOne25 = 0, overCap25 = 0, vd25 = 0, invalid25 = 0;
  const gaps25: number[] = [];
  for (const r of out) {
    const res = runRevDcf(driversFor(r), marketFor(r, currentI), { maxYears: 25 });
    if (res.verdict.kind === "years") { years25++; gaps25.push(res.verdict.gap); }
    else if (res.verdict.kind === "below_one") belowOne25++;
    else if (res.verdict.kind === "over_cap") overCap25++;
    else if (res.verdict.kind === "value_destroying") vd25++;
    else invalid25++;
  }
  const currentIResult = { n: out.length, years: years25, belowOne: belowOne25, overCap: overCap25, valueDestroying: vd25, invalid: invalid25, gapP25: q(gaps25, 0.25), gapMedian: q(gaps25, 0.5), gapP75: q(gaps25, 0.75) };

  // ── 판정버킷 이동(i=현재 → i=rf) ──
  const bucketMigration: Migration = {};
  for (const r of out) {
    const a = runRevDcf(driversFor(r), marketFor(r, currentI), { maxYears: 25 }).verdict.kind;
    const b = runRevDcf(driversFor(r), marketFor(r, rf), { maxYears: 25 }).verdict.kind;
    const key = `${a}→${b}`;
    bucketMigration[key] = (bucketMigration[key] || 0) + 1;
  }

  // ── 도미노 대조(재현 아님 — 원전은 i>rf라 이 안 자체가 원전과 반대 방향) ──
  // 🔴 884 §1 보강: 원래 이 대조를 실제로 돌린 코드가 /tmp/diag883.ts(일회성·미커밋)에만 있어 재현 불가 상태였다.
  //   같은 계산을 이 커밋된 스크립트 안으로 옮겨 GAP 8→12가 이 파일을 실행할 때마다 재현되게 한다(플레이북 #78).
  const DPZ_D: RevDcfDrivers = { startingSales: 3618.8, salesGrowth: 0.07, operatingMargin: 0.175, startingMargin: 0.1739, taxRate: 0.165, fixedCapitalRate: 0.15, workingCapitalRate: 0.10 };
  const DPZ_M_book: RevDcfMarket = { wacc: 0.05357, inflation: 0.016, sharePrice: 418, sharesOutstanding: 39.35, debt: 4170, nonOperatingAssets: 391.9 };
  const dominoBook = runRevDcf(DPZ_D, DPZ_M_book).verdict;
  const dominoAtRf = runRevDcf(DPZ_D, { ...DPZ_M_book, inflation: 0.0065 }).verdict;
  const dominoContrast = {
    source: { i: 0.016, rf: 0.0065, i_gt_rf: true },
    thisOption: { i: "=rf(회사별)", note: "우리 시스템에서 i=rf로 하면 i는 회사마다 다른 값(각자의 WACC 조립에 쓰인 rf는 전사 공통 3.95%이므로 실제로는 i도 전사 공통 3.95%)" },
    dominoRecomputed: { book_i0016: dominoBook, atRf_i00065: dominoAtRf, note: "T8 도미노 드라이버 그대로(startingSales 3618.8·wacc 0.05357·shares 39.35 등) i만 1.6%→0.65%로 바꿔 이 스크립트 안에서 직접 재계산" },
    note: "원전 도미노 케이스는 i(1.6%)>rf(0.65%)였다 — i=rf 안을 도미노에 적용하면 도미노 자신의 원전 값(1.6%)과 다른 값(0.65%)을 쓰게 되어 '재현'이 아니라 '원전과 반대 방향의 대안 대조'가 된다. 앵커 테스트 대상이 아님을 명시",
  };

  const output = { asOf, divergenceZone, iEqRfResult, currentIResult, bucketMigration, dominoContrast, note: "재료만 — 판정 처리(A/B/C)는 보고에서" };
  writeFileSync("docs/probe_883_i_eq_rf.json", JSON.stringify(output, null, 2));
  console.error(JSON.stringify(output, null, 2));

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,887 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
