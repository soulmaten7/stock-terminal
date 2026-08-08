// STEP 939 §4 — 정답지 대조 실측 재현(판정 아님·사실 기록).
// Damodaran indname.xls(primary_sector) vs SPDR 섹터 ETF holdings(진짜 GICS) 일치율.
// 실행: npx tsx scripts/probe_939_gics_truth.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "node:fs";
import { createAdminClient } from "../lib/supabase/admin";

const norm = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, "");

async function main() {
  const sb = createAdminClient();

  const spdrFile = "data/sources/spdr/spdr_sector_holdings_2026-08-06.json";
  const spdr = JSON.parse(fs.readFileSync(spdrFile, "utf8")) as {
    _meta: { asOf: string; rows: number };
    data: { ticker: string; name: string; etf: string; sector: string }[];
  };

  // SPDR 맵(정규화 티커 → 섹터). 정규화 후 중복이 있으면 관측만(판단 안 함).
  const spdrMap = new Map<string, { sector: string; ticker: string; name: string; etf: string }>();
  const spdrDupes: string[] = [];
  for (const r of spdr.data) {
    const n = norm(r.ticker);
    if (spdrMap.has(n)) spdrDupes.push(n);
    spdrMap.set(n, { sector: r.sector, ticker: r.ticker, name: r.name, etf: r.etf });
  }

  // damodaran_industry(is_us_listed=true) 전수(페이지네이션)
  const damo: { ticker: string; ticker_norm: string; primary_sector: string | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("damodaran_industry").select("ticker, ticker_norm, primary_sector").eq("is_us_listed", true).range(f, f + 999);
    const c = (data ?? []) as typeof damo;
    damo.push(...c);
    if (c.length < 1000) break;
  }
  const damoMap = new Map(damo.map((r) => [r.ticker_norm, r]));

  // §2 겹침·일치율
  let overlap = 0, match = 0;
  const mismatches: { ticker: string; damodaranSector: string | null; spdrSector: string; spdrEtf: string }[] = [];
  for (const [n, d] of damoMap) {
    const s = spdrMap.get(n);
    if (!s) continue;
    overlap++;
    if (d.primary_sector === s.sector) match++;
    else mismatches.push({ ticker: d.ticker, damodaranSector: d.primary_sector, spdrSector: s.sector, spdrEtf: s.etf });
  }
  const matchRate = overlap > 0 ? match / overlap : 0;

  // §3 미매핑 219 중 SPDR에 있는 것
  const missing219File = "data/sources/sec/sec_sic_missing219_20260808.json";
  const missing219 = JSON.parse(fs.readFileSync(missing219File, "utf8")) as { data: { symbol: string; name: string }[] };
  const foundIn219: { symbol: string; name: string; spdrSector: string; spdrEtf: string }[] = [];
  for (const m of missing219.data) {
    const s = spdrMap.get(norm(m.symbol));
    if (s) foundIn219.push({ symbol: m.symbol, name: m.name, spdrSector: s.sector, spdrEtf: s.etf });
  }

  const out = {
    _meta: {
      purpose: "STEP 939 §4 — 정답지 대조 실측 재현(판정 아님·사실 기록)",
      spdrFile,
      missing219File,
      generatedAt: new Date().toISOString(),
    },
    spdr: { asOf: spdr._meta.asOf, rows: spdr._meta.rows, dupNormTickers: spdrDupes },
    damodaranUsListed: damo.length,
    comparison: { overlap, match, matchRate, mismatches },
    missing219: { total: missing219.data.length, foundInSpdr: foundIn219.length, entries: foundIn219 },
  };
  fs.writeFileSync("docs/probe_939_gics_truth.json", JSON.stringify(out, null, 2));

  console.log(`SPDR 구성종목 = ${spdr._meta.rows} · as_of = ${spdr._meta.asOf}`);
  console.log(`Damodaran is_us_listed = ${damo.length}`);
  console.log(`겹침 = ${overlap} · 일치 = ${match} · 일치율 = ${(matchRate * 100).toFixed(1)}%`);
  console.log(`불일치 ${mismatches.length}건: ${mismatches.map((m) => m.ticker).join(", ")}`);
  console.log(`미매핑219 중 SPDR 존재 = ${foundIn219.length}건: ${foundIn219.map((f) => f.symbol).join(", ")}`);
  if (spdrDupes.length) console.log(`🔴 SPDR 정규화 티커 중복 관측: ${spdrDupes.join(", ")}`);
  console.log(`\n저장: docs/probe_939_gics_truth.json`);
}

main();
