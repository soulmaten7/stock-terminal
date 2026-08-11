// STEP 994 §2 — throttle 수정 전후 발행 타이밍 실측(60건 이상, 초대형주 포함).
// 🔴 DB 쓰기 0 — route.ts를 실행하지 않고 동일 로직을 재현. SEC 실호출·130ms 간격 준수.
// 실행: npx tsx scripts/probe_994_throttle_timing.ts
import { computeDrivers } from "../lib/revdcf/drivers";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

type Sample = { kind: string; cik: number; sym: string };

const SAMPLE: Sample[] = [
  // 993 표본 17건(재사용, apples-to-apples)
  { kind: "revdcf", cik: 1800, sym: "ABT" }, { kind: "revdcf", cik: 2488, sym: "AMD" },
  { kind: "revdcf", cik: 2969, sym: "APD" }, { kind: "revdcf", cik: 3570, sym: "LNG" },
  { kind: "revdcf", cik: 4127, sym: "SWKS" }, { kind: "revdcf", cik: 4281, sym: "HWM" },
  { kind: "rest_heavy", cik: 1046179, sym: "TSM" }, { kind: "rest_heavy", cik: 1181412, sym: "SPCX" },
  { kind: "rest_heavy", cik: 1067983, sym: "BRK-B" }, { kind: "rest_heavy", cik: 2120882, sym: "SKHY" },
  { kind: "rest_heavy", cik: 19617, sym: "JPM" },
  { kind: "rest_light", cik: 1020710, sym: "DXPE" }, { kind: "rest_light", cik: 1565687, sym: "INTA" },
  { kind: "rest_light", cik: 1693256, sym: "WTTR" }, { kind: "rest_light", cik: 98677, sym: "TR" },
  { kind: "rest_light", cik: 827876, sym: "CLSK" }, { kind: "rest_light", cik: 1819790, sym: "TARS" },
  // 🔴 STEP 994 §2-3 — 초대형주 6종 필수 포함(604 유니버스 내 실재 확인됨, 993에서 AAPL·MSFT만 검증했음)
  { kind: "megacap", cik: 320193, sym: "AAPL" }, { kind: "megacap", cik: 789019, sym: "MSFT" },
  { kind: "megacap", cik: 1018724, sym: "AMZN" }, { kind: "megacap", cik: 1045810, sym: "NVDA" },
  { kind: "megacap", cik: 1326801, sym: "META" }, { kind: "megacap", cik: 1652044, sym: "GOOGL" },
  // 신규 revdcf 18건
  { kind: "revdcf", cik: 4457, sym: "UHAL-B" }, { kind: "revdcf", cik: 4904, sym: "AEP" },
  { kind: "revdcf", cik: 6201, sym: "AAL" }, { kind: "revdcf", cik: 6281, sym: "ADI" },
  { kind: "revdcf", cik: 6951, sym: "AMAT" }, { kind: "revdcf", cik: 7084, sym: "ADM" },
  { kind: "revdcf", cik: 7536, sym: "ARW" }, { kind: "revdcf", cik: 8670, sym: "ADP" },
  { kind: "revdcf", cik: 8818, sym: "AVY" }, { kind: "revdcf", cik: 9389, sym: "BALL" },
  { kind: "revdcf", cik: 10456, sym: "BAX" }, { kind: "revdcf", cik: 10795, sym: "BDX" },
  { kind: "revdcf", cik: 12927, sym: "BA" }, { kind: "revdcf", cik: 14272, sym: "BMY" },
  { kind: "revdcf", cik: 14693, sym: "BF-B" }, { kind: "revdcf", cik: 15615, sym: "MTZ" },
  { kind: "revdcf", cik: 16058, sym: "CACI" }, { kind: "revdcf", cik: 16918, sym: "STZ" },
  // 신규 rest 25건(초대형 12 + 중형 13, 전부 never-fetched 후보)
  { kind: "rest_heavy", cik: 2115436, sym: "XOM" }, { kind: "rest_heavy", cik: 70858, sym: "BAC" },
  { kind: "rest_heavy", cik: 731766, sym: "UNH" }, { kind: "rest_heavy", cik: 1089113, sym: "HSBC" },
  { kind: "rest_heavy", cik: 895421, sym: "MS" }, { kind: "rest_heavy", cik: 1577552, sym: "BABA" },
  { kind: "rest_heavy", cik: 886982, sym: "GS" }, { kind: "rest_heavy", cik: 1114448, sym: "NVS" },
  { kind: "rest_heavy", cik: 1000275, sym: "RY" }, { kind: "rest_heavy", cik: 72971, sym: "WFC" },
  { kind: "rest_heavy", cik: 901832, sym: "AZN" }, { kind: "rest_heavy", cik: 67088, sym: "MUFG" },
  { kind: "rest_mid", cik: 2230, sym: "ADX" }, { kind: "rest_mid", cik: 3197, sym: "CECO" },
  { kind: "rest_mid", cik: 3453, sym: "MATX" }, { kind: "rest_mid", cik: 3499, sym: "ALX" },
  { kind: "rest_mid", cik: 6955, sym: "EPAC" }, { kind: "rest_mid", cik: 7431, sym: "AWI" },
  { kind: "rest_mid", cik: 7789, sym: "ASB" }, { kind: "rest_mid", cik: 8063, sym: "ATRO" },
  { kind: "rest_mid", cik: 8858, sym: "AVT" }, { kind: "rest_mid", cik: 8947, sym: "AZZ" },
  { kind: "rest_mid", cik: 9092, sym: "BMI" }, { kind: "rest_mid", cik: 9326, sym: "BCPC" },
  { kind: "rest_mid", cik: 12659, sym: "HRB" },
];

