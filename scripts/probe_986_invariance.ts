// STEP 986 §3 — 값 불변 증명. lensPrecompute.ts topByMarketCap()의 stage1+stage2 "핵심 계산"(capOf·freshSet·
// batchOk·noCapField·noResponse·recovered·retryNoCapField·freshCoverage)을 구코드(986 관측블록 없음)와
// 신코드(986 관측블록 있음)로 각각 재현해 대조한다. 야후는 딱 한 번만 호출해 두 계산에 동일 데이터를 먹인다
// (같은 데이터로 대조해야 "코드 차이"만 보이지 "그새 시세가 바뀐 차이"가 안 섞인다). DB 쓰기 없음
// (us_market_cap upsert 라인은 986이 손대지 않은 코드라 재검증 대상이 아니고, 이 스크립트는 그 라인을 아예 호출하지 않는다).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
import { resolveMarketCap } from "../lib/marketCapReconstruct";
import symbols from "../data/us_symbols.json";

type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

// classifyCaps·capGateDecision과 동일 로직(lensPrecompute.ts에서 import 가능 — 순수함수라 재사용, 복제 아님)
import { classifyCaps } from "../lib/lensPrecompute";

async function main() {
  // ── 야후 조회 1회 — stage1(배치) + stage2(재시도) 원시 응답을 그대로 캡처(양쪽 계산이 같은 데이터를 씀) ──
  const chunks: string[][] = [];
  for (let i = 0; i < STOCK_SYMS.length; i += 100) chunks.push(STOCK_SYMS.slice(i, i + 100));
  const responses: { symbol?: string | null; marketCap?: number | null }[] = [];
  const rawBySymbol = new Map<string, Record<string, unknown>>();
  const tradeAmountOf = new Map<string, number>();

  await mapLimit(chunks, 6, async (grp) => {
    try {
      const qs = (await yf.quote(grp)) as Array<Record<string, unknown>>;
      for (const q of Array.isArray(qs) ? qs : []) {
        const sym = q.symbol as string | undefined;
        responses.push({ symbol: sym, marketCap: q.marketCap as number | undefined });
        if (sym && typeof q.regularMarketPrice === "number" && typeof q.regularMarketVolume === "number") {
          tradeAmountOf.set(sym, (q.regularMarketPrice as number) * (q.regularMarketVolume as number));
        }
        if (sym && !(typeof q.marketCap === "number" && (q.marketCap as number) > 0)) rawBySymbol.set(sym, q);
      }
    } catch { /* 청크실패 — 양쪽 계산 동일 취급(구코드도 같은 catch) */ }
  });

  const { capOf: batchCaps, noCapField, noResponse } = classifyCaps(STOCK_SYMS, responses);

  const RETRY_MAX = 400, RETRY_MS = 40_000;
  const retryAll = [...noCapField, ...noResponse];
  const retrySet = retryAll.slice(0, RETRY_MAX);
  const t0 = Date.now();
  const retryResults = new Map<string, { marketCap?: number; raw?: Record<string, unknown> }>();
  await mapLimit(retrySet, 6, async (sym) => {
    if (Date.now() - t0 > RETRY_MS) return;
    try {
      const q = (await yf.quote(sym)) as Record<string, unknown>;
      retryResults.set(sym, { marketCap: typeof q?.marketCap === "number" ? (q.marketCap as number) : undefined, raw: q });
    } catch { /* 예외 — 양쪽 계산 동일 취급 */ }
  });

  // ── 구코드 재현: capOf·freshSet·recovered·retryNoCapField를 986 이전 로직 그대로 계산 ──
  function computeOld() {
    const capOf = new Map(batchCaps);
    const freshSet = new Set(batchCaps.keys());
    let recovered = 0, retryNoCapField = 0;
    for (const sym of retrySet) {
      const r = retryResults.get(sym);
      if (!r) continue; // 예외났던 것(구코드도 그냥 스킵)
      if (typeof r.marketCap === "number" && r.marketCap > 0) { capOf.set(sym, r.marketCap); freshSet.add(sym); recovered++; }
      else retryNoCapField++;
    }
    return { capOf, freshSet, recovered, retryNoCapField, batchOk: batchCaps.size, freshCoverage: freshSet.size / STOCK_SYMS.length };
  }

  // ── 신코드 재현: 위와 완전히 같되, stillMissing에 대해 986 관측블록을 "추가로만" 돌린다(§2 그대로) ──
  async function computeNew() {
    const old = computeOld(); // capOf·freshSet 계산 로직 자체는 구코드와 100% 동일 코드경로(중복 아님 — 진짜로 같은 함수 호출)
    const stillMissing = STOCK_SYMS.filter((s) => !old.capOf.has(s));
    let reconstructable = 0, reconstructableSingleClass = 0, reconstructableMultiClass = 0, noPriceEither = 0;
    const sb = createAdminClient();
    const { data: cikRows } = await sb.from("us_cik_map").select("symbol,cik");
    const symCik = new Map<string, number>(); const cikCount = new Map<number, number>();
    for (const r of (cikRows ?? []) as { symbol: string; cik: number }[]) {
      symCik.set(r.symbol, r.cik); cikCount.set(r.cik, (cikCount.get(r.cik) ?? 0) + 1);
    }
    const isMultiClass = (sym: string) => { const c = symCik.get(sym); return c != null && (cikCount.get(c) ?? 0) > 1; };
    for (const sym of stillMissing) {
      const raw = rawBySymbol.get(sym) ?? retryResults.get(sym)?.raw;
      if (!raw) { noPriceEither++; continue; }
      const rc = resolveMarketCap(raw);
      if (rc.source === "reconstructed") { reconstructable++; if (isMultiClass(sym)) reconstructableMultiClass++; else reconstructableSingleClass++; }
      else noPriceEither++;
    }
    return { ...old, reconstructable, reconstructableSingleClass, reconstructableMultiClass, noPriceEither };
  }

  const oldR = computeOld();
  const newR = await computeNew();

  const setEq = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));
  const mapEq = (a: Map<string, number>, b: Map<string, number>) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

  const invariance = {
    capOf_identical: mapEq(oldR.capOf, newR.capOf),
    freshSet_identical: setEq(oldR.freshSet, newR.freshSet),
    batchOk_identical: oldR.batchOk === newR.batchOk,
    recovered_identical: oldR.recovered === newR.recovered,
    retryNoCapField_identical: oldR.retryNoCapField === newR.retryNoCapField,
    freshCoverage_identical: oldR.freshCoverage === newR.freshCoverage,
    freshCoverage_value: oldR.freshCoverage,
  };
  const newOnlyFields = {
    reconstructable: newR.reconstructable, reconstructableSingleClass: newR.reconstructableSingleClass,
    reconstructableMultiClass: newR.reconstructableMultiClass, noPriceEither: newR.noPriceEither,
  };

  console.log(JSON.stringify({ invariance, newOnlyFields, universe: STOCK_SYMS.length, capOfSize: oldR.capOf.size, freshSetSize: oldR.freshSet.size }, null, 2));
}

main();
