// STEP 1006 P1 — 야후 엔드포인트별 응답 비교(정지코호트 390건 전수 + 길이분포 매칭 대조군 390건).
// 🔴 조사 전용. us_market_cap 쓰기 0 · lensPrecompute.ts 무수정 · 취득경로 변경 0.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);

// 🔴 994와 같은 함정(check-then-act) 방지 — nextAt을 동기 구간에서 즉시 예약(원자적)
let nextAt = 0;
const MIN_GAP_MS = 200;
async function throttle() {
  const myTurn = Math.max(nextAt, Date.now());
  nextAt = myTurn + MIN_GAP_MS;
  const w = myTurn - Date.now();
  if (w > 0) await new Promise((r) => setTimeout(r, w));
}
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

const lenBucket = (s: string) => (s.length <= 3 ? "le3" : s.length === 4 ? "eq4" : "ge5");

async function main() {
  const sb = createAdminClient();

  const latestAsOf = (await sb.from("us_market_cap").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const rows: { symbol: string; as_of: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_market_cap").select("symbol, as_of").range(f, f + 999);
    const c = (data ?? []) as { symbol: string; as_of: string }[];
    rows.push(...c);
    if (c.length < 1000) break;
  }
  const staleCohort = rows.filter((r) => r.as_of !== latestAsOf.as_of).map((r) => r.symbol);
  const haveSet = new Set(rows.map((r) => r.symbol.toUpperCase()));
  const neverSucceeded = STOCK_SYMS.filter((s) => !haveSet.has(s.toUpperCase()));
  const target = Array.from(new Set([...staleCohort, ...neverSucceeded]));
  const targetLenDist = { le3: 0, eq4: 0, ge5: 0 } as Record<string, number>;
  for (const s of target) targetLenDist[lenBucket(s)]++;

  // 대조군 — 길이분포를 target과 맞춰 fresh(정상취득) 풀에서 뽑는다(무작위 아님, 결정론적: 정렬 후 앞에서부터)
  const freshSyms = rows.filter((r) => r.as_of === latestAsOf.as_of).map((r) => r.symbol).sort();
  const freshByBucket: Record<string, string[]> = { le3: [], eq4: [], ge5: [] };
  for (const s of freshSyms) freshByBucket[lenBucket(s)].push(s);
  const control: string[] = [];
  for (const bucket of ["le3", "eq4", "ge5"] as const) control.push(...freshByBucket[bucket].slice(0, targetLenDist[bucket]));

  console.log(`target(정지코호트 전수) = ${target.length} (stale=${staleCohort.length}, never=${neverSucceeded.length})`);
  console.log(`target 길이분포 =`, targetLenDist);
  console.log(`control(대조군, 길이분포 매칭) = ${control.length}`);

  type EndpointResult = {
    symbol: string;
    quote: { ok: boolean; error?: string; marketCap?: number; regularMarketPrice?: number; sharesOutstanding?: number; quoteType?: string; exchange?: string; fullExchangeName?: string };
    chart: { ok: boolean; error?: string; hasLastClose?: boolean; lastClose?: number };
    quoteSummary: { ok: boolean; error?: string; priceMarketCap?: number; dksSharesOutstanding?: number };
  };

  async function probeOne(symbol: string): Promise<EndpointResult> {
    const result: EndpointResult = { symbol, quote: { ok: false }, chart: { ok: false }, quoteSummary: { ok: false } };

    await throttle();
    try {
      const q = (await yf.quote(symbol)) as { marketCap?: number; regularMarketPrice?: number; sharesOutstanding?: number; quoteType?: string; exchange?: string; fullExchangeName?: string };
      result.quote = { ok: true, marketCap: q?.marketCap, regularMarketPrice: q?.regularMarketPrice, sharesOutstanding: q?.sharesOutstanding, quoteType: q?.quoteType, exchange: q?.exchange, fullExchangeName: q?.fullExchangeName };
    } catch (e) {
      result.quote = { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : String(e) };
    }

    await throttle();
    try {
      const period1 = new Date(Date.now() - 5 * 86400000);
      const c = await yf.chart(symbol, { period1, interval: "1d" });
      const quotes = c?.quotes ?? [];
      const last = quotes.length ? quotes[quotes.length - 1] : null;
      result.chart = { ok: true, hasLastClose: last?.close != null, lastClose: last?.close ?? undefined };
    } catch (e) {
      result.chart = { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : String(e) };
    }

    await throttle();
    try {
      const qs = (await yf.quoteSummary(symbol, { modules: ["price", "defaultKeyStatistics", "summaryDetail"] })) as {
        price?: { marketCap?: number }; defaultKeyStatistics?: { sharesOutstanding?: number };
      };
      result.quoteSummary = { ok: true, priceMarketCap: qs?.price?.marketCap, dksSharesOutstanding: qs?.defaultKeyStatistics?.sharesOutstanding };
    } catch (e) {
      result.quoteSummary = { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : String(e) };
    }

    return result;
  }

  console.log("\n조회 시작(target)...");
  const targetResults = await mapLimit(target, 2, probeOne);
  console.log("조회 시작(control)...");
  const controlResults = await mapLimit(control, 2, probeOne);

  fs.writeFileSync("/tmp/step1006_raw_results.json", JSON.stringify({ targetResults, controlResults }, null, 2));
  console.log("\n원자료 저장: /tmp/step1006_raw_results.json");
}

main().catch((e) => { console.error("🔴", e); process.exit(1); });
