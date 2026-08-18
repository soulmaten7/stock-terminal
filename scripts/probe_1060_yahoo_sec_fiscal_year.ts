// STEP 1060 §2-1·§2-3 — 야후 fundamentalsTimeSeries가 SEC(us_fundamentals) 대비 어느 회계연도를 쓰는지 대조.
// 🔴 이 STEP의 유일한 예외로 야후 실조회를 허용(§2-0): 상한 200종목·순차호출·레이트리밋·DB 쓰기 0·결과는 docs/probe_1060_*.json로만.
// 실행: cd /Users/maegbug/stock-terminal && npx tsx .claude/worktrees/step1055/scripts/probe_1060_yahoo_sec_fiscal_year.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";
import fs from "fs";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const CAP = 200;
const FORCED = ["AAPL", "MSFT", "KO"]; // ⓪-4① 3종목 재현 대상

type PoolRow = { symbol: string; fiscal_year: number; revenue: number; total_assets: number; tier: string; sector: string | null; fetched_at: string };

async function loadPool(sb: ReturnType<typeof createAdminClient>): Promise<PoolRow[]> {
  const { data: fRows, error: fErr } = await sb
    .from("us_fundamentals")
    .select("symbol,fiscal_year,revenue,total_assets,fetched_at")
    .not("total_assets", "is", null)
    .not("revenue", "is", null)
    .not("fiscal_year", "is", null);
  if (fErr) throw fErr;
  const { data: mcRows } = await sb.from("us_market_cap").select("symbol,market_cap");
  const { data: secRows } = await sb.from("us_sector_wide").select("symbol,sector");
  const mcBy = new Map(((mcRows ?? []) as { symbol: string; market_cap: number }[]).map((r) => [r.symbol, r.market_cap]));
  const secBy = new Map(((secRows ?? []) as { symbol: string; sector: string | null }[]).map((r) => [r.symbol, r.sector]));
  const tierOf = (mc: number | undefined): string => {
    if (mc == null) return "unknown";
    if (mc >= 200e9) return "mega";
    if (mc >= 10e9) return "large";
    if (mc >= 2e9) return "mid";
    if (mc >= 3e8) return "small";
    return "micro";
  };
  return ((fRows ?? []) as { symbol: string; fiscal_year: number; revenue: number; total_assets: number; fetched_at: string }[]).map((r) => ({
    ...r,
    tier: tierOf(mcBy.get(r.symbol)),
    sector: secBy.get(r.symbol) ?? null,
  }));
}

// 층화 표본: 티어별로 섹터 라운드로빈으로 뽑아 특정 티어·섹터 쏠림 방지.
function stratifiedSample(pool: PoolRow[], targetTotal: number, forced: string[]): PoolRow[] {
  const bySymbol = new Map(pool.map((r) => [r.symbol, r]));
  const out: PoolRow[] = [];
  const used = new Set<string>();
  for (const sym of forced) {
    const r = bySymbol.get(sym);
    if (r) { out.push(r); used.add(sym); }
  }
  const tiers = ["mega", "large", "mid", "small", "micro"];
  const remaining = targetTotal - out.length;
  const perTier = Math.ceil(remaining / tiers.length);
  for (const tier of tiers) {
    const tierPool = pool.filter((r) => r.tier === tier && !used.has(r.symbol));
    const bySector = new Map<string, PoolRow[]>();
    for (const r of tierPool) {
      const k = r.sector ?? "unknown";
      if (!bySector.has(k)) bySector.set(k, []);
      bySector.get(k)!.push(r);
    }
    for (const list of bySector.values()) list.sort((a, b) => a.symbol.localeCompare(b.symbol));
    const sectorKeys = [...bySector.keys()].sort();
    let picked = 0;
    let round = 0;
    while (picked < perTier && sectorKeys.some((k) => bySector.get(k)!.length > round)) {
      for (const k of sectorKeys) {
        if (picked >= perTier) break;
        const list = bySector.get(k)!;
        if (list.length > round) {
          out.push(list[round]);
          used.add(list[round].symbol);
          picked++;
        }
      }
      round++;
    }
  }
  return out.slice(0, targetTotal);
}

type FRow = { date?: unknown; totalRevenue?: number | null; grossProfit?: number | null; costOfRevenue?: number | null; totalAssets?: number | null };

