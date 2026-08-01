/**
 * STEP 858 — 실측 전용 프로브: 미지수를 "기간(N)"에서 "성장률(g)"로 바꾸면 어떻게 되나.
 * 🔴 재보기만. 프로덕션·DB·크론 변경 없음. 채택 여부는 장은태 결정. 일회성.
 *
 * 방법: 기존 runRevDcf를 그대로 호출하되, salesGrowth(g)를 바꿔 주당가치(N)==주가가 되는 g를 이분탐색.
 *   기간 N 고정(5/10/25). 나머지 driver = 현재 DB 값 그대로. startingSales만 SEC에서 회수(DB 미저장).
 *
 * 실행: npx tsx scripts/probe_858_implied_growth.ts
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDrivers } from "@/lib/revdcf/drivers";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "@/lib/revdcf/engine";
import { writeFileSync } from "node:fs";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const Ns = [5, 10, 25] as const;

// ── g 솔버 ─────────────────────────────────────────────────────────
function perShareAt(base: RevDcfDrivers, market: RevDcfMarket, g: number, N: number): number {
  const r = runRevDcf({ ...base, salesGrowth: g }, market, { maxYears: N });
  if (r.verdict.kind === "invalid" || !r.years[N]) return NaN;
  return r.years[N].perShare;
}

type Solve = { g: number | null; status: "ok" | "no_root" | "multi_root" | "invalid"; mono: string; roots: number };

function solveG(base: RevDcfDrivers, market: RevDcfMarket, N: number): Solve {
  const price = market.sharePrice;
  const f = (g: number) => perShareAt(base, market, g, N) - price;
  // 미세 그리드로 부호변화(=근) 구간 전수 스캔 → 단조·근 개수 판정
  const lo = -0.5, hi = 1.0, step = 0.005;
  const xs: number[] = [], fs: number[] = [];
  for (let g = lo; g <= hi + 1e-12; g += step) { xs.push(g); fs.push(f(g)); }
  if (fs.some((v) => !Number.isFinite(v))) return { g: null, status: "invalid", mono: "na", roots: 0 };
  // 단조성
  let up = true, down = true;
  for (let k = 1; k < fs.length; k++) { if (fs[k] - fs[k - 1] > 1e-9) down = false; else if (fs[k] - fs[k - 1] < -1e-9) up = false; }
  const mono = up && !down ? "up" : down && !up ? "down" : "mixed";
  // 부호변화 구간
  const brackets: [number, number][] = [];
  for (let k = 1; k < fs.length; k++) if (fs[k - 1] === 0 || fs[k] === 0 || fs[k - 1] * fs[k] < 0) brackets.push([xs[k - 1], xs[k]]);
  if (brackets.length === 0) return { g: null, status: "no_root", mono, roots: 0 };
  // 각 구간 이분
  const roots = brackets.map(([a, b]) => {
    let flo = f(a), lo2 = a, hi2 = b;
    for (let i = 0; i < 60; i++) { const mid = (lo2 + hi2) / 2; const fm = f(mid); if (Math.abs(fm) < 1e-7 || hi2 - lo2 < 1e-9) return mid; if (flo * fm < 0) hi2 = mid; else { lo2 = mid; flo = fm; } }
    return (lo2 + hi2) / 2;
  });
  if (roots.length > 1) return { g: roots[0], status: "multi_root", mono, roots: roots.length };
  return { g: roots[0], status: "ok", mono, roots: 1 };
}

// ── §2 도미노 재현 (T8 Inputs 직접·SEC/DB 불필요) ──────────────────
function dominoReproduction() {
  const base: RevDcfDrivers = { startingSales: 3618.8, salesGrowth: 0.07, operatingMargin: 0.175, startingMargin: 0.1739, taxRate: 0.165, fixedCapitalRate: 0.15, workingCapitalRate: 0.10 };
  const market: RevDcfMarket = { wacc: 0.05357, inflation: 0.016, sharePrice: 418, sharesOutstanding: 39.35, debt: 4170, nonOperatingAssets: 391.9 };
  console.log("\n=== §2 도미노 재현 (T8 Inputs · 기대 g=7% @ N=8) ===");
  for (const N of [8, 5, 10, 25] as const) {
    const s = solveG(base, market, N);
    const err = s.g != null ? ((s.g - 0.07) * 100).toFixed(2) : "—";
    console.log(`  N=${N}: g=${s.g != null ? (s.g * 100).toFixed(3) + "%" : "—"}  (mono=${s.mono}, ${s.status})` + (N === 8 ? `  → 7%와 오차 ${err}%p` : ""));
  }
  // 참고: 원 엔진의 기간판정(g=7% 고정)
  const r = runRevDcf(base, market, { maxYears: 100 });
  console.log(`  [교차검증] g=7% 고정 기간판정: ${r.verdict.kind === "years" ? r.verdict.gap + "년" : r.verdict.kind}, value(1)=$${r.years[1].perShare.toFixed(1)}`);
}

// ── §3/§4 604 전수 ────────────────────────────────────────────────
async function main() {
  dominoReproduction();

  const sb = createAdminClient();
  const asOf = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
  if (!asOf?.as_of) { console.log("no data"); return; }
  const rows: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("revdcf_results").select("*").eq("as_of", asOf.as_of).neq("verdict", "skipped").range(f, f + 999);
    const c = data ?? []; rows.push(...c); if (c.length < 1000) break;
  }
  console.log(`\n=== §3 전수 실측 (as_of ${asOf.as_of} · 산출 발행사 ${rows.length}) ===`);

  let lastCall = 0;
  const throttle = async () => { const w = lastCall + 130 - Date.now(); if (w > 0) await new Promise((r) => setTimeout(r, w)); lastCall = Date.now(); };

  const out: any[] = [];
  let done = 0, sanityOk = 0, sanityFail = 0, fetchFail = 0;
  for (const row of rows) {
    await throttle();
    let startingSales: number | null = null;
    try {
      const r = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(row.cik).padStart(10, "0")}.json`, { headers: UA, signal: AbortSignal.timeout(20000) });
      if (r.ok) { const j = await r.json(); const dr = computeDrivers(j.facts?.["us-gaap"] ?? {}, j.facts?.["dei"] ?? {}); if (dr.ok) startingSales = dr.drivers.startingSales; }
    } catch { /* ignore */ }
    done++;
    if (startingSales == null) { fetchFail++; out.push({ symbol: row.symbol, verdict: row.verdict, err: "no_starting_sales" }); if (done % 50 === 0) console.log(`  ...${done}/${rows.length}`); continue; }

    const inflation = (row.flags?.inflationUsed as number) ?? 0.025;
    const base: RevDcfDrivers = { startingSales, salesGrowth: +row.sales_growth, operatingMargin: +row.operating_margin, startingMargin: +row.starting_margin, taxRate: +row.tax_rate, fixedCapitalRate: +row.fixed_capital_rate, workingCapitalRate: +row.working_capital_rate };
    const market: RevDcfMarket = { wacc: +row.wacc, inflation, sharePrice: +row.share_price, sharesOutstanding: +row.shares, debt: +row.debt, nonOperatingAssets: +row.non_operating_assets };

    // 정합성 검사: 우리 startingSales로 기간판정을 돌려 DB verdict/gap 재현되나
    const chk = runRevDcf(base, market, { maxYears: 100 });
    const chkGap = chk.verdict.kind === "years" ? chk.verdict.gap : null;
    const match = chk.verdict.kind === row.verdict && (row.verdict !== "years" || Math.abs((chkGap ?? -1) - (row.gap_years ?? -2)) <= 1);
    if (match) sanityOk++; else sanityFail++;

    const rec: any = { symbol: row.symbol, verdict: row.verdict, gap: row.gap_years, sanity: match };
    for (const N of Ns) { const s = solveG(base, market, N); rec["g" + N] = s.g; rec["st" + N] = s.status; rec["mono" + N] = s.mono; }
    // 밴드: WACC ±1%p에서 g(N=10)
    const gWacc = (dw: number) => solveG(base, { ...market, wacc: market.wacc + dw }, 10).g;
    rec.g10_wlo = gWacc(-0.01); rec.g10_whi = gWacc(0.01);
    out.push(rec);
    if (done % 50 === 0) console.log(`  ...${done}/${rows.length} (sanity ok ${sanityOk}/${sanityOk + sanityFail})`);
  }

  console.log(`\n산출 완료: ${out.length}행 · fetch 실패 ${fetchFail} · 정합성(기간판정 재현) ok ${sanityOk}/${sanityOk + sanityFail}`);
  writeFileSync("docs/probe_858_output.json", JSON.stringify({ asOf: asOf.as_of, n: out.length, rows: out }, null, 1));

  // ── 집계 ──
  const solved = out.filter((r) => !r.err);
  const q = (arr: number[], p: number) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) * p)] : NaN; };
  const fmtDist = (gs: number[]) => `n=${gs.length} min=${(Math.min(...gs) * 100).toFixed(1)} p10=${(q(gs, .1) * 100).toFixed(1)} p25=${(q(gs, .25) * 100).toFixed(1)} med=${(q(gs, .5) * 100).toFixed(1)} p75=${(q(gs, .75) * 100).toFixed(1)} p90=${(q(gs, .9) * 100).toFixed(1)} max=${(Math.max(...gs) * 100).toFixed(1)}`;
  for (const N of Ns) {
    const okRows = solved.filter((r) => r["st" + N] === "ok" || r["st" + N] === "multi_root");
    const gs = okRows.map((r) => r["g" + N] as number).filter((g) => Number.isFinite(g));
    const noRoot = solved.filter((r) => r["st" + N] === "no_root").length;
    const multi = solved.filter((r) => r["st" + N] === "multi_root").length;
    const inval = solved.filter((r) => r["st" + N] === "invalid").length;
    const neg = gs.filter((g) => g < 0).length, over30 = gs.filter((g) => g > 0.30).length, over100 = gs.filter((g) => g > 1.0).length;
    console.log(`\n[N=${N}] 해 있음 ${gs.length} · 해없음 ${noRoot} · 다근 ${multi} · 계산불가 ${inval}`);
    console.log(`  분포(%): ${fmtDist(gs)}`);
    console.log(`  🔴 비상식: 음수성장 ${neg} · 30%초과 ${over30} · 100%초과 ${over100}`);
  }
  // verdict별 교차 (N=10 기준)
  console.log("\n=== verdict별 교차표 (N=10) ===");
  for (const v of ["years", "value_destroying", "below_one", "over_cap"]) {
    const grp = solved.filter((r) => r.verdict === v);
    const ok = grp.filter((r) => r.st10 === "ok" || r.st10 === "multi_root");
    const gs = ok.map((r) => r.g10 as number).filter(Number.isFinite);
    const noRoot = grp.filter((r) => r.st10 === "no_root").length;
    console.log(`  ${v} (${grp.length}사): 해있음 ${ok.length}·해없음 ${noRoot}` + (gs.length ? ` · g10 중앙 ${(q(gs, .5) * 100).toFixed(1)}% [${(Math.min(...gs) * 100).toFixed(0)}~${(Math.max(...gs) * 100).toFixed(0)}]` : ""));
  }
  // 밴드 흔들림 (N=10)
  const band = solved.filter((r) => Number.isFinite(r.g10) && Number.isFinite(r.g10_wlo) && Number.isFinite(r.g10_whi)).map((r) => Math.abs((r.g10_whi as number) - (r.g10_wlo as number)));
  if (band.length) console.log(`\n밴드(WACC±1%p→g N=10) 폭 %p: 중앙 ${(q(band, .5) * 100).toFixed(1)} · p90 ${(q(band, .9) * 100).toFixed(1)} (n=${band.length})`);

  // §4 표본 10 (years·value_destroying·over_cap 섞어서)
  console.log("\n=== §4 외부 검증용 표본 10 (implied g @ N=5) ===");
  const picks = ["GOOGL", "AAPL", "MSFT", "DPZ", "APD", "NVDA", "COST", "WMT", "HD", "MCD"];
  for (const sym of picks) { const r = solved.find((x) => x.symbol === sym); if (r) console.log(`  ${sym}: verdict=${r.verdict} gap=${r.gap} · g5=${r.g5 != null ? (r.g5 * 100).toFixed(1) + "%" : "—"} g10=${r.g10 != null ? (r.g10 * 100).toFixed(1) + "%" : "—"} g25=${r.g25 != null ? (r.g25 * 100).toFixed(1) + "%" : "—"} (과거CAGR ${(+ (rows.find((z) => z.symbol === sym)?.sales_growth) * 100).toFixed(1)}%)`); }
  console.log(`\nFMP_API_KEY: ${process.env.FMP_API_KEY ? "보유" : "미보유"}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
