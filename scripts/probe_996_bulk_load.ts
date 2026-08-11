// STEP 996 — SEC 벌크(companyfacts.zip) 1차 적재(신규만). 995의 Range 부분접근 방식을 그대로 재사용.
// 🔴 DB 쓰기 발생: us_fundamentals_snapshot(tag=pre_step996) insert + us_fundamentals 신규행만 insert.
//   기존 us_fundamentals 1,247행은 절대 건드리지 않는다(ignoreDuplicates:true — Postgres ON CONFLICT DO NOTHING,
//   기존 행을 원리적으로 수정 불가능한 방식). us_valuation·us_sector_relative·revdcf_results·lens_* 미접촉.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import zlib from "node:zlib";
import fs from "node:fs";
import crypto from "node:crypto";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers, type DriverResult } from "../lib/revdcf/drivers";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const BULK_URL = "https://www.sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip";
const PROGRESS_FILE = "/tmp/step996_extract_progress.ndjson";

async function rangeGet(start: number, end: number): Promise<Buffer> {
  const r = await fetch(BULK_URL, { headers: { ...UA, Range: `bytes=${start}-${end}` } });
  if (r.status !== 206 && r.status !== 200) throw new Error(`Range fetch failed: HTTP_${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

type CDEntry = { name: string; compressedSize: number; uncompressedSize: number; localHeaderOffset: number; method: number };

async function loadCentralDirectory(): Promise<CDEntry[]> {
  const head = await fetch(BULK_URL, { method: "HEAD", headers: UA });
  const totalLen = Number(head.headers.get("content-length"));
  const tailStart = Math.max(0, totalLen - 65536);
  const tail = await rangeGet(tailStart, totalLen - 1);
  let eocdIdx = -1;
  for (let i = tail.length - 22; i >= 0; i--) { if (tail.readUInt32LE(i) === 0x06054b50) { eocdIdx = i; break; } }
  if (eocdIdx < 0) throw new Error("EOCD not found");
  const cdSize = tail.readUInt32LE(eocdIdx + 12);
  const cdOffset = tail.readUInt32LE(eocdIdx + 16);
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
  console.log(`중앙디렉터리: ${entries.length}개 엔트리`);
  return entries;
}

async function fetchEntry(e: CDEntry): Promise<Buffer> {
  const guardBytes = 30 + 300 + 64;
  const buf = await rangeGet(e.localHeaderOffset, e.localHeaderOffset + guardBytes + e.compressedSize - 1);
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error(`로컬헤더 시그니처 불일치: ${e.name}`);
  const nameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const dataStart = 30 + nameLen + extraLen;
  const compressed = buf.subarray(dataStart, dataStart + e.compressedSize);
  if (e.method === 0) return Buffer.from(compressed);
  if (e.method === 8) return zlib.inflateRawSync(compressed);
  throw new Error(`미지원 압축방식: ${e.name}`);
}

async function getCandidates(sb: ReturnType<typeof createAdminClient>) {
  const mcapRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_market_cap").select("symbol").range(f, f + 999); const c = (data ?? []) as typeof mcapRows; mcapRows.push(...c); if (c.length < 1000) break; }
  const mcapSet = new Set(mcapRows.map((r) => r.symbol.toUpperCase()));
  const cikRows: { symbol: string; cik: number }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_cik_map").select("symbol, cik").range(f, f + 999); const c = (data ?? []) as typeof cikRows; cikRows.push(...c); if (c.length < 1000) break; }
  const fundRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_fundamentals").select("symbol").range(f, f + 999); const c = (data ?? []) as typeof fundRows; fundRows.push(...c); if (c.length < 1000) break; }
  const attemptedSet = new Set(fundRows.map((r) => r.symbol.toUpperCase()));
  const candidates = cikRows.filter((r) => mcapSet.has(r.symbol.toUpperCase()) && !attemptedSet.has(r.symbol.toUpperCase()));
  return { candidates, currentFundamentalsCount: fundRows.length, fundUniverseSize: cikRows.filter((r) => mcapSet.has(r.symbol.toUpperCase())).length };
}

async function fingerprint(sb: ReturnType<typeof createAdminClient>): Promise<{ perSymbol: Map<string, string>; overall: string }> {
  const rows: Record<string, unknown>[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_fundamentals").select("*").range(f, f + 999).order("symbol", { ascending: true });
    const c = (data ?? []) as Record<string, unknown>[];
    rows.push(...c);
    if (c.length < 1000) break;
  }
  const perSymbol = new Map<string, string>();
  for (const r of rows) {
    const s = JSON.stringify(r, Object.keys(r).sort());
    perSymbol.set(r.symbol as string, crypto.createHash("md5").update(s).digest("hex"));
  }
  const overall = crypto.createHash("md5").update([...perSymbol.entries()].sort().map(([k, v]) => `${k}:${v}`).join("|")).digest("hex");
  return { perSymbol, overall };
}

async function main() {
  const mode = process.argv[2] ?? "count";
  const sb = createAdminClient();

  if (mode === "count") {
    const { candidates, currentFundamentalsCount, fundUniverseSize } = await getCandidates(sb);
    console.log("\n=== §1-1 COUNT ===");
    console.log(JSON.stringify({ fundUniverseSize, currentFundamentalsCount, candidatesNeverAttempted: candidates.length }, null, 2));
    return;
  }

  if (mode === "fingerprint-before" || mode === "fingerprint-after") {
    const fp = await fingerprint(sb);
    const outFile = mode === "fingerprint-before" ? "/tmp/step996_fp_before.json" : "/tmp/step996_fp_after.json";
    fs.writeFileSync(outFile, JSON.stringify({ overall: fp.overall, count: fp.perSymbol.size, perSymbol: Object.fromEntries(fp.perSymbol) }, null, 2));
    console.log(`${mode}: count=${fp.perSymbol.size} overall_md5=${fp.overall} → ${outFile}`);
    return;
  }

  if (mode === "snapshot") {
    const rows: Record<string, unknown>[] = [];
    for (let f = 0; ; f += 1000) { const { data } = await sb.from("us_fundamentals").select("symbol,cik,fiscal_year,net_income,equity,revenue,operating_income,dna,debt,non_operating_assets,shares,source_tags,unavailable_reason,fetched_at").range(f, f + 999); const c = (data ?? []) as Record<string, unknown>[]; rows.push(...c); if (c.length < 1000) break; }
    const snapshotRows = rows.map((r) => ({ ...r, snapshot_tag: "pre_step996", captured_at: new Date().toISOString() }));
    let saved = 0;
    for (let i = 0; i < snapshotRows.length; i += 500) {
      const batch = snapshotRows.slice(i, i + 500);
      const { error } = await sb.from("us_fundamentals_snapshot").insert(batch);
      if (error) throw error;
      saved += batch.length;
    }
    console.log(`스냅샷 완료: ${saved}행 → us_fundamentals_snapshot(tag=pre_step996)`);
    return;
  }

  if (mode === "extract") {
    const { candidates } = await getCandidates(sb);
    console.log(`후보 ${candidates.length}건 — 추출 시작(진행상황: ${PROGRESS_FILE})`);
    const done = new Set<string>();
    if (fs.existsSync(PROGRESS_FILE)) {
      for (const line of fs.readFileSync(PROGRESS_FILE, "utf-8").split("\n")) { if (!line.trim()) continue; try { done.add(JSON.parse(line).symbol); } catch { /* skip malformed */ } }
      console.log(`이어받기: 이미 처리된 ${done.size}건 스킵`);
    }
    const entries = await loadCentralDirectory();
    const byName = new Map(entries.map((e) => [e.name, e]));
    const out = fs.createWriteStream(PROGRESS_FILE, { flags: "a" });
    let lastCall = 0;
    const throttle = async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };
    const t0 = Date.now();
    let processed = 0, okCount = 0, fyCount = 0, notInBulk = 0;
    const skipReasons: Record<string, number> = {};
    for (const c of candidates) {
      if (done.has(c.symbol)) continue;
      await throttle();
      const entryName = `CIK${String(c.cik).padStart(10, "0")}.json`;
      const entry = byName.get(entryName);
      let rec: Record<string, unknown>;
      if (!entry) {
        notInBulk++;
        rec = { symbol: c.symbol, cik: c.cik, notInBulk: true };
      } else {
        try {
          const buf = await fetchEntry(entry);
          const j = JSON.parse(buf.toString("utf-8"));
          const dr: DriverResult = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
          const f = dr.fundamentals;
          const market = dr.ok ? dr.market : null;
          if (dr.fundamentals.fiscalYear != null) fyCount++;
          if (dr.ok) okCount++; else skipReasons[dr.skipReason] = (skipReasons[dr.skipReason] ?? 0) + 1;
          rec = {
            symbol: c.symbol, cik: c.cik,
            fiscal_year: f.fiscalYear, net_income: f.netIncome, equity: f.equity, revenue: f.revenue, operating_income: f.operatingIncome, dna: f.dna,
            common_equity: f.commonEquity, preferred_stock: f.preferredStock, minority_interest: f.minorityInterest,
            debt: market ? market.debt : null, non_operating_assets: market ? market.nonOperatingAssets : null, shares: market ? market.shares : null,
            source_tags: f.sourceTags, unavailable_reason: dr.ok ? null : dr.skipReason,
          };
        } catch (e) {
          rec = { symbol: c.symbol, cik: c.cik, error: String((e as Error).message).slice(0, 100) };
        }
      }
      out.write(JSON.stringify(rec) + "\n");
      processed++;
      if (processed % 200 === 0) console.log(`  ${processed}/${candidates.length - done.size} 진행, 경과 ${Math.round((Date.now() - t0) / 1000)}s`);
    }
    out.end();
    const elapsedSec = Math.round((Date.now() - t0) / 1000);
    console.log("\n=== §2-2/§2-3 EXTRACT SUMMARY ===");
    console.log(JSON.stringify({ candidatesTotal: candidates.length, newlyProcessed: processed, elapsedSec, notInBulk, okCount, fyCount, skipReasons }, null, 2));
    return;
  }

  if (mode === "load") {
    if (!fs.existsSync(PROGRESS_FILE)) throw new Error("추출 결과 파일 없음 — extract 먼저 실행");
    const lines = fs.readFileSync(PROGRESS_FILE, "utf-8").split("\n").filter((l) => l.trim());
    const records = lines.map((l) => JSON.parse(l)).filter((r) => !r.notInBulk && !r.error);
    console.log(`적재 대상(신규 계산 성공): ${records.length}건 / 전체 라인 ${lines.length}건(bulk에 없음·에러 제외)`);
    const rows = records.map((r) => ({ ...r, fetched_at: new Date().toISOString() }));

    const before = (await sb.from("us_fundamentals").select("*", { count: "exact", head: true })).count ?? 0;
    let attempted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      // 🔴 upsert + ignoreDuplicates:true = Postgres ON CONFLICT(symbol) DO NOTHING — 기존 행을
      //   원리적으로 수정 불가능한 방식으로 "신규만 삽입, 충돌은 건너뛴다"를 구현(단순 insert()는
      //   배치 내 단 1건 충돌만으로 전체 배치가 실패해 부분성공을 구분 못함 — 이 방식이 더 안전).
      const { error } = await sb.from("us_fundamentals").upsert(batch, { onConflict: "symbol", ignoreDuplicates: true });
      if (error) throw error;
      attempted += batch.length;
      console.log(`  적재 ${Math.min(i + 500, rows.length)}/${rows.length}`);
    }
    const after = (await sb.from("us_fundamentals").select("*", { count: "exact", head: true })).count ?? 0;
    console.log("\n=== §3-1 LOAD SUMMARY ===");
    console.log(JSON.stringify({ beforeCount: before, afterCount: after, attempted, actuallyInserted: after - before, skippedConflicts: attempted - (after - before) }, null, 2));
    return;
  }

  if (mode === "verify") {
    const { data: fyData, count: totalCount } = await sb.from("us_fundamentals").select("fiscal_year", { count: "exact" });
    const fyCount = (fyData ?? []).filter((r: { fiscal_year: number | null }) => r.fiscal_year != null).length;
    const jpm = await sb.from("us_fundamentals").select("*").eq("symbol", "JPM").maybeSingle();
    const valCount = (await sb.from("us_valuation").select("*", { count: "exact", head: true })).count;
    const secRelCount = (await sb.from("us_sector_relative").select("*", { count: "exact", head: true })).count;
    const revdcfCount = (await sb.from("revdcf_results").select("*", { count: "exact", head: true })).count;
    console.log("\n=== §3-2/§3-3 VERIFY SUMMARY ===");
    console.log(JSON.stringify({
      us_fundamentals_total: totalCount, us_fundamentals_fiscalYearNotNull: fyCount,
      jpmPresent: !!jpm.data, jpmRow: jpm.data,
      us_valuation_total_allTime: valCount, us_sector_relative_total_allTime: secRelCount, revdcf_results_total_allTime: revdcfCount,
    }, null, 2));
    return;
  }
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
