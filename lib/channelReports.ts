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
  sortAscending = false,
}: {
  country: string;
  limit?: number;
  loc?: "ko" | "en";
  sortAscending?: boolean; // 🔴 2026-09-08(/reports 날짜 정렬): 기본 최신순(false), true면 오래된순
}): Promise<HomeReportFeed> {
  try {
    const sb = createAdminClient();
    const { data, count, error } = await sb
      .from("channel_reports")
      .select("id, symbol, stock_name, broker, verdict, target_price, current_price, report_date, title", { count: "exact" })
      .eq("country", country)
      .not("symbol", "is", null)
      .order("report_date", { ascending: sortAscending })
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

// 🔴 2026-09-15(/reports 종목 단위 재편, 장은태 확정): /reports는 "종목 리스트"이지
// "리포트 리스트"가 아니다 — 같은 symbol의 리포트가 여러 건이면 한 줄로 묶고, 그 종목의
// 가장 최근 리포트 1건(제목·증권사·판정·날짜·현재가 전부)만 보여준다. 정렬은 그 최근
// 리포트의 report_date 기준(종목 최신화 시 위로 올라옴). 홈 피드(getHomeReportFeed)는
// 리포트 건수(feed.count)를 "N건 더 보기" 문구에 그대로 쓰므로 건드리지 않는다 — 이
// 함수는 /reports 전용.
//
// 동일 symbol·동일 report_date 동점 처리(2026-09-15 실측 근거): 090430(3건 전부 09-14)·
// 329180(2건 전부 09-11) 실측 결과 id(bigint identity, 항상 적재순으로 증가)가 created_at과
// 완전히 같은 순서를 냈다 — id를 쓰는 이유는 이미 이 파일 위쪽 주석(22-25행)이 밝힌 대로
// created_at은 US처럼 배치 적재 시 여러 행이 초 단위로 뭉쳐 구분이 안 될 수 있는 반면(실측:
// US 53건이 같은 분에 몰림), id는 배치 적재라도 절대 동점이 나지 않는 전순서라서다.
export async function getSymbolReportFeed({
  country,
  limit = 50,
  loc = "ko",
  sortAscending = false,
}: {
  country: string;
  limit?: number;
  loc?: "ko" | "en";
  sortAscending?: boolean;
}): Promise<HomeReportFeed> {
  try {
    const sb = createAdminClient();
    // 국가 전체 리포트를 한 번에 읽어 그룹핑한다 — 지금 규모(KR 46건·US 75건, 2026-09-15
    // 실측)는 PostgREST 기본 1000행 캡에 안전하게 못 미친다. report_date·id 둘 다 오름차순
    // 으로 받으면, 같은 symbol을 다시 만날 때마다 덮어써서 마지막에 남는 값이 자동으로
    // "그 종목의 가장 최근 리포트"가 된다(동점은 위 주석대로 id로 갈린다).
    const { data, error } = await sb
      .from("channel_reports")
      .select("id, symbol, stock_name, broker, verdict, target_price, current_price, report_date, title")
      .eq("country", country)
      .not("symbol", "is", null)
      .order("report_date", { ascending: true })
      .order("id", { ascending: true });
    if (error) return { items: [], count: 0 };
    const rows = (data ?? []) as (HomeReportItem & { id: number })[];

    const latestBySymbol = new Map<string, HomeReportItem & { id: number }>();
    for (const r of rows) latestBySymbol.set(r.symbol, r);

    const latest = Array.from(latestBySymbol.values()).sort((a, b) => {
      const byDate = a.report_date < b.report_date ? -1 : a.report_date > b.report_date ? 1 : 0;
      if (byDate !== 0) return sortAscending ? byDate : -byDate;
      return sortAscending ? a.id - b.id : b.id - a.id;
    });
    const page = latest.slice(0, limit);

    const { translations, stockNameEn, brokerNameEn } = await fetchChannelReportLocaleData({
      ids: page.map((r) => r.id),
      krSymbols: country === "KR" ? page.map((r) => r.symbol) : [],
      krBrokers: country === "KR" ? page.map((r) => r.broker) : [],
      loc,
    });

    const items: HomeReportItem[] = page.map((r) => {
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
    return { items, count: latest.length };
  } catch {
    return { items: [], count: 0 };
  }
}
