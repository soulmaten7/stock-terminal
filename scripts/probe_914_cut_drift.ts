// STEP 914 §3 — 사용자 영향 크기 실측: 오늘 lens_scores(US) 분포로 p30/p70 컷을 계산만 하고(DB에 안 씀),
// 저장된 lens_cuts(US, as_of=07-30·913이 규명한 6일 전 값)와 대조 + 재판정 시 몇 종목의 상태가 바뀌는지 센다.
// 측정 전용 · lib/** 수정 없음(import만 — pctile·stateFromCut을 production 코드와 동일하게 재구현, drivers.ts류처럼 export 안 돼 재선언) ·
// DB 쓰기 0 · 크론 실행 0. 실행: npx tsx scripts/probe_914_cut_drift.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { writeFileSync } from "fs";

// lib/lensPrecompute.ts:385-389 그대로(export 안 됨 — 재구현)
function pctile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const loI = Math.floor(idx), hiI = Math.ceil(idx);
  return sorted[loI] + (sorted[hiI] - sorted[loI]) * (idx - loI);
}

// lib/lensCuts.ts:14-27, 44-52 그대로(export되지만 이 스크립트는 독립 재구현으로 production import 최소화 — 852/876류 관행)
const CUT_LENSES = ["momentum", "lowvol", "valuation", "quality", "assetgrowth"] as const;
type LensKey = (typeof CUT_LENSES)[number];
const CUT_DIR: Record<LensKey, "high" | "low"> = {
  momentum: "high", quality: "high",
  lowvol: "low", valuation: "low", assetgrowth: "low",
};
// lib/lensCuts.ts:19-25 그대로(실제 저장 라벨 — good/mid/bad 같은 제네릭 문자열이 아니라 렌즈별 실 라벨)
const CUT_STATES: Record<LensKey, [string, string, string]> = {
  momentum: ["up", "flat", "down"],
  quality: ["high", "mid", "low"],
  lowvol: ["calm", "mid", "jumpy"],
  valuation: ["cheap", "mid", "rich"],
  assetgrowth: ["conservative", "mid", "aggressive"],
};
function stateFromCut(lensKey: LensKey, value: number | null, cut: { lo: number; hi: number } | undefined): string | null {
  if (value == null) return null;
  if (!cut) return "pending";
  const [good, mid, bad] = CUT_STATES[lensKey];
  if (CUT_DIR[lensKey] === "high") return value > cut.hi ? good : value < cut.lo ? bad : mid;
  return value < cut.lo ? good : value > cut.hi ? bad : mid;
}

