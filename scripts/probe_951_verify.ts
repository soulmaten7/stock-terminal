// STEP 951 §5 — 창 전환(옛 고정 YS vs 새 resolveYearWindow) 검증. 조사 전용. DB 쓰기 없음.
// 표본 30종목: STEP 950 §3의 20종목 + NVDA·MSFT(AAPL은 20종목에 이미 있음) + 6월결산 신규 3개(AMCR·AMST·BR)
//   + 1월결산 신규 3개(ANF·AVAH·BBY) + 사전순 보충 2개(ACRS·ACT). 결산월이 다른 종목을 일부러 넣는 이유 =
//   STEP 950 §1에서 6월결산이 2년 누락에 쏠리고 1월결산이 calYear 5월 경계 규칙의 영향을 받는다는 게 실측됐기 때문 —
//   이 두 패턴이 새 창에서 실제로 옳게 처리되는지가 검증의 핵심이다.
// 🔴 SEC 예의: 간격 150ms 이상·동시성 2 이하. 429가 한 번이라도 나면 즉시 중단.
// 🔴 companyfacts 원문을 docs/probe_951_cache/에 캐시한다(.gitignore 등록, 커밋 안 됨) — STEP 950 f항 지적 반영.
// 실행: npx tsx scripts/probe_951_verify.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers } from "../lib/revdcf/drivers";
import { computeValuation } from "../lib/valuation";
import type { RevDcfDrivers, RevDcfMarket } from "../lib/revdcf/engine";
import { computeGapWithSensitivity } from "../lib/revdcf/compute";

// drivers.ts의 내부 Gaap 타입은 export 안 됨(STEP 951이 drivers.ts에 이 이상 손대는 걸 요구하지 않음) — 동일 구조를 로컬로 정의.
type Gaap = Parameters<typeof computeDrivers>[0];

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const CACHE_DIR = "docs/probe_951_cache";
const MAX_YEARS = 25;
const INFLATION = 0.025;

const SAMPLE30 = [
  "A", "AA", "AAL", "AAPL", "ABBV", "ABNB", "ABT", "ACM", "ACN", "ADBE", "ADI", "ADM", "ADP", "ADSK",
  "AEE", "AEIS", "AEP", "AES", "AIT", "AKAM", // STEP 950 §3의 20종목
  "NVDA", "MSFT", // 외부대조 원출처(STEP 950 §0) — AAPL은 위 20종목에 이미 있어 중복 제외
  "AMCR", "AMST", "BR", // 6월결산 신규 3개(STEP950 §1 스캔에서 6월결산이 2년누락에 쏠린 것 확인 — 그 패턴 재확인용)
  "ANF", "AVAH", "BBY", // 1월결산 신규 3개(calYear 5월경계 규칙 실전 확인용)
  "ACRS", "ACT", // 사전순 보충(무작위 아님, 결정적)
];

// ── drivers.ts와 동일한 태그 상수·헬퍼(옛 고정창 [2020..2024] 재현용 — drivers.ts는 이제 이 창을 안 씀) ──
const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
const OLD_YS = [2020, 2021, 2022, 2023, 2024];
const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));
function annualMapFull(g: Gaap, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const arr = (g as unknown as Record<string, { units?: Record<string, { form?: string; fp?: string; start?: string; end?: string; val: number; filed?: string }[]> }>)[tag]?.units?.[unit];
  const by: Record<number, { val: number; filed: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null || !e.end) continue;
    if (kind === "flow") { if (!e.start) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; }
    const y = calYear(e.end); const prev = by[y];
    if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: String(e.filed) };
  }
  const o: Record<number, number> = {}; for (const y of Object.keys(by)) o[+y] = by[+y].val; return o;
}
function coalesceFull(g: Gaap, tags: string[], kind: "flow" | "stock"): Record<number, number> {
  const vals: Record<number, number> = {};
  for (const t of tags) { const m = annualMapFull(g, t, kind); for (const y of Object.keys(m).map(Number)) if (vals[y] == null) vals[y] = m[y]; }
  return vals;
}
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

