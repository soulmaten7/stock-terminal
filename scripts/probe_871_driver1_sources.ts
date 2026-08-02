// STEP 871 — 차이 9행의 1행: driver 1(매출 성장률) 실측. 측정 전용 · lib/revdcf/** 수정 금지(import만).
// 금지: revdcf_results·us_market_cap 쓰기 · data/us_symbols.json 수정 · 화면/플래그 변경 · "원전으로 바꾸자/말자" 판정 · 다음 행 제안.
// 실행: npx tsx scripts/probe_871_driver1_sources.ts
//
// §2 커버리지: A) 야후 애널리스트 매출추정(quoteSummary earningsTrend — 원전이 지목한 소스 중 하나, 우리가 이미 보유)
//              B) 8-K 가이던스 언어존재율(847 재사용) + 금액추출 성공률(신규 — 847은 언어만 봤음)
//              C) Value Line·Morningstar = 측정 안 함(유료·비공개, 기록만)
// §3 결과변화: A에서 실제 값(revenueEstimate.growth)을 얻은 종목만, salesGrowth를 그 값으로 교체해 엔진 재실행(수정 없이 import).
//   companyfacts는 866B/866C가 캐시해 둔 /tmp/866_cf 재사용(재다운로드 금지) — startingSales 등 원시 드라이버 재현에 필요.
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
const UA = { "User-Agent": process.env.SEC_USER_AGENT || "Trillion Research admin@onetrillion.app" };

async function mapLimit<T>(arr: T[], limit: number, fn: (x: T, i: number) => Promise<void>): Promise<void> {
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; await fn(arr[cur], cur); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
}
// 🔴 yahoo-finance2 quoteSummary가 크럼/쿠키 협상에서 드물게 응답 없이 멈추는 경우가 있어(첫 실행 hang 관찰)
// 워커 하나가 무기한 블록되지 않도록 콜당 타임아웃을 건다. 프로덕션 로직(lib/revdcf/**)엔 없는, 이 프로브 전용 안전장치.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms))]);
}
function median(xs: number[]): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1); const lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }

type BaseRow = {
  cik: number; symbol: string; verdict: string; gap_years: number | null; sales_growth: number;
  operating_margin: number; starting_margin: number; tax_rate: number; fixed_capital_rate: number;
  working_capital_rate: number; wacc: number; debt: number; non_operating_assets: number; shares: number; share_price: number;
};

