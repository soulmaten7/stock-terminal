// STEP 941 — 야후 assetProfile 섹터를 lens_scores US 전 종목(1,021)에서 취득해 us_sector_yahoo에 적재.
// 실행: npx tsx scripts/ingest_yahoo_sector.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import YahooFinance from "yahoo-finance2";
import { createAdminClient } from "../lib/supabase/admin";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const AS_OF = new Date().toISOString().slice(0, 10);

// STEP 941 §1 — 야후 11분류 → GICS 11 (1:1 대응, 확정). 매핑표 밖 값은 매핑하지 않고 원문만 보존.
const YAHOO_TO_GICS: Record<string, string> = {
  Technology: "Information Technology",
  "Financial Services": "Financials",
  "Consumer Cyclical": "Consumer Discretionary",
  "Consumer Defensive": "Consumer Staples",
  "Basic Materials": "Materials",
  Healthcare: "Health Care",
  "Communication Services": "Communication Services",
  Industrials: "Industrials",
  Energy: "Energy",
  Utilities: "Utilities",
  "Real Estate": "Real Estate",
};

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, async () => {
    while (i < arr.length) { const cur = i++; out[cur] = await fn(arr[cur]); }
  }));
  return out;
}

async function main() {
  const sb = createAdminClient();
  const lensRows: { symbol: string }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores").select("symbol").eq("market", "US").range(f, f + 999);
    const c = (data ?? []) as { symbol: string }[];
    lensRows.push(...c);
    if (c.length < 1000) break;
  }
  const symbols = lensRows.map((r) => r.symbol);
  console.log(`대상 ${symbols.length}종목 · as_of=${AS_OF}`);

  const rows: { as_of: string; symbol: string; sector_raw: string | null; sector: string | null; industry: string | null; country: string | null }[] = [];
  const failReasons: Record<string, number> = {};
  const failSample: { symbol: string; reason: string; msg: string }[] = [];
  const outOfTable = new Map<string, number>();

  await mapLimit(symbols, 6, async (sym) => {
    try {
      const r = await yf.quoteSummary(sym, { modules: ["assetProfile"] });
      const ap = r.assetProfile as { sector?: string; industry?: string; country?: string } | undefined;
      const sectorRaw = ap?.sector ?? null;
      const gics = sectorRaw ? YAHOO_TO_GICS[sectorRaw] ?? null : null;
      if (sectorRaw && !gics) outOfTable.set(sectorRaw, (outOfTable.get(sectorRaw) ?? 0) + 1);
      rows.push({ as_of: AS_OF, symbol: sym, sector_raw: sectorRaw, sector: gics, industry: ap?.industry ?? null, country: ap?.country ?? null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const lower = msg.toLowerCase();
      const reason = /429|rate|timeout|timed out/.test(lower) ? "rate_limited_or_timeout"
        : /not found|404|no fundamentals|quote not found|invalid/.test(lower) ? "no_data"
        : "other_error";
      failReasons[reason] = (failReasons[reason] ?? 0) + 1;
      if (failSample.length < 10) failSample.push({ symbol: sym, reason, msg: msg.slice(0, 200) });
      rows.push({ as_of: AS_OF, symbol: sym, sector_raw: null, sector: null, industry: null, country: null });
    }
  });

  for (let i = 0; i < rows.length; i += 1000) {
    const { error } = await sb.from("us_sector_yahoo").upsert(rows.slice(i, i + 1000), { onConflict: "as_of,symbol" });
    if (error) throw new Error(`upsert batch@${i}: ${error.message}`);
  }

  const success = rows.filter((r) => r.sector_raw !== null).length;
  const failed = rows.length - success;
  console.log(`적재 ${rows.length}행 · 성공(sector_raw 있음) ${success} · 실패 ${failed}(${((failed / rows.length) * 100).toFixed(1)}%)`);
  console.log(`실패 사유: ${JSON.stringify(failReasons)}`);
  console.log(`매핑표 밖 sector_raw: ${JSON.stringify(Object.fromEntries(outOfTable))}`);

  fs.writeFileSync("docs/probe_941_yahoo_ingest.json", JSON.stringify({
    _meta: { asOf: AS_OF, target: symbols.length, generatedAt: new Date().toISOString() },
    success, failed, failReasons, failSample, outOfTable: Object.fromEntries(outOfTable),
  }, null, 2));
  console.log("저장: docs/probe_941_yahoo_ingest.json");
}

main();
