// STEP 838 — 🇺🇸 역DCF 데이터 프로브 (SEC XBRL 단독 · 실측 전용, 프로덕션 무변경).
// 실행: npx tsx scripts/probe_revdcf_us.ts   (환경: .env.local 의 SUPABASE_SERVICE_ROLE_KEY)
// 성격: 측정만 한다. 스키마·크론·프로덕션 코드 건드리지 않는다. 모든 수치는 실제 SEC 응답에서 센다.
// 재현: Cowork가 07-30 손으로 잰 frames+pts 방법을 measureFramesPts()로 포함(전체 filer 기준 재현).
// 출력: 표준출력 요약 + docs/probe_revdcf_us_output.json
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync } from "fs";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" }; // lib/edgar.ts 와 동일(SEC 정책: UA 필수)
const TOPN = 1000;
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// ── SEC 접근: 속도 제한 준수(≤10 req/s) + 429/503 재시도 + 바이트/시간 계측 ──────────
let bytesTotal = 0;
let callsTotal = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastCall = 0;
async function throttle() {
  const gap = 300; // ~3.3 req/s — SEC 10/s는 상한이나 지속 버스트는 임시차단(429) 유발 → 보수적으로.
  const now = Date.now();
  const wait = lastCall + gap - now;
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
}
async function secGet(url: string): Promise<{ json: unknown; bytes: number; ms: number } | null> {
  for (let attempt = 0; attempt < 7; attempt++) {
    await throttle();
    const t0 = Date.now();
    try {
      const res = await fetch(url, { headers: UA });
      if (res.status === 429 || res.status === 503) { await sleep(Math.min(2 ** attempt * 1000, 30000)); continue; } // 지수 백오프 최대 30s
      if (!res.ok) return null; // 404 등 = 그 프레임/CIK 없음
      const text = await res.text();
      const bytes = Buffer.byteLength(text);
      bytesTotal += bytes; callsTotal++;
      return { json: JSON.parse(text), bytes, ms: Date.now() - t0 };
    } catch {
      await sleep(Math.min(2 ** attempt * 500, 15000));
    }
  }
  return null;
}
// 동시성 제한 실행기
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, async () => {
    while (i < arr.length) { const cur = i++; out[cur] = await fn(arr[cur], cur); }
  }));
  return out;
}

type FramesResult = { pts: number; byCik: Map<number, number> };
// frames 한 프레임 조회 → {cik: val} 맵 + pts(그 프레임 보고 기업 수).
async function frames(ns: string, tag: string, unit: string, frame: string): Promise<FramesResult | null> {
  const r = await secGet(`https://data.sec.gov/api/xbrl/frames/${ns}/${tag}/${unit}/${frame}.json`);
  if (!r) return null;
  const j = r.json as { pts?: number; data?: Array<{ cik: number; val: number }> };
  const byCik = new Map<number, number>();
  for (const d of j.data ?? []) if (typeof d.cik === "number") byCik.set(d.cik, d.val); // 프레임은 기업당 1값(최신 accn)
  return { pts: j.pts ?? (j.data?.length ?? 0), byCik };
}
const dur = (y: number) => `CY${y}`;       // 기간(손익·현금흐름)
const inst = (y: number) => `CY${y}Q4I`;   // 시점(재무상태표) — 연말
const q2i = (y: number) => `CY${y}Q2I`;    // EntityPublicFloat = 2분기말 근처 보고

// ── 태그 정의 (B-1 + 후보 변형) ─────────────────────────────────────────────
const REVENUE_TAGS = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax"];
const CAPEX_TAGS = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"];
const PRETAX_TAGS = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments"];

