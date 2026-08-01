import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revdcfEnabled } from "@/lib/revdcf/flag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

// STEP 854 §2 — 보드 배지용 배치 조회. 🔴 플래그 OFF면 enabled:false → 클라가 컬럼 자체를 안 그림.
export async function GET(req: Request) {
  if (!revdcfEnabled()) return NextResponse.json({ enabled: false, verdicts: {} });
  const raw = new URL(req.url).searchParams.get("symbols") || "";
  const symbols = raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 200);
  if (symbols.length === 0) return NextResponse.json({ enabled: true, verdicts: {} });
  const sb = createAdminClient();
  const asOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!asOf?.as_of) return NextResponse.json({ enabled: true, verdicts: {} });
  const rows = (await sb.from("revdcf_results").select("symbol, verdict, gap_years").eq("as_of", asOf.as_of).in("symbol", symbols)).data as { symbol: string; verdict: string; gap_years: number | null }[] | null;
  const verdicts: Record<string, { verdict: string; gapYears: number | null }> = {};
  for (const r of rows ?? []) verdicts[r.symbol.toUpperCase()] = { verdict: r.verdict, gapYears: r.gap_years };
  return NextResponse.json({ enabled: true, verdicts });
}
