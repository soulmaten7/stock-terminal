// STEP 1054 §2-1 — revdcf/fundamentals 실제 모집단 확정 + 캐시 대조 + 부족분 SEC 비용 실측(타이밍 샘플).
// DB 쓰기 0. 읽기만.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";

const CACHE_DIR = "docs/probe_951_cache";
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

async function main() {
  const sb = createAdminClient();
  const rows = await fetchAllRows<{ symbol: string; cik: number }>(
    () => sb.from("us_fundamentals").select("symbol, cik"),
    [{ column: "symbol" }]
  );
  const population = rows.filter((r) => r.cik != null);
  console.log(`us_fundamentals 전체 행수: ${rows.length}, cik 보유: ${population.length}`);

  const cacheFiles = new Set(fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
  console.log(`캐시 파일수: ${cacheFiles.size}`);

  const inBoth = population.filter((r) => cacheFiles.has(r.symbol));
  const shortfall = population.filter((r) => !cacheFiles.has(r.symbol));
  const cacheNotInPop = [...cacheFiles].filter((s) => !population.some((r) => r.symbol === s));
  console.log(`모집단∩캐시: ${inBoth.length}, 부족분(모집단−캐시): ${shortfall.length}, 캐시에만있음(모집단밖): ${cacheNotInPop.length}`);

  // 타이밍 샘플 — 부족분 중 15건을 실제로 SEC에서 받아 초당 처리량을 실측(150ms 간격 + 실다운로드시간).
  const sampleN = 15;
  const sample = shortfall.slice(0, sampleN);
  const timings: number[] = [];
  const sizes: number[] = [];
  let sampleErrors = 0;
  for (const { symbol, cik } of sample) {
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`;
    const t0 = Date.now();
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (!res.ok) { sampleErrors++; continue; }
      const buf = await res.arrayBuffer();
      const dt = Date.now() - t0;
      timings.push(dt);
      sizes.push(buf.byteLength);
      console.log(`${symbol}: ${dt}ms, ${(buf.byteLength / 1024 / 1024).toFixed(2)}MB`);
    } catch (e) {
      sampleErrors++;
      console.log(`${symbol}: 오류 ${String((e as Error).message).slice(0, 60)}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  const avgMs = timings.length ? timings.reduce((a, b) => a + b, 0) / timings.length : 0;
  const avgSizeMB = sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length / 1024 / 1024 : 0;
  const perReqTotalMs = avgMs + 150; // 다운로드 + 간격
  const shortfallEtaSec = (shortfall.length * perReqTotalMs) / 1000;

  console.log("=== 타이밍 결과 ===");
  console.log(`샘플 ${sample.length}건 중 오류 ${sampleErrors}건`);
  console.log(`평균 다운로드시간: ${avgMs.toFixed(0)}ms, 평균 파일크기: ${avgSizeMB.toFixed(2)}MB`);
  console.log(`요청당 총 소요(다운로드+150ms 간격): ${perReqTotalMs.toFixed(0)}ms`);
  console.log(`부족분 ${shortfall.length}건 전수 수집 예상시간: ${shortfallEtaSec.toFixed(0)}초 (${(shortfallEtaSec / 60).toFixed(1)}분)`);
  console.log(`부족분 전량 예상 다운로드량: ${((shortfall.length * avgSizeMB)).toFixed(0)}MB (${(shortfall.length * avgSizeMB / 1024).toFixed(2)}GB)`);

  fs.writeFileSync(
    "docs/probe_1054_population.json",
    JSON.stringify(
      {
        populationTotal: rows.length,
        populationWithCik: population.length,
        cacheFileCount: cacheFiles.size,
        overlap: inBoth.length,
        shortfallCount: shortfall.length,
        cacheNotInPopulationCount: cacheNotInPop.length,
        cacheNotInPopulationSample: cacheNotInPop.slice(0, 20),
        timingSample: { n: sample.length, errors: sampleErrors, avgMs, avgSizeMB, perReqTotalMs, shortfallEtaSec, shortfallEtaMin: shortfallEtaSec / 60 },
        shortfallSymbols: shortfall.map((r) => r.symbol),
      },
      null,
      2
    )
  );
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
