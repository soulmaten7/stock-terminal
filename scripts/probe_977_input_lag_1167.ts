// STEP 977 §3 — 1,167종목 전체 inputLag 분포. SEC 신규 호출 없음(전량 캐시). 604와 나란히 비교.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeDrivers } from "../lib/revdcf/drivers";

const CACHE_DIR = "docs/probe_951_cache";

async function main() {
  const sb = createAdminClient();
  const asOfRow = (await sb.from("us_valuation").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const rows = await fetchAllRows<{ symbol: string }>(() => sb.from("us_valuation").select("symbol").eq("as_of", asOfRow!.as_of), [{ column: "symbol" }]);
  const all1167 = new Set(rows.map((r) => r.symbol));

  const revdcfAsOfRow = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  const revdcfRows = await fetchAllRows<{ symbol: string }>(() => sb.from("revdcf_results").select("symbol").eq("as_of", revdcfAsOfRow!.as_of), [{ column: "symbol" }]);
  const revdcf604 = new Set(revdcfRows.map((r) => r.symbol));

  type Acc = { total: number; dist: Record<string, number>; causeCount: Record<string, number> };
  const mk = (): Acc => ({ total: 0, dist: { "0": 0, "1": 0, "2": 0, "3+": 0 }, causeCount: { no_value: 0, tag_miss: 0, unknown: 0 } });
  const full = { shares: mk(), debt: mk(), interestExpense: mk(), nonOperatingAssets: mk() };
  const sub604 = { shares: mk(), debt: mk(), interestExpense: mk(), nonOperatingAssets: mk() };

  let checked = 0, missingCache = 0;
  const fields = ["shares", "debt", "interestExpense", "nonOperatingAssets"] as const;

  for (const symbol of all1167) {
    const p = `${CACHE_DIR}/${symbol}.json`;
    if (!fs.existsSync(p)) { missingCache++; continue; }
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    const gaap = d.facts?.["us-gaap"] ?? {};
    const dei = d.facts?.["dei"] ?? {};
    const r = computeDrivers(gaap, dei) as any;
    checked++;
    // 🔴 976 방법론과 동일 축(eligibleWithValue)으로 맞춘다 — inputLag 계산 지점까지 도달한 종목만 분모로 삼는다.
    //   r.ok!==true(창 미달·태그 결측 등으로 그 지점 전에 이미 스킵)는 "lag=0"이 아니라 "해당 없음"이라 뺀다.
    if (r.ok !== true) continue;
    const lag = (r.flags?.inputLag ?? {}) as Record<string, number>;
    const cause = (r.flags?.inputLagCause ?? {}) as Record<string, string>;
    const inRevdcf = revdcf604.has(symbol);
    for (const f of fields) {
      const v = lag[f];
      const bucket = v == null ? "0" : v >= 3 ? "3+" : String(v);
      full[f].total++; full[f].dist[bucket]++;
      if (v != null && v > 0 && cause[f]) full[f].causeCount[cause[f]]++;
      if (inRevdcf) {
        sub604[f].total++; sub604[f].dist[bucket]++;
        if (v != null && v > 0 && cause[f]) sub604[f].causeCount[cause[f]]++;
      }
    }
  }

  console.log(`전체 대상: ${all1167.size}, 검사: ${checked}, 캐시없음: ${missingCache}`);
  console.log("=== 1,167 전체 ===", JSON.stringify(full, null, 2));
  console.log("=== 604(revdcf 유니버스) ===", JSON.stringify(sub604, null, 2));

  fs.writeFileSync(
    "docs/probe_977_input_lag.json",
    JSON.stringify({ universe1167: { checked, missingCache }, full1167: full, revdcf604: sub604 }, null, 2)
  );
}

main();
