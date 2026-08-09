// STEP 969 §1 — 부채 태그 전수 파악. 코드 변경 전, debt=0인 103종목의 companyfacts에서
// Debt/Borrowing/Notes/Loan/Lease 계열 태그를 전수 뽑아 우리 배열(10종) 밖 태그를 빈도순으로 낸다.
// 🔴 조회 전용. SEC 신규 호출 없음(docs/probe_951_cache 재사용 — 103건 전부 us_fundamentals에 이미 있던 종목이라 캐시 존재).
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";
import { fetchAllRows } from "../lib/supabasePaging";

const CACHE_DIR = "docs/probe_951_cache";

// 기존 배열(drivers.ts 그대로 옮김, 대조용 — 코드 원본은 무변경)
const KNOWN_TAGS = new Set([
  "LongTermDebtNoncurrent", "LongTermDebt", "LongTermDebtAndCapitalLeaseObligations",
  "LongTermDebtCurrent", "DebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent",
  "FinanceLeaseLiabilityNoncurrent", "FinanceLeaseLiabilityCurrent",
  "DebtAndCapitalLeaseObligations",
]);

const KEYWORD_RE = /Debt|Borrowing|Notes|Loan|Lease/i;
const isAnnual = (f?: string) => /^10-K/.test(String(f));
const calYear = (end: string) => { const y = +end.slice(0, 4), m = +end.slice(5, 7); return m <= 5 ? y - 1 : y; };

async function main() {
  const sb = createAdminClient();
  const rows = await fetchAllRows<{ symbol: string; fiscal_year: number | null }>(
    () => sb.from("us_fundamentals").select("symbol, fiscal_year").eq("debt", 0),
    [{ column: "symbol" }]
  );
  console.log(`debt=0 종목 ${rows.length}건`);

  const tagFreq: Record<string, number> = {};
  const tagSymbols: Record<string, string[]> = {};
  let noCache = 0;
  const perSymbolTags: Record<string, { symbol: string; fy: number | null; outsideTags: { tag: string; val: number; end: string }[] }> = {};

  for (const row of rows) {
    const path = `${CACHE_DIR}/${row.symbol}.json`;
    if (!fs.existsSync(path)) { noCache++; continue; }
    const facts = JSON.parse(fs.readFileSync(path, "utf-8"));
    const gaap = facts?.facts?.["us-gaap"] ?? {};
    const outside: { tag: string; val: number; end: string }[] = [];
    for (const tag of Object.keys(gaap)) {
      if (!KEYWORD_RE.test(tag)) continue;
      const arr = gaap[tag]?.units?.USD;
      if (!Array.isArray(arr)) continue;
      // 그 종목의 fiscal_year(우리가 이미 앵커로 쓴 연도)에 실제 값이 있는지만 본다
      const fy = row.fiscal_year;
      let matched: { val: number; end: string } | null = null;
      for (const e of arr) {
        if (!isAnnual(e.form) || e.val == null || !e.end) continue;
        if (fy != null && calYear(e.end) !== fy) continue;
        if (!matched || String(e.filed) > String((matched as { filed?: string }).filed ?? "")) matched = { val: e.val, end: e.end };
      }
      if (matched) {
        tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
        (tagSymbols[tag] ??= []).push(row.symbol);
        if (!KNOWN_TAGS.has(tag)) outside.push({ tag, val: matched.val, end: matched.end });
      }
    }
    perSymbolTags[row.symbol] = { symbol: row.symbol, fy: row.fiscal_year, outsideTags: outside };
  }

  console.log(`캐시없음 ${noCache}`);
  const sortedFreq = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]);
  console.log("\n=== 태그 빈도(전체, 우리배열 포함) ===");
  for (const [tag, freq] of sortedFreq) {
    console.log(`${KNOWN_TAGS.has(tag) ? "[배열안]" : "[배열밖]"} ${tag}: ${freq}건`);
  }

  const outsideOnly = sortedFreq.filter(([tag]) => !KNOWN_TAGS.has(tag));
  console.log("\n=== 배열 밖 태그만(빈도순) ===");
  console.log(JSON.stringify(outsideOnly, null, 1));

  // "진짜 무차입으로 보이는" 대형·유명 종목들 개별 확인(부채 태그가 정말 하나도 없는지)
  const trueZeroCandidates = ["PLTR", "ANET", "ISRG", "NOW", "SNOW", "DDOG", "CDNS", "VRSN", "EA", "GRMN"];
  console.log("\n=== 「진짜 무차입」 후보 개별 확인 ===");
  for (const sym of trueZeroCandidates) {
    const d = perSymbolTags[sym];
    if (!d) { console.log(sym, "데이터없음"); continue; }
    console.log(sym, "fy=" + d.fy, "배열밖 태그 매치:", d.outsideTags.length ? JSON.stringify(d.outsideTags) : "없음(진짜 무차입 가능성)");
  }

  console.log("\n=== GM 상세 ===");
  console.log(JSON.stringify(perSymbolTags["GM"], null, 1));

  fs.writeFileSync(
    "docs/probe_969_debt_tags_scan.json",
    JSON.stringify({ totalChecked: rows.length, noCache, tagFreq, outsideOnly, perSymbolTags }, null, 1)
  );
  console.log("\n저장: docs/probe_969_debt_tags_scan.json");
}
main().catch((e) => { console.error("🔴", e); process.exit(1); });
