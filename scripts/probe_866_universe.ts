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
import * as cheerio from "cheerio";
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
// 866B: "companyfacts 재다운로드 금지 — 캐시 경로가 남아 있는지 먼저 확인 · 없을 때만 벌크를 다시 받는다"를
// submissions 캐시에도 동일 적용. 866이 zip을 다 쓰고 지웠으므로(디스크 위생) zip 존재를 전제하면 안 된다.
function missingFromCache(destDir: string, ciks: number[]): number[] {
  if (!existsSync(destDir)) return ciks;
  const have = new Set(readdirSync(destDir));
  return ciks.filter((c) => !have.has(cikName(c)));
}

// ── 통계 유틸 ────────────────────────────────────────────────────────────────────────────────────
function median(xs: number[]): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function percentile(xs: number[], p: number): number | null { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const idx = (p / 100) * (s.length - 1); const lo = Math.floor(idx), hi = Math.ceil(idx); if (lo === hi) return s[lo]; return s[lo] + (s[hi] - s[lo]) * (idx - lo); }
// ICC(1) 일원배치 랜덤효과(Shrout–Fleiss) — 업종 군집 정도. groups: key(업종) → 값 배열.
// 🔴 866B §3-C: minGroupSize 파라미터 추가 — probe_860_validate.ts는 5사 미만 업종을 제외한다(기록값 0.195의 정의 일부).
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

type Bucket3 = "computed" | "undecidable" | "insufficient";
type Row = {
  cik: number; symbol: string;
  bucket: Bucket3; subTag: string; // computed→"years" · undecidable→verdict.kind · insufficient→skip_reason
  gapYears: number | null; explainedPct: number | null; residualSharePct: number | null;
  marketCapBucket: string; // "mega(200B+)" 등 · 시총 조회 실패="no-mcap"
  marketCap: number | null;
  exchangeSec: string | null; exchangeDamodaran: string | null;
  sic: string | null; annualForm: string | null;
};
// 966B §3-A: 거래소 분류 — SEC exchange 필드 / Damodaran exchange 필드 각각 "상장(exchangeListed)"·"OTC"·"null" 3분류로 정규화.
function otcClassSec(ex: string | null): "exchangeListed" | "OTC" | "null" { if (ex == null) return "null"; return ex === "OTC" ? "OTC" : "exchangeListed"; } // Nasdaq/NYSE/CBOE=상장
function otcClassDamodaran(ex: string | null): "exchangeListed" | "OTC" | "null" { if (ex == null) return "null"; return ex === "OTCPK" ? "OTC" : "exchangeListed"; } // NYSE/NasdaqXX/NYSEAM/BATS=상장

