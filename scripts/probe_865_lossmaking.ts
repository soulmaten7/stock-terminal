/**
 * STEP 865 — 적자(operating_margin≤0) 78사에 두 터미널로 엔진 실행. 🔴 실측만·미채택·읽기전용(SELECT+SEC fetch).
 *   A = 현행 T8 인플레 영구연금(i=expected_inflation) · B = NC 성장0(i=0 → NOPAT(1+0)/(WACC-0)=NOPAT/WACC).
 *   엔진/DB/화면 변경 0. runRevDcf를 인자만 바꿔 호출.
 * 실행: npx tsx --env-file=.env.local scripts/probe_865_lossmaking.ts
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDrivers } from "@/lib/revdcf/drivers";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "@/lib/revdcf/engine";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const AS_OF = "2026-08-03";

function verdictLabel(k: string) { return k === "over_cap" ? "25+" : k === "below_one" ? "<1" : k; }

async function main() {
  const sb = createAdminClient();
  const rows: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("*").eq("as_of", AS_OF).lte("operating_margin", 0).range(f, f + 999);
    const c = data ?? []; rows.push(...c); if (c.length < 1000) break;
  }
  console.log(`=== 적자(operating_margin≤0) ${rows.length}사 · as_of ${AS_OF} · 현행 verdict: ${JSON.stringify(rows.reduce((a: any, r) => { a[r.verdict] = (a[r.verdict] ?? 0) + 1; return a; }, {}))} ===`);

  let lastCall = 0; const thr = async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };
  const distA: Record<string, number> = {}, distB: Record<string, number> = {};
  const yearsA: any[] = [], yearsB: any[] = [];
  let fetchFail = 0, sanityOk = 0;
  const negTermA: string[] = [];
  const detail: any[] = [];

  for (const row of rows) {
    await thr();
    let startingSales: number | null = null;
    try { const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(row.cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) }); if (r.ok) { const j = await r.json(); const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {}); if (dr.ok) startingSales = dr.drivers.startingSales; } } catch { /**/ }
    if (startingSales == null) { fetchFail++; continue; }

    const d: RevDcfDrivers = { startingSales, salesGrowth: +row.sales_growth, operatingMargin: +row.operating_margin, startingMargin: +row.starting_margin, taxRate: +row.tax_rate, fixedCapitalRate: +row.fixed_capital_rate, workingCapitalRate: +row.working_capital_rate };
    const iInfl = (row.flags?.inflationUsed as number) ?? 0.025;
    const mk = (i: number): RevDcfMarket => ({ wacc: +row.wacc, inflation: i, sharePrice: +row.share_price, sharesOutstanding: +row.shares, debt: +row.debt, nonOperatingAssets: +row.non_operating_assets });

    const A = runRevDcf(d, mk(iInfl), { maxYears: 25 });
    const B = runRevDcf(d, mk(0), { maxYears: 25 });
    distA[A.verdict.kind] = (distA[A.verdict.kind] ?? 0) + 1;
    distB[B.verdict.kind] = (distB[B.verdict.kind] ?? 0) + 1;
    // A가 DB verdict 재현하나(정합성)
    if (A.verdict.kind === row.verdict) sanityOk++;
    if (A.verdict.kind === "years") yearsA.push({ s: row.symbol, gap: A.verdict.gap, om: (+row.operating_margin * 100).toFixed(1) });
    if (B.verdict.kind === "years") yearsB.push({ s: row.symbol, gap: (B.verdict as any).gap, om: (+row.operating_margin * 100).toFixed(1) });
    // 터미널 부호(year 0 잔여가치)
    const term0A = A.years[0]?.pvResidual;
    if (term0A != null && term0A < 0) negTermA.push(row.symbol);
    detail.push({ symbol: row.symbol, om: +row.operating_margin, A: verdictLabel(A.verdict.kind), Agap: A.verdict.kind === "years" ? A.verdict.gap : null, B: verdictLabel(B.verdict.kind), Bgap: B.verdict.kind === "years" ? (B.verdict as any).gap : null, monoA: A.monotonic, monoB: B.monotonic });
  }

  const fmt = (d: Record<string, number>) => Object.entries(d).map(([k, v]) => `${verdictLabel(k)} ${v}`).join(" · ");
  console.log(`\nfetch 실패 ${fetchFail} · A가 DB verdict 재현 ${sanityOk}/${rows.length - fetchFail}`);
  console.log(`\n=== §1 verdict 분포 ===`);
  console.log(`  A(T8 인플레): ${fmt(distA)}`);
  console.log(`  B(NC 성장0):  ${fmt(distB)}`);
  console.log(`\n=== years 산출 종목 (적자인데 기간 나옴) ===`);
  console.log(`  A: ${yearsA.length ? yearsA.map((y) => `${y.s}(gap${y.gap}·마진${y.om}%)`).join(", ") : "없음"}`);
  console.log(`  B: ${yearsB.length ? yearsB.map((y) => `${y.s}(gap${y.gap}·마진${y.om}%)`).join(", ") : "없음"}`);
  console.log(`\n=== §2 터미널 부호: year0 잔여가치<0 (A) = ${negTermA.length}사 ===`);
  console.log(`  ${negTermA.slice(0, 20).join(", ")}${negTermA.length > 20 ? " …" : ""}`);
  console.log(`\n=== A→B 판정 변화 (다른 것만·상위 20) ===`);
  const changed = detail.filter((x) => x.A !== x.B);
  console.log(`  변화 ${changed.length}사: ${changed.slice(0, 20).map((x) => `${x.symbol} ${x.A}→${x.B}`).join(", ")}`);
  console.log(`\n=== 극단 마진 하위 5 상세 ===`);
  for (const x of detail.sort((a, b) => a.om - b.om).slice(0, 5)) console.log(`  ${x.symbol}: 마진 ${(x.om * 100).toFixed(1)}% · A=${x.A}${x.Agap ? "(" + x.Agap + ")" : ""}(mono ${x.monoA}) · B=${x.B}${x.Bgap ? "(" + x.Bgap + ")" : ""}(mono ${x.monoB})`);
  require("node:fs").writeFileSync("docs/probe_865_output.json", JSON.stringify({ distA, distB, yearsA, yearsB, negTermA: negTermA.length, detail }, null, 1));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
