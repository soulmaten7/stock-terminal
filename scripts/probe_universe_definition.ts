// STEP 834 — 측정 전용(프로덕션 무기록). 시총(A) vs 거래대금(B) 유니버스의 컷·판정·상관 차이를 잰다.
// 🔴 lens_scores/lens_cuts/us_market_cap에 쓰지 않는다 — 읽기 + computeSymbolLenses(야후 읽기)만. 결과는 콘솔로만.
// 실행: npx tsx scripts/probe_universe_definition.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { computeSymbolLenses } from "../lib/lensCompute";

const LENSES = ["lowvol", "momentum", "valuation", "quality", "assetgrowth"] as const;
type LensKey = (typeof LENSES)[number];
const DIR: Record<LensKey, "high" | "low"> = { lowvol: "low", momentum: "high", valuation: "low", quality: "high", assetgrowth: "low" };

function pctile(sortedAsc: number[], p: number): number {
  if (!sortedAsc.length) return NaN;
  const idx = (sortedAsc.length - 1) * p, lo = Math.floor(idx), hi = Math.ceil(idx);
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}
function cuts(vals: number[]): { lo: number; hi: number; n: number } {
  const s = [...vals].sort((a, b) => a - b);
  return { lo: pctile(s, 0.3), hi: pctile(s, 0.7), n: s.length };
}
// state = mid/high/low by cut (방향 무관 원값 기준: value<lo→low · value>hi→high · else mid)
function stateOf(v: number, c: { lo: number; hi: number }): "low" | "mid" | "high" {
  if (v < c.lo) return "low";
  if (v > c.hi) return "high";
  return "mid";
}
// 스피어만 = 순위 피어슨
function spearman(xs: number[], ys: number[]): number {
  const rank = (arr: number[]): number[] => {
    const idx = arr.map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0]);
    const r = new Array(arr.length);
    for (let i = 0; i < idx.length; i++) r[idx[i][1]] = i + 1;
    return r;
  };
  const rx = rank(xs), ry = rank(ys), n = xs.length;
  const mx = rx.reduce((a, b) => a + b, 0) / n, my = ry.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { const a = rx[i] - mx, b = ry[i] - my; num += a * b; dx += a * a; dy += b * b; }
  return num / Math.sqrt(dx * dy);
}
const r3 = (n: number) => Math.round(n * 1000) / 1000;

