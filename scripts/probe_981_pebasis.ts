// STEP 981 §1-3 — US 유니버스(lens_scores market=US)에서 peBasis(ttm/annual/둘다없음) 분포 실측.
// 🔴 조사 전용 — DB 쓰기 0. lensCompute.ts:144-146과 정확히 같은 필드(quote.trailingPE)만 읽는다(로직 복제 아님, 동일 소스 재확인).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

async function main() {
  const sb = createAdminClient();
  const symbols: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").order("symbol").range(from, from + 999);
    const rows = (data ?? []) as { symbol: string }[];
    symbols.push(...rows.map((r) => r.symbol));
    if (rows.length < 1000) break;
  }
  console.log(`대상 ${symbols.length}종목`);

  let ttm = 0, nullBoth = 0, errored = 0;
  const errSymbols: string[] = [];
  await mapLimit(symbols, 8, async (sym) => {
    try {
      const q = await yf.quote(sym);
      const pe = (q as { trailingPE?: number }).trailingPE ?? null;
      if (pe != null) ttm++; else nullBoth++; // trailingPE 없으면 lensCompute.ts:241의 annual 폴백 분기로 들어감(peBasis="annual" 또는 그마저 없으면 na)
    } catch { errored++; errSymbols.push(sym); }
  });

  const result = { universe: symbols.length, trailingPeAvailable: ttm, trailingPeNull_fallbackTriggered: nullBoth, quoteErrored: errored, errSymbols: errSymbols.slice(0, 20) };
  console.log(JSON.stringify(result, null, 2));
  require("fs").writeFileSync("docs/probe_981_pebasis_output.json", JSON.stringify(result, null, 2));
}

main();
