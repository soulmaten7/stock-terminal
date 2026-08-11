// STEP 967 §2 — 은행형 매출(순이자수익+비이자수익) 폴백의 회복 규모 실측. 코드 변경 전, 값이 있는지 먼저 잰다.
// 🔴 조회 전용: DB 무변경. SEC 신규 호출 0(docs/probe_951_cache 197건 전량 이미 존재).
// 🔴 STEP 990 §5: 아래 data/sources/nasdaq/... 는 .gitignore:75로 제외된 파일(정본=Supabase Storage 버킷 sources) —
//   git이 안 쫓는 파일이라 Vercel 빌드 환경엔 없어 977~990 전체 배포가 깨졌었다. tsconfig.json exclude로 빌드 대상에서 뺐다.
//   재실행하려면 Supabase Storage sources 버킷에서 같은 파일을 받아 로컬에 두고 돌릴 것.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";
import nasdaqData from "../data/sources/nasdaq/nasdaq_screener_20260808.json";

const CACHE_DIR = "docs/probe_951_cache";

const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };
const isAnnual = (f?: string) => /^10-K/.test(String(f));

function annualMapLocal(g: any, tag: string, kind: "flow" | "stock", unit = "USD"): Record<number, number> {
  const arr = g[tag]?.units?.[unit];
  const by: Record<number, { val: number; filed: string }> = {};
  if (!Array.isArray(arr)) return {};
  for (const e of arr) {
    if (!isAnnual(e.form) || e.val == null) continue;
    if (kind === "flow") { if (!e.start || !e.end) continue; const d = (Date.parse(e.end) - Date.parse(e.start)) / 86400000; if (d < 300 || d > 400) continue; }
    else { if (e.fp && e.fp !== "FY") continue; if (!e.end) continue; }
    const y = calYear(e.end); const prev = by[y];
    if (!prev || String(e.filed) > String(prev.filed)) by[y] = { val: e.val, filed: String(e.filed) };
  }
  const o: Record<number, number> = {}; for (const y of Object.keys(by)) o[+y] = by[+y].val; return o;
}
function coalesceMapLocal(g: any, tags: string[], kind: "flow" | "stock", unit = "USD") {
  const vals: Record<number, number> = {}, tagAt: Record<number, string> = {};
  for (const t of tags) { const m = annualMapLocal(g, t, kind, unit); for (const y of Object.keys(m)) { const yy = +y; if (vals[yy] == null) { vals[yy] = m[yy]; tagAt[yy] = t; } } }
  return { vals, tagAt };
}

// 후보 태그 — 캐시로 실제 존재하는 것만 채택(추측 배열 아님, 아래 §1에서 실측 후 확정)
const NII_TAGS = ["InterestIncomeExpenseNet"];
const NONINT_TAGS = ["NoninterestIncome"];
const SINGLE_TAGS = ["RevenuesNetOfInterestExpense"]; // Citigroup류

function findContiguous5(allYears: number[], maxYear: number): number[] | null {
  const ys = allYears.filter((y) => y <= maxYear).sort((a, b) => a - b);
  if (ys.length < 5) return null;
  const top = ys.slice(-5);
  for (let i = 1; i < top.length; i++) if (top[i] !== top[i - 1] + 1) return null;
  return top;
}

