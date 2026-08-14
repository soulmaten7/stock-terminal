// STEP 1020 — 96.95% 결합 커버리지의 안정성 + 못 채운 종목 전수 + 주식수 결측 사유별 + 복수클래스 실익.
// 🔴 읽기 전용 프로브. DB 쓰기 0. SEC frames API(계정당 전 기업, 이미 확인된 좌표) 재사용.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import usSymbolsData from "../data/us_symbols.json";
import { readFileSync, existsSync } from "fs";

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

  type UsSym = { sym: string; name: string; type: string };
  const ALL = usSymbolsData as UsSym[];
  const STOCK_SYMS = ALL.filter((s) => s.type === "stock").map((s) => s.sym);
  const nameBySym = new Map(ALL.map((s) => [s.sym, s.name]));
  console.log("universe:", STOCK_SYMS.length);

  const cikRows: { symbol: string; cik: number }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999);
    const c = (data ?? []) as typeof cikRows;
    cikRows.push(...c);
    if (c.length < 1000) break;
  }
  const cikBySymbol = new Map(cikRows.map((r) => [r.symbol.toUpperCase(), r.cik]));
  const symsByCik = new Map<number, string[]>();
  for (const r of cikRows) { const l = symsByCik.get(r.cik) ?? []; l.push(r.symbol.toUpperCase()); symsByCik.set(r.cik, l); }
  const multiClassCiks = new Set([...symsByCik.entries()].filter(([, s]) => s.length >= 2).map(([c]) => c));

  const priceRows: { symbol: string; price: number | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_stock_perf").select("symbol, price").range(f, f + 999);
    const c = (data ?? []) as typeof priceRows;
    priceRows.push(...c);
    if (c.length < 1000) break;
  }
  const priceBySymbol = new Map(priceRows.map((r) => [r.symbol.toUpperCase(), r.price]));

  const mcapRows: { symbol: string; market_cap: number; as_of: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_market_cap").select("symbol, market_cap, as_of").range(f, f + 999);
    const c = (data ?? []) as typeof mcapRows;
    mcapRows.push(...c);
    if (c.length < 1000) break;
  }
  const mcapBySymbol = new Map(mcapRows.map((r) => [r.symbol.toUpperCase(), r]));
  const latestMcapAsOf = mcapRows.reduce<string | null>((mx, r) => (mx == null || r.as_of > mx ? r.as_of : mx), null);

  // === 1-1: as_of 분포로 "역산 가능한가" 확인 ===
  const asOfCounts = new Map<string, number>();
  for (const r of mcapRows) asOfCounts.set(r.as_of, (asOfCounts.get(r.as_of) ?? 0) + 1);
  console.log("=== us_market_cap as_of 분포(현재 스냅샷) ===");
  console.log(JSON.stringify([...asOfCounts.entries()].sort()));
  console.log("🔴 결론: 이 분포는 '현재 시점 기준 각 심볼이 마지막으로 성공한 날짜'다.");
  console.log("   과거 특정일에 신선했던 심볼 중 '그 이후에도 계속 신선했던' 것들은 오늘 as_of=최신으로 찍혀");
  console.log("   과거 시점의 실제 fresh 집합을 알 수 없다 — 진짜 시계열 재구성은 원리적으로 불가.");

  // === dei/us-gaap frames ===
  const periods = ["CY2026Q2I", "CY2026Q1I", "CY2025Q4I", "CY2025Q3I", "CY2025Q2I", "CY2025Q1I"];
  const deiByCik = new Map<number, FrameRow>();
  for (const p of periods) {
    const rows = await fetchFrame("dei", "EntityCommonStockSharesOutstanding", "shares", p);
    for (const r of rows) { const e = deiByCik.get(r.cik); if (!e || r.end > e.end) deiByCik.set(r.cik, r); }
    await new Promise((res) => setTimeout(res, 200));
  }
  const gaapByCik = new Map<number, FrameRow>();
  for (const p of periods) {
    const rows = await fetchFrame("us-gaap", "CommonStockSharesOutstanding", "shares", p);
    for (const r of rows) { const e = gaapByCik.get(r.cik); if (!e || r.end > e.end) gaapByCik.set(r.cik, r); }
    await new Promise((res) => setTimeout(res, 200));
  }
  console.log("dei CIK:", deiByCik.size, "gaap CIK:", gaapByCik.size);

  type Row = {
    symbol: string; name: string; cik: number | null; multiClass: boolean;
    shares: number | null; price: number | null; assembled: number | null;
    yahooFresh: boolean; yahooAny: boolean;
  };
  const rows: Row[] = STOCK_SYMS.map((sym) => {
    const cik = cikBySymbol.get(sym) ?? null;
    const dei = cik ? deiByCik.get(cik) : undefined;
    const gaap = cik ? gaapByCik.get(cik) : undefined;
    const shares = dei?.val ?? gaap?.val ?? null;
    const price = priceBySymbol.get(sym) ?? null;
    const assembled = shares != null && price != null ? shares * price : null;
    const mc = mcapBySymbol.get(sym);
    return { symbol: sym, name: nameBySym.get(sym) ?? "", cik, multiClass: cik ? multiClassCiks.has(cik) : false, shares, price, assembled, yahooFresh: !!mc && mc.as_of === latestMcapAsOf, yahooAny: !!mc };
  });

  // === 1-2: 결합 방식으로도 못 채우는 종목 전수 ===
  const uncovered = rows.filter((r) => !r.yahooFresh && r.assembled == null);
  console.log("=== 1-2 미충족 종목 전수 ===");
  for (const r of uncovered) {
    const reason = !r.cik ? "CIK없음" : r.price == null ? "가격없음" : r.shares == null ? "주식수없음" : "기타";
    console.log(JSON.stringify({ symbol: r.symbol, name: r.name, cik: r.cik, multiClass: r.multiClass, reason, hasPriceButNoShares: r.price != null && r.shares == null }));
  }
  console.log("uncovered count:", uncovered.length);
  console.log("combined coverage recompute:", ((STOCK_SYMS.length - uncovered.length) / STOCK_SYMS.length) * 100);

  // === 1-3: 주식수 결측 사유별 ===
  const noShares = rows.filter((r) => r.shares == null);
  const noSharesNoCik = noShares.filter((r) => !r.cik);
  const noSharesWithCik = noShares.filter((r) => r.cik);
  const noSharesYahooFresh = noShares.filter((r) => r.yahooFresh);
  const noSharesYahooAny = noShares.filter((r) => r.yahooAny);
  const noSharesAndYahooMissing = noShares.filter((r) => !r.yahooFresh);
  console.log("=== 1-3 주식수 결측 사유별 ===");
  console.log(JSON.stringify({
    total: noShares.length, noCik: noSharesNoCik.length, hasCikNoTag: noSharesWithCik.length,
    yahooFreshAnyway: noSharesYahooFresh.length, yahooAnyStale: noSharesYahooAny.length - noSharesYahooFresh.length,
    trueGapBoth: noSharesAndYahooMissing.length,
  }));

  // 로컬 캐시로 샘플 대조 — "frames가 놓쳤을 뿐 실제론 태그가 있는가" 확인
  const cacheDir = "docs/probe_951_cache";
  let cacheChecked = 0, cacheHasDeiTag = 0, cacheNoDeiTag = 0, cacheFileNotFound = 0;
  const sampleMissing = noSharesWithCik.slice(0, 60); // 로컬 캐시에 있을 법한 만큼만 샘플(대형주 위주로 캐시됨)
  for (const r of sampleMissing) {
    const path = `${cacheDir}/${r.symbol}.json`;
    if (!existsSync(path)) { cacheFileNotFound++; continue; }
    cacheChecked++;
    try {
      const j = JSON.parse(readFileSync(path, "utf8"));
      const hasTag = !!j?.facts?.dei?.EntityCommonStockSharesOutstanding || !!j?.facts?.["us-gaap"]?.CommonStockSharesOutstanding;
      if (hasTag) cacheHasDeiTag++; else cacheNoDeiTag++;
    } catch { cacheFileNotFound++; }
  }
  console.log("=== 로컬캐시 샘플대조(frames 누락 vs 진짜 없음) ===");
  console.log(JSON.stringify({ sampleSize: sampleMissing.length, cacheFileNotFound, cacheChecked, cacheHasDeiTag_meaning_frames_missed_it: cacheHasDeiTag, cacheNoDeiTag_meaning_genuinely_absent: cacheNoDeiTag }));

  // === 1-4: 복수클래스 737건 ===
  const multiClassAssembled = rows.filter((r) => r.multiClass && r.assembled != null);
  const multiClassUncoveredByYahoo = multiClassAssembled.filter((r) => !r.yahooFresh);
  console.log("=== 1-4 복수클래스 ===");
  console.log(JSON.stringify({
    multiClassAssembledTotal: multiClassAssembled.length,
    multiClassAlreadyYahooFresh: multiClassAssembled.length - multiClassUncoveredByYahoo.length,
    multiClassInGapCohort: multiClassUncoveredByYahoo.length,
  }));
  // companyfacts 차원분해 여부 — 캐시 샘플로 확인(멀티클래스 심볼 중 캐시에 있는 것)
  const multiClassSample = multiClassAssembled.filter((r) => existsSync(`${cacheDir}/${r.symbol}.json`)).slice(0, 20);
  let dimCheckedN = 0, dimFound = 0;
  for (const r of multiClassSample) {
    dimCheckedN++;
    try {
      const j = JSON.parse(readFileSync(`${cacheDir}/${r.symbol}.json`, "utf8"));
      const units = j?.facts?.dei?.EntityCommonStockSharesOutstanding?.units?.shares ?? [];
      const hasDim = Array.isArray(units) && units.some((u: unknown) => u && typeof u === "object" && "segment" in (u as object));
      if (hasDim) dimFound++;
    } catch { /* skip */ }
  }
  console.log("=== 복수클래스 companyfacts 차원(segment) 존재 여부 샘플 ===");
  console.log(JSON.stringify({ sampleN: dimCheckedN, hasSegmentDim: dimFound }));

  console.log("DONE");
}

main().catch((e) => { console.error(e); process.exit(1); });
