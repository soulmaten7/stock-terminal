// STEP 866 — 역DCF 모집단 실측 (측정 전용 · 프로덕션 무변경)
// 실행: npx tsx scripts/probe_866_universe.ts
// 🔴 금지: lib/revdcf/** 수정(이 스크립트는 import만) · revdcf_results INSERT/UPDATE/UPSERT/DELETE(읽기만) ·
//   app/** 수정 · docs/probe_survivors.json 덮어쓰기(7/31 고정본) · 유동성(FALR) 컷 적용(폐기 후보) · 컷 제안/채택 권고.
// 이 스크립트는 company_tickers_exchange.json 전수를 시작점으로 컷 없이 전수 계산해 604(물려받은 1,000 안에서의 결과)와
// 분포를 비교한다. SEC 벌크 아카이브(companyfacts.zip·submissions.zip)를 로컬 캐시로 써 개별 호출 폭주를 피한다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync, existsSync, readFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { execFileSync } from "child_process";
import { computeDrivers } from "../lib/revdcf/drivers";
import { assembleWacc, creditSpreadFor, computeGapWithSensitivity } from "../lib/revdcf/compute";
import { runRevDcf, type RevDcfMarket, type RevDcfVerdict } from "../lib/revdcf/engine";

// ── probe_839_reverify.ts 재사용 유틸(그대로 복사 — 신규 작성 금지 조항) ──────────────────────────
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
let bytesTotal = 0, callsTotal = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function throttle() { const gap = 300; const w = lastCall + gap - Date.now(); if (w > 0) await sleep(w); lastCall = Date.now(); }
async function secGet(url: string): Promise<{ json: unknown } | null> {
  for (let a = 0; a < 7; a++) {
    await throttle();
    try {
      const res = await fetch(url, { headers: UA });
      if (res.status === 429 || res.status === 503) { await sleep(Math.min(2 ** a * 1000, 30000)); continue; }
      if (!res.ok) return null;
      const t = await res.text(); bytesTotal += Buffer.byteLength(t); callsTotal++;
      return { json: JSON.parse(t) };
    } catch { await sleep(Math.min(2 ** a * 500, 15000)); }
  }
  return null;
}
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, async () => { while (i < arr.length) { const c = i++; out[c] = await fn(arr[c], c); } }));
  return out;
}
type Fr = { pts: number; byCik: Map<number, number> };
async function frames(ns: string, tag: string, unit: string, frame: string): Promise<Fr | null> {
  const r = await secGet(`https://data.sec.gov/api/xbrl/frames/${ns}/${tag}/${unit}/${frame}.json`);
  if (!r) return null;
  const j = r.json as { pts?: number; data?: Array<{ cik: number; val: number }> };
  const byCik = new Map<number, number>();
  for (const d of j.data ?? []) if (typeof d.cik === "number") byCik.set(d.cik, d.val);
  return { pts: j.pts ?? 0, byCik };
}
const dur = (y: number) => `CY${y}`;
const REVENUE_TAGS = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax"];
const sic4 = (s: string | null) => (s ? s.padStart(4, "0") : null);
const isFin = (s: string | null) => { const c = sic4(s); return !!c && c >= "6000" && c <= "6999"; };

// ── 로컬 벌크 아카이브에서 선택 추출 ─────────────────────────────────────────────────────────────
const BULK_DIR = "/tmp/866_bulk";
const SUB_DIR = "/tmp/866_sub";
const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;
function extractFromZip(zipPath: string, ciks: number[], destDir: string): { got: number; missing: number[] } {
  mkdirSync(destDir, { recursive: true });
  const already = new Set(readdirSync(destDir));
  const names = ciks.map(cikName);
  const need = names.filter((n) => !already.has(n));
  const BATCH = 300;
  for (let i = 0; i < need.length; i += BATCH) {
    const batch = need.slice(i, i + BATCH);
    try { execFileSync("unzip", ["-o", "-q", zipPath, ...batch, "-d", destDir], { stdio: ["ignore", "ignore", "pipe"] }); }
    catch { /* unzip exits 11 when some names don't match — files that DO match are still extracted */ }
    if (i % 3000 === 0) console.error(`  [extract ${destDir}] ${Math.min(i + BATCH, need.length)}/${need.length}`);
  }
  const after = new Set(readdirSync(destDir));
  const missing = ciks.filter((c) => !after.has(cikName(c)));
  return { got: ciks.length - missing.length, missing };
}

