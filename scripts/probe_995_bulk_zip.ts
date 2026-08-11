// STEP 995 §1~§3 — SEC companyfacts.zip(1.4GB)을 HTTP Range로 부분 접근(전체 다운로드·압축해제 안 함).
// 🔴 DB 쓰기 0. 로컬 디스크에 zip을 저장하지 않는다 — 필요한 바이트 범위만 그때그때 받는다.
// ZIP 포맷을 직접 파싱(EOCD → 중앙디렉터리 → 개별 로컬헤더+DEFLATE), 외부 zip 라이브러리 미사용
// (원격 파일을 Range로 읽는 요구에 맞는 라이브러리가 없어 표준 포맷을 최소 구현).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import zlib from "node:zlib";
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers, type DriverResult } from "../lib/revdcf/drivers";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" }; // route.ts의 UA 상수와 동일 문자열 재사용
const BULK_URL = "https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip";
const CACHE_DIR = "docs/probe_951_cache";

async function rangeGet(start: number, end: number): Promise<Buffer> {
  const r = await fetch(BULK_URL, { headers: { ...UA, Range: `bytes=${start}-${end}` } });
  if (r.status !== 206 && r.status !== 200) throw new Error(`Range fetch failed: HTTP_${r.status}`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

type CDEntry = { name: string; compressedSize: number; uncompressedSize: number; localHeaderOffset: number; method: number };

async function loadCentralDirectory(totalLen: number): Promise<CDEntry[]> {
  // 1) 꼬리 64KB에서 EOCD(0x06054b50) 탐색
  const tailStart = Math.max(0, totalLen - 65536);
  const tail = await rangeGet(tailStart, totalLen - 1);
  let eocdIdx = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail.readUInt32LE(i) === 0x06054b50) { eocdIdx = i; break; }
  }
  if (eocdIdx < 0) throw new Error("EOCD not found in tail 64KB — 코멘트가 더 길거나 ZIP64 가능성");
  const totalEntries = tail.readUInt16LE(eocdIdx + 10);
  const cdSize = tail.readUInt32LE(eocdIdx + 12);
  const cdOffset = tail.readUInt32LE(eocdIdx + 16);
  console.log(`EOCD: entries=${totalEntries} cdSize=${cdSize} cdOffset=${cdOffset}`);
  if (totalEntries === 0xffff || cdOffset === 0xffffffff) throw new Error("ZIP64 표지 감지 — 이 스크립트는 32비트 EOCD만 지원(미구현)");

  // 2) 중앙 디렉터리 전체를 한 번에 Range로 받는다(엔트리 목록 확보 — 개별 파일 데이터는 아직 안 받음)
  const cdBuf = await rangeGet(cdOffset, cdOffset + cdSize - 1);
  const entries: CDEntry[] = [];
  let p = 0;
  while (p < cdBuf.length) {
    const sig = cdBuf.readUInt32LE(p);
    if (sig !== 0x02014b50) break;
    const method = cdBuf.readUInt16LE(p + 10);
    const compressedSize = cdBuf.readUInt32LE(p + 20);
    const uncompressedSize = cdBuf.readUInt32LE(p + 24);
    const nameLen = cdBuf.readUInt16LE(p + 28);
    const extraLen = cdBuf.readUInt16LE(p + 30);
    const commentLen = cdBuf.readUInt16LE(p + 32);
    const localHeaderOffset = cdBuf.readUInt32LE(p + 42);
    const name = cdBuf.toString("utf-8", p + 46, p + 46 + nameLen);
    entries.push({ name, compressedSize, uncompressedSize, localHeaderOffset, method });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function fetchEntry(e: CDEntry): Promise<Buffer> {
  // 로컬헤더 30바이트 고정 + 파일명 + extra(보통 짧음) — 넉넉히 30+300+64를 함께 받고 실제 오프셋을 로컬헤더에서 계산
  const guardBytes = 30 + 300 + 64;
  const buf = await rangeGet(e.localHeaderOffset, e.localHeaderOffset + guardBytes + e.compressedSize - 1);
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error(`로컬헤더 시그니처 불일치: ${e.name}`);
  const nameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const dataStart = 30 + nameLen + extraLen;
  const compressed = buf.subarray(dataStart, dataStart + e.compressedSize);
  if (e.method === 0) return Buffer.from(compressed); // STORED
  if (e.method === 8) return zlib.inflateRawSync(compressed); // DEFLATE
  throw new Error(`미지원 압축방식(method=${e.method}): ${e.name}`);
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] ?? "inventory";

  const head = await fetch(BULK_URL, { method: "HEAD", headers: UA });
  const totalLen = Number(head.headers.get("content-length"));
  const lastModified = head.headers.get("last-modified");
  console.log(`§1-2 HEAD: content-length=${totalLen}(${(totalLen / 1e9).toFixed(3)}GB) last-modified=${lastModified} accept-ranges=${head.headers.get("accept-ranges")}`);

  const entries = await loadCentralDirectory(totalLen);
  const sizes = entries.map((e) => e.uncompressedSize);
  const compSizes = entries.map((e) => e.compressedSize);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const inventory = {
    totalLen, lastModified,
    entryCount: entries.length,
    uncompressed: { totalBytes: sum(sizes), avgBytes: Math.round(sum(sizes) / entries.length), maxBytes: Math.max(...sizes), minBytes: Math.min(...sizes) },
    compressed: { totalBytes: sum(compSizes), avgBytes: Math.round(sum(compSizes) / entries.length), maxBytes: Math.max(...compSizes) },
    sampleNames: entries.slice(0, 5).map((e) => e.name),
    fullExtractWouldNeedBytes: sum(sizes),
  };
  console.log("§1-3 중앙디렉터리 인벤토리:", JSON.stringify(inventory, null, 2));
  fs.writeFileSync("/tmp/step995_cd_inventory.json", JSON.stringify(inventory, null, 2));
  fs.writeFileSync("/tmp/step995_cd_entries_names.json", JSON.stringify(entries.map((e) => e.name)));

  if (mode === "inventory") return;

  if (mode === "compare") {
    const symbolsArg = args[1]; // comma-separated symbols
    const symbols = symbolsArg.split(",");
    const sb = createAdminClient();
    const { data: cikRows } = await sb.from("us_cik_map").select("symbol, cik").in("symbol", symbols);
    const cikBySym = new Map((cikRows ?? []).map((r: { symbol: string; cik: number }) => [r.symbol, r.cik]));
    const byName = new Map(entries.map((e) => [e.name, e]));

    const results: Record<string, unknown>[] = [];
    for (const sym of symbols) {
      const cik = cikBySym.get(sym);
      if (!cik) { results.push({ sym, error: "NO_CIK_MAPPING" }); continue; }
      const entryName = `CIK${String(cik).padStart(10, "0")}.json`;
      const entry = byName.get(entryName);
      if (!entry) { results.push({ sym, cik, error: "NOT_IN_BULK_ZIP", triedName: entryName }); continue; }
      const bulkBuf = await fetchEntry(entry);
      const bulkJson = JSON.parse(bulkBuf.toString("utf-8"));
      const bulkDr: DriverResult = computeDrivers(bulkJson.facts?.["us-gaap"] ?? {}, bulkJson.facts?.["dei"] ?? {});

      const cachePath = `${CACHE_DIR}/${sym}.json`;
      let apiDr: DriverResult | null = null;
      let apiCacheExists = fs.existsSync(cachePath);
      if (apiCacheExists) {
        const apiJson = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
        apiDr = computeDrivers(apiJson.facts?.["us-gaap"] ?? {}, apiJson.facts?.["dei"] ?? {});
      }
      const bulkStr = JSON.stringify(bulkDr, Object.keys(bulkDr).sort());
      const apiStr = apiDr ? JSON.stringify(apiDr, Object.keys(apiDr).sort()) : null;
      results.push({
        sym, cik, apiCacheExists,
        match: apiStr != null ? bulkStr === apiStr : "NO_API_CACHE_TO_COMPARE",
        bulkOk: bulkDr.ok, bulkSkipReason: bulkDr.ok ? null : bulkDr.skipReason,
        apiOk: apiDr ? apiDr.ok : null, apiSkipReason: apiDr && !apiDr.ok ? apiDr.skipReason : null,
        bulkStr: apiStr != null && bulkStr !== apiStr ? bulkStr : undefined,
        apiStrDiff: apiStr != null && bulkStr !== apiStr ? apiStr : undefined,
      });
      console.log(`[compare] ${sym} match=${results[results.length - 1].match} bulkOk=${bulkDr.ok}`);
    }
    fs.writeFileSync("/tmp/step995_compare_results.json", JSON.stringify(results, null, 2));
    console.log("\n=== COMPARE SUMMARY ===");
    console.log(JSON.stringify(results.map((r) => ({ sym: r.sym, match: r.match, bulkOk: r.bulkOk, apiCacheExists: r.apiCacheExists })), null, 2));
  }

  if (mode === "coverage2") {
    // §3-1/§3-3 — 실제 조달 범위(mcap∩cik, 993의 "5,972" 근사=5,893)와 NEVER_ATTEMPTED(993 핵심 그룹) 기준 커버리지
    const sb = createAdminClient();
    const mcapRows: { symbol: string }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
    const mcapSet = new Set(mcapRows.map((r) => r.symbol.toUpperCase()));
    const cikRows: { symbol: string; cik: number }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
    const fundUniverse = cikRows.filter((r) => mcapSet.has(r.symbol.toUpperCase()));
    const fundRows: { symbol: string }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_fundamentals").select("symbol").range(f, f + 999); const c = (data ?? []) as typeof fundRows; fundRows.push(...c); if (c.length < 1000) break; }
    const attemptedSet = new Set(fundRows.map((r) => r.symbol.toUpperCase()));
    const neverAttempted = fundUniverse.filter((r) => !attemptedSet.has(r.symbol.toUpperCase()));

    const bulkNameSet = new Set(entries.map((e) => e.name));
    const inBulk = (cik: number) => bulkNameSet.has(`CIK${String(cik).padStart(10, "0")}.json`);

    const fundCovered = fundUniverse.filter((r) => inBulk(r.cik)).length;
    const neverAttemptedCovered = neverAttempted.filter((r) => inBulk(r.cik)).length;
    const jpmRow = cikRows.find((r) => r.symbol.toUpperCase() === "JPM");

    console.log("\n=== COVERAGE2 SUMMARY ===");
    console.log(JSON.stringify({
      fundUniverseTotal: fundUniverse.length,
      fundUniverseCoveredInBulk: fundCovered,
      fundUniverseCoveragePct: +(fundCovered / fundUniverse.length * 100).toFixed(2),
      neverAttemptedTotal: neverAttempted.length,
      neverAttemptedCoveredInBulk: neverAttemptedCovered,
      neverAttemptedCoveragePct: +(neverAttemptedCovered / neverAttempted.length * 100).toFixed(2),
      currentUsFundamentalsRows: fundRows.length,
      projectedTotalIfBulkLoaded: fundCovered,
      multipleOfCurrent: +(fundCovered / fundRows.length).toFixed(2),
      jpmInBulk: jpmRow ? inBulk(jpmRow.cik) : "JPM_NOT_IN_CIK_MAP",
    }, null, 2));
  }

  if (mode === "fiscalyear-sample") {
    // §3-2 — never-attempted∩bulk-covered 중 200건 표본으로 fiscal_year 확정 가능 비율 추정(전수 아님, 표본)
    const sb = createAdminClient();
    const mcapRows: { symbol: string }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
    const mcapSet = new Set(mcapRows.map((r) => r.symbol.toUpperCase()));
    const cikRows: { symbol: string; cik: number }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
    const fundRows: { symbol: string }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_fundamentals").select("symbol").range(f, f + 999); const c = (data ?? []) as typeof fundRows; fundRows.push(...c); if (c.length < 1000) break; }
    const attemptedSet = new Set(fundRows.map((r) => r.symbol.toUpperCase()));
    const bulkNameSet = new Set(entries.map((e) => e.name));
    const byName = new Map(entries.map((e) => [e.name, e]));

    const candidates = cikRows.filter((r) => mcapSet.has(r.symbol.toUpperCase()) && !attemptedSet.has(r.symbol.toUpperCase()) && bulkNameSet.has(`CIK${String(r.cik).padStart(10, "0")}.json`));
    console.log(`후보(never-attempted ∩ bulk-covered) 전체: ${candidates.length}건 — 이 중 균등 간격 200건 표본 추출`);
    const step = Math.max(1, Math.floor(candidates.length / 200));
    const sample = candidates.filter((_, i) => i % step === 0).slice(0, 200);

    let okCount = 0, fyCount = 0;
    const skipReasons: Record<string, number> = {};
    let lastCall = 0;
    const throttle = async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };
    for (const c of sample) {
      await throttle();
      const entry = byName.get(`CIK${String(c.cik).padStart(10, "0")}.json`)!;
      try {
        const buf = await fetchEntry(entry);
        const j = JSON.parse(buf.toString("utf-8"));
        const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
        if (dr.fundamentals.fiscalYear != null) fyCount++;
        if (dr.ok) okCount++;
        else skipReasons[dr.skipReason] = (skipReasons[dr.skipReason] ?? 0) + 1;
      } catch (e) {
        skipReasons["FETCH_OR_PARSE_ERROR"] = (skipReasons["FETCH_OR_PARSE_ERROR"] ?? 0) + 1;
      }
    }
    console.log("\n=== FISCAL_YEAR SAMPLE SUMMARY(표본 기준 추정, 전수 아님) ===");
    console.log(JSON.stringify({
      candidatePoolSize: candidates.length,
      sampleSize: sample.length,
      fiscalYearResolvedCount: fyCount,
      fiscalYearResolvedPct: +(fyCount / sample.length * 100).toFixed(1),
      driverOkCount: okCount,
      driverOkPct: +(okCount / sample.length * 100).toFixed(1),
      skipReasons,
      projectedFiscalYearResolvedInFullCandidatePool: Math.round(candidates.length * (fyCount / sample.length)),
    }, null, 2));
  }

  if (mode === "coverage") {
    // §3-1: us_cik_map 전체와 대조해 벌크가 우리 유니버스 몇 건을 커버하는지
    const sb = createAdminClient();
    const cikRows: { symbol: string; cik: number }[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
    const bulkNameSet = new Set(entries.map((e) => e.name));
    let covered = 0, notCovered = 0;
    const notCoveredSymbols: string[] = [];
    for (const r of cikRows) {
      const name = `CIK${String(r.cik).padStart(10, "0")}.json`;
      if (bulkNameSet.has(name)) covered++;
      else { notCovered++; if (notCoveredSymbols.length < 50) notCoveredSymbols.push(r.symbol); }
    }
    console.log(`\n=== COVERAGE SUMMARY (us_cik_map 전체 ${cikRows.length}건 기준) ===`);
    console.log(JSON.stringify({ totalCikMapRows: cikRows.length, coveredInBulk: covered, notCoveredInBulk: notCovered, notCoveredSample: notCoveredSymbols }, null, 2));
    fs.writeFileSync("/tmp/step995_coverage.json", JSON.stringify({ totalCikMapRows: cikRows.length, coveredInBulk: covered, notCoveredInBulk: notCovered, notCoveredSymbols }, null, 2));
  }
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
