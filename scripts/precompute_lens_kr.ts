// KR 렌즈 점수 프리컴퓨트 러너 — **시총 상위 N** 종목 배치 계산 → lens_scores(market=KR) 저장(STEP 835·시총 통일).
// 엔진 = lib/lensPrecompute(=/api/lens 카드와 동일 계산·게이트·churn 포함). 크론(kr-lens-scores)도 같은 함수 호출.
// 실행: npx tsx scripts/precompute_lens_kr.ts [N]   (N 생략 시 500)
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // admin 클라이언트가 SUPABASE_SERVICE_ROLE_KEY 읽기 전에 로드
import { computeKrLensScores } from "../lib/lensPrecompute";

const N = Number(process.argv[2] ?? 500);

(async () => {
  console.log(`KR 렌즈 선계산(시총) 상위 ${N}종목…`);
  const r = await computeKrLensScores(N);
  console.log(r);
  process.exit(0);
})();
