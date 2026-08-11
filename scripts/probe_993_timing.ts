// STEP 993 §2-4 — revdcf 크론(app/api/cron/revdcf/route.ts)의 SEC 취득 루프를 로컬에서 실제로 1회 계측.
// 🔴 DB 쓰기 0(계산·계측만) — 이 파일은 그 route.ts의 코드를 "실행"하지 않고 같은 로직을 별도 스크립트로
//   재현해 타이밍만 잰다(원본 코드 무변경). SEC 호출은 실제로 하되 route.ts와 동일한 throttle(130ms)을 지킨다.
// 실행: npx tsx scripts/probe_993_timing.ts
import { computeDrivers } from "../lib/revdcf/drivers";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

type Sample = { kind: "revdcf" | "rest_heavy" | "rest_light"; cik: number; sym: string };

// STEP993 §2-4 — DB에서 뽑은 실제 CIK 표본(revdcf 유니버스 6 + rest 미수집 후보 heavy 5 + light 6 = 17)
const SAMPLE: Sample[] = [
  { kind: "revdcf", cik: 1800, sym: "ABT" },
  { kind: "revdcf", cik: 2488, sym: "AMD" },
  { kind: "revdcf", cik: 2969, sym: "APD" },
  { kind: "revdcf", cik: 3570, sym: "LNG" },
  { kind: "revdcf", cik: 4127, sym: "SWKS" },
  { kind: "revdcf", cik: 4281, sym: "HWM" },
  { kind: "rest_heavy", cik: 1046179, sym: "TSM" },
  { kind: "rest_heavy", cik: 1181412, sym: "SPCX" },
  { kind: "rest_heavy", cik: 1067983, sym: "BRK-B" },
  { kind: "rest_heavy", cik: 2120882, sym: "SKHY" },
  { kind: "rest_heavy", cik: 19617, sym: "JPM" },
  { kind: "rest_light", cik: 1020710, sym: "DXPE" },
  { kind: "rest_light", cik: 1565687, sym: "INTA" },
  { kind: "rest_light", cik: 1693256, sym: "WTTR" },
  { kind: "rest_light", cik: 98677, sym: "TR" },
  { kind: "rest_light", cik: 827876, sym: "CLSK" },
  { kind: "rest_light", cik: 1819790, sym: "TARS" },
];

const wall = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);

type ItemResult = {
  kind: string; cik: number; sym: string; ok: boolean; status?: number;
  contentLength: number | null;
  throttleWaitMs: number; fetchMs: number; jsonParseMs: number; computeMs: number; totalMs: number;
  driverOk?: boolean; skipReason?: string | null;
  issuedAtMs: number; // t0-relative — 실제 fetch 발행 시각(전역 throttle 검증용)
};