// 옛 고정창 [2020..2024]로 salesGrowth·operatingMargin·fiscalYear 등을 재현(drivers.ts 947이전 로직과 동치).
function computeOldWindow(gaap: Gaap): { fiscalYear: number | null; salesGrowth: number | null; operatingMargin: number | null; netIncome: number | null; equity: number | null; revenue: number | null; operatingIncome: number | null; dna: number | null } {
  const rev = coalesceFull(gaap, REV, "flow");
  const haveAll = OLD_YS.every((y) => rev[y] != null && rev[y] > 0);
  const ly = OLD_YS[OLD_YS.length - 1]; // 옛 창은 항상 2024가 "최신"
  const oiMap = annualMapFull(gaap, "OperatingIncomeLoss", "flow");
  const cae = annualMapFull(gaap, "CostsAndExpenses", "flow");
  const pretax = coalesceFull(gaap, ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic"], "flow");
  const interest = coalesceFull(gaap, ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestIncomeExpenseNet"], "flow");
  const oi: Record<number, number> = {};
  for (const y of OLD_YS) { if (oiMap[y] != null) oi[y] = oiMap[y]; else if (rev[y] != null && cae[y] != null) oi[y] = rev[y] - cae[y]; else if (pretax[y] != null && interest[y] != null) oi[y] = pretax[y] + Math.abs(interest[y]); }
  const dnaTot = coalesceFull(gaap, ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndDepletion", "DepreciationAmortizationAndAccretionNet"], "flow");
  const depr = coalesceFull(gaap, ["Depreciation"], "flow"), amort = coalesceFull(gaap, ["AmortizationOfIntangibleAssets"], "flow");
  const dna: Record<number, number> = {};
  for (const y of OLD_YS) { if (dnaTot[y] != null) dna[y] = dnaTot[y]; else if (depr[y] != null && amort[y] != null) dna[y] = depr[y] + amort[y]; }
  const ni = coalesceFull(gaap, ["NetIncomeLoss", "ProfitLoss", "NetIncomeLossAvailableToCommonStockholdersBasic"], "flow");
  const eq = coalesceFull(gaap, ["StockholdersEquity", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest", "CommonStockholdersEquity"], "stock");

  const salesGrowth = haveAll ? (rev[OLD_YS[4]] / rev[OLD_YS[0]]) ** (1 / 4) - 1 : null;
  const operatingMargin = haveAll && OLD_YS.every((y) => oi[y] != null) ? mean(OLD_YS.filter((y) => rev[y] > 0).map((y) => oi[y] / rev[y])) : null;

  return { fiscalYear: ly, salesGrowth, operatingMargin, netIncome: ni[ly] ?? null, equity: eq[ly] ?? null, revenue: rev[ly] ?? null, operatingIncome: oi[ly] ?? null, dna: dna[ly] ?? null };
}

async function fetchFactsWithCache(symbol: string, cik: number): Promise<Gaap | null> {
  const cacheFile = path.join(CACHE_DIR, `${symbol}.json`);
  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as { facts?: { "us-gaap"?: Gaap } };
    return cached.facts?.["us-gaap"] ?? null;
  }
  const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (r.status === 429) throw new Error("RATE_LIMITED_429");
  if (!r.ok) return null;
  const j = (await r.json()) as { facts?: { "us-gaap"?: Gaap } };
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(j));
  return j.facts?.["us-gaap"] ?? null;
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const sb = createAdminClient();

  const { data: cikRows } = await sb.from("us_cik_map").select("symbol,cik").in("symbol", SAMPLE30);
  const cikBySym = new Map(((cikRows ?? []) as { symbol: string; cik: number }[]).map((r) => [r.symbol, r.cik]));

  const { data: rdRows } = await sb.from("revdcf_results").select("symbol,verdict,gap_years,wacc,tax_rate,debt,non_operating_assets,shares,share_price").eq("as_of", "2026-08-08").in("symbol", SAMPLE30);
  const rdBySym = new Map(((rdRows ?? []) as { symbol: string; verdict: string; gap_years: number | null; wacc: number | null; tax_rate: number | null; debt: number | null; non_operating_assets: number | null; shares: number | null; share_price: number | null }[]).map((r) => [r.symbol, r]));

  const { data: mcapRows } = await sb.from("us_market_cap").select("symbol,market_cap").in("symbol", SAMPLE30);
  const mcapBySym = new Map(((mcapRows ?? []) as { symbol: string; market_cap: number }[]).map((r) => [r.symbol, r.market_cap]));

  console.log(`대상 ${SAMPLE30.length}종목: ${SAMPLE30.join(",")}`);
  let cacheHits = 0, newRequests = 0;
  const results: Record<string, unknown>[] = [];
  let lastCall = 0;
  let aborted: string | null = null;

  // 🔴 동시성 2 이하·간격 150ms 이상. 429 발생 시 즉시 전체 중단(재시도 없음).
  const CONCURRENCY = 2;
  let idx = 0;
  async function worker() {
    while (idx < SAMPLE30.length && !aborted) {
      const symbol = SAMPLE30[idx++];
      const cik = cikBySym.get(symbol);
      if (!cik) { results.push({ symbol, status: "NO_CIK" }); continue; }
      const cacheFile = path.join(CACHE_DIR, `${symbol}.json`);
      const wasCached = fs.existsSync(cacheFile);
      const w = lastCall + 150 - Date.now(); if (w > 0 && !wasCached) await new Promise((r) => setTimeout(r, w));
      if (!wasCached) lastCall = Date.now();
      let gaap: Gaap | null;
      try { gaap = await fetchFactsWithCache(symbol, cik); }
      catch (e) {
        if (String((e as Error).message).includes("429")) { aborted = symbol; results.push({ symbol, status: "429_ABORTED" }); return; }
        results.push({ symbol, status: "FETCH_ERROR", error: String((e as Error).message).slice(0, 120) }); continue;
      }
      if (wasCached) cacheHits++; else newRequests++;
      if (!gaap) { results.push({ symbol, status: "NO_DATA" }); continue; }

      const after = computeDrivers(gaap, {});
      const before = computeOldWindow(gaap);
      const marketCap = mcapBySym.get(symbol) ?? null;

      const afterVal = computeValuation({
        marketCap, netIncome: after.fundamentals.netIncome, equity: after.fundamentals.equity, revenue: after.fundamentals.revenue,
        operatingIncome: after.fundamentals.operatingIncome, dna: after.fundamentals.dna,
        debt: after.ok ? after.market.debt : null, nonOperatingAssets: after.ok ? after.market.nonOperatingAssets : null,
      });
      const beforeVal = computeValuation({
        marketCap, netIncome: before.netIncome, equity: before.equity, revenue: before.revenue, operatingIncome: before.operatingIncome, dna: before.dna,
        debt: after.ok ? after.market.debt : null, nonOperatingAssets: after.ok ? after.market.nonOperatingAssets : null, // 부채·비영업자산은 격리 목적상 동일값 재사용(창 효과만 분리)
      });

      const rd = rdBySym.get(symbol);
      let verdictBefore: string | null = null, gapBefore: number | null = null, verdictAfter: string | null = null, gapAfter: number | null = null;
      if (rd && rd.wacc != null && rd.verdict !== "skipped") {
        const market: RevDcfMarket = { wacc: Number(rd.wacc), inflation: INFLATION, sharePrice: Number(rd.share_price), sharesOutstanding: Number(rd.shares), debt: Number(rd.debt), nonOperatingAssets: Number(rd.non_operating_assets) };
        if (before.salesGrowth != null && before.operatingMargin != null) {
          // fixedCapitalRateMarginal·workingCapitalRate는 옛창 재현 범위 밖(비용 대비 효용 낮음 판단) — startingMargin=operatingMargin으로 근사, 원전 T5 계열은 저장값(revdcf_results엔 없어 married 안 됨) 대신 0으로 두지 않고 계산불가 처리.
          // 🔴 검증 목적상 startingSales·salesGrowth·startingMargin(=operatingMargin으로 근사)·operatingMargin만 창 효과로 비교하고,
          //    fixedCapitalRate·workingCapitalRate는 실제 창(옛/새) 재계산 없이 "after" 쪽 저장값(dr.drivers)을 그대로 재사용해 verdict 비교의 잡음을 줄인다.
        }
        if (after.ok) {
          const drvAfter: RevDcfDrivers = { startingSales: after.drivers.startingSales, salesGrowth: after.drivers.salesGrowth, operatingMargin: after.drivers.operatingMargin, startingMargin: after.drivers.startingMargin, taxRate: Number(rd.tax_rate), fixedCapitalRate: after.drivers.fixedCapitalRateMarginal ?? after.drivers.fixedCapitalRateLevel, workingCapitalRate: after.drivers.workingCapitalRate };
          const sensAfter = computeGapWithSensitivity(drvAfter, market, { maxYears: MAX_YEARS });
          verdictAfter = sensAfter.base.kind; gapAfter = sensAfter.base.kind === "years" ? sensAfter.base.gap : null;
        }
        if (before.salesGrowth != null && before.operatingMargin != null && after.ok) {
          // 옛 창 재현 — fixedCapitalRate·workingCapitalRate는 옛창 전용 재계산을 안 했으므로 after의 값을 공유(비교의 초점은 salesGrowth·startingSales·margin에 한정, 명시적으로 기록).
          const drvBefore: RevDcfDrivers = { startingSales: before.revenue ?? after.drivers.startingSales, salesGrowth: before.salesGrowth, operatingMargin: before.operatingMargin, startingMargin: before.operatingMargin, taxRate: Number(rd.tax_rate), fixedCapitalRate: after.drivers.fixedCapitalRateMarginal ?? after.drivers.fixedCapitalRateLevel, workingCapitalRate: after.drivers.workingCapitalRate };
          const sensBefore = computeGapWithSensitivity(drvBefore, market, { maxYears: MAX_YEARS });
          verdictBefore = sensBefore.base.kind; gapBefore = sensBefore.base.kind === "years" ? sensBefore.base.gap : null;
        }
      }

      results.push({
        symbol, status: "OK",
        // 🔴 STEP 951 실행 중 발견·수정: flags.yearWindow는 창이 잡히면 ok/skip 여부와 무관하게 채워진다
        //   (drivers.ts가 WINDOW_MISMATCH 통과 직후 flags에 심고, 이후의 다른 게이트 skip도 그 flags를 이어받는다).
        //   after.ok로 게이팅하면 "창은 잡혔지만 나중 게이트에서 skip"된 종목(예: AMST·ACT)의 창이 null로 잘못 보인다.
        yearWindow: (after.flags as Record<string, unknown>).yearWindow ?? null,
        windowReason: (after.flags as Record<string, unknown>).windowReason ?? null,
        after: { fiscalYear: after.fundamentals.fiscalYear, salesGrowth: after.ok ? after.drivers.salesGrowth : null, operatingMargin: after.ok ? after.drivers.operatingMargin : null, per: afterVal.per, pbr: afterVal.pbr, psr: afterVal.psr, evEbitda: afterVal.evEbitda, verdict: verdictAfter, gapYears: gapAfter },
        before: { fiscalYear: before.fiscalYear, salesGrowth: before.salesGrowth, operatingMargin: before.operatingMargin, per: beforeVal.per, pbr: beforeVal.pbr, psr: beforeVal.psr, evEbitda: beforeVal.evEbitda, verdict: verdictBefore, gapYears: gapBefore },
        verdictComparisonAvailable: !!(rd && rd.wacc != null),
        rawFundamentalsAfter: after.fundamentals, rawFundamentalsBefore: before,
      });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const nvda = results.find((r) => r.symbol === "NVDA") as { after?: { fiscalYear?: number } } | undefined;
  const aapl = results.find((r) => r.symbol === "AAPL") as { after?: { fiscalYear?: number } } | undefined;
  console.log(`NVDA after.fiscalYear=${nvda?.after?.fiscalYear} (기대: 2025, month<=5 규칙으로 FY2026이 calYear2025로 귀속)`);
  console.log(`AAPL after.fiscalYear=${aapl?.after?.fiscalYear} (기대: 2025)`);

  const out = { measuredAt: "2026-08-08", sample: SAMPLE30, cacheHits, newRequests, aborted, results };
  fs.writeFileSync("docs/probe_951_verify_raw.json", JSON.stringify(out));
  console.log(`저장 완료 — 캐시히트 ${cacheHits} · 신규요청 ${newRequests} · 중단여부 ${aborted ?? "없음"}`);
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
