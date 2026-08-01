// STEP 846 — 다모다란 8개 xls → Postgres 테이블 8종 + 원본을 Supabase Storage(sources 버킷)에 업로드.
// 실행: npx tsx scripts/ingest_damodaran.ts [--as-of=YYYY-MM-DD] [--no-storage]
// 재실행 안전(upsert · as_of 유니크). 값은 코드에 박지 않는다 — 파일에서 파싱해 DB로.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { createAdminClient } from "../lib/supabase/admin";

const DIR = "data/sources/damodaran/";
const FILES = ["indname.xls", "taxrate.xls", "countrytaxrates.xls", "wacc.xls", "betas.xls", "capex.xls", "wcdata.xls", "totalbeta.xls"];

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const noStorage = process.argv.includes("--no-storage");
const storageOnly = process.argv.includes("--storage-only");

function sheetRows(file: string, sheet: string): unknown[][] {
  const wb = XLSX.read(readFileSync(DIR + file), { type: "buffer" });
  const sn = wb.SheetNames.includes(sheet) ? sheet : wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false }) as unknown[][];
}
function num(v: unknown): number | null {
  if (v == null || v === "" || v === "NA" || v === "N/A") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
function int(v: unknown): number | null { const n = num(v); return n == null ? null : Math.round(n); }
function str(v: unknown): string | null { const s = v == null ? "" : String(v).trim(); return s || null; }
const isTotal = (name: unknown) => /^Total\b|Total Market/i.test(String(name ?? ""));

// as_of: 인자 우선, 없으면 wacc.xls "Date updated:" 셀(엑셀 serial) → 날짜
function resolveAsOf(): string {
  const a = arg("as-of");
  if (a && /^\d{4}-\d{2}-\d{2}$/.test(a)) return a;
  const r = sheetRows("wacc.xls", "Industry Averages");
  const cell = (r[0] ?? [])[1];
  const serial = num(cell);
  if (serial) return new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10);
  return "2026-01-05";
}

const US_EXCH = new Set(["NYSE", "NasdaqGS", "NasdaqCM", "NasdaqGM", "NYSEAM", "AMEX", "BATS", "OTCPK"]);

