// STEP 969 §4 — 영향 실측(메모리 계산만, DB 쓰기 0). 구코드(969 이전) vs 신코드 전체 대조 +
// EV/EBITDA 변화 + revdcf verdict 변화(604 유니버스, 실제 WACC 파이프라인 재구성) 전수.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeDrivers as computeDriversNew } from "../lib/revdcf/drivers";
import { computeDrivers as computeDriversOld } from "/tmp/step969_old/drivers_old";
import { computeValuation } from "../lib/valuation";
import { assembleWacc, creditSpreadFor } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfMarket } from "../lib/revdcf/engine";
import { fetchSectorMap } from "../lib/sector";

const CACHE_DIR = "docs/probe_951_cache";
const AS_OF = "2026-08-08";
const REVDCF_DEFAULT_MAX_YEARS = 25;

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function p90(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))];
}

async function main() {
  const sb = createAdminClient();
  const allFund = await fetchAllRows<{ symbol: string; fiscal_year: number | null; net_income: number | null; common_equity: number | null; revenue: number | null; operating_income: number | null; dna: number | null }>(
    () => sb.from("us_fundamentals").select("symbol, fiscal_year, net_income, common_equity, revenue, operating_income, dna"),
    [{ column: "symbol" }]
  );
  const valRows = await fetchAllRows<{ symbol: string; price: number | null; market_cap: number | null; ev_ebitda: number | null }>(
    () => sb.from("us_valuation").select("symbol, price, market_cap, ev_ebitda").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  const valBySym = new Map(valRows.map((r) => [r.symbol, r]));

  console.log(`us_fundamentals ${allFund.length}행`);

  type Row = {
    symbol: string; oldOk: boolean; newOk: boolean; oldSkip: string | null; newSkip: string | null;
    oldDebt: number | null; newDebt: number | null; oldDebtBasis: string | null; newDebtBasis: string | null;
    newDebtTagsSeen: string[] | null;
    oldNonOp: number | null; newNonOp: number | null;
    netIncome: number | null; commonEquity: number | null; revenue: number | null; operatingIncome: number | null; dna: number | null;
  };
  const rows: Row[] = [];
  let checked = 0, noCache = 0;

  for (const f of allFund) {
    const path = `${CACHE_DIR}/${f.symbol}.json`;
    if (!fs.existsSync(path)) { noCache++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = facts?.facts?.["us-gaap"] ?? {};
    const dei = facts?.facts?.["dei"] ?? {};
    checked++;

    const rOld = computeDriversOld(gaap, dei);
    const rNew = computeDriversNew(gaap, dei);
    rows.push({
      symbol: f.symbol,
      oldOk: rOld.ok, newOk: rNew.ok,
      oldSkip: rOld.ok ? null : rOld.skipReason,
      newSkip: rNew.ok ? null : rNew.skipReason,
      oldDebt: rOld.ok ? rOld.market.debt : null,
      newDebt: rNew.ok ? rNew.market.debt : null,
      oldDebtBasis: (rOld.flags as any).debtBasis ?? null,
      newDebtBasis: (rNew.flags as any).debtBasis ?? null,
      newDebtTagsSeen: (rNew.flags as any).debtTagsSeen ?? null,
      oldNonOp: rOld.ok ? rOld.market.nonOperatingAssets : null,
      newNonOp: rNew.ok ? rNew.market.nonOperatingAssets : null,
      // 969는 fundamentals 계산에 손대지 않았으므로 old/new 동일 — new 것을 그대로 EV/EBITDA 재무 입력으로 쓴다(내부 정합성 확보, DB의 다른 시점 값과 안 섞음).
      netIncome: rNew.fundamentals.netIncome, commonEquity: rNew.fundamentals.commonEquity, revenue: rNew.fundamentals.revenue,
      operatingIncome: rNew.fundamentals.operatingIncome, dna: rNew.fundamentals.dna,
    });
  }
  console.log(`캐시확인 ${checked}(캐시없음 ${noCache})`);

  // ── §4-2-a: debt 0→값 전환 ──
  const zeroToValue = rows.filter((r) => r.oldDebt === 0 && r.newDebt != null && r.newDebt > 0);
  console.log(`\ndebt 0→값 전환: ${zeroToValue.length}건`);
  const zeroToValueSorted = [...zeroToValue].sort((a, b) => (b.newDebt ?? 0) - (a.newDebt ?? 0)).slice(0, 20);
  console.log("상위 20:", JSON.stringify(zeroToValueSorted, null, 1));

  // ── §4-2-b: debt 0→null(UNRESOLVED_DEBT) 전환 ──
  const zeroToUnresolved = rows.filter((r) => r.oldOk && r.oldDebt === 0 && !r.newOk && r.newSkip === "UNRESOLVED_DEBT");
  console.log(`\ndebt 0→UNRESOLVED_DEBT(신규 skip, 커버리지 손실): ${zeroToUnresolved.length}건`);
  console.log(JSON.stringify(zeroToUnresolved, null, 1));

  // ── §4-2-c: ok 상태 자체가 바뀐 것 전체(예상외 회귀 감지) ──
  const okFlipped = rows.filter((r) => r.oldOk !== r.newOk);
  console.log(`\nok 상태 변화 전체: ${okFlipped.length}건(그중 UNRESOLVED_DEBT 신규skip=${zeroToUnresolved.length})`);
  const okFlippedOther = okFlipped.filter((r) => !(r.oldOk && !r.newOk && r.newSkip === "UNRESOLVED_DEBT"));
  console.log(`UNRESOLVED_DEBT 외의 예상외 ok변화: ${okFlippedOther.length}건`, JSON.stringify(okFlippedOther.slice(0, 20), null, 1));

  // ── §4-2-d: EV/EBITDA 변화(신코드 fundamentals 재사용, debt·nonOperatingAssets만 old/new로 교체) ──
  const evChanges: { symbol: string; oldEv: number | null; newEv: number | null; relDiff: number | null }[] = [];
  for (const r of rows) {
    if (r.newDebt == null && r.oldDebt == null) continue;
    const v = valBySym.get(r.symbol);
    if (!v || v.market_cap == null || r.operatingIncome == null || r.dna == null) continue;
    const cvOld = computeValuation({ marketCap: v.market_cap, netIncome: r.netIncome, equity: r.commonEquity, revenue: r.revenue, operatingIncome: r.operatingIncome, dna: r.dna, debt: r.oldDebt, nonOperatingAssets: r.oldNonOp });
    const cvNew = computeValuation({ marketCap: v.market_cap, netIncome: r.netIncome, equity: r.commonEquity, revenue: r.revenue, operatingIncome: r.operatingIncome, dna: r.dna, debt: r.newDebt, nonOperatingAssets: r.newNonOp });
    if (cvOld.evEbitda == null && cvNew.evEbitda == null) continue;
    const relDiff = cvOld.evEbitda != null && cvNew.evEbitda != null && cvOld.evEbitda !== 0 ? Math.abs((cvNew.evEbitda - cvOld.evEbitda) / cvOld.evEbitda) : null;
    if (cvOld.evEbitda !== cvNew.evEbitda) evChanges.push({ symbol: r.symbol, oldEv: cvOld.evEbitda, newEv: cvNew.evEbitda, relDiff });
  }
  console.log(`\nEV/EBITDA 값이 바뀐 종목(신코드 fundamentals 공통 사용, debt·nonOperatingAssets만 old/new): ${evChanges.length}건`);
  const relDiffs = evChanges.map((e) => e.relDiff).filter((x): x is number => x != null);
  console.log(`절대상대차 중앙값=${median(relDiffs)} p90=${p90(relDiffs)}`);

  // ── §4-3: GM 개별 ──
  const gm = rows.find((r) => r.symbol === "GM");
  console.log("\n=== GM 상세 ===", JSON.stringify(gm, null, 1));

  // ── §4-2-verdict: revdcf 604 유니버스 verdict 변화(WACC 파이프라인 재구성) ──
  console.log("\n=== revdcf verdict 재계산(604 유니버스) — ceteris paribus: debt만 old↔new, 나머지는 같은 날 fresh 계산값(rOld/rNew 공통)으로 고정 ===");
  // 🔴 1차 시도 결함(자체발견·수정): DB저장 revdcf_results 행(어제 as_of)의 sales_growth 등과
  //   "오늘" fresh 재계산한 debt를 섞어 썼더니 거의 전 종목이 over_cap으로 튀는 결함이 났다(옛창·새창
  //   혼입과 같은 함정 — 963/965/967이 이미 경고한 패턴의 재발). startingSales가 DB에 저장돼 있지 않아
  //   플레이스홀더 0을 넣은 게 직접 원인이었다. 수정: DB 저장값은 "무엇이 604 유니버스였는지"·"이전 verdict가
  //   무엇이었는지"에만 쓰고, 재계산 입력(drivers·market)은 전부 오늘 fresh 계산(rOld 기준, debt만 rNew로 교체)에서 가져온다.
  const revdcfUniverse = await fetchAllRows<{ symbol: string; verdict: string; gap_years: number | null }>(
    () => sb.from("revdcf_results").select("symbol, verdict, gap_years").eq("as_of", AS_OF),
    [{ column: "symbol" }]
  );
  console.log(`revdcf_results(${AS_OF}) ${revdcfUniverse.length}행`);

  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as any;
  const rf = +gi.riskfree_rate, erp = +gi.erp, inflation = +gi.expected_inflation;
  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as any[];
  const betaByInd = new Map(((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as any[]).map((b) => [b.industry, b]));
  const { byTicker: indByT } = await fetchSectorMap(sb, { field: "industryGroup", source: "damodaran" });
  const mcapRows2: { symbol: string; market_cap: number }[] = [];
  { let f = 0; for (;;) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").range(f, f + 999); const c = (data ?? []) as any[]; mcapRows2.push(...c); if (c.length < 1000) break; f += 1000; } }
  const mcapBy2 = new Map(mcapRows2.map((r) => [r.symbol.toUpperCase(), r.market_cap]));

  let verdictChecked = 0, verdictChanged = 0, verdictNoCache = 0, verdictNoIndustry = 0, verdictNoMcap = 0, verdictNoSharesOrNonOp = 0;
  const verdictChanges: { symbol: string; oldStoredVerdict: string; freshBaselineVerdict: string; freshNewVerdict: string; oldStoredGap: number | null; freshBaselineGap: number | null; freshNewGap: number | null; oldDebt: number | null; newDebt: number | null }[] = [];

  for (const rr of revdcfUniverse) {
    if (rr.verdict === "skipped") continue; // 이미 skip인 건은 debt와 무관(재계산 불필요, 969가 새 skip을 만드는 방향만 본다)
    const path = `${CACHE_DIR}/${rr.symbol}.json`;
    if (!fs.existsSync(path)) { verdictNoCache++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = facts?.facts?.["us-gaap"] ?? {};
    const dei = facts?.facts?.["dei"] ?? {};
    const rOld = computeDriversOld(gaap, dei);
    const rNew = computeDriversNew(gaap, dei);
    verdictChecked++;
    if (!rOld.ok || !rNew.ok) {
      // 구코드도 신코드도 오늘 기준으론 실패(옛창과 다른 이유일 수 있음) — 969 debt 효과만 보는 이 비교에서는 제외, 별도 기록
      if (rOld.ok && !rNew.ok) { const oldDebtVal = rOld.market.debt; verdictChanged++; verdictChanges.push({ symbol: rr.symbol, oldStoredVerdict: rr.verdict, freshBaselineVerdict: "ok(old)", freshNewVerdict: "skip:" + rNew.skipReason, oldStoredGap: rr.gap_years, freshBaselineGap: null, freshNewGap: null, oldDebt: oldDebtVal, newDebt: null }); }
      continue;
    }
    const newDebt = rNew.market.debt;
    if (newDebt === rOld.market.debt) continue; // debt 자체가 안 바뀌면 verdict도 안 바뀐다(그 외 입력은 969로 무변경) — 재계산 생략
    const ind = indByT.get(rr.symbol.toUpperCase());
    const beta = ind ? betaByInd.get(ind) : undefined;
    if (!ind || !beta) { verdictNoIndustry++; continue; }
    const mcap = mcapBy2.get(rr.symbol.toUpperCase());
    if (mcap == null || !(mcap > 0)) { verdictNoMcap++; continue; }
    if (rOld.market.shares == null || !(rOld.market.shares > 0)) { verdictNoSharesOrNonOp++; continue; }
    const oldMarket = rOld.market; // 클로저 안에서 rOld.ok 좁혀짐이 유지 안 돼(TS 한계) — 값을 밖에서 뽑아 캡처
    const sharePrice = mcap / oldMarket.shares;
    const drv = { ...rOld.drivers, taxRate: usTax, fixedCapitalRate: rOld.drivers.fixedCapitalRateMarginal ?? rOld.drivers.fixedCapitalRateLevel };

    function verdictFor(debt: number) {
      const deRatio = debt / mcap!;
      const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta!.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta!.std_dev_equity, spreads) ?? 0 });
      const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: oldMarket.shares, debt, nonOperatingAssets: oldMarket.nonOperatingAssets };
      const eng = runRevDcf(drv as any, market, { maxYears: REVDCF_DEFAULT_MAX_YEARS });
      return { kind: eng.verdict.kind, gap: eng.verdict.kind === "years" ? (eng.verdict as any).gap : null };
    }
    const baseline = verdictFor(oldMarket.debt); // 구코드 debt로 "오늘 다시 계산하면" 어떻게 나오는지(대조군 — 969 효과 0이어야 정상)
    const treated = verdictFor(newDebt); // 신코드 debt로

    if (baseline.kind !== treated.kind || baseline.gap !== treated.gap) {
      verdictChanged++;
      verdictChanges.push({ symbol: rr.symbol, oldStoredVerdict: rr.verdict, freshBaselineVerdict: baseline.kind, freshNewVerdict: treated.kind, oldStoredGap: rr.gap_years, freshBaselineGap: baseline.gap, freshNewGap: treated.gap, oldDebt: rOld.market.debt, newDebt });
    }
  }
  console.log(`verdict 재계산 대상(skipped 제외) ${verdictChecked}건, 변화 ${verdictChanged}건(캐시없음 ${verdictNoCache}, 업종매칭실패 ${verdictNoIndustry}, 시총없음 ${verdictNoMcap}, 주식수없음 ${verdictNoSharesOrNonOp})`);
  console.log(JSON.stringify(verdictChanges, null, 1));

  fs.writeFileSync(
    "docs/probe_969_impact.json",
    JSON.stringify({
      checked, noCache, zeroToValueCount: zeroToValue.length, zeroToValueTop20: zeroToValueSorted,
      zeroToUnresolvedCount: zeroToUnresolved.length, zeroToUnresolvedList: zeroToUnresolved,
      okFlippedCount: okFlipped.length, okFlippedOther,
      evChangesCount: evChanges.length, evRelDiffMedian: median(relDiffs), evRelDiffP90: p90(relDiffs), evChangesSample: evChanges.slice(0, 30),
      gm,
      verdictChecked, verdictChanged, verdictNoCache, verdictNoIndustry, verdictNoMcap, verdictNoSharesOrNonOp, verdictChanges,
    }, null, 1)
  );
  console.log("\n저장: docs/probe_969_impact.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
