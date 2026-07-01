// 중화권(홍콩·상해·심천·ETF) 1주~6개월 수익률 백그라운드 미리계산 → cn_stock_perf 테이블 일괄 저장.
// cn-list가 이 값을 조인해 내려줌(요청 시점 lazy chart 호출 제거). 크론(/api/cron/cn-perf)이 하루 1회 호출.
// jpPerf.ts와 동일 규칙(상대경로 import: Next 빌드 + 독립 tsx 양쪽 동작).
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import symbols from "../data/cn_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// data/cn_symbols.json: [{ sym, name, market }] — 전 종목(홍콩·상해·심천·ETF) 대상
type Sym = { sym: string; name: string; market: string };
const ALL_SYMS: string[] = (symbols as Sym[]).map((s) => s.sym);

// daysAgo 거래일 전 종가 대비 수익률(%)
function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

// 동시 호출 제한 — 야후 레이트리밋/타임아웃 방지
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

type PerfRow = { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };

export async function computeCnPerf(): Promise<{ ok: true; computed: number; at: string }> {
  // 약 280 달력일 룩백 — 6개월(126 거래일) + 비거래일 버퍼 충분
  const period1 = new Date(Date.now() - 280 * 24 * 60 * 60 * 1000);

  const results = await mapLimit(ALL_SYMS, 12, async (sym): Promise<PerfRow | null> => {
    try {
      const ch = await yf.chart(sym, { period1, interval: "1d" });
      const quotes = (ch.quotes ?? []) as Array<{ close: number | null }>;
      const closes = quotes
        .map((q) => q.close)
        .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
      if (closes.length < 6) return null; // 1주(5거래일)도 못 채우면 스킵
      return {
        symbol: sym,
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
      };
    } catch {
      return null;
    }
  });

  const rows = results.filter((r): r is PerfRow => r !== null);
  const at = new Date().toISOString();
  const payload = rows.map((r) => ({ ...r, updated_at: at }));

  const sb = createAdminClient(); // RLS 우회(쓰기)
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("cn_stock_perf").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }

  return { ok: true, computed: payload.length, at };
}
