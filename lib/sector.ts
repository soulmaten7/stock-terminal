// STEP 938 — damodaran_industry 조회를 한 곳으로 모은다.
// 규칙 5-2(y=f(x)): 값이 아니라 식을 만든다 — 출처·반환필드를 인자로 받고, 반환에 출처를 동봉한다.
// 🔴 이 STEP은 source="damodaran" · field="industryGroup" 한 조합만 구현한다. 다른 조합(SEC·나스닥·primary_sector)은 939 이후.
import type { SupabaseClient } from "@supabase/supabase-js";

export type SectorMap = {
  byTicker: Map<string, string>;
  rows: number;
  source: "damodaran";
};

export async function fetchSectorMap(
  sb: SupabaseClient,
  opts: { field: "industryGroup"; source: "damodaran" }
): Promise<SectorMap> {
  const rows: { ticker_norm: string; industry_group: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("damodaran_industry").select("ticker_norm, industry_group").eq("is_us_listed", true).range(f, f + 999);
    const c = (data ?? []) as typeof rows;
    rows.push(...c);
    if (c.length < 1000) break;
  }
  const byTicker = new Map(rows.map((r) => [r.ticker_norm, r.industry_group]));
  return { byTicker, rows: rows.length, source: opts.source };
}
