import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { computeLensScoresFor, topKrByTradeAmount } from "@/lib/lensPrecompute";

// KR 렌즈 선계산 크론 — 매일 거래대금 상위 1000 KR 종목 7팩터 → lens_scores(market=KR).
// lens-scores(US) 크론과 동일 패턴. kr-perf(10:00 UTC) 뒤에 돌아 kr_stock_snapshot 최신 유니버스 사용.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { symbols: universe, tradeAmountOf } = await topKrByTradeAmount(1000);
    const r = await computeLensScoresFor(universe, "KR", { tradeAmountOf });
    // STEP 828 §2-3: 유니버스 붕괴/pass2 실패는 "성공"으로 기록하지 않는다(200이 아닌 500 + 경고 노출).
    if (!r.ok) return NextResponse.json(r, { status: 500 });
    return NextResponse.json(r);
  } catch (e) {
    Sentry.captureException(e, { tags: { pipeline: "kr_lens_scores" } });
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
