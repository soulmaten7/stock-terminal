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

// ── STEP 833 순수 판정 함수(값 잠금 테스트 대상) ──────────────────────────────
// §1: 배치 응답을 ok/noCapField/noResponse로 분류 — 결측을 조용히 안 버린다(832 사고의 코드적 원인).
export function classifyCaps(
  requested: string[],
  responses: { symbol?: string | null; marketCap?: number | null }[],
): { capOf: Map<string, number>; noCapField: string[]; noResponse: string[] } {
  const capOf = new Map<string, number>();
  const inResponse = new Set<string>();
  for (const q of responses) {
    if (q?.symbol) inResponse.add(q.symbol);
    if (q?.symbol && typeof q.marketCap === "number" && q.marketCap > 0) capOf.set(q.symbol, q.marketCap);
  }
  const missing = requested.filter((s) => !capOf.has(s));
  return { capOf, noCapField: missing.filter((s) => inResponse.has(s)), noResponse: missing.filter((s) => !inResponse.has(s)) };
}

// §2: 취득 게이트 — 커버리지(fresh 확보율) + 구성(직전 상위 200 메가캡이 오늘 fresh 확보됐나). 편향 표본으로 컷 만드는 것 차단.
export function capGateDecision(
  freshCoverage: number, priorTopSyms: string[], freshSet: Set<string>,
  opts: { coverageMin?: number; compMin?: number } = {},
): { coverageOk: boolean; compositionOk: boolean; compRatio: number; cutGateOk: boolean } {
  const coverageMin = opts.coverageMin ?? 0.97; // 정상 ~98.6%(프로브 실측)·여유 1.6pp
  const compMin = opts.compMin ?? 0.95;         // 메가캡은 하루새 안 사라짐 → 95% 미만이면 취득 사고(832: ~0%)
  const coverageOk = freshCoverage >= coverageMin;
  let compositionOk = true, compRatio = 1;
  if (priorTopSyms.length >= 100) { // 부트스트랩(기록 부족)이면 구성 게이트 스킵
    const present = priorTopSyms.filter((s) => freshSet.has(s)).length;
    compRatio = present / priorTopSyms.length;
    compositionOk = compRatio >= compMin;
  }
  return { coverageOk, compositionOk, compRatio, cutGateOk: coverageOk && compositionOk };
}

// §3: 정상화 churn — 오늘 유니버스가 직전 유니버스 대비 크게 바뀌면(정상화로 202 복귀 등) 변화 diff 미기록.
export function churnDecision(
  universe: string[], priorSet: Set<string>, threshold = 0.10,
): { churn: number; skipChangeDiff: boolean } {
  const overlap = universe.filter((s) => priorSet.has(s)).length;
  const churn = priorSet.size > 0 ? 1 - overlap / Math.max(universe.length, priorSet.size) : 0;
  return { churn, skipChangeDiff: churn > threshold };
}

