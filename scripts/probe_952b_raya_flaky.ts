// STEP 952b — resolveSector()를 동일 인자로 5회 연속 호출해 RAYA 결과·damo 총행수가 매번 같은지 확인.
// 🔴 DB 읽기만. lib/sector.ts 무수정.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";

async function main() {
  const sb = createAdminClient();
  const valRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_valuation").select("symbol").eq("as_of", "2026-08-08").range(f, f + 999);
    const c = (data ?? []) as typeof valRows;
    valRows.push(...c);
    if (c.length < 1000) break;
  }
  const symbols = valRows.map((r) => r.symbol);

  // 참고: damodaran_industry is_us_listed=true 전체 행수를 매번 새로 세본다(순서 무관 COUNT — 이건 항상 같아야 정상)
  for (let i = 1; i <= 5; i++) {
    const { count } = await sb.from("damodaran_industry").select("*", { count: "exact", head: true }).eq("is_us_listed", true);
    const full = await resolveSector(sb, symbols);
    const unclassifiedCount = symbols.length - full.size;
    console.log(`[run ${i}] damodaran_industry(is_us_listed=true) COUNT=${count} · full.size=${full.size} · 미분류=${unclassifiedCount} · RAYA=${full.has("RAYA") ? "분류됨(" + full.get("RAYA")!.source + ")" : "미분류"}`);
  }
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