async function main() {
  const asOf = resolveAsOf();
  const sb = createAdminClient();
  console.log(`[ingest] as_of = ${asOf}`);
  const counts: Record<string, number> = {};
  const fails: string[] = [];

  async function upsert(table: string, rows: Record<string, unknown>[], onConflict: string) {
    if (storageOnly) return;
    if (rows.length === 0) { fails.push(`${table}: 0행 파싱 — 확인 필요`); return; }
    for (let i = 0; i < rows.length; i += 1000) {
      const { error } = await sb.from(table).upsert(rows.slice(i, i + 1000), { onConflict });
      if (error) { fails.push(`${table} batch@${i}: ${error.message}`); throw error; }
    }
    counts[table] = rows.length;
    console.log(`  ✓ ${table}: ${rows.length}행`);
  }

  // ── indname → damodaran_industry (거래소:티커 분리 · 중복키 제거) ────────────
  {
    const r = sheetRows("indname.xls", "By company name");
    const seen = new Set<string>();
    const rows: Record<string, unknown>[] = [];
    let usCount = 0;
    for (let i = 1; i < r.length; i++) {
      const row = r[i] ?? [];
      const et = str(row[1]); if (!et) continue;
      const ci = et.indexOf(":");
      const exchange = ci >= 0 ? et.slice(0, ci).trim() : null;
      const ticker = ci >= 0 ? et.slice(ci + 1).trim() : et;
      if (!ticker) continue;
      const key = `${exchange}|${ticker}`;
      if (seen.has(key)) continue; seen.add(key);
      if (exchange && US_EXCH.has(exchange)) usCount++;
      rows.push({ as_of: asOf, exchange, ticker, company_name: str(row[0]), industry_group: str(row[2]), primary_sector: str(row[3]), sic_code: str(row[4]), country: str(row[5]) });
    }
    await upsert("damodaran_industry", rows, "as_of,exchange,ticker");
    counts["_us_listed_tickers"] = usCount;
  }

  // ── taxrate (header idx8 · data 9..) ─────────────────────────────────────────
  {
    const r = sheetRows("taxrate.xls", "Industry Averages");
    const rows: Record<string, unknown>[] = [];
    for (let i = 9; i < r.length; i++) { const x = r[i] ?? []; if (!str(x[0]) || isTotal(x[0])) break;
      rows.push({ as_of: asOf, industry: str(x[0]), n_firms: int(x[1]), eff_all: num(x[6]), eff_money: num(x[7]), eff_agg: num(x[8]), cash_money: num(x[9]), cash_agg: num(x[10]) }); }
    await upsert("damodaran_tax_rate", rows, "as_of,industry");
  }

  // ── countrytaxrates (data 6.. · 국가별 첫 등장 유지) ──────────────────────────
  {
    const r = sheetRows("countrytaxrates.xls", "Sheet1");
    const seen = new Set<string>();
    const rows: Record<string, unknown>[] = [];
    for (let i = 6; i < r.length; i++) { const x = r[i] ?? []; const c = str(x[0]); if (!c) continue; if (seen.has(c)) continue; seen.add(c);
      rows.push({ as_of: asOf, country: c, marginal_rate: num(x[1]) }); }
    await upsert("damodaran_country_tax", rows, "as_of,country");
  }

  // ── wacc (header 17 · data 18..) ─────────────────────────────────────────────
  {
    const r = sheetRows("wacc.xls", "Industry Averages");
    const rows: Record<string, unknown>[] = [];
    for (let i = 18; i < r.length; i++) { const x = r[i] ?? []; if (!str(x[0]) || isTotal(x[0])) break;
      rows.push({ as_of: asOf, industry: str(x[0]), n_firms: int(x[1]), beta: num(x[2]), cost_of_equity: num(x[3]), e_over_de: num(x[4]), cost_of_debt: num(x[6]), tax_rate: num(x[7]), after_tax_cod: num(x[8]), d_over_de: num(x[9]), cost_of_capital: num(x[10]) }); }
    await upsert("damodaran_wacc", rows, "as_of,industry");
  }

  // ── betas (header 9 · data 10..) ─────────────────────────────────────────────
  {
    const r = sheetRows("betas.xls", "Industry Averages");
    const rows: Record<string, unknown>[] = [];
    for (let i = 10; i < r.length; i++) { const x = r[i] ?? []; if (!str(x[0]) || isTotal(x[0])) break;
      rows.push({ as_of: asOf, industry: str(x[0]), n_firms: int(x[1]), beta: num(x[2]), de_ratio: num(x[3]), eff_tax: num(x[4]), unlevered_beta: num(x[5]), cash_over_firm: num(x[6]), unlevered_beta_cash_adj: num(x[7]), std_dev_equity: num(x[9]) }); }
    await upsert("damodaran_beta", rows, "as_of,industry");
  }

  // ── capex (header 7 · data 8..) ──────────────────────────────────────────────
  {
    const r = sheetRows("capex.xls", "Industry Averages");
    const rows: Record<string, unknown>[] = [];
    for (let i = 8; i < r.length; i++) { const x = r[i] ?? []; if (!str(x[0]) || isTotal(x[0])) break;
      rows.push({ as_of: asOf, industry: str(x[0]), n_firms: int(x[1]), capex: num(x[2]), depreciation: num(x[3]), capex_over_dep: num(x[4]), acquisitions: num(x[5]), net_rnd: num(x[6]), net_capex_over_sales: num(x[7]), net_capex_over_ebit_at: num(x[8]), sales_over_invcap: num(x[9]) }); }
    await upsert("damodaran_capex", rows, "as_of,industry");
  }

  // ── wcdata (header 7 · data 8..) ─────────────────────────────────────────────
  {
    const r = sheetRows("wcdata.xls", "Industry Averages");
    const rows: Record<string, unknown>[] = [];
    for (let i = 8; i < r.length; i++) { const x = r[i] ?? []; if (!str(x[0]) || isTotal(x[0])) break;
      rows.push({ as_of: asOf, industry: str(x[0]), n_firms: int(x[1]), ar_over_sales: num(x[2]), inv_over_sales: num(x[3]), ap_over_sales: num(x[4]), noncash_wc_over_sales: num(x[5]) }); }
    await upsert("damodaran_working_capital", rows, "as_of,industry");
  }

  // ── global_inputs (wacc 상단 셀 · 라벨로 스캔) ───────────────────────────────
  {
    const r = sheetRows("wacc.xls", "Industry Averages");
    const find = (re: RegExp): number | null => { for (let i = 0; i < 20; i++) { const x = r[i] ?? []; if (re.test(String(x[0] ?? ""))) { for (let c = 1; c < x.length; c++) { const n = num(x[c]); if (n != null) return n; } } } return null; };
    const gi = { as_of: asOf, riskfree_rate: find(/Long Term Treasury/i), erp: find(/Risk Premium to Use/i), global_default_spread: find(/Global Default Spread/i), marginal_tax_rate_used: find(/enter the marginal tax rate to use/i), expected_inflation: find(/Expected inflation rate in US/i) };
    if (!storageOnly) {
      const { error } = await sb.from("damodaran_global_inputs").upsert([gi], { onConflict: "as_of" });
      if (error) { fails.push(`damodaran_global_inputs: ${error.message}`); } else { counts["damodaran_global_inputs"] = 1; console.log(`  ✓ damodaran_global_inputs: rf=${gi.riskfree_rate} erp=${gi.erp} spread=${gi.global_default_spread} infl=${gi.expected_inflation}`); }
    }
  }

  // ── Storage 업로드 (버킷 sources · damodaran/{as_of}/) ───────────────────────
  if (!noStorage) {
    const { data: buckets } = await sb.storage.listBuckets();
    if (!buckets?.find((b) => b.name === "sources")) {
      // 🔴 프로젝트 글로벌 상한 = 50MB → 버킷 상한도 50MB로(60MB는 413). indname 22MB < 50MB.
      try {
        const { error } = await sb.storage.createBucket("sources", { public: false, fileSizeLimit: 50 * 1024 * 1024 });
        if (error && !/already exists/i.test(error.message)) fails.push(`createBucket: ${error.message}`);
        else console.log("  ✓ 버킷 sources 생성(비공개·50MB)");
      } catch (e) { fails.push(`createBucket throw: ${(e as Error).message}`); }
    }
    for (const f of FILES) {
      try {
        const { error } = await sb.storage.from("sources").upload(`damodaran/${asOf}/${f}`, readFileSync(DIR + f), { contentType: "application/vnd.ms-excel", upsert: true });
        if (error) fails.push(`storage ${f}: ${error.message}`); else console.log(`  ↑ storage: damodaran/${asOf}/${f}`);
      } catch (e) { fails.push(`storage ${f} throw: ${(e as Error).message}`); }
    }
  }

  // ── 검산 ────────────────────────────────────────────────────────────────────
  console.log("\n=== 검산 ===");
  console.log(`미국 상장 티커 수 = ${counts["_us_listed_tickers"]} (기대 ≈ 6,937)`);
  console.log(`업종별 실효세율 수 = ${counts["damodaran_tax_rate"]} (기대 = 94)`);
  const usOk = Math.abs((counts["_us_listed_tickers"] ?? 0) - 6937) <= 300;
  const taxOk = counts["damodaran_tax_rate"] === 94;
  console.log(`검산 결과: 미국티커 ${usOk ? "OK" : "❌"} · 세율업종 ${taxOk ? "OK" : "❌"}`);

  console.log("\n=== 행 수 ===");
  for (const [k, v] of Object.entries(counts)) if (!k.startsWith("_")) console.log(`  ${k}: ${v}`);
  if (fails.length) { console.log("\n🔴 실패/경고:"); for (const f of fails) console.log("  - " + f); }
  else console.log("\n✅ 파싱 실패 0");
}
main().catch((e) => { console.error(e); process.exit(1); });