async function main() {
  const out: Record<string, unknown> = { probedAt: new Date().toISOString() };
  const sb = createAdminClient();

  // ══════════════════════════════ 866B 2단계 — NC 원본 재저장 결과 검증 ══════════════════════════════
  // (curl로 이미 재다운로드 + 이전본 보존은 셸에서 먼저 수행 — 여기선 저장된 파일을 검증만 한다)
  console.error("[0] NC 원본 재저장 검증…");
  const ncHtml = readFileSync("data/sources/text/newconstructs_coverage_methodology.html", "utf8");
  const nc$ = cheerio.load(ncHtml);
  nc$("script, style, noscript").remove(); // cheerio .text()는 script/style 원문(JS/CSS)까지 텍스트로 잡는다 — 가시 본문만 비교(8,163 산정 방식과 정합, 실측 확인)
  const ncBodyText = nc$("body").text().replace(/\s+/g, " ").trim();
  const ncBodyLen = ncBodyText.length;
  const nc2748Count = (ncBodyText.match(/2,748/g) ?? []).length;
  const ncOtcCount = (ncBodyText.match(/\bOTC\b/g) ?? []).length;
  const ncComplexCount = (ncBodyText.match(/\bcomplex\b/gi) ?? []).length;
  const ncShareStructureCount = (ncBodyText.match(/share structure/gi) ?? []).length;
  console.error(`  본문 길이=${ncBodyLen}(기존 8,163) · 2,748=${nc2748Count}건 · OTC=${ncOtcCount}건 · complex=${ncComplexCount}건 · share structure=${ncShareStructureCount}건`);

  // ══════════════════════════════ 2단계 — 모집단 사다리 ══════════════════════════════
  console.error("[1] company_tickers_exchange.json 로드…");
  const tj = JSON.parse(readFileSync("data/sources/sec/company_tickers_exchange_20260802.json", "utf8")) as { fields: string[]; data: [number, string, string, string | null][] };
  const tickersExchangeTotal = tj.data.length;
  // CIK별 대표 티커 1개(결정론: 배열에서 처음 등장한 것) — production revdcf_results도 (as_of,cik) unique라
  // 사실상 CIK당 1행만 남는다(실측: 604 = unique_cik = unique_symbol, DB 확인). 복수클래스는 이 대표선정으로 손실될 수 있음 — §관찰 기록.
  const tickerByCik = new Map<number, string>();
  const allTickersByCik = new Map<number, string[]>();
  const exchangeSecByCik = new Map<number, string | null>(); // 866B §3-A: 대표 티커 행의 SEC exchange 필드
  for (const [cik, , ticker, exchange] of tj.data) {
    if (!tickerByCik.has(cik)) { tickerByCik.set(cik, ticker); exchangeSecByCik.set(cik, exchange ?? null); }
    const arr = allTickersByCik.get(cik) ?? []; arr.push(ticker); allTickersByCik.set(cik, arr);
  }
  const uniqueCikList = [...tickerByCik.keys()];
  const uniqueCik = uniqueCikList.length;
  const multiTickerCikCount = [...allTickersByCik.values()].filter((v) => v.length > 1).length;
  console.error(`  tickersExchangeTotal=${tickersExchangeTotal} uniqueCik=${uniqueCik} (복수티커 CIK ${multiTickerCikCount}개 — 대표 1개만 계산에 사용)`);

  // ── submissions 캐시 확인 → 부족분만 벌크(재다운로드 없이 우선 캐시, 866B 원칙) ──
  console.error("[2] submissions 캐시 확인…");
  const subMissingBefore = missingFromCache(SUB_DIR, uniqueCikList);
  console.error(`  캐시 보유 ${uniqueCikList.length - subMissingBefore.length}/${uniqueCikList.length} · 부족 ${subMissingBefore.length}`);
  let subMissing = subMissingBefore;
  if (subMissingBefore.length > 0) {
    const subZip = `${BULK_DIR}/submissions.zip`;
    if (!existsSync(subZip)) throw new Error(`캐시 부족(${subMissingBefore.length}개)인데 벌크도 없음: ${subZip} — 재다운로드 필요`);
    const r = extractFromZip(subZip, subMissingBefore, SUB_DIR);
    subMissing = r.missing;
    console.error(`  submissions 벌크 추가 추출 ${r.got}/${subMissingBefore.length} (여전히 누락 ${subMissing.length})`);
  }

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

  const droppedByNote = "🔴 배타적이지 않다. reit(200)·spac(231)은 sicFinancial(1344)의 부분집합이라 사다리에서 추가 제외 0. 합산 금지. 배타 합산은 noAnnualForm+foreign+sicFinancial+noRevenue만.";
  const ladderOut = { probedAt: out.probedAt, ladder, droppedBy, droppedByNote, secOfficial, gapVsOfficial };
  writeFileSync("docs/probe_866_ladder.json", JSON.stringify(ladderOut, null, 2));
  console.error("[2단계 완료] docs/probe_866_ladder.json 저장");

  // ══════════════════════════════ 3단계 — 컷 없이 전수 계산 ══════════════════════════════
  // 🔴 866B: "companyfacts 재다운로드 금지 — 캐시 경로가 남아 있는지 먼저 확인해 출력하고, 없을 때만 벌크를 다시 받는다."
  console.error(`[4] companyfacts 캐시 확인 — final=${finalList.length}개`);
  const cfMissingBefore = missingFromCache(CF_DIR, finalList);
  console.error(`  캐시 보유 ${finalList.length - cfMissingBefore.length}/${finalList.length} · 부족 ${cfMissingBefore.length}`);
  const cfZip = `${BULK_DIR}/companyfacts.zip`;
  let cfSource: string;
  if (cfMissingBefore.length === 0) {
    cfSource = `cache-only (/tmp/866_cf, 866 실행분 재사용 — 재다운로드 없음)`;
    console.error(`  [4] 전량 캐시 히트: ${cfSource}`);
  } else if (existsSync(cfZip)) {
    const sz = statSync(cfZip).size;
    cfSource = `bulk (companyfacts.zip, ${sz} bytes 사전 확인·다운로드 완료)`;
    console.error(`  [4] 벌크 사용(부족분 ${cfMissingBefore.length}개만): ${cfSource}`);
    const { got, missing } = extractFromZip(cfZip, cfMissingBefore, CF_DIR);
    console.error(`  companyfacts 추가 추출 ${got}/${cfMissingBefore.length} (누락 ${missing.length} — 벌크에 없음, 개별 폴백)`);
    if (missing.length) {
      await mapLimit(missing, 4, async (cik) => {
        const p = `${CF_DIR}/${cikName(cik)}`;
        if (existsSync(p)) return;
        const r = await secGet(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`);
        if (r) writeFileSync(p, JSON.stringify(r.json));
      });
    }
  } else {
    cfSource = "individual + local cache (/tmp/866_cf) — 벌크 미존재, 부족분만 개별 호출";
    console.error(`  [4] 벌크 없음 → 부족분 ${cfMissingBefore.length}개만 개별 호출+캐시`);
    mkdirSync(CF_DIR, { recursive: true });
    await mapLimit(cfMissingBefore, 4, async (cik) => {
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
  const indRows: { ticker_norm: string; industry_group: string; exchange: string | null }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("damodaran_industry").select("ticker_norm, industry_group, exchange").eq("is_us_listed", true).range(f, f + 999); const c = (data ?? []) as typeof indRows; indRows.push(...c); if (c.length < 1000) break; }
  const indByT = new Map(indRows.map((r) => [r.ticker_norm, r.industry_group]));
  const exchangeDamodaranByT = new Map(indRows.map((r) => [r.ticker_norm, r.exchange])); // 866B §3-A
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
    const info = subInfo.get(cik)!;
    const p = `${CF_DIR}/${cikName(cik)}`;
    const bump = (tag: string) => { skipCounts[tag] = (skipCounts[tag] ?? 0) + 1; };
    // 🔴 866B §3-B: mcap은 companyfacts와 무관(us_market_cap을 symbol로 읽는 값) — computeDrivers 성패와 무관하게
    // 루프 맨 앞에서 먼저 조회해 모든 행(산출/판정불가/입력부족 전부)에 버킷을 붙인다. 못 구하면 "no-mcap" 버킷.
    const mcap = mcapBy.get(symbol.toUpperCase()) ?? null;
    const mb = mcap != null && mcap > 0 ? mcapBucketOf(mcap) : "no-mcap";
    const exchangeSec = exchangeSecByCik.get(cik) ?? null;
    const exchangeDamodaran = exchangeDamodaranByT.get(symbol.toUpperCase()) ?? null;
    const base = { cik, symbol, marketCapBucket: mb, marketCap: mcap, exchangeSec, exchangeDamodaran, sic: info.sic, annualForm: info.annualForm };
    const pushRow = (bucket: Bucket3, subTag: string, extra: Partial<Row> = {}) => rows.push({ ...base, bucket, subTag, gapYears: null, explainedPct: null, residualSharePct: null, ...extra });
    if (!existsSync(p)) { bump("HTTP_MISSING"); pushRow("insufficient", "HTTP_MISSING"); continue; }
    let j: { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { bump("EX_PARSE"); pushRow("insufficient", "EX_PARSE"); continue; }
    try {
      const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
      if (!dr.ok) { bump(dr.skipReason); pushRow("insufficient", dr.skipReason); continue; }
      const ind = indByT.get(symbol.toUpperCase()); const beta = ind ? betaByInd.get(ind) : undefined;
      if (!ind || !beta) { bump("NO_INDUSTRY"); pushRow("insufficient", "NO_INDUSTRY"); continue; }
      if (mcap == null || !(mcap > 0)) { bump("NO_MARKETCAP"); pushRow("insufficient", "NO_MARKETCAP"); continue; }
      const deRatio = dr.market.debt / mcap;
      const w = assembleWacc({ riskFree: rf, erp, unleveredBetaCashAdj: +beta.unlevered_beta_cash_adj, taxRate: usTax, deRatio, creditSpread: creditSpreadFor(+beta.std_dev_equity, spreads) ?? 0 });
      const sharePrice = mcap / dr.market.shares;
      const market: RevDcfMarket = { wacc: w.wacc, inflation, sharePrice, sharesOutstanding: dr.market.shares, debt: dr.market.debt, nonOperatingAssets: dr.market.nonOperatingAssets };
      const drv = { ...dr.drivers, taxRate: usTax };
      const full = runRevDcf(drv, market, { maxYears: 25 }); // years 배열까지 필요(잔여가치 비중) — computeGapWithSensitivity는 verdict만 주므로 직접 호출
      const v = full.verdict;
      if (v.kind === "years") {
        const yr = full.years[v.gap]; // year 인덱스 = gap년차
        const residualSharePct = yr ? yr.pvResidual / yr.corporateValue : null;
        pushRow("computed", "years", { gapYears: v.gap, residualSharePct });
      } else if (v.kind === "over_cap") {
        pushRow("undecidable", "over_cap", { explainedPct: v.explainedPct });
      } else if (v.kind === "below_one") {
        pushRow("undecidable", "below_one");
      } else if (v.kind === "value_destroying") {
        pushRow("undecidable", "value_destroying");
      } else {
        bump(`INVALID_${v.reason.slice(0, 30)}`);
        pushRow("insufficient", "INVALID");
      }
    } catch (e) { bump("EX"); pushRow("insufficient", "EX"); }
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
    const acc: { cik: number; symbol: string; verdict: string; gap_years: number | null; explained_pct: number | null; skip_reason: string | null; flags: Record<string, unknown> | null }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("revdcf_results").select("cik, symbol, verdict, gap_years, explained_pct, skip_reason, flags").eq("as_of", asOf603).range(f, f + 999); const c = (data ?? []) as typeof acc; acc.push(...c); if (c.length < 1000) break; }
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

  // ── 업종 클러스터 ICC(1) — 866B §3-C: 기록값 0.195(probe_860)의 정의 = minGroupSize 5 + 업종출처 flags.industry(저장값).
  // 866의 0.267/0.176은 minGroupSize 없음(1) + 업종출처 indByT(현재 damodaran 조인) — "불일치"가 아니라 "정의 차이".
  function iccFor(rowsIn: { gap: number; industry: string | null }[], minGroupSize: number): { icc: number | null; groups: number; n: number } {
    const groups = new Map<string, number[]>();
    for (const r of rowsIn) { if (!r.industry) continue; const arr = groups.get(r.industry) ?? []; arr.push(r.gap); groups.set(r.industry, arr); }
    const used = [...groups.values()].filter((g) => g.length >= minGroupSize).reduce((a, g) => a + g.length, 0);
    return { icc: icc1(groups, minGroupSize), groups: [...groups.values()].filter((g) => g.length >= minGroupSize).length, n: used };
  }
  const the604IndFromFlags = (r: (typeof baseComputed)[number]) => (r.flags?.industry as string | undefined) ?? null;
  const the604IndFromLiveJoin = (r: (typeof baseComputed)[number]) => indByT.get(r.symbol.toUpperCase()) ?? null;
  const iccBase_def860 = iccFor(baseComputed.map((r) => ({ gap: r.gap_years!, industry: the604IndFromFlags(r) })), 5);
  const iccBase_noMinGroup = iccFor(baseComputed.map((r) => ({ gap: r.gap_years!, industry: the604IndFromLiveJoin(r) })), 1);
  const iccFull_def860 = iccFor(computed.map((r) => ({ gap: r.gapYears!, industry: indByT.get(r.symbol.toUpperCase()) ?? null })), 5);
  const iccFull_noMinGroup = iccFor(computed.map((r) => ({ gap: r.gapYears!, industry: indByT.get(r.symbol.toUpperCase()) ?? null })), 1);
  const iccBase = iccBase_noMinGroup; // 기존 comparison.industryIcc.the604Recomputed 필드 하위호환용
  const iccNew = iccFull_noMinGroup;

  // ══════════════════════════════ 866B §3-A — 사다리×거래소 + 3분류×거래소 교차표 ══════════════════════════════
  // 🔴 판단 없음 — OTC를 뺄지 말지는 재료만 만든다(금지사항 5). SEC exchange(전 CIK 커버) 기준을 1차 분류로, Damodaran
  // exchange(is_us_listed 조인 커버)는 2차 대조 + 두 출처 불일치 카운트로만 쓴다.
  type ExClass = "exchangeListed" | "OTC" | "null";
  function exClassCounts(ciks: number[]): Record<ExClass, number> {
    const c: Record<ExClass, number> = { exchangeListed: 0, OTC: 0, null: 0 };
    for (const cik of ciks) c[otcClassSec(exchangeSecByCik.get(cik) ?? null)]++;
    return c;
  }
  const ladderExchange = {
    uniqueCik: exClassCounts(uniqueCikList),
    hasAnnualForm: exClassCounts(hasAnnualFormList),
    afterForeignCut: exClassCounts(afterForeignCutList),
    afterSicFinancialCut: exClassCounts(afterSicFinancialCutList),
    afterRevenueCut_final: exClassCounts(afterRevenueCutList),
  };
  const bucket3Exchange: Record<Bucket3, Record<ExClass, number>> = { computed: { exchangeListed: 0, OTC: 0, null: 0 }, undecidable: { exchangeListed: 0, OTC: 0, null: 0 }, insufficient: { exchangeListed: 0, OTC: 0, null: 0 } };
  for (const r of rows) bucket3Exchange[r.bucket][otcClassSec(r.exchangeSec)]++;
  // 두 출처 불일치(둘 다 값이 있는데 OTC 여부가 갈리는 CIK) — final 3,354 대상(두 출처 다 조회 가능한 유일한 집합).
  let exchangeMismatchCount = 0, exchangeBothPresentCount = 0;
  for (const r of rows) {
    if (r.exchangeSec == null || r.exchangeDamodaran == null) continue;
    exchangeBothPresentCount++;
    const a = otcClassSec(r.exchangeSec) === "OTC", b = otcClassDamodaran(r.exchangeDamodaran) === "OTC";
    if (a !== b) exchangeMismatchCount++;
  }

  const gapNew = computed.map((r) => r.gapYears!);
  const gapBase = baseComputed.map((r) => r.gap_years!);
  const overCapNew = undecidable.filter((r) => r.subTag === "over_cap");
  const valueDestroyingNew = undecidable.filter((r) => r.subTag === "value_destroying");
  const residualNew = computed.map((r) => r.residualSharePct).filter((x): x is number => x != null);

  // ── 시총 구간별 분해 ──
  // 🔴 866B §3-B: "unknown" 스킵 없이 전 행(no-mcap 포함) 집계 — yieldPctOfN(=(a)÷n, 전체 10.9%와 동일 분모)과
  // yieldPctOfCalculable(=(a)÷((a)+(b)), 866의 기존 값과 동일 분모) 둘 다 병기해 분모 불일치를 드러낸다.
  const byBucket = new Map<string, { n: number; computed: number; undecidable: number; insufficient: number }>();
  for (const r of rows) { const b = byBucket.get(r.marketCapBucket) ?? { n: 0, computed: 0, undecidable: 0, insufficient: 0 }; b.n++; if (r.bucket === "computed") b.computed++; else if (r.bucket === "undecidable") b.undecidable++; else b.insufficient++; byBucket.set(r.marketCapBucket, b); }
  const bucketBreakdown = Object.fromEntries([...byBucket.entries()].map(([k, v]) => [k, {
    n: v.n, computed: v.computed, undecidable: v.undecidable, insufficient: v.insufficient,
    yieldPctOfN: v.n ? +(100 * v.computed / v.n).toFixed(1) : null,
    yieldPctOfCalculable: (v.computed + v.undecidable) ? +(100 * v.computed / (v.computed + v.undecidable)).toFixed(1) : null,
  }]));
  const the604YieldTwoBasis = { ofN: +(100 * baseComputed.length / baseRows.length).toFixed(1), ofCalculable: +(100 * baseComputed.length / (baseComputed.length + baseUndecidable.length)).toFixed(1) };
  // (866의 insufficientBreakdown/insufficientCause/undecidableBreakdown은 아래 output866b에서 그대로 재사용)
  const undecidableBreakdown = { over_cap: overCapNew.length, value_destroying: valueDestroyingNew.length, below_one: undecidable.filter((r) => r.subTag === "below_one").length };
  const insufficientCause = { ourFault_NO_MARKETCAP_NO_INDUSTRY: ourFault, companyDisclosure_INSUFFICIENT_HISTORY_MISSING_TAG: companyFault, other: insufficient.length - ourFault - companyFault };

  // 🔴 866B §4: probe_866_output.json은 덮어쓰지 않는다 — supersededBy 키만 추가(read-patch-write).
  const prior866 = JSON.parse(readFileSync("docs/probe_866_output.json", "utf8")) as Record<string, unknown>;
  prior866.supersededBy = "docs/probe_866b_output.json";
  writeFileSync("docs/probe_866_output.json", JSON.stringify(prior866, null, 2));
  console.error("[866 산출물] docs/probe_866_output.json에 supersededBy만 추가(덮어쓰기 아님)");

  // ══════════════════════════════ 866B 산출물 ══════════════════════════════
  const output866b = {
    probedAt: out.probedAt,
    supersedes: "docs/probe_866_output.json",
    corrections: [
      "REVDCF_SPEC.md: '거래소 상장'은 우리 규칙에 없는 조건이었다(근거 없이 삽입) — 철회",
      "EXTERNAL_UNIVERSE_QUOTES.md: NC 'OTC'·'주식구조 복잡' 제외 사유는 원본에 없다 — 철회(재저장으로 재확인)",
      "probe_866_ladder.json: reit/spac는 sicFinancial의 부분집합(추가 제외 0) — droppedByNote 추가",
      "marketCapBucket: 입력부족 행도 시총 조회는 companyfacts와 무관 — 분모 통일(no-mcap 별도 집계)",
      "industryIcc: 0.195 vs 0.267/0.176은 불일치가 아니라 정의 차이(minGroupSize 5 + 업종출처 flags.industry)",
    ],
    ncRecheck: {
      file: "data/sources/text/newconstructs_coverage_methodology.html",
      previousCopy: "data/sources/text/_prev_newconstructs_coverage_methodology_20260731.html",
      bodyTextLength: ncBodyLen, priorBodyTextLength: 8163,
      counts: { "2,748": nc2748Count, OTC: ncOtcCount, complex: ncComplexCount, "share structure": ncShareStructureCount },
      conclusion: ncOtcCount === 0 ? "OTC 0건 재확인 — (2) 철회 확정" : "OTC 재발견 — 철회 번복 필요(원문 인용 재검토)",
    },
    ladderExchange, // 사다리 각 단 × exchangeListed/OTC/null (SEC exchange 기준)
    bucket3Exchange, // computed/undecidable/insufficient × exchangeListed/OTC/null (SEC exchange 기준, final 3,354 대상)
    exchangeSourceMismatch: { bothPresentN: exchangeBothPresentCount, mismatchN: exchangeMismatchCount, note: "SEC exchange와 Damodaran exchange가 둘 다 있는데 OTC 여부가 갈리는 CIK 수 — 어느 쪽이 맞는지는 판단하지 않는다." },
    marketCapBucketBreakdown: bucketBreakdown, // 866B §3-B: yieldPctOfN·yieldPctOfCalculable 병기 + no-mcap 버킷
    the604YieldTwoBasis, // 177÷604=29.3% · 177÷515=34.4%
    industryIcc: {
      definition860: "minGroupSize=5, industry=flags.industry (기록값 0.195의 정의)",
      the604_def860: iccBase_def860.icc != null ? +iccBase_def860.icc.toFixed(3) : null,
      the604_def860_groups: iccBase_def860.groups, the604_def860_n: iccBase_def860.n,
      the604_noMinGroup: iccBase_noMinGroup.icc != null ? +iccBase_noMinGroup.icc.toFixed(3) : null,
      fullUniverse_def860: iccFull_def860.icc != null ? +iccFull_def860.icc.toFixed(3) : null,
      fullUniverse_def860_groups: iccFull_def860.groups, fullUniverse_def860_n: iccFull_def860.n,
      fullUniverse_noMinGroup: iccFull_noMinGroup.icc != null ? +iccFull_noMinGroup.icc.toFixed(3) : null,
      recordedBaseline: 0.195,
      note: "🔴 0.195 vs 0.267은 불일치가 아니라 정의 차이(최소 업종 크기 5 필터 + 업종 출처). 866의 '불일치' 표기를 정정.",
    },
    fullUniverseSummary: {
      N: rows.length, computed: computed.length, undecidable: undecidable.length, insufficient: insufficient.length,
      undecidableBreakdown, insufficientBreakdown: skipCounts, insufficientCause,
      gapMedianYears: median(gapNew), gapP25P75: [percentile(gapNew, 25), percentile(gapNew, 75)],
    },
    the604Summary: {
      n: baseRows.length, computed: baseComputed.length, undecidable: baseUndecidable.length, skipped: baseSkipped.length,
      matchesCoworkGivenBaseline: matchesCowork,
      gapMedianYears: median(gapBase), gapP25P75: [percentile(gapBase, 25), percentile(gapBase, 75)],
    },
    note: "재료만 — 컷·거래소 기준에 대한 제안·채택 권고 없음(STEP 866B §금지 5). OTC 포함 여부는 미결정(장은태 판정 대기).",
  };
  writeFileSync("docs/probe_866b_output.json", JSON.stringify(output866b, null, 2));
  console.error("[866B 완료] docs/probe_866b_output.json 저장");

  // ── (D) CIK별 행 저장 — 8,017개 전부(final 밖은 계산 필드 null) ──
  const hasAnnualFormSet = new Set(hasAnnualFormList), afterForeignCutSet = new Set(afterForeignCutList);
  const afterSicFinancialCutSet = new Set(afterSicFinancialCutList), finalSet = new Set(finalList);
  function ladderStageOf(cik: number): string {
    if (!hasAnnualFormSet.has(cik)) return "uniqueCik";
    if (!afterForeignCutSet.has(cik)) return "hasAnnualForm";
    if (!afterSicFinancialCutSet.has(cik)) return "afterForeignCut";
    if (!finalSet.has(cik)) return "afterSicFinancialCut";
    return "final";
  }
  const rowsByCik = new Map(rows.map((r) => [r.cik, r]));
  const rows866b = uniqueCikList.map((cik) => {
    const computedRow = rowsByCik.get(cik);
    const info = subInfo.get(cik)!;
    return {
      cik, symbol: tickerByCik.get(cik)!,
      exchangeSec: exchangeSecByCik.get(cik) ?? null, exchangeDamodaran: exchangeDamodaranByT.get(tickerByCik.get(cik)!.toUpperCase()) ?? null,
      sic: info.sic, annualForm: info.annualForm, ladderStage: ladderStageOf(cik),
      bucket: computedRow?.bucket ?? null, subTag: computedRow?.subTag ?? null, gapYears: computedRow?.gapYears ?? null,
      marketCapBucket: computedRow?.marketCapBucket ?? null, marketCap: computedRow?.marketCap ?? null,
    };
  });
  writeFileSync("docs/probe_866b_rows.json", JSON.stringify(rows866b));
  console.error(`[866B 완료] docs/probe_866b_rows.json 저장 (${rows866b.length}행)`);

  // ══════════════════════════════ 보고용 요약(콘솔) ══════════════════════════════
  console.error("\n=== 요약 ===");
  console.error(`NC 원본 재저장: 본문 ${ncBodyLen}자(기존 8,163) · OTC ${ncOtcCount}건 · 2,748 ${nc2748Count}건 → ${output866b.ncRecheck.conclusion}`);
  console.error(`사다리 × 거래소: ${JSON.stringify(ladderExchange)}`);
  console.error(`3분류 × 거래소: ${JSON.stringify(bucket3Exchange)}`);
  console.error(`두 출처 거래소 불일치 CIK: ${exchangeMismatchCount}개 (둘 다 값 있는 CIK ${exchangeBothPresentCount}개 중)`);
  console.error(`버킷(두 분모 병기): ${JSON.stringify(bucketBreakdown)}`);
  console.error(`604 산출률 두 기준: ofN=${the604YieldTwoBasis.ofN}% ofCalculable=${the604YieldTwoBasis.ofCalculable}%`);
  console.error(`ICC 4값: 604_def860=${output866b.industryIcc.the604_def860}(기록 0.195와 ${output866b.industryIcc.the604_def860 === 0.195 ? "일치" : "차이 있음 — 그대로 기록"}) · 604_noMin=${iccBase_noMinGroup.icc?.toFixed(3)} · 전수_def860=${output866b.industryIcc.fullUniverse_def860} · 전수_noMin=${iccFull_noMinGroup.icc?.toFixed(3)}`);
  console.error(`tsc/vitest는 별도 실행 · revdcf_results 무변경(이 스크립트는 SELECT만)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