const wall = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);

type ItemResult = {
  kind: string; cik: number; sym: string; ok: boolean; status?: number;
  contentLength: number | null;
  throttleWaitMs: number; fetchMs: number; jsonParseMs: number; computeMs: number; totalMs: number;
  issuedAtMs: number;
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
        headers: UA, signal: AbortSignal.timeout(25000),
      }), 30000
    );
  } catch (e) {
    const tErr = Date.now();
    return { kind: item.kind, cik: item.cik, sym: item.sym, ok: false, contentLength: null, throttleWaitMs, fetchMs: tErr - tIssue, jsonParseMs: 0, computeMs: 0, totalMs: tErr - tThrottleStart, issuedAtMs: tIssue - t0 };
  }
  const tFetched = Date.now();
  const fetchMs = tFetched - tIssue;
  if (!r.ok) {
    return { kind: item.kind, cik: item.cik, sym: item.sym, ok: false, status: r.status, contentLength: null, throttleWaitMs, fetchMs, jsonParseMs: 0, computeMs: 0, totalMs: tFetched - tThrottleStart, issuedAtMs: tIssue - t0 };
  }
  const contentLength = r.headers.get("content-length") ? Number(r.headers.get("content-length")) : null;
  const tParseStart = Date.now();
  const j = (await wall(r.json(), 25000)) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
  const tParsed = Date.now();
  const jsonParseMs = tParsed - tParseStart;
  const tComputeStart = Date.now();
  computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
  const tComputeEnd = Date.now();
  const computeMs = tComputeEnd - tComputeStart;
  return {
    kind: item.kind, cik: item.cik, sym: item.sym, ok: true, contentLength,
    throttleWaitMs, fetchMs, jsonParseMs, computeMs, totalMs: tComputeEnd - tThrottleStart,
    issuedAtMs: tIssue - t0,
  };
}

function stats(nums: number[]) {
  if (nums.length === 0) return { n: 0, avg: 0, median: 0, p90: 0, max: 0 };
  const s = [...nums].sort((a, b) => a - b);
  const avg = s.reduce((a, b) => a + b, 0) / s.length;
  return { n: s.length, avg: Math.round(avg), median: s[Math.floor(s.length / 2)], p90: s[Math.min(s.length - 1, Math.floor(s.length * 0.9))], max: s[s.length - 1] };
}

// 🔴 OLD(버그) throttle — 993이 발견한 그대로, 대조용으로만 재현(route.ts엔 이미 없음)
function makeOldThrottle() {
  let lastCall = 0;
  return async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };
}
// 🔴 NEW(수정) throttle — route.ts와 완전히 동일한 로직(994 §1-1)
function makeNewThrottle() {
  let nextAt = 0;
  return async () => {
    const myTurn = Math.max(nextAt, Date.now());
    nextAt = myTurn + 130;
    const w = myTurn - Date.now();
    if (w > 0) await new Promise((r) => setTimeout(r, w));
  };
}

async function runPool(label: string, throttleFn: () => Promise<void>) {
  const t0 = Date.now();
  let idx = 0;
  const results: ItemResult[] = [];
  async function worker() {
    while (idx < SAMPLE.length) {
      const item = SAMPLE[idx++];
      const res = await fetchOne(item, throttleFn, t0);
      results.push(res);
      console.log(`[${label}] ${item.kind} ${item.sym}(CIK${item.cik}) ok=${res.ok} issuedAt=${res.issuedAtMs}ms fetch=${res.fetchMs}ms parse=${res.jsonParseMs}ms bytes=${res.contentLength}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  const wallMs = Date.now() - t0;
  const okCount = results.filter((r) => r.ok).length;
  const times = results.map((r) => r.issuedAtMs).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
  return {
    label, wallMs, okCount, failCount: results.length - okCount,
    impliedThroughputItemsPerSec: SAMPLE.length / (wallMs / 1000),
    issuanceGapStats: stats(gaps),
    issuanceTimeline: results.slice().sort((a, b) => a.issuedAtMs - b.issuedAtMs).map((r) => ({ issuedAtMs: r.issuedAtMs, sym: r.sym, kind: r.kind })),
    perItem: results,
    megacapTiming: results.filter((r) => r.kind === "megacap"),
  };
}

async function main() {
  console.log(`=== 표본 ${SAMPLE.length}건(초대형주 6 포함) ===`);
  const before = await runPool("OLD(버그)", makeOldThrottle());
  const after = await runPool("NEW(수정)", makeNewThrottle());
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({ sampleSize: SAMPLE.length, before, after }, null, 2));
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
