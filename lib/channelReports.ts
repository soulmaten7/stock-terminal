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

// 🔴 2026-09-15(/reports·홈 종목 단위 재편, 장은태 확정): 리포트 목록은 "종목 리스트"이지
// "리포트 리스트"가 아니다 — 같은 symbol의 리포트가 여러 건이면 한 줄로 묶고, 그 종목의
// 가장 최근 리포트 1건(증권사·판정·날짜·현재가)만 보여준다. 정렬은 그 최근 리포트의
// report_date 기준(종목 최신화 시 위로 올라옴). /reports·홈 카드(compact) 둘 다 이 함수로
// 통일했다 — 예전엔 리포트 단위 getHomeReportFeed()가 따로 있었으나 두 화면 모두 종목
// 단위로 바뀌면서 호출부가 없어져 삭제했다(그 함수가 쓰던 "N건 더 보기" 숫자 문구도 같은
// 날 폐지 — components/today/TodayClient.tsx 참고, 지금은 count를 "더 보기 링크를 아예
// 보여줄지" 판정에만 쓰고 화면에 숫자로는 안 찍는다).
//
// 제목 폴백(2026-09-15): 그 종목의 최신 리포트에 title이 없으면(채널이 그 건엔 영상 제목을
// 안 보냄), 같은 종목의 리포트 중 title이 있는 것 중 가장 최근 것의 title을 대신 쓴다 —
// 증권사·판정·날짜·현재가는 여전히 최신 리포트 값 그대로(제목만 폴백). 그 종목 전체에
// title이 하나도 없으면 지금처럼 제목 줄 자체를 안 보여준다(ReportRow.tsx).
//
// 동일 symbol·동일 report_date 동점 처리(실측 근거): 090430(3건 전부 09-14)·329180(2건
// 전부 09-11) 실측 결과 id(bigint identity, 항상 적재순으로 증가)가 created_at과 완전히
// 같은 순서를 냈다 — id를 쓰는 이유는 US처럼 배치 적재 시 여러 행의 created_at이 초 단위로
// 뭉쳐 구분이 안 될 수 있는 반면(실측: US 53건이 같은 분에 몰림), id는 배치 적재라도 절대
// 동점이 나지 않는 전순서라서다.
export async function getSymbolReportFeed({
  country,
  limit = 50,
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

    // title이 있는 리포트만 훑어 symbol별 "가장 최근 제목 보유 리포트"를 따로 잡아둔다 —
    // rows가 이미 (report_date asc, id asc) 순이라 마지막에 덮어쓴 값이 자동으로 최신.
    const latestTitledBySymbol = new Map<string, HomeReportItem & { id: number }>();
    for (const r of rows) if (r.title) latestTitledBySymbol.set(r.symbol, r);

    const latest = Array.from(latestBySymbol.values()).sort((a, b) => {
      const byDate = a.report_date < b.report_date ? -1 : a.report_date > b.report_date ? 1 : 0;
      if (byDate !== 0) return sortAscending ? byDate : -byDate;
      return sortAscending ? a.id - b.id : b.id - a.id;
    });
    const page = latest.slice(0, limit);

    // title 출처 행 결정 — 최신 리포트에 title이 있으면 그 리포트 자신, 없으면 같은
    // symbol의 최근 제목 보유 리포트(없으면 undefined → 제목 줄 없음).
    const titleSourceBySymbol = new Map<string, HomeReportItem & { id: number }>();
    for (const r of page) {
      const source = r.title ? r : latestTitledBySymbol.get(r.symbol);
      if (source) titleSourceBySymbol.set(r.symbol, source);
    }

    // 번역 조회 대상 id는 대표 리포트(page)뿐 아니라 폴백 title 출처 리포트도 포함해야
    // 폴백된 제목도 로케일에 맞게 번역된다.
    const idsForLocale = new Set<number>(page.map((r) => r.id));
    for (const source of titleSourceBySymbol.values()) idsForLocale.add(source.id);

    const { translations, stockNameEn, brokerNameEn } = await fetchChannelReportLocaleData({
      ids: Array.from(idsForLocale),
      krSymbols: country === "KR" ? page.map((r) => r.symbol) : [],
      krBrokers: country === "KR" ? page.map((r) => r.broker) : [],
      loc,
    });

    const items: HomeReportItem[] = page.map((r) => {
      const titleSource = titleSourceBySymbol.get(r.symbol);
      let title: string | null = null;
      if (titleSource) {
        const tr = translations.get(titleSource.id);
        const ok = tr && tr.status === "ok";
        title = ok && tr!.title ? tr!.title : titleSource.title;
      }
      return {
        symbol: r.symbol,
        stock_name: localizedStockName(loc, country, r.symbol, r.stock_name, stockNameEn),
        broker: localizedBroker(loc, country, r.broker, brokerNameEn),
        verdict: r.verdict,
        target_price: r.target_price,
        current_price: r.current_price,
        report_date: r.report_date,
        title,
      };
    });
    return { items, count: latest.length };
  } catch {
    return { items: [], count: 0 };
  }
}
