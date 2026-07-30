import { NextResponse } from "next/server";
import { computeSymbolLenses } from "@/lib/lensCompute";
import { pickLocale } from "@/lib/lensCopy";
import { createAdminClient } from "@/lib/supabase/admin";
import { LENSES } from "@/lib/lenses/registry";
import { isActiveSymbol, marketOfSymbol } from "@/lib/activeMarkets";
import { isBotUA, clientIp, allowGeneration } from "@/lib/rateLimit";
import type { LensDistribution } from "@/lib/lenses/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// 온디맨드 결정론 렌즈 — 심볼당 요청 시 계산(공용 엔진 lib/lensCompute). 30분 인메모리 캐시(같은 종목 재조회 절감).
// ⚠️ 계산 로직은 lib/lensCompute.ts로 이전 — 배치 프리컴퓨트(스크리닝 토대)와 같은 함수 공유(엔진=검증 일치).
const cache = new Map<string, { at: number; data: unknown }>();
const CACHE_TTL = 30 * 60 * 1000;
const CACHE_MAX = 5000; // STEP 808 §8: 하드 상한 — 사이트맵 수천 심볼을 크롤러가 훑어도 무한 증가 안 하게(삽입순 Map).
// 만료·상한 스윕: 만료분 제거 후 여전히 상한 초과면 오래된(삽입순) 것부터 제거.
function sweepCache() {
  const now = Date.now();
  for (const [k, v] of cache) if (now - v.at >= CACHE_TTL) cache.delete(k);
  while (cache.size > CACHE_MAX) { const oldest = cache.keys().next().value; if (oldest === undefined) break; cache.delete(oldest); }
}

// lens_scores(US 유니버스·시총 상위 1000) 대비 팩터 상대순위(0~100·높을수록 우호 방향)를 렌즈에 주입.
// DB 함수 lens_percentiles(방향별 계산: 모멘텀·퀄리티=높을수록 / 저변동·밸류·자산성장=낮을수록 우호)를 호출.
// 심볼이 유니버스에 없으면(KR/JP/CN·소형주) 전부 null → 카드는 방향 라벨만 표시(안전·비US도 정상 동작).
async function enrichPercentiles(symbol: string, data: Awaited<ReturnType<typeof computeSymbolLenses>>) {
  try {
    if (!data.lenses.length) return;
    const sb = createAdminClient();
    const { data: rows, error } = await sb.rpc("lens_percentiles", { p_symbol: symbol });
    if (error || !Array.isArray(rows) || !rows.length) return;
    const p = rows[0] as {
      momentum_pctl: number | null; quality_pctl: number | null; lowvol_pctl: number | null;
      value_pctl: number | null; assetgrowth_pctl: number | null;
    };
    // 렌즈 key → RPC 결과 컬럼(방향은 DB 함수 lens_percentiles가 meta.percentile.dir대로 계산해 반환).
    const col: Record<string, number | null | undefined> = {
      momentum: p.momentum_pctl, quality: p.quality_pctl, lowvol: p.lowvol_pctl,
      valuation: p.value_pctl, assetgrowth: p.assetgrowth_pctl,
    };
    // "어느 렌즈가 percentile 대상인가"를 하드코딩 대신 레지스트리 meta.percentile로 판단(기술=null → 제외).
    const eligible = new Set(LENSES.filter((l) => l.meta.percentile != null).map((l) => l.meta.key));
    for (const l of data.lenses) {
      if (eligible.has(l.key) && l.key in col) l.percentile = col[l.key] ?? null;
    }
  } catch {
    /* 퍼센타일 실패는 무시 — 방향 라벨만으로도 카드 정상 동작 */
  }
}

// 🔴 STEP 831 §10-③: 퀄리티 분포 요약 주입 — 시장 단위(전 종목 공통)라 종목별 재조회 대신 시장 캐시(1h).
//   상세 페이지 요청마다 전 종목 스캔 안 함(§81 성능): DB 집계 RPC 1콜 + 시장별 1h 캐시 = 시장당 시간당 최대 1쿼리.
const distCache = new Map<string, { at: number; data: LensDistribution }>();
const DIST_TTL = 60 * 60 * 1000;
async function enrichQualityDistribution(symbol: string, data: Awaited<ReturnType<typeof computeSymbolLenses>>) {
  try {
    const q = data.lenses.find((l) => l.key === "quality");
    if (!q || q.value == null) return; // 결측 종목은 비교 대상 없음 → 분포 미주입
    const market = marketOfSymbol(symbol);
    if (market !== "KR" && market !== "US") return; // 선계산 유니버스 없는 시장은 분포 없음
    const key = `${market}:quality`;
    let entry = distCache.get(key);
    if (!entry || Date.now() - entry.at >= DIST_TTL) {
      const sb = createAdminClient();
      const { data: rows, error } = await sb.rpc("lens_distribution", { p_market: market, p_lens: "quality" });
      const r = Array.isArray(rows) ? (rows[0] as Record<string, unknown>) : null;
      if (error || !r || r.n == null) return;
      entry = { at: Date.now(), data: {
        market, n: Number(r.n), asOf: (r.as_of as string) ?? null,
        min: Number(r.mn), p30: Number(r.p30), median: Number(r.med), p70: Number(r.p70), max: Number(r.mx),
      } };
      distCache.set(key, entry);
    }
    q.distribution = entry.data;
  } catch {
    /* 분포 실패는 무시 — 나머지 카드 정상 */
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });
  // 🔴 STEP 806 §6: 활성 시장(KR·US)만 — 파킹 시장 심볼은 온디맨드 계산 차단(brief와 정합).
  if (!isActiveSymbol(symbol)) return NextResponse.json({ error: "inactive_market" }, { status: 400 });
  const locale = pickLocale(url.searchParams.get("lang")); // 기본 ko · ?lang=en
  const cacheKey = `${symbol}:${locale}`;

  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL) return NextResponse.json(hit.data); // 캐시 히트는 무조건 통과(제품 가치·STEP 808 §8)

  // 캐시 미스만 보호: 봇 차단 + IP 레이트리밋(캐시 미스=야후 3콜+Supabase 2쿼리 → 크롤러가 사이트맵 훑으면 야후 레이트리밋 유발·크론까지 위협).
  if (isBotUA(req.headers.get("user-agent"))) return NextResponse.json({ symbol, error: "blocked" }, { status: 429 });
  if (!allowGeneration(`lens:${clientIp(req)}`, 30, 300)) return NextResponse.json({ symbol, error: "rate_limited" }, { status: 429 });
  sweepCache();

  try {
    const data = await computeSymbolLenses(symbol, locale);
    await enrichPercentiles(symbol, data); // US 유니버스 대비 퍼센타일 주입(비US는 null)
    await enrichQualityDistribution(symbol, data); // STEP 831 §10-③: 퀄리티 시장 분포 주입
    // STEP 806 §7: pending(컷 준비 중)이 하나라도 있으면 캐시하지 않음 — 크론 직후 컷 생기면 즉시 정상 판정 반영.
    const hasPending = Array.isArray(data.lenses) && data.lenses.some((l) => l.state === "pending");
    if (!hasPending) cache.set(cacheKey, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ symbol, error: String(e) }, { status: 200 });
  }
}
