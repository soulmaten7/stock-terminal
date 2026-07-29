import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { computeLensScores } from "@/lib/lensPrecompute";

// 렌즈 점수 배치 프리컴퓨트 크론 — 매일 시총 상위 N 종목 7팩터 재계산 → lens_scores.
// us-perf 크론과 동일 패턴(CRON_SECRET 인증). 엔진 lib/lensPrecompute(=/api/lens 카드와 동일 계산).
// ⚠️ 실측 ~224초(상위 1000) → 300초 안. 100행마다 flush라 혹 타임아웃돼도 상위(먼저 처리)분은 저장됨.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await computeLensScores(1000);
    // STEP 828 §2-3: 유니버스 붕괴/pass2 실패는 "성공"으로 기록하지 않는다(200이 아닌 500 + 경고 노출).
    if (!r.ok) return NextResponse.json(r, { status: 500 });
    return NextResponse.json(r);
  } catch (e) {
    Sentry.captureException(e, { tags: { pipeline: "lens_scores" } });
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
