// STEP 835 §1 — KR 전환 전 영향 측정(프로덕션 무기록). A_KR(시총) vs B_KR(거래대금·현행)의 컷·판정·저변동 왜곡.
// 🔴 lens_scores/lens_cuts에 쓰지 않는다. 읽기 + computeSymbolLenses(야후 읽기)만. 결과는 콘솔로만.
// 실행: npx tsx scripts/probe_kr_universe_switch.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { computeSymbolLenses } from "../lib/lensCompute";

const LENSES = ["lowvol", "momentum", "valuation", "quality", "assetgrowth"] as const;
type LensKey = (typeof LENSES)[number];
const isPreferred = (s: string) => /^\d{6}$/.test(s) && !s.endsWith("0"); // 우선주 = 끝자리≠0
function pctile(s: number[], p: number): number { if (!s.length) return NaN; const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); }
function cuts(v: number[]) { const s = [...v].sort((a, b) => a - b); return { lo: pctile(s, 0.3), hi: pctile(s, 0.7), n: s.length }; }
function stateOf(v: number, c: { lo: number; hi: number }) { return v < c.lo ? "low" : v > c.hi ? "high" : "mid"; }
function spearman(xs: number[], ys: number[]): number {
  const rank = (a: number[]) => { const idx = a.map((v, i) => [v, i] as [number, number]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); idx.forEach(([, oi], ri) => r[oi] = ri + 1); return r; };
  const rx = rank(xs), ry = rank(ys), n = xs.length, mx = rx.reduce((a, b) => a + b, 0) / n, my = ry.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0; for (let i = 0; i < n; i++) { const a = rx[i] - mx, b = ry[i] - my; num += a * b; dx += a * a; dy += b * b; } return num / Math.sqrt(dx * dy);
}
const r3 = (n: number) => Math.round(n * 1000) / 1000;

(async () => {
  const sb = createAdminClient();
  // kr_stock_snapshot: symbol·market_cap·trade_amount (우선주 제외)
  const snap: { symbol: string; market_cap: number; trade_amount: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("kr_stock_snapshot").select("symbol,market_cap,trade_amount").range(from, from + 999);
    const rows = (data ?? []) as { symbol: string; market_cap: number | null; trade_amount: number | null }[];
    for (const r of rows) if (!isPreferred(r.symbol) && r.market_cap != null && r.trade_amount != null) snap.push({ symbol: r.symbol, market_cap: Number(r.market_cap), trade_amount: Number(r.trade_amount) });
    if (rows.length < 1000) break;
  }
  const capOf = new Map(snap.map((r) => [r.symbol, r.market_cap])), amtOf = new Map(snap.map((r) => [r.symbol, r.trade_amount]));
  const aKR = [...snap].sort((a, b) => b.market_cap - a.market_cap).slice(0, 1000).map((r) => r.symbol);
  const bKR = [...snap].sort((a, b) => b.trade_amount - a.trade_amount).slice(0, 1000).map((r) => r.symbol);
  const aSet = new Set(aKR), bSet = new Set(bKR);
  console.log(`A_KR(시총1000)=${aKR.length} · B_KR(거래대금1000·현행)=${bKR.length} · 교집합=${aKR.filter((s) => bSet.has(s)).length}`);
  console.log(`우선주 005935(삼성전자우) A_KR 편입? ${aSet.has("005935")} (false여야 정상)`);

  // lens_scores KR 값(현행 = B_KR 유니버스)
  const valOf = new Map<string, Record<LensKey, number | null>>();
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("lens_scores").select("symbol,lowvol_value,momentum_value,valuation_value,quality_value,assetgrowth_value").eq("market", "KR").range(from, from + 999);
    const rows = (data ?? []) as unknown as Record<string, number | null & string>[];
    for (const r of rows) valOf.set(r.symbol as unknown as string, { lowvol: r.lowvol_value, momentum: r.momentum_value, valuation: r.valuation_value, quality: r.quality_value, assetgrowth: r.assetgrowth_value });
    if (rows.length < 1000) break;
  }
  const need = [...new Set([...aKR, ...bKR])].filter((s) => !valOf.has(s));
  console.log(`값 계산 필요(A_KR∪B_KR 중 lens_scores 밖)=${need.length}`);
  let done = 0, i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < need.length) { const s = need[i++];
      try { const d = await computeSymbolLenses(s, "ko"); const m: Record<LensKey, number | null> = { lowvol: null, momentum: null, valuation: null, quality: null, assetgrowth: null }; for (const l of d.lenses) if ((LENSES as readonly string[]).includes(l.key)) m[l.key as LensKey] = l.value ?? null; valOf.set(s, m); }
      catch { /* skip */ } finally { if (++done % 50 === 0) console.log(`  ...계산 ${done}/${need.length}`); }
    }
  }));

  console.log(`\n## §1 KR 컷 A(시총) vs B(거래대금) + 판정 뒤집힘(교집합=순수 컷효과)`);
  for (const key of LENSES) {
    const av = aKR.map((s) => valOf.get(s)?.[key]).filter((v): v is number => v != null);
    const bv = bKR.map((s) => valOf.get(s)?.[key]).filter((v): v is number => v != null);
    const ac = cuts(av), bc = cuts(bv);
    const common = aKR.filter((s) => bSet.has(s) && valOf.get(s)?.[key] != null);
    let flip = 0; for (const s of common) { const v = valOf.get(s)![key]!; if (stateOf(v, ac) !== stateOf(v, bc)) flip++; }
    console.log(`  ${key.padEnd(11)} A ${r3(ac.lo)}/${r3(ac.hi)} (n${ac.n}) · B ${r3(bc.lo)}/${r3(bc.hi)} (n${bc.n}) · 교집합 뒤집힘 ${flip}/${common.length} (${(100 * flip / common.length).toFixed(1)}%)`);
  }
  console.log(`\n## §1 KR 저변동 분포 + 거래대금 상관`);
  for (const [label, uni] of [["A(시총)", aKR], ["B(거래대금)", bKR]] as const) {
    const lvs = uni.map((s) => valOf.get(s)?.lowvol).filter((v): v is number => v != null).sort((a, b) => a - b);
    const pairs = uni.map((s) => ({ amt: amtOf.get(s), lv: valOf.get(s)?.lowvol })).filter((p): p is { amt: number; lv: number } => p.amt != null && p.lv != null);
    console.log(`  ${label.padEnd(11)} lowvol p30 ${r3(pctile(lvs, 0.3))} 중앙 ${r3(pctile(lvs, 0.5))} p70 ${r3(pctile(lvs, 0.7))} max ${r3(lvs[lvs.length - 1])} · Spearman(거래대금,변동성)=${r3(spearman(pairs.map((p) => p.amt), pairs.map((p) => p.lv)))}`);
  }
  // 차집합 대표(시총·거래대금)
  const aOnly = aKR.filter((s) => !bSet.has(s)).slice(0, 10), bOnly = bKR.filter((s) => !aSet.has(s)).slice(0, 10);
  console.log(`\nA만(고시총·저거래) 10: ${aOnly.join(" ")}`);
  console.log(`B만(고거래·저시총) 10: ${bOnly.join(" ")}`);
  console.log(`(끝 · 프로덕션 무기록)`);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
