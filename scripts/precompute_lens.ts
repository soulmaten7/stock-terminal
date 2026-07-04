// 렌즈 점수 프리컴퓨트 러너 — 시총 상위 N 종목 배치 계산 → lens_scores 저장.
// 엔진 = lib/lensPrecompute(=/api/lens 카드와 동일 계산). 크론(STEP 573)도 같은 엔진 호출.
// 실행: npx tsx scripts/precompute_lens.ts [N]   (N 생략 시 1000)
//   예: npx tsx scripts/precompute_lens.ts 1000
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // admin 클라이언트가 SUPABASE_SERVICE_ROLE_KEY 읽기 전에 로드
import { computeLensScores } from "../lib/lensPrecompute";

const N = Math.max(1, parseInt(process.argv[2] || "1000", 10));

async function main() {
  console.log(`시총 상위 ${N} 종목 프리컴퓨트 시작 (야후 조회 → 계산 → lens_scores 저장)...`);
  const t0 = Date.now();
  const r = await computeLensScores(N);
  const sec = Math.round((Date.now() - t0) / 1000);
  console.log(`\nDONE — 유니버스 ${r.universe} · 저장 ${r.computed}행 · ${sec}초 · at ${r.at}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
