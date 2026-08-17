// STEP 1057 §2-3 — 저변동 렌즈 손계산 검산. 표본 3종목(AAPL·TSLA·NVDA, 전부 2026-08-16 22:24 UTC 배치)의
//   realizedVol(closes, 252)을 DB(lens_scores.lowvol_value)와 대조한다.
// 🔴 독립성 확보 — lib/lowvol.ts를 import하지 않고 여기서 산식을 처음부터 다시 쓴다(같은 버그를 공유하지 않기 위함).
//   가격 원천도 프로덕션과 같은 야후 chart(1d, 400일) API를 그대로 쓴다 — 별도 소스를 새로 찾지 않는다(이미 검증된 경로 재사용).
// 🔵 읽기 전용 — DB 쓰기 0. 실행: npx tsx scripts/probe_1057_lowvol_handcalc.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const SAMPLE = ["AAPL", "TSLA", "NVDA"];

// 산식 재구현(lib/lowvol.ts:7 그대로 손으로 다시 씀 — import 안 함, 검증 목적상 독립).
function handRealizedVol(closes: number[], days = 252): number | null {
  if (closes.length < 121) return null;
  const seg = closes.slice(-(days + 1));
  const rets: number[] = [];
  for (let i = 1; i < seg.length; i++) if (seg[i - 1] > 0) rets.push(seg[i] / seg[i - 1] - 1);
  if (rets.length < 120) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varc = rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (rets.length - 1);
  if (varc <= 0) return null;
  return Math.sqrt(varc) * Math.sqrt(252) * 100;
}

async function main() {
  const sb = createAdminClient();
  const { data: dbRows } = await sb.from("lens_scores").select("symbol,lowvol_value,lowvol_state,updated_at").eq("market", "US").in("symbol", SAMPLE);
  const dbBySym = new Map(((dbRows ?? []) as { symbol: string; lowvol_value: number; lowvol_state: string; updated_at: string }[]).map((r) => [r.symbol, r]));

  const results: Record<string, unknown>[] = [];
  for (const symbol of SAMPLE) {
    const period2 = new Date();
    const period1 = new Date(period2.getTime() - 400 * 86400000);
    const bars = await yf.chart(symbol, { period1, period2, interval: "1d" });
    const quotes = (bars.quotes ?? []) as { close: number | null; date: Date }[];
    const closes = quotes.filter((q) => q.close != null).map((q) => q.close as number);
    const handVol = handRealizedVol(closes);
    const db = dbBySym.get(symbol);
    const dbVol = db ? Number(db.lowvol_value) : null;
    const diffPct = handVol != null && dbVol != null ? (Math.abs(handVol - dbVol) / dbVol) * 100 : null;
    results.push({
      symbol, barsCount: closes.length,
      handVol: handVol != null ? Math.round(handVol * 100) / 100 : null,
      dbVol, dbState: db?.lowvol_state, dbUpdatedAt: db?.updated_at,
      diffPct: diffPct != null ? Math.round(diffPct * 100) / 100 : null,
    });
    console.log(symbol, JSON.stringify(results[results.length - 1]));
  }
  console.log(JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2));
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