// 🔴 STEP 833 §1: 시총 상위 N 유니버스 — 결측을 조용히 버리지 않는 3단 취득(배치→개별 재시도→최근값 폴백).
//   832 진단: 배치 `yf.quote(100)`가 marketCap을 안 주면 `marketCap>0` 필터가 로그 없이 심볼을 버려 초대형주 202개가
//   유니버스에서 조용히 빠졌다(개수 가드는 1000·996으로 통과). 개별 quote는 같은 심볼을 잘 준다(us_stock_perf 실측).
export type CapDiag = {
  total: number; batchOk: number; noCapField: number; noResponse: number;
  recovered: number; fallbackUsed: number; retryAttempted: number; retryBudgetHit: boolean;
  freshCoverage: number; // 배치+재시도(폴백 제외) cap 확보율 — 커버리지 게이트용(정상 ~98.6%)
};
async function topByMarketCap(topN: number): Promise<{
  symbols: string[]; tradeAmountOf: Map<string, number>; capOf: Map<string, number>; freshSet: Set<string>; diag: CapDiag;
}> {
  const sb = createAdminClient();
  const chunks: string[][] = [];
  for (let i = 0; i < STOCK_SYMS.length; i += 100) chunks.push(STOCK_SYMS.slice(i, i + 100));
  const capOf = new Map<string, number>();     // sym → cap(배치+재시도+폴백·랭킹용)
  const freshSet = new Set<string>();          // 배치·재시도로 '오늘' 확보(폴백 제외) — 커버리지·구성 게이트용
  const tradeAmountOf = new Map<string, number>();
  const responses: { symbol?: string | null; marketCap?: number | null }[] = [];
  let failedChunks = 0;

  // ── Stage 1: 배치(현행 유지·동시성 6) — 응답을 모아 classifyCaps로 ok/noCapField/noResponse 분류(조용히 안 버림) ──
  await mapLimit(chunks, 6, async (grp) => {
    try {
      const qs = (await yf.quote(grp)) as Array<{ symbol?: string; marketCap?: number; regularMarketPrice?: number; regularMarketVolume?: number }>;
      for (const q of Array.isArray(qs) ? qs : []) {
        responses.push({ symbol: q.symbol, marketCap: q.marketCap }); // 동기 push(단일스레드라 race 없음)
        if (q?.symbol && typeof q.regularMarketPrice === "number" && typeof q.regularMarketVolume === "number") {
          tradeAmountOf.set(q.symbol, q.regularMarketPrice * q.regularMarketVolume);
        }
      }
    } catch { failedChunks++; }
  });
  const { capOf: batchCaps, noCapField, noResponse } = classifyCaps(STOCK_SYMS, responses);
  for (const [s, c] of batchCaps) { capOf.set(s, c); freshSet.add(s); }
  const batchOk = capOf.size;

  // ── Stage 2: 개별 재시도(noCapField∪noResponse) — 예산 40s/400건(실측 ~120ms/건@동시성6 → 330건≈40s) ──
  const RETRY_MAX = 400, RETRY_MS = 40_000;
  const retryAll = [...noCapField, ...noResponse];
  const retrySet = retryAll.slice(0, RETRY_MAX);
  const t0 = Date.now();
  let recovered = 0, timeHit = false;
  await mapLimit(retrySet, 6, async (sym) => {
    if (Date.now() - t0 > RETRY_MS) { timeHit = true; return; }
    try {
      const q = (await yf.quote(sym)) as { marketCap?: number; regularMarketPrice?: number; regularMarketVolume?: number };
      if (typeof q?.marketCap === "number" && q.marketCap > 0) { capOf.set(sym, q.marketCap); freshSet.add(sym); recovered++; }
      if (typeof q?.regularMarketPrice === "number" && typeof q?.regularMarketVolume === "number" && !tradeAmountOf.has(sym)) tradeAmountOf.set(sym, q.regularMarketPrice * q.regularMarketVolume);
    } catch { /* 개별도 실패 → 폴백으로 */ }
  });
  const freshCoverage = freshSet.size / STOCK_SYMS.length;

  // 매 실행 성공(fresh) cap 기록 → 다음날 폴백 재료. us_stock_perf에 컬럼 붙이지 않음(808 부분컬럼 NULL덮기 회피·전용 테이블).
  const today = at10();
  const capRows = [...freshSet].map((symbol) => ({ symbol, market_cap: capOf.get(symbol)!, as_of: today }));
  for (let i = 0; i < capRows.length; i += 500) {
    const { error } = await sb.from("us_market_cap").upsert(capRows.slice(i, i + 500), { onConflict: "symbol" });
    if (error) Sentry.captureException(error, { tags: { pipeline: "us_market_cap_upsert" } });
  }

  // ── Stage 3: 최근값 폴백(7일 이내) — 배치·재시도 다 실패한 심볼만. 나이 초과분은 안 씀(829 _lastGood TTL 원리) ──
  // 🔴 STEP 894(893과 상호주석): 이 7일 값은 app/api/cron/revdcf/route.ts의 MCAP_TTL_DAYS와 같아야 한다(893) —
  //   그쪽이 이 값을 복제해서 쓴다. 여기를 바꾸면 그 파일의 상수도 같이 바꿀 것.
  let fallbackUsed = 0;
  const stillMissing = STOCK_SYMS.filter((s) => !capOf.has(s));
  if (stillMissing.length) {
    const cutoff = at10(new Date(Date.now() - 7 * 24 * 3600 * 1000));
    for (let i = 0; i < stillMissing.length; i += 500) {
      const { data: lg } = await sb.from("us_market_cap").select("symbol,market_cap").in("symbol", stillMissing.slice(i, i + 500)).gte("as_of", cutoff);
      for (const r of (lg ?? []) as { symbol: string; market_cap: number }[]) {
        if (!capOf.has(r.symbol)) { capOf.set(r.symbol, Number(r.market_cap)); fallbackUsed++; }
      }
    }
  }

  if (failedChunks > 0) Sentry.captureMessage(`[topByMarketCap] 청크 ${failedChunks}/${chunks.length} 실패`, failedChunks / chunks.length >= 0.3 ? "error" : "warning");
  // 🔴 STEP 894: retryBudgetHit·전체대상(retryAll.length)을 로그에 추가 — 이전까진 diag에 계산만 되고 어디에도 안 실렸다(892 발견).
  // 🔴 Sentry 경고는 일부러 안 단다 — us_market_cap 스테일 표본이 891·892 이틀 연속 517~520(± RETRY_MAX=400과 같은 자릿수)으로
  //   관측돼 매일 걸릴 가능성이 높다고 판단(간접 근거 · retryAll 자체는 아직 실측한 적 없음). 매일 뜨는 경고는 알림 노이즈가 돼 무시된다 — 로그만으로 관측 가능하게 둔다.
  console.log(`[topByMarketCap] batchOk ${batchOk} · noCapField ${noCapField.length} · noResponse ${noResponse.length} · 재시도복구 ${recovered}/${retrySet.length}(전체대상 ${retryAll.length}·한도 ${RETRY_MAX}) · 재시도한도초과 ${retryAll.length > RETRY_MAX || timeHit}(시간초과 ${timeHit}) · 폴백 ${fallbackUsed} · fresh커버 ${(freshCoverage * 100).toFixed(1)}%`);

  const caps = [...capOf.entries()].map(([sym, cap]) => ({ sym, cap })).sort((a, b) => b.cap - a.cap);
  const diag: CapDiag = {
    total: STOCK_SYMS.length, batchOk, noCapField: noCapField.length, noResponse: noResponse.length,
    recovered, fallbackUsed, retryAttempted: retrySet.length, retryBudgetHit: retryAll.length > RETRY_MAX || timeHit, freshCoverage,
  };
  return { symbols: caps.slice(0, topN).map((c) => c.sym), tradeAmountOf, capOf, freshSet, diag };
}
// UTC 날짜(YYYY-MM-DD) 헬퍼 — us_market_cap as_of 등.
function at10(d: Date = new Date()): string { return d.toISOString().slice(0, 10); }

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
  tradeAmountOf?: Map<string, number>,
  opts: { skipChangeDiff?: boolean } = {}
): Promise<void> {
  const skipChangeDiff = opts.skipChangeDiff === true; // STEP 833 §3: 상태 재매핑은 하되 변화 diff 미기록(정상화 실행)
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
    // 2) 최종 상태로 변화 diff(어제 existing 대비) — tone이 실제 바뀐 렌즈만(STEP 764·806 §7). §3: 정상화 실행이면 diff 미기록.
    const prev = skipChangeDiff ? undefined : existing.get(sym);
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
  // 🔴 STEP 833 §2·§3: cutGateOk=false면 컷 재유도·프루닝 금지(편향 표본으로 판정 기준 안 만듦)·전날 컷 유지·ok:false.
  //   skipChangeDiff=true면 pass2가 상태는 재매핑하되 lens_state_changes diff는 기록 안 함(정상화 실행의 기준선 이동을 '종목 변화'로 오기록 방지).
  opts: { concurrency?: number; tradeAmountOf?: Map<string, number>; expected?: number; cutGateOk?: boolean; skipChangeDiff?: boolean } = {}
): Promise<{ ok: boolean; computed: number; universe: number; at: string; pruned: boolean; universeOk: boolean; pass2Ok: boolean; cutGateOk: boolean; cutsUpdated: boolean; changeDiffRecorded: boolean; warning?: string }> {
  const concurrency = opts.concurrency ?? 6;
  const tradeAmountOf = opts.tradeAmountOf;
  const cutGateOk = opts.cutGateOk !== false;      // STEP 833 §2: 기본 통과(KR 등 무전달 경로 불변)
  const skipChangeDiff = opts.skipChangeDiff === true; // STEP 833 §3
  const at = new Date().toISOString();
  const changeDate = at.slice(0, 10); // 크론 실행일(UTC date) — KR/US 통일, 표시 로케일화는 읽기 쪽(스펙)
  const sb = createAdminClient(); // RLS 우회(쓰기·kr_stock_snapshot 읽기)
  // 🔴 STEP 828 §2-1: 유니버스 하한 가드 — 이번 유니버스가 '직전 성공 실행'(=현재 lens_scores 행 수) 대비 70% 미만이면 붕괴로 간주.
  //   근거: 야후 부분장애로 1,000→400이 되면 saved/universe(=400/400=100%)는 통과해 나머지 600 lens_scores를 삭제한다.
  //   직전 실행분 대비로 봐야 이 함정을 막는다(KR·US 유니버스 크기가 서로 달라도 자기 기준으로 판단). 절대 하한 50은 초기/소국가탭 오검출 방지.
  //   기준값은 opts.expected로 오버라이드 가능(테스트·특수 호출용). universe=0은 아예 계산·삭제 금지.
  const { count: prevCount } = await sb
    .from("lens_scores").select("symbol", { count: "exact", head: true }).eq("market", market);
  const baseline = opts.expected ?? prevCount ?? universe.length;
  const floor = Math.max(50, Math.floor(baseline * 0.7));
  const universeOk = universe.length >= floor;
  if (universe.length === 0) {
    Sentry.captureMessage(`[lens-universe-empty] ${market} 유니버스 0 → 계산·프루닝 전면 중단(성공 아님)`, "error");
    return { ok: false, computed: 0, universe: 0, at, pruned: false, universeOk: false, pass2Ok: false, cutGateOk, cutsUpdated: false, changeDiffRecorded: false, warning: "universe-empty" };
  }
  if (!universeOk) {
    Sentry.captureMessage(
      `[lens-universe-collapse] ${market} 유니버스 ${universe.length} < 하한 ${floor}(직전 ~${baseline}) → 계산은 하되 프루닝·삭제 금지(대량 손실 방지)`,
      "error",
    );
  }
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
  // RSI 30/70(technical·와일더 경험칙)·F-Score 3/7(우리 밴딩)은 고정 관습 임계라 분포 유도서 제외(학술·업계 '표준'이라서가 아님).
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
  // 🔴 STEP 833 §2 핵심: 커버리지·구성 게이트 실패 시 컷을 '재유도하지 않는다' — 편향된 표본으로 판정 기준을 만드는 것이
  //   832 사고의 진짜 피해. 이 경우 전날 컷(prevCuts)을 그대로 유지 → 화면 as_of가 어제로 표시(사용자에 거짓 아님).
  let newCuts: CutMap = prevCuts;
  let cutsUpdated = false;
  if (!cutGateOk) {
    Sentry.captureMessage(`[lens-cut-gate] ${market} 취득 게이트 실패 → 컷 재유도 금지·전날 컷 유지(편향 표본으로 판정 기준 안 만듦)·프루닝 금지`, "error");
  } else if (cutRows.length) {
    const { error } = await sb.from("lens_cuts").upsert(cutRows, { onConflict: "market,lens_key" });
    if (error) Sentry.captureException(error, { tags: { pipeline: "lens_cuts", market } });
    else {
      cutsUpdated = true;
      newCuts = {};
      for (const r of cutRows as { lens_key: string; lo: number; hi: number; n: number; as_of: string }[]) {
        newCuts[r.lens_key] = { lo: r.lo, hi: r.hi, n: r.n, asOf: r.as_of };
      }
    }
  }

  // STEP 805 pass2(+806 §7) — 새 컷으로 상태 재매핑 + 최종 상태로 변화 diff(값 재계산 없이 DB 저장분만).
  //   pass1이 직전 컷(또는 없음→pending)으로 찍은 상태를 이 실행 분포 컷으로 다시 매핑 → 라이브/선계산 판정 일치.
  // 🔴 STEP 828 §2-4: pass2(상태 재매핑) 실패 시 프루닝을 건너뛴다 — 이전엔 Sentry 캡처 후 그대로 진행해
  //   상태가 어긋난 채로 프루닝이 돌았다. 재매핑이 실패하면 이번 실행 결과를 신뢰할 수 없으므로 삭제하지 않는다.
  // 🔴 STEP 833 §3: 정상화 실행(구성 대폭 변화)이면 상태는 재매핑하되 변화 diff는 기록 안 함(기준선 이동을 '종목 변화'로 오기록 방지).
  const changeDiffRecorded = !skipChangeDiff;
  if (skipChangeDiff) Sentry.captureMessage(`[lens-diff-skip] ${market} 유니버스 구성 대폭 변화(정상화) → 상태 재매핑은 하되 변화 diff 미기록`, "info");
  let pass2Ok = true;
  try {
    await pass2RemapAndDiff(sb, market, newCuts, at, changeDate, existing, tradeAmountOf, { skipChangeDiff });
  } catch (e) {
    pass2Ok = false;
    Sentry.captureException(e, { tags: { pipeline: "lens_states_remap", market } });
  }

  // 신선도(STEP 802 §5) — 이번 실행에서 갱신 안 된(유니버스 이탈) 행 삭제.
  // 🔴 STEP 806 §3: 저장 성공률이 낮으면(부분 실행) 프루닝이 정상 행을 대량 삭제할 수 있음 → 성공률 ≥80%일 때만.
  // 🔴 STEP 828 §2: 위 성공률 + 유니버스 하한(universeOk) + pass2 성공(pass2Ok) 3중 게이트를 모두 통과해야 프루닝.
  // 🔴 STEP 833 §2: 취득 게이트(cutGateOk)까지 4중 게이트를 모두 통과해야 프루닝(편향 유니버스로 정상 행 삭제 방지).
  const successRate = saved / universe.length;
  const canPrune = successRate >= 0.8 && universeOk && pass2Ok && cutGateOk;
  let pruned = false;
  if (canPrune) {
    try {
      await sb.from("lens_scores").delete().eq("market", market).lt("updated_at", at);
      pruned = true;
    } catch (e) {
      Sentry.captureException(e, { tags: { pipeline: "lens_scores_prune", market } });
    }
  } else {
    // 조용히 넘어가지 않는다 — 프루닝 건너뜀을 경고(부분 실행·유니버스 붕괴·pass2 실패·취득 게이트 실패 감지).
    const reason = !cutGateOk ? "취득 게이트 실패" : !universeOk ? "유니버스 붕괴" : !pass2Ok ? "pass2 실패" : `성공률 ${(successRate * 100).toFixed(0)}%<80%`;
    Sentry.captureMessage(
      `[lens-prune-skip] ${market} ${reason} → 프루닝 건너뜀(대량 삭제 방지·저장 ${saved}/${universe.length})`,
      "warning"
    );
    console.warn(`  ...프루닝 건너뜀(${reason} · ${saved}/${universe.length})`);
  }

  const warning = !cutGateOk ? "cut-gate-failed" : !universeOk ? "universe-collapse" : !pass2Ok ? "pass2-failed" : successRate < 0.8 ? "low-success" : undefined;
  return { ok: universeOk && pass2Ok && cutGateOk, computed: saved, universe: universe.length, at, pruned, universeOk, pass2Ok, cutGateOk, cutsUpdated, changeDiffRecorded, warning };
}

