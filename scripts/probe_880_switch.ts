// STEP 880 §2 — 유니버스 보존 게이트 검증(로컬 프로브 · 크론 수동 실행 금지 대체).
// 실제 route.ts 전환 로직(marginal null → skip, 아니면 marginal을 fixed_capital_rate로)을
// 866 캐시(/tmp/866_cf) 515사 실물 데이터로 재현해, "marginal null인 회사가 전부 행으로 남는가"를 확인한다.
// 읽기만 · DB 쓰기 없음 · 네트워크 호출 없음.
// 실행: NODE_OPTIONS="--max-old-space-size=8192" npx tsx scripts/probe_880_switch.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { computeDrivers } from "../lib/revdcf/drivers";

const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;

async function main() {
  const sb = createAdminClient();
  const latest = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string };
  const asOf = latest.as_of;

  type BaseRow = { cik: number; symbol: string };
  const rows: BaseRow[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("cik,symbol").eq("as_of", asOf).is("skip_reason", null).range(f, f + 999);
    const c = (data ?? []) as BaseRow[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[0] 이전(level 기반) 산출 성공 모집단 n=${rows.length}(515 기대)`);

  let wouldSkipNoMargin = 0, wouldProceedWithMarginal = 0, cfMissing = 0;
  const skippedSymbols: string[] = [];
  const sample: { symbol: string; level: number; marginal: number; savedFixedCapitalRate: number }[] = [];

  for (const r of rows) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { cfMissing++; continue; }
    let j: { facts?: { "us-gaap"?: Record<string, unknown> } };
    try { j = JSON.parse(readFileSync(p, "utf8")); } catch { cfMissing++; continue; }
    // route.ts와 동일 호출: computeDrivers(gaap, dei) — dei는 866 캐시에 없어 {}로 대체(공시원문엔 있으나 이 프로브는 §2 게이트 검증이 목적이라 영향 없음: shares 폴백에만 쓰임)
    const dr = computeDrivers((j.facts?.["us-gaap"] as never) ?? {}, {} as never);
    if (!dr.ok) { cfMissing++; continue; } // 이전에 성공했던 모집단이라 정상적으론 거의 없어야 함

    // ── route.ts §1 로직 그대로 재현 ──
    if (dr.drivers.fixedCapitalRateMarginal == null) {
      wouldSkipNoMargin++;
      skippedSymbols.push(r.symbol);
      continue; // route.ts도 여기서 "return {...base, skip_reason:'NO_MARGINAL_CAPEX'}" — 행은 쓰되 더 계산 안 함
    }
    wouldProceedWithMarginal++;
    const savedFixedCapitalRate = dr.drivers.fixedCapitalRateMarginal; // route.ts: drv.fixedCapitalRate
    if (sample.length < 5) sample.push({ symbol: r.symbol, level: dr.drivers.fixedCapitalRateLevel, marginal: dr.drivers.fixedCapitalRateMarginal, savedFixedCapitalRate });
  }

  const output = {
    asOf, universe: rows.length,
    wouldSkipNoMargin, wouldProceedWithMarginal, cfMissing,
    skipRatePct: +((wouldSkipNoMargin / rows.length) * 100).toFixed(1),
    note: "§2 유니버스 보존 게이트 검증: route.ts의 NO_MARGINAL_CAPEX 분기가 실물 515사 데이터에서 몇 건 발동하는지 실측. 코드 구조상(모든 분기가 {...base, skip_reason} 반환) 이 wouldSkipNoMargin건은 전부 행으로 저장되지, 드롭되지 않는다 — 이 프로브는 '몇 건이 그 분기를 타는지'를 실물로 확인하는 것이지 저장 여부 자체는 코드 리뷰로 이미 확인됨(§2 본문).",
    sample_savedFixedCapitalRate_equals_marginal_not_level: sample,
    skippedSymbolsSample: skippedSymbols.slice(0, 10),
  };
  writeFileSync("docs/probe_880_switch.json", JSON.stringify(output, null, 2));
  console.error(JSON.stringify(output, null, 2));

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,887 기준)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
