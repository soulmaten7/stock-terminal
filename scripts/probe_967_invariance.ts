// STEP 967 §4 — 값 불변 확인(930종목) + 회복 실측(197종목). 실패하면 멈춘다.
// 🔴 DB에 쓰지 않는다. 메모리 비교만. SEC 신규 호출 0(docs/probe_951_cache 재사용).
// 🔴 STEP 990: 아래 /tmp import가 Vercel 빌드 환경엔 없어 977~989 전체 배포가 깨졌었다(빌드시점 타입체크 실패).
//   tsconfig.json exclude에 이 파일을 추가해 빌드 대상에서 뺐다 — 실행하려면 구코드 추출부터 다시 할 것.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import { computeDrivers as computeDriversNew } from "../lib/revdcf/drivers";
import { computeDrivers as computeDriversOld } from "/tmp/step967_old/drivers_old";

const CACHE_DIR = "docs/probe_951_cache";

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main() {
  const sb = createAdminClient();
  const allRows = await fetchAllRows<{ symbol: string; fiscal_year: number | null }>(
    () => sb.from("us_fundamentals").select("symbol, fiscal_year"),
    [{ column: "symbol" }]
  );
  console.log(`us_fundamentals ${allRows.length}행`);

  const existing930 = allRows.filter((r) => r.fiscal_year != null);
  const null197 = allRows.filter((r) => r.fiscal_year == null);
  console.log(`기존 fiscal_year 확보(930 기대) = ${existing930.length}, null(197 기대) = ${null197.length}`);

  // ── §4-1: 930종목 — 구코드 vs 신코드 완전 대조(값이 한 건도 달라지면 안 됨) ──
  let checked930 = 0, noCache930 = 0;
  const mismatches930: { symbol: string; field: string; old: unknown; new: unknown }[] = [];
  for (const row of existing930) {
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { noCache930++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = facts?.facts?.["us-gaap"] ?? {};
    const dei = facts?.facts?.["dei"] ?? {};
    checked930++;

    const rOld = computeDriversOld(gaap, dei);
    const rNew = computeDriversNew(gaap, dei);
    if (rOld.ok !== rNew.ok) mismatches930.push({ symbol: row.symbol, field: "ok", old: rOld.ok, new: rNew.ok });
    if (!rOld.ok && !rNew.ok && rOld.skipReason !== rNew.skipReason) mismatches930.push({ symbol: row.symbol, field: "skipReason", old: rOld.skipReason, new: rNew.skipReason });
    if (rOld.ok && rNew.ok) {
      if (!deepEqual(rOld.drivers, rNew.drivers)) mismatches930.push({ symbol: row.symbol, field: "drivers", old: rOld.drivers, new: rNew.drivers });
      if (!deepEqual(rOld.market, rNew.market)) mismatches930.push({ symbol: row.symbol, field: "market", old: rOld.market, new: rNew.market });
    }
    const fFields = ["netIncome", "equity", "commonEquity", "preferredStock", "minorityInterest", "revenue", "operatingIncome", "dna", "fiscalYear"] as const;
    for (const f of fFields) {
      if (!deepEqual((rOld.fundamentals as any)[f], (rNew.fundamentals as any)[f])) {
        mismatches930.push({ symbol: row.symbol, field: `fundamentals.${f}`, old: (rOld.fundamentals as any)[f], new: (rNew.fundamentals as any)[f] });
      }
    }
  }
  console.log(`\n=== §4-1: 930종목 구코드 vs 신코드 (캐시확인 ${checked930}, 캐시없음 ${noCache930}) ===`);
  console.log(`불일치 ${mismatches930.length}건`);
  if (mismatches930.length) console.log(JSON.stringify(mismatches930.slice(0, 20), null, 1));

  // ── §4-2: 197종목 — 은행 폴백으로 새로 ok가 되는 건수 실측 ──
  let checked197 = 0, noCache197 = 0;
  const newlyOk: { symbol: string; revenuePath: string; skipReasonOld: string }[] = [];
  const stillSkipped: { symbol: string; skipReasonOld: string; skipReasonNew: string }[] = [];
  for (const row of null197) {
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { noCache197++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = facts?.facts?.["us-gaap"] ?? {};
    const dei = facts?.facts?.["dei"] ?? {};
    checked197++;

    const rOld = computeDriversOld(gaap, dei);
    const rNew = computeDriversNew(gaap, dei);
    if (!rOld.ok && rNew.ok) {
      newlyOk.push({ symbol: row.symbol, revenuePath: (rNew.flags as any).revenuePath, skipReasonOld: (rOld as any).skipReason });
    } else if (!rOld.ok && !rNew.ok) {
      stillSkipped.push({ symbol: row.symbol, skipReasonOld: (rOld as any).skipReason, skipReasonNew: (rNew as any).skipReason });
    } else if (rOld.ok && !rNew.ok) {
      // 있어서는 안 되는 경우(폴백은 실패했던 것만 도와야 함) — 그대로 기록
      mismatches930.push({ symbol: row.symbol, field: "REGRESSION_ok_to_fail", old: rOld.ok, new: rNew.ok });
    }
  }
  console.log(`\n=== §4-2: 197종목(캐시확인 ${checked197}, 캐시없음 ${noCache197}) ===`);
  console.log(`새로 ok가 된 종목: ${newlyOk.length}`);
  console.log(JSON.stringify(newlyOk, null, 1));
  console.log(`여전히 skip: ${stillSkipped.length}`);
  const skipReasonDist: Record<string, number> = {};
  for (const s of stillSkipped) skipReasonDist[s.skipReasonNew] = (skipReasonDist[s.skipReasonNew] ?? 0) + 1;
  console.log("skip 사유 분포(신코드):", JSON.stringify(skipReasonDist, null, 1));

  // ── §4-3: revdcf 유니버스(604) 중 이번에 새로 은행 폴백이 적용될 수 있는 종목 있는지 — 604는 원래 fiscal_year 확보돼 있던 930의 부분집합이므로,
  //   930 불변이 확인되면 604도 자동으로 불변이다. 여기서는 그 논리를 명시적으로 재확인(604 심볼이 930 안에 있는지)만 한다.
  const revdcfRows = await fetchAllRows<{ symbol: string }>(
    () => sb.from("revdcf_results").select("symbol").eq("as_of", "2026-08-08"),
    [{ column: "symbol" }]
  );
  const existing930Set = new Set(existing930.map((r) => r.symbol));
  const revdcfNotIn930 = revdcfRows.filter((r) => !existing930Set.has(r.symbol));
  console.log(`\n=== §4-3: revdcf_results(604) 중 930(기존 fiscal_year 확보)에 없는 종목 ===`);
  console.log(`${revdcfNotIn930.length}건`, revdcfNotIn930.map((r) => r.symbol));

  fs.writeFileSync(
    "docs/probe_967_invariance.json",
    JSON.stringify({ checked930, noCache930, mismatches930, checked197, noCache197, newlyOk, stillSkipped, skipReasonDist, revdcfTotal: revdcfRows.length, revdcfNotIn930: revdcfNotIn930.map((r) => r.symbol) }, null, 1)
  );
  console.log("\n저장: docs/probe_967_invariance.json");

  if (mismatches930.length > 0) {
    console.log("\n🔴🔴🔴 930종목 불일치 발견 — STEP 지시대로 여기서 멈춘다 🔴🔴🔴");
    process.exit(1);
  } else {
    console.log("\n✅ 930종목 전수 일치 — 값 불변 확인됨. 진행 가능.");
  }
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
