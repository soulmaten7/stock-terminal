// 베트남 전종목(HOSE 403+HNX 299=702) 1일~1년 수익률 백그라운드 미리계산 → vn_stock_perf 테이블에 일괄 저장.
// 가격 소스: VCI(Vietcap) — 야후는 HNX 미커버. HOSE+HNX 완전판. vn-list가 이 값을 서빙.
import { createAdminClient } from "./supabase/admin";
import symbols from "../data/vn_symbols.json";

type Sym = { sym: string; name: string; market: string };
const STOCK_SYMS: string[] = (symbols as Sym[]).map((s) => s.sym);

const VCI_URL = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart";
const VCI_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0",
  Referer: "https://trading.vietcap.com.vn/",
};
// VCI 응답은 이미 풀 VND — 스케일 불필요
const COUNT_BACK = 420; // 400 캘린더일 ≈ 276 거래일 > 252(r1y)

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

async function vciBatch(
  tickers: string[]
): Promise<Map<string, { closes: number[]; lastVol: number }>> {
  const to = Math.floor(Date.now() / 1000);
  try {
    const res = await fetch(VCI_URL, {
      method: "POST",
      headers: VCI_HEADERS,
      body: JSON.stringify({ timeFrame: "ONE_DAY", symbols: tickers, to, countBack: COUNT_BACK }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return new Map();
    const j = await res.json();
    const arr: unknown[] = Array.isArray(j) ? j : [];
    const out = new Map<string, { closes: number[]; lastVol: number }>();
    for (const d of arr as Array<{ symbol: string; c: number[]; v: number[] }>) {
      const closes = (d.c ?? []).filter((c) => typeof c === "number" && c > 0);
      if (closes.length < 6) continue;
      const v = Array.isArray(d.v) ? d.v : [];
      out.set(d.symbol, { closes, lastVol: v.length ? Number(v[v.length - 1]) : 0 });
    }
    return out;
  } catch {
    return new Map();
  }
}

type PerfRow = {
  symbol: string;
  r1d: number | null;
  r1w: number | null;
  r1m: number | null;
  r3m: number | null;
  r6m: number | null;
  price: number | null;
  amount: number | null;
  r1y: number | null;
};

export async function computeVnPerf(): Promise<{ ok: true; computed: number; at: string }> {
  const BATCH = 50;
  const rows: PerfRow[] = [];

  for (let i = 0; i < STOCK_SYMS.length; i += BATCH) {
    const chunk = STOCK_SYMS.slice(i, i + BATCH);
    // VCI는 .VN 없이 티커만 받음
    const tickers = chunk.map((s) => s.replace(/\.VN$/i, ""));
    const batchMap = await vciBatch(tickers);

    for (let j = 0; j < chunk.length; j++) {
      const sym = chunk[j];
      const ticker = tickers[j];
      const d = batchMap.get(ticker);
      if (!d) continue;
      const { closes, lastVol } = d;
      const price = closes[closes.length - 1];
      rows.push({
        symbol: sym,
        r1d: ret(closes, 1),
        r1w: ret(closes, 5),
        r1m: ret(closes, 21),
        r3m: ret(closes, 63),
        r6m: ret(closes, 126),
        r1y: ret(closes, 252),
        price,
        amount: lastVol > 0 ? price * lastVol : null,
      });
    }
  }

  const at = new Date().toISOString();
  const payload = rows.map((r) => ({ ...r, updated_at: at }));

  const sb = createAdminClient();
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("vn_stock_perf").upsert(payload.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }

  return { ok: true, computed: payload.length, at };
}