(async () => {
  const sb = createAdminClient();

  // ── A 유니버스 = lens_scores US(833 정상화·시총 상위 1000) 값 ──
  type Row = { symbol: string } & Record<string, number | null>;
  const aRows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("lens_scores")
      .select("symbol,lowvol_value,momentum_value,valuation_value,quality_value,assetgrowth_value")
      .eq("market", "US").range(from, from + 999);
    const rows = (data ?? []) as unknown as Row[];
    aRows.push(...rows);
    if (rows.length < 1000) break;
  }
  const valOf = new Map<string, Record<LensKey, number | null>>();
  for (const r of aRows) valOf.set(r.symbol, { lowvol: r.lowvol_value, momentum: r.momentum_value, valuation: r.valuation_value, quality: r.quality_value, assetgrowth: r.assetgrowth_value });

  // 거래대금(amount) — us_stock_perf 전체
  const amtOf = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("us_stock_perf").select("symbol,amount").not("amount", "is", null).range(from, from + 999);
    const rows = (data ?? []) as { symbol: string; amount: number }[];
    for (const r of rows) amtOf.set(r.symbol, Number(r.amount));
    if (rows.length < 1000) break;
  }
  // 시총 — us_market_cap
  const capOf = new Map<string, number>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("us_market_cap").select("symbol,market_cap").range(from, from + 999);
    const rows = (data ?? []) as { symbol: string; market_cap: number }[];
    for (const r of rows) capOf.set(r.symbol, Number(r.market_cap));
    if (rows.length < 1000) break;
  }

  const aUniverse = [...capOf.entries()].sort((a, b) => b[1] - a[1]).slice(0, 1000).map(([s]) => s);
  const bUniverse = [...amtOf.entries()].sort((a, b) => b[1] - a[1]).slice(0, 1000).map(([s]) => s);
  const aSet = new Set(aUniverse), bSet = new Set(bUniverse);
  const bOnly = bUniverse.filter((s) => !valOf.has(s)); // 값 없는 B 종목만 계산
  console.log(`A(시총1000)=${aUniverse.length} · B(거래대금1000)=${bUniverse.length} · 교집합=${aUniverse.filter((s) => bSet.has(s)).length} · B에서 값계산 필요=${bOnly.length}`);

  // ── B-only 렌즈 값 계산(야후·읽기전용) ──
  let done = 0;
  async function computeMissing(sym: string) {
    try {
      const d = await computeSymbolLenses(sym, "ko");
      const m: Record<LensKey, number | null> = { lowvol: null, momentum: null, valuation: null, quality: null, assetgrowth: null };
      for (const l of d.lenses) if ((LENSES as readonly string[]).includes(l.key)) m[l.key as LensKey] = l.value ?? null;
      valOf.set(sym, m);
    } catch { /* skip */ } finally { if (++done % 50 === 0) console.log(`  ...B-only 계산 ${done}/${bOnly.length}`); }
  }
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (i < bOnly.length) { const c = i++; await computeMissing(bOnly[c]); } }));

  // ── 렌즈별 컷 A vs B + 판정 뒤집힘 ──
  console.log(`\n## §2 컷 A(시총) vs B(거래대금) + 판정 뒤집힘`);
  const aCuts: Record<string, { lo: number; hi: number }> = {}, bCuts: Record<string, { lo: number; hi: number }> = {};
  for (const key of LENSES) {
    const aVals = aUniverse.map((s) => valOf.get(s)?.[key]).filter((v): v is number => v != null);
    const bVals = bUniverse.map((s) => valOf.get(s)?.[key]).filter((v): v is number => v != null);
    const ac = cuts(aVals), bc = cuts(bVals);
    aCuts[key] = ac; bCuts[key] = bc;
    // 교집합 종목만: 같은 종목인데 컷만 달라 판정 바뀌는 수(모집단 효과 분리)
    const common = aUniverse.filter((s) => bSet.has(s) && valOf.get(s)?.[key] != null);
    let flip = 0;
    for (const s of common) { const v = valOf.get(s)![key]!; if (stateOf(v, ac) !== stateOf(v, bc)) flip++; }
    console.log(`  ${key.padEnd(11)} A p30/p70 ${r3(ac.lo)}/${r3(ac.hi)} (n${ac.n}) · B ${r3(bc.lo)}/${r3(bc.hi)} (n${bc.n}) · 교집합 판정뒤집힘 ${flip}/${common.length} (${(100 * flip / common.length).toFixed(1)}%)`);
  }

  // ── §3 거래대금 vs 실현변동성(lowvol) 상관 + 분포 ──
  console.log(`\n## §3 거래대금–변동성 (Cowork 가설 검증)`);
  for (const [label, uni] of [["A(시총)", aUniverse], ["B(거래대금)", bUniverse]] as const) {
    const pairs = uni.map((s) => ({ amt: amtOf.get(s), lv: valOf.get(s)?.lowvol })).filter((p): p is { amt: number; lv: number } => p.amt != null && p.lv != null);
    const rho = spearman(pairs.map((p) => p.amt), pairs.map((p) => p.lv));
    const lvs = pairs.map((p) => p.lv).sort((a, b) => a - b);
    console.log(`  ${label.padEnd(11)} n=${pairs.length} · Spearman(거래대금,변동성)=${r3(rho)} · lowvol 분포 p30 ${r3(pctile(lvs, 0.3))} · 중앙 ${r3(pctile(lvs, 0.5))} · p70 ${r3(pctile(lvs, 0.7))} · max ${r3(lvs[lvs.length - 1])}`);
  }
  // 모멘텀·밸류에도 상관(거래대금이 다른 렌즈 기준선도 미는지)
  console.log(`  — 거래대금 vs 다른 렌즈값 Spearman(B 유니버스):`);
  for (const key of ["momentum", "valuation"] as const) {
    const pairs = bUniverse.map((s) => ({ amt: amtOf.get(s), v: valOf.get(s)?.[key] })).filter((p): p is { amt: number; v: number } => p.amt != null && p.v != null);
    console.log(`     ${key} rho=${r3(spearman(pairs.map((p) => p.amt), pairs.map((p) => p.v)))} (n${pairs.length})`);
  }
  console.log(`\n(끝 · 프로덕션 무기록)`);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
