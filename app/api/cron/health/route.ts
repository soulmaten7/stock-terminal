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
  // 2026-09-05(ORDER_트릴리언모델크론정리_0905): daily-brief·email-brief·revdcf 스케줄 제거
  // (홈 브리핑 화면 호출 이미 끊음·email-brief 구독자 실측 0명·revdcf는 REVDCF_ENABLED/Q1_ENABLED
  // 플래그 OFF라 화면 어디에도 안 뜸) → 감시 항목에서도 제거(오탐 방지, jp-disclosures 선례와 동일
  // 처리). 라우트·테이블·lib 함수는 보존 — 재개 시 이 배열에 다시 추가할 것.
  // 2026-09-05(ORDER_트릴리언렌즈크론정지_0905): kr-lens-scores·lens-scores 크론 스케줄 제거(홈 "내
  // 관심종목·렌즈 변화" 섹션 제거로 유일한 라이브 소비처가 사라짐) → "렌즈 KR/US(lens_scores)"·
  // "상태변화 피드(lens_state_changes)" 항목도 감시에서 제거(오탐 방지, 위 revdcf 선례와 동일 처리).
  // lens_scores/lens_state_changes/lens_cuts 테이블과 lib/lensPrecompute.ts는 삭제하지 않고 보존 —
  // 재개 시 이 배열에 다시 추가할 것. 아래 "렌즈 행수"·"렌즈 컷 나이" 감시 루프도 같은 이유로 제거.
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

  // 🔴 STEP 828 §2-5: 신선 행 수 하한 — 소스 시세 테이블은 MAX(updated_at)만 보면 99% 실패해도(1행만 갱신) 초록이다.
  //   '최근 25h 내 갱신된 행 수'가 하한 미만이면 부분 실패로 판정. 하한 = 정상 신선 행수(KR~2765·US~5952)의 절반 수준(오탐 여유).
  const since = new Date(now - 25 * 36e5).toISOString();
  for (const { name, table, floor } of [
    { name: "KR 시세 신선행수(kr-perf)", table: "kr_stock_snapshot", floor: 1500 },
    { name: "US 시세 신선행수(us-perf)", table: "us_stock_perf", floor: 3000 },
  ]) {
    try {
      const { count } = await sb.from(table).select("symbol", { count: "exact", head: true }).gt("updated_at", since);
      const n = count ?? 0;
      results.push({ name, latest: `${n} fresh rows`, ageH: null, thresholdH: 0, status: n < floor ? "stale" : "ok" });
    } catch (e) {
      results.push({ name, latest: null, ageH: null, thresholdH: 0, status: "stale", error: String(e) });
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
