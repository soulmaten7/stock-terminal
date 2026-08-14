// STEP 1019 — SEC dei:EntityCommonStockSharesOutstanding × us_stock_perf.price 로 시총 자체 조립 실현 가능성 실측.
// 🔴 읽기 전용 프로브. DB 쓰기 0. SEC frames API(계정당 전 기업 1콜)만 라이브 호출 — 개별 companyfacts 수천 콜 안 함.
// 실행: npx tsx scripts/probe_1019_sec_marketcap_assembly.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import usSymbolsData from "../data/us_symbols.json";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

type FrameRow = { accn: string; cik: number; entityName: string; loc: string; end: string; val: number };
type FrameResp = { data?: FrameRow[]; pts?: number };

async function fetchFrame(ns: string, tag: string, unit: string, period: string): Promise<FrameRow[]> {
  const url = `https://data.sec.gov/api/xbrl/frames/${ns}/${tag}/${unit}/${period}.json`;
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) { console.log(`  frame ${ns}/${tag}/${period}: HTTP_${r.status}`); return []; }
  const j = (await r.json()) as FrameResp;
  return j.data ?? [];
}

async function main() {
  const sb = createAdminClient();

  // === 유니버스 ===
  type UsSym = { sym: string; name: string; type: string };
  const STOCK_SYMS = (usSymbolsData as UsSym[]).filter((s) => s.type === "stock").map((s) => s.sym);
  console.log("universe(STOCK_SYMS):", STOCK_SYMS.length);

  // === us_cik_map (symbol -> cik) 전량 ===
  const cikRows: { symbol: string; cik: number }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999);
    const c = (data ?? []) as typeof cikRows;
    cikRows.push(...c);
    if (c.length < 1000) break;
  }
  const cikBySymbol = new Map(cikRows.map((r) => [r.symbol.toUpperCase(), r.cik]));
  console.log("us_cik_map rows:", cikRows.length);

  // 복수클래스 판별 — 같은 CIK에 심볼 2개 이상
  const symsByCik = new Map<number, string[]>();
  for (const r of cikRows) {
    const list = symsByCik.get(r.cik) ?? [];
    list.push(r.symbol.toUpperCase());
    symsByCik.set(r.cik, list);
  }
  const multiClassCiks = new Set([...symsByCik.entries()].filter(([, syms]) => syms.length >= 2).map(([cik]) => cik));
  console.log("multi-class CIKs:", multiClassCiks.size);

  // === us_stock_perf.price 전량 ===
  const priceRows: { symbol: string; price: number | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_stock_perf").select("symbol, price").range(f, f + 999);
    const c = (data ?? []) as typeof priceRows;
    priceRows.push(...c);
    if (c.length < 1000) break;
  }
  const priceBySymbol = new Map(priceRows.map((r) => [r.symbol.toUpperCase(), r.price]));
  console.log("us_stock_perf rows:", priceRows.length);

  // === us_market_cap(야후, 대조군) 전량 ===
  const mcapRows: { symbol: string; market_cap: number; as_of: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_market_cap").select("symbol, market_cap, as_of").range(f, f + 999);
    const c = (data ?? []) as typeof mcapRows;
    mcapRows.push(...c);
    if (c.length < 1000) break;
  }
  const mcapBySymbol = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), r]));
  console.log("us_market_cap rows:", mcapRows.length);

  // === SEC frames — dei:EntityCommonStockSharesOutstanding, 최근 여러 분기 병합(최신 end 우선) ===
  const periods = ["CY2026Q2I", "CY2026Q1I", "CY2025Q4I", "CY2025Q3I", "CY2025Q2I", "CY2025Q1I"];
  const deiByCik = new Map<number, FrameRow>();
  for (const p of periods) {
    const rows = await fetchFrame("dei", "EntityCommonStockSharesOutstanding", "shares", p);
    console.log(`dei frame ${p}: ${rows.length} rows`);
    for (const r of rows) {
      const existing = deiByCik.get(r.cik);
      if (!existing || r.end > existing.end) deiByCik.set(r.cik, r);
    }
    await new Promise((res) => setTimeout(res, 200));
  }
  console.log("dei merged unique CIK:", deiByCik.size);

  // === us-gaap:CommonStockSharesOutstanding 보조 태그(병합 별도 카운트만, dei 우선) ===
  const gaapByCik = new Map<number, FrameRow>();
  for (const p of periods) {
    const rows = await fetchFrame("us-gaap", "CommonStockSharesOutstanding", "shares", p);
    console.log(`us-gaap frame ${p}: ${rows.length} rows`);
    for (const r of rows) {
      const existing = gaapByCik.get(r.cik);
      if (!existing || r.end > existing.end) gaapByCik.set(r.cik, r);
    }
    await new Promise((res) => setTimeout(res, 200));
  }
  console.log("us-gaap merged unique CIK:", gaapByCik.size);

  // === noCapField 코호트(오늘 heartbeat note, missingFieldNames는 표본뿐이라 별도 — 대신 us_market_cap 부재로 근사) ===
  // 결측 코호트 근사 = STOCK_SYMS 중 us_market_cap에 행 자체가 없거나 as_of가 낡은 것(오늘 최신 as_of 기준)
  const latestMcapAsOf = mcapRows.reduce<string | null>((mx, r) => (mx == null || r.as_of > mx ? r.as_of : mx), null);

  // === 종목별 조립 ===
  type Row = {
    symbol: string; cik: number | null; multiClass: boolean;
    deiShares: number | null; deiEnd: string | null; gaapOnly: boolean;
    price: number | null; assembled: number | null;
    yahooCap: number | null; yahooFresh: boolean;
    relDiff: number | null;
  };
  const rows: Row[] = [];
  let noCik = 0, noSharesAnySource = 0, deiOnly = 0, gaapOnlyCount = 0, bothCount = 0;
  let noPrice = 0;
  for (const sym of STOCK_SYMS) {
    const cik = cikBySymbol.get(sym) ?? null;
    if (!cik) { noCik++; rows.push({ symbol: sym, cik: null, multiClass: false, deiShares: null, deiEnd: null, gaapOnly: false, price: priceBySymbol.get(sym) ?? null, assembled: null, yahooCap: null, yahooFresh: false, relDiff: null }); continue; }
    const dei = deiByCik.get(cik);
    const gaap = gaapByCik.get(cik);
    const hasDei = !!dei, hasGaap = !!gaap;
    if (hasDei && hasGaap) bothCount++; else if (hasDei) deiOnly++; else if (hasGaap) gaapOnlyCount++; else noSharesAnySource++;
    const shares = dei?.val ?? gaap?.val ?? null;
    const sharesEnd = dei?.end ?? gaap?.end ?? null;
    const price = priceBySymbol.get(sym) ?? null;
    if (price == null) noPrice++;
    const assembled = shares != null && price != null ? shares * price : null;
    const mc = mcapBySymbol.get(sym);
    const yahooCap = mc?.market_cap ?? null;
    const yahooFresh = mc ? mc.as_of === latestMcapAsOf : false;
    const relDiff = assembled != null && yahooCap != null && yahooCap !== 0 ? Math.abs(assembled - yahooCap) / yahooCap : null;
    rows.push({ symbol: sym, cik, multiClass: multiClassCiks.has(cik), deiShares: shares, deiEnd: sharesEnd, gaapOnly: !hasDei && hasGaap, price, assembled, yahooCap, yahooFresh, relDiff });
  }

  console.log("=== 2-1 태그 가용성 ===");
  console.log(JSON.stringify({ noCik, noSharesAnySource, deiOnly, gaapOnlyCount, bothCount, total: STOCK_SYMS.length }));

  const assembledOk = rows.filter((r) => r.assembled != null);
  const assembledOkSingle = assembledOk.filter((r) => !r.multiClass);
  const assembledOkMulti = assembledOk.filter((r) => r.multiClass);
  console.log("=== 2-2 조립 커버리지 ===");
  console.log(JSON.stringify({
    assembledTotal: assembledOk.length, assembledSingleClass: assembledOkSingle.length, assembledMultiClass: assembledOkMulti.length,
    noPrice, noSharesAnySource, coveragePct: (assembledOk.length / STOCK_SYMS.length) * 100,
  }));

  // === 2-3 야후와의 차이(전수·규모별) ===
  const withBoth = rows.filter((r) => r.relDiff != null);
  const pct = (arr: number[], p: number) => { const s = [...arr].sort((a, b) => a - b); const i = Math.floor((p / 100) * (s.length - 1)); return s[i]; };
  const diffs = withBoth.map((r) => r.relDiff!);
  console.log("=== 2-3 전수 차이 ===");
  console.log(JSON.stringify({
    n: diffs.length,
    median: pct(diffs, 50), p90: pct(diffs, 90), p99: pct(diffs, 99),
    over20pct: diffs.filter((d) => d > 0.2).length, over20pctRatio: diffs.filter((d) => d > 0.2).length / diffs.length,
  }));

  const buckets: [string, (v: number) => boolean][] = [
    ["≥100B", (v) => v >= 100e9], ["10-100B", (v) => v >= 10e9 && v < 100e9], ["2-10B", (v) => v >= 2e9 && v < 10e9],
    ["0.3-2B", (v) => v >= 0.3e9 && v < 2e9], ["<0.3B", (v) => v < 0.3e9],
  ];
  console.log("=== 2-3 규모별 ===");
  for (const [label, test] of buckets) {
    const inBucket = withBoth.filter((r) => test(r.yahooCap!));
    const d = inBucket.map((r) => r.relDiff!);
    console.log(JSON.stringify({ bucket: label, n: d.length, median: d.length ? pct(d, 50) : null, p90: d.length ? pct(d, 90) : null, over20pct: d.filter((x) => x > 0.2).length }));
  }

  // 시점 간격(오늘 - end)
  const today = new Date().toISOString().slice(0, 10);
  const endGaps = assembledOk.filter((r) => r.deiEnd).map((r) => Math.round((Date.parse(today) - Date.parse(r.deiEnd!)) / 86_400_000));
  console.log("=== 시점 간격(일) ===");
  console.log(JSON.stringify({ n: endGaps.length, median: pct(endGaps, 50), p90: pct(endGaps, 90), max: Math.max(...endGaps) }));

  // === 2-4 결측 코호트 한정 커버리지 ===
  const missingCohort = STOCK_SYMS.filter((sym) => {
    const mc = mcapBySymbol.get(sym);
    return !mc || mc.as_of !== latestMcapAsOf;
  });
  const missingCohortAssembled = missingCohort.filter((sym) => {
    const r = rows.find((x) => x.symbol === sym);
    return r && r.assembled != null;
  });
  console.log("=== 2-4 결측 코호트 한정 ===");
  console.log(JSON.stringify({
    latestMcapAsOf, missingCohortSize: missingCohort.length,
    missingCohortAssembledCount: missingCohortAssembled.length,
    combinedCoverage: ((mcapRows.filter((r) => r.as_of === latestMcapAsOf).length + missingCohortAssembled.length) / STOCK_SYMS.length) * 100,
  }));

  console.log("DONE");
}

main().catch((e) => { console.error(e); process.exit(1); });