// ── 통계 유틸 ────────────────────────────────────────────────────────────────────────────────────
function median(xs: number[]): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1); const lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }
// ICC(1) 일원배치 랜덤효과(Shrout–Fleiss) — 업종 군집 정도. groups: key(업종) → 값 배열.
function icc1(groups: Map<string, number[]>): number | null {
  const gs = [...groups.values()].filter((g) => g.length >= 1);
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

type Bucket3 = "computed" | "undecidable" | "insufficient";
type Row = {
  cik: number; symbol: string;
  bucket: Bucket3; subTag: string; // computed→"years" · undecidable→verdict.kind · insufficient→skip_reason
  gapYears: number | null; explainedPct: number | null; residualSharePct: number | null;
  marketCapBucket: string;
};

async function main() {
  const out: Record<string, unknown> = { probedAt: new Date().toISOString() };
  const sb = createAdminClient();

  // ══════════════════════════════ 2단계 — 모집단 사다리 ══════════════════════════════
  console.error("[1] company_tickers_exchange.json 로드…");
  const tj = JSON.parse(readFileSync("data/sources/sec/company_tickers_exchange_20260802.json", "utf8")) as { fields: string[]; data: [number, string, string, string | null][] };
  const tickersExchangeTotal = tj.data.length;
  // CIK별 대표 티커 1개(결정론: 배열에서 처음 등장한 것) — production revdcf_results도 (as_of,cik) unique라
  // 사실상 CIK당 1행만 남는다(실측: 604 = unique_cik = unique_symbol, DB 확인). 복수클래스는 이 대표선정으로 손실될 수 있음 — §관찰 기록.
  const tickerByCik = new Map<number, string>();
  const allTickersByCik = new Map<number, string[]>();
  for (const [cik, , ticker] of tj.data) {
    if (!tickerByCik.has(cik)) tickerByCik.set(cik, ticker);
    const arr = allTickersByCik.get(cik) ?? []; arr.push(ticker); allTickersByCik.set(cik, arr);
  }
  const uniqueCikList = [...tickerByCik.keys()];
  const uniqueCik = uniqueCikList.length;
  const multiTickerCikCount = [...allTickersByCik.values()].filter((v) => v.length > 1).length;
  console.error(`  tickersExchangeTotal=${tickersExchangeTotal} uniqueCik=${uniqueCik} (복수티커 CIK ${multiTickerCikCount}개 — 대표 1개만 계산에 사용)`);

  // ── submissions.zip에서 SIC·연차보고서 폼 추출 ──
  console.error("[2] submissions.zip에서 SIC·annualForm 추출…");
  const subZip = `${BULK_DIR}/submissions.zip`;
  if (!existsSync(subZip)) throw new Error(`벌크 없음: ${subZip} — 1단계 다운로드 먼저`);
  const { got: subGot, missing: subMissing } = extractFromZip(subZip, uniqueCikList, SUB_DIR);
  console.error(`  submissions 추출 ${subGot}/${uniqueCikList.length} (누락 ${subMissing.length})`);

  type SubInfo = { cik: number; sic: string | null; sicDesc: string | null; annualForm: string | null; hasAnnualForm: boolean };
  const subInfo = new Map<number, SubInfo>();
  for (const cik of uniqueCikList) {
    const p = `${SUB_DIR}/${cikName(cik)}`;
    if (!existsSync(p)) { subInfo.set(cik, { cik, sic: null, sicDesc: null, annualForm: null, hasAnnualForm: false }); continue; }
    try {
      const j = JSON.parse(readFileSync(p, "utf8")) as { sicCode?: string; sic?: string; sicDescription?: string; filings?: { recent?: { form?: string[]; filingDate?: string[] } } };
      const fm = j.filings?.recent?.form ?? [], dt = j.filings?.recent?.filingDate ?? [];
      let annualForm: string | null = null, best = "";
      for (let i = 0; i < fm.length; i++) { const f = fm[i]; if (f === "10-K" || f === "20-F" || f === "40-F" || f === "10-KSB") if ((dt[i] ?? "") > best) { best = dt[i] ?? ""; annualForm = f; } }
      subInfo.set(cik, { cik, sic: (j.sicCode ?? j.sic ?? null) as string | null, sicDesc: j.sicDescription ?? null, annualForm, hasAnnualForm: annualForm != null });
    } catch { subInfo.set(cik, { cik, sic: null, sicDesc: null, annualForm: null, hasAnnualForm: false }); }
  }

  // ── 매출 태그 있는 CIK(2023·2024 합집합, probe_839와 동일) ──
  console.error("[3] 매출 프레임(2023·2024) 조회…");
  const revC = new Set<number>();
  for (const y of [2023, 2024]) for (const t of REVENUE_TAGS) { const f = await frames("us-gaap", t, "USD", dur(y)); if (f) for (const c of f.byCik.keys()) revC.add(c); }
  console.error(`  매출태그 보유 CIK(전체 filer 합집합) ${revC.size}`);

  // ── 사다리 계산 ──
  const hasAnnualFormList = uniqueCikList.filter((c) => subInfo.get(c)!.hasAnnualForm);
  const afterForeignCutList = hasAnnualFormList.filter((c) => { const f = subInfo.get(c)!.annualForm; return f !== "20-F" && f !== "40-F"; });
  const afterSicFinancialCutList = afterForeignCutList.filter((c) => !isFin(subInfo.get(c)!.sic));
  // 6798·6770은 이미 위 SIC 금융컷(6000~6999)의 부분집합 — 여기서 추가로 빠지는 건 없다(투명하게 기록).
  const reitCikSet = new Set(afterForeignCutList.filter((c) => sic4(subInfo.get(c)!.sic) === "6798"));
  const spacCikSet = new Set(afterForeignCutList.filter((c) => sic4(subInfo.get(c)!.sic) === "6770"));
  const afterReitSpacCutList = afterSicFinancialCutList; // 추가 제외 0건(이유는 위 주석)
  const afterRevenueCutList = afterReitSpacCutList.filter((c) => revC.has(c));
  const finalList = afterRevenueCutList;

  const ladder = {
    tickersExchangeTotal, uniqueCik,
    hasAnnualForm: hasAnnualFormList.length,
    afterForeignCut: afterForeignCutList.length,
    afterSicFinancialCut: afterSicFinancialCutList.length,
    afterReitSpacCut: afterReitSpacCutList.length,
    afterRevenueCut: afterRevenueCutList.length,
    final: finalList.length,
  };
  const droppedBy = {
    noAnnualForm: uniqueCik - hasAnnualFormList.length,
    foreign: hasAnnualFormList.length - afterForeignCutList.length,
    sicFinancial: afterForeignCutList.length - afterSicFinancialCutList.length, // 6798·6770 포함(하위 집합)
    reit: reitCikSet.size, // sicFinancial 낙폭의 부분집합으로 별도 표기(중복 카운트 아님 — 참고용)
    spac: spacCikSet.size,
    noRevenue: afterReitSpacCutList.length - afterRevenueCutList.length,
  };
  console.error(`  사다리: ${JSON.stringify(ladder)}`);

  // ── SEC 공식 통계(xlsx 직접 파싱은 python이 이미 검증 — 여기선 실측값을 그대로 하드코딩하지 않고 1단계 산출을 그대로 옮긴다) ──
  // 🔴 xlsx 파싱은 이 스크립트가 아니라 별도 확인(openpyxl)로 수행했고, 값은 파일에서 그대로 읽은 것이다(추측 아님).
  const secOfficial = {
    source: "data/sources/sec/sec_reporting_issuers_20260630.xlsx",
    sheet: "Data Visual 2 (Shell vs. Non-shell)",
    cy2025_usDomiciledExchangeListed: 3714,
    cy2025_usDomiciledExchangeListed_nonShell: 3692,
    ttm2025Q2_2026Q1_usDomiciled: 3600,
    ttm2025Q2_2026Q1_usDomiciled_nonShell: 3589,
  };
  const gapVsOfficial = `우리 final(${ladder.final}) − SEC 비셸 상한(${secOfficial.cy2025_usDomiciledExchangeListed_nonShell}) = ${ladder.final - secOfficial.cy2025_usDomiciledExchangeListed_nonShell}. SEC 수치엔 금융업이 포함되고 우리는 SIC 6000~6999를 뺐으므로 SEC 수치는 상한이지 목표치가 아니다 — 차이는 (a) 우리가 뺀 금융업 규모 (b) 매출태그 없음 컷 (c) 정의 시점차(CY2025 vs 현재)로 설명된다.`;

  const ladderOut = { probedAt: out.probedAt, ladder, droppedBy, secOfficial, gapVsOfficial };
  writeFileSync("docs/probe_866_ladder.json", JSON.stringify(ladderOut, null, 2));
  console.error("[2단계 완료] docs/probe_866_ladder.json 저장");

  // ══════════════════════════════ 3단계 — 컷 없이 전수 계산 ══════════════════════════════
  console.error(`[4] companyfacts 조달 방식 결정 — final=${finalList.length}개`);
  const cfZip = `${BULK_DIR}/companyfacts.zip`;
  let cfSource: string;
  if (existsSync(cfZip)) {
    const sz = statSync(cfZip).size;
    cfSource = `bulk (companyfacts.zip, ${sz} bytes 사전 확인·다운로드 완료)`;
    console.error(`  [4] 벌크 사용: ${cfSource}`);
    const { got, missing } = extractFromZip(cfZip, finalList, CF_DIR);
    console.error(`  companyfacts 추출 ${got}/${finalList.length} (누락 ${missing.length} — 벌크에 없음, 개별 폴백)`);
    if (missing.length) {
      await mapLimit(missing, 4, async (cik) => {
        const p = `${CF_DIR}/${cikName(cik)}`;
        if (existsSync(p)) return;
        const r = await secGet(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`);
        if (r) writeFileSync(p, JSON.stringify(r.json));
      });
    }
  } else {
    cfSource = "individual + local cache (/tmp/866_cf) — 벌크 미존재";
    console.error(`  [4] 벌크 없음 → 개별 호출+캐시`);
    mkdirSync(CF_DIR, { recursive: true });
    await mapLimit(finalList, 4, async (cik) => {
      const p = `${CF_DIR}/${cikName(cik)}`;
      if (existsSync(p)) return;
      const r = await secGet(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`);
      if (r) writeFileSync(p, JSON.stringify(r.json));
    });
  }

  // ── 참조 데이터(cron route와 동일 조립 — 값 코드 박기 금지, DB에서 읽기만) ──
  console.error("[5] Damodaran·시총 참조 데이터 로드…");
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
  console.error(`  damodaranAsOf=${damoAsOf} betaByInd=${betaByInd.size} indByT=${indByT.size} mcapBy=${mcapBy.size}`);

  const gnum = (v: RevDcfVerdict) => (v.kind === "years" ? v.gap : v.kind === "below_one" ? 0 : v.kind === "over_cap" ? 100 : null);
  const mcapBucketOf = (m: number) => (m >= 200e9 ? "mega(200B+)" : m >= 10e9 ? "large(10-200B)" : m >= 2e9 ? "mid(2-10B)" : m >= 300e6 ? "small(0.3-2B)" : "micro(<0.3B)");

  console.error(`[6] 컷 없이 전수 계산 — ${finalList.length}개 (companyfacts.zip → engine)`);
  const rows: Row[] = [];
  const skipCounts: Record<string, number> = {};
  let processedN = 0;
  for (const cik of finalList) {
    processedN++;
    if (processedN % 500 === 0) console.error(`  [계산] ${processedN}/${finalList.length}`);
    const symbol = tickerByCik.get(cik)!;
    const p = `${CF_DIR}/${cikName(cik)}`;
    const bump = (tag: string) => { skipCounts[tag] = (skipCounts[tag] ?? 0) + 1; };
    if (!existsSync(p)) { bump("HTTP_MISSING"); rows.push({ cik, symbol, bucket: "insufficient", subTag: "HTTP_MISSING", gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: "unknown" }); continue; }
    let j: { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { bump("EX_PARSE"); rows.push({ cik, symbol, bucket: "insufficient", subTag: "EX_PARSE", gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: "unknown" }); continue; }
    try {
      const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
      if (!dr.ok) { bump(dr.skipReason); rows.push({ cik, symbol, bucket: "insufficient", subTag: dr.skipReason, gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: "unknown" }); continue; }
      const ind = indByT.get(symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined; const mcap = mcapBy.get(symbol.toUpperCase());
      if (!ind || !beta) { bump("NO_INDUSTRY"); rows.push({ cik, symbol, bucket: "insufficient", subTag: "NO_INDUSTRY", gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: "unknown" }); continue; }
      if (!mcap || !(mcap > 0)) { bump("NO_MARKETCAP"); rows.push({ cik, symbol, bucket: "insufficient", subTag: "NO_MARKETCAP", gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: "unknown" }); continue; }
      const deRatio = dr.market.debt / mcap;
      const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
      const sharePrice = mcap / dr.market.shares;
      const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
      const drv = { ...dr.drivers, taxRate: usTax };
      const full = runRevDcf(drv, market, { maxYears: 25 }); // years 배열까지 필요(잔여가치 비중) — computeGapWithSensitivity는 verdict만 주므로 직접 호출
      const v = full.verdict;
      const mb = mcapBucketOf(mcap);
      if (v.kind === "years") {
        const yr = full.years[v.gap]; // year 인덱스 = gap년차
        const residualSharePct = yr ? yr.pvResidual / yr.corporateValue : null;
        rows.push({ cik, symbol, bucket: "computed", subTag: "years", gapYears: v.gap, explainedPct: null, residualSharePct, marketCapBucket: mb });
      } else if (v.kind === "over_cap") {
        rows.push({ cik, symbol, bucket: "undecidable", subTag: "over_cap", gapYears: null, explainedPct: v.explainedPct, residualSharePct: null, marketCapBucket: mb });
      } else if (v.kind === "below_one") {
        rows.push({ cik, symbol, bucket: "undecidable", subTag: "below_one", gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: mb });
      } else if (v.kind === "value_destroying") {
        rows.push({ cik, symbol, bucket: "undecidable", subTag: "value_destroying", gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: mb });
      } else {
        bump(`INVALID_${v.reason.slice(0, 30)}`);
        rows.push({ cik, symbol, bucket: "insufficient", subTag: `INVALID`, gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: mb });
      }
    } catch (e) { bump("EX"); rows.push({ cik, symbol, bucket: "insufficient", subTag: "EX", gapYears: null, explainedPct: null, residualSharePct: null, marketCapBucket: "unknown" }); }
  }

  const computed = rows.filter((r) => r.bucket === "computed");
  const undecidable = rows.filter((r) => r.bucket === "undecidable");
  const insufficient = rows.filter((r) => r.bucket === "insufficient");
  // 조달 실패(우리 탓) vs 회사 공시 부재 구분
  const ourFault = insufficient.filter((r) => r.subTag === "NO_MARKETCAP" || r.subTag === "NO_INDUSTRY").length;
  const companyFault = insufficient.filter((r) => r.subTag === "INSUFFICIENT_HISTORY" || r.subTag === "MISSING_TAG").length;

  console.error(`[6단계 완료] computed=${computed.length} undecidable=${undecidable.length} insufficient=${insufficient.length}`);

  // ══════════════════════════════ 4단계 — 604 대비 분포 변화 ══════════════════════════════
  console.error("[7] 604 기준선 재조회(DB)…");
  const asOf603 = "2026-08-03";
  const baseRows = (await (async () => {
    const acc: { cik: number; symbol: string; verdict: string; gap_years: number | null; explained_pct: number | null; skip_reason: string | null }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("revdcf_results").select("cik, symbol, verdict, gap_years, explained_pct, skip_reason").eq("as_of", asOf603).range(f, f + 999); const c = (data ?? []) as typeof acc; acc.push(...c); if (c.length < 1000) break; }
    return acc;
  })());
  const baseComputed = baseRows.filter((r) => r.verdict === "years");
  const baseUndecidable = baseRows.filter((r) => r.verdict === "over_cap" || r.verdict === "below_one" || r.verdict === "value_destroying");
  const baseSkipped = baseRows.filter((r) => r.verdict === "skipped");
  const baseSkipCounts: Record<string, number> = {};
  for (const r of baseSkipped) { const k = r.skip_reason ?? "UNKNOWN"; baseSkipCounts[k] = (baseSkipCounts[k] ?? 0) + 1; }
  console.error(`  604 재조회: n=${baseRows.length} computed=${baseComputed.length} undecidable=${baseUndecidable.length} skipped=${baseSkipped.length}`);
  // 🔴 Cowork 기준선 표기 그대로: "산출 515"는 (a)+(b)(=미스킵 전체), "years 177"이 (a) 단독이다 — 여기서 대조하는 값은
  // (a) 단독(baseComputed = verdict==='years')이므로 517이 아니라 177과 비교해야 한다(STEP §4 "산출률=(a)÷N" 정의와 일치).
  const cowork604 = { n: 604, notSkipped: 515, skipped: 89, years: 177, value_destroying: 149, over_cap: 102, below_one: 87, skip: { INSUFFICIENT_HISTORY: 39, MISSING_TAG: 31, NO_INDUSTRY: 10, MULTI_CLASS_SHARES: 5, NOT_APPLICABLE_SECTOR: 4, NO_MARKETCAP: 0, HTTP_: 0, EX: 0 } };
  const skipBreakdownMatches = Object.entries(cowork604.skip).every(([k, v]) => (baseSkipCounts[k] ?? 0) === v);
  const matchesCowork = baseRows.length === cowork604.n && baseComputed.length === cowork604.years && baseUndecidable.length === cowork604.notSkipped - cowork604.years && baseSkipped.length === cowork604.skipped && skipBreakdownMatches;

  // ── 업종 클러스터 ICC(1) — computed(GAP years)를 업종별로 묶는다 ──
  function iccFor(rowsIn: { symbol: string; gap: number }[]): { icc: number | null; groups: number; n: number } {
    const groups = new Map<string, number[]>();
    for (const r of rowsIn) { const ind = indByT.get(r.symbol.toUpperCase()); if (!ind) continue; const arr = groups.get(ind) ?? []; arr.push(r.gap); groups.set(ind, arr); }
    return { icc: icc1(groups), groups: groups.size, n: rowsIn.reduce((a, g) => a + 1, 0) };
  }
  const iccNew = iccFor(computed.map((r) => ({ symbol: r.symbol, gap: r.gapYears! })));
  const iccBase = iccFor(baseComputed.map((r) => ({ symbol: r.symbol, gap: r.gap_years! })));

  const gapNew = computed.map((r) => r.gapYears!);
  const gapBase = baseComputed.map((r) => r.gap_years!);
  const overCapNew = undecidable.filter((r) => r.subTag === "over_cap");
  const valueDestroyingNew = undecidable.filter((r) => r.subTag === "value_destroying");
  const residualNew = computed.map((r) => r.residualSharePct).filter((x): x is number => x != null);

  // ── 시총 구간별 분해 ──
  const byBucket = new Map<string, { n: number; computed: number }>();
  for (const r of rows) { if (r.marketCapBucket === "unknown") continue; const b = byBucket.get(r.marketCapBucket) ?? { n: 0, computed: 0 }; b.n++; if (r.bucket === "computed") b.computed++; byBucket.set(r.marketCapBucket, b); }
  const bucketBreakdown = Object.fromEntries([...byBucket.entries()].map(([k, v]) => [k, { n: v.n, computed: v.computed, yieldPct: v.n ? +(100 * v.computed / v.n).toFixed(1) : null }]));

  const comparison = {
    populationN: { the604: baseRows.length, fullUniverse: rows.length },
    yieldPct: { the604: +(100 * baseComputed.length / baseRows.length).toFixed(1), fullUniverse: +(100 * computed.length / rows.length).toFixed(1) },
    gapMedianYears: { the604: median(gapBase), fullUniverse: median(gapNew) },
    gapP25P75: { the604: [percentile(gapBase, 25), percentile(gapBase, 75)], fullUniverse: [percentile(gapNew, 25), percentile(gapNew, 75)] },
    overCapPct: { the604: +(100 * baseRows.filter((r) => r.verdict === "over_cap").length / baseRows.length).toFixed(1), fullUniverse: +(100 * overCapNew.length / rows.length).toFixed(1) },
    valueDestroyingPct: { the604: +(100 * baseRows.filter((r) => r.verdict === "value_destroying").length / baseRows.length).toFixed(1), fullUniverse: +(100 * valueDestroyingNew.length / rows.length).toFixed(1) },
    residualValueShareMedianPct: { the604: null as number | null, fullUniverse: residualNew.length ? +(100 * median(residualNew)!).toFixed(1) : null }, // 604는 저장 스키마에 pvResidual/corporateValue 없어 재계산 불가 — 정직 null
    industryIcc: { the604Recorded: 0.195, the604Recomputed: iccBase.icc != null ? +iccBase.icc.toFixed(3) : null, fullUniverse: iccNew.icc != null ? +iccNew.icc.toFixed(3) : null },
  };

  const output = {
    probedAt: out.probedAt,
    ladderRef: "docs/probe_866_ladder.json",
    companyfactsSource: cfSource,
    fullUniverse: {
      N: rows.length,
      computed: computed.length, undecidable: undecidable.length, insufficient: insufficient.length,
      undecidableBreakdown: { over_cap: overCapNew.length, value_destroying: valueDestroyingNew.length, below_one: undecidable.filter((r) => r.subTag === "below_one").length },
      insufficientBreakdown: skipCounts,
      insufficientCause: { ourFault_NO_MARKETCAP_NO_INDUSTRY: ourFault, companyDisclosure_INSUFFICIENT_HISTORY_MISSING_TAG: companyFault, other: insufficient.length - ourFault - companyFault },
    },
    the604Reverified: {
      asOf: asOf603, n: baseRows.length, computed: baseComputed.length, skipped: baseSkipped.length,
      matchesCoworkGivenBaseline: matchesCowork,
      skipBreakdown: baseSkipCounts,
    },
    comparison,
    marketCapBucketBreakdown: bucketBreakdown,
    note: "재료만 — 컷 제안·채택 권고 없음(STEP 866 §금지 5).",
  };
  writeFileSync("docs/probe_866_output.json", JSON.stringify(output, null, 2));
  console.error("[4단계 완료] docs/probe_866_output.json 저장");

  // ══════════════════════════════ 보고용 요약(콘솔) ══════════════════════════════
  console.error("\n=== 요약 ===");
  console.error(`모집단 사다리: total=${ladder.tickersExchangeTotal} uniqueCik=${ladder.uniqueCik} hasAnnualForm=${ladder.hasAnnualForm} afterForeignCut=${ladder.afterForeignCut} afterSicFinancialCut=${ladder.afterSicFinancialCut} afterReitSpacCut=${ladder.afterReitSpacCut} afterRevenueCut=${ladder.afterRevenueCut} final=${ladder.final}`);
  console.error(`전수 계산: N=${rows.length} → 산출 ${computed.length} / 판정불가 ${undecidable.length} / 입력부족 ${insufficient.length}`);
  console.error(`604 대비: 산출률 ${comparison.yieldPct.the604}% → ${comparison.yieldPct.fullUniverse}% · GAP 중앙 ${comparison.gapMedianYears.the604}년 → ${comparison.gapMedianYears.fullUniverse}년`);
  console.error(`입력부족 내역: 우리 조달 실패 ${ourFault} / 회사 공시 부재 ${companyFault}`);
  console.error(`companyfacts 조달 경로: ${cfSource}`);
  console.error(`604 재조회 = Cowork 기준선과 일치? ${matchesCowork} (n=${baseRows.length} computed=${baseComputed.length} skipped=${baseSkipped.length})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
