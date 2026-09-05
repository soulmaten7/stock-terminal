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
  report_date: string;
};

export type HomeReportFeed = { items: HomeReportItem[]; count: number };

export async function getHomeReportFeed({
  country,
  limit = 5,
}: {
  country: "KR" | "US";
  limit?: number;
}): Promise<HomeReportFeed> {
  try {
    const sb = createAdminClient();
    const { data, count, error } = await sb
      .from("channel_reports")
      .select("symbol, stock_name, broker, verdict, target_price, report_date", { count: "exact" })
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
