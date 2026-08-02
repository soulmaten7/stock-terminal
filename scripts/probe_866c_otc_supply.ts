// STEP 866C — OTC 시총 조달 가능성 실측 + 동시 결격 재분류 (측정 전용 · 프로덕션 무변경)
// STEP 866D — 같은 스크립트에 단계 추가: OTC 티어(OTCQX/OTCQB/PINK/OTCID) × 3분류 교차표 + 보고 구멍 2건 메움
//   (mcapSource 집계·quoteReturnedButNoPrice if/else-if 누락 보정). 신규 파일 없음(866D 지시대로).
// 실행: npx tsx scripts/probe_866c_otc_supply.ts
// 🔴 금지: lib/revdcf/**·lib/lensPrecompute.ts 수정(import만) · us_market_cap 쓰기(866C가 받은 OTC 시총을 프로덕션에 넣지 않음) ·
//   revdcf_results 쓰기 · data/us_symbols.json 수정 · app/** 수정 · "OTC를 넣자/빼자" · "티어 컷 제안".
// 866B의 캐시(companyfacts, /tmp/866_cf)를 재사용 — 재다운로드 금지. 866D는 야후 조회를 486개(OTC)로 한정(전수 재실행 금지).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfMarket, type RevDcfVerdict } from "../lib/revdcf/engine";

const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;

// probe_us_universe.ts와 동일 동시성 패턴(그대로 재사용 — 신규 작성 금지 조항).
async function mapLimit<T>(arr: T[], limit: number, fn: (x: T, i: number) => Promise<void>): Promise<void> {
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; await fn(arr[cur], cur); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
}
function median(xs: number[]): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1); const lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }
function icc1(groups: Map<string, number[]>, minGroupSize = 1): number | null {
  const gs = [...groups.values()].filter((g) => g.length >= minGroupSize);
  const k = gs.length; if (k < 2) return null;
  const all = gs.flat(); const N = all.length; if (N <= k) return null;
  const grand = all.reduce((a, b) => a + b, 0) / N;
  let ssb = 0; for (const g of gs) { const m = g.reduce((a, b) => a + b, 0) / g.length; ssb += g.length * (m - grand) ** 2; }
  let ssw = 0; for (const g of gs) { const m = g.reduce((a, b) => a + b, 0) / g.length; for (const x of g) ssw += (x - m) ** 2; }
  const dfB = k - 1, dfW = N - k;
  const msb = ssb / dfB, msw = ssw / dfW;
  const sumNi2 = gs.reduce((a, g) => a + g.length ** 2, 0);
  const n0 = (N - sumNi2 / N) / dfB;
  if (n0 <= 0) return null;
  const icc = (msb - msw) / (msb + (n0 - 1) * msw);
  return Number.isFinite(icc) ? icc : null;
}

type Row866b = {
  cik: number; symbol: string; exchangeSec: string | null; exchangeDamodaran: string | null;
  sic: string | null; annualForm: string | null; ladderStage: string;
  bucket: "computed" | "undecidable" | "insufficient" | null; subTag: string | null; gapYears: number | null;
  marketCapBucket: string | null; marketCap: number | null;
};