async function main() {
  const out: Record<string, unknown> = { probedAt: new Date().toISOString(), topN: TOPN };
  const sb = createAdminClient();

  // ── 유니버스 로드: us_market_cap 시총 상위 1,000 ──────────────────────────
  const rows: { symbol: string; market_cap: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("us_market_cap").select("symbol, market_cap").order("market_cap", { ascending: false }).range(from, from + 999);
    const chunk = (data ?? []) as { symbol: string; market_cap: number }[];
    rows.push(...chunk);
    if (chunk.length < 1000) break;
  }
  const top = rows.slice(0, TOPN);
  const cutoff = top[top.length - 1]?.market_cap ?? null;
  console.error(`[universe] us_market_cap 로드 ${rows.length}행 · 상위 ${top.length} · 1000위 하한 $${(cutoff! / 1e9).toFixed(2)}B`);

  // ── ticker → CIK (company_tickers.json) ───────────────────────────────────
  const tj = (await secGet("https://www.sec.gov/files/company_tickers.json"))?.json as Record<string, { cik_str: number; ticker: string }> | undefined;
  if (!tj) throw new Error("company_tickers.json 실패");
  const cikByTicker = new Map<string, number>();
  for (const k in tj) cikByTicker.set(String(tj[k].ticker).toUpperCase(), tj[k].cik_str);
  // 심볼 정규화: 우리 DB의 BRK-B ↔ SEC BRK-B (동일). 점 표기 대비 - 로도 시도.
  const norm = (s: string) => s.toUpperCase().trim();
  const universe: { symbol: string; cik: number; mcap: number }[] = [];
  const unmapped: string[] = [];
  for (const r of top) {
    const s = norm(r.symbol);
    const cik = cikByTicker.get(s) ?? cikByTicker.get(s.replace(/\./g, "-")) ?? cikByTicker.get(s.replace(/-/g, ".")) ?? null;
    if (cik == null) unmapped.push(r.symbol);
    else universe.push({ symbol: r.symbol, cik, mcap: r.market_cap });
  }
  const cikSet = new Set(universe.map((u) => u.cik));
  console.error(`[cik] 매핑 성공 ${universe.length} · 실패 ${unmapped.length}`);
  out.mapping = { mapped: universe.length, unmapped: unmapped.length, unmappedSample: unmapped.slice(0, 30) };

  // ── §2 분류 수집: submissions API (SIC·state·exchanges·FYE·최근 연간보고 form) ──
  console.error(`[submissions] ${universe.length}개 CIK 조회 중…`);
  type Sub = { symbol: string; cik: number; mcap: number; sic: string | null; sicDesc: string | null; state: string | null; exchanges: string[]; fye: string | null; annualForm: string | null };
  const subs = await mapLimit(universe, 6, async (u): Promise<Sub> => {
    const pad = String(u.cik).padStart(10, "0");
    const r = await secGet(`https://data.sec.gov/submissions/CIK${pad}.json`);
    const j = (r?.json ?? {}) as {
      sicCode?: string; sic?: string; sicDescription?: string; stateOfIncorporation?: string; exchanges?: string[]; fiscalYearEnd?: string;
      filings?: { recent?: { form?: string[]; filingDate?: string[] } };
    };
    // 최근 연간보고서 유형: 10-K / 20-F / 40-F 중 가장 최근 것
    let annualForm: string | null = null;
    const forms = j.filings?.recent?.form ?? [];
    const dates = j.filings?.recent?.filingDate ?? [];
    let bestDate = "";
    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      if (f === "10-K" || f === "20-F" || f === "40-F" || f === "10-KSB") {
        if ((dates[i] ?? "") > bestDate) { bestDate = dates[i] ?? ""; annualForm = f; }
      }
    }
    return {
      symbol: u.symbol, cik: u.cik, mcap: u.mcap,
      sic: (j.sicCode ?? j.sic ?? null) as string | null,
      sicDesc: j.sicDescription ?? null,
      state: j.stateOfIncorporation ?? null,
      exchanges: j.exchanges ?? [],
      fye: j.fiscalYearEnd ?? null,
      annualForm,
    };
  });
  console.error(`[submissions] 완료`);

  // AssetsCurrent 결측(금융/REIT 보조 신호) — frames 한 번으로 최신연도(CY2024Q4I) 보고 CIK 집합
  const acFrame = await frames("us-gaap", "AssetsCurrent", "USD", inst(2024));
  const reportsAC = acFrame?.byCik ?? new Map();

  // 매출 태그(3종) × 최근 2년(CY2023·CY2024) 합집합 — 매출0/없음 판별.
  // 🔴 2년 합집합 이유: 비12월 결산·지연 제출자는 특정 CY 프레임에 안 들어올 수 있어 단년도 검사는 오탈락.
  const revCiks = new Set<number>();
  for (const y of [2023, 2024]) for (const t of REVENUE_TAGS) { const f = await frames("us-gaap", t, "USD", dur(y)); if (f) for (const cik of f.byCik.keys()) revCiks.add(cik); }
  // 🔴 가드: 매출 프레임이 비었으면(=rate limit 등으로 전부 null) N=0을 조용히 만들지 말고 즉시 중단.
  if (revCiks.size < 500) throw new Error(`매출 frames가 비정상(${revCiks.size} CIK<500) — SEC rate limit 의심. 재실행 요망(조용한 N=0 방지).`);
  const hasRev = (cik: number) => revCiks.has(cik);
  console.error(`[rev] 매출 보고 CIK(전체 filer, CY2023∪CY2024) ${revCiks.size}`);

  const sic4 = (s: string | null) => (s ? s.padStart(4, "0") : null);
  const isFinance = (s: string | null) => { const c = sic4(s); return !!c && c >= "6000" && c <= "6999"; };
  const isREIT = (s: string | null) => sic4(s) === "6798";
  const isSPAC = (s: string | null) => sic4(s) === "6770";
  const isForeign = (a: string | null) => a === "20-F" || a === "40-F";

  let exFin = 0, exREIT = 0, exSPAC = 0, exForeign = 0, exNoRev = 0;
  const survivors: Sub[] = [];
  for (const s of subs) {
    // REIT/SPAC 를 금융과 분리 카운트(REIT·SPAC은 6798·6770 = 금융범위 안이므로 우선 판정)
    if (isREIT(s.sic)) { exREIT++; continue; }
    if (isSPAC(s.sic)) { exSPAC++; continue; }
    if (isFinance(s.sic)) { exFin++; continue; }
    if (isForeign(s.annualForm)) { exForeign++; continue; }
    if (!hasRev(s.cik)) { exNoRev++; continue; }
    survivors.push(s);
  }
  // SIC vs AssetsCurrent 결측 교차 적중률
  const finOrReit = subs.filter((s) => isFinance(s.sic) || isREIT(s.sic));
  const acMissingInFinReit = finOrReit.filter((s) => !reportsAC.has(s.cik)).length;
  const acMissingInSurvivors = survivors.filter((s) => !reportsAC.has(s.cik)).length;
  out.exclusions = {
    finance: exFin, reit: exREIT, spac: exSPAC, foreign: exForeign, noRevenue: exNoRev,
    survivors: survivors.length,
    crossCheck: {
      finOrReitCount: finOrReit.length,
      acMissingInFinReit, acMissingRateInFinReit: finOrReit.length ? +(acMissingInFinReit / finOrReit.length).toFixed(3) : null,
      acMissingInSurvivors,
      note: "AssetsCurrent(CY2024Q4I) 결측이 금융/REIT와 얼마나 겹치나 — 유동성배열법 사용 = 금융업 보조 신호",
    },
  };
  const top3pct = Math.round(survivors.length * 0.03);
  out.universeN = { N: survivors.length, top3pctCount: top3pct, cutoffUSD: cutoff };
  console.error(`[§2] 제외 fin=${exFin} reit=${exREIT} spac=${exSPAC} foreign=${exForeign} noRev=${exNoRev} → 생존 N=${survivors.length} (상위3%=${top3pct}종목)`);

  const survivorCiks = new Set(survivors.map((s) => s.cik));

  // ── §3 태그 커버리지 (생존 N 기준, 연도별) + §5 FCF 재료 수집 ────────────────
  console.error(`[§3] 태그×연도 frames 수집 중…`);
  // 태그 카탈로그: [라벨, ns, tag(s), unit, kind]
  const COVERAGE: { label: string; ns: string; tags: string[]; unit: string; kind: "dur" | "inst" | "q2i" }[] = [
    { label: "Revenue(3태그합)", ns: "us-gaap", tags: REVENUE_TAGS, unit: "USD", kind: "dur" },
    { label: "OperatingIncomeLoss", ns: "us-gaap", tags: ["OperatingIncomeLoss"], unit: "USD", kind: "dur" },
    { label: "IncomeTaxExpenseBenefit", ns: "us-gaap", tags: ["IncomeTaxExpenseBenefit"], unit: "USD", kind: "dur" },
    { label: "PretaxIncome", ns: "us-gaap", tags: PRETAX_TAGS, unit: "USD", kind: "dur" },
    { label: "AssetsCurrent", ns: "us-gaap", tags: ["AssetsCurrent"], unit: "USD", kind: "inst" },
    { label: "LiabilitiesCurrent", ns: "us-gaap", tags: ["LiabilitiesCurrent"], unit: "USD", kind: "inst" },
    { label: "AccountsPayableCurrent", ns: "us-gaap", tags: ["AccountsPayableCurrent"], unit: "USD", kind: "inst" },
    { label: "Assets", ns: "us-gaap", tags: ["Assets"], unit: "USD", kind: "inst" },
    { label: "CashAndCashEquivalents", ns: "us-gaap", tags: ["CashAndCashEquivalentsAtCarryingValue"], unit: "USD", kind: "inst" },
    { label: "PP&E Net", ns: "us-gaap", tags: ["PropertyPlantAndEquipmentNet"], unit: "USD", kind: "inst" },
    { label: "Capex(3태그합)", ns: "us-gaap", tags: CAPEX_TAGS, unit: "USD", kind: "dur" },
    { label: "InterestExpense", ns: "us-gaap", tags: ["InterestExpense"], unit: "USD", kind: "dur" },
    { label: "LongTermDebt", ns: "us-gaap", tags: ["LongTermDebt", "LongTermDebtNoncurrent"], unit: "USD", kind: "inst" },
    { label: "OperatingCashFlow", ns: "us-gaap", tags: ["NetCashProvidedByUsedInOperatingActivities"], unit: "USD", kind: "dur" },
    { label: "EntityPublicFloat", ns: "dei", tags: ["EntityPublicFloat"], unit: "USD", kind: "q2i" },
    { label: "SharesOutstanding", ns: "dei", tags: ["EntityCommonStockSharesOutstanding"], unit: "shares", kind: "inst" },
  ];

  // 커버리지 표 + FCF/float 재료를 위해 tag-year 별 생존자 보고 집합을 저장
  const coverageByLabel: Record<string, Record<number, number>> = {}; // label → {year: 생존자 중 보고 수}
  const consecByLabel: Record<string, Set<number>[]> = {};            // label → 연도별 생존 CIK 집합(연속성 계산용)
  const ocfByYear: Record<number, Map<number, number>> = {};
  const capexByYear: Record<number, Map<number, number>> = {};
  const floatByYear: Record<number, Map<number, number>> = {};

  for (const c of COVERAGE) {
    coverageByLabel[c.label] = {};
    consecByLabel[c.label] = [];
    for (const y of YEARS) {
      const frame = c.kind === "dur" ? dur(y) : c.kind === "q2i" ? q2i(y) : inst(y);
      // 여러 태그(변형)면 합집합
      const merged = new Map<number, number>();
      for (const t of c.tags) {
        const f = await frames(c.ns, t, c.unit, frame);
        if (f) for (const [cik, val] of f.byCik) if (!merged.has(cik)) merged.set(cik, val);
      }
      const survReporting = new Set<number>();
      for (const cik of merged.keys()) if (survivorCiks.has(cik)) survReporting.add(cik);
      coverageByLabel[c.label][y] = survReporting.size;
      consecByLabel[c.label].push(survReporting);
      if (c.label === "OperatingCashFlow") ocfByYear[y] = new Map([...merged].filter(([k]) => survivorCiks.has(k)));
      if (c.label === "Capex(3태그합)") capexByYear[y] = new Map([...merged].filter(([k]) => survivorCiks.has(k)));
      if (c.label === "EntityPublicFloat") floatByYear[y] = merged;
    }
    console.error(`  [cov] ${c.label} 완료`);
  }
  out.coverageByYear = coverageByLabel;
  out.survivorsN = survivors.length;

  // 5년/10년 연속 확보 비율(driver 필수: 매출·영업이익·세율·OCF·Assets 기준으로 각각)
  function consecutiveRate(label: string, run: number): number {
    const sets = consecByLabel[label];
    const idxLast = sets.length; // YEARS 길이
    let count = 0;
    for (const cik of survivorCiks) {
      // 최근 run개 연도 모두 보고?
      let ok = true;
      for (let k = idxLast - run; k < idxLast; k++) { if (!sets[k].has(cik)) { ok = false; break; } }
      if (ok) count++;
    }
    return +(count / survivors.length).toFixed(3);
  }
  const KEY_DRIVERS = ["Revenue(3태그합)", "OperatingIncomeLoss", "IncomeTaxExpenseBenefit", "OperatingCashFlow", "Assets", "Capex(3태그합)"];
  out.consecutive = {};
  for (const d of KEY_DRIVERS) (out.consecutive as Record<string, unknown>)[d] = { "5yr": consecutiveRate(d, 5), "10yr": consecutiveRate(d, 10) };
  // "6개 핵심 driver 모두 최근 5년 연속" 비율(역DCF 계산 가능 실질 표본)
  function allDriversConsecutive(run: number): number {
    let count = 0;
    for (const cik of survivorCiks) {
      let ok = true;
      for (const d of KEY_DRIVERS) {
        const sets = consecByLabel[d];
        for (let k = sets.length - run; k < sets.length; k++) { if (!sets[k].has(cik)) { ok = false; break; } }
        if (!ok) break;
      }
      if (ok) count++;
    }
    return +(count / survivors.length).toFixed(3);
  }
  (out.consecutive as Record<string, unknown>)["ALL_6_DRIVERS"] = { "5yr": allDriversConsecutive(5), "10yr": allDriversConsecutive(10) };
  console.error(`[§3] 연속성 완료`);

  // ── §5 FCF 음수 비율 ──────────────────────────────────────────────────────
  // FCF(cik,year) = OCF − capex (둘 다 있을 때만)
  const fcfByCik = new Map<number, { y: number; fcf: number }[]>();
  for (const y of YEARS) {
    const ocf = ocfByYear[y] ?? new Map();
    const cap = capexByYear[y] ?? new Map();
    for (const [cik, o] of ocf) {
      const cx = cap.get(cik);
      if (cx == null) continue;
      const arr = fcfByCik.get(cik) ?? [];
      arr.push({ y, fcf: o - cx });
      fcfByCik.set(cik, arr);
    }
  }
  const last = (a: { y: number; fcf: number }[]) => a.slice().sort((x, z) => x.y - z.y);
  const avgN = (a: { y: number; fcf: number }[], n: number) => { const s = last(a).slice(-n); return s.length ? s.reduce((p, c) => p + c.fcf, 0) / s.length : null; };
  let withData = 0, negLatest = 0, neg3 = 0, neg5 = 0, resolvedBy3 = 0, resolvedBy5 = 0, negLatestCount = 0;
  for (const cik of survivorCiks) {
    const a = fcfByCik.get(cik);
    if (!a || a.length === 0) continue;
    withData++;
    const sorted = last(a);
    const latest = sorted[sorted.length - 1].fcf;
    const a3 = avgN(a, 3), a5 = avgN(a, 5);
    if (latest < 0) { negLatest++; negLatestCount++; if (a3 != null && a3 >= 0) resolvedBy3++; if (a5 != null && a5 >= 0) resolvedBy5++; }
    if (a3 != null && a3 < 0) neg3++;
    if (a5 != null && a5 < 0) neg5++;
  }
  out.fcf = {
    survivorsWithFcfData: withData,
    negLatestPct: withData ? +(negLatest / withData).toFixed(3) : null,
    neg3yrAvgPct: withData ? +(neg3 / withData).toFixed(3) : null,
    neg5yrAvgPct: withData ? +(neg5 / withData).toFixed(3) : null,
    normalizationResolvedBy3yr: negLatestCount ? +(resolvedBy3 / negLatestCount).toFixed(3) : null,
    normalizationResolvedBy5yr: negLatestCount ? +(resolvedBy5 / negLatestCount).toFixed(3) : null,
    russell1000Reference: 0.03,
  };
  console.error(`[§5] FCF 음수(최근) ${(negLatest / withData * 100).toFixed(1)}% · 표본 ${withData}`);

  // ── §6 FALR 재료: EntityPublicFloat 확보율 + 묵음 + volume 수신 ──────────────
  const floatEverCik = new Set<number>();
  let floatLatestYear = 0;
  for (const y of YEARS) { const m = floatByYear[y]; if (m) for (const cik of m.keys()) if (survivorCiks.has(cik)) floatEverCik.add(cik); }
  // 최신값 기준연도 분포: 각 생존자의 float 최신 보고 연도
  const floatLatestByCik = new Map<number, number>();
  for (const y of YEARS) { const m = floatByYear[y]; if (!m) continue; for (const cik of m.keys()) if (survivorCiks.has(cik)) floatLatestByCik.set(cik, y); }
  const staleDist: Record<number, number> = {};
  for (const [, y] of floatLatestByCik) staleDist[y] = (staleDist[y] ?? 0) + 1;
  // 야후 chart volume 수신 확인(표본 3종) — 구현 안 함, 오는지만
  const volSample: Record<string, boolean> = {};
  for (const sym of ["AAPL", "MSFT", "NVDA"]) {
    try {
      const ch = await yf.chart(sym, { period1: "2025-01-01", interval: "1d" });
      const q = (ch.quotes ?? []) as Array<{ volume?: number | null }>;
      volSample[sym] = q.some((r) => typeof r.volume === "number" && r.volume > 0);
    } catch { volSample[sym] = false; }
  }
  out.falr = {
    floatCoverageInSurvivors: survivors.length ? +(floatEverCik.size / survivors.length).toFixed(3) : null,
    floatSurvivorsWithData: floatEverCik.size,
    latestFloatYearDist: staleDist,
    yahooVolumeReceived: volSample,
  };
  console.error(`[§6] float 확보 ${floatEverCik.size}/${survivors.length} · volume ${JSON.stringify(volSample)}`);

  // ── §4 태그 변형 전수 발견 (업종 분산 표본 companyfacts) ─────────────────────
  console.error(`[§4] 업종 분산 표본 companyfacts 수집 중…`);
  // SIC 2자리 major group 별로 비례 표본(총 ~120)
  const byMajor = new Map<string, Sub[]>();
  for (const s of survivors) { const mg = (sic4(s.sic) ?? "00").slice(0, 2); const a = byMajor.get(mg) ?? []; a.push(s); byMajor.set(mg, a); }
  const SAMPLE = 120;
  const sample: Sub[] = [];
  const groups = [...byMajor.values()];
  // 각 그룹에서 시총 상위부터, 비례 배분
  for (const g of groups) {
    const take = Math.max(1, Math.round((g.length / survivors.length) * SAMPLE));
    sample.push(...g.sort((a, b) => b.mcap - a.mcap).slice(0, take));
  }
  const sampleUniq = sample.slice(0, SAMPLE);
  const tagFreq: Record<string, number> = {};
  const capImprovUsers: Sub[] = [];
  let overlapChecked = 0, overlapMismatch = 0;
  const mismatchSamples: string[] = [];
  await mapLimit(sampleUniq, 5, async (s) => {
    const pad = String(s.cik).padStart(10, "0");
    const r = await secGet(`https://data.sec.gov/api/xbrl/companyfacts/CIK${pad}.json`);
    const j = (r?.json ?? {}) as { facts?: { "us-gaap"?: Record<string, { units?: Record<string, Array<{ fy?: number; fp?: string; form?: string; val: number }>> }> } };
    const ns = j.facts?.["us-gaap"] ?? {};
    for (const tag in ns) tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
    if (ns["PaymentsForCapitalImprovements"]) capImprovUsers.push(s);
    // 겹침 검산: 매출 두 태그(Excluding vs Revenues)가 같은 FY·10-K에서 값 일치하는지
    const exT = ns["RevenueFromContractWithCustomerExcludingAssessedTax"];
    const revT = ns["Revenues"];
    if (exT?.units?.USD && revT?.units?.USD) {
      const pick = (arr: Array<{ fy?: number; fp?: string; form?: string; val: number }>) => {
        const m = new Map<number, number>();
        for (const e of arr) if (e.fp === "FY" && e.form?.startsWith("10-K") && e.fy) m.set(e.fy, e.val);
        return m;
      };
      const a = pick(exT.units.USD), b = pick(revT.units.USD);
      for (const [fy, va] of a) { const vb = b.get(fy); if (vb != null) { overlapChecked++; if (Math.abs(va - vb) / Math.max(Math.abs(va), 1) > 0.001) { overlapMismatch++; if (mismatchSamples.length < 10) mismatchSamples.push(`${s.symbol} FY${fy}: Excluding=${va} Revenues=${vb}`); } } }
    }
  });
  // 패턴별 빈도순 집계
  const rank = (re: RegExp) => Object.entries(tagFreq).filter(([t]) => re.test(t)).sort((a, b) => b[1] - a[1]).slice(0, 12);
  out.tagVariants = {
    sampleSize: sampleUniq.length,
    revenue: rank(/Revenue|Sales/),
    capex: rank(/PaymentsToAcquire|PaymentsForCapital|PaymentsToAcquireProductive/),
    debt: rank(/LongTermDebt|DebtCurrent|DebtNoncurrent/),
    interest: rank(/InterestExpense/),
    overlapCheck: { checkedPairs: overlapChecked, mismatches: overlapMismatch, mismatchSamples },
  };
  // 태그=업종 신호: PaymentsForCapitalImprovements 사용자가 REIT/부동산인지
  const capImpREITlike = capImprovUsers.filter((s) => isREIT(s.sic) || (sic4(s.sic) ?? "").startsWith("65") || (sic4(s.sic) ?? "").startsWith("70")).length;
  out.tagIndustrySignal = {
    capImprovementsUsers: capImprovUsers.length,
    capImprovREITorRealEstate: capImpREITlike,
    note: "PaymentsForCapitalImprovements 사용 = REIT/부동산/호텔 신호 (survivors는 REIT 이미 제외라 표본 적을 수 있음)",
  };
  console.error(`[§4] 완료 · 매출 겹침 검산 ${overlapChecked}쌍 중 불일치 ${overlapMismatch}`);

  // ── §1 수집 경로 비용 실측 ────────────────────────────────────────────────
  // A: 방금 frames 대량 호출의 평균 크기/시간(위 계측 누적). B: companyfacts 표본 평균. C: bulk zip Content-Length(HEAD).
  let bulkBytes: number | null = null;
  try {
    await throttle();
    const h = await fetch("https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip", { method: "HEAD", headers: UA });
    const cl = h.headers.get("content-length");
    bulkBytes = cl ? Number(cl) : null;
  } catch { bulkBytes = null; }
  out.pathCost = {
    A_frames: { note: "태그당 1회 → CIK로 필터", totalCallsThisRun: callsTotal, totalBytesThisRun: bytesTotal, estCallsForCoverage: COVERAGE.reduce((n, c) => n + c.tags.length * YEARS.length, 0) },
    B_companyfacts: { note: "종목당 1회", sampleCalls: sampleUniq.length, avgBytesApprox: "표본 companyfacts 평균(누적bytes에 포함)" },
    C_bulkZip: { note: "companyfacts.zip 1회(매일 재컴파일)", contentLengthBytes: bulkBytes, contentLengthGB: bulkBytes ? +(bulkBytes / 1e9).toFixed(2) : null },
  };

  // ── §B-0 재현: 전체 filer 기준 frames pts (검산) ───────────────────────────
  const reproTags: [string, string, string, string][] = [
    ["us-gaap", "Assets", "USD", inst(2024)],
    ["us-gaap", "NetCashProvidedByUsedInOperatingActivities", "USD", dur(2024)],
    ["us-gaap", "OperatingIncomeLoss", "USD", dur(2024)],
    ["dei", "EntityPublicFloat", "USD", q2i(2024)],
  ];
  const repro: Record<string, number> = {};
  for (const [ns, tag, unit, frame] of reproTags) { const f = await frames(ns, tag, unit, frame); repro[`${tag}@${frame}`] = f?.pts ?? -1; }
  out.reproAllFilers = repro;

  // ── 저장 ──────────────────────────────────────────────────────────────────
  writeFileSync("docs/probe_revdcf_us_output.json", JSON.stringify(out, null, 2));
  console.error(`\n[DONE] SEC 호출 ${callsTotal}회 · 다운로드 ${(bytesTotal / 1e6).toFixed(1)}MB`);
  console.log(JSON.stringify({
    mapping: out.mapping, universeN: out.universeN, exclusions: out.exclusions,
    consecutive: out.consecutive, fcf: out.fcf, falr: out.falr,
    tagVariants: out.tagVariants, tagIndustrySignal: out.tagIndustrySignal,
    pathCost: out.pathCost, reproAllFilers: out.reproAllFilers,
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
