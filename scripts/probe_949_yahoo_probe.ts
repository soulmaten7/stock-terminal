// STEP 949 §1 — us_market_cap 결측(STALE 380 + ABSENT 85 = 465건) 원인 진단. 조사 전용, 운영 경로 아님.
// 🔴 lib/lensPrecompute.ts의 topByMarketCap()과 동일한 방식(같은 yahoo-finance2 인스턴스·배치 100·동시성 6·개별재시도 동시성 6)으로
//   물어본다. 조건을 바꾸면 "우리 파이프라인이 못 받는 것"인지 "야후가 안 주는 것"인지 안 갈린다.
// 🔴 DB에 쓰지 않는다. 읽기와 야후 조회만.
// 실행: npx tsx scripts/probe_949_yahoo_probe.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const INPUT_FILE = "/private/tmp/claude-501/-Users-maegbug-stock-terminal/8ac4e594-069c-4a4e-bc10-d6e60c09ac6f/scratchpad/probe949_input.json";
const OUTPUT_FILE = "/private/tmp/claude-501/-Users-maegbug-stock-terminal/8ac4e594-069c-4a4e-bc10-d6e60c09ac6f/scratchpad/probe949_yahoo_result.json";

// lib/lensPrecompute.ts:23 — 동일 워커풀 패턴(그대로 복붙, 로직 변경 없음)
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) {
      const cur = idx++;
      out[cur] = await fn(arr[cur], cur);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

type Row = {
  symbol: string;
  batchResponded: boolean;
  batchMarketCap: number | null;
  singleAttempted: boolean;
  singleResponded: boolean | null;
  singleMarketCap: number | null;
  errorKind: "rate_limited_or_timeout" | "no_data" | "other_error" | "none";
  errorMsg: string;
};

function classifyErr(msg: string): "rate_limited_or_timeout" | "no_data" | "other_error" {
  const lower = msg.toLowerCase();
  if (/429|rate|timeout|timed out/.test(lower)) return "rate_limited_or_timeout";
  if (/not found|404|no fundamentals|quote not found|invalid/.test(lower)) return "no_data";
  return "other_error";
}

// lensPrecompute.ts:112-122 — Stage 1 배치, 동일 청크(100)·동시성(6).
async function probeGroup(symbols: string[], label: string): Promise<Map<string, Row>> {
  const rows = new Map<string, Row>(symbols.map((s) => [s, {
    symbol: s, batchResponded: false, batchMarketCap: null,
    singleAttempted: false, singleResponded: null, singleMarketCap: null,
    errorKind: "none", errorMsg: "",
  }]));

  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += 100) chunks.push(symbols.slice(i, i + 100));

  await mapLimit(chunks, 6, async (grp) => {
    try {
      const qs = (await yf.quote(grp)) as Array<{ symbol?: string; marketCap?: number }>;
      for (const q of Array.isArray(qs) ? qs : []) {
        if (!q?.symbol) continue;
        const r = rows.get(q.symbol);
        if (!r) continue; // 요청 안 한 심볼이 섞여 오면 무시(발생 안 해야 정상)
        r.batchResponded = true;
        r.batchMarketCap = typeof q.marketCap === "number" ? q.marketCap : null;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // 청크 전체 실패 — 이 청크의 전 심볼에 errorKind 기록(lensPrecompute는 failedChunks++만 하고 심볼별 기록은 안 하지만,
      // 이 진단 스크립트는 어느 심볼이 어느 청크에서 실패했는지 알아야 하므로 심볼별로도 남긴다).
      const kind = classifyErr(msg);
      for (const s of grp) { const r = rows.get(s)!; r.errorKind = kind; r.errorMsg = msg.slice(0, 200); }
    }
  });

  // lensPrecompute.ts:130-156 — Stage 2, 배치에서 marketCap 못 받은 것만 개별 재시도(동시성 6). 조건 그대로.
  const needsRetry = symbols.filter((s) => { const r = rows.get(s)!; return r.batchMarketCap == null; });
  await mapLimit(needsRetry, 6, async (sym) => {
    const r = rows.get(sym)!;
    r.singleAttempted = true;
    try {
      const q = (await yf.quote(sym)) as { marketCap?: number };
      r.singleResponded = true;
      r.singleMarketCap = typeof q?.marketCap === "number" ? q.marketCap : null;
      if (r.singleMarketCap == null) { r.errorKind = "none"; r.errorMsg = "responded, no marketCap field"; }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      r.singleResponded = false;
      r.errorKind = classifyErr(msg);
      r.errorMsg = msg.slice(0, 200);
    }
  });

  console.log(`[${label}] 완료 — ${symbols.length}건`);
  return rows;
}

async function main() {
  const input = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8")) as { target: string[]; control: string[] };
  console.log(`target(STALE+ABSENT) ${input.target.length}건 · control(OK 사전순 100) ${input.control.length}건`);

  const t0 = Date.now();
  const targetRows = await probeGroup(input.target, "target");
  const controlRows = await probeGroup(input.control, "control");
  const elapsedMs = Date.now() - t0;

  const out = {
    measuredAt: new Date().toISOString(),
    elapsedMs,
    target: [...targetRows.values()],
    control: [...controlRows.values()],
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out));
  console.log(`저장 완료: ${OUTPUT_FILE} (elapsed ${elapsedMs}ms)`);
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