async function main() {
  const sb = createAdminClient();
  const rows866b = JSON.parse(readFileSync("docs/probe_866b_rows.json", "utf8")) as Row866b[];
  const finalRows = rows866b.filter((r) => r.ladderStage === "final");
  console.error(`[0] 866B 로드 — final=${finalRows.length}`);

  // ══════════════════════════════ 1단계 — OTC 486 시총 실측 ══════════════════════════════
  const otcRows = finalRows.filter((r) => r.exchangeSec === "OTC");
  console.error(`[1] OTC 대상 ${otcRows.length}개 — Yahoo 조회…`);
  const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  const otcSyms = otcRows.map((r) => r.symbol);
  const chunks: string[][] = [];
  for (let i = 0; i < otcSyms.length; i += 100) chunks.push(otcSyms.slice(i, i + 100));

  type YQuote = { symbol?: string; marketCap?: number; regularMarketPrice?: number; fullExchangeName?: string };
  const quoteBySym = new Map<string, YQuote>();
  const errors: Record<string, number> = {};
  await mapLimit(chunks, 6, async (grp) => {
    try {
      const qs = (await yf.quote(grp)) as YQuote[];
      for (const q of Array.isArray(qs) ? qs : []) if (q?.symbol) quoteBySym.set(q.symbol, q);
    } catch (e) {
      const err = e as { name?: string; message?: string };
      const key = `${err?.name || "err"}: ${(err?.message || "").slice(0, 70)}`;
      errors[key] = (errors[key] || 0) + 1;
    }
  });

  let hasMarketCapN = 0, hasPriceOnlyN = 0, noResponseN = 0;
  const marketCaps: number[] = [];
  const byExchangeField: Record<string, number> = {};
  // 🔴 866D §보고구멍2: 원래 if/else-if라 marketCap도 price도 없는 응답이 어느 칸에도 안 들어갔다 — else로 채운다.
  const quoteReturnedButNoPriceSyms: string[] = [];
  for (const sym of otcSyms) {
    const q = quoteBySym.get(sym);
    if (!q) { noResponseN++; continue; }
    const ex = q.fullExchangeName ?? "(없음)";
    byExchangeField[ex] = (byExchangeField[ex] ?? 0) + 1;
    if (typeof q.marketCap === "number" && q.marketCap > 0) { hasMarketCapN++; marketCaps.push(q.marketCap); }
    else if (typeof q.regularMarketPrice === "number" && q.regularMarketPrice > 0) { hasPriceOnlyN++; }
    else { quoteReturnedButNoPriceSyms.push(sym); }
  }
  const supply = {
    probedAt: new Date().toISOString(),
    otcN: otcRows.length,
    quoteReturned: quoteBySym.size,
    hasMarketCap: hasMarketCapN,
    hasPriceOnly: hasPriceOnlyN,
    noResponse: noResponseN,
    quoteReturnedButNoPrice: quoteReturnedButNoPriceSyms.length, // 866D §보고구멍2
    quoteReturnedButNoPriceSymbols: quoteReturnedButNoPriceSyms,
    tallyCheck: `quoteReturned(${quoteBySym.size}) = hasMarketCap(${hasMarketCapN}) + hasPriceOnly(${hasPriceOnlyN}) + quoteReturnedButNoPrice(${quoteReturnedButNoPriceSyms.length}) = ${hasMarketCapN + hasPriceOnlyN + quoteReturnedButNoPriceSyms.length}`,
    marketCapPercentiles: { p10: percentile(marketCaps, 10), p50: percentile(marketCaps, 50), p90: percentile(marketCaps, 90) },
    byExchangeField,
    yahooErrors: errors,
    note: "야후 심볼 표기 변형 탐색 없음(원티커 1회만 시도 · 추측 금지). 응답 없음은 그대로 카운트.",
  };
  writeFileSync("docs/probe_866c_supply.json", JSON.stringify(supply, null, 2));
  console.error(`[1단계 완료] 응답 ${supply.quoteReturned} · marketCap ${hasMarketCapN} · 가격만 ${hasPriceOnlyN} · 무응답 ${noResponseN} · 응답O가격X ${quoteReturnedButNoPriceSyms.length}`);

  // ══════════════════════════════ 참조 데이터(cron route와 동일 — 값 코드 박기 금지, DB에서 읽기만) ══════════════════════════════
  console.error("[2] Damodaran·시총 참조 데이터 로드…");
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
  console.error(`  betaByInd=${betaByInd.size} indByT=${indByT.size} mcapBy(us_market_cap)=${mcapBy.size}(무변경 확인용)`);

  function computeVerdictFor(cik: number, symbol: string, mcap: number): { bucket: "computed" | "undecidable" | "insufficient"; subTag: string; gapYears: number | null } | null {
    const p = `${CF_DIR}/${cikName(cik)}`;
    if (!existsSync(p)) return null;
    let j: { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { return { bucket: "insufficient", subTag: "EX_PARSE", gapYears: null }; }
    const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
    if (!dr.ok) return { bucket: "insufficient", subTag: dr.skipReason, gapYears: null };
    const ind = indByT.get(symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    if (!ind || !beta) return { bucket: "insufficient", subTag: "NO_INDUSTRY", gapYears: null };
    if (!(mcap > 0)) return { bucket: "insufficient", subTag: "NO_MARKETCAP", gapYears: null };
    const deRatio = dr.market.debt / mcap;
    const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
    const sharePrice = mcap / dr.market.shares;
    const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
    const drv = { ...dr.drivers, taxRate: usTax };
    const full = runRevDcf(drv, market, { maxYears: 25 });
    const v = full.verdict;
    if (v.kind === "years") return { bucket: "computed", subTag: "years", gapYears: v.gap };
    if (v.kind === "over_cap") return { bucket: "undecidable", subTag: "over_cap", gapYears: null };
    if (v.kind === "below_one") return { bucket: "undecidable", subTag: "below_one", gapYears: null };
    if (v.kind === "value_destroying") return { bucket: "undecidable", subTag: "value_destroying", gapYears: null };
    return { bucket: "insufficient", subTag: "INVALID", gapYears: null };
  }

  // ══════════════════════════════ 2단계 — 시총이 붙었을 때의 분포 변화 ══════════════════════════════
  console.error("[3] 시총 확보 OTC 재계산…");
  // mcap 우선순위: 야후 marketCap → (가격만 있고 computeDrivers가 shares를 내면) price×shares. driversOk 확인 위해
  // 일단 computeDrivers를 한 번 태워 shares를 얻은 뒤에만 price×shares 사용 — 아니면 무의미(추정 금지).
  function otcMcapFor(cik: number, sym: string): number | null {
    const q = quoteBySym.get(sym);
    if (!q) return null;
    if (typeof q.marketCap === "number" && q.marketCap > 0) return q.marketCap;
    if (typeof q.regularMarketPrice === "number" && q.regularMarketPrice > 0) {
      const p = `${CF_DIR}/${cikName(cik)}`;
      if (!existsSync(p)) return null;
      try {
        const j = JSON.parse(readFileSync(p, "utf8")) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
        const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
        if (dr.ok && dr.market.shares > 0) return q.regularMarketPrice * dr.market.shares;
      } catch { /* fallthrough null */ }
    }
    return null;
  }

  const otcResults = new Map<number, { bucket: "computed" | "undecidable" | "insufficient"; subTag: string; gapYears: number | null; mcapUsed: number | null; mcapSource: "marketCap" | "priceTimesShares" | "none" }>();
  for (const r of otcRows) {
    const q = quoteBySym.get(r.symbol);
    const mcap = otcMcapFor(r.cik, r.symbol);
    const mcapSource: "marketCap" | "priceTimesShares" | "none" = mcap == null ? "none" : (typeof q?.marketCap === "number" && q.marketCap > 0 ? "marketCap" : "priceTimesShares");
    if (mcap == null) { otcResults.set(r.cik, { bucket: "insufficient", subTag: r.subTag ?? "NO_MARKETCAP", gapYears: null, mcapUsed: null, mcapSource: "none" }); continue; }
    const v = computeVerdictFor(r.cik, r.symbol, mcap);
    if (!v) { otcResults.set(r.cik, { bucket: "insufficient", subTag: "HTTP_MISSING", gapYears: null, mcapUsed: mcap, mcapSource }); continue; }
    otcResults.set(r.cik, { ...v, mcapUsed: mcap, mcapSource });
  }

  const otcWithMcap = [...otcResults.values()].filter((v) => v.mcapUsed != null).length;
  const moved = {
    computed: [...otcResults.values()].filter((v) => v.mcapUsed != null && v.bucket === "computed").length,
    undecidable: [...otcResults.values()].filter((v) => v.mcapUsed != null && v.bucket === "undecidable").length,
    stillInsufficient: [...otcResults.values()].filter((v) => v.mcapUsed != null && v.bucket === "insufficient").length,
  };
  const from135 = otcRows.filter((r) => r.subTag === "NO_MARKETCAP");
  const from135Results = from135.map((r) => otcResults.get(r.cik)!);
  const from135_NO_MARKETCAP = {
    n: from135.length,
    computed: from135Results.filter((v) => v.bucket === "computed").length,
    undecidable: from135Results.filter((v) => v.bucket === "undecidable").length,
    failedElsewhere: from135Results.filter((v) => v.bucket === "insufficient").length,
  };
  const gapYearsOtc = [...otcResults.values()].filter((v) => v.bucket === "computed").map((v) => v.gapYears!);
  const verdictMixOtc = {
    years: [...otcResults.values()].filter((v) => v.subTag === "years").length,
    over_cap: [...otcResults.values()].filter((v) => v.subTag === "over_cap").length,
    value_destroying: [...otcResults.values()].filter((v) => v.subTag === "value_destroying").length,
    below_one: [...otcResults.values()].filter((v) => v.subTag === "below_one").length,
  };
  console.error(`[2단계 완료] otcWithMcap=${otcWithMcap} moved=${JSON.stringify(moved)} from135=${JSON.stringify(from135_NO_MARKETCAP)}`);

  // ══════════════════════════════ 866D §1·2 — 티어를 행에 붙이고 결과와 교차 ══════════════════════════════
  // 🔴 매핑을 추측으로 늘리지 않는다 — 866C가 실제로 관측한 fullExchangeName 4종 + YHD만 취급, 그 외는 UNKNOWN.
  function normalizeTier(fullExchangeName: string | undefined): string {
    if (fullExchangeName === "OTC Markets OTCQX") return "OTCQX";
    if (fullExchangeName === "OTC Markets OTCQB") return "OTCQB";
    if (fullExchangeName === "OTC Markets OTCPK") return "PINK";
    if (fullExchangeName === "OTC Markets OTCID") return "OTCID";
    return "UNKNOWN"; // 응답 없음 · YHD · 그 외 미관측 값
  }
  type TierStat = {
    n: number; quoteOk: number; hasMarketCap: number; priceOnly: number;
    computed: number; undecidable: number; insufficient: number; yieldPctOfN: number | null;
    verdictMix: { years: number; over_cap: number; value_destroying: number; below_one: number };
    insufficientBreakdown: Record<string, number>;
    marketCapMedian: number | null;
  };
  function emptyTierStat(): TierStat {
    return { n: 0, quoteOk: 0, hasMarketCap: 0, priceOnly: 0, computed: 0, undecidable: 0, insufficient: 0, yieldPctOfN: null, verdictMix: { years: 0, over_cap: 0, value_destroying: 0, below_one: 0 }, insufficientBreakdown: {}, marketCapMedian: null };
  }
  const byTier: Record<string, TierStat> = { OTCQX: emptyTierStat(), OTCQB: emptyTierStat(), PINK: emptyTierStat(), OTCID: emptyTierStat(), UNKNOWN: emptyTierStat() };
  const tierMcaps: Record<string, number[]> = { OTCQX: [], OTCQB: [], PINK: [], OTCID: [], UNKNOWN: [] };
  for (const r of otcRows) {
    const q = quoteBySym.get(r.symbol);
    const tier = q ? normalizeTier(q.fullExchangeName) : "UNKNOWN";
    const st = byTier[tier];
    st.n++;
    if (q) st.quoteOk++;
    if (q && typeof q.marketCap === "number" && q.marketCap > 0) { st.hasMarketCap++; tierMcaps[tier].push(q.marketCap); }
    else if (q && typeof q.regularMarketPrice === "number" && q.regularMarketPrice > 0) st.priceOnly++;
    const res = otcResults.get(r.cik)!;
    if (res.bucket === "computed") st.computed++;
    else if (res.bucket === "undecidable") st.undecidable++;
    else st.insufficient++;
    if (res.subTag === "years") st.verdictMix.years++;
    else if (res.subTag === "over_cap") st.verdictMix.over_cap++;
    else if (res.subTag === "value_destroying") st.verdictMix.value_destroying++;
    else if (res.subTag === "below_one") st.verdictMix.below_one++;
    if (res.bucket === "insufficient") st.insufficientBreakdown[res.subTag] = (st.insufficientBreakdown[res.subTag] ?? 0) + 1;
  }
  for (const t of Object.keys(byTier)) { const st = byTier[t]; st.yieldPctOfN = st.n ? +(100 * st.computed / st.n).toFixed(1) : null; st.marketCapMedian = median(tierMcaps[t]); }

  // 대조군: 거래소상장(EXCHANGE_LISTED) — 같은 형식으로 866B/866C의 finalRows 비-OTC·비-null 행에서 산출.
  const exListedFinal = finalRows.filter((r) => r.exchangeSec != null && r.exchangeSec !== "OTC");
  const exListedStat: TierStat = emptyTierStat();
  const exListedMcaps: number[] = [];
  exListedStat.n = exListedFinal.length;
  exListedStat.quoteOk = 0; exListedStat.priceOnly = 0; // 이 축은 OTC 전용 개념(야후 조회) — 거래소상장은 866B가 이미 us_market_cap으로 계산해 해당 없음
  for (const r of exListedFinal) {
    if (r.marketCap != null && r.marketCap > 0) { exListedStat.hasMarketCap++; exListedMcaps.push(r.marketCap); }
    if (r.bucket === "computed") exListedStat.computed++;
    else if (r.bucket === "undecidable") exListedStat.undecidable++;
    else exListedStat.insufficient++;
    if (r.subTag === "years") exListedStat.verdictMix.years++;
    else if (r.subTag === "over_cap") exListedStat.verdictMix.over_cap++;
    else if (r.subTag === "value_destroying") exListedStat.verdictMix.value_destroying++;
    else if (r.subTag === "below_one") exListedStat.verdictMix.below_one++;
    if (r.bucket === "insufficient" && r.subTag) exListedStat.insufficientBreakdown[r.subTag] = (exListedStat.insufficientBreakdown[r.subTag] ?? 0) + 1;
  }
  exListedStat.yieldPctOfN = exListedStat.n ? +(100 * exListedStat.computed / exListedStat.n).toFixed(1) : null;
  exListedStat.marketCapMedian = median(exListedMcaps);
  (byTier as Record<string, TierStat>).EXCHANGE_LISTED = exListedStat;

  // 공시형 결격(INSUFFICIENT_HISTORY+MISSING_TAG) 비율 — 티어별 vs 거래소상장(대조군).
  const disclosureFailPct = (st: TierStat) => st.n ? +(100 * ((st.insufficientBreakdown.INSUFFICIENT_HISTORY ?? 0) + (st.insufficientBreakdown.MISSING_TAG ?? 0)) / st.n).toFixed(1) : null;
  const disclosureFailByTier = Object.fromEntries(Object.entries(byTier).map(([k, v]) => [k, disclosureFailPct(v)]));
  console.error(`[866D §2 완료] byTier=${JSON.stringify(Object.fromEntries(Object.entries(byTier).map(([k, v]) => [k, { n: v.n, computed: v.computed, yieldPctOfN: v.yieldPctOfN }])))}`);
  console.error(`  공시형결격비율: ${JSON.stringify(disclosureFailByTier)}`);

  // 866C §보고구멍1: mcapSource 집계(코드는 이미 추적하는데 출력에 없었다)
  const mcapSourceBreakdown = { marketCap: 0, priceTimesShares: 0, none: 0 };
  for (const v of otcResults.values()) {
    if (v.mcapSource === "marketCap") mcapSourceBreakdown.marketCap++;
    else if (v.mcapSource === "priceTimesShares") mcapSourceBreakdown.priceTimesShares++;
    else mcapSourceBreakdown.none++;
  }
  const otcWithMcapNote = `otcWithMcap = marketCap ${mcapSourceBreakdown.marketCap} + priceTimesShares ${mcapSourceBreakdown.priceTimesShares} = ${mcapSourceBreakdown.marketCap + mcapSourceBreakdown.priceTimesShares}. 가격만 있는 ${hasPriceOnlyN}건 중 computeDrivers가 shares를 낸 것만 사용(추정 금지).`;

  // ── 전수 재집계: 비-OTC 866B 결과는 그대로, OTC만 866C 결과로 교체 ──
  const nonOtcFinal = finalRows.filter((r) => r.exchangeSec !== "OTC");
  type MergedRow = { cik: number; symbol: string; bucket: string; subTag: string | null; gapYears: number | null; marketCapBucket: string | null };
  const mcapBucketOf = (m: number) => (m >= 200e9 ? "mega(200B+)" : m >= 10e9 ? "large(10-200B)" : m >= 2e9 ? "mid(2-10B)" : m >= 300e6 ? "small(0.3-2B)" : "micro(<0.3B)");
  const merged: MergedRow[] = [
    ...nonOtcFinal.map((r) => ({ cik: r.cik, symbol: r.symbol, bucket: r.bucket!, subTag: r.subTag, gapYears: r.gapYears, marketCapBucket: r.marketCapBucket })),
    ...otcRows.map((r) => {
      const res = otcResults.get(r.cik)!;
      const mb = res.mcapUsed != null && res.mcapUsed > 0 ? mcapBucketOf(res.mcapUsed) : "no-mcap";
      return { cik: r.cik, symbol: r.symbol, bucket: res.bucket, subTag: res.subTag, gapYears: res.gapYears, marketCapBucket: mb };
    }),
  ];
  const mComputed = merged.filter((r) => r.bucket === "computed");
  const mUndecidable = merged.filter((r) => r.bucket === "undecidable");
  const mInsufficient = merged.filter((r) => r.bucket === "insufficient");
  const mGap = mComputed.map((r) => r.gapYears!);
  // ICC(860 정의: minGroupSize=5, 업종=현재 damodaran 조인 — 866B의 fullUniverse_def860과 동일 기준)
  const iccGroups = new Map<string, number[]>();
  for (const r of mComputed) { const ind = indByT.get(r.symbol.toUpperCase()); if (!ind) continue; const arr = iccGroups.get(ind) ?? []; arr.push(r.gapYears!); iccGroups.set(ind, arr); }
  const iccMerged = icc1(iccGroups, 5);
  const microRows = merged.filter((r) => r.marketCapBucket === "micro(<0.3B)");
  const microYield = microRows.length ? +(100 * microRows.filter((r) => r.bucket === "computed").length / microRows.length).toFixed(1) : null;

  const recount866c = {
    N: merged.length, computed: mComputed.length, undecidable: mUndecidable.length, insufficient: mInsufficient.length,
    yieldPct: +(100 * mComputed.length / merged.length).toFixed(1),
    gapMedianYears: median(mGap), gapP25P75: [percentile(mGap, 25), percentile(mGap, 75)],
    iccDef860: iccMerged != null ? +iccMerged.toFixed(3) : null,
    microBucketYieldPctOfN: microYield,
  };
  console.error(`[재집계 완료] ${JSON.stringify(recount866c)}`);

  // ══════════════════════════════ 3단계 — 동시 결격 재분류(순서 의존 제거, insufficient 1,302 전원) ══════════════════════════════
  console.error("[4] insufficient 1,302 전원 동시 결격 재분류…");
  const insufficientAll = finalRows.filter((r) => r.bucket === "insufficient");
  type Reclass = { cik: number; symbol: string; hasMarketCap: boolean; hasIndustry: boolean; driversOk: boolean; driverFailReason: string | null; firstBlockingReason: string | null };
  const reclass: Reclass[] = [];
  for (const r of insufficientAll) {
    // 시총: us_market_cap 우선, OTC면 866C 실측값으로 대체(둘 다 없으면 false) — us_market_cap엔 쓰지 않는다(금지 2).
    const isOtc = r.exchangeSec === "OTC";
    const mcapVal = isOtc ? (otcResults.get(r.cik)?.mcapUsed ?? null) : (mcapBy.get(r.symbol.toUpperCase()) ?? null);
    const hasMarketCap = mcapVal != null && mcapVal > 0;
    const hasIndustry = indByT.has(r.symbol.toUpperCase());
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    let driversOk = false, driverFailReason: string | null = null;
    if (existsSync(p)) {
      try {
        const j = JSON.parse(readFileSync(p, "utf8")) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
        const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
        driversOk = dr.ok; if (!dr.ok) driverFailReason = dr.skipReason;
      } catch { driverFailReason = "EX_PARSE"; }
    } else driverFailReason = "HTTP_MISSING";
    reclass.push({ cik: r.cik, symbol: r.symbol, hasMarketCap, hasIndustry, driversOk, driverFailReason, firstBlockingReason: r.subTag });
  }
  const ourFaultOnly = reclass.filter((x) => (!x.hasMarketCap || !x.hasIndustry) && x.driversOk).length;
  const companyFaultOnly = reclass.filter((x) => x.hasMarketCap && x.hasIndustry && !x.driversOk).length;
  const both = reclass.filter((x) => (!x.hasMarketCap || !x.hasIndustry) && !x.driversOk).length;
  const neitherBlocked = reclass.filter((x) => x.hasMarketCap && x.hasIndustry && x.driversOk).length; // 이론상 0(계산됐어야 함) — 실측으로 확인
  const insufficientCauseCorrected = { ourFaultOnly, companyFaultOnly, both, neitherBlocked_shouldBeZero: neitherBlocked, total: reclass.length };
  console.error(`[3단계 완료] 우리조달만=${ourFaultOnly} 회사공시만=${companyFaultOnly} 둘다=${both} (합계 ${reclass.length}, 검증용 neitherBlocked=${neitherBlocked})`);

  // ══════════════════════════════ 4단계 — 산출물 ══════════════════════════════
  const output866c = {
    probedAt: new Date().toISOString(),
    supersedes: "docs/probe_866b_output.json (insufficientCause만)",
    otcSupplyRef: "docs/probe_866c_supply.json",
    otcRecompute: { otcWithMcap, moved, from135_NO_MARKETCAP, gapYearsOtc: { median: median(gapYearsOtc), p25: percentile(gapYearsOtc, 25), p75: percentile(gapYearsOtc, 75), n: gapYearsOtc.length }, verdictMixOtc },
    recount: { the866b: { N: 3354, computed: 364, undecidable: 1688, insufficient: 1302, yieldPct: 10.9, gapMedianYears: 8, iccDef860: 0.165, microBucketYieldPctOfN: 3.3 }, the866c: recount866c },
    insufficientCauseCorrected,
    mcapSourceBreakdown, // 866D §보고구멍1
    otcWithMcapNote, // 866D §보고구멍1
    note: "재료만 — OTC 채택 여부·심볼 목록 확장 여부 제안 없음(STEP 866C §금지 6). us_market_cap·revdcf_results·us_symbols.json 전부 무변경(측정 전용).",
  };
  writeFileSync("docs/probe_866c_output.json", JSON.stringify(output866c, null, 2));
  console.error("[4단계] docs/probe_866c_output.json 저장(866D 키 2개 추가: mcapSourceBreakdown·otcWithMcapNote)");

  // ══════════════════════════════ 866D §4 — 전용 산출물(티어 교차표) ══════════════════════════════
  const output866d = {
    probedAt: new Date().toISOString(),
    supersedesNote: "866C의 byExchangeField(분포만)를 3분류·insufficientBreakdown과 교차. 티어 채택·컷 제안 없음(STEP 866D §금지).",
    byTier,
    disclosureFailPctByTier: disclosureFailByTier, // (INSUFFICIENT_HISTORY+MISSING_TAG)÷n, 티어별 vs EXCHANGE_LISTED(대조군)
    otcMarketsTierClaim: "OTC Markets 공식(2024-10-14 블로그): OTCID = minimal current information standard만 요구, OTCQX/OTCQB의 qualitative standards 없음 — 티어=공시 수준의 계단이라는 주장. 아래 disclosureFailPctByTier가 이 주장을 우리 데이터에서 지지하는지 여부는 숫자로만 판단(해석 없음).",
    reportingGaps: {
      quoteReturnedButNoPrice: supply.quoteReturnedButNoPrice,
      quoteReturnedButNoPriceSymbols: supply.quoteReturnedButNoPriceSymbols,
      mcapSourceBreakdown,
      otcWithMcapNote,
    },
    note: "재료만 — 티어 채택·컷에 의견 없음(STEP 866D §금지사항).",
  };
  writeFileSync("docs/probe_866d_output.json", JSON.stringify(output866d, null, 2));
  console.error("[866D 완료] docs/probe_866d_output.json 저장");

  const rows866c = insufficientAll.map((r, i) => ({ ...reclass[i] }));
  writeFileSync("docs/probe_866c_rows.json", JSON.stringify(rows866c));
  console.error(`[4단계] docs/probe_866c_rows.json 저장 (${rows866c.length}행)`);

  // 866B 산출물 정정 — insufficientCause에 supersededBy만 추가(덮어쓰기 아님)
  const prior866b = JSON.parse(readFileSync("docs/probe_866b_output.json", "utf8")) as { fullUniverseSummary?: { insufficientCause?: Record<string, unknown> } };
  if (prior866b.fullUniverseSummary?.insufficientCause) {
    (prior866b.fullUniverseSummary.insufficientCause as Record<string, unknown>).supersededBy = "docs/probe_866c_output.json";
  }
  writeFileSync("docs/probe_866b_output.json", JSON.stringify(prior866b, null, 2));
  console.error("[4단계] docs/probe_866b_output.json의 insufficientCause에 supersededBy만 추가(덮어쓰기 아님)");

  // ══════════════════════════════ 보고용 요약 ══════════════════════════════
  console.error("\n=== 요약 ===");
  console.error(`OTC 시총 조달: ${otcRows.length} 중 응답 ${supply.quoteReturned} · marketCap ${hasMarketCapN} · 가격만 ${hasPriceOnlyN} · 무응답 ${noResponseN}`);
  console.error(`시총 붙은 뒤 이동: computed ${moved.computed} / undecidable ${moved.undecidable} / 여전히 부족 ${moved.stillInsufficient}`);
  console.error(`  NO_MARKETCAP 135 출신: computed ${from135_NO_MARKETCAP.computed} / undecidable ${from135_NO_MARKETCAP.undecidable} / 다른 데서 실패 ${from135_NO_MARKETCAP.failedElsewhere}`);
  console.error(`전수 재집계: (a) 364→${recount866c.computed} · 산출률 10.9%→${recount866c.yieldPct}% · GAP중앙 8→${recount866c.gapMedianYears}년 · ICC(860정의) 0.165→${recount866c.iccDef860}`);
  console.error(`동시 결격 3칸: 우리조달만 ${ourFaultOnly} / 회사공시만 ${companyFaultOnly} / 둘다 ${both} (866B 246/1001/55 정정)`);
  console.error(`\n--- 866D ---`);
  const tOrder = ["OTCQX", "OTCQB", "PINK", "OTCID", "UNKNOWN", "EXCHANGE_LISTED"];
  console.error(`티어별 (n/산출/판정불가/입력부족/산출률(a)÷N/시총중앙):`);
  for (const t of tOrder) { const st = byTier[t]; console.error(`  ${t}: n=${st.n} 산출=${st.computed} 판정불가=${st.undecidable} 입력부족=${st.insufficient} 산출률=${st.yieldPctOfN}% 시총중앙=${st.marketCapMedian}`); }
  console.error(`공시형 결격(INSUFFICIENT_HISTORY+MISSING_TAG) 비율: ${JSON.stringify(disclosureFailByTier)}`);
  console.error(`보고 구멍: quoteReturnedButNoPrice ${supply.quoteReturnedButNoPrice}(심볼 ${JSON.stringify(supply.quoteReturnedButNoPriceSymbols)}) · mcapSource marketCap ${mcapSourceBreakdown.marketCap} + priceTimesShares ${mcapSourceBreakdown.priceTimesShares} = ${mcapSourceBreakdown.marketCap + mcapSourceBreakdown.priceTimesShares}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
