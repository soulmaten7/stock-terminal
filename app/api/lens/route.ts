import { NextResponse } from "next/server";
import { computeSymbolLenses } from "@/lib/lensCompute";
import { pickLocale } from "@/lib/lensCopy";
import { isActiveSymbol } from "@/lib/activeMarkets";
import { isBotUA, clientIp, allowGeneration } from "@/lib/rateLimit";

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
    // 2026-09-05(ORDER_트릴리언렌즈크론정지_0905): enrichPercentiles/enrichQualityDistribution
    // (lens_scores 기반 RPC) 제거 — StockLensClient.tsx가 data.lenses를 렌더링하지 않게 된 지 오래라
    // (§719 주석 참조) percentile·distribution 필드는 이 라우트의 유일한 살아있는 소비처인 그 파일에서도
    // 이미 전혀 안 읽힘. 크론이 멈춰 값이 stale해질 걸 대비해 끄는 게 아니라, 애초에 아무도 안 읽는
    // 값을 계산해 매 캐시미스마다 RPC 2콜을 쓰던 낭비를 없앤다.
    // STEP 806 §7: pending(컷 준비 중)이 하나라도 있으면 캐시하지 않음 — 크론 직후 컷 생기면 즉시 정상 판정 반영.
    const hasPending = Array.isArray(data.lenses) && data.lenses.some((l) => l.state === "pending");
    if (!hasPending) cache.set(cacheKey, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ symbol, error: String(e) }, { status: 200 });
  }
}
