import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 🔴 2026-09-05(ORDER_트릴리언리포트렌더): channel_reports를 symbol로 조회.
// 한 종목의 리포트 수는 수십 건 이하 규모라 PostgREST 1000행 캡·fetchAllRows 페이지네이션은 불필요(SYSTEM_MAP §10) —
// .order()는 규칙대로 명시. symbol=NULL(미매칭) 행은 WHERE symbol=X 조건 자체에 걸려 원천적으로 안 뽑힘(설계대로).
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });

  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("channel_reports")
      .select("report_date, broker, verdict, target_price, current_price, upside, reasons, earnings_summary, broker_average, title")
      .eq("symbol", symbol)
      .order("report_date", { ascending: false });
    if (error) return NextResponse.json({ symbol, reports: [], error: "fetch_failed" });
    return NextResponse.json({ symbol, reports: data ?? [] });
  } catch {
    return NextResponse.json({ symbol, reports: [], error: "fetch_failed" });
  }
}
