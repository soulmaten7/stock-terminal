import { NextResponse } from "next/server";
import { computeSymbolLenses } from "@/lib/lensCompute";
import { pickLocale } from "@/lib/lensCopy";
import { createAdminClient } from "@/lib/supabase/admin";
import { LENSES } from "@/lib/lenses/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// 온디맨드 결정론 렌즈 — 심볼당 요청 시 계산(공용 엔진 lib/lensCompute). 30분 인메모리 캐시(같은 종목 재조회 절감).
// ⚠️ 계산 로직은 lib/lensCompute.ts로 이전 — 배치 프리컴퓨트(스크리닝 토대)와 같은 함수 공유(엔진=검증 일치).
const cache = new Map<string, { at: number; data: unknown }>();

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
    await enrichPercentiles(symbol, data); // US 유니버스 대비 퍼센타일 주입(비US는 null)
    cache.set(cacheKey, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ symbol, error: String(e) }, { status: 200 });
  }
}
