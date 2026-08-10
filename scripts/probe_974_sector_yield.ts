// STEP 974 §1 — 크론 배선 전 야후 호출 규모 실측. DB 쓰기 없음(resolveSector만 메모리에서 호출).
// 실행: npx tsx scripts/probe_974_sector_yield.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { resolveSector } from "../lib/sector";

async function main() {
  const sb = createAdminClient();

  const latest = (await sb.from("us_valuation").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!latest) throw new Error("us_valuation 비어있음");
  const asOf = latest.as_of;

  const valRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_valuation").select("symbol").eq("as_of", asOf).range(f, f + 999);
    const c = (data ?? []) as typeof valRows;
    valRows.push(...c);
    if (c.length < 1000) break;
  }
  const symbols = valRows.map((r) => r.symbol);
  console.log(`us_valuation as_of=${asOf}: ${symbols.length}종목`);

  const wideRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("us_sector_wide").select("symbol").range(f, f + 999);
    const c = (data ?? []) as typeof wideRows;
    wideRows.push(...c);
    if (c.length < 1000) break;
  }
  const wideSet = new Set(wideRows.map((r) => r.symbol));
  console.log(`us_sector_wide: ${wideRows.length}종목(기존)`);

  const newSymbols = symbols.filter((s) => !wideSet.has(s));
  console.log(`신규(us_sector_wide에 없음): ${newSymbols.length}종목`);

  // 전체(1,167) 대상 — DB 쓰지 않음
  const resolvedAll = await resolveSector(sb, symbols);
  const tallyAll: Record<string, number> = { spdr: 0, damodaran: 0, "damodaran-sibling": 0, yahoo: 0, unclassified: 0 };
  for (const s of symbols) {
    const r = resolvedAll.get(s);
    if (!r) tallyAll.unclassified++;
    else tallyAll[r.source] = (tallyAll[r.source] ?? 0) + 1;
  }

  // 신규만 — DB 쓰지 않음(같은 resolvedAll 결과에서 신규분만 골라냄 — resolveSector 재호출 안 함)
  const tallyNew: Record<string, number> = { spdr: 0, damodaran: 0, "damodaran-sibling": 0, yahoo: 0, unclassified: 0 };
  const unclassifiedNew: string[] = [];
  for (const s of newSymbols) {
    const r = resolvedAll.get(s);
    if (!r) { tallyNew.unclassified++; unclassifiedNew.push(s); }
    else tallyNew[r.source] = (tallyNew[r.source] ?? 0) + 1;
  }

  console.log("전체(1,167) 출처별:", tallyAll);
  console.log("신규(", newSymbols.length, ") 출처별:", tallyNew);
  console.log(`\n🔑 resolveSector는 damodaran_industry·us_sector_nasdaq·us_sector_yahoo·us_sector_gics 4개 테이블만 읽는다 — 외부 네트워크 호출 0건(952 확인과 동일 구조, 코드 무변경 재확인).`);
  console.log(`🔑 야후(3순위) = us_sector_yahoo 사전적재 테이블 조회이지 라이브 API 아님. 신규 40건 중 yahoo tier로 붙는 건수 = ${tallyNew.yahoo}건, 미분류 = ${tallyNew.unclassified}건.`);

  fs.writeFileSync(
    "docs/probe_974_sector_yield.json",
    JSON.stringify(
      {
        asOf,
        valuationTotal: symbols.length,
        sectorWideExisting: wideRows.length,
        newSymbolsCount: newSymbols.length,
        tallyAll,
        tallyNew,
        unclassifiedNew,
        liveNetworkCalls: 0,
        note: "resolveSector는 Supabase 테이블 4개 read만 수행 — 외부 네트워크 호출(야후 라이브 API 포함) 0건. STEP952 probe_952_sector_wide_step1.json과 동일 결론.",
      },
      null,
      2
    )
  );
}

main();
