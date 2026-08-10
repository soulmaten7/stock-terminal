// STEP 977 §2 — 값 불변 증명. 구코드(62f55a7, STEP977 이전)와 신코드를 1,167종목 전량 완전대조.
// flags를 제외한 모든 필드(ok·skipReason·drivers·market·fundamentals)가 0건 불일치여야 한다.
// 965 §3·967 §4와 같은 방법: git show로 구코드 추출(별도 파일) → 동적 import → 같은 캐시로 각각 실행 → 깊은 비교.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeDrivers as computeDriversNew } from "../lib/revdcf/drivers";
import { computeDrivers as computeDriversOld } from "./_step977_tmp/drivers_old";

const CACHE_DIR = "docs/probe_951_cache";

function deepEqualExceptFlags(a: any, b: any): { equal: boolean; diffPath?: string } {
  const { flags: fa, ...restA } = a;
  const { flags: fb, ...restB } = b;
  const sa = JSON.stringify(restA, Object.keys(restA).sort());
  const sb = JSON.stringify(restB, Object.keys(restB).sort());
  if (sa === sb) return { equal: true };
  return { equal: false, diffPath: `restA=${sa.slice(0, 300)} vs restB=${sb.slice(0, 300)}` };
}

async function main() {
  const sb = createAdminClient();
  const asOfRow = (await sb.from("us_valuation").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!asOfRow) throw new Error("us_valuation 비어있음");
  const rows = await fetchAllRows<{ symbol: string }>(
    () => sb.from("us_valuation").select("symbol").eq("as_of", asOfRow.as_of),
    [{ column: "symbol" }]
  );
  const symbols = rows.map((r) => r.symbol);
  console.log(`대상: us_valuation as_of=${asOfRow.as_of}, ${symbols.length}종목`);

  let checked = 0, mismatches: { symbol: string; diffPath?: string }[] = [];
  let missingCache = 0;

  for (const symbol of symbols) {
    const p = `${CACHE_DIR}/${symbol}.json`;
    if (!fs.existsSync(p)) { missingCache++; continue; }
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    const gaap = d.facts?.["us-gaap"] ?? {};
    const dei = d.facts?.["dei"] ?? {};

    const oldR = computeDriversOld(gaap, dei) as any;
    const newR = computeDriversNew(gaap, dei) as any;
    checked++;
    const cmp = deepEqualExceptFlags(oldR, newR);
    if (!cmp.equal) mismatches.push({ symbol, diffPath: cmp.diffPath });
  }

  console.log(`검사: ${checked}종목, 캐시 없음: ${missingCache}, 불일치: ${mismatches.length}`);
  fs.writeFileSync(
    "docs/probe_977_invariance.json",
    JSON.stringify({ totalSymbols: symbols.length, checked, missingCache, mismatchCount: mismatches.length, mismatches: mismatches.slice(0, 50) }, null, 2)
  );
  if (mismatches.length > 0) {
    console.log("🔴 불일치 발견 — 상위 5건:");
    console.log(JSON.stringify(mismatches.slice(0, 5), null, 2));
  }
}

main();
