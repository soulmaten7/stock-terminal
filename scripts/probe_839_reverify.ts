// STEP 839 — 838 겹침 검산 재검증(frame 기간 매칭) + 5년연속 병목 분해 + 구멍 3건 + FCF 구조음수 분류.
// 실행: npx tsx scripts/probe_839_reverify.ts   (프로덕션 무변경 · SEC 실측 전용)
// 핵심: 838의 overlap 검산은 companyfacts를 fy 키로 짝지어 연간 vs 분기를 비교하는 버그였다.
//       839는 SEC `frame` 필드(CY#### = 연간)로 기간을 고정해 재실행하고, 838 버그 로직도 나란히 재현해 대조한다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync, existsSync, readFileSync } from "fs";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const TOPN = 1000;
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const SURV_CACHE = "docs/probe_survivors.json";

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
type CEntry = { start?: string; end?: string; val: number; fy?: number; fp?: string; form?: string; frame?: string };
async function concept(cik: number, tag: string, unit = "USD"): Promise<CEntry[]> {
  const pad = String(cik).padStart(10, "0");
  const r = await secGet(`https://data.sec.gov/api/xbrl/companyconcept/CIK${pad}/us-gaap/${tag}.json`);
  if (!r) return [];
  const j = (r.json ?? {}) as { units?: Record<string, CEntry[]> };
  const arr = j.units?.[unit];
  return Array.isArray(arr) ? arr : []; // 방어: units 결측·비배열이면 빈 배열
}
const dur = (y: number) => `CY${y}`, inst = (y: number) => `CY${y}Q4I`;
const REVENUE_TAGS = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax"];
const CAPEX_TAGS = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets", "PaymentsForCapitalImprovements"];

// frame=CY#### (연간)만 뽑아 {frame: val}
function annualByFrame(e: CEntry[]): Map<string, number> { const m = new Map<string, number>(); if (!Array.isArray(e)) return m; for (const x of e) if (x.frame && /^CY\d{4}$/.test(x.frame)) m.set(x.frame, x.val); return m; }
// 838 버그 재현: fp=FY·form 10-K를 fy 키로(기간 미확인) — 마지막 값이 이김
function buggyByFy(e: CEntry[]): Map<number, number> { const m = new Map<number, number>(); if (!Array.isArray(e)) return m; for (const x of e) if (x.fp === "FY" && x.form?.startsWith("10-K") && x.fy) m.set(x.fy, x.val); return m; }

type Sub = { symbol: string; cik: number; mcap: number; sic: string | null; sicDesc: string | null; annualForm: string | null };