function yearOf(d: unknown): number | null {
  if (d instanceof Date) return d.getUTCFullYear();
  if (typeof d === "string") { const n = parseInt(d.slice(0, 4), 10); return Number.isFinite(n) ? n : null; }
  return null;
}
function monthOf(d: unknown): number | null {
  if (d instanceof Date) return d.getUTCMonth() + 1;
  if (typeof d === "string" && d.length >= 7) { const n = parseInt(d.slice(5, 7), 10); return Number.isFinite(n) ? n : null; }
  return null;
}

async function main() {
  const sb = createAdminClient();
  console.log("[pool] loading...");
  const pool = await loadPool(sb);
  console.log(`[pool] total_assets+revenue+fiscal_year 모두 있는 SEC 종목 = ${pool.length}`);
  const sample = stratifiedSample(pool, CAP, FORCED);
  console.log(`[sample] 층화표본 = ${sample.length}종목 (상한 ${CAP})`);

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  let ok = 0, fail = 0;
  const failReasons: Record<string, number> = {};
  const results: Record<string, unknown>[] = [];

  for (let i = 0; i < sample.length; i++) {
    const s = sample[i];
    try {
      const fts = await yf.fundamentalsTimeSeries(s.symbol, {
        period1: new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
        type: "annual",
        module: "all",
      });
      const raw = (Array.isArray(fts) ? fts : []) as Array<Record<string, unknown>>;
      const rows: FRow[] = raw
        .map((r) => ({
          date: r.date,
          totalRevenue: (r.totalRevenue as number) ?? null,
          grossProfit: (r.grossProfit as number) ?? null,
          costOfRevenue: (r.costOfRevenue as number) ?? null,
          totalAssets: (r.totalAssets as number) ?? null,
        }))
        .sort((a, b) => {
          const da = a.date instanceof Date ? a.date.getTime() : new Date(String(a.date)).getTime();
          const db = b.date instanceof Date ? b.date.getTime() : new Date(String(b.date)).getTime();
          return da - db;
        });
      const lr = rows[rows.length - 1];
      const yYear = lr ? yearOf(lr.date) : null;
      const yMonth = lr ? monthOf(lr.date) : null;
      const yRev = lr?.totalRevenue ?? null;
      const yTA = lr?.totalAssets ?? null;
      const yGP = lr?.grossProfit ?? null;
      const yCogs = lr?.costOfRevenue ?? null;
      const yGPComputed = yRev != null && yCogs != null ? yRev - yCogs : null;

      results.push({
        symbol: s.symbol,
        tier: s.tier,
        sector: s.sector,
        sec: { fiscal_year: s.fiscal_year, revenue: s.revenue, total_assets: s.total_assets, fetched_at: s.fetched_at },
        yahoo: {
          yearListCount: rows.length,
          yearList: rows.map((r) => yearOf(r.date)),
          latestYear: yYear,
          latestMonth: yMonth,
          latestRevenue: yRev,
          latestTotalAssets: yTA,
          latestGrossProfit: yGP,
          latestGrossProfitComputed: yGPComputed,
        },
      });
      ok++;
    } catch (e) {
      fail++;
      const reason = e instanceof Error ? e.message.slice(0, 120) : String(e);
      failReasons[reason] = (failReasons[reason] ?? 0) + 1;
      results.push({ symbol: s.symbol, tier: s.tier, sector: s.sector, sec: { fiscal_year: s.fiscal_year }, error: reason });
    }
    if (i % 20 === 0) console.log(`[progress] ${i + 1}/${sample.length} ok=${ok} fail=${fail}`);
    await new Promise((r) => setTimeout(r, 150)); // 레이트리밋
  }
  const durationMs = Date.now() - t0;
  const finishedAt = new Date().toISOString();

  const out = {
    meta: {
      step: 1060,
      startedAt, finishedAt, durationMs,
      calls: sample.length, ok, fail, failReasons,
      poolSize: pool.length, sampleCap: CAP,
      forcedSymbols: FORCED,
    },
    results,
  };
  const path = "docs/probe_1060_yahoo_sec_fiscal_year.json";
  fs.writeFileSync(path, JSON.stringify(out, null, 2));
  console.log(`[done] wrote ${path} — calls=${sample.length} ok=${ok} fail=${fail} durationMs=${durationMs}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
