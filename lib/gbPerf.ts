// 영국 전종목(FTSE 350 349종목) 1주~6개월 수익률 백그라운드 미리계산 → gb_stock_perf 테이블에 일괄 저장.
// gb-list가 이 값을 조인해 내려줌(요청 시점 lazy chart 호출 제거). 크론(/api/cron/gb-perf)이 하루 1회 호출.
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import symbols from "../data/gb_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string };
const STOCK_SYMS: string[] = (symbols as Sym[]).map((s) => s.sym);

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) {
      const cur = idx++;
      out[cur] = await fn(arr[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

type PerfRow = { symbol: string; r1d: number | null; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null; price: number | null; amount: number | null; r1y: number | null };

export async function computeGbPerf(): Promise<{ ok: true; computed: number; at: string }> {
  const period1 = new Date(Date.now() - 280 * 24 * 60 * 60 * 1000);

  const results = await mapLimit(STOCK_SYMS, 12, async (sym): Promise<PerfRow | null> => {
    try {
      const ch = await yf.chart(sym, { period1, interval: "1d" });
      const bars = (ch.quotes ?? []) as Array<{ close: number | null; volume: number | null }>;
      const closes = bars
        .map((b) => b.close)
        .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
      if (closes.length < 6) return null;
      const price = closes[closes.length - 1];
      const lastVol = bars[bars.length - 1]?.volume ?? null;
      return {
        symbol: sym,
        r1d: ret(closes, 1),
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
        r1y: ret(closes, 252),
        price,
        amount: lastVol != null && lastVol > 0 ? price * lastVol : null,
      };
    } catch {
      return null;
    }
  });

  const rows = results.filter((r): r is PerfRow => r !== null);
  const at = new Date().toISOString();
  const payload = rows.map((r) => ({ ...r, updated_at: at }));

  const sb = createAdminClient();
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("gb_stock_perf").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }

  return { ok: true, computed: payload.length, at };
}