// US(기존 API 보존) — 시총 상위 N. 🔴 STEP 833: 3단 취득 + 커버리지/구성 게이트 + 정상화 diff 스킵.
export async function computeLensScores(topN = 1000, concurrency = 6) {
  const sb = createAdminClient();
  const { symbols: universe, tradeAmountOf, freshSet, diag } = await topByMarketCap(topN);

  // §2 취득 게이트(순수 판정 재사용) — 직전 상위 200 메가캡 티어는 us_market_cap서 유도(상수 티커 배열 금지).
  const { data: priorTop } = await sb.from("us_market_cap").select("symbol").order("market_cap", { ascending: false }).limit(200);
  const priorTopSyms = ((priorTop ?? []) as { symbol: string }[]).map((r) => r.symbol);
  const { coverageOk, compositionOk, compRatio, cutGateOk } = capGateDecision(diag.freshCoverage, priorTopSyms, freshSet);

  // §3 정상화 diff 스킵(순수 판정 재사용) — 직전 lens_scores US 유니버스 대비 churn.
  const { data: priorUni } = await sb.from("lens_scores").select("symbol").eq("market", "US");
  const priorSet = new Set(((priorUni ?? []) as { symbol: string }[]).map((r) => r.symbol));
  const { churn, skipChangeDiff } = churnDecision(universe, priorSet);

  // 🔴 STEP 894: diag.retryBudgetHit·diag.retryAttempted를 로그에 추가(같은 이유 — 계산되고 버려지던 값).
  console.log(`[computeLensScores US] fresh커버 ${(diag.freshCoverage * 100).toFixed(1)}%(게이트 ${coverageOk}) · 구성 ${(compRatio * 100).toFixed(1)}%(게이트 ${compositionOk}) · cutGateOk ${cutGateOk} · churn ${(churn * 100).toFixed(1)}%(diff스킵 ${skipChangeDiff}) · 폴백 ${diag.fallbackUsed} · 재시도복구 ${diag.recovered}/${diag.retryAttempted} · 재시도한도초과 ${diag.retryBudgetHit}`);
  if (!cutGateOk) Sentry.captureMessage(`[us-cut-gate] 취득 게이트 실패(커버 ${(diag.freshCoverage * 100).toFixed(1)}%·구성 ${(compRatio * 100).toFixed(1)}%) → 컷 재유도·프루닝 금지`, "error");

  return computeLensScoresFor(universe, "US", { concurrency, tradeAmountOf, cutGateOk, skipChangeDiff });
}

