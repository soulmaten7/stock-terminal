/**
 * STEP 860 — DoD 항목 3(값 검증): 원전 관찰 3개를 우리 데이터로 재현. 🔴 읽기 전용(SELECT만)·계산은 메모리.
 * §1 시장 함의 예측기간 5~15년 · §2 업종 내 클러스터링 · §3 잔여가치 비중(scale-invariant).
 * 실행: npx tsx --env-file=.env.local scripts/probe_860_validate.ts
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { runRevDcf, type RevDcfDrivers, type RevDcfMarket } from "@/lib/revdcf/engine";

const AS_OF = "2026-08-02";
const q = (arr: number[], p: number) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.max(0, Math.floor((s.length - 1) * p))] : NaN; };
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

// 잔여가치 비중(연차 N) — startingSales 상쇄(비율). drivers+wacc+inflation만 필요.
function residualShareAt(row: any, N: number): number | null {
  const d: RevDcfDrivers = { startingSales: 1, salesGrowth: +row.sales_growth, operatingMargin: +row.operating_margin, startingMargin: +row.starting_margin, taxRate: +row.tax_rate, fixedCapitalRate: +row.fixed_capital_rate, workingCapitalRate: +row.working_capital_rate };
  const m: RevDcfMarket = { wacc: +row.wacc, inflation: (row.flags?.inflationUsed as number) ?? 0.025, sharePrice: 1, sharesOutstanding: 1, debt: 0, nonOperatingAssets: 0 };
  const r = runRevDcf(d, m, { maxYears: 25 });
  const y = r.years[N];
  if (!y || !Number.isFinite(y.corporateValue) || y.corporateValue === 0) return null;
  return y.pvResidual / y.corporateValue;
}

async function main() {
  const sb = createAdminClient();
  const rows: any[] = [];
  for (let f = 0; ; f += 1000) { const { data } = await sb.from("revdcf_results").select("*").eq("as_of", AS_OF).range(f, f + 999); const c = data ?? []; rows.push(...c); if (c.length < 1000) break; }
  const years = rows.filter((r) => r.verdict === "years" && r.gap_years != null);
  console.log(`=== as_of ${AS_OF} · 전체 ${rows.length} · years ${years.length} ===`);

  // ── §1 예측기간 5~15년 ──
  const gaps = years.map((r) => r.gap_years as number);
  console.log("\n=== §1 GAP 분포 (years) ===");
  console.log(`  n=${gaps.length} min=${Math.min(...gaps)} p10=${q(gaps, .1)} p25=${q(gaps, .25)} 중앙=${q(gaps, .5)} p75=${q(gaps, .75)} p90=${q(gaps, .9)} max=${Math.max(...gaps)}`);
  const in515 = gaps.filter((g) => g >= 5 && g <= 15).length;
  const below5 = gaps.filter((g) => g < 5).length, above15 = gaps.filter((g) => g > 15).length;
  console.log(`  🔴 5~15년: ${in515}/${gaps.length} = ${(in515 / gaps.length * 100).toFixed(1)}% · <5: ${below5} · >15: ${above15}`);
  // 벗어난 종목 성격
  const outLo = years.filter((r) => r.gap_years < 5), outHi = years.filter((r) => r.gap_years > 15);
  const charOf = (grp: any[]) => grp.length ? `wacc중앙 ${(q(grp.map((r) => +r.wacc), .5) * 100).toFixed(1)}% · 마진중앙 ${(q(grp.map((r) => +r.operating_margin), .5) * 100).toFixed(1)}%` : "—";
  console.log(`  <5 성격(${outLo.length}): ${charOf(outLo)} · 업종상위 ${topInd(outLo)}`);
  console.log(`  >15 성격(${outHi.length}): ${charOf(outHi)} · 업종상위 ${topInd(outHi)}`);

  // ── §2 업종 클러스터링 ──
  console.log("\n=== §2 업종 클러스터링 (일원 ANOVA · ICC) ===");
  const byInd = new Map<string, number[]>();
  for (const r of years) { const ind = (r.flags?.industry as string) || "(미상)"; if (!byInd.has(ind)) byInd.set(ind, []); byInd.get(ind)!.push(r.gap_years); }
  const groups = [...byInd.entries()].filter(([, g]) => g.length >= 5); // 5사 미만 제외
  const excluded = [...byInd.entries()].filter(([, g]) => g.length < 5);
  const usedN = groups.reduce((s, [, g]) => s + g.length, 0);
  console.log(`  업종 ${byInd.size}개 중 5사+ ${groups.length}개(종목 ${usedN}) · 5사미만 ${excluded.length}개(종목 ${excluded.reduce((s, [, g]) => s + g.length, 0)}) 제외`);
  const allVals = groups.flatMap(([, g]) => g);
  const grand = mean(allVals);
  let ssb = 0, ssw = 0;
  for (const [, g] of groups) { const m = mean(g); ssb += g.length * (m - grand) ** 2; for (const v of g) ssw += (v - m) ** 2; }
  const k = groups.length, Ntot = allVals.length;
  const msb = ssb / (k - 1), msw = ssw / (Ntot - k);
  const F = msb / msw;
  const sst = ssb + ssw;
  const etaSq = ssb / sst; // 업종이 설명하는 분산 비율
  const n0 = (Ntot - groups.reduce((s, [, g]) => s + g.length ** 2, 0) / Ntot) / (k - 1);
  const icc = (msb - msw) / (msb + (n0 - 1) * msw);
  console.log(`  전체분산 SST=${sst.toFixed(0)} · 업종간 SSB=${ssb.toFixed(0)} · 업종내 SSW=${ssw.toFixed(0)}`);
  console.log(`  🔴 F(${k - 1},${Ntot - k})=${F.toFixed(2)} · η²(업종설명분산)=${(etaSq * 100).toFixed(1)}% · ICC=${icc.toFixed(3)}`);
  console.log(`  해석: ICC>0.1이면 클러스터링 有. 업종내 분산이 작을수록 F↑·η²↑.`);
  // 업종별 중앙 상하위 10
  const indMed = groups.map(([ind, g]) => ({ ind, n: g.length, med: q(g, .5), lo: Math.min(...g), hi: Math.max(...g) })).sort((a, b) => b.med - a.med);
  console.log("\n  업종별 GAP 중앙 상위 10:");
  for (const x of indMed.slice(0, 10)) console.log(`    ${x.med}년  ${x.ind} (n=${x.n}, ${x.lo}~${x.hi})`);
  console.log("  업종별 GAP 중앙 하위 10:");
  for (const x of indMed.slice(-10)) console.log(`    ${x.med}년  ${x.ind} (n=${x.n}, ${x.lo}~${x.hi})`);

  // ── §3 잔여가치 비중 ──
  console.log("\n=== §3 잔여가치 비중 (각 years 종목의 gap 연차) ===");
  const shares = years.map((r) => residualShareAt(r, r.gap_years)).filter((x): x is number => x != null && Number.isFinite(x));
  console.log(`  n=${shares.length} min=${(Math.min(...shares) * 100).toFixed(1)} p10=${(q(shares, .1) * 100).toFixed(1)} 중앙=${(q(shares, .5) * 100).toFixed(1)} p75=${(q(shares, .75) * 100).toFixed(1)} p90=${(q(shares, .9) * 100).toFixed(1)} max=${(Math.max(...shares) * 100).toFixed(1)}`);
  console.log(`  🔴 90% 초과: ${shares.filter((s) => s > 0.9).length} · 85% 초과: ${shares.filter((s) => s > 0.85).length}`);
  // gap별 잔여비중 (상호작용 확인)
  for (const N of [5, 8, 15, 25]) { const g = years.filter((r) => r.gap_years === N); const sh = g.map((r) => residualShareAt(r, N)).filter((x): x is number => x != null); if (sh.length) console.log(`  gap=${N}년(${sh.length}사): 잔여비중 중앙 ${(q(sh, .5) * 100).toFixed(1)}%`); }
  // 도미노 검산 (T8 · N=8 → 80.1% 기대)
  const domRow = { sales_growth: 0.07, operating_margin: 0.175, starting_margin: 0.1739, tax_rate: 0.165, fixed_capital_rate: 0.15, working_capital_rate: 0.10, wacc: 0.05357, flags: { inflationUsed: 0.016 } };
  console.log("\n  도미노 검산 (T8 · 잔여비중):");
  for (const N of [5, 8, 25]) console.log(`    N=${N}: ${(residualShareAt(domRow, N)! * 100).toFixed(1)}% (원전 ${N === 5 ? "86.3" : N === 8 ? "80.1" : "59.3"}%)`);
}

function topInd(grp: any[]): string {
  const c = new Map<string, number>();
  for (const r of grp) { const ind = (r.flags?.industry as string) || "(미상)"; c.set(ind, (c.get(ind) ?? 0) + 1); }
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([i, n]) => `${i}(${n})`).join(", ");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
