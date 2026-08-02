import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revdcfEnabled } from "@/lib/revdcf/flag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

// 역DCF 결과 서빙 — 종목페이지용. revdcf_results(US 전용·매일 as_of)의 최신 행 + 분포 내 위치.
// 데이터가 US 전용이라 KR/타국 심볼은 자연히 null(섹션 미노출).
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 30 * 60 * 1000;

export async function GET(req: Request) {
  // 🔴 STEP 868: 피처 플래그 OFF면 데이터에 닿기 전에 끊는다.
  //   854가 게이팅을 3곳(페이지 2·batch 1)에만 넣고 이 라우트를 빠뜨려 853부터 공개돼 있었다.
  //   {result:null}은 기존 반환 형태 재사용 — RevDcfSection이 이미 미렌더로 처리한다(부작용 0).
  if (!revdcfEnabled()) return NextResponse.json({ result: null });

  const symbol = (new URL(req.url).searchParams.get("symbol") || "").toUpperCase().trim();
  if (!symbol) return NextResponse.json({ error: "no symbol" }, { status: 400 });
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.data);

  const sb = createAdminClient();
  // 최신 as_of
  const asOfRow = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const asOf = asOfRow?.as_of;
  if (!asOf) return NextResponse.json({ result: null });

  const row = (await sb.from("revdcf_results").select("*").eq("as_of", asOf).eq("symbol", symbol).maybeSingle()).data as Record<string, unknown> | null;
  if (!row) { const data = { result: null }; cache.set(symbol, { at: Date.now(), data }); return NextResponse.json(data); }

  // 분포 내 위치 — 🔴 STEP 855 §2: "상위 x%"(방향 헷갈림) 폐기. years 표본 내 순위 + 3분류(기대 낮음/중간/높음).
  //   긴 GAP = 시장 기대 높음. rankFromLongest 1 = 가장 긴 기간. 좋다/나쁘다 말하지 않는다(BRAND_IDENTITY).
  let sampleTotal: number | null = null, rankFromLongest: number | null = null;
  let expectationLevel: "low" | "mid" | "high" | null = null;
  if (row.verdict === "years" && row.gap_years != null) {
    const g = row.gap_years as number;
    const total = (await sb.from("revdcf_results").select("cik", { count: "exact", head: true }).eq("as_of", asOf).eq("verdict", "years")).count ?? 0;
    const longer = (await sb.from("revdcf_results").select("cik", { count: "exact", head: true }).eq("as_of", asOf).eq("verdict", "years").gt("gap_years", g)).count ?? 0;
    const shorter = (await sb.from("revdcf_results").select("cik", { count: "exact", head: true }).eq("as_of", asOf).eq("verdict", "years").lt("gap_years", g)).count ?? 0;
    sampleTotal = total;
    if (total > 0) {
      rankFromLongest = longer + 1; // 동률이면 최상위 순번
      const fracShorter = shorter / total; // 0에 가까울수록 짧은 기간(기대 낮음)
      expectationLevel = fracShorter < 1 / 3 ? "low" : fracShorter > 2 / 3 ? "high" : "mid";
    }
  }

  const flags = (row.flags ?? {}) as Record<string, unknown>;
  const data = {
    result: {
      symbol, asOf,
      verdict: row.verdict, gapYears: row.gap_years,
      band: { minus1: row.gap_wacc_minus1, plus1: row.gap_wacc_plus1 },
      explainedPct: row.explained_pct, thresholdMargin: row.threshold_margin, monotonic: row.monotonic,
      drivers: {
        salesGrowth: row.sales_growth, operatingMargin: row.operating_margin, startingMargin: row.starting_margin,
        taxRate: row.tax_rate, fixedCapitalRate: row.fixed_capital_rate,
        fixedCapitalRateLevel: row.fixed_capital_rate_level, fixedCapitalRateMarginal: row.fixed_capital_rate_marginal,
        workingCapitalRate: row.working_capital_rate, wacc: row.wacc,
      },
      verdictMarginal: row.verdict_marginal, gapYearsMarginal: row.gap_years_marginal,
      skipReason: row.skip_reason,
      flags: { revenueCheck: flags.revenueCheck, ebitSource: flags.ebitSource, growthIsHistorical: flags.growthIsHistorical, industry: flags.industry, damodaranAsOf: flags.damodaranAsOf },
      sampleTotal, rankFromLongest, expectationLevel,
    },
  };
  cache.set(symbol, { at: Date.now(), data });
  return NextResponse.json(data);
}