async function deriveSurvivors(sb: ReturnType<typeof createAdminClient>): Promise<Sub[]> {
  const rows: { symbol: string; market_cap: number }[] = [];
  for (let from = 0; ; from += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap").order("market_cap", { ascending: false }).range(from, from + 999); const c = (data ?? []) as typeof rows; rows.push(...c); if (c.length < 1000) break; }
  const top = rows.slice(0, TOPN);
  const tj = (await secGet("https://www.sec.gov/files/company_tickers.json"))?.json as Record<string, { cik_str: number; ticker: string }>;
  const cikByT = new Map<string, number>(); for (const k in tj) cikByT.set(String(tj[k].ticker).toUpperCase(), tj[k].cik_str);
  const uni: { symbol: string; cik: number; mcap: number }[] = [];
  for (const r of top) { const s = r.symbol.toUpperCase().trim(); const cik = cikByT.get(s) ?? cikByT.get(s.replace(/\./g, "-")) ?? cikByT.get(s.replace(/-/g, ".")) ?? null; if (cik != null) uni.push({ symbol: r.symbol, cik, mcap: r.market_cap }); }
  console.error(`[surv] submissions ${uni.length}개 조회…`);
  const subs = await mapLimit(uni, 6, async (u): Promise<Sub> => {
    const pad = String(u.cik).padStart(10, "0");
    const r = await secGet(`https://data.sec.gov/submissions/CIK${pad}.json`);
    const j = (r?.json ?? {}) as { sicCode?: string; sic?: string; sicDescription?: string; filings?: { recent?: { form?: string[]; filingDate?: string[] } } };
    let annualForm: string | null = null, best = "";
    const fm = j.filings?.recent?.form ?? [], dt = j.filings?.recent?.filingDate ?? [];
    for (let i = 0; i < fm.length; i++) { const f = fm[i]; if (f === "10-K" || f === "20-F" || f === "40-F" || f === "10-KSB") if ((dt[i] ?? "") > best) { best = dt[i] ?? ""; annualForm = f; } }
    return { symbol: u.symbol, cik: u.cik, mcap: u.mcap, sic: (j.sicCode ?? j.sic ?? null) as string | null, sicDesc: j.sicDescription ?? null, annualForm };
  });
  // 매출 있는 CIK(전체 filer 2년 합집합)
  const revC = new Set<number>();
  for (const y of [2023, 2024]) for (const t of REVENUE_TAGS) { const f = await frames("us-gaap", t, "USD", dur(y)); if (f) for (const c of f.byCik.keys()) revC.add(c); }
  const sic4 = (s: string | null) => (s ? s.padStart(4, "0") : null);
  const isFin = (s: string | null) => { const c = sic4(s); return !!c && c >= "6000" && c <= "6999"; };
  const surv = subs.filter((s) => { const c = sic4(s.sic); if (c === "6798" || c === "6770") return false; if (isFin(s.sic)) return false; if (s.annualForm === "20-F" || s.annualForm === "40-F") return false; if (!revC.has(s.cik)) return false; return true; });
  return surv;
}

async function main() {
  const out: Record<string, unknown> = { probedAt: new Date().toISOString() };
  const sb = createAdminClient();

  // ── 생존자(캐시 우선) ──────────────────────────────────────────────────────
  let survivors: Sub[];
  if (existsSync(SURV_CACHE)) { survivors = JSON.parse(readFileSync(SURV_CACHE, "utf8")) as Sub[]; console.error(`[surv] 캐시 로드 ${survivors.length}`); }
  else { survivors = await deriveSurvivors(sb); writeFileSync(SURV_CACHE, JSON.stringify(survivors)); console.error(`[surv] 신규 도출 ${survivors.length} → 캐시 저장`); }
  const survCik = new Set(survivors.map((s) => s.cik));
  const symByCik = new Map(survivors.map((s) => [s.cik, s.symbol]));
  const sicByCik = new Map(survivors.map((s) => [s.cik, s.sic]));
  out.survivorsN = survivors.length;

  // ── §3 재료 = driver별 연도별 frames(∩생존자) + FCF용 OCF/capex ──────────────
  console.error(`[§3] driver frames 수집…`);
  const DRIVERS: { key: string; tags: string[]; kind: "dur" | "inst" }[] = [
    { key: "Revenue", tags: REVENUE_TAGS, kind: "dur" },
    { key: "OperatingIncomeLoss", tags: ["OperatingIncomeLoss"], kind: "dur" },
    { key: "IncomeTax", tags: ["IncomeTaxExpenseBenefit"], kind: "dur" },
    { key: "OperatingCashFlow", tags: ["NetCashProvidedByUsedInOperatingActivities"], kind: "dur" },
    { key: "Assets", tags: ["Assets"], kind: "inst" },
    { key: "Capex", tags: CAPEX_TAGS, kind: "dur" },
  ];
  const setsByKeyYear: Record<string, Set<number>[]> = {};
  const ocfByYear: Record<number, Map<number, number>> = {}, capexByYear: Record<number, Map<number, number>> = {};
  const revExclSet = new Set<number>(), revRevenuesSet = new Set<number>(); // §1 표본 선정용(둘 다 보고)
  for (const d of DRIVERS) {
    setsByKeyYear[d.key] = [];
    for (const y of YEARS) {
      const merged = new Map<number, number>();
      for (const t of d.tags) { const f = await frames("us-gaap", t, "USD", d.kind === "dur" ? dur(y) : inst(y)); if (f) for (const [c, v] of f.byCik) if (!merged.has(c)) merged.set(c, v); }
      const s = new Set<number>(); for (const c of merged.keys()) if (survCik.has(c)) s.add(c);
      setsByKeyYear[d.key].push(s);
      if (d.key === "OperatingCashFlow") ocfByYear[y] = new Map([...merged].filter(([k]) => survCik.has(k)));
      if (d.key === "Capex") capexByYear[y] = new Map([...merged].filter(([k]) => survCik.has(k)));
    }
    console.error(`  [§3] ${d.key} 완료`);
  }
  // 매출 개별 태그(§1 표본)
  { const fe = await frames("us-gaap", "RevenueFromContractWithCustomerExcludingAssessedTax", "USD", dur(2023)); if (fe) for (const c of fe.byCik.keys()) if (survCik.has(c)) revExclSet.add(c);
    const fr = await frames("us-gaap", "Revenues", "USD", dur(2023)); if (fr) for (const c of fr.byCik.keys()) if (survCik.has(c)) revRevenuesSet.add(c); }

  // ── §1 겹침 검산 재실행 (frame 매칭 vs 838 버그 재현) ────────────────────────
  console.error(`[§1] 겹침 검산 재실행…`);
  // 표본: 둘 다 보고하는 생존자 시총 상위 ~80 + 명시 3종(MA·ADP·GE)
  const both = survivors.filter((s) => revExclSet.has(s.cik) && revRevenuesSet.has(s.cik)).sort((a, b) => b.mcap - a.mcap).slice(0, 80);
  const NAMED: Record<string, number> = { MA: 1141391, ADP: 8670, GE: 40545 };
  for (const [sym, cik] of Object.entries(NAMED)) if (!both.some((s) => s.cik === cik)) both.push({ symbol: sym, cik, mcap: 0, sic: null, sicDesc: null, annualForm: null });

  let buggyPairs = 0, buggyMis = 0, framePairs = 0, frameMis = 0;
  const frameMisSamples: string[] = [];
  const buckets = { equal: 0, lt1: 0, p1to10: 0, gt10: 0 };
  const named: Record<string, unknown> = {};
  await mapLimit(both, 5, async (s) => {
    const ex = await concept(s.cik, "RevenueFromContractWithCustomerExcludingAssessedTax");
    const rv = await concept(s.cik, "Revenues");
    // 838 버그 재현(fy 키)
    const be = buggyByFy(ex), br = buggyByFy(rv);
    for (const [fy, va] of be) { const vb = br.get(fy); if (vb != null) { buggyPairs++; if (Math.abs(va - vb) / Math.max(Math.abs(va), 1) > 0.001) buggyMis++; } }
    // 839 frame 매칭(연간만)
    const fe = annualByFrame(ex), fr = annualByFrame(rv);
    for (const [frame, va] of fe) { const vb = fr.get(frame); if (vb != null) { framePairs++; const diff = Math.abs(va - vb) / Math.max(Math.abs(va), 1);
      if (diff <= 0.0001) buckets.equal++; else if (diff < 0.01) buckets.lt1++; else if (diff < 0.10) buckets.p1to10++; else buckets.gt10++;
      if (diff > 0.001) { frameMis++; if (frameMisSamples.length < 15) frameMisSamples.push(`${s.symbol} ${frame}: Excl=${va} Rev=${vb} (${(diff * 100).toFixed(1)}%)`); } } }
    if (NAMED[s.symbol] != null) named[s.symbol] = { excludingAnnual: Object.fromEntries(fe), revenuesAnnual: Object.fromEntries(fr), buggyExcl: Object.fromEntries(be), buggyRev: Object.fromEntries(br) };
  });
  out.overlap = {
    sample: both.length,
    b838_buggy: { pairs: buggyPairs, mismatch: buggyMis, rate: buggyPairs ? +(buggyMis / buggyPairs).toFixed(3) : null },
    b839_frameMatched: { pairs: framePairs, mismatch: frameMis, rate: framePairs ? +(frameMis / framePairs).toFixed(3) : null, buckets, samples: frameMisSamples },
    named,
  };
  console.error(`[§1] 838재현 ${buggyMis}/${buggyPairs} · frame매칭 ${frameMis}/${framePairs} (equal ${buckets.equal}·<1% ${buckets.lt1}·1-10% ${buckets.p1to10}·>10% ${buckets.gt10})`);

  // ── §3 병목 분해 ───────────────────────────────────────────────────────────
  const consec = (key: string, run: number, sets = setsByKeyYear[key]): Set<number> => { const r = new Set<number>(); for (const c of survCik) { let ok = true; for (let k = sets.length - run; k < sets.length; k++) if (!sets[k].has(c)) { ok = false; break; } if (ok) r.add(c); } return r; };
  const perDriver5: Record<string, number> = {};
  for (const d of DRIVERS) perDriver5[d.key] = +(consec(d.key, 5).size / survivors.length).toFixed(3);
  // 누적 교집합(단독 확보율 오름차순 = 약한 것 먼저 넣어 급락 지점 파악)
  const order = [...DRIVERS].sort((a, b) => perDriver5[a.key] - perDriver5[b.key]).map((d) => d.key);
  const cumulative: { afterAdding: string; rate: number }[] = [];
  let acc: Set<number> = new Set(survCik); // 전체 생존자에서 시작 → driver별 5년집합과 순차 교집합
  for (const key of order) { const s5 = consec(key, 5); const next = new Set<number>(); for (const c of acc) if (s5.has(c)) next.add(c); acc = next; cumulative.push({ afterAdding: key, rate: +(acc.size / survivors.length).toFixed(3) }); }
  out.bottleneck = { perDriver5yr: perDriver5, cumulativeIntersection: cumulative };
  console.error(`[§3] 단독5년: ${JSON.stringify(perDriver5)}`);

  // ── §4 구멍 3건 후보·커버리지·연속성 ───────────────────────────────────────
  console.error(`[§4] 구멍 3건…`);
  async function coverYears(ns: string, tag: string, kind: "dur" | "inst", unit = "USD"): Promise<Record<number, number>> { const o: Record<number, number> = {}; for (const y of YEARS) { const f = await frames(ns, tag, unit, kind === "dur" ? dur(y) : inst(y)); let n = 0; if (f) for (const c of f.byCik.keys()) if (survCik.has(c)) n++; o[y] = n; } return o; }
  async function unionCoverYears(specs: { ns: string; tag: string; kind: "dur" | "inst"; unit?: string }[]): Promise<Record<number, number>> {
    const o: Record<number, number> = {};
    for (const y of YEARS) { const set = new Set<number>(); for (const sp of specs) { const f = await frames(sp.ns, sp.tag, sp.unit ?? "USD", sp.kind === "dur" ? dur(y) : inst(y)); if (f) for (const c of f.byCik.keys()) if (survCik.has(c)) set.add(c); } o[y] = set.size; }
    return o;
  }
  // (1) OperatingIncome 폴백 후보
  const opInc = await coverYears("us-gaap", "OperatingIncomeLoss", "dur");
  const opIncNCI = await coverYears("us-gaap", "OperatingIncomeLossIncludingPortionAttributableToNoncontrollingInterest", "dur"); // 존재하면
  const opUnion = await unionCoverYears([{ ns: "us-gaap", tag: "OperatingIncomeLoss", kind: "dur" }, { ns: "us-gaap", tag: "OperatingIncomeLossIncludingPortionAttributableToNoncontrollingInterest", kind: "dur" }, { ns: "us-gaap", tag: "GrossProfit", kind: "dur" }]);
  // (2) Interest 절벽: 각 태그 + 합집합
  const intExp = await coverYears("us-gaap", "InterestExpense", "dur");
  const intNonop = await coverYears("us-gaap", "InterestExpenseNonoperating", "dur");
  const intNet = await coverYears("us-gaap", "InterestIncomeExpenseNet", "dur");
  const intUnion = await unionCoverYears([{ ns: "us-gaap", tag: "InterestExpense", kind: "dur" }, { ns: "us-gaap", tag: "InterestExpenseNonoperating", kind: "dur" }, { ns: "us-gaap", tag: "InterestIncomeExpenseNet", kind: "dur" }]);
  // (3) 주식수 후보
  const shDei = await coverYears("dei", "EntityCommonStockSharesOutstanding", "inst", "shares");
  const shGaap = await coverYears("us-gaap", "CommonStockSharesOutstanding", "inst", "shares");
  const shWavg = await coverYears("us-gaap", "WeightedAverageNumberOfSharesOutstandingBasic", "dur", "shares");
  out.holes = {
    operatingIncome: { OperatingIncomeLoss: opInc, IncludingNCI: opIncNCI, union_with_GrossProfit: opUnion },
    interestCliff: { InterestExpense: intExp, InterestExpenseNonoperating: intNonop, InterestIncomeExpenseNet: intNet, union: intUnion },
    shares: { dei_EntityCommonStock: shDei, gaap_CommonStockSharesOutstanding: shGaap, gaap_WeightedAvgBasic: shWavg, note: "us_market_cap(야후 시총) 보유 → 주식수는 시총 산출용 폴백이지 필수 아님" },
  };

  // ── §5 구조적 FCF 음수 종목 분류 ───────────────────────────────────────────
  const fcfByCik = new Map<number, { y: number; fcf: number }[]>();
  for (const y of YEARS) { const ocf = ocfByYear[y] ?? new Map(), cap = capexByYear[y] ?? new Map(); for (const [c, o] of ocf) { const cx = cap.get(c); if (cx == null) continue; const a = fcfByCik.get(c) ?? []; a.push({ y, fcf: o - cx }); fcfByCik.set(c, a); } }
  const sortY = (a: { y: number; fcf: number }[]) => a.slice().sort((x, z) => x.y - z.y);
  const avgN = (a: { y: number; fcf: number }[], n: number) => { const s = sortY(a).slice(-n); return s.length ? s.reduce((p, c) => p + c.fcf, 0) / s.length : null; };
  const structural: { symbol: string; sic: string | null; sicMajor: string; latest: number; avg5: number | null }[] = [];
  for (const c of survCik) { const a = fcfByCik.get(c); if (!a || a.length < 3) continue; const s = sortY(a); const latest = s[s.length - 1].fcf; const a3 = avgN(a, 3), a5 = avgN(a, 5); if (latest < 0 && a3 != null && a3 < 0 && a5 != null && a5 < 0) { const sic = sicByCik.get(c) ?? null; structural.push({ symbol: symByCik.get(c) ?? String(c), sic, sicMajor: (sic ?? "00").padStart(4, "0").slice(0, 2), latest: Math.round(latest / 1e6), avg5: a5 != null ? Math.round(a5 / 1e6) : null }); } }
  const byMajor: Record<string, number> = {}; for (const s of structural) byMajor[s.sicMajor] = (byMajor[s.sicMajor] ?? 0) + 1;
  out.structuralNegFcf = { count: structural.length, pctOfSurvivors: +(structural.length / survivors.length).toFixed(3), bySicMajor: byMajor, list: structural.sort((a, b) => a.latest - b.latest).slice(0, 40) };
  console.error(`[§5] 구조적 FCF 음수 ${structural.length}종목`);

  writeFileSync("docs/probe_839_output.json", JSON.stringify(out, null, 2));
  console.error(`[DONE] SEC ${callsTotal}콜 · ${(bytesTotal / 1e6).toFixed(1)}MB`);
  console.log(JSON.stringify(out, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
