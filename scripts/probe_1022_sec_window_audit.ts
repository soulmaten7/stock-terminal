// STEP 1022 — SEC frames 6분기 조회창 결함의 전수 영향. 두 단계로 분리(1-2/1-3 필수 우선, 1-4는 체크포인트).
// 🔴 읽기 전용. DB 쓰기 0. companyfacts는 창 개념 없이 전체 이력을 반환 — 심볼당 1회 호출로 4개 창 전부 커버.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import usSymbolsData from "../data/us_symbols.json";
import { writeFileSync, existsSync, readFileSync } from "fs";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const MODE = process.argv[2] ?? "required"; // "required" | "existing"
const CHECKPOINT = `/private/tmp/claude-501/-Users-maegbug-stock-terminal/8ac4e594-069c-4a4e-bc10-d6e60c09ac6f/scratchpad/step1022_existing_checkpoint.json`;

const WINDOW_CUTOFFS: Record<string, string> = { w6q: "2025-01-01", w12q: "2023-07-01", w20q: "2021-07-01", wAll: "0000-01-01" };

type Unit = { end: string; val: number };
type CompanyFacts = { facts?: { dei?: Record<string, { units?: { shares?: Unit[] } }>; "us-gaap"?: Record<string, { units?: { shares?: Unit[] } }> } };

