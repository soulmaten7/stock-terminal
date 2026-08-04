// STEP 891 — 시총 신선도 실측 + 604↔2,857 교집합. 읽기 전용 · DB 쓰기 0 · 크론 미실행.
// 실행: npx tsx scripts/probe_891_mcap_staleness.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers } from "../lib/revdcf/drivers";
import { runRevDcf, type RevDcfMarket, type RevDcfDrivers } from "../lib/revdcf/engine";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const sb = createAdminClient();
const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;

async function readAll<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from(table).select(cols).range(from, from + 999);
    const c = (data ?? []) as T[];
    out.push(...c);
    if (c.length < 1000) break;
  }
  return out;
}

(async () => {
  // ── §1-1 as_of 분포 재확인 ──
  const mcapAll = await readAll<{ symbol: string; market_cap: number; as_of: string }>("us_market_cap", "symbol, market_cap, as_of");
  const asOfDist = new Map<string, number>();
  for (const r of mcapAll) asOfDist.set(r.as_of, (asOfDist.get(r.as_of) ?? 0) + 1);
  const mcapBySym = new Map(mcapAll.map((r) => [r.symbol.toUpperCase(), r]));

  const latestAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  type RevRow = {
    cik: number; symbol: string | null; verdict: string; gap_years: number | null;
    sales_growth: number | null; operating_margin: number | null; starting_margin: number | null; tax_rate: number | null;
    fixed_capital_rate: number | null; working_capital_rate: number | null; wacc: number | null;
    debt: number | null; non_operating_assets: number | null; shares: number | null; share_price: number | null;
  };
  const revRows: RevRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("revdcf_results")
      .select("cik, symbol, verdict, gap_years, sales_growth, operating_margin, starting_margin, tax_rate, fixed_capital_rate, working_capital_rate, wacc, debt, non_operating_assets, shares, share_price")
      .eq("as_of", latestAsOf!.as_of).range(from, from + 999);
    const c = (data ?? []) as RevRow[];
    revRows.push(...c);
    if (c.length < 1000) break;
  }

  const joined = revRows.map((r) => {
    const m = r.symbol ? mcapBySym.get(r.symbol.toUpperCase()) : undefined;
    return { ...r, mcapAsOf: m?.as_of ?? null, marketCap: m?.market_cap ?? null };
  });
  const byMcapAsOf = new Map<string, typeof joined>();
  for (const j of joined) {
    const key = j.mcapAsOf ?? "MISSING";
    if (!byMcapAsOf.has(key)) byMcapAsOf.set(key, []);
    byMcapAsOf.get(key)!.push(j);
  }
  const staleness604 = [...byMcapAsOf.entries()].map(([asOf, rows]) => ({ mcapAsOf: asOf, count: rows.length }));

  const freshRows = joined.filter((j) => j.mcapAsOf === latestAsOf!.as_of);
  const staleRows = joined.filter((j) => j.mcapAsOf !== latestAsOf!.as_of);
  const verdictDist = (rows: typeof joined) => {
    const d = new Map<string, number>();
    for (const r of rows) d.set(r.verdict, (d.get(r.verdict) ?? 0) + 1);
    return Object.fromEntries(d);
  };
  const gapMedian = (rows: typeof joined) => {
    const vals = rows.map((r) => r.gap_years).filter((v): v is number => v != null).sort((a, b) => a - b);
    if (!vals.length) return null;
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  };

  // ── §1-2 520(07-30) 표본 10개 실제 Yahoo 조회로 분류 ──
  const stale0730Symbols = mcapAll.filter((r) => r.as_of === "2026-07-30").map((r) => r.symbol);
  const sample10 = stale0730Symbols.slice(0, 10);
  const classification: { symbol: string; result: string }[] = [];
  for (const sym of sample10) {
    try {
      const q = (await yf.quote(sym)) as { symbol?: string; marketCap?: number; regularMarketPrice?: number; quoteType?: string; fullExchangeName?: string } | null;
      if (!q || !q.symbol) { classification.push({ symbol: sym, result: "야후 조회 결과 없음(상장폐지·티커소멸 가능)" }); continue; }
      const hasCap = typeof q.marketCap === "number" && q.marketCap > 0;
      classification.push({
        symbol: sym,
        result: `야후 응답 있음 — quoteType=${q.quoteType ?? "?"} exchange=${q.fullExchangeName ?? "?"} marketCap=${hasCap ? "있음(" + q.marketCap + ")" : "없음/0"} price=${q.regularMarketPrice ?? "?"}`,
      });
    } catch (e) {
      classification.push({ symbol: sym, result: `야후 조회 에러: ${(e as Error).message}` });
    }
  }

  // ── §1-3 GAP 민감도 — 엔진 실재현(계산만·DB 미기록) ──
  // stale(latestAsOf 아닌) 종목 중 캐시된 companyfacts가 있는 것 15개: startingSales만 캐시에서 새로 뽑고
  // 나머지 드라이버는 DB에 이미 저장된 값을 그대로 재사용(재측정 아님 — 저장된 실측치 재조합).
  const gi = (await sb.from("damodaran_global_inputs").select("expected_inflation").single()).data as { expected_inflation: number };
  const inflation = +gi.expected_inflation;
  const staleWithCik = staleRows.filter((r) => r.marketCap != null && r.symbol && r.wacc != null && r.shares != null);
  const sensitivity: unknown[] = [];
  for (const r of staleWithCik.slice(0, 15)) {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) { sensitivity.push({ symbol: r.symbol, skipped: "캐시 companyfacts 없음" }); continue; }
    let startingSales: number | null = null;
    try {
      const j = JSON.parse(readFileSync(p, "utf8")) as { facts?: { "us-gaap"?: Record<string, unknown> } };
      const dr = computeDrivers((j.facts?.["us-gaap"] ?? {}) as never, {});
      if (dr.ok) startingSales = dr.drivers.startingSales;
    } catch { /* skip */ }
    if (startingSales == null) { sensitivity.push({ symbol: r.symbol, skipped: "startingSales 재구성 실패" }); continue; }

    const drivers: RevDcfDrivers = {
      startingSales,
      salesGrowth: r.sales_growth!, operatingMargin: r.operating_margin!, startingMargin: r.starting_margin!,
      taxRate: r.tax_rate!, fixedCapitalRate: r.fixed_capital_rate!, workingCapitalRate: r.working_capital_rate!,
    };
    const staleCap = r.marketCap!;
    const staleSharePrice = staleCap / r.shares!;
    const marketStale: RevDcfMarket = { wacc: r.wacc!, inflation, sharePrice: staleSharePrice, sharesOutstanding: r.shares!, debt: r.debt ?? 0, nonOperatingAssets: r.non_operating_assets ?? 0 };
    const reproduced = runRevDcf(drivers, marketStale);

    let freshCap: number | null = null;
    try { const q = (await yf.quote(r.symbol!)) as { marketCap?: number } | null; freshCap = q?.marketCap ?? null; } catch { /* skip */ }
    let freshResult: unknown = { skipped: "야후 fresh 시총 조회 실패" };
    if (freshCap) {
      const freshSharePrice = freshCap / r.shares!;
      const marketFresh: RevDcfMarket = { ...marketStale, sharePrice: freshSharePrice };
      const withFresh = runRevDcf(drivers, marketFresh);
      freshResult = { freshCap, freshSharePrice: +freshSharePrice.toFixed(2), verdict: withFresh.verdict.kind, gapYears: withFresh.verdict.kind === "years" ? withFresh.verdict.gap : null };
    }

    sensitivity.push({
      symbol: r.symbol, staleAsOf: r.mcapAsOf, staleCap, staleSharePrice: +staleSharePrice.toFixed(2),
      reproducedVerdict: reproduced.verdict.kind, reproducedGap: reproduced.verdict.kind === "years" ? reproduced.verdict.gap : null,
      dbStoredVerdict: r.verdict, dbStoredGap: r.gap_years, matchesDb: reproduced.verdict.kind === r.verdict && (reproduced.verdict.kind !== "years" || reproduced.verdict.gap === r.gap_years),
      fresh: freshResult,
    });
  }

  // ── §2 604 ⊂ 2,857? — 2,857 목록 저장 여부 확인 ──
  const candidatePaths = ["data/sources/sec/sec_reporting_issuers_20260630.xlsx", "docs/probe_866_universe_output.json", "docs/probe_867_output.json"];
  const listExists = candidatePaths.map((p) => ({ path: p, exists: existsSync(p) }));

  const out = {
    generatedAt: "2026-08-04 (STEP 891)",
    section1_1_asOfDistribution: Object.fromEntries(asOfDist),
    section1_1_latestRevdcfAsOf: latestAsOf!.as_of,
    section1_1_staleness604Breakdown: staleness604,
    section1_1_verdictDist_fresh: verdictDist(freshRows),
    section1_1_verdictDist_stale: verdictDist(staleRows),
    section1_1_gapMedian_fresh: gapMedian(freshRows),
    section1_1_gapMedian_stale: gapMedian(staleRows),
    section1_1_freshCount: freshRows.length,
    section1_1_staleCount: staleRows.length,
    section1_2_producerConflictTarget: "lib/lensPrecompute.ts:134 — onConflict:'symbol' (NOT (as_of,symbol)); PK도 symbol 단독(migration 043 — 원래 설계 의도가 '스냅샷'이 아니라 '최근값 폴백 캐시', 주석 원문: '매 실행 성공 cap 기록 → 다음날 폴백 재료'). 갱신 실패 시 옛 as_of째로 행이 그대로 남는 것은 이 설계상 당연 — 문제는 소비처(revdcf 크론)가 이 캐시를 신선도 필터 없이(as_of 미확인) 통째로 읽는다는 것. 대조: lensPrecompute.ts 자신의 Stage3 폴백은 .gte('as_of', cutoff)로 7일 TTL을 명시 적용 — 같은 테이블인데 두 소비처의 신선도 취급이 다르다.",
    section1_2_sample10Classification: classification,
    section1_2_silentFailureCheck: "실패에 대한 로그·플래그 없음 — freshSet에 없으면 그 심볼은 upsert 대상에서 그냥 빠짐(capRows=[...freshSet].map). 조용함.",
    section1_3_sensitivitySample: sensitivity,
    section2_2857ListStored: listExists,
  };

  writeFileSync("docs/probe_891_mcap_staleness.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();
