// 렌즈 점수 프리컴퓨트(스크리닝 토대) — 시드 소규모 실행판.
// 공용 엔진 lib/lensCompute(=/api/lens 카드와 동일) 으로 각 종목 7팩터 value/state 산출 → lens_scores 테이블 upsert.
// STEP 571: 파이프라인 엔드투엔드 증명(~30 종목). 크론·전종목 확장은 STEP 572.
// 실행: npx tsx scripts/precompute_lens.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // admin 클라이언트가 SUPABASE_SERVICE_ROLE_KEY 읽기 전에 로드
import { computeSymbolLenses } from "../lib/lensCompute";
import { createAdminClient } from "../lib/supabase/admin";

// 다양성 있게(메가캡·은행·가치·고성장·저퀄) 30종목 — 파이프라인·상태 분포 확인용.
const SEED = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO", "JPM", "BAC",
  "XOM", "CVX", "JNJ", "PG", "KO", "WMT", "V", "MA", "HD", "DIS",
  "NFLX", "INTC", "F", "GM", "T", "VZ", "PFE", "MRK", "CSCO", "ORCL",
];

type Lens = { key: string; value?: number | null; state?: string | null };
function pick(lenses: Lens[], key: string) {
  const l = lenses.find((x) => x.key === key);
  return { value: l?.value ?? null, state: l?.state ?? null };
}

async function main() {
  const sb = createAdminClient();
  const rows: Record<string, unknown>[] = [];
  let ok = 0, fail = 0;

  for (const sym of SEED) {
    try {
      const r = await computeSymbolLenses(sym);
      if (!r.lenses.length) { console.log(`${sym.padEnd(6)} SKIP (데이터 부족)`); fail++; continue; }
      const m = pick(r.lenses, "momentum");
      const lv = pick(r.lenses, "lowvol");
      const v = pick(r.lenses, "valuation");
      const q = pick(r.lenses, "quality");
      const ag = pick(r.lenses, "assetgrowth");
      const t = pick(r.lenses, "technical");
      // F-Score: 카드와 동일 규칙(score>=7 strong / <=3 weak / mid). 은행 등 미적용(grade '-')은 na.
      const fs = r.fscore as { score?: number; grade?: string } | null;
      const fscoreVal = fs && typeof fs.score === "number" && fs.grade !== "-" ? fs.score : null;
      const fscoreState = fscoreVal == null ? "na" : fscoreVal >= 7 ? "strong" : fscoreVal <= 3 ? "weak" : "mid";

      rows.push({
        symbol: sym, market: "US", name: r.name, price: r.price,
        momentum_value: m.value, momentum_state: m.state,
        lowvol_value: lv.value, lowvol_state: lv.state,
        valuation_value: v.value, valuation_state: v.state,
        quality_value: q.value, quality_state: q.state,
        assetgrowth_value: ag.value, assetgrowth_state: ag.state,
        technical_value: t.value, technical_state: t.state,
        fscore_value: fscoreVal, fscore_state: fscoreState,
        updated_at: new Date().toISOString(),
      });
      ok++;
      console.log(`${sym.padEnd(6)} OK   mom=${m.state} val=${v.state} qual=${q.state} fscore=${fscoreState}`);
    } catch (e) {
      fail++;
      console.log(`${sym.padEnd(6)} FAIL ${String(e).slice(0, 80)}`);
    }
    await new Promise((r) => setTimeout(r, 300)); // 야후 레이트 배려
  }

  if (!rows.length) { console.log("\n계산된 행 없음 — 중단."); process.exit(1); }
  const { error } = await sb.from("lens_scores").upsert(rows, { onConflict: "symbol" });
  console.log(`\n${error ? "UPSERT ERROR: " + error.message : `UPSERT OK: ${rows.length}행 저장`} (성공 ${ok} · 실패/스킵 ${fail})`);
  if (error) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
