// STEP 832 — 진단 전용 프로브(프로덕션 무수정). topByMarketCap 경로를 복사·계측해 US 초대형주(JPM·V·XOM…) 누락 지점 특정.
// 실행: npx tsx scripts/probe_us_universe.ts
// 🔴 프로덕션 lib/lensPrecompute.ts는 건드리지 않는다. 여기 로직은 topByMarketCap을 그대로 복제 + 계측판만 추가.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import YahooFinance from "yahoo-finance2";
import symbols from "../data/us_symbols.json";
import { createAdminClient } from "../lib/supabase/admin";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbols as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const NAMED = ["JPM", "V", "XOM", "PG", "HD", "MA", "LLY", "AMD", "MU", "BAC", "GS", "AAPL", "MSFT"];

// 프로덕션과 동일한 동시성 제한(6).
async function mapLimit<T>(arr: T[], limit: number, fn: (x: T, i: number) => Promise<void>): Promise<void> {
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; await fn(arr[cur], cur); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
}

type ChunkStat = { i: number; requested: number; returned: number; withCap: number; noCapInResp: number; error?: string };

type RunResult = {
  label: string;
  nChunks: number;
  capsLen: number;
  respCount: number;           // 응답에 등장한 고유 심볼 수
  noResponse: Set<string>;     // 요청했으나 어떤 응답에도 없음
  noCapField: Set<string>;     // 응답엔 있으나 marketCap 없음/0/음수
  capMap: Map<string, number>; // 시총 얻은 심볼→값(배치 경로)
  cap1000th: number | null;
  stats: ChunkStat[];
  errors: Record<string, number>;
};

async function runOnce(label: string): Promise<RunResult> {
  const chunks: string[][] = [];
  for (let i = 0; i < STOCK_SYMS.length; i += 100) chunks.push(STOCK_SYMS.slice(i, i + 100));
  const caps: { sym: string; cap: number }[] = [];
  const respSymbols = new Set<string>();
  const noCapField = new Set<string>();
  const stats: ChunkStat[] = new Array(chunks.length);
  const errors: Record<string, number> = {};

  await mapLimit(chunks, 6, async (grp, ci) => {
    const st: ChunkStat = { i: ci, requested: grp.length, returned: 0, withCap: 0, noCapInResp: 0 };
    try {
      const qs = (await yf.quote(grp)) as Array<{ symbol?: string; marketCap?: number }>;
      const arr = Array.isArray(qs) ? qs : [];
      st.returned = arr.length;
      for (const q of arr) {
        if (q?.symbol) respSymbols.add(q.symbol);
        if (q?.symbol && typeof q.marketCap === "number" && q.marketCap > 0) { caps.push({ sym: q.symbol, cap: q.marketCap }); st.withCap++; }
        else if (q?.symbol) { noCapField.add(q.symbol); st.noCapInResp++; }
      }
    } catch (e) {
      const err = e as { name?: string; message?: string };
      const key = `${err?.name || "err"}: ${(err?.message || "").slice(0, 70)}`;
      errors[key] = (errors[key] || 0) + 1;
      st.error = key;
    }
    stats[ci] = st;
  });

  const noResponse = new Set(STOCK_SYMS.filter((s) => !respSymbols.has(s)));
  caps.sort((a, b) => b.cap - a.cap);
  const capMap = new Map(caps.map((c) => [c.sym, c.cap]));
  const cap1000th = caps[999]?.cap ?? null;
  return { label, nChunks: chunks.length, capsLen: caps.length, respCount: respSymbols.size, noResponse, noCapField, capMap, cap1000th, stats, errors };
}

function fmtCap(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${(n / 1e9).toFixed(1)}B`;
}

function summarizeChunks(stats: ChunkStat[]) {
  const returned = stats.map((s) => s.returned).sort((a, b) => a - b);
  const sum = returned.reduce((a, b) => a + b, 0);
  const min = returned[0], max = returned[returned.length - 1], med = returned[Math.floor(returned.length / 2)];
  const noCapTotal = stats.reduce((a, s) => a + s.noCapInResp, 0);
  const errChunks = stats.filter((s) => s.error).length;
  return { sum, min, med, max, noCapTotal, errChunks };
}

(async () => {
  console.log(`# US 유니버스 프로브 (STEP 832)`);
  console.log(`STOCK_SYMS(type=stock) = ${STOCK_SYMS.length} · 청크(100) = ${Math.ceil(STOCK_SYMS.length / 100)}`);
  console.log(`동시성 = 6 (프로덕션 동일) · NAMED = ${NAMED.join(",")}`);
  console.log();

  // ── RUN 1 ──
  const r1 = await runOnce("RUN1");
  const c1 = summarizeChunks(r1.stats);
  console.log(`## RUN1`);
  console.log(`청크 응답길이: 합계 ${c1.sum} / 요청 ${STOCK_SYMS.length} · chunk당 min ${c1.min} · med ${c1.med} · max ${c1.max}`);
  console.log(`응답에 있으나 marketCap 없음/0/음수: ${c1.noCapTotal}개 · 청크 예외: ${c1.errChunks}개`);
  console.log(`caps.length(시총 확보) = ${r1.capsLen} / ${STOCK_SYMS.length} · 응답 등장 고유심볼 = ${r1.respCount}`);
  console.log(`요청했으나 응답에 없음(noResponse) = ${r1.noResponse.size}개 · 응답엔 있으나 cap 없음(noCapField) = ${r1.noCapField.size}개`);
  console.log(`1000번째 시총(경계값) = ${fmtCap(r1.cap1000th)}`);
  if (Object.keys(r1.errors).length) { console.log(`예외 유형:`); for (const [k, v] of Object.entries(r1.errors)) console.log(`  ${v}× ${k}`); }
  console.log();

  // ── 지정 심볼: 배치 결과 vs noResponse/noCapField 분류 ──
  console.log(`### 지정 심볼 — 배치(100청크) 경로 분류`);
  for (const s of NAMED) {
    const inCap = r1.capMap.has(s);
    const cls = inCap ? `cap ${fmtCap(r1.capMap.get(s))}` : r1.noResponse.has(s) ? "응답에 없음(noResponse)" : r1.noCapField.has(s) ? "응답에 있으나 cap 없음" : "미상(불명)";
    console.log(`  ${s.padEnd(6)} 배치: ${inCap ? "있음" : "없음"} · ${cls} · top1000경계 대비 ${inCap && r1.cap1000th != null ? (r1.capMap.get(s)! >= r1.cap1000th ? "상위1000 안" : "상위1000 밖(탈락)") : "-"}`);
  }
  console.log();

  // ── 지정 심볼: 단건 조회 ──
  console.log(`### 지정 심볼 — 단건 조회(yf.quote(sym))`);
  for (const s of NAMED) {
    try {
      const q = (await yf.quote(s)) as { symbol?: string; marketCap?: number } | undefined;
      const cap = typeof q?.marketCap === "number" ? q.marketCap : null;
      const batchCap = r1.capMap.get(s) ?? null;
      const verdict = cap != null && batchCap == null ? "🔴 배치누락·단건있음 → 배치 응답 절단"
        : cap == null && batchCap == null ? "🔴 양쪽 없음 → 필드 자체 미제공"
        : cap != null && batchCap != null ? "양쪽 있음 → 정렬/필터/저장 단계 원인"
        : "단건없음/배치있음(이상)";
      console.log(`  ${s.padEnd(6)} 단건 marketCap=${fmtCap(cap)} · 배치=${fmtCap(batchCap)} · ${verdict}`);
    } catch (e) {
      console.log(`  ${s.padEnd(6)} 단건 예외: ${(e as { message?: string })?.message?.slice(0, 70)}`);
    }
  }
  console.log();

  // ── 유니버스(시총 상위 1000) vs 실제 lens_scores 저장분 비교 — 어디서 탈락하는지 특정 ──
  console.log(`### 유니버스(시총 상위 1000) vs lens_scores(US) 저장 비교`);
  try {
    const sb = createAdminClient();
    const savedSyms = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").range(from, from + 999);
      const rows = (data ?? []) as { symbol: string }[];
      for (const r of rows) savedSyms.add(r.symbol);
      if (rows.length < 1000) break;
    }
    const universe1000 = [...r1.capMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 1000).map(([s]) => s);
    const uniSet = new Set(universe1000);
    const inUniNotSaved = universe1000.filter((s) => !savedSyms.has(s));
    const savedNotInUni = [...savedSyms].filter((s) => !uniSet.has(s));
    console.log(`  lens_scores US 저장 = ${savedSyms.size} · 유니버스(top1000) = ${universe1000.length}`);
    console.log(`  🔴 유니버스에 있으나 저장 안 됨 = ${inUniNotSaved.length}개 (이게 진짜 탈락분)`);
    console.log(`  저장됐으나 유니버스(top1000) 밖 = ${savedNotInUni.length}개`);
    // 탈락분 상위 20개(시총 순)와 값
    const dropTop = inUniNotSaved.map((s) => ({ s, cap: r1.capMap.get(s)! })).sort((a, b) => b.cap - a.cap).slice(0, 20);
    console.log(`  탈락분 시총 상위 20: ` + dropTop.map((d) => `${d.s}(${fmtCap(d.cap)})`).join(" "));
    // NAMED가 저장분에 있는지
    console.log(`  NAMED 저장여부: ` + NAMED.map((s) => `${s}=${savedSyms.has(s) ? "저장" : "없음"}`).join(" "));
    // 저장분의 시총 커버(유니버스 순위상 어디까지 저장됐나) — 저장분 중 유니버스 최저 순위
    const uniRank = new Map(universe1000.map((s, i) => [s, i + 1]));
    const savedRanks = [...savedSyms].map((s) => uniRank.get(s)).filter((x): x is number => x != null).sort((a, b) => a - b);
    console.log(`  저장분의 유니버스 순위: min ${savedRanks[0]} · max ${savedRanks[savedRanks.length - 1]} · 저장된 top1000 내 개수 ${savedRanks.length}`);
    // 🔑 저장됐으나 top1000 밖인 198개 — 전체 caps 순위(1위=최대시총)로 어디쯤인지. 경계(1000~1200)에 몰리면 "유니버스가 메가캡 빠진 채 만들어져 경계가 내려감" 증거.
    const fullRank = new Map([...r1.capMap.entries()].sort((a, b) => b[1] - a[1]).map(([s], i) => [s, i + 1]));
    const extraRanks = savedNotInUni.map((s) => fullRank.get(s)).filter((x): x is number => x != null).sort((a, b) => a - b);
    if (extraRanks.length) console.log(`  top1000밖 저장분(${extraRanks.length}) 전체시총순위: min ${extraRanks[0]} · med ${extraRanks[Math.floor(extraRanks.length / 2)]} · max ${extraRanks[extraRanks.length - 1]}`);
    // 탈락 202개 전체 순위(메가캡=상위인데 탈락 → 취득 시점 문제 방증)
    const dropRanks = inUniNotSaved.map((s) => fullRank.get(s)).filter((x): x is number => x != null).sort((a, b) => a - b);
    if (dropRanks.length) console.log(`  탈락분(${dropRanks.length}) 전체시총순위: min ${dropRanks[0]} · med ${dropRanks[Math.floor(dropRanks.length / 2)]} · max ${dropRanks[dropRanks.length - 1]}`);
    console.log(`  참고 경계 시총: 1위 ${fmtCap([...r1.capMap.values()].sort((a, b) => b - a)[0])} · 1000위 ${fmtCap(r1.cap1000th)} · 1200위 ${fmtCap([...r1.capMap.values()].sort((a, b) => b - a)[1199])}`);
  } catch (e) {
    console.log(`  DB 비교 실패: ${(e as { message?: string })?.message}`);
  }
  console.log();

  // ── 간격 후 RUN 2 (결정론 vs 간헐) ──
  console.log(`(30초 간격 후 RUN2 — 결정론 vs 간헐 판별)`);
  await new Promise((res) => setTimeout(res, 30_000));
  const r2 = await runOnce("RUN2");
  const c2 = summarizeChunks(r2.stats);
  console.log(`## RUN2`);
  console.log(`caps.length = ${r2.capsLen} · noResponse = ${r2.noResponse.size} · noCapField = ${r2.noCapField.size} · 1000번째 = ${fmtCap(r2.cap1000th)} · 응답합계 ${c2.sum} · 예외청크 ${c2.errChunks}`);

  // 누락 집합 비교(결정론이면 동일)
  const inter = [...r1.noResponse].filter((s) => r2.noResponse.has(s)).length;
  const onlyR1 = [...r1.noResponse].filter((s) => !r2.noResponse.has(s)).length;
  const onlyR2 = [...r2.noResponse].filter((s) => !r1.noResponse.has(s)).length;
  console.log(`### noResponse 집합 비교: 교집합 ${inter} · RUN1만 ${onlyR1} · RUN2만 ${onlyR2} → ${onlyR1 === 0 && onlyR2 === 0 ? "결정론(동일)" : "간헐(다름)"}`);
  console.log(`### NAMED 재현: ` + NAMED.map((s) => `${s}=${r1.capMap.has(s) ? "1" : "0"}/${r2.capMap.has(s) ? "1" : "0"}`).join(" "));
  console.log();
  console.log(`(끝)`);
})().catch((e) => { console.error("PROBE FATAL", e); process.exit(1); });
