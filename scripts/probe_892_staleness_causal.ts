// STEP 892 — 시총 신선도: 원인 확정 · stale 편향 분해(전수 86사 + fresh 대조군) · 처방 재료. 읽기 전용 · DB 쓰기 0.
// 실행: npx tsx scripts/probe_892_staleness_causal.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
import { computeDrivers } from "../lib/revdcf/drivers";
import { runRevDcf, type RevDcfMarket, type RevDcfDrivers } from "../lib/revdcf/engine";
import symbolsJson from "../data/us_symbols.json";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const sb = createAdminClient();
const CF_DIR = "/tmp/866_cf";
const cikName = (cik: number) => `CIK${String(cik).padStart(10, "0")}.json`;

type Sym = { sym: string; name: string; type: string };
const STOCK_SYMS: string[] = (symbolsJson as Sym[]).filter((s) => s.type === "stock").map((s) => s.sym);
const indexOf = new Map(STOCK_SYMS.map((s, i) => [s, i]));

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

function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  return new Promise((resolve, reject) => {
    const out: R[] = new Array(items.length);
    let i = 0, active = 0, done = 0;
    if (!items.length) return resolve(out);
    const next = () => {
      while (active < limit && i < items.length) {
        const idx = i++; active++;
        fn(items[idx]).then((r) => { out[idx] = r; active--; done++; if (done === items.length) resolve(out); else next(); }).catch(reject);
      }
    };
    next();
  });
}