async function fetchCompanyFacts(cik: number): Promise<CompanyFacts | null> {
  const cikStr = String(cik).padStart(10, "0");
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cikStr}.json`;
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(12000) });
    if (r.status === 404) return { facts: {} };
    if (!r.ok) return null;
    return (await r.json()) as CompanyFacts;
  } catch {
    return null;
  }
}
function latestShare(cf: CompanyFacts): { end: string; val: number } | null {
  const dei = cf.facts?.dei?.EntityCommonStockSharesOutstanding?.units?.shares ?? [];
  const gaap = cf.facts?.["us-gaap"]?.CommonStockSharesOutstanding?.units?.shares ?? [];
  const all = [...dei, ...gaap].filter((u) => u.val > 0);
  if (all.length === 0) return null;
  all.sort((a, b) => (a.end < b.end ? 1 : -1));
  return all[0];
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const sb = createAdminClient();
  type UsSym = { sym: string; name: string; type: string };
  const STOCK = (usSymbolsData as UsSym[]).filter((s) => s.type === "stock");

  const cikRows: { symbol: string; cik: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
  const cikBySymbol = new Map(cikRows.map((r) => [r.symbol.toUpperCase(), r.cik]));

  const priceRows: { symbol: string; price: number | null }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_stock_perf").select("symbol, price").range(f, f + 999); const c = (data ?? []) as typeof priceRows; priceRows.push(...c); if (c.length < 1000) break; }
  const priceBySymbol = new Map(priceRows.map((r) => [r.symbol.toUpperCase(), r.price]));

  const mcapRows: { symbol: string; market_cap: number; as_of: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol, market_cap, as_of").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapBySymbol = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), r]));
  const latestMcapAsOf = mcapRows.reduce<string | null>((mx, r) => (mx == null || r.as_of > mx ? r.as_of : mx), null);

  type FrameRow = { cik: number; end: string; val: number };
  async function fetchFrame(ns: string, tag: string, period: string): Promise<FrameRow[]> {
    const url = `https://data.sec.gov/api/xbrl/frames/${ns}/${tag}/shares/${period}.json`;
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
    if (!r.ok) return [];
    const j = (await r.json()) as { data?: FrameRow[] };
    return j.data ?? [];
  }
  const periods = ["CY2026Q2I", "CY2026Q1I", "CY2025Q4I", "CY2025Q3I", "CY2025Q2I", "CY2025Q1I"];
  const deiByCik = new Map<number, FrameRow>();
  for (const p of periods) { const rows = await fetchFrame("dei", "EntityCommonStockSharesOutstanding", p); for (const r of rows) { const e = deiByCik.get(r.cik); if (!e || r.end > e.end) deiByCik.set(r.cik, r); } await sleep(150); }
  const gaapByCik = new Map<number, FrameRow>();
  for (const p of periods) { const rows = await fetchFrame("us-gaap", "CommonStockSharesOutstanding", p); for (const r of rows) { const e = gaapByCik.get(r.cik); if (!e || r.end > e.end) gaapByCik.set(r.cik, r); } await sleep(150); }

  const rowsAll = STOCK.map((s) => {
    const cik = cikBySymbol.get(s.sym) ?? null;
    const framesShares = cik ? (deiByCik.get(cik)?.val ?? gaapByCik.get(cik)?.val ?? null) : null;
    const price = priceBySymbol.get(s.sym) ?? null;
    const mc = mcapBySymbol.get(s.sym);
    const yahooFresh = !!mc && mc.as_of === latestMcapAsOf;
    const framesAssembled = framesShares != null && price != null;
    return { symbol: s.sym, cik, yahooFresh, framesAssembled };
  });
  const uncovered182 = rowsAll.filter((r) => !r.yahooFresh && !r.framesAssembled);
  console.log("182건 재확정:", uncovered182.length);

  if (MODE === "required") {
    const recoveryByWindow: Record<string, number> = { w6q: 0, w12q: 0, w20q: 0, wAll: 0 };
    const failReasons: Record<string, number> = { http_error: 0, no_facts_404: 0, no_dei_or_gaap_tag: 0 };
    const gapDays: { symbol: string; endDate: string; gapDays: number; withinOriginal6q: boolean }[] = [];
    let idx = 0;
    for (const r of uncovered182) {
      idx++;
      if (!r.cik) { failReasons.no_facts_404++; continue; }
      const cf = await fetchCompanyFacts(r.cik);
      await sleep(120);
      if (cf == null) { failReasons.http_error++; continue; }
      const latest = latestShare(cf);
      if (latest == null) { failReasons.no_dei_or_gaap_tag++; continue; }
      for (const [w, cutoff] of Object.entries(WINDOW_CUTOFFS)) if (latest.end >= cutoff) recoveryByWindow[w]++;
      const gap = Math.round((Date.parse("2026-08-14") - Date.parse(latest.end)) / 86_400_000);
      gapDays.push({ symbol: r.symbol, endDate: latest.end, gapDays: gap, withinOriginal6q: latest.end >= WINDOW_CUTOFFS.w6q });
      if (idx % 50 === 0) console.log(`required progress ${idx}/${uncovered182.length}`);
    }
    console.log("=== REQUIRED(182) 창별 회복 ===", JSON.stringify(recoveryByWindow));
    console.log("=== REQUIRED 실패 사유별 ===", JSON.stringify(failReasons));
    gapDays.sort((a, b) => a.gapDays - b.gapDays);
    const gaps = gapDays.map((g) => g.gapDays);
    const pct = (arr: number[], p: number) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor((p / 100) * (s.length - 1))]; };
    console.log("=== REQUIRED 회복분 시점간격 ===", JSON.stringify({ n: gaps.length, median: gaps.length ? pct(gaps, 50) : null, p90: gaps.length ? pct(gaps, 90) : null, max: gaps.length ? Math.max(...gaps) : null }));
    const within6q = gapDays.filter((g) => g.withinOriginal6q).length;
    const outside6q = gapDays.filter((g) => !g.withinOriginal6q);
    console.log("within6q:", within6q, "outside6q:", outside6q.length);
    if (outside6q.length) { const og = outside6q.map((g) => g.gapDays); console.log("outside6q gap stats:", JSON.stringify({ median: pct(og, 50), p90: pct(og, 90), max: Math.max(...og) })); }
    writeFileSync("/private/tmp/claude-501/-Users-maegbug-stock-terminal/8ac4e594-069c-4a4e-bc10-d6e60c09ac6f/scratchpad/step1022_required_result.json", JSON.stringify({ recoveryByWindow, failReasons, gapDays }, null, 2));
    console.log("REQUIRED_DONE");
    return;
  }

  // MODE === "existing" — 체크포인트 방식(중단돼도 이어서 실행 가능)
  const existingTargets = rowsAll.filter((r) => r.cik != null && (deiByCik.get(r.cik!) || gaapByCik.get(r.cik!)));
  console.log("existing(기존 frames로 충족된) 대상:", existingTargets.length);

  let checkpoint: { doneSymbols: string[]; improved: { symbol: string; oldEnd: string; newEnd: string; gapDays: number }[] } = { doneSymbols: [], improved: [] };
  if (existsSync(CHECKPOINT)) { checkpoint = JSON.parse(readFileSync(CHECKPOINT, "utf8")); console.log("체크포인트에서 재개:", checkpoint.doneSymbols.length, "완료됨"); }
  const doneSet = new Set(checkpoint.doneSymbols);
  const remaining = existingTargets.filter((r) => !doneSet.has(r.symbol));
  console.log("남은 대상:", remaining.length);

  let idx = checkpoint.doneSymbols.length;
  for (const r of remaining) {
    const cf = await fetchCompanyFacts(r.cik!);
    await sleep(100);
    idx++;
    if (cf) {
      const latest = latestShare(cf);
      const framesLatest = deiByCik.get(r.cik!)?.end ?? gaapByCik.get(r.cik!)?.end;
      if (latest && framesLatest && latest.end > framesLatest) {
        const gapVsFrames = Math.round((Date.parse(latest.end) - Date.parse(framesLatest)) / 86_400_000);
        checkpoint.improved.push({ symbol: r.symbol, oldEnd: framesLatest, newEnd: latest.end, gapDays: gapVsFrames });
      }
    }
    checkpoint.doneSymbols.push(r.symbol);
    if (idx % 200 === 0) {
      writeFileSync(CHECKPOINT, JSON.stringify(checkpoint));
      console.log(`existing progress ${idx}/${existingTargets.length}, improved so far: ${checkpoint.improved.length}`);
    }
  }
  writeFileSync(CHECKPOINT, JSON.stringify(checkpoint));
  console.log("=== EXISTING 전수 결과 ===");
  console.log("checked:", checkpoint.doneSymbols.length, "/", existingTargets.length);
  console.log("improved(더 최신값 존재):", checkpoint.improved.length);
  console.log(JSON.stringify(checkpoint.improved.slice(0, 20)));
  console.log("EXISTING_DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });
