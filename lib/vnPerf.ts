// 베트남 전종목(HOSE 403) 1일~1년 수익률 백그라운드 미리계산 → vn_stock_perf 테이블에 일괄 저장.
// 가격 소스: Yahoo Finance — HOSE 커버. vn-list가 이 값을 서빙. 크론(/api/cron/vn-perf)이 하루 1회 호출.
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import symbols from "../data/vn_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; market: string };
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

// 외부 콜 공통 타임아웃 — 예산 가드(budgetLeft)는 '새 작업 픽'만 막고
// 진행 중인 await는 못 끊는다 → hang 콜 하나가 레인을 잠가 300초 하드리밋행.
// 모든 외부 콜은 개별 타임아웃 필수(STEP 755 · jpPerf STEP 753과 동일 패턴).
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

type PerfRow = { symbol: string; r1d: number | null; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null; price: number | null; amount: number | null; r1y: number | null };

export async function computeVnPerf(): Promise<{ ok: true; computed: number; attempted: number; at: string }> {
  const LOOKBACK_DAYS = 400; // 252거래일(1년) 확보용 — 400 캘린더일 ≈ 276 거래일
  const period1 = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const sb = createAdminClient(); // RLS 우회(쓰기) — 아래 신선도 정렬 읽기에도 사용

  // ── STEP 755: 전체 유니버스 + 신선도 역순(오래된 것 먼저) — jpPerf STEP 753과 동일 구조 ──
  const seen = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("vn_stock_perf").select("symbol, updated_at").range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const r of data as { symbol: string; updated_at: string }[]) seen.set(r.symbol, new Date(r.updated_at).getTime());
    if (data.length < 1000) break;
  }
  const target = [...STOCK_SYMS].sort((a, b) => (seen.get(a) ?? 0) - (seen.get(b) ?? 0)); // 미수록(0)=최우선

  const startedAt = Date.now();
  const TIME_BUDGET_MS = 260_000; // maxDuration 300초 대비 upsert 여유
  const budgetLeft = () => Date.now() - startedAt < TIME_BUDGET_MS;

  const results = await mapLimit(target, 12, async (sym): Promise<PerfRow | null> => {
    if (!budgetLeft()) return null; // 예산 소진 — 스킵(다음날 재시도)
    try {
      const ch = await withTimeout(yf.chart(sym, { period1, interval: "1d" }), 5000);
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

  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("vn_stock_perf").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }

  return { ok: true, computed: payload.length, attempted: target.length, at };
}
