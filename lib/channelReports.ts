// 홈 리포트 피드 원료 — channel_reports 조회(ORDER_트릴리언홈피드_0905 STEP2).
// 서버 프리페치(app/[locale]/page.tsx)·리포트 목록 페이지(app/[locale]/reports)가 공유.
// symbol이 NULL(미매칭)인 행은 클릭 시 이동할 곳이 없어 제외한다(ORDER 명시).
import { createAdminClient } from "@/lib/supabase/admin";

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
}: {
  country: string;
  limit?: number;
}): Promise<HomeReportFeed> {
  try {
    const sb = createAdminClient();
    const { data, count, error } = await sb
      .from("channel_reports")
      .select("symbol, stock_name, broker, verdict, target_price, current_price, report_date, title", { count: "exact" })
      .eq("country", country)
      .not("symbol", "is", null)
      .order("report_date", { ascending: false })
      .limit(limit);
    if (error) return { items: [], count: 0 };
    return { items: (data ?? []) as HomeReportItem[], count: count ?? 0 };
  } catch {
    return { items: [], count: 0 };
  }
}