(async () => {
  // ── §1-1 retryBudgetHit 소비처 확인(코드 사실 — 여기 기록만) ──
  const retryBudgetHitConsumers =
    "lib/lensPrecompute.ts:157에서 diag.retryBudgetHit로 반환되나, 파일 전체에서 diag.retryBudgetHit를 참조하는 곳은 0건(grep) — " +
    "capGateDecision(:53)은 freshCoverage만 받고 retryBudgetHit는 인자로도 안 들어감. console.log(:467)·Sentry.captureMessage(:468) 어디에도 retryBudgetHit 미포함. " +
    "결론: 진단은 계산되나 소비처가 없다(죽은 값·891의 '조용함'보다 더 정확한 표현 = '계산되고 버려짐').";

  // ── §1-3 STOCK_SYMS 배열 위치 상관 ──
  const mcapAll = await readAll<{ symbol: string; market_cap: number; as_of: string }>("us_market_cap", "symbol, market_cap, as_of");
  const stale0730 = mcapAll.filter((r) => r.as_of === "2026-07-30").map((r) => r.symbol);
  const staleIdx = stale0730.map((s) => indexOf.get(s)).filter((i): i is number => i != null);
  const allIdx = STOCK_SYMS.map((_, i) => i);
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const staleIdxMean = mean(staleIdx);
  const allIdxMean = mean(allIdx);
  const staleIdxFracMean = mean(staleIdx.map((i) => i / STOCK_SYMS.length)); // 0~1로 정규화, 균등분포면 0.5 근처
  // 10분위 히스토그램
  const decile = (frac: number) => Math.min(9, Math.floor(frac * 10));
  const decileHist = new Array(10).fill(0);
  for (const i of staleIdx) decileHist[decile(i / STOCK_SYMS.length)]++;

  // ── §1-4 정리(cleanup) 부재 재확인 ──
  const cleanupCheck = "grep -rn 'delete\\|truncate' *.ts 대상 us_market_cap — 0건(별도 확인, 코드베이스 전수). 나이 상한 없음 확정.";

  // ── §2 — 604 중 stale 전수(86사 근처) 인과 분해 + fresh 대조군 ──
  const latestAsOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  type RevRow = {
    cik: number; symbol: string | null; verdict: string; gap_years: number | null;
    sales_growth: number | null; operating_margin: number | null; starting_margin: number | null; tax_rate: number | null;
    fixed_capital_rate: number | null; working_capital_rate: number | null; wacc: number | null;
    debt: number | null; non_operating_assets: number | null; shares: number | null;
  };
  const revRows: RevRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("revdcf_results")
      .select("cik, symbol, verdict, gap_years, sales_growth, operating_margin, starting_margin, tax_rate, fixed_capital_rate, working_capital_rate, wacc, debt, non_operating_assets, shares")
      .eq("as_of", latestAsOf!.as_of).range(from, from + 999);
    const c = (data ?? []) as RevRow[];
    revRows.push(...c);
    if (c.length < 1000) break;
  }
  const mcapBySym = new Map(mcapAll.map((r) => [r.symbol.toUpperCase(), r]));
  const gi = (await sb.from("damodaran_global_inputs").select("expected_inflation").single()).data as { expected_inflation: number };
  const inflation = +gi.expected_inflation;

  function buildDrivers(r: RevRow): { drivers: RevDcfDrivers; ok: boolean } {
    const p = `${CF_DIR}/${cikName(r.cik)}`;
    if (!existsSync(p)) return { drivers: null as never, ok: false };
    try {
      const j = JSON.parse(readFileSync(p, "utf8")) as { facts?: { "us-gaap"?: Record<string, unknown> } };
      const dr = computeDrivers((j.facts?.["us-gaap"] ?? {}) as never, {});
      if (!dr.ok) return { drivers: null as never, ok: false };
      return {
        ok: true,
        drivers: {
          startingSales: dr.drivers.startingSales,
          salesGrowth: r.sales_growth!, operatingMargin: r.operating_margin!, startingMargin: r.starting_margin!,
          taxRate: r.tax_rate!, fixedCapitalRate: r.fixed_capital_rate!, workingCapitalRate: r.working_capital_rate!,
        },
      };
    } catch { return { drivers: null as never, ok: false }; }
  }

  const joined = revRows.map((r) => ({ ...r, m: r.symbol ? mcapBySym.get(r.symbol.toUpperCase()) : undefined }));
  const staleGroup = joined.filter((j) => j.m && j.m.as_of !== latestAsOf!.as_of && j.wacc != null && j.shares != null);
  const freshGroupAll = joined.filter((j) => j.m && j.m.as_of === latestAsOf!.as_of && j.wacc != null && j.shares != null);

  type PairResult = {
    symbol: string; verdictBefore: string; gapBefore: number | null; verdictAfter: string; gapAfter: number | null;
    capBefore: number; capAfter: number; pctPriceMove: number; verdictChanged: boolean; gapDelta: number | null;
  };
  async function reproAndShift(r: RevRow, capBefore: number, fetchAfterCap: () => Promise<number | null>): Promise<PairResult | null> {
    const { drivers, ok } = buildDrivers(r);
    if (!ok) return null;
    const sharesN = r.shares!;
    const before: RevDcfMarket = { wacc: r.wacc!, inflation, sharePrice: capBefore / sharesN, sharesOutstanding: sharesN, debt: r.debt ?? 0, nonOperatingAssets: r.non_operating_assets ?? 0 };
    const resBefore = runRevDcf(drivers, before);
    const capAfter = await fetchAfterCap();
    if (capAfter == null) return null;
    const after: RevDcfMarket = { ...before, sharePrice: capAfter / sharesN };
    const resAfter = runRevDcf(drivers, after);
    const gb = resBefore.verdict.kind === "years" ? resBefore.verdict.gap : null;
    const ga = resAfter.verdict.kind === "years" ? resAfter.verdict.gap : null;
    return {
      symbol: r.symbol!, verdictBefore: resBefore.verdict.kind, gapBefore: gb, verdictAfter: resAfter.verdict.kind, gapAfter: ga,
      capBefore, capAfter, pctPriceMove: +(((capAfter - capBefore) / capBefore) * 100).toFixed(2),
      verdictChanged: resBefore.verdict.kind !== resAfter.verdict.kind,
      gapDelta: gb != null && ga != null ? ga - gb : null,
    };
  }

  // stale 전수(캡 있는 전부) — fresh(today) 야후 시총 대비
  const staleResults = (await mapLimit(staleGroup, 6, async (r) => {
    return reproAndShift(r, r.m!.market_cap, async () => {
      try { const q = (await yf.quote(r.symbol!)) as { marketCap?: number } | null; return q?.marketCap ?? null; } catch { return null; }
    });
  })).filter((x): x is PairResult => x != null);

  // fresh 대조군 — 무작위 표본, "며칠 전 종가" vs "오늘 종가"로 같은 방식의 자연 변동 측정(같은 시장일수 근사: ~3거래일)
  const shuffled = [...freshGroupAll].sort(() => Math.random() - 0.5).slice(0, 86);
  const controlResults = (await mapLimit(shuffled, 6, async (r) => {
    const capToday = r.m!.market_cap;
    return reproAndShift(r, capToday, async () => {
      try {
        const period1 = new Date(Date.now() - 12 * 86400000);
        const ch = (await yf.chart(r.symbol!, { period1, interval: "1d" })) as { quotes?: { close: number | null }[] };
        const closes = (ch.quotes ?? []).map((b) => b.close).filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 4) return null;
        const priceNow = closes[closes.length - 1];
        const priceFewDaysAgo = closes[Math.max(0, closes.length - 4)]; // ~3거래일 전(스테일 그룹의 07-30↔08-03 간격 근사)
        if (!priceNow) return null;
        // 시총은 (며칠전종가/오늘종가) 비율로 오늘 시총을 역산 — shares 변화 없다고 가정(며칠 사이 타당)
        return capToday * (priceFewDaysAgo / priceNow);
      } catch { return null; }
    }).then((res) => {
      if (!res) return null;
      // reproAndShift는 (before=capToday, after=fetchAfterCap) 순서였으므로 이 컨트롤에선 의미상 반대(과거→오늘) — before/after를 뒤집어 저장
      return { ...res, capBefore: res.capAfter, capAfter: res.capBefore, verdictBefore: res.verdictAfter, verdictAfter: res.verdictBefore, gapBefore: res.gapAfter, gapAfter: res.gapBefore, pctPriceMove: -res.pctPriceMove, gapDelta: res.gapDelta == null ? null : -res.gapDelta };
    });
  })).filter((x): x is PairResult => x != null);

  function summarize(rows: PairResult[]) {
    const changed = rows.filter((r) => r.verdictChanged).length;
    const gapMoves = rows.map((r) => r.gapDelta).filter((v): v is number => v != null && v !== 0);
    const absGapMoves = gapMoves.map(Math.abs).sort((a, b) => a - b);
    const median = (a: number[]) => (a.length ? (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2) : null);
    const bucketTransitions: Record<string, number> = {};
    for (const r of rows) { const k = `${r.verdictBefore}→${r.verdictAfter}`; bucketTransitions[k] = (bucketTransitions[k] ?? 0) + 1; }
    return {
      n: rows.length, verdictChangedCount: changed, verdictChangedPct: +((changed / rows.length) * 100).toFixed(1),
      gapMoversCount: gapMoves.length, gapMoveMedianAbs: median(absGapMoves), gapMoveP25Abs: absGapMoves[Math.floor(absGapMoves.length * 0.25)] ?? null, gapMoveP75Abs: absGapMoves[Math.floor(absGapMoves.length * 0.75)] ?? null,
      bucketTransitions, meanAbsPctPriceMove: +(mean(rows.map((r) => Math.abs(r.pctPriceMove))).toFixed(2)),
    };
  }

  const out = {
    generatedAt: "2026-08-04 (STEP 892)",
    section1_retryBudgetHitConsumers: retryBudgetHitConsumers,
    section1_vercelLogsObservable: "list_teams() 결과 teams:[] — Vercel MCP 접근 권한 없음(기존 STATE.md '인프라 미확정' 항목과 일치). 최근 실행에서 실제로 잘렸는지는 관측 불가로 기록.",
    section1_stockSymsPositionCorrelation: {
      staleCount: staleIdx.length, totalStockSyms: STOCK_SYMS.length,
      staleIdxMean: +staleIdxMean.toFixed(0), allIdxMean: +allIdxMean.toFixed(0),
      staleIdxFracMean_0to1: +staleIdxFracMean.toFixed(3), // 0.5면 균등, 1에 가까우면 배열 뒤쪽에 몰림
      decileHistogram_stale: decileHist,
      note: "staleIdxFracMean이 0.5(균등)에서 크게 벗어나면 배열 위치와 상관 있음. decileHistogram은 배열을 10등분했을 때 stale 심볼이 몇 번째 구간에 몇 개 있는지.",
    },
    section1_cleanupCheck: cleanupCheck,
    section2_staleGroup_n: staleGroup.length,
    section2_staleResults_summary: summarize(staleResults),
    section2_controlGroup_n: shuffled.length,
    section2_controlResults_summary: summarize(controlResults),
    section2_staleResults_detail: staleResults,
    section2_controlResults_detail: controlResults,
  };

  writeFileSync("docs/probe_892_staleness_causal.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ ...out, section2_staleResults_detail: "생략(파일 참조)", section2_controlResults_detail: "생략(파일 참조)" }, null, 2));
})();
