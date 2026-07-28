// 렌즈 점수 배치 프리컴퓨트 엔진(스크리닝 토대) — 시총 상위 N 유니버스에 대해 7팩터 미리계산 → lens_scores upsert.
// 공용 엔진 lib/lensCompute(=/api/lens 카드와 동일) 사용 → 카드 = 배치 계산 일치(엔진 = 검증 일치).
// ⚠️ 무료 야후는 6,121 전종목 펀더멘털(fundamentalsTimeSeries)을 300초 크론에 다 못 긁음 → 시총 상위 N으로 제한(정직·나중 확장).
// 상대경로 import: Next 빌드 + 독립 tsx 양쪽 동작(usPerf.ts와 동일 규칙).
import * as Sentry from "@sentry/nextjs";
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import { computeSymbolLenses, flushLensFailures } from "./lensCompute";
import { toneForKey } from "./lensTones";
import type { LensRead } from "./lenses";
import symbols from "../data/us_symbols.json";

// 렌즈 상태 변화(lens_state_changes) 대상 팩터 7종 — lensTones.ts STATE_SPEC과 동일 키(STEP 764).
const LENS_KEYS = ["momentum", "technical", "valuation", "lowvol", "quality", "assetgrowth", "fscore"] as const;

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
// 같은 quote 응답에 이미 실린 가격·거래량으로 거래대금도 같이 추출(추가 조회 없음·STEP 764 lens_state_changes 정렬용).
async function topByMarketCap(topN: number): Promise<{ symbols: string[]; tradeAmountOf: Map<string, number> }> {
  const chunks: string[][] = [];
  for (let i = 0; i < STOCK_SYMS.length; i += 100) chunks.push(STOCK_SYMS.slice(i, i + 100));
  const caps: { sym: string; cap: number }[] = [];
  const tradeAmountOf = new Map<string, number>();
  await mapLimit(chunks, 6, async (grp) => {
    try {
      const qs = (await yf.quote(grp)) as Array<{ symbol?: string; marketCap?: number; regularMarketPrice?: number; regularMarketVolume?: number }>;
      for (const q of Array.isArray(qs) ? qs : []) {
        if (q?.symbol && typeof q.marketCap === "number" && q.marketCap > 0) caps.push({ sym: q.symbol, cap: q.marketCap });
        if (q?.symbol && typeof q.regularMarketPrice === "number" && typeof q.regularMarketVolume === "number") {
          tradeAmountOf.set(q.symbol, q.regularMarketPrice * q.regularMarketVolume);
        }
      }
    } catch {
      /* 청크 실패는 스킵 */
    }
  });
  caps.sort((a, b) => b.cap - a.cap);
  return { symbols: caps.slice(0, topN).map((c) => c.sym), tradeAmountOf };
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

// 기존 lens_scores state 배치 조회(diff용) — .in() 1,000개 청크(URL 길이 한도 회피·STEP 757 전례).
async function fetchExistingStates(
  sb: ReturnType<typeof createAdminClient>,
  market: string,
  universe: string[]
): Promise<Map<string, Record<string, string | null>>> {
  const out = new Map<string, Record<string, string | null>>();
  for (let i = 0; i < universe.length; i += 1000) {
    const chunk = universe.slice(i, i + 1000);
    if (!chunk.length) continue;
    const { data } = await sb
      .from("lens_scores")
      .select("symbol,momentum_state,technical_state,valuation_state,lowvol_state,quality_state,assetgrowth_state,fscore_state")
      .eq("market", market)
      .in("symbol", chunk);
    for (const row of (data ?? []) as Record<string, string | null>[]) {
      out.set(String(row.symbol), row);
    }
  }
  return out;
}

// 코어: 주어진 유니버스·시장으로 계산→upsert (market 파라미터). concurrency는 펀더멘털 무게 고려 보수적(기본 6).
// ⚠️ 100행마다 즉시 저장(flush) — 오래 걸리는 실행이 중간에 끊겨도 진행분은 DB에 남게(부분 내구성).
// tradeAmountOf: 유니버스 조회 시 이미 확보한 거래대금(추가 조회 없음) — lens_state_changes 정렬용(STEP 764).
export async function computeLensScoresFor(
  universe: string[],
  market: string,
  opts: { concurrency?: number; tradeAmountOf?: Map<string, number> } = {}
): Promise<{ ok: true; computed: number; universe: number; at: string }> {
  const concurrency = opts.concurrency ?? 6;
  const tradeAmountOf = opts.tradeAmountOf;
  const at = new Date().toISOString();
  const changeDate = at.slice(0, 10); // 크론 실행일(UTC date) — KR/US 통일, 표시 로케일화는 읽기 쪽(스펙)
  const sb = createAdminClient(); // RLS 우회(쓰기·kr_stock_snapshot 읽기)
  const existing = await fetchExistingStates(sb, market, universe); // upsert 전 스냅샷 — 어제 상태
  let done = 0, saved = 0;
  let buffer: Record<string, unknown>[] = [];
  let changeBuffer: Record<string, unknown>[] = [];
  // 판정 컷 유도용 값 수집(STEP 802 §1) — 유니버스 전체 값의 분포에서 하위30%/상위30% 컷을 산출·저장.
  // RSI(technical)·F-Score는 학술·업계 표준 고정값이라 제외.
  const cutValues: Record<string, number[]> = { momentum: [], lowvol: [], valuation: [], quality: [], assetgrowth: [] };
  async function flush() {
    if (!buffer.length) return;
    const batch = buffer; buffer = [];
    const { error } = await sb.from("lens_scores").upsert(batch, { onConflict: "symbol" });
    if (error) throw error;
    saved += batch.length;
    console.log(`  ...저장 누계 ${saved}`);
  }
  async function flushChanges() {
    if (!changeBuffer.length) return;
    const batch = changeBuffer; changeBuffer = [];
    try {
      const { error } = await sb.from("lens_state_changes").upsert(batch, { onConflict: "change_date,market,symbol,lens_key" });
      if (error) throw error;
    } catch (e) {
      // 변화 기록 실패는 선계산 저장을 막지 않는다(비차단) — 원인만 Sentry로.
      Sentry.captureException(e, { tags: { pipeline: "lens_state_changes", market }, extra: { count: batch.length } });
    }
  }
  await mapLimit(universe, concurrency, async (sym): Promise<void> => {
    try {
      const r = await computeSymbolLenses(sym);
      if (!r.lenses.length) return;
      const m = pick(r.lenses, "momentum"), lv = pick(r.lenses, "lowvol"), v = pick(r.lenses, "valuation");
      const q = pick(r.lenses, "quality"), ag = pick(r.lenses, "assetgrowth"), t = pick(r.lenses, "technical");
      const fs = fscoreOf(r.fscore);
      // 컷 유도용 값 수집(값이 있는 종목만) — 분포 기반 컷 산출용.
      if (m.value != null) cutValues.momentum.push(m.value);
      if (lv.value != null) cutValues.lowvol.push(lv.value);
      if (v.value != null) cutValues.valuation.push(v.value);
      if (q.value != null) cutValues.quality.push(q.value);
      if (ag.value != null) cutValues.assetgrowth.push(ag.value);
      buffer.push({
        symbol: sym, market, name: r.name, price: r.price,
        momentum_value: m.value, momentum_state: m.state,
        lowvol_value: lv.value, lowvol_state: lv.state,
        valuation_value: v.value, valuation_state: v.state,
        quality_value: q.value, quality_state: q.state,
        assetgrowth_value: ag.value, assetgrowth_state: ag.state,
        technical_value: t.value, technical_state: t.state,
        fscore_value: fs.value, fscore_state: fs.state,
        updated_at: at,
      });

      // 렌즈 상태 변화 diff — 기존 행 있는 심볼만(없으면 "변화 아님"), tone이 실제로 바뀐 팩터만(STEP 764).
      const prev = existing.get(sym);
      if (prev) {
        const cur: Record<(typeof LENS_KEYS)[number], { value: number | null; state: string | null }> = {
          momentum: m, technical: t, valuation: v, lowvol: lv, quality: q, assetgrowth: ag, fscore: fs,
        };
        for (const key of LENS_KEYS) {
          const toState = cur[key].state;
          if (toState == null) continue; // to_state NOT NULL 제약 — 미지원/계산실패면 기록 스킵
          const toTone = toneForKey(key, toState);
          if (toTone == null) continue; // to_tone NOT NULL 제약
          const fromState = (prev[`${key}_state`] as string | null) ?? null;
          const fromTone = toneForKey(key, fromState);
          if (fromTone == null) continue; // 산출 불가(na)→값 생김은 "변화"가 아니라 노이즈(STEP 765b)
          if (fromTone === toTone) continue;
          changeBuffer.push({
            change_date: changeDate, market, symbol: sym, name: r.name, lens_key: key,
            from_state: fromState, to_state: toState, from_tone: fromTone, to_tone: toTone,
            trade_amount: tradeAmountOf?.get(sym) ?? null,
          });
        }
      }

      if (buffer.length >= 100) await flush();
      if (changeBuffer.length >= 200) await flushChanges();
    } catch {
      /* 종목별 실패 스킵 */
    } finally {
      if (++done % 50 === 0) console.log(`  ...진행 ${done}/${universe.length}`);
    }
  });
  await flush();
  await flushChanges();
  flushLensFailures(`batch ${market}`); // 렌즈별 실패를 1건으로 요약 보고(폭주 억제·STEP 797 §4)

  // 판정 컷 유도·저장(STEP 802 §1) — 유니버스 값 분포의 하위30%/상위30%(p30/p70). 표본 충분할 때만.
  const pctile = (sorted: number[], p: number): number => {
    const idx = (sorted.length - 1) * p;
    const loI = Math.floor(idx), hiI = Math.ceil(idx);
    return sorted[loI] + (sorted[hiI] - sorted[loI]) * (idx - loI);
  };
  const cutRows: Record<string, unknown>[] = [];
  for (const [lensKey, vals] of Object.entries(cutValues)) {
    if (vals.length < 30) continue; // 표본 부족 → 컷 유도 스킵(다음 실행 재시도)
    const sorted = [...vals].sort((a, b) => a - b);
    cutRows.push({ market, lens_key: lensKey, lo: pctile(sorted, 0.3), hi: pctile(sorted, 0.7), n: sorted.length, as_of: at, method: "p30/p70" });
  }
  if (cutRows.length) {
    const { error } = await sb.from("lens_cuts").upsert(cutRows, { onConflict: "market,lens_key" });
    if (error) Sentry.captureException(error, { tags: { pipeline: "lens_cuts", market } });
  }

  // 신선도(STEP 802 §5) — 이번 실행에서 갱신 안 된(유니버스 이탈) 행 삭제 → 백분위·랭킹·lens-top에서 옛 값 제거.
  try {
    await sb.from("lens_scores").delete().eq("market", market).lt("updated_at", at);
  } catch (e) {
    Sentry.captureException(e, { tags: { pipeline: "lens_scores_prune", market } });
  }

  return { ok: true, computed: saved, universe: universe.length, at };
}

// US(기존 API 보존) — 시총 상위 N
export async function computeLensScores(topN = 1000, concurrency = 6) {
  const { symbols: universe, tradeAmountOf } = await topByMarketCap(topN);
  return computeLensScoresFor(universe, "US", { concurrency, tradeAmountOf });
}

// KR 유니버스 — kr_stock_snapshot 거래대금 상위 N (admin 클라·6자리 코드). trade_amount도 같이 반환(추가 조회 없음).
export async function topKrByTradeAmount(topN: number): Promise<{ symbols: string[]; tradeAmountOf: Map<string, number> }> {
  const sb = createAdminClient();
  // STEP 803 §3: 우선주(끝자리 ≠ 0)는 밸류 렌즈가 계산 불가 → 백분위 오염 방지 위해 선계산 유니버스에서 제외.
  //   제외분만큼 topN이 줄지 않도록 여유 있게 당겨(topN+200) 필터 후 topN으로 컷.
  const isPreferred = (s: string) => /^\d{6}$/.test(s) && !s.endsWith("0");
  const { data } = await sb.from("kr_stock_snapshot").select("symbol,trade_amount").order("trade_amount", { ascending: false }).limit(topN + 200);
  const all = (data ?? []) as { symbol: string; trade_amount: number | null }[];
  const rows = all.filter((row) => !isPreferred(row.symbol)).slice(0, topN);
  const tradeAmountOf = new Map<string, number>();
  for (const row of rows) if (row.trade_amount != null) tradeAmountOf.set(row.symbol, row.trade_amount);
  return { symbols: rows.map((row) => row.symbol), tradeAmountOf };
}
