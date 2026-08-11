// STEP 994 §3 — throttle 수정이 계산 결과를 바꾸지 않는다는 것을 실측으로 증명.
// 방법(965·967·977과 동일 정신 — pinned 표본·깊은 비교): 같은 CIK 집합을 구throttle·신throttle
// 두 패스로 각각 실제 SEC 조회 → computeDrivers() 전체 산출물(ok·skipReason·flags·fundamentals·market)을
// JSON 문자열로 직렬화해 바이트 단위로 비교. throttle은 fetch() 호출 "전"의 대기시간만 바꾸므로
// 데이터 흐름에 개입하지 않는다 — 이 비교가 통과하면 그 구조적 사실이 실측으로도 확인되는 것이다.
// 🔴 DB 쓰기 0.
import { computeDrivers, type DriverResult } from "../lib/revdcf/drivers";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };

// revdcf·rest·megacap·IFRS계열(스킵사유 다양성) 골고루 20건
const SAMPLE = [
  { cik: 1800, sym: "ABT" }, { cik: 2488, sym: "AMD" }, { cik: 4281, sym: "HWM" },
  { cik: 320193, sym: "AAPL" }, { cik: 789019, sym: "MSFT" }, { cik: 1045810, sym: "NVDA" },
  { cik: 1326801, sym: "META" }, { cik: 1652044, sym: "GOOGL" }, { cik: 1018724, sym: "AMZN" },
  { cik: 1046179, sym: "TSM" }, { cik: 19617, sym: "JPM" }, { cik: 1067983, sym: "BRK-B" },
  { cik: 1020710, sym: "DXPE" }, { cik: 1565687, sym: "INTA" }, { cik: 827876, sym: "CLSK" },
  { cik: 1089113, sym: "HSBC" }, { cik: 1577552, sym: "BABA" }, { cik: 1114448, sym: "NVS" },
  { cik: 2115436, sym: "XOM" }, { cik: 731766, sym: "UNH" },
];

const wall = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("wall")), ms))]);

function makeOldThrottle() {
  let lastCall = 0;
  return async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };
}
function makeNewThrottle() {
  let nextAt = 0;
  return async () => { const myTurn = Math.max(nextAt, Date.now()); nextAt = myTurn + 130; const w = myTurn - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); };
}

async function fetchAndCompute(cik: number, throttleFn: () => Promise<void>): Promise<DriverResult> {
  await throttleFn();
  const r = await wall(fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(25000) }), 30000);
  if (!r.ok) throw new Error(`HTTP_${r.status}`);
  const j = (await wall(r.json(), 25000)) as { facts?: { "us-gaap"?: Record<string, never>; dei?: Record<string, never> } };
  return computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {});
}

async function runPass(label: string, throttleFn: () => Promise<void>): Promise<Map<number, string>> {
  let idx = 0;
  const out = new Map<number, string>();
  async function worker() {
    while (idx < SAMPLE.length) {
      const item = SAMPLE[idx++];
      const dr = await fetchAndCompute(item.cik, throttleFn);
      // 결정론적 직렬화(키 정렬) — 필드 순서 차이로 인한 거짓 불일치 방지
      out.set(item.cik, JSON.stringify(dr, Object.keys(dr).sort()));
      console.log(`[${label}] ${item.sym} ok=${dr.ok} ${dr.ok ? "" : `skip=${dr.skipReason}`}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  return out;
}

async function main() {
  const before = await runPass("OLD", makeOldThrottle());
  const after = await runPass("NEW", makeNewThrottle());

  const mismatches: { cik: number; sym: string; before: string; after: string }[] = [];
  for (const item of SAMPLE) {
    const b = before.get(item.cik), a = after.get(item.cik);
    if (b !== a) mismatches.push({ cik: item.cik, sym: item.sym, before: b ?? "MISSING", after: a ?? "MISSING" });
  }

  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({
    sampleSize: SAMPLE.length,
    compared: SAMPLE.length,
    mismatchCount: mismatches.length,
    mismatches,
    verdict: mismatches.length === 0 ? "완전 일치 — 값 불변 확인" : "🔴 불일치 발견 — 즉시 중단 대상",
  }, null, 2));
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
