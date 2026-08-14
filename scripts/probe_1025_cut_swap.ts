// STEP 1025 W4 — 컷 교체(07-30 → 오늘) 시 렌즈 판정이 얼마나 바뀌는지 가상 계산.
// 🔴 읽기 전용. lens_cuts·lens_scores에 쓰지 않는다. 계산 결과는 문서에만.
// 🔴 "오늘 데이터"는 topByMarketCap()을 다시 부르지 않는다 — 그건 us_market_cap을 실제로 갱신해 값 불변 증명을 깬다.
//   대신 lens_scores.*_value(매일 밤 pass1이 cutGateOk와 무관하게 갱신하는 원시값, 967-833 확인)를 읽기만 한다.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";
import { stateFromCut, CUT_LENSES } from "../lib/lensCuts";

// lensPrecompute.ts의 pctile과 동일 공식(선형보간) — 프로덕션과 같은 방식으로 재계산해야 비교가 유효하다.
function pctile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const loI = Math.floor(idx), hiI = Math.ceil(idx);
  return sorted[loI] + (sorted[hiI] - sorted[loI]) * (idx - loI);
}

async function main() {
  const sb = createAdminClient();

  const { data: cutRows } = await sb.from("lens_cuts").select("lens_key, lo, hi, n, as_of").eq("market", "US");
  const oldCuts = new Map(((cutRows ?? []) as { lens_key: string; lo: number; hi: number; n: number; as_of: string }[]).map((r) => [r.lens_key, { lo: r.lo, hi: r.hi }]));
  console.log("현재(07-30) 컷:", JSON.stringify([...oldCuts.entries()]));

  const rows: { symbol: string; momentum_value: number | null; momentum_state: string | null; lowvol_value: number | null; lowvol_state: string | null; valuation_value: number | null; valuation_state: string | null; quality_value: number | null; quality_state: string | null; assetgrowth_value: number | null; assetgrowth_state: string | null }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await sb.from("lens_scores").select("symbol, momentum_value, momentum_state, lowvol_value, lowvol_state, valuation_value, valuation_state, quality_value, quality_state, assetgrowth_value, assetgrowth_state").eq("market", "US").range(f, f + 999);
    const c = (data ?? []) as typeof rows;
    rows.push(...c);
    if (c.length < 1000) break;
  }
  console.log("lens_scores US 행수:", rows.length);

  type AxisKey = typeof CUT_LENSES[number];
  const valueField: Record<AxisKey, keyof typeof rows[number]> = {
    momentum: "momentum_value", lowvol: "lowvol_value", valuation: "valuation_value", quality: "quality_value", assetgrowth: "assetgrowth_value",
  };
  const stateField: Record<AxisKey, keyof typeof rows[number]> = {
    momentum: "momentum_state", lowvol: "lowvol_state", valuation: "valuation_state", quality: "quality_state", assetgrowth: "assetgrowth_state",
  };

  const summary: Record<string, unknown> = {};
  for (const axis of CUT_LENSES) {
    const vf = valueField[axis], sf = stateField[axis];
    const vals = rows.map((r) => r[vf] as number | null).filter((v): v is number => v != null);
    if (vals.length < 30) { summary[axis] = { skip: "표본 30 미만" }; continue; }
    const sorted = [...vals].sort((a, b) => a - b);
    const newCut = { lo: pctile(sorted, 0.3), hi: pctile(sorted, 0.7) };
    const old = oldCuts.get(axis);

    let flipped = 0, sameState = 0, naCount = 0;
    const flipSamples: { symbol: string; oldState: string | null; newState: string | null; value: number }[] = [];
    for (const r of rows) {
      const v = r[vf] as number | null;
      if (v == null) { naCount += 1; continue; }
      const oldState = r[sf] as string | null; // 현재 저장된 상태 = 07-30 컷으로 이미 매핑된 값(매일 밤 pass2가 갱신)
      const newState = stateFromCut(axis, v, newCut);
      if (oldState !== newState) {
        flipped += 1;
        if (flipSamples.length < 10) flipSamples.push({ symbol: r.symbol, oldState, newState, value: v });
      } else sameState += 1;
    }
    summary[axis] = {
      n: vals.length, oldCut: old, newCut, flipped, sameState, naCount,
      flippedPct: (flipped / vals.length) * 100,
      sample: flipSamples,
    };
    console.log(`=== ${axis} ===`, JSON.stringify(summary[axis]));
  }

  const totalFlippedAnyAxis = rows.filter((r) => {
    for (const axis of CUT_LENSES) {
      const vf = valueField[axis], sf = stateField[axis];
      const v = r[vf] as number | null;
      if (v == null) continue;
      const s = summary[axis] as { newCut?: { lo: number; hi: number } } | undefined;
      if (!s?.newCut) continue;
      const oldState = r[sf] as string | null;
      const newState = stateFromCut(axis, v, s.newCut);
      if (oldState !== newState) return true;
    }
    return false;
  }).length;
  console.log("=== 전체(축 무관, 하나라도 바뀐 종목 수) ===", totalFlippedAnyAxis, "/", rows.length);
  console.log("DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });
