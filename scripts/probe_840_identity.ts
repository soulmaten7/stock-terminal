// STEP 840 — 매출 태그를 회계 항등식으로 선택 + 이자 절벽 목적지 규명 + EBIT 폴백 오차 (실측 전용·프로덕션 무변경).
// 실행: npx tsx scripts/probe_840_identity.ts
// 핵심(§1): 순서가 아니라 "영업이익과 같은 손익계산서에서 온 매출"을 항등식으로 고른다.
//   id1: 매출 − 매출원가 = GrossProfit / id2: 매출 − 총비용(CostsAndExpenses) = OperatingIncomeLoss.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { readFileSync, writeFileSync } from "fs";

const UA = { "User-Agent": "Trillion Research admin@onetrillion.app" };
const YEARS = [2025, 2024, 2023, 2022]; // 최근 우선(항등식은 회사당 최신 유효연도 1개)
let bytesTotal = 0, callsTotal = 0, lastCall = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function throttle() { const w = lastCall + 300 - Date.now(); if (w > 0) await sleep(w); lastCall = Date.now(); }
async function secGet(url: string): Promise<{ json: unknown } | null> {
  for (let a = 0; a < 7; a++) { await throttle();
    try { const res = await fetch(url, { headers: UA });
      if (res.status === 429 || res.status === 503) { await sleep(Math.min(2 ** a * 1000, 30000)); continue; }
      if (!res.ok) return null;
      const t = await res.text(); bytesTotal += Buffer.byteLength(t); callsTotal++; return { json: JSON.parse(t) };
    } catch { await sleep(Math.min(2 ** a * 500, 15000)); } }
  return null;
}
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, async () => { while (i < arr.length) { const c = i++; out[c] = await fn(arr[c]); } }));
  return out;
}
async function frames(tag: string, frame: string, unit = "USD"): Promise<Map<number, number>> {
  const r = await secGet(`https://data.sec.gov/api/xbrl/frames/us-gaap/${tag}/${unit}/${frame}.json`);
  const m = new Map<number, number>();
  if (!r) return m;
  const j = r.json as { data?: Array<{ cik: number; val: number }> };
  for (const d of j.data ?? []) if (typeof d.cik === "number") m.set(d.cik, d.val);
  return m;
}
const dur = (y: number) => `CY${y}`, inst = (y: number) => `CY${y}Q4I`;

const REV = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet"];
const COST = ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold", "CostOfServices", "CostOfSales", "CostOfOperatingRevenues", "CostOfRevenues"];
type Sub = { symbol: string; cik: number; sic: string | null };

