import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// STEP 945 §3 — us_sector_resolved(캐시, lib/sector.ts resolveSector가 정본) 최신 as_of를 그대로 노출.
// 하루 단위로 갱신되는 데이터 — brokers/route.ts와 동일 관행(revalidate 86400).
export const revalidate = 86400;

export async function GET() {
  try {
    const sb = createAdminClient();
    const latest = (await sb.from("us_sector_resolved").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
    if (!latest) return NextResponse.json({ asOf: null, items: [] });

    const items: { symbol: string; sector: string | null; source: string | null }[] = [];
    for (let f = 0; ; f += 1000) {
      const { data } = await sb.from("us_sector_resolved").select("symbol, sector, source").eq("as_of", latest.as_of).range(f, f + 999);
      const c = (data ?? []) as typeof items;
      items.push(...c);
      if (c.length < 1000) break;
    }
    return NextResponse.json({ asOf: latest.as_of, items });
  } catch {
    return NextResponse.json({ asOf: null, items: [] });
  }
}
