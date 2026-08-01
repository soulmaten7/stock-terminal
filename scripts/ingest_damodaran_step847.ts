// STEP 847 §6 — 846 잔여 2건 적재: (1) damodaran_tax_rate에 Total Market 폴백 행 추가 (2) 등급별 credit_spread.
// 실행: npx tsx scripts/ingest_damodaran_step847.ts [--as-of=YYYY-MM-DD]
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { createAdminClient } from "../lib/supabase/admin";

const DIR = "data/sources/damodaran/";
const rows = (f: string, s: string) => XLSX.utils.sheet_to_json(XLSX.read(readFileSync(DIR + f), { type: "buffer" }).Sheets[s], { header: 1, blankrows: false }) as unknown[][];
const num = (v: unknown): number | null => { if (v == null || v === "" || v === "NA") return null; const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, "")); return Number.isFinite(n) ? n : null; };
const asOf = process.argv.find((a) => a.startsWith("--as-of="))?.split("=")[1] || "2026-01-05";

async function main() {
  const sb = createAdminClient();
  // (1) Total Market 폴백 행 (taxrate.xls · industry name이 'Total'로 시작하는 집계행)
  {
    const r = rows("taxrate.xls", "Industry Averages");
    const totals: Record<string, unknown>[] = [];
    for (let i = 9; i < r.length; i++) { const x = r[i] ?? []; const name = String(x[0] ?? "").trim(); if (!name) continue; if (!/^Total/i.test(name)) continue;
      totals.push({ as_of: asOf, industry: name, n_firms: num(x[1]) != null ? Math.round(num(x[1])!) : null, eff_all: num(x[6]), eff_money: num(x[7]), eff_agg: num(x[8]), cash_money: num(x[9]), cash_agg: num(x[10]) }); }
    const { error } = await sb.from("damodaran_tax_rate").upsert(totals, { onConflict: "as_of,industry" });
    if (error) throw error;
    console.log(`✓ tax_rate Total 폴백 행: ${totals.length} (${totals.map((t) => t.industry).join(" / ")})`);
  }
  // (2) 등급별 credit spread (wacc.xls "Cost of Debt Lookup Table" · 헤더 다음 밴드 행)
  {
    const r = rows("wacc.xls", "Industry Averages");
    const bands: Record<string, unknown>[] = [];
    let inTable = false;
    for (const x of r) { const c6 = String((x ?? [])[6] ?? ""); if (/Standard Deviation/i.test(c6)) { inTable = true; continue; }
      if (inTable) { const lo = num((x ?? [])[6]), hi = num((x ?? [])[7]), sp = num((x ?? [])[8]); if (lo == null || sp == null) break; bands.push({ as_of: asOf, std_dev_lo: lo, std_dev_hi: hi, spread: sp }); } }
    const { error } = await sb.from("damodaran_credit_spread").upsert(bands, { onConflict: "as_of,std_dev_lo" });
    if (error) throw error;
    console.log(`✓ credit_spread 밴드: ${bands.length} 행`);
    for (const b of bands) console.log(`   ${b.std_dev_lo}~${b.std_dev_hi} → ${b.spread}`);
  }
  // 검산
  const tr = await sb.from("damodaran_tax_rate").select("industry", { count: "exact", head: true });
  const cs = await sb.from("damodaran_credit_spread").select("std_dev_lo", { count: "exact", head: true });
  console.log(`\n검산: damodaran_tax_rate ${tr.count}행(94 업종 + Total) · damodaran_credit_spread ${cs.count}행`);
}
main().catch((e) => { console.error(e); process.exit(1); });
