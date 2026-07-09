// 미국 전종목(~6,121) 1주~6개월 수익률 백그라운드 미리계산 → us_stock_perf 테이블에 일괄 저장.
// us-list가 이 값을 조인해 내려줌(요청 시점 lazy chart 호출 제거). 크론(/api/cron/us-perf)이 하루 1회 호출.
// 상대경로 import: Next 빌드 + 독립 tsx 양쪽 동작(fss.ts와 동일 규칙).
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import symbols from "../data/us_symbols.json";

// yahooSurvey 안내 로그 억제
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// data/us_symbols.json: [{ sym, name, type }] — 주식만(type==='stock') 추림(~6,121)
type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[])
  .filter((s) => s.type === "stock")
  .map((s) => s.sym);

// us-performance와 동일 ret 패턴 — daysAgo 거래일 전 종가 대비 수익률(%)
function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

// 동시 호출 제한 — 야후 레이트리밋/타임아웃 방지(한 번에 limit개씩만 진행). us-performance와 동일 패턴.
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

export async function computeUsPerf(): Promise<{ ok: true; computed: number; at: string }> {
  // 약 280 달력일 룩백 — 6개월(126 거래일) + 비거래일 버퍼 충분
  const LOOKBACK_DAYS = 400; // 252거래일(1년) 확보용 — 400 캘린더일 ≈ 276 거래일
  const period1 = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // 동시 12개씩 — ~6,121종목 약 3분(300초 안). 종목별 try/catch→null.
  const results = await mapLimit(STOCK_SYMS, 12, async (sym): Promise<PerfRow | null> => {
    try {
      const ch = await yf.chart(sym, { period1, interval: "1d" });
      const bars = (ch.quotes ?? []) as Array<{ close: number | null; volume: number | null }>;
      const closes = bars
        .map((b) => b.close)
        .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
      if (closes.length < 6) return null; // 1주(5거래일)도 못 채우면 스킵
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
      return null; // 종목별 실패는 스킵
    }
  });

  // ── 메모리에 전부 모은 뒤 한 번에 기록(atomic-ish): 느린 계산(~3분) 동안 테이블 불변, 빠른 upsert 구간에서만 교체 ──
  const rows = results.filter((r): r is PerfRow => r !== null);
  const at = new Date().toISOString();
  const payload = rows.map((r) => ({ ...r, updated_at: at }));

  const sb = createAdminClient(); // RLS 우회(쓰기)
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("us_stock_perf").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }

  return { ok: true, computed: payload.length, at };
}