async function main() {
  const out: Record<string, unknown> = { probedAt: new Date().toISOString() };
  const survivors = JSON.parse(readFileSync("docs/probe_survivors.json", "utf8")) as Sub[];
  const survCik = new Set(survivors.map((s) => s.cik));
  const symBy = new Map(survivors.map((s) => [s.cik, s.symbol]));
  out.survivorsN = survivors.length;

  // ── 필요한 태그×연도 frames 수집 (∩ 생존자는 조회 후 필터) ────────────────────
  console.error("[frames] 항등식 태그 수집…");
  type YMap = Record<number, Map<number, number>>;
  const F: Record<string, YMap> = {};
  async function collect(tag: string, kind: "dur" | "inst" = "dur") { const ym: YMap = {}; for (const y of YEARS) ym[y] = await frames(tag, kind === "dur" ? dur(y) : inst(y)); F[tag] = ym; }
  for (const t of [...REV, ...COST, "GrossProfit", "CostsAndExpenses", "OperatingIncomeLoss"]) await collect(t, "dur");
  // §3 재구성용
  const PRETAX = ["IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", "IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments"];
  for (const t of [...PRETAX, "InterestExpense"]) await collect(t, "dur");
  console.error("[frames] 완료");

  const get = (tag: string, y: number, cik: number): number | null => { const v = F[tag]?.[y]?.get(cik); return v == null ? null : v; };
  const coalesce = (tags: string[], y: number, cik: number): number | null => { for (const t of tags) { const v = get(t, y, cik); if (v != null) return v; } return null; };
  const REL = 0.01; // 항등식 허용오차 1%(부동소수·반올림·단위 여유)

  // ── §1 항등식 기반 매출 태그 선택 ──────────────────────────────────────────
  let byId1 = 0, byId2 = 0, unverified = 0, ambiguous = 0;
  let errVsPriority = 0, resolvedTotal = 0;
  const basis = { gross: 0, net: 0, single: 0, na: 0 };
  const errSamples: string[] = [];
  const perTagChosen: Record<string, number> = {};
  let d1d2Joint = 0;
  for (const s of survivors) {
    const cik = s.cik;
    let chosen: string | null = null, check: 1 | 2 | 0 = 0, usedYear = 0;
    for (const y of YEARS) {
      const revVals: [string, number][] = REV.map((t) => [t, get(t, y, cik)] as [string, number | null]).filter((x): x is [string, number] => x[1] != null);
      if (revVals.length === 0) continue;
      const gp = get("GrossProfit", y, cik), cost = coalesce(COST, y, cik);
      const cae = get("CostsAndExpenses", y, cik), opinc = get("OperatingIncomeLoss", y, cik);
      const id1 = (gp != null && cost != null) ? revVals.filter(([, rv]) => Math.abs(rv - cost - gp) <= REL * Math.abs(rv)) : [];
      const id2 = (cae != null && opinc != null) ? revVals.filter(([, rv]) => Math.abs(rv - cae - opinc) <= REL * Math.abs(rv)) : [];
      if (id1.length === 1) { chosen = id1[0][0]; check = 1; usedYear = y; }
      else if (id2.length === 1) { chosen = id2[0][0]; check = 2; usedYear = y; }
      else if (id1.length > 1 || id2.length > 1) { ambiguous++; usedYear = y; }
      if (chosen) break;
    }
    // 우선순위 폴백(839 규칙) — 비교 대상
    let priorityPick: string | null = null; let py = 0;
    for (const y of YEARS) { for (const t of REV) if (get(t, y, cik) != null) { priorityPick = t; py = y; break; } if (priorityPick) break; }
    if (chosen) {
      resolvedTotal++;
      if (check === 1) byId1++; else byId2++;
      perTagChosen[chosen] = (perTagChosen[chosen] ?? 0) + 1;
      if (priorityPick && chosen !== priorityPick) { errVsPriority++; if (errSamples.length < 20) { const yv = usedYear; errSamples.push(`${s.symbol}: identity→${chosen}(${get(chosen, yv, cik)}) vs priority→${priorityPick}(${get(priorityPick, yv, cik)}) [id${check}·CY${yv}]`); } }
      // gross/net: Excluding·Revenues 둘 다 있고 다르면
      const yv = usedYear, ex = get("RevenueFromContractWithCustomerExcludingAssessedTax", yv, cik), rv = get("Revenues", yv, cik);
      if (ex != null && rv != null && Math.abs(ex - rv) / Math.max(Math.abs(ex), 1) > REL) { const chosenVal = get(chosen, yv, cik)!; if (chosenVal <= Math.min(ex, rv) * (1 + REL)) basis.net++; else basis.gross++; }
      else basis.single++;
      if (get("OperatingIncomeLoss", yv, cik) != null) d1d2Joint++;
    } else { unverified++; if (priorityPick) basis.na++; }
  }
  out.identity = {
    survivors: survivors.length,
    resolvedByIdentity1: byId1, resolvedByIdentity2: byId2, resolvedTotal, unverified, ambiguousYearSkipped: ambiguous,
    errorVs839Priority: errVsPriority, errorRateOfResolved: resolvedTotal ? +(errVsPriority / resolvedTotal).toFixed(3) : null,
    grossNetDist: basis, chosenTagDist: perTagChosen, driver1and2Joint: d1d2Joint,
    errorSamples: errSamples,
  };
  console.error(`[§1] id1=${byId1} id2=${byId2} 미검증=${unverified} · 839우선순위와 다른=${errVsPriority}(${resolvedTotal?(errVsPriority/resolvedTotal*100).toFixed(1):"?"}%) · gross ${basis.gross}/net ${basis.net}`);

  // ── §2 InterestExpense 목적지 규명 ─────────────────────────────────────────
  console.error("[§2] 이자 절벽…");
  const int2023 = new Set([...(F["InterestExpense"][2023]?.keys() ?? [])].filter((c) => survCik.has(c)));
  const int2024 = new Set([...(F["InterestExpense"][2024]?.keys() ?? [])].filter((c) => survCik.has(c)));
  const missing = [...int2023].filter((c) => !int2024.has(c)); // 2023 있고 2024 없음
  // 표본 40 companyfacts → Interest* 태그 CY2024 빈도
  const sample = missing.slice(0, 40);
  const intTagFreq: Record<string, number> = {};
  const debtStillPresent = { yes: 0, no: 0 };
  await mapLimit(sample, 5, async (cik) => {
    const pad = String(cik).padStart(10, "0");
    const r = await secGet(`https://data.sec.gov/api/xbrl/companyfacts/CIK${pad}.json`);
    const j = (r?.json ?? {}) as { facts?: { "us-gaap"?: Record<string, { units?: Record<string, Array<{ fy?: number; frame?: string; val: number }>> }> } };
    const ns = j.facts?.["us-gaap"] ?? {};
    for (const tag in ns) { if (!/Interest/i.test(tag)) continue; const arr = ns[tag].units?.USD ?? []; if (arr.some((e) => e.frame === "CY2024" || (e.fy ?? 0) >= 2024)) intTagFreq[tag] = (intTagFreq[tag] ?? 0) + 1; }
    if (ns["LongTermDebt"] || ns["LongTermDebtNoncurrent"]) debtStillPresent.yes++; else debtStillPresent.no++;
  });
  const topInt = Object.entries(intTagFreq).sort((a, b) => b[1] - a[1]).slice(0, 12);
  // 상위 후보 2개를 전체 missing에 frames로 검증(CY2024) + 연속성
  const candidates = topInt.filter(([t]) => t !== "InterestExpense").slice(0, 3).map(([t]) => t);
  const recovery: Record<string, { recovered: number; continuitySample: string[] }> = {};
  for (const cand of candidates) {
    const f2024 = await frames(cand, dur(2024));
    let rec = 0; const cont: string[] = [];
    for (const cik of missing) { const v = f2024.get(cik); if (v != null) { rec++; const prev = F["InterestExpense"][2023]?.get(cik); if (prev != null && cont.length < 8) cont.push(`${symBy.get(cik)}: IE2023=${prev} → ${cand}2024=${v}`); } }
    recovery[cand] = { recovered: rec, continuitySample: cont };
  }
  out.interestCliff = {
    survWithIE2023: int2023.size, survWithIE2024: int2024.size, missing2024: missing.length,
    sampleCompanyfacts: sample.length, interestTagFreqCY2024: topInt, debtStillPresentInSample: debtStillPresent,
    candidateRecoveryFullMissing: recovery,
    note: "missing = CY2023 InterestExpense 보고했으나 CY2024 미보고 생존자. debtStillPresent=아직 부채 있으면 '소멸' 아니라 '태그이동/미제출' 시사",
  };
  console.error(`[§2] missing ${missing.length} · 상위이자태그 ${topInt.slice(0, 3).map(([t, n]) => `${t}:${n}`).join(" ")}`);

  // ── §3 OperatingIncomeLoss 폴백: Pretax + Interest 재구성 오차 ──────────────
  console.error("[§3] EBIT 재구성 오차…");
  // EBIT ≈ Pretax + InterestExpense (비영업손익 무시 근사). 둘 다 + 실제 OpInc 있는 종목에서 오차.
  const errs: number[] = [];
  let reconAvail = 0, opincAvail = 0, gpAvail = 0;
  for (const s of survivors) { const cik = s.cik;
    let done = false;
    for (const y of [2024, 2023]) { if (done) break;
      const opinc = get("OperatingIncomeLoss", y, cik);
      const pretax = coalesce(PRETAX, y, cik), ie = get("InterestExpense", y, cik);
      const gp = get("GrossProfit", y, cik);
      if (y === 2024) { if (opinc != null) opincAvail++; if (pretax != null && ie != null) reconAvail++; if (gp != null) gpAvail++; }
      if (opinc != null && pretax != null && ie != null && Math.abs(opinc) > 1e6) { errs.push((pretax + ie - opinc) / Math.abs(opinc)); done = true; }
    }
  }
  errs.sort((a, b) => a - b);
  const q = (p: number) => errs.length ? +errs[Math.floor((errs.length - 1) * p)].toFixed(3) : null;
  out.ebitFallback = {
    note: "GrossProfit는 판관비 차감 전 = 영업이익 아님(그대로 쓰면 마진 과대). 폴백 = Pretax+InterestExpense 재구성(EBIT 근사).",
    opincCoverageCY2024: opincAvail, grossProfitCoverageCY2024: gpAvail, reconAvailCY2024: reconAvail,
    reconVsActualOpinc: { n: errs.length, p10: q(0.1), median: q(0.5), p90: q(0.9), within5pct: errs.length ? +(errs.filter((e) => Math.abs(e) < 0.05).length / errs.length).toFixed(3) : null, within10pct: errs.length ? +(errs.filter((e) => Math.abs(e) < 0.10).length / errs.length).toFixed(3) : null },
  };
  console.error(`[§3] 재구성 오차 median ${q(0.5)} · within10% ${out.ebitFallback && (out.ebitFallback as any).reconVsActualOpinc.within10pct}`);

  writeFileSync("docs/probe_840_output.json", JSON.stringify(out, null, 2));
  console.error(`[DONE] SEC ${callsTotal}콜 · ${(bytesTotal / 1e6).toFixed(1)}MB`);
  console.log(JSON.stringify(out, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
