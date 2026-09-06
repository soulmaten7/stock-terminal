import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pickLocale } from "@/lib/lensCopy";
import { fetchChannelReportLocaleData, localizedBroker } from "@/lib/channelReportI18n";

// 🔴 2026-09-05(ORDER_트릴리언리포트렌더): channel_reports를 symbol로 조회.
// 한 종목의 리포트 수는 수십 건 이하 규모라 PostgREST 1000행 캡·fetchAllRows 페이지네이션은 불필요(SYSTEM_MAP §10) —
// .order()는 규칙대로 명시. symbol=NULL(미매칭) 행은 WHERE symbol=X 조건 자체에 걸려 원천적으로 안 뽑힘(설계대로).
// 2026-09-06(콘텐츠 번역 구현): ?lang= 로케일별로 title·reasons·earnings_summary를 channel_report_
// translations에서 번역 있으면 교체, broker는 kr_stock_snapshot.name_en 조회로 대체(stock_name은 이
// 라우트가 애초에 안 내려줌 — symbol 하나로 이미 화면이 알고 있음). 번역 없거나 실패면 원문 그대로.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  if (!symbol) return NextResponse.json({ error: "no_symbol" }, { status: 400 });
  const loc = pickLocale(req.nextUrl.searchParams.get("lang"));
  const country = /^\d{5}[0-9A-Z]$/.test(symbol) ? "KR" : "US";

  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("channel_reports")
      .select("id, report_date, broker, verdict, target_price, current_price, upside, reasons, earnings_summary, broker_average, title")
      .eq("symbol", symbol)
      .order("report_date", { ascending: false });
    if (error) return NextResponse.json({ symbol, reports: [], error: "fetch_failed" });
    const rows = data ?? [];

    const { translations, brokerNameEn } = await fetchChannelReportLocaleData({
      ids: rows.map((r) => r.id),
      krSymbols: country === "KR" ? [symbol] : [],
      krBrokers: country === "KR" ? rows.map((r) => r.broker) : [],
      loc,
    });

    const reports = rows.map((r) => {
      const tr = translations.get(r.id);
      const ok = tr && tr.status === "ok";
      return {
        report_date: r.report_date,
        broker: localizedBroker(loc, country, r.broker, brokerNameEn),
        verdict: r.verdict,
        target_price: r.target_price,
        current_price: r.current_price,
        upside: r.upside,
        reasons: ok && tr!.reasons ? tr!.reasons : r.reasons,
        earnings_summary: ok && tr!.earnings_summary ? tr!.earnings_summary : r.earnings_summary,
        broker_average: r.broker_average,
        title: ok && tr!.title ? tr!.title : r.title,
      };
    });
    return NextResponse.json({ symbol, reports });
  } catch {
    return NextResponse.json({ symbol, reports: [], error: "fetch_failed" });
  }
}