async function fetchOne(item: Sample, throttleFn: () => Promise<void>, t0: number): Promise<ItemResult> {
  const tThrottleStart = Date.now();
  await throttleFn();
  const tIssue = Date.now();
  const throttleWaitMs = tIssue - tThrottleStart;
  let r: Response;
  try {
    r = await wall(
      fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(item.cik).padStart(10, "0")}.json`, {
        headers: UA,
        signal: AbortSignal.timeout(20000),
      }),
      25000
    );
  } catch (e) {
    const tErr = Date.now();
    return { kind: item.kind, cik: item.cik, sym: item.sym, ok: false, contentLength: null, throttleWaitMs, fetchMs: tErr - tIssue, jsonParseMs: 0, computeMs: 0, totalMs: tErr - tThrottleStart, issuedAtMs: tIssue - t0, skipReason: `FETCH_EX:${String((e as Error).message).slice(0, 60)}` };
  }
  const tFetched = Date.now();
  const fetchMs = tFetched - tIssue;
  if (!r.ok) {
    return { kind: item.kind, cik: item.cik, sym: item.sym, ok: false, status: r.status, contentLength: null, throttleWaitMs, fetchMs, jsonParseMs: 0, computeMs: 0, totalMs: tFetched - tThrottleStart, issuedAtMs: tIssue - t0 };
  }
  const contentLength = r.headers.get("content-length") ? Number(r.headers.get("content-length")) : null;
  const tParseStart = Date.now();
  const j = (await wall(r.json(), 20000)) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
  const tParsed = Date.now();
  const jsonParseMs = tParsed - tParseStart;

  const tComputeStart = Date.now();
  const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
  const tComputeEnd = Date.now();
  const computeMs = tComputeEnd - tComputeStart;

  return {
    kind: item.kind, cik: item.cik, sym: item.sym, ok: true, contentLength,
    throttleWaitMs, fetchMs, jsonParseMs, computeMs, totalMs: tComputeEnd - tThrottleStart,
    driverOk: dr.ok, skipReason: dr.ok ? null : dr.skipReason, issuedAtMs: tIssue - t0,
  };
}

function stats(nums: number[]) {
  if (nums.length === 0) return { n: 0, avg: 0, median: 0, p90: 0, max: 0 };
  const s = [...nums].sort((a, b) => a - b);
  const avg = s.reduce((a, b) => a + b, 0) / s.length;
  const median = s[Math.floor(s.length / 2)];
  const p90 = s[Math.min(s.length - 1, Math.floor(s.length * 0.9))];
  return { n: s.length, avg: Math.round(avg), median, p90, max: s[s.length - 1] };
}

async function main() {
  // ── Phase 1: 순차 실행(개별 구성요소 분해용, throttle=production과 동일 130ms) ──
  let lastCallSeq = 0;
  const throttleSeq = async () => {
    const w = lastCallSeq + 130 - Date.now();
    if (w > 0) await new Promise((r) => setTimeout(r, w));
    lastCallSeq = Date.now();
  };
  const t0seq = Date.now();
  const seqResults: ItemResult[] = [];
  for (const item of SAMPLE) {
    const res = await fetchOne(item, throttleSeq, t0seq);
    seqResults.push(res);
    console.log(`[seq] ${item.kind} ${item.sym}(CIK${item.cik}) ok=${res.ok} throttleWait=${res.throttleWaitMs}ms fetch=${res.fetchMs}ms parse=${res.jsonParseMs}ms compute=${res.computeMs}ms total=${res.totalMs}ms bytes=${res.contentLength}`);
  }
  const seqWallMs = Date.now() - t0seq;

  // ── Phase 2: 동시성 6 워커풀(production과 동일 패턴) — 전역 throttle 공유, 같은 17건 재사용 ──
  let lastCallPool = 0;
  const throttlePool = async () => {
    const w = lastCallPool + 130 - Date.now();
    if (w > 0) await new Promise((r) => setTimeout(r, w));
    lastCallPool = Date.now();
  };
  const t0pool = Date.now();
  let idx = 0;
  const poolResults: ItemResult[] = [];
  async function worker() {
    while (idx < SAMPLE.length) {
      const item = SAMPLE[idx++];
      const res = await fetchOne(item, throttlePool, t0pool);
      poolResults.push(res);
      console.log(`[pool] ${item.kind} ${item.sym}(CIK${item.cik}) ok=${res.ok} issuedAt=${res.issuedAtMs}ms throttleWait=${res.throttleWaitMs}ms fetch=${res.fetchMs}ms parse=${res.jsonParseMs}ms compute=${res.computeMs}ms total=${res.totalMs}ms`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  const poolWallMs = Date.now() - t0pool;

  // ── 집계 ──
  const okSeq = seqResults.filter((r) => r.ok);
  const summary = {
    sampleSize: SAMPLE.length,
    phase1_sequential: {
      wallMs: seqWallMs,
      okCount: okSeq.length,
      failCount: seqResults.length - okSeq.length,
      throttleWaitMs: stats(okSeq.map((r) => r.throttleWaitMs)),
      fetchMs: stats(okSeq.map((r) => r.fetchMs)),
      jsonParseMs: stats(okSeq.map((r) => r.jsonParseMs)),
      computeMs: stats(okSeq.map((r) => r.computeMs)),
      totalMs: stats(okSeq.map((r) => r.totalMs)),
      byteSize: stats(okSeq.map((r) => r.contentLength ?? 0)),
      impliedThroughputItemsPerSec: seqResults.length / (seqWallMs / 1000),
    },
    phase2_pool6: {
      wallMs: poolWallMs,
      okCount: poolResults.filter((r) => r.ok).length,
      failCount: poolResults.filter((r) => !r.ok).length,
      issuedAtMsGaps: (() => {
        const times = poolResults.map((r) => r.issuedAtMs).sort((a, b) => a - b);
        const gaps: number[] = [];
        for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
        return stats(gaps);
      })(),
      impliedThroughputItemsPerSec: SAMPLE.length / (poolWallMs / 1000),
    },
    extrapolation: {
      note: "phase1(순차, 실질 throttle-bound 근사치)과 phase2(pool6, 실질 concurrency 이득 측정) 처리율로 604건·budget 270s를 추정",
    },
    rawSeq: seqResults,
    rawPool: poolResults,
  };

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error("🔴", e);
  process.exit(1);
});
