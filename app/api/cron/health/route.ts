// 일일 데이터 신선도 헬스체크 — 크론이 조용히 죽는 것을 잡는다(STEP 749).
// 각 파이프라인 테이블의 최신 타임스탬프 나이를 임계(25h)와 비교, stale이면 Sentry로 알림.
// 화면은 스냅샷 서빙이라 크론이 죽어도 안 깨짐 → 이 체크가 유일한 감시망 (실증: 07-18 kr-perf 금요일 미실행·cn-perf 9일 스톱).
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Check = { name: string; table: string; column: string; eq?: [string, string]; thresholdH: number };
// thresholdH 25 = 일일 크론 기준: 정상 나이(체크 시각 12:00 UTC) 최대 ~17h, 1회 누락 시 26h+ → 확실히 검출.
const CHECKS: Check[] = [
  // STEP 794 §5: 파킹 전용 크론 6개 스케줄 중지(jp/cn/vn/gb-perf·fss-advisors·youtube-refresh) →
  // 그 테이블들은 이제 stale로 굳으므로 감시 항목에서도 제거(오탐 방지). kr-etp는 종목상세가 라이브로 읽어 유지.
  { name: "KR 시세(kr-perf)", table: "kr_stock_snapshot", column: "updated_at", thresholdH: 25 },
  { name: "KR ETP(kr-etp)", table: "kr_etp_snapshot", column: "updated_at", thresholdH: 25 },
  { name: "US 시세(us-perf)", table: "us_stock_perf", column: "updated_at", thresholdH: 25 },
  { name: "렌즈 KR(kr-lens-scores)", table: "lens_scores", column: "updated_at", eq: ["market", "KR"], thresholdH: 25 },
  { name: "렌즈 US(lens-scores)", table: "lens_scores", column: "updated_at", eq: ["market", "US"], thresholdH: 25 },
  { name: "한 입 브리핑(daily-brief)", table: "daily_brief", column: "created_at", thresholdH: 25 },
  // email-brief·jp-disclosures는 결과 테이블 나이로는 실행 여부를 못 잡음(구독자 0·조용한 주말이면 산출물 미갱신).
  // → cron_heartbeats에 매 실행 기록한 last_run_at 나이로 감시(STEP 794 §4).
  { name: "이메일 브리핑(email-brief)", table: "cron_heartbeats", column: "last_run_at", eq: ["job", "email-brief"], thresholdH: 25 },
  // jp-disclosures 크론은 STEP 806 §6에서 스케줄 제거(소비처 0) → 감시 항목에서도 제거(오탐 방지). 라우트·데이터는 보존.
];

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sb = createAdminClient();
  const now = Date.now();
  const results: { name: string; latest: string | null; ageH: number | null; thresholdH: number; status: "ok" | "stale"; error?: string }[] = [];

  for (const c of CHECKS) {
    try {
      let q = sb.from(c.table).select(c.column).order(c.column, { ascending: false }).limit(1);
      if (c.eq) q = q.eq(c.eq[0], c.eq[1]);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const row = (data?.[0] ?? null) as unknown as Record<string, string> | null;
      const latest = row?.[c.column] ?? null;
      const ageH = latest ? Math.round(((now - new Date(latest).getTime()) / 36e5) * 10) / 10 : null;
      const stale = ageH == null || ageH > c.thresholdH;
      results.push({ name: c.name, latest, ageH, thresholdH: c.thresholdH, status: stale ? "stale" : "ok" });
    } catch (e) {
      results.push({ name: c.name, latest: null, ageH: null, thresholdH: c.thresholdH, status: "stale", error: String(e) });
    }
  }

  // STEP 802 §5: lens_scores 행 수 하한 감시 — MAX(updated_at)만 보면 부분실패(소수 행만 갱신)나 과도 삭제를 못 잡음.
  //   신선도 정리(유니버스 이탈 삭제) 도입 후 특히 중요. 시장별 최소 행 수 미달이면 stale.
  for (const { market, floor } of [{ market: "KR", floor: 300 }, { market: "US", floor: 700 }]) {
    try {
      const { count } = await sb.from("lens_scores").select("symbol", { count: "exact", head: true }).eq("market", market);
      const n = count ?? 0;
      results.push({ name: `렌즈 행수 ${market}(lens_scores)`, latest: `${n} rows`, ageH: null, thresholdH: 0, status: n < floor ? "stale" : "ok" });
    } catch (e) {
      results.push({ name: `렌즈 행수 ${market}(lens_scores)`, latest: null, ageH: null, thresholdH: 0, status: "stale", error: String(e) });
    }
  }

  const stale = results.filter((r) => r.status === "stale");
  if (stale.length > 0) {
    // 기존 Sentry 배선 재사용 — 이슈 생성 → 이메일 알림. 메시지에 어떤 파이프라인이 몇 시간 밀렸는지 포함.
    Sentry.captureMessage(
      `[health-check] ${stale.length}개 파이프라인 stale: ${stale.map((s) => `${s.name}=${s.ageH ?? "null"}h`).join(" · ")}`,
      "error"
    );
  }
  return NextResponse.json({ ok: stale.length === 0, checkedAt: new Date(now).toISOString(), staleCount: stale.length, results });
}
