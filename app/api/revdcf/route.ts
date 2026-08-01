import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

// 역DCF 결과 서빙 — 종목페이지용. revdcf_results(US 전용·매일 as_of)의 최신 행 + 분포 내 위치.
// 데이터가 US 전용이라 KR/타국 심볼은 자연히 null(섹션 미노출).
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 30 * 60 * 1000;

export async function GET(req: Request) {
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

  // 분포 내 위치: years 표본 총수 + 이 종목 GAP 이상인 수(기대 상위%)
  let sampleTotal: number | null = null, expectationTopPct: number | null = null;
  if (row.verdict === "years" && row.gap_years != null) {
    const total = (await sb.from("revdcf_results").select("cik", { count: "exact", head: true }).eq("as_of", asOf).eq("verdict", "years")).count ?? 0;
    const atOrAbove = (await sb.from("revdcf_results").select("cik", { count: "exact", head: true }).eq("as_of", asOf).eq("verdict", "years").gte("gap_years", row.gap_years as number)).count ?? 0;
    sampleTotal = total;
    if (total > 0) { const raw = (atOrAbove / total) * 100; expectationTopPct = Math.max(5, Math.round(raw / 5) * 5); } // 5% 단위·최소 5%(1%컷 금지)
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
      sampleTotal, expectationTopPct,
    },
  };
  cache.set(symbol, { at: Date.now(), data });
  return NextResponse.json(data);
}
