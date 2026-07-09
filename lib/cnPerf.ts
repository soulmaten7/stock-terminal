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

// A주(.SS/.SZ) 일봉 종가+거래대금 — 東方財富(Eastmoney) 무료 kline. Yahoo가 A주 과거시세(chart)를 400으로 차단해 대체.
// secid: 1.=상해(.SS) / 0.=심천(.SZ). klt=101 일봉, fqt=1 전복권.
// fields2=f51(날짜),f53(종가),f57(거래대금·원 단위).
async function eastmoneyBars(secid: string): Promise<{ closes: number[]; lastAmount: number | null }> {
  try {
    const url =
      `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}` +
      `&fields1=f1&fields2=f51,f53,f57&klt=101&fqt=1&end=20500101&lmt=260`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://quote.eastmoney.com/" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { closes: [], lastAmount: null };
    const j = (await res.json()) as { data?: { klines?: string[] } };
    const klines = j.data?.klines ?? [];
    const closes = klines
      .map((k) => parseFloat(k.split(",")[1]))
      .filter((c) => isFinite(c) && c > 0);
    const lastK = klines[klines.length - 1];
    const rawAmt = lastK ? parseFloat(lastK.split(",")[2]) : NaN;
    return {
      closes,
      lastAmount: isFinite(rawAmt) && rawAmt > 0 ? rawAmt : null,
    };
  } catch {
    return { closes: [], lastAmount: null };
  }
}

type PerfRow = { symbol: string; r1d: number | null; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null; price: number | null; amount: number | null; r1y: number | null };

export async function computeCnPerf(): Promise<{ ok: true; computed: number; at: string }> {
  // 약 280 달력일 룩백 — 6개월(126 거래일) + 비거래일 버퍼 충분
  const period1 = new Date(Date.now() - 280 * 24 * 60 * 60 * 1000);

  const results = await mapLimit(ALL_SYMS, 12, async (sym): Promise<PerfRow | null> => {
    try {
      let closes: number[];
      let lastVol: number | null = null;
      let eastAmt: number | null = null;

      if (sym.endsWith(".HK")) {
        // 홍콩·ETF → Yahoo chart (정상 동작)
        const ch = await yf.chart(sym, { period1, interval: "1d" });
        const bars = (ch.quotes ?? []) as Array<{ close: number | null; volume: number | null }>;
        closes = bars
          .map((b) => b.close)
          .filter((c): c is number => typeof c === "number" && isFinite(c) && c > 0);
        lastVol = bars[bars.length - 1]?.volume ?? null;
      } else {
        // 상해(.SS)·심천(.SZ) A주 → 東方財富 kline (Yahoo 차단 대체)
        const code = sym.replace(/\.(SS|SZ)$/, "");
        const secid = (sym.endsWith(".SS") ? "1." : "0.") + code;
        const res = await eastmoneyBars(secid);
        closes = res.closes;
        eastAmt = res.lastAmount;
      }
      if (closes.length < 6) return null; // 1주(5거래일)도 못 채우면 스킵
      const price = closes[closes.length - 1];
      const amount =
        eastAmt != null
          ? eastAmt
          : lastVol != null && lastVol > 0
          ? price * lastVol
          : null;
      return {
        symbol: sym,
        r1d: ret(closes, 1),
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
        r1y: ret(closes, 252),
        price,
        amount,
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
