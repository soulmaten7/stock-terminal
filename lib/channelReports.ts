// 홈 리포트 피드 원료 — channel_reports 조회(ORDER_트릴리언홈피드_0905 STEP2).
// 서버 프리페치(app/[locale]/page.tsx)·리포트 목록 페이지(app/[locale]/reports)가 공유.
// symbol이 NULL(미매칭)인 행은 클릭 시 이동할 곳이 없어 제외한다(ORDER 명시).
// 2026-09-06(콘텐츠 번역 구현): loc 인자 추가 — title은 번역 있으면 교체, stock_name/broker는
// kr_stock_snapshot.name_en 조회로 대체(자유번역 아님). lib/channelReportI18n.ts 참고.
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchChannelReportLocaleData, localizedStockName, localizedBroker } from "@/lib/channelReportI18n";

export type HomeReportItem = {
  symbol: string;
  stock_name: string;
  broker: string;
  verdict: string | null;
  target_price: string | null;
  current_price: string | null; // ORDER_트릴리언홈카드가격_0905 — 홈·/reports 카드 우측 표시는 이 값(목표주가 아님)
  report_date: string;
  title: string | null; // ORDER_트릴리언국가확장구조_0905 STEP2 — 채널이 보내는 영상 제목/대표 소제목. NULL이면 미표시.
};

export type HomeReportFeed = { items: HomeReportItem[]; count: number };

// country는 lib/constants/reportCountries.ts의 코드를 그대로 받는다 — 이 함수는 국가 무관
// (country 인자만 바뀌면 그대로 동작), 새 국가 추가 시 이 파일은 손댈 필요가 없다.
export async function getHomeReportFeed({
  country,
  limit = 5,
  loc = "ko",
}: {
  country: string;
  limit?: number;
  loc?: "ko" | "en";
}): Promise<HomeReportFeed> {
  try {
    const sb = createAdminClient();
    const { data, count, error } = await sb
      .from("channel_reports")
      .select("id, symbol, stock_name, broker, verdict, target_price, current_price, report_date, title", { count: "exact" })
      .eq("country", country)
      .not("symbol", "is", null)
      .order("report_date", { ascending: false })
      .limit(limit);
    if (error) return { items: [], count: 0 };
    const rows = (data ?? []) as (HomeReportItem & { id: number })[];

    const { translations, stockNameEn, brokerNameEn } = await fetchChannelReportLocaleData({
      ids: rows.map((r) => r.id),
      krSymbols: country === "KR" ? rows.map((r) => r.symbol) : [],
      krBrokers: country === "KR" ? rows.map((r) => r.broker) : [],
      loc,
    });

    const items: HomeReportItem[] = rows.map((r) => {
      const tr = translations.get(r.id);
      const ok = tr && tr.status === "ok";
      return {
        symbol: r.symbol,
        stock_name: localizedStockName(loc, country, r.symbol, r.stock_name, stockNameEn),
        broker: localizedBroker(loc, country, r.broker, brokerNameEn),
        verdict: r.verdict,
        target_price: r.target_price,
        current_price: r.current_price,
        report_date: r.report_date,
        title: ok && tr!.title ? tr!.title : r.title,
      };
    });
    return { items, count: count ?? 0 };
  } catch {
    return { items: [], count: 0 };
  }
}
