import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { computeUsPerf } from "@/lib/usPerf";
// STEP 1013 — 나스닥 시총 매일 재수집 배선. 크론 9개 상한(vercel.json)이라 새 크론을 못 만들어 여기 붙인다
//   (⓪-1 판정 근거: lens-scores·revdcf는 게이트/finally 오염 위험이 있어 금지, us-perf만 얇아서 채택).
import { fetchNasdaqMarketCap } from "@/lib/nasdaqMarketCap";
import { createAdminClient } from "@/lib/supabase/admin";
// STEP1007이 만든 heartbeat 패턴 재사용(새 패턴 발명 안 함, 1004 원칙).
import { recordHeartbeat } from "@/lib/lensPrecompute";

export const maxDuration = 300; // ~6,121종목 chart 계산 여유(동시 12 → ~3분)
export const dynamic = "force-dynamic";

// STEP1013 §2-3 — budgetLeftMs 계측용. maxDuration과 같은 값(route 전체 예산 300s).
const ROUTE_BUDGET_MS = 300_000;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const t0 = Date.now();
  try {
    const r = await computeUsPerf();
    const perfMs = Date.now() - t0;

    // STEP1013 §2-3 — 🔴 완전 격리(974 원칙): 나스닥 취득이 실패해도 us-perf 본체 응답(r)은 그대로 반환한다.
    let nasdaqRows = 0, nasdaqSaved = 0, nasdaqEmptyCap = 0, nasdaqError: string | null = null;
    const tNasdaq0 = Date.now();
    try {
      const sb = createAdminClient();
      const nr = await fetchNasdaqMarketCap();
      nasdaqRows = nr.totalRows;
      nasdaqEmptyCap = nr.emptyCap;
      // 🔴 us_market_cap(야후)과 완전 별도 테이블 — capOf·freshSet·게이트 어디에도 안 섞는다(1012 계열혼합 경고 반영).
      const asOf = new Date().toISOString().slice(0, 10);
      const updatedAt = new Date().toISOString();
      const dbRows = nr.rows.map((x) => ({ as_of: asOf, symbol: x.symbol, market_cap: x.marketCap, updated_at: updatedAt }));
      for (let i = 0; i < dbRows.length; i += 1000) {
        const batch = dbRows.slice(i, i + 1000);
        const { error } = await sb.from("us_market_cap_nasdaq").upsert(batch, { onConflict: "as_of,symbol" });
        if (error) throw error;
        nasdaqSaved += batch.length;
      }
    } catch (e) {
      // 🔴 936 원칙 — 사유별 분류(빈 catch 금지). 429/timeout·404/형식변경·기타로 나눠 기록.
      const msg = e instanceof Error ? e.message : String(e);
      const lower = msg.toLowerCase();
      const reason = /429|rate|timeout|timed out/.test(lower) ? "rate_limited_or_timeout"
        : /http_4|http_5|형식|not an array|format/.test(lower) ? "http_or_format_error"
        : "other_error";
      nasdaqError = `${reason}: ${msg.slice(0, 250)}`;
    }
    const nasdaqMs = Date.now() - tNasdaq0;
    const routeMs = Date.now() - t0;
    const budgetLeftMs = ROUTE_BUDGET_MS - routeMs;

    // STEP1013 §2-4 — us-perf 최초 heartbeat. recordHeartbeat 자체는 내부에서 try/catch 격리(917 §2).
    const sb = createAdminClient();
    await recordHeartbeat(sb, "us-perf", true, {
      perfMs, nasdaqMs, routeMs, nasdaqRows, nasdaqSaved, nasdaqEmptyCap, nasdaqError, budgetLeftMs,
    });

    return NextResponse.json(r);
  } catch (e) {
    Sentry.captureException(e, { tags: { pipeline: "us_perf" } });
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
