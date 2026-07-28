// 렌즈 점수 배치 프리컴퓨트 엔진(스크리닝 토대) — 시총 상위 N 유니버스에 대해 7팩터 미리계산 → lens_scores upsert.
// 공용 엔진 lib/lensCompute(=/api/lens 카드와 동일) 사용 → 카드 = 배치 계산 일치(엔진 = 검증 일치).
// ⚠️ 무료 야후는 6,121 전종목 펀더멘털(fundamentalsTimeSeries)을 300초 크론에 다 못 긁음 → 시총 상위 N으로 제한(정직·나중 확장).
// 상대경로 import: Next 빌드 + 독립 tsx 양쪽 동작(usPerf.ts와 동일 규칙).
import * as Sentry from "@sentry/nextjs";
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "./supabase/admin";
import { computeSymbolLenses, flushLensFailures } from "./lensCompute";
import { toneForKey } from "./lensTones";
import { loadCuts, stateFromCut, CUT_LENSES, type CutMap } from "./lensCuts";
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

// STEP 805 pass2 (+806 §7) — 저장된 값을 새 컷으로 상태 재매핑(야후 재조회 없음) + 최종 상태로 변화 diff 기록.
//   분포 5렌즈만 재매핑(technical·fscore는 고정 표준값이라 불변). 변화(lens_state_changes)는 '재매핑 후 최종 상태'로 어제와 비교.
async function pass2RemapAndDiff(
  sb: ReturnType<typeof createAdminClient>,
  market: string,
  cuts: CutMap,
  at: string,
  changeDate: string,
  existing: Map<string, Record<string, string | null>>,
  tradeAmountOf?: Map<string, number>
): Promise<void> {
  const stateCols = LENS_KEYS.map((k) => `${k}_state`).join(",");
  const valCols = CUT_LENSES.map((k) => `${k}_value`).join(",");
  const selectCols = `symbol,name,${valCols},${stateCols}`;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; from < 60000; from += 1000) {
    const { data, error } = await sb
      .from("lens_scores")
      .select(selectCols as "symbol") // 동적 컬럼 문자열 — PostgREST 타입파서 우회(런타임 정상)
      .eq("market", market)
      .gte("updated_at", at) // 이번 실행에서 갱신된 행만(신선도 삭제 전)
      .order("symbol", { ascending: true }) // 페이지네이션 안정성(§7)
      .range(from, from + 999);
    if (error) throw error; // 조용히 넘어가지 않음(§7)
    if (!data || data.length === 0) break;
    rows.push(...(data as unknown as Record<string, unknown>[]));
    if (data.length < 1000) break;
  }
  const updates: Record<string, unknown>[] = [];
  const changeRows: Record<string, unknown>[] = [];
  for (const row of rows) {
    const sym = String(row.symbol);
    // 1) 분포 5렌즈 상태 재매핑(값 있는 것만) — 최종 상태 결정.
    const finalState: Record<string, string | null> = {};
    let changed = false;
    for (const key of LENS_KEYS) finalState[key] = (row[`${key}_state`] as string | null) ?? null;
    for (const key of CUT_LENSES) {
      const value = row[`${key}_value`] as number | null;
      if (value == null) continue; // 값 없으면 상태 유지(na)
      const next = stateFromCut(key, value, cuts[key]);
      if (next != null) {
        finalState[key] = next;
        if (next !== row[`${key}_state`]) changed = true;
      }
    }
    // 🔴 STEP 808 §1: patch에 7개 상태를 '전부' 담아 행마다 키 집합을 균일화.
    //   부분 키만 담으면 PostgREST upsert(defaultToNull=true)가 누락 키를 NULL로 채워 안 바뀐 렌즈 상태를 손상시킴(데이터 손상).
    if (changed) {
      const patch: Record<string, unknown> = { symbol: sym, market, updated_at: at };
      for (const key of LENS_KEYS) patch[`${key}_state`] = finalState[key];
      updates.push(patch);
    }
    // 2) 최종 상태로 변화 diff(어제 existing 대비) — tone이 실제 바뀐 렌즈만(STEP 764·806 §7).
    const prev = existing.get(sym);
    if (prev) {
      for (const key of LENS_KEYS) {
        const toState = finalState[key];
        if (toState == null) continue;
        const toTone = toneForKey(key, toState);
        if (toTone == null) continue;
        const fromState = prev[`${key}_state`] ?? null;
        const fromTone = toneForKey(key, fromState);
        if (fromTone == null || fromTone === toTone) continue;
        changeRows.push({
          change_date: changeDate, market, symbol: sym, name: (row.name as string) ?? null, lens_key: key,
          from_state: fromState, to_state: toState, from_tone: fromTone, to_tone: toTone,
          trade_amount: tradeAmountOf?.get(sym) ?? null,
        });
      }
    }
  }
  for (let i = 0; i < updates.length; i += 500) {
    const { error } = await sb.from("lens_scores").upsert(updates.slice(i, i + 500), { onConflict: "symbol" });
    if (error) throw error;
  }
  for (let i = 0; i < changeRows.length; i += 500) {
    try {
      const { error } = await sb.from("lens_state_changes").upsert(changeRows.slice(i, i + 500), { onConflict: "change_date,market,symbol,lens_key" });
      if (error) throw error;
    } catch (e) {
      Sentry.captureException(e, { tags: { pipeline: "lens_state_changes", market }, extra: { count: changeRows.length } });
    }
  }
  console.log(`  ...pass2 재매핑 ${updates.length}행·변화 ${changeRows.length}건 (${market})`);
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
  // STEP 805 2-pass: pass1은 '직전' 컷으로 상태 산출(순환 의존 회피), 실행 끝에 새 분포로 컷 재유도 후 pass2에서 상태 재매핑.
  // STEP 808 §2: 컷 조회 실패를 크론 전체를 죽이는 치명 실패로 만들지 않는다 — pass1은 pending으로라도 저장,
  //   이 실행 분포에서 컷을 새로 유도해 pass2가 상태를 정정한다(loadCuts는 이미 Sentry 캡처).
  const prevCuts = await loadCuts(market).catch((e) => {
    Sentry.captureException(e, { tags: { pipeline: "lens_prevcuts_load", market } });
    return {} as CutMap;
  });
  const existing = await fetchExistingStates(sb, market, universe); // upsert 전 스냅샷 — 어제 상태
  let done = 0, saved = 0;
  let buffer: Record<string, unknown>[] = [];
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
  await mapLimit(universe, concurrency, async (sym): Promise<void> => {
    try {
      const r = await computeSymbolLenses(sym, "ko", prevCuts); // pass1 = 직전 컷으로 판정(끝에서 pass2 재매핑)
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
      // STEP 806 §7: 상태 변화 diff는 pass2(컷 재매핑) '이후'에 최종 상태로 계산 — 여기(pass1)선 값·상태만 저장.

      if (buffer.length >= 100) await flush();
    } catch {
      /* 종목별 실패 스킵 */
    } finally {
      if (++done % 50 === 0) console.log(`  ...진행 ${done}/${universe.length}`);
    }
  });
  await flush();
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
  let newCuts: CutMap = prevCuts;
  if (cutRows.length) {
    const { error } = await sb.from("lens_cuts").upsert(cutRows, { onConflict: "market,lens_key" });
    if (error) Sentry.captureException(error, { tags: { pipeline: "lens_cuts", market } });
    else {
      newCuts = {};
      for (const r of cutRows as { lens_key: string; lo: number; hi: number; n: number; as_of: string }[]) {
        newCuts[r.lens_key] = { lo: r.lo, hi: r.hi, n: r.n, asOf: r.as_of };
      }
    }
  }

  // STEP 805 pass2(+806 §7) — 새 컷으로 상태 재매핑 + 최종 상태로 변화 diff(값 재계산 없이 DB 저장분만).
  //   pass1이 직전 컷(또는 없음→pending)으로 찍은 상태를 이 실행 분포 컷으로 다시 매핑 → 라이브/선계산 판정 일치.
  try {
    await pass2RemapAndDiff(sb, market, newCuts, at, changeDate, existing, tradeAmountOf);
  } catch (e) {
    Sentry.captureException(e, { tags: { pipeline: "lens_states_remap", market } });
  }

  // 신선도(STEP 802 §5) — 이번 실행에서 갱신 안 된(유니버스 이탈) 행 삭제.
  // 🔴 STEP 806 §3: 저장 성공률이 낮으면(부분 실행) 프루닝이 정상 행을 대량 삭제할 수 있음 → 성공률 ≥80%일 때만 프루닝.
  const successRate = universe.length > 0 ? saved / universe.length : 0;
  if (successRate >= 0.8) {
    try {
      await sb.from("lens_scores").delete().eq("market", market).lt("updated_at", at);
    } catch (e) {
      Sentry.captureException(e, { tags: { pipeline: "lens_scores_prune", market } });
    }
  } else {
    // 조용히 넘어가지 않는다 — 프루닝 건너뜀을 경고(부분 실행 감지).
    Sentry.captureMessage(
      `[lens-prune-skip] ${market} 저장 성공률 ${(successRate * 100).toFixed(0)}% < 80% → 프루닝 건너뜀(대량 삭제 방지·저장 ${saved}/${universe.length})`,
      "warning"
    );
    console.warn(`  ...프루닝 건너뜀(성공률 ${(successRate * 100).toFixed(0)}% · ${saved}/${universe.length})`);
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
