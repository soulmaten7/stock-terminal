// 렌즈 점수 배치 프리컴퓨트 엔진(스크리닝 토대) — 시총 상위 N 유니버스에 대해 7팩터 미리계산 → lens_scores upsert.
// 공용 엔진 lib/lensCompute(=/api/lens 카드와 동일) 사용 → 카드 = 배치 계산 일치(엔진 = 검증 일치).
// ⚠️ 무료 야후는 6,121 전종목 펀더멘털(fundamentalsTimeSeries)을 300초 크론에 다 못 긁음 → 시총 상위 N으로 제한(정직·나중 확장).
// 상대경로 import: Next 빌드 + 독립 tsx 양쪽 동작(usPerf.ts와 동일 규칙).
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import { computeSymbolLenses } from "./lensCompute";
import type { LensRead } from "./lenses";
import symbols from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);

// 동시 호출 제한(usPerf와 동일 패턴) — 야후 레이트리밋/타임아웃 방지.
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) {
      const cur = idx++;
      out[cur] = await fn(arr[cur], cur);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

// 시총 상위 N 유니버스 — 전 주식을 배치 quote(100개씩)로 marketCap 뽑아 내림차순 상위 N.
async function topByMarketCap(topN: number): Promise<string[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < STOCK_SYMS.length; i += 100) chunks.push(STOCK_SYMS.slice(i, i + 100));
  const caps: { sym: string; cap: number }[] = [];
  await mapLimit(chunks, 6, async (grp) => {
    try {
      const qs = (await yf.quote(grp)) as Array<{ symbol?: string; marketCap?: number }>;
      for (const q of Array.isArray(qs) ? qs : []) {
        if (q?.symbol && typeof q.marketCap === "number" && q.marketCap > 0) caps.push({ sym: q.symbol, cap: q.marketCap });
      }
    } catch {
      /* 청크 실패는 스킵 */
    }
  });
  caps.sort((a, b) => b.cap - a.cap);
  return caps.slice(0, topN).map((c) => c.sym);
}

function pick(lenses: LensRead[], key: string) {
  const l = lenses.find((x) => x.key === key);
  return { value: l?.value ?? null, state: l?.state ?? null };
}
// F-Score: 카드와 동일 규칙(score>=7 strong / <=3 weak / mid). 은행 등 미적용(grade '-')은 na.
function fscoreOf(fscore: unknown) {
  const fs = fscore as { score?: number; grade?: string } | null;
  const value = fs && typeof fs.score === "number" && fs.grade !== "-" ? fs.score : null;
  const state = value == null ? "na" : value >= 7 ? "strong" : value <= 3 ? "weak" : "mid";
  return { value, state };
}

// topN 시총 상위 종목의 7팩터 계산 → lens_scores upsert. concurrency는 펀더멘털 무게 고려 보수적(기본 6).
// ⚠️ 100행마다 즉시 저장(flush) — 오래 걸리는 실행이 중간에 끊겨도 진행분은 DB에 남게(부분 내구성).
export async function computeLensScores(topN = 1000, concurrency = 6): Promise<{ ok: true; computed: number; universe: number; at: string }> {
  const universe = await topByMarketCap(topN);
  const at = new Date().toISOString();
  const sb = createAdminClient(); // RLS 우회(쓰기)
  let done = 0, saved = 0;
  let buffer: Record<string, unknown>[] = [];

  async function flush() {
    if (!buffer.length) return;
    const batch = buffer;
    buffer = [];
    const { error } = await sb.from("lens_scores").upsert(batch, { onConflict: "symbol" });
    if (error) throw error;
    saved += batch.length;
    console.log(`  ...저장 누계 ${saved}`);
  }

  await mapLimit(universe, concurrency, async (sym): Promise<void> => {
    try {
      const r = await computeSymbolLenses(sym);
      if (!r.lenses.length) return;
      const m = pick(r.lenses, "momentum"), lv = pick(r.lenses, "lowvol"), v = pick(r.lenses, "valuation");
      const q = pick(r.lenses, "quality"), ag = pick(r.lenses, "assetgrowth"), t = pick(r.lenses, "technical");
      const fs = fscoreOf(r.fscore);
      buffer.push({
        symbol: sym, market: "US", name: r.name, price: r.price,
        momentum_value: m.value, momentum_state: m.state,
        lowvol_value: lv.value, lowvol_state: lv.state,
        valuation_value: v.value, valuation_state: v.state,
        quality_value: q.value, quality_state: q.state,
        assetgrowth_value: ag.value, assetgrowth_state: ag.state,
        technical_value: t.value, technical_state: t.state,
        fscore_value: fs.value, fscore_state: fs.state,
        updated_at: at,
      });
      if (buffer.length >= 100) await flush();
    } catch {
      /* 종목별 실패는 스킵 */
    } finally {
      if (++done % 50 === 0) console.log(`  ...진행 ${done}/${universe.length}`);
    }
  });

  await flush(); // 남은 것 저장
  return { ok: true, computed: saved, universe: universe.length, at };
}
