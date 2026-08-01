/**
 * STEP 841 프로브 — driver 1(매출) + driver 2(영업이익) 연속 확보율 실측
 *
 * 목적: "5년 평균 마진을 계산할 수 있는 종목이 623 중 몇 개인가"
 *       (838의 70.3%는 6개 driver 전부 기준 — driver 1+2만이면 다름)
 *
 * 방법: SEC XBRL frames API. 태그×연도마다 1회 호출 → CIK 집합 추출 →
 *       우리 유니버스(docs/probe_survivors.json · N=623)와 교집합.
 *
 * 🔴 한계 명시:
 *  - frames는 최근 연도를 과소계상한다(CY2024가 CY2023보다 적음 · §B-0 기록).
 *    따라서 CY2024 종료 창과 CY2023 종료 창을 **둘 다** 낸다.
 *  - frames는 SEC가 달력연도로 정규화한 값만 담는다. 비달력 회계연도 기업은
 *    가장 가까운 프레임에 배정되나 일부 누락 가능 → 이 수치는 **하한**이다.
 *
 * 실행: npx tsx scripts/probe_841_driver12_consecutive.ts
 */

import fs from "node:fs";
import path from "node:path";

const UA = process.env.SEC_USER_AGENT || "StockTerminal soulmaten7@gmail.com";
const BASE = "https://data.sec.gov/api/xbrl/frames/us-gaap";

// driver 2 분자 후보 (840에서 확정: OperatingIncomeLoss 단독 + Pretax+Interest 재구성 폴백)
const EBIT_TAGS = ["OperatingIncomeLoss"];
const EBIT_FALLBACK = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"];

// driver 1 분모 후보 (840: 항등식으로 고르지만 "존재하는가"는 합집합으로 잰다)
const REV_TAGS = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "Revenues",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
  "SalesRevenueNet",
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i); // CY2015..CY2025

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function frameCiks(tag: string, year: number): Promise<Set<number> | null> {
  const url = `${BASE}/${tag}/USD/CY${year}.json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null; // 404 = 그 태그/연도 프레임 없음
    const j = (await res.json()) as { data?: Array<{ cik: number }> };
    return new Set((j.data || []).map((d) => d.cik));
  } catch {
    return null;
  }
}

async function main() {
  const survivorsPath = path.join(process.cwd(), "docs", "probe_survivors.json");
  const survivors = JSON.parse(fs.readFileSync(survivorsPath, "utf8")) as Array<{
    symbol: string;
    cik: number;
    mcap: number;
    sic: string;
    sicDesc: string;
  }>;

  // CIK 기준 중복 제거 (GOOG/GOOGL 등 복수 클래스)
  const cikSet = new Set(survivors.map((s) => s.cik));
  const uniqueCiks = [...cikSet];
  console.log(`유니버스: ${survivors.length}종목 / ${uniqueCiks.length}발행사(CIK 유일)\n`);

  // 연도별 확보 여부
  type YearMap = Map<number, Set<number>>; // year -> ciks
  const ebitByYear: YearMap = new Map();
  const ebitFbByYear: YearMap = new Map();
  const revByYear: YearMap = new Map();
  const totalFilerCount: Record<string, Record<number, number>> = {};

  const allTags = [
    ...EBIT_TAGS.map((t) => ["ebit", t] as const),
    ...EBIT_FALLBACK.map((t) => ["ebitfb", t] as const),
    ...REV_TAGS.map((t) => ["rev", t] as const),
  ];

  for (const year of YEARS) {
    for (const [kind, tag] of allTags) {
      const ciks = await frameCiks(tag, year);
      await sleep(140); // SEC 10req/s 준수
      if (!ciks) {
        console.log(`  (없음) ${tag} CY${year}`);
        continue;
      }
      totalFilerCount[tag] = totalFilerCount[tag] || {};
      totalFilerCount[tag][year] = ciks.size;

      const target =
        kind === "ebit" ? ebitByYear : kind === "ebitfb" ? ebitFbByYear : revByYear;
      const cur = target.get(year) || new Set<number>();
      for (const c of ciks) if (cikSet.has(c)) cur.add(c);
      target.set(year, cur);
    }
    const e = ebitByYear.get(year)?.size ?? 0;
    const ef = ebitFbByYear.get(year)?.size ?? 0;
    const r = revByYear.get(year)?.size ?? 0;
    console.log(
      `CY${year}: 영업이익 ${e} · 세전이익(폴백) ${ef} · 매출 ${r} / ${uniqueCiks.length}`
    );
  }

  // ── 연속 확보 계산 ────────────────────────────────────────────────
  function consecutive(endYear: number, n: number, withFallback: boolean) {
    const years = Array.from({ length: n }, (_, i) => endYear - n + 1 + i);
    let both = 0,
      revOnly = 0,
      ebitOnly = 0;
    for (const cik of uniqueCiks) {
      const okRev = years.every((y) => revByYear.get(y)?.has(cik));
      const okEbit = years.every(
        (y) =>
          ebitByYear.get(y)?.has(cik) ||
          (withFallback && ebitFbByYear.get(y)?.has(cik))
      );
      if (okRev && okEbit) both++;
      else if (okRev) revOnly++;
      else if (okEbit) ebitOnly++;
    }
    return { years: `CY${years[0]}~CY${years[years.length - 1]}`, both, revOnly, ebitOnly };
  }

  const results: Record<string, unknown> = {};
  console.log("\n=== driver 1+2 동시 연속 확보 (마진 계산 가능 종목) ===");
  console.log("창                       | 영업이익 단독 | +세전이익 폴백 | 비율(단독) | 비율(폴백)");
  for (const [endYear, n, label] of [
    [2024, 5, "5년(CY2024 종료)"],
    [2023, 5, "5년(CY2023 종료)"],
    [2024, 10, "10년(CY2024 종료)"],
    [2023, 10, "10년(CY2023 종료)"],
  ] as Array<[number, number, string]>) {
    const strict = consecutive(endYear, n, false);
    const loose = consecutive(endYear, n, true);
    const pct = (x: number) => ((x / uniqueCiks.length) * 100).toFixed(1) + "%";
    console.log(
      `${label.padEnd(22)} | ${String(strict.both).padStart(12)} | ${String(
        loose.both
      ).padStart(13)} | ${pct(strict.both).padStart(9)} | ${pct(loose.both).padStart(9)}`
    );
    results[label] = { strict, loose, universe: uniqueCiks.length };
  }

  // 단절 원인 분해 (5년 CY2024 종료 기준)
  const s = consecutive(2024, 5, false);
  console.log(
    `\n단절 원인(5년·CY2024 종료·폴백없음): 매출만 있음 ${s.revOnly} · 영업이익만 있음 ${s.ebitOnly}`
  );

  results["_totalFilerCountByTagYear"] = totalFilerCount;
  results["_universeSymbols"] = survivors.length;
  results["_universeCiks"] = uniqueCiks.length;
  results["_measuredAt"] = new Date().toISOString();

  const out = path.join(process.cwd(), "docs", "probe_841_output.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\n저장: ${out}`);
}

main();
