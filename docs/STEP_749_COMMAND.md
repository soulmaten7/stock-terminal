# STEP 749 — 일일 헬스체크 크론 (데이터 신선도 감시 + Sentry 알림)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 신규 라우트 1개 + vercel.json 1줄)

**전제 상태**: 코드 HEAD `8628c38` · 트리 클린

**배경**: 크론이 죽어도 화면은 스냅샷을 서빙해 **안 깨진 채 조용히 낡아감** — 07-18 실증 2건: ① `kr-perf` 금요일 미실행(수동 복구) ② **`cn-perf` 7/9부터 9일째 미갱신**(이 STEP 작성 중 발견). 매일 신선도를 자동 점검하고 낡으면 **기존 Sentry 배선**(라이브 검증됨)으로 알림.

**설계**: 매일 12:00 UTC(21:00 KST — 당일 KR 10:00~10:30·JP/CN/VN/GB 08:00 이후, US는 전일 22:00 커버) 실행. 각 테이블 최신 타임스탬프 나이 > 25h(일일 크론 1회 누락 시 확실히 걸리고, 정상일 땐 최대 ~17h로 여유) → stale → `Sentry.captureMessage(level=error)` → Sentry 이메일 알림.

---

## 수정 1 — 신규 `app/api/cron/health/route.ts`

```ts
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
  { name: "KR 시세(kr-perf)", table: "kr_stock_snapshot", column: "updated_at", thresholdH: 25 },
  { name: "KR ETP(kr-etp)", table: "kr_etp_snapshot", column: "updated_at", thresholdH: 25 },
  { name: "US 시세(us-perf)", table: "us_stock_perf", column: "updated_at", thresholdH: 25 },
  { name: "JP 시세(jp-perf)", table: "jp_stock_perf", column: "updated_at", thresholdH: 25 },
  { name: "CN 시세(cn-perf)", table: "cn_stock_perf", column: "updated_at", thresholdH: 25 },
  { name: "VN 시세(vn-perf)", table: "vn_stock_perf", column: "updated_at", thresholdH: 25 },
  { name: "GB 시세(gb-perf)", table: "gb_stock_perf", column: "updated_at", thresholdH: 25 },
  { name: "렌즈 KR(kr-lens-scores)", table: "lens_scores", column: "updated_at", eq: ["market", "KR"], thresholdH: 25 },
  { name: "렌즈 US(lens-scores)", table: "lens_scores", column: "updated_at", eq: ["market", "US"], thresholdH: 25 },
  { name: "유사투자자문(fss-advisors)", table: "fss_advisors", column: "fetched_at", thresholdH: 25 },
];

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
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
      const row = (data?.[0] ?? null) as Record<string, string> | null;
      const latest = row?.[c.column] ?? null;
      const ageH = latest ? Math.round(((now - new Date(latest).getTime()) / 36e5) * 10) / 10 : null;
      const stale = ageH == null || ageH > c.thresholdH;
      results.push({ name: c.name, latest, ageH, thresholdH: c.thresholdH, status: stale ? "stale" : "ok" });
    } catch (e) {
      results.push({ name: c.name, latest: null, ageH: null, thresholdH: c.thresholdH, status: "stale", error: String(e) });
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
```

## 수정 2 — `vercel.json` 크론 등록

`crons` 배열에 추가(기존 12개 유지):
```json
{ "path": "/api/cron/health", "schedule": "0 12 * * *" }
```

---

## 검증

1. `npx tsc --noEmit` → 0 · `npm run test` → 통과 · `npm run build` → 성공
2. push 후 배포 완료 대기 → **수동 실행**:
   ```bash
   cd ~/stock-terminal && set -a && source .env.local && set +a && curl -s -m 55 -H "Authorization: Bearer $CRON_SECRET" https://onetrillion.app/api/cron/health
   ```
   기대: JSON에 10개 체크. **CN이 stale로 잡혀야 정상**(9일 스톱 실증 — 검출기가 실제 장애를 잡는지 확인). `ok:false·staleCount≥1`.
3. Sentry에 `[health-check] …` 이슈가 생겼는지는 Cowork/사용자가 Sentry 대시보드에서 확인(알림 규칙: 신규 이슈 이메일 기본 — 반복 알림 원하면 규칙 추가는 후속).

## 커밋

```bash
git add app/api/cron/health/route.ts vercel.json docs/STEP_749_COMMAND.md
git commit -m "STEP 749: daily data-freshness health check cron with Sentry alerting"
git push
```

## 완료 보고 → Cowork에게
- tsc/build + 수동 실행 JSON(전문) + 커밋 해시. CN stale 검출 여부 명시.
