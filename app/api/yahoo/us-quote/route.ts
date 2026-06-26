import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 보이는 50종목 chart를 콜드 때 부르므로 여유(대부분 캐시 히트)
export const maxDuration = 60;

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Period = "1w" | "1m" | "3m" | "6m" | "1y";

// 기간 → daysAgo(거래일 기준)
const DAYS_AGO: Record<Period, number> = { "1w": 5, "1m": 21, "3m": 63, "6m": 126, "1y": 252 };
// 기간 → period1 lookback(달력일 — 비거래일 버퍼 포함)
const LOOKBACK_DAYS: Record<Period, number> = { "1w": 25, "1m": 55, "3m": 150, "6m": 300, "1y": 480 };

// us-performance와 동일 ret 패턴
function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

// `${sym}|${period}` → { at, value } 인메모리 캐시(~30분)
const cache = new Map<string, { at: number; value: number | null }>();
const TTL = 30 * 60 * 1000;

// 동시 호출 제한 — us-performance와 동일 패턴
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "1w") as Period;
  const daysAgo = DAYS_AGO[period] ?? DAYS_AGO["1w"];
  const lookback = LOOKBACK_DAYS[period] ?? LOOKBACK_DAYS["1w"];

  const raw = (searchParams.get("syms") || "").trim();
  // 콤마 리스트 → 중복 제거(보통 ≤~60)
  const syms = Array.from(new Set(raw.split(",").map((s) => s.trim()).filter(Boolean)));
  if (syms.length === 0) return NextResponse.json({ rets: {} });

  const period1 = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);
  const now = Date.now();

  const pairs = await mapLimit(syms, 10, async (sym): Promise<[string, number | null]> => {
    const key = `${sym}|${period}`;
    const hit = cache.get(key);
    if (hit && now - hit.at < TTL) return [sym, hit.value];
    try {
      const ch = await yf.chart(sym, { period1, interval: "1d" });
      const quotes = (ch.quotes ?? []) as Array<{ close: number | null }>;
      const closes = quotes
        .map((q) => q.close)
        .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
      const value = ret(closes, daysAgo);
      cache.set(key, { at: now, value });
      return [sym, value];
    } catch {
      return [sym, null]; // 종목별 실패는 null
    }
  });

  const rets: Record<string, number | null> = {};
  for (const [s, v] of pairs) rets[s] = v;
  return NextResponse.json({ rets });
}
