// STEP 952b §2 — RAYA가 resolveSector의 어느 지점에서 떨어지는지 실행 중 값을 직접 찍어본다.
// 🔴 lib/sector.ts를 수정하지 않는다. DB 읽기만. resolveSector()는 무수정으로 그대로 호출.
// 실행: npx tsx scripts/probe_952b_raya_trace.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";

async function main() {
  const sb = createAdminClient();

  // ── resolveSector 내부와 동일한 damo fetch를 그대로 재현해 중간값을 찍는다(읽기만, 로직 그대로 복제) ──
  const { data: damoRaw, error: damoErr } = await sb.from("damodaran_industry").select("ticker_norm, primary_sector, sic_code").eq("is_us_listed", true).eq("ticker_norm", "RAYA");
  console.log("=== fetchAll 재현: is_us_listed=true AND ticker_norm='RAYA' 단일쿼리 ===");
  console.log("error:", damoErr);
  console.log("data:", JSON.stringify(damoRaw, null, 2));

  // ── fetchAll의 페이지네이션 루프를 그대로 재현(1000행 단위) — 혹시 RAYA가 뒤쪽 페이지에서 손실되는지 확인 ──
  const rows: { ticker_norm: string; primary_sector: string | null; sic_code: string | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await sb.from("damodaran_industry").select("ticker_norm, primary_sector, sic_code").eq("is_us_listed", true).range(f, f + 999);
    if (error) { console.log(`🔴 페이지 f=${f} 에러:`, error); break; }
    const c = (data ?? []) as typeof rows;
    rows.push(...c);
    console.log(`페이지 f=${f}: ${c.length}행 (누적 ${rows.length})`);
    if (c.length < 1000) break;
  }
  console.log(`\nfetchAll 재현 총 행수: ${rows.length}`);
  const rayaInFull = rows.filter((r) => r.ticker_norm === "RAYA");
  console.log("전체 페이지네이션에서 RAYA:", JSON.stringify(rayaInFull, null, 2));

  const damoByNorm = new Map(rows.map((r) => [r.ticker_norm, r]));
  console.log("\ndamoByNorm.get('RAYA'):", JSON.stringify(damoByNorm.get("RAYA")));
  console.log("damoByNorm.size:", damoByNorm.size);

  // 중복 ticker_norm이 damo 배열 안에 몇 번 등장하는지(Map 생성자가 마지막 값으로 덮어쓰므로, 중복이면 마지막 것이 이긴다)
  const dupCount = new Map<string, number>();
  for (const r of rows) dupCount.set(r.ticker_norm, (dupCount.get(r.ticker_norm) ?? 0) + 1);
  const raya1000dup = dupCount.get("RAYA");
  console.log("rows 배열 내 'RAYA' 등장 횟수(is_us_listed=true 필터 적용 후):", raya1000dup);

  // ── 실제 resolveSector()를 무수정으로 그대로 호출해 RAYA 하나만 targets로 던져본다 ──
  console.log("\n=== resolveSector(sb, ['RAYA']) 단독 호출 ===");
  const single = await resolveSector(sb, ["RAYA"]);
  console.log("결과:", JSON.stringify(Array.from(single.entries()), null, 2));

  // ── 실제 조건과 동일하게(us_valuation 1,127 전체) 호출해서 RAYA가 그 안에서도 같은지 재확인 ──
  const valRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_valuation").select("symbol").eq("as_of", "2026-08-08").range(f, f + 999);
    const c = (data ?? []) as typeof valRows;
    valRows.push(...c);
    if (c.length < 1000) break;
  }
  const symbols = valRows.map((r) => r.symbol);
  console.log(`\n=== resolveSector(sb, [전체 ${symbols.length}종목]) 재호출 — RAYA만 확인 ===`);
  const full = await resolveSector(sb, symbols);
  console.log("full.get('RAYA'):", JSON.stringify(full.get("RAYA")));
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