async function main() {
  const sb = createAdminClient();

  // ══════════════════════════════ [0] 현행 515(baseline) 로드 — DB 직접 재확인, 명령서 수치 그대로 안 믿음 ══════════════════════════════
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const asOf = latest.as_of;
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results")
      .select("cik,symbol,verdict,gap_years,sales_growth,operating_margin,starting_margin,tax_rate,fixed_capital_rate,working_capital_rate,wacc,debt,non_operating_assets,shares,share_price")
      .eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  const salesGrowths = rows.map((r) => r.sales_growth);
  const gapYs = rows.filter((r) => r.verdict === "years").map((r) => r.gap_years!) as number[];
  const baseline = {
    asOf, n: rows.length,
    salesGrowth: { p05: percentile(salesGrowths, 5), p25: percentile(salesGrowths, 25), p50: percentile(salesGrowths, 50), p75: percentile(salesGrowths, 75), p95: percentile(salesGrowths, 95), negative: salesGrowths.filter((x) => x < 0).length, over30pct: salesGrowths.filter((x) => x > 0.3).length },
    gapYears: { p25: percentile(gapYs, 25), p50: percentile(gapYs, 50), p75: percentile(gapYs, 75), n: gapYs.length },
    verdictMix: rows.reduce((acc: Record<string, number>, r) => { acc[r.verdict] = (acc[r.verdict] || 0) + 1; return acc; }, {}),
  };
  console.error(`[0] baseline 로드 as_of=${asOf} n=${rows.length}`);
  console.error(`  sales_growth p50=${(baseline.salesGrowth.p50! * 100).toFixed(2)}% (명령서 기준선 9.48%) · gap_years p50=${baseline.gapYears.p50}(명령서 11)`);

  // ══════════════════════════════ [1] §2A 야후 애널리스트 매출추정 ══════════════════════════════
  console.error(`[1] 야후 earningsTrend 조회 ${rows.length}개…`);
  const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  type Trend = { period?: string; endDate?: string | Date | null; revenueEstimate?: { avg?: number | null; low?: number | null; high?: number | null; numberOfAnalysts?: number | null; yearAgoRevenue?: number | null; growth?: number | null } };
  const yahooBySym = new Map<string, { ok: boolean; trends?: Trend[]; err?: string }>();
  let yDone = 0;
  await mapLimit(rows, 6, async (r) => {
    try {
      const q = (await withTimeout(yf.quoteSummary(r.symbol, { modules: ["earningsTrend"] }, { validateResult: false }), 8000)) as { earningsTrend?: { trend?: Trend[] } };
      yahooBySym.set(r.symbol, { ok: true, trends: q.earningsTrend?.trend ?? [] });
    } catch (e) {
      yahooBySym.set(r.symbol, { ok: false, err: String((e as Error).message || e).slice(0, 100) });
    } finally {
      yDone++; if (yDone % 100 === 0) console.error(`  진행 ${yDone}/${rows.length}`);
    }
  });
  let yahooResponded = 0, yahoo0y = 0, yahooPlus1y = 0, yahooPlus5y = 0;
  const yahoo0yGrowths: number[] = [];
  const analystCounts: number[] = [];
  for (const r of rows) {
    const y = yahooBySym.get(r.symbol);
    if (!y || !y.ok) continue;
    yahooResponded++;
    const t0y = y.trends!.find((t) => t.period === "0y");
    const tP1y = y.trends!.find((t) => t.period === "+1y");
    const tP5y = y.trends!.find((t) => t.period === "+5y");
    if (t0y?.revenueEstimate?.growth != null) { yahoo0y++; yahoo0yGrowths.push(t0y.revenueEstimate.growth); if (t0y.revenueEstimate.numberOfAnalysts != null) analystCounts.push(t0y.revenueEstimate.numberOfAnalysts); }
    if (tP1y?.revenueEstimate?.growth != null) yahooPlus1y++;
    if (tP5y) yahooPlus5y++;
  }
  console.error(`  응답 ${yahooResponded}/${rows.length} · 0y 성장치 확보 ${yahoo0y} · +1y 확보 ${yahooPlus1y} · +5y 필드존재 ${yahooPlus5y}`);

  // ══════════════════════════════ [2] §2B 8-K 가이던스 — 언어존재 vs 금액추출 분리(847은 언어만 봤음) ══════════════════════════════
  console.error(`[2] 8-K 재스캔 ${rows.length}개(515 전수 · 847은 60표본)…`);
  const GUID = /(guidance|outlook|we (?:expect|anticipate|project|forecast)|full[- ]year|fiscal (?:20\d\d|year) .{0,30}(?:revenue|sales|growth)|reaffirm|raising our)/i;
  const REVGUID = /(revenue|net sales|sales|comparable sales|same[- ]store).{0,60}(guidance|outlook|expect|to be (?:between|approximately|in the range)|range of|202\d)/i;
  // 🔴 신규(871) — 언어 감지가 아니라 실제 숫자(성장률% 또는 달러 범위) 추출 시도. 둘 중 하나라도 매칭되면 "금액추출 성공".
  const PCT_RANGE = /(revenue|net sales|sales|comparable sales|same[- ]store)[^.]{0,100}?(-?\d{1,2}(?:\.\d+)?)\s?%\s*(?:to|-|–|and)\s*(-?\d{1,2}(?:\.\d+)?)\s?%/i;
  const PCT_SINGLE = /(revenue|net sales|sales)[^.]{0,80}?growth of (?:approximately\s*)?(-?\d{1,2}(?:\.\d+)?)\s?%/i;
  const DOLLAR_RANGE = /(revenue|net sales|sales)[^.]{0,100}?\$([\d,]+(?:\.\d+)?)\s?(billion|million)\s*(?:to|-|–)\s*\$([\d,]+(?:\.\d+)?)\s?(billion|million)/i;

  let lastCall = 0;
  const throttle = async () => { const w = lastCall + 200 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };

  let with8k = 0, withEarnings8k = 0, fetched = 0, hasGuidLang = 0, hasRevGuidLang = 0, hasAmountExtract = 0;
  const secBySym = new Map<string, { guidLang: boolean; revGuidLang: boolean; amountExtracted: boolean; extractedText?: string }>();
  await mapLimit(rows, 4, async (r) => {
    await throttle();
    try {
      const rs = await fetch(`https://data.sec.gov/submissions/CIK${String(r.cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(15000) });
      if (!rs.ok) return;
      const j = (await rs.json()) as { filings?: { recent?: { form?: string[]; items?: string[]; accessionNumber?: string[]; primaryDocument?: string[]; filingDate?: string[] } } };
      const rec = j.filings?.recent || {};
      const forms = rec.form || [], items = rec.items || [], accn = rec.accessionNumber || [], docs = rec.primaryDocument || [];
      let any8k = false, earn: { accn: string; doc: string } | null = null;
      for (let i = 0; i < forms.length; i++) { if (forms[i] !== "8-K") continue; any8k = true; if (/2\.02/.test(items[i] || "") && !earn) earn = { accn: accn[i], doc: docs[i] }; }
      if (any8k) with8k++;
      if (!earn) return;
      withEarnings8k++;
      const an = earn.accn.replace(/-/g, "");
      await throttle();
      let exDoc = earn.doc;
      try {
        const ix = await fetch(`https://www.sec.gov/Archives/edgar/data/${r.cik}/${an}/index.json`, { headers: UA, signal: AbortSignal.timeout(15000) });
        if (ix.ok) {
          const ixj = (await ix.json()) as { directory?: { item?: { name: string }[] } };
          const items2 = ixj.directory?.item || [];
          const ex = items2.find((f) => /ex.?99.?1|ex991|exhibit99/i.test(f.name)) || items2.find((f) => /ex.?99/i.test(f.name));
          if (ex) exDoc = ex.name;
        }
      } catch { /* index 조회 실패 시 8-K 본문으로 폴백 */ }
      await throttle();
      const dr = await fetch(`https://www.sec.gov/Archives/edgar/data/${r.cik}/${an}/${exDoc}`, { headers: UA, signal: AbortSignal.timeout(15000) });
      if (!dr.ok) return;
      fetched++;
      const txt = (await dr.text()).replace(/<[^>]+>/g, " ").slice(0, 400000);
      const g = GUID.test(txt), rg = REVGUID.test(txt);
      const pctM = txt.match(PCT_RANGE) || txt.match(PCT_SINGLE);
      const dolM = txt.match(DOLLAR_RANGE);
      const amountOk = !!(pctM || dolM);
      if (g) hasGuidLang++; if (rg) hasRevGuidLang++; if (amountOk) hasAmountExtract++;
      secBySym.set(r.symbol, { guidLang: g, revGuidLang: rg, amountExtracted: amountOk, extractedText: (pctM?.[0] || dolM?.[0])?.slice(0, 200) });
    } catch { /* 개별 실패는 그대로 무응답 처리 */ }
  });
  console.error(`  8-K 有 ${with8k} · 실적발표(2.02) ${withEarnings8k} · 본문fetch ${fetched} · 가이던스언어 ${hasGuidLang} · 매출가이던스언어 ${hasRevGuidLang} · 금액추출 ${hasAmountExtract}`);

  // ══════════════════════════════ [3] A∪B, A∩B ══════════════════════════════
  const hasA = new Set([...yahooBySym.entries()].filter(([, v]) => { const t0y = v.ok && v.trends?.find((t) => t.period === "0y"); return t0y && (t0y as Trend).revenueEstimate?.growth != null; }).map(([k]) => k));
  const hasB = new Set([...secBySym.entries()].filter(([, v]) => v.amountExtracted).map(([k]) => k));
  const union = new Set([...hasA, ...hasB]);
  const intersect = [...hasA].filter((s) => hasB.has(s));
  const coverage = {
    universe: rows.length, asOf,
    A_yahooAnalystRevenue: { responded: yahooResponded, has0yGrowth: yahoo0y, hasPlus1y: yahooPlus1y, hasPlus5yField: yahooPlus5y, analystCountMedian: median(analystCounts), analystCountP25: percentile(analystCounts, 25), analystCountP75: percentile(analystCounts, 75) },
    B_sec8K_full515: { with8k, withEarnings8k, bodyFetched: fetched, guidanceLanguage: hasGuidLang, revenueGuidanceLanguage: hasRevGuidLang, amountExtracted: hasAmountExtract, rateRevGuidLangOfFetched: fetched ? +(hasRevGuidLang / fetched).toFixed(3) : null, rateAmountExtractedOfFetched: fetched ? +(hasAmountExtract / fetched).toFixed(3) : null },
    C_valueLineMorningstar: { measured: false, note: "유료·비공개 — 원전 소스이나 우리는 접근 불가로 기록만(측정하지 않음)" },
    union: union.size, intersectionAandB: intersect.length,
    note: "A=야후 애널리스트 컨센서스(0y period revenueEstimate.growth, 실제 값). B=8-K 언어존재와 금액추출을 분리(847의 63.3%는 언어존재율이지 커버리지가 아니었음). C=측정 안 함.",
  };
  writeFileSync("docs/probe_871_coverage.json", JSON.stringify(coverage, null, 2));
  console.error(`[3] A=${hasA.size} B(금액추출)=${hasB.size} 합집합=${union.size} 교집합=${intersect.length}`);

  // ══════════════════════════════ [4] §3 결과변화 — A(야후 0y)로 salesGrowth 교체해 재실행 ══════════════════════════════
  console.error(`[4] 성장률 교체 재실행 — 대상(A확보) ${hasA.size}개…`);
  const gi = (await sb.from("damodaran_global_inputs").select("*").single()).data as { as_of: string; riskfree_rate: number; erp: number; expected_inflation: number };
  const rf = +gi.riskfree_rate, erp = +gi.erp, inflation = +gi.expected_inflation, damoAsOf = gi.as_of;
  const usTax = +(await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").single()).data!.marginal_rate;
  const spreads = (await sb.from("damodaran_credit_spread").select("*")).data as { std_dev_lo: number; std_dev_hi: number | null; spread: number }[];
  const betaByInd = new Map(((await sb.from("damodaran_beta").select("industry, unlevered_beta_cash_adj, std_dev_equity")).data as { industry: string; unlevered_beta_cash_adj: number; std_dev_equity: number }[]).map((b) => [b.industry, b]));
  const indRows: { ticker_norm: string; industry_group: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("damodaran_industry").select("ticker_norm, industry_group").eq("is_us_listed", true).range(f, f + 999); const c = (data ?? []) as typeof indRows; indRows.push(...c); if (c.length < 1000) break; }
  const indByT = new Map(indRows.map((r) => [r.ticker_norm, r.industry_group]));
  const mcapRows: { symbol: string; market_cap: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapBy = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), +r.market_cap]));
  console.error(`  참조데이터: betaByInd=${betaByInd.size} indByT=${indByT.size} mcapBy=${mcapBy.size}(무변경 확인용) damodaranAsOf=${damoAsOf}`);

  type OutRow = {
    cik: number; symbol: string;
    baselineRecomputeMatches: boolean | null; // DB stored verdict/gap_years 재현 크로스체크
    oldSalesGrowth: number; newSalesGrowth: number | null; newSalesGrowthLow: number | null; newSalesGrowthHigh: number | null;
    oldVerdict: string; oldGapYears: number | null;
    newVerdict: string | null; newGapYears: number | null;
    newVerdictLow: string | null; newVerdictHigh: string | null;
    signFlip: boolean;
  };
  const outRows: OutRow[] = [];
  let baselineMismatch = 0, cfMissing = 0, noIndOrMcap = 0;
  for (const r of rows) {
    const y = yahooBySym.get(r.symbol);
    const t0y = y?.ok ? y.trends?.find((t) => t.period === "0y") : undefined;
    const growth0y = t0y?.revenueEstimate?.growth ?? null;
    if (growth0y == null) continue; // A 미확보 종목은 §3 대상 아님(§2에서 이미 카운트)

    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { cfMissing++; continue; }
    let j: { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { cfMissing++; continue; }
    const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
    if (!dr.ok) { cfMissing++; continue; } // 이미 skip_reason null인 종목이라 정상적으론 여기 안 옴 — 오면 캐시-라이브 시점차
    const ind = indByT.get(r.symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
    const mcap = mcapBy.get(r.symbol.toUpperCase());
    if (!ind || !beta || !mcap) { noIndOrMcap++; continue; }
    const deRatio = dr.market.debt / mcap;
    const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
    const sharePrice = mcap / dr.market.shares;
    const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
    const drvBase = { ...dr.drivers, taxRate: usTax };

    // 크로스체크: 캐시 companyfacts로 재현한 baseline이 DB 저장값과 일치하는가(다르면 companyfacts 캐시가 DB 계산 시점보다 갱신됐다는 뜻)
    const sensBase = computeGapWithSensitivity(drvBase, market, { maxYears: 25 });
    const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : null);
    const baselineMatches = sensBase.base.kind === r.verdict && gnum(sensBase.base) === r.gap_years;
    if (!baselineMatches) baselineMismatch++;

    const growthLow = t0y?.revenueEstimate?.low != null && t0y.revenueEstimate.yearAgoRevenue ? t0y.revenueEstimate.low / t0y.revenueEstimate.yearAgoRevenue - 1 : null;
    const growthHigh = t0y?.revenueEstimate?.high != null && t0y.revenueEstimate.yearAgoRevenue ? t0y.revenueEstimate.high / t0y.revenueEstimate.yearAgoRevenue - 1 : null;

    const swapped = runRevDcf({ ...drvBase, salesGrowth: growth0y }, market, { maxYears: 25 });
    const swappedLow = growthLow != null ? runRevDcf({ ...drvBase, salesGrowth: growthLow }, market, { maxYears: 25 }) : null;
    const swappedHigh = growthHigh != null ? runRevDcf({ ...drvBase, salesGrowth: growthHigh }, market, { maxYears: 25 }) : null;

    outRows.push({
      cik: r.cik, symbol: r.symbol,
      baselineRecomputeMatches: baselineMatches,
      oldSalesGrowth: r.sales_growth, newSalesGrowth: growth0y, newSalesGrowthLow: growthLow, newSalesGrowthHigh: growthHigh,
      oldVerdict: r.verdict, oldGapYears: r.gap_years,
      newVerdict: swapped.verdict.kind, newGapYears: gnum(swapped.verdict),
      newVerdictLow: swappedLow?.verdict.kind ?? null, newVerdictHigh: swappedHigh?.verdict.kind ?? null,
      signFlip: (r.sales_growth < 0) !== (growth0y < 0),
    });
  }
  writeFileSync("docs/probe_871_rows.json", JSON.stringify(outRows, null, 2));
  console.error(`[4] 재실행 완료 n=${outRows.length}(cf없음 ${cfMissing} · 업종/시총없음 ${noIndOrMcap} · baseline불일치 ${baselineMismatch})`);

  // 집계
  const newGrowths = outRows.map((o) => o.newSalesGrowth!).filter((x) => x != null);
  const newGapYs = outRows.filter((o) => o.newVerdict === "years").map((o) => o.newGapYears!) as number[];
  const migration: Record<string, number> = {};
  for (const o of outRows) { const key = `${o.oldVerdict}→${o.newVerdict}`; migration[key] = (migration[key] || 0) + 1; }
  const signFlips = outRows.filter((o) => o.signFlip).length;
  const scenarioLowHighCount = outRows.filter((o) => o.newVerdictLow != null && o.newVerdictHigh != null).length;

  const output = {
    asOf, damoAsOf,
    n: outRows.length,
    baselineCrossCheck: { matches: outRows.length - baselineMismatch, mismatches: baselineMismatch, note: "캐시 companyfacts(/tmp/866_cf)로 기존 salesGrowth 그대로 재실행했을 때 DB 저장 verdict·gap_years와 일치하는지(캐시-라이브 시점차 확인용)" },
    newSalesGrowth: { p05: percentile(newGrowths, 5), p25: percentile(newGrowths, 25), p50: percentile(newGrowths, 50), p75: percentile(newGrowths, 75), p95: percentile(newGrowths, 95), negative: newGrowths.filter((x) => x < 0).length, over30pct: newGrowths.filter((x) => x > 0.3).length },
    newGapYears: { p25: percentile(newGapYs, 25), p50: percentile(newGapYs, 50), p75: percentile(newGapYs, 75), n: newGapYs.length },
    verdictMigration: migration,
    signFlips,
    scenarioLowHighFeasible: { n: scenarioLowHighCount, note: scenarioLowHighCount > 0 ? "야후 revenueEstimate.low/high로 원전의 저/고 시나리오 근사 산출 가능" : "저/고 시나리오 산출 불가(low/high 필드 결측)" },
    baselineForComparison: baseline,
    note: "재료만 — 제안 없음. ③판정은 장은태.",
  };
  writeFileSync("docs/probe_871_output.json", JSON.stringify(output, null, 2));
  console.error(`\n=== 요약 ===`);
  console.error(`newSalesGrowth p50=${(output.newSalesGrowth.p50! * 100).toFixed(2)}% (구 ${(baseline.salesGrowth.p50! * 100).toFixed(2)}%)`);
  console.error(`gap_years p50: 구 ${baseline.gapYears.p50} → 신 ${output.newGapYears.p50}`);
  console.error(`verdict 이동: ${JSON.stringify(migration)}`);
  console.error(`부호반전: ${signFlips}사 · 저고시나리오 가능: ${scenarioLowHighCount}사`);

  // 무변경 확인
  const rr = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false })).data as { as_of: string }[];
  const counts: Record<string, number> = {};
  for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,886 기대)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
