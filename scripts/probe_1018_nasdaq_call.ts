// STEP 1018 W2 — 나스닥 호출 방식 탐색 (로컬 전용 프로브, 프로덕션 코드 아님).
// 🔴 최대 5회 1차 시도 + 성공 시 2회 재현 확인(총 7회 이내), 호출 간 10초 이상.
// 🔴 lib/nasdaqMarketCap.ts는 이 스크립트가 읽지도 수정하지도 않는다 — 결과만 보고 그 파일 교체 여부는 STEP 판정을 따른다.

const BASE_URL = "https://api.nasdaq.com/api/screener/stocks";
const UA_JSON = { "User-Agent": "Trillion Research admin@onetrillion.app", Accept: "application/json" };

type Attempt = { name: string; url: string; headers: Record<string, string>; timeoutMs: number };

const attempts: Attempt[] = [
  { name: "1_현행그대로(대조군)", url: `${BASE_URL}?tableonly=false&limit=25000&download=true`, headers: UA_JSON, timeoutMs: 20_000 },
  { name: "2_timeout60초", url: `${BASE_URL}?tableonly=false&limit=25000&download=true`, headers: UA_JSON, timeoutMs: 60_000 },
  { name: "3_tableonly_true", url: `${BASE_URL}?tableonly=true&limit=25000&download=true`, headers: UA_JSON, timeoutMs: 20_000 },
  { name: "4_페이지네이션_1000", url: `${BASE_URL}?tableonly=false&limit=1000&offset=0&download=true`, headers: UA_JSON, timeoutMs: 20_000 },
  { name: "5_거래소분할_nasdaq", url: `${BASE_URL}?tableonly=false&limit=25000&exchange=nasdaq&download=true`, headers: UA_JSON, timeoutMs: 20_000 },
];

async function tryOnce(a: Attempt) {
  const t0 = Date.now();
  try {
    const r = await fetch(a.url, { headers: a.headers, signal: AbortSignal.timeout(a.timeoutMs) });
    const elapsedMs = Date.now() - t0;
    const text = await r.text();
    let rowCount: number | null = null;
    try {
      const j = JSON.parse(text) as { data?: { rows?: unknown[] } };
      rowCount = Array.isArray(j?.data?.rows) ? j.data.rows.length : null;
    } catch { /* JSON 파싱 실패 — rowCount는 null로 남긴다 */ }
    return {
      name: a.name, ok: r.ok, status: r.status, elapsedMs, bodyBytes: text.length, rowCount,
      errorReason: null as string | null,
    };
  } catch (e) {
    const elapsedMs = Date.now() - t0;
    return {
      name: a.name, ok: false, status: null, elapsedMs, bodyBytes: null, rowCount: null,
      errorReason: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
    };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const results: unknown[] = [];
  let successAttempt: Attempt | null = null;
  let successResult: Awaited<ReturnType<typeof tryOnce>> | null = null;

  for (let i = 0; i < attempts.length; i++) {
    if (i > 0) await sleep(10_000); // 호출 간 10초 이상
    const res = await tryOnce(attempts[i]);
    results.push(res);
    console.log(JSON.stringify(res));
    if (res.ok && res.rowCount != null && res.rowCount > 0) {
      successAttempt = attempts[i];
      successResult = res;
      break; // 성공하면 즉시 멈춘다
    }
  }

  let reproduced: unknown = null;
  if (successAttempt) {
    await sleep(10_000);
    const r2 = await tryOnce(successAttempt);
    console.log("REPRO_1:", JSON.stringify(r2));
    reproduced = r2.ok && r2.rowCount != null && r2.rowCount > 0;
  }

  console.log("=== SUMMARY ===");
  console.log(JSON.stringify({ results, successAttempt: successAttempt?.name ?? null, reproduced }, null, 2));
}

main();
