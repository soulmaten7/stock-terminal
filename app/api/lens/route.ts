import { NextResponse } from "next/server";
import { computeSymbolLenses } from "@/lib/lensCompute";
import { pickLocale } from "@/lib/lensCopy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// 온디맨드 결정론 렌즈 — 심볼당 요청 시 계산(공용 엔진 lib/lensCompute). 30분 인메모리 캐시(같은 종목 재조회 절감).
// ⚠️ 계산 로직은 lib/lensCompute.ts로 이전 — 배치 프리컴퓨트(스크리닝 토대)와 같은 함수 공유(엔진=검증 일치).
const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });
  const locale = pickLocale(url.searchParams.get("lang")); // 기본 ko · ?lang=en
  const cacheKey = `${symbol}:${locale}`;

  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return NextResponse.json(hit.data);

  try {
    const data = await computeSymbolLenses(symbol, locale);
    cache.set(cacheKey, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ symbol, error: String(e) }, { status: 200 });
  }
}
