// 미국 전종목(~6,121) 1주~6개월 수익률 백그라운드 미리계산 → jp_stock_perf 테이블에 일괄 저장.
// us-list가 이 값을 조인해 내려줌(요청 시점 lazy chart 호출 제거). 크론(/api/cron/us-perf)이 하루 1회 호출.
// 상대경로 import: Next 빌드 + 독립 tsx 양쪽 동작(fss.ts와 동일 규칙).
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import symbols from "../data/jp_symbols.json";

// yahooSurvey 안내 로그 억제
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// data/us_symbols.json: [{ sym, name, type }] — 주식만(type==='stock') 추림(~6,121)
type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[])
  .filter((s) => s.type === "stock" || s.type === "etf" || s.type === "reit")
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

// 외부 콜 공통 타임아웃 — 예산 가드(budgetLeft)는 '새 작업 픽'만 막고
// 진행 중인 await는 못 끊는다 → hang 콜 하나가 레인을 잠가 300초 하드리밋행.
// 모든 외부 콜은 개별 타임아웃 필수(STEP 753 · cnPerf STEP 750b와 동일 패턴).
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

type PerfRow = { symbol: string; r1d: number | null; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null; price: number | null; amount: number | null; r1y: number | null };

export async function computeJpPerf(): Promise<{ ok: true; computed: number; attempted: number; at: string }> {
  // 약 280 달력일 룩백 — 6개월(126 거래일) + 비거래일 버퍼 충분
  const LOOKBACK_DAYS = 400; // 252거래일(1년) 확보용 — 400 캘린더일 ≈ 276 거래일
  const period1 = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const sb = createAdminClient(); // RLS 우회(쓰기) — 아래 신선도 정렬 읽기에도 사용

  // ── STEP 753: 전체 유니버스 + 신선도 역순(오래된 것 먼저) — cnPerf STEP 752와 동일 구조 ──
  // 예산에 잘리면 '가장 오래된 것부터' 처리했으므로 다음날 이어받아 자연 회전한다.
  const seen = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("jp_stock_perf").select("symbol, updated_at").range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const r of data as { symbol: string; updated_at: string }[]) seen.set(r.symbol, new Date(r.updated_at).getTime());
    if (data.length < 1000) break;
  }
  const target = [...STOCK_SYMS].sort((a, b) => (seen.get(a) ?? 0) - (seen.get(b) ?? 0)); // 미수록(0)=최우선

  // 시간 예산 — 소스가 hang이어도 함수 전체가 죽지 않게. 예산 소진 시 새 심볼을 집지 않고 걷은 것만 저장.
  const startedAt = Date.now();
  const TIME_BUDGET_MS = 260_000; // maxDuration 300초 대비 upsert 여유
  const budgetLeft = () => Date.now() - startedAt < TIME_BUDGET_MS;

  // 동시 12개씩 — ~6,121종목 약 3분(300초 안). 종목별 try/catch→null.
  const results = await mapLimit(target, 12, async (sym): Promise<PerfRow | null> => {
    if (!budgetLeft()) return null; // 예산 소진 — 스킵(다음날 재시도)
    try {
      const ch = await withTimeout(yf.chart(sym, { period1, interval: "1d" }), 5000);
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

  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("jp_stock_perf").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }

  return { ok: true, computed: payload.length, attempted: target.length, at };
}