async function main() {
  const sb = createAdminClient();
  const nullFy = await fetchAllRows<{ symbol: string }>(
    () => sb.from("us_fundamentals").select("symbol").is("fiscal_year", null),
    [{ column: "symbol" }]
  );
  console.log(`fiscal_year null 종목 ${nullFy.length}건`);

  const maxYear = new Date().getFullYear();
  const bySymbolCountry: Record<string, string> = {};
  for (const k of Object.keys((nasdaqData as any).data)) {
    const r = (nasdaqData as any).data[k];
    bySymbolCountry[r.symbol] = r.country;
  }

  type Result = {
    symbol: string; country: string | null;
    niiTagPresent: boolean; nonIntTagPresent: boolean; singleTagPresent: boolean;
    niiYears: number; nonIntYears: number;
    combinedWindow: number[] | null;
    singleWindow: number[] | null;
  };
  const results: Result[] = [];
  let noCache = 0;

  for (const row of nullFy) {
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { noCache++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = facts?.facts?.["us-gaap"] ?? {};

    const niiCo = coalesceMapLocal(gaap, NII_TAGS, "flow");
    const nonIntCo = coalesceMapLocal(gaap, NONINT_TAGS, "flow");
    const singleCo = coalesceMapLocal(gaap, SINGLE_TAGS, "flow");

    const niiYears = Object.keys(niiCo.vals).length;
    const nonIntYears = Object.keys(nonIntCo.vals).length;

    // 결합 창: 두 시리즈 다 값이 있는 연도만 candidate로 삼아 연속 5개 탐색(sumMaps와 동일 정신 — 둘 다 있어야 그 해가 유효)
    const combinedYears = Object.keys(niiCo.vals).map(Number).filter((y) => nonIntCo.vals[y] != null);
    const combinedWindow = findContiguous5(combinedYears, maxYear);
    const singleYears = Object.keys(singleCo.vals).map(Number);
    const singleWindow = findContiguous5(singleYears, maxYear);

    results.push({
      symbol: row.symbol,
      country: bySymbolCountry[row.symbol] ?? null,
      niiTagPresent: niiYears > 0, nonIntTagPresent: nonIntYears > 0, singleTagPresent: singleYears.length > 0,
      niiYears, nonIntYears,
      combinedWindow, singleWindow,
    });
  }

  console.log(`캐시 확인 ${results.length}건(캐시없음 ${noCache})`);
  const niiPresent = results.filter((r) => r.niiTagPresent).length;
  const nonIntPresent = results.filter((r) => r.nonIntTagPresent).length;
  const bothPresent = results.filter((r) => r.niiTagPresent && r.nonIntTagPresent).length;
  const recoverableCombined = results.filter((r) => r.combinedWindow != null);
  const recoverableSingle = results.filter((r) => r.singleWindow != null && r.combinedWindow == null);
  const recoverableAny = new Set([...recoverableCombined.map((r) => r.symbol), ...recoverableSingle.map((r) => r.symbol)]);

  console.log(`\nInterestIncomeExpenseNet 태그 존재(연도수>0): ${niiPresent}`);
  console.log(`NoninterestIncome 태그 존재(연도수>0): ${nonIntPresent}`);
  console.log(`둘 다 태그 존재: ${bothPresent}`);
  console.log(`\n결합(NII+NonInt) 연속5년 창 성립: ${recoverableCombined.length}`);
  console.log(`RevenuesNetOfInterestExpense 단일태그 연속5년 창 성립(결합으로 안 됐던 것 중): ${recoverableSingle.length}`);
  console.log(`전체 회복 가능(합집합): ${recoverableAny.size} / ${results.length}`);

  const byCountry: Record<string, { total: number; recovered: number }> = {};
  for (const r of results) {
    const c = r.country ?? "unmatched";
    byCountry[c] ??= { total: 0, recovered: 0 };
    byCountry[c].total++;
    if (recoverableAny.has(r.symbol)) byCountry[c].recovered++;
  }
  console.log("\n국가별(회복/전체):", JSON.stringify(byCountry, null, 1));

  const notRecoveredSymbols = results.filter((r) => !recoverableAny.has(r.symbol));
  console.log(`\n회복 안 되는 종목: ${notRecoveredSymbols.length}`);
  console.log("표본(20개):", notRecoveredSymbols.slice(0, 20).map((r) => ({ symbol: r.symbol, nii: r.niiTagPresent, nonInt: r.nonIntTagPresent, niiYears: r.niiYears, nonIntYears: r.nonIntYears })));

  fs.writeFileSync(
    "docs/probe_967_bank_revenue_scan.json",
    JSON.stringify({ maxYear, totalChecked: results.length, noCache, niiPresent, nonIntPresent, bothPresent, recoverableCombinedCount: recoverableCombined.length, recoverableSingleCount: recoverableSingle.length, recoveredTotal: recoverableAny.size, byCountry, results, recoveredSymbols: [...recoverableAny], notRecoveredSymbols: notRecoveredSymbols.map((r) => r.symbol) }, null, 1)
  );
  console.log("\n저장: docs/probe_967_bank_revenue_scan.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