// 🔴 STEP 835: KR 유니버스 — kr_stock_snapshot **시총 상위 N**(834 측정 → C안: KR·US 모두 시총 통일·문헌 정합).
//   이전엔 거래대금 상위였으나 문헌 밖 정의 + 저변동 기준선 왜곡(KR 실측 판정 23.4% 뒤집힘·중앙 변동성 +13%) + churn↑라 시총으로 전환.
//   🔴 tradeAmountOf는 계속 채운다 — 유니버스 기준은 아니어도 lens_state_changes.trade_amount(오늘 화면 정렬·STEP 764)에 쓰인다.
export async function topKrByMarketCap(topN: number): Promise<{ symbols: string[]; tradeAmountOf: Map<string, number>; coverage: number; nullCapExcluded: number }> {
  const sb = createAdminClient();
  // STEP 803 §3: 우선주(끝자리 ≠ 0)는 밸류 렌즈 계산 불가 → 유니버스 제외(시총 정렬서도 동일). 여유 당겨(topN+200) 필터 후 컷.
  //   실측: 삼성전자우(005935·시총 3위·123조)가 우선주라 이 필터로 유니버스 미편입.
  const isPreferred = (s: string) => /^\d{6}$/.test(s) && !s.endsWith("0");
  // 시총 확보율(게이트용·조용히 안 버림·832 교훈): 전 종목 대비 market_cap 보유 비율.
  const { count: total } = await sb.from("kr_stock_snapshot").select("symbol", { count: "exact", head: true });
  const { count: withCap } = await sb.from("kr_stock_snapshot").select("symbol", { count: "exact", head: true }).not("market_cap", "is", null);
  const coverage = total ? (withCap ?? 0) / total : 0;
  const nullCapExcluded = (total ?? 0) - (withCap ?? 0);
  // 🔴 PostgREST 기본 max-rows 1000 → `.limit(1200)`은 1000에서 잘린다(우선주 제외 후 978로 미달). `.range()` 페이지네이션으로
  //   topN+여유를 확실히 긁는다(우선주가 고시총대에 몰려 버퍼 필요·실측 top-1200에 우선주 23). name_en 백필 스크립트와 동일 함정 회피.
  const all: { symbol: string; market_cap: number | null; trade_amount: number | null }[] = [];
  for (let from = 0; from < topN + 500; from += 1000) {
    const { data } = await sb.from("kr_stock_snapshot").select("symbol,market_cap,trade_amount").not("market_cap", "is", null).order("market_cap", { ascending: false }).range(from, from + 999);
    const page = (data ?? []) as { symbol: string; market_cap: number | null; trade_amount: number | null }[];
    all.push(...page);
    if (page.length < 1000) break;
  }
  const rows = all.filter((row) => !isPreferred(row.symbol)).slice(0, topN);
  const tradeAmountOf = new Map<string, number>();
  for (const row of rows) if (row.trade_amount != null) tradeAmountOf.set(row.symbol, Number(row.trade_amount));
  if (nullCapExcluded > 0) console.log(`[topKrByMarketCap] market_cap null 제외 ${nullCapExcluded}종목(조용히 안 버림)`);
  return { symbols: rows.map((row) => row.symbol), tradeAmountOf, coverage, nullCapExcluded };
}

