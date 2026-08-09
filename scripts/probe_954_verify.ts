// STEP 954 §3 — 처방(fetchAllRows 이관) 검증. 조사 전용, DB 읽기만, 쓰기 0.
// 🔴 실패하면 여기서 멈춘다(§3-2: 20/20이 정확히 6,937이 아니면 처방 실패로 즉시 보고).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { resolveSector } from "../lib/sector";

async function main() {
  const sb = createAdminClient();

  // ── §3-2: 수정 경로(damodaran_industry, fetchAllRows 직접)로 20회 반복 ──
  const REPEATS_20 = 20;
  const counts20: number[] = [];
  const allRuns: string[][] = [];
  for (let i = 0; i < REPEATS_20; i++) {
    const rows = await fetchAllRows<{ ticker_norm: string; sic_code: string | null }>(
      () => sb.from("damodaran_industry").select("ticker_norm, sic_code").eq("is_us_listed", true),
      [{ column: "exchange", nullsFirst: true }, { column: "ticker" }]
    );
    counts20.push(rows.length);
    // 행 식별을 위해 ticker_norm만으론 중복 가능(비유일) — 인덱스 붙여 순번 포함 키로 유니온 비교(단순 개수 비교가 핵심이므로 충분)
    allRuns.push(rows.map((r, idx) => `${idx}:${r.ticker_norm}`));
  }
  const allSame = counts20.every((c) => c === 6937);
  console.log(`§3-2 damodaran_industry(fetchAllRows) 20회: counts=${JSON.stringify(counts20)}`);
  console.log(`20/20이 정확히 6937인가: ${allSame ? "예" : "🔴 아니오 — 처방 실패"}`);
  if (!allSame) {
    console.log("🔴 처방 실패 — 즉시 중단.");
    fs.writeFileSync("docs/probe_954_verify.json", JSON.stringify({ measuredAt: "2026-08-09", failed: true, step3_2_counts20: counts20 }, null, 2));
    process.exit(1);
  }

  // ── §3-3: resolveSector() 전체를 5회 돌려 미분류 건수가 고정되는지 ──
  const valRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_valuation").select("symbol").eq("as_of", "2026-08-08").range(f, f + 999);
    const c = (data ?? []) as typeof valRows;
    valRows.push(...c);
    if (c.length < 1000) break;
  }
  const symbols = valRows.map((r) => r.symbol);
  const REPEATS_5 = 5;
  const classifiedCounts: number[] = [];
  const unclassifiedCounts: number[] = [];
  for (let i = 0; i < REPEATS_5; i++) {
    const r = await resolveSector(sb, symbols);
    classifiedCounts.push(r.size);
    unclassifiedCounts.push(symbols.length - r.size);
    console.log(`§3-3 [run ${i + 1}] resolveSector: classified=${r.size} unclassified=${symbols.length - r.size}`);
  }
  const fixed = new Set(unclassifiedCounts).size === 1;
  console.log(`\n§3-3 미분류 건수가 5회 전부 고정됐는가: ${fixed ? "예" : "🔴 아니오"} (unclassified=${JSON.stringify(unclassifiedCounts)})`);
  console.log(`§3-4 최종 미분류 건수(재현 가능한 값) = ${unclassifiedCounts[0]}`);

  const out = {
    measuredAt: "2026-08-09",
    failed: false,
    step3_2_damodaranFetchAllRows20x: { counts: counts20, allExactly6937: allSame },
    step3_3_resolveSector5x: { targetCount: symbols.length, classifiedCounts, unclassifiedCounts, fixed },
    step3_4_finalUnclassifiedCount: unclassifiedCounts[0],
  };
  fs.writeFileSync("docs/probe_954_verify.json", JSON.stringify(out, null, 2));
  console.log("\n저장: docs/probe_954_verify.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
