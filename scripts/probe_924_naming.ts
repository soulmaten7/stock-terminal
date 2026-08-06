// STEP 924 — 종목명 표시 계층 통일(B안) 검증 프로브. 실측 전용, DB 쓰기 0.
// 실행: npx tsx scripts/probe_924_naming.ts   (환경: .env.local 의 SUPABASE_SERVICE_ROLE_KEY)
// 무엇을 재는가: lens_scores(US)에서 name=symbol(티커 그대로 저장된 348행, 923 실측)이
//   data/us_symbols.json(상세 페이지가 쓰는 것과 같은 소스)에 존재하는지 전수 대조.
// 출력: 표준출력 요약 + docs/probe_924_baseline.json의 affected_348_check와 동일 결과 재현용.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import usSymbols from "../data/us_symbols.json";

type SymRow = { sym: string; name: string };

async function main() {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("lens_scores")
    .select("symbol,name")
    .eq("market", "US");
  if (error) throw error;

  const rows = (data ?? []) as { symbol: string; name: string | null }[];
  const affected = rows.filter((r) => r.name === r.symbol).map((r) => r.symbol);

  const map = new Map<string, string>();
  for (const r of usSymbols as SymRow[]) if (r?.sym && r?.name) map.set(r.sym.toUpperCase(), r.name);

  const resolved = affected.filter((s) => map.has(s.toUpperCase()));
  const unresolved = affected.filter((s) => !map.has(s.toUpperCase()));

  console.log(JSON.stringify(
    {
      total_us: rows.length,
      name_equals_ticker: affected.length,
      resolved_by_us_symbols_json: resolved.length,
      still_falls_back_to_ticker: unresolved.length,
      unresolved_list: unresolved,
    },
    null,
    2
  ));
}

main();