// 🔴 STEP 835 §2·§3: KR 선계산 — 시총 유니버스 + 커버리지 게이트 + 전환/정상화 diff 스킵(US computeLensScores와 대칭).
export async function computeKrLensScores(topN = 1000, concurrency = 6) {
  const sb = createAdminClient();
  const { symbols: universe, tradeAmountOf, coverage } = await topKrByMarketCap(topN);
  // §2 커버리지 게이트: KR 시총은 우리 DB(kr_stock_snapshot·KRX 벌크)라 정상 100%(실측) → 95% 임계(5pp 여유·kr-perf 부분실패 감지).
  //   구성 게이트(직전 상위 N 유지)는 KR엔 미적용 — US 배치 quote 결측 양상이 없다(벌크 읽기). priorTopSyms=[]로 스킵.
  const { coverageOk, cutGateOk } = capGateDecision(coverage, [], new Set(), { coverageMin: 0.95 });
  // §3 전환/정상화 diff 스킵 — 직전 lens_scores KR 유니버스 대비 churn(전환일 대량 교체 → 스킵·813 §3 원리).
  const { data: priorUni } = await sb.from("lens_scores").select("symbol").eq("market", "KR");
  const priorSet = new Set(((priorUni ?? []) as { symbol: string }[]).map((r) => r.symbol));
  const { churn, skipChangeDiff } = churnDecision(universe, priorSet);
  console.log(`[computeKrLensScores] 시총커버 ${(coverage * 100).toFixed(1)}%(게이트 ${coverageOk}) · cutGateOk ${cutGateOk} · churn ${(churn * 100).toFixed(1)}%(diff스킵 ${skipChangeDiff}) · 유니버스 ${universe.length}`);
  if (!cutGateOk) Sentry.captureMessage(`[kr-cut-gate] KR 시총 확보율 ${(coverage * 100).toFixed(1)}%<95% → 컷 재유도·프루닝 금지`, "error");
  return computeLensScoresFor(universe, "KR", { concurrency, tradeAmountOf, cutGateOk, skipChangeDiff });
}
