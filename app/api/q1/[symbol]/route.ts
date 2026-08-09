import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { q1Enabled } from "@/lib/q1/flag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

// STEP 957 §2 — Q1 카드 데이터 서빙. us_valuation ⋈ us_sector_relative ⋈ us_sector_wide 조회만 — 계산하지 않는다.
// 백분위는 STEP 956 크론 배선이 이미 저장해 둔 값을 그대로 읽는다. US 전용(KR 6자리 심볼은 404).
const KR_SYMBOL = /^\d{6}$/;
const AXES = ["per", "pbr", "psr", "evEbitda"] as const;
type Axis = (typeof AXES)[number];
const AXIS_COLUMN: Record<Axis, string> = { per: "per", pbr: "pbr", psr: "psr", evEbitda: "ev_ebitda" };

const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  // 🔴 플래그 OFF면 데이터에 닿기 전에 끊는다(revdcf route.ts §868과 같은 원칙, 단 이 라우트는 404로 응답).
  if (!q1Enabled()) return notFound();

  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw ?? "").toUpperCase().trim();
  if (!symbol || KR_SYMBOL.test(symbol)) return notFound(); // US 전용

  const sb = createAdminClient();

  const asOfRow = (await sb.from("us_valuation").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const asOf = asOfRow?.as_of;
  if (!asOf) return notFound();

  const valRow = (await sb.from("us_valuation").select("per, pbr, psr, ev_ebitda, per_basis, fundamentals_fiscal_year").eq("as_of", asOf).eq("symbol", symbol).maybeSingle()).data as {
    per: number | null; pbr: number | null; psr: number | null; ev_ebitda: number | null; per_basis: string | null; fundamentals_fiscal_year: number | null;
  } | null;
  if (!valRow) return notFound();

  const relRow = (await sb.from("us_sector_relative").select("sector, per_pct, pbr_pct, psr_pct, ev_ebitda_pct, per_n, pbr_n, psr_n, ev_ebitda_n, unavailable").eq("as_of", asOf).eq("symbol", symbol).maybeSingle()).data as {
    sector: string | null; per_pct: number | null; pbr_pct: number | null; psr_pct: number | null; ev_ebitda_pct: number | null;
    per_n: number | null; pbr_n: number | null; psr_n: number | null; ev_ebitda_n: number | null; unavailable: Partial<Record<Axis, string>>;
  } | null;

  const wideRow = (await sb.from("us_sector_wide").select("source").eq("as_of", asOf).eq("symbol", symbol).maybeSingle()).data as { source: string | null } | null;

  // 🔴 relRow가 없으면(아직 그 as_of로 STEP 956 배선이 안 돈 경우) "섹터 대비 위치 미확정"으로 취급 —
  //   NO_SECTOR가 가장 가까운 뜻이지만 원인은 다르다(계산 안 됨 vs 섹터 없음). 코드로만 구분, 화면 문구는 동일.
  const axes: Record<Axis, { value: number | null; pct: number | null; n: number | null; unavailable: string | null }> = {} as never;
  for (const axis of AXES) {
    const col = AXIS_COLUMN[axis];
    const value = (valRow as unknown as Record<string, number | null>)[col] ?? null;
    const pctCol = `${col}_pct`, nCol = `${col}_n`;
    const pct = relRow ? ((relRow as unknown as Record<string, number | null>)[pctCol] ?? null) : null;
    const n = relRow ? ((relRow as unknown as Record<string, number | null>)[nCol] ?? null) : null;
    const unavailable = relRow ? (relRow.unavailable?.[axis] ?? null) : "NO_SECTOR";
    axes[axis] = { value, pct, n, unavailable };
  }

  const revAsOfRow = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  let revdcf: { verdict: string; gapYears: number | null } | null = null;
  let yearWindow: number[] | null = null;
  if (revAsOfRow?.as_of) {
    const revRow = (await sb.from("revdcf_results").select("verdict, gap_years, flags").eq("as_of", revAsOfRow.as_of).eq("symbol", symbol).maybeSingle()).data as {
      verdict: string; gap_years: number | null; flags: { yearWindow?: number[] } | null;
    } | null;
    if (revRow) {
      revdcf = { verdict: revRow.verdict, gapYears: revRow.gap_years };
      yearWindow = revRow.flags?.yearWindow ?? null; // 없으면 951 이전 옛 창(정정 §2-2)
    }
  }

  return NextResponse.json({
    symbol, asOf, sector: relRow?.sector ?? null, sectorSource: wideRow?.source ?? null,
    axes,
    fiscalYear: valRow.fundamentals_fiscal_year, perBasis: valRow.per_basis,
    revdcf, yearWindow,
  });
}