async function main() {
  const sb = createAdminClient();

  // [1] 저장된 lens_cuts(US) — 913이 규명한 진짜 신선도(as_of)와 함께
  const { data: storedCuts } = await sb.from("lens_cuts").select("lens_key,lo,hi,n,as_of").eq("market", "US");
  const storedByKey = new Map((storedCuts ?? []).map((r) => [r.lens_key as string, r as { lens_key: string; lo: number; hi: number; n: number; as_of: string }]));
  console.error(`[1] 저장된 lens_cuts(US) as_of = ${storedCuts?.[0]?.as_of} (913 확정: 07-30, 6일 전)`);

  // [2] lens_scores(US) 전 종목 — value 5개 + state 5개(현재 화면에 나가는 값)
  type Row = {
    symbol: string;
    momentum_value: number | null; momentum_state: string | null;
    lowvol_value: number | null; lowvol_state: string | null;
    valuation_value: number | null; valuation_state: string | null;
    quality_value: number | null; quality_state: string | null;
    assetgrowth_value: number | null; assetgrowth_state: string | null;
  };
  const rows: Row[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores")
      .select("symbol,momentum_value,momentum_state,lowvol_value,lowvol_state,valuation_value,valuation_state,quality_value,quality_state,assetgrowth_value,assetgrowth_state")
      .eq("market", "US").range(f, f + 999);
    const c = (data ?? []) as Row[]; rows.push(...c); if (c.length < 1000) break;
  }
  console.error(`[2] lens_scores(US) n=${rows.length}`);

  const valueKey: Record<LensKey, keyof Row> = {
    momentum: "momentum_value", lowvol: "lowvol_value", valuation: "valuation_value",
    quality: "quality_value", assetgrowth: "assetgrowth_value",
  };
  const stateKey: Record<LensKey, keyof Row> = {
    momentum: "momentum_state", lowvol: "lowvol_state", valuation: "valuation_state",
    quality: "quality_state", assetgrowth: "assetgrowth_state",
  };

  const result: Record<string, unknown> = {};
  let totalChanged = 0;
  const changedBySymbol: Record<string, string[]> = {};

  for (const lensKey of CUT_LENSES) {
    const vals = rows.map((r) => r[valueKey[lensKey]] as number | null).filter((v): v is number => v != null);
    const sorted = [...vals].sort((a, b) => a - b);
    const todayLo = sorted.length >= 30 ? pctile(sorted, 0.3) : null;
    const todayHi = sorted.length >= 30 ? pctile(sorted, 0.7) : null;
    const stored = storedByKey.get(lensKey);

    let changed = 0, sanityMismatch = 0, sanityChecked = 0;
    const migration: Record<string, number> = {};
    if (todayLo != null && todayHi != null && stored) {
      const todayCut = { lo: todayLo, hi: todayHi };
      const storedCut = { lo: stored.lo, hi: stored.hi };
      for (const r of rows) {
        const v = r[valueKey[lensKey]] as number | null;
        if (v == null) continue;
        const oldState = r[stateKey[lensKey]] as string | null; // 현재 화면에 나가는 값(저장된 07-30 컷 기준)
        const newState = stateFromCut(lensKey, v, todayCut); // 오늘 컷 기준 재판정(계산만, 저장 안 함)
        const recomputedOldState = stateFromCut(lensKey, v, storedCut); // 대조: 저장된 state와 저장된 컷으로 직접 재계산한 값이 일치하는지(sanity check)
        sanityChecked++;
        if (recomputedOldState !== oldState) { sanityMismatch++; continue; } // state 정합 안 되는 행은 다른 원인(스킵) — 드리프트 카운트에서 제외, 별도 집계
        if (newState !== oldState) {
          changed++;
          const key = `${oldState}→${newState}`;
          migration[key] = (migration[key] || 0) + 1;
          (changedBySymbol[r.symbol] ??= []).push(lensKey);
        }
      }
    }
    if (sanityMismatch > 0) console.error(`  ⚠ ${lensKey}: sanity 불일치 ${sanityMismatch}/${sanityChecked}건(저장된 state가 저장된 cut으로 재계산 안 됨 — 드리프트 카운트서 제외)`);

    result[lensKey] = {
      n: sorted.length,
      stored: stored ? { lo: stored.lo, hi: stored.hi, n: stored.n, as_of: stored.as_of } : null,
      today: todayLo != null ? { lo: todayLo, hi: todayHi } : null,
      drift: stored && todayLo != null && todayHi != null ? { loDelta: todayLo - stored.lo, hiDelta: todayHi - stored.hi, loDeltaPct: stored.lo !== 0 ? ((todayLo - stored.lo) / Math.abs(stored.lo)) * 100 : null, hiDeltaPct: stored.hi !== 0 ? ((todayHi - stored.hi) / Math.abs(stored.hi)) * 100 : null } : null,
      verdictChanged: changed,
      verdictChangedPctOfComputable: sorted.length ? +((changed / sorted.length) * 100).toFixed(2) : null,
      sanityMismatch, sanityChecked,
      migration,
    };
    totalChanged += changed;
    console.error(`[3] ${lensKey}: 저장(07-30) lo=${stored?.lo.toFixed(4)} hi=${stored?.hi.toFixed(4)} · 오늘 lo=${todayLo?.toFixed(4)} hi=${todayHi?.toFixed(4)} · 판정변경 ${changed}건`);
  }

  const uniqueSymbolsChanged = Object.keys(changedBySymbol).length;

  const output = {
    asOfCompared: { stored: storedCuts?.[0]?.as_of, today: new Date().toISOString().slice(0, 10) },
    n_lens_scores_US: rows.length,
    perLens: result,
    summary: {
      totalVerdictChangesAcrossLenses: totalChanged,
      uniqueSymbolsWithAtLeastOneChange: uniqueSymbolsChanged,
      uniqueSymbolsPctOfUniverse: +((uniqueSymbolsChanged / rows.length) * 100).toFixed(2),
    },
    note: "재료만 — 판정·수리 없음. lens_cuts DB에 쓰지 않음(계산만). '오늘 컷'은 지금 이 순간의 lens_scores 스냅샷 기준(크론이 값 자체는 매일 갱신 중이므로 이 값이 곧 실제 최신 분포).",
  };
  writeFileSync("docs/probe_914_cut_drift.json", JSON.stringify(output, null, 2));

  console.error(`\n=== 요약 ===`);
  console.error(`전체 판정 변경(렌즈 합산) ${totalChanged}건 · 최소 1개 렌즈가 바뀐 종목 ${uniqueSymbolsChanged}/${rows.length}(${output.summary.uniqueSymbolsPctOfUniverse}%)`);

  const rr = (await sb.from("revdcf_results").select("as_of")).data as { as_of: string }[];
  const counts: Record<string, number> = {}; for (const x of rr) counts[x.as_of] = (counts[x.as_of] || 0) + 1;
  console.error(`\n무변경 확인: revdcf_results ${JSON.stringify(counts)}`);
  const mc = (await sb.from("us_market_cap").select("symbol", { count: "exact", head: true })).count;
  console.error(`us_market_cap count=${mc}(5,888 기준)`);
  const lc = (await sb.from("lens_cuts").select("market", { count: "exact", head: true })).count;
  console.error(`lens_cuts count=${lc}(10 기준, 무변경 확인 — 이 스크립트가 쓰지 않았음)`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
