import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ReportRow } from "@/components/reports/ReportRow";
import { getHomeReportFeed } from "@/lib/channelReports";
import { pickLocale } from "@/lib/lensCopy";
import { REPORT_COUNTRIES } from "@/lib/constants/reportCountries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 홈 리포트 피드의 "더 보기" 대상(ORDER_트릴리언홈피드_0905 STEP2) — 국가별 전체 목록, 디자인 최소.
// 상세는 종목 페이지에서 보므로 여기는 카드 나열뿐(홈 카드와 같은 컴포넌트 재사용).
// ORDER_트릴리언국가확장구조_0905 STEP2: country 파라미터·토글 버튼을 REPORT_COUNTRIES 순회로 —
// 새 국가가 늘어도 이 파일은 손댈 필요가 없다.
export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string }>;
}) {
  const { locale } = await params;
  const { country: countryParam } = await searchParams;
  const country = REPORT_COUNTRIES.find((rc) => rc.code === countryParam)?.code ?? REPORT_COUNTRIES[0].code;
  setRequestLocale(locale);
  const loc = pickLocale(locale);
  const t = await getTranslations({ locale, namespace: "Today" });

  const feed = await getHomeReportFeed({ country, limit: 50 });
  const activeCountry = REPORT_COUNTRIES.find((rc) => rc.code === country)!;

  return (
    <PageShell>
      <div className="mb-4 px-4 sm:px-0">
        <h1 className="text-[22px] font-bold text-unjong-primary lg:text-[26px]">
          {activeCountry.flag} {t(`countries.${country}.name`)}
        </h1>
        <p className="mt-1 text-[15px] text-unjong-muted">{t(`countries.${country}.reportsTitle`)}</p>
        <div className="mt-3 flex gap-2">
          {[...REPORT_COUNTRIES].sort((a, b) => a.displayOrder - b.displayOrder).map((rc) => (
            <Link
              key={rc.code}
              href={`/reports?country=${rc.code}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${country === rc.code ? "bg-unjong-accent text-white" : "bg-unjong-surface text-unjong-muted"}`}
            >
              {rc.flag} {t(`countries.${rc.code}.name`)}
            </Link>
          ))}
        </div>
      </div>

      {feed.items.length === 0 ? (
        <p className="px-4 py-4 text-[15px] text-unjong-muted sm:px-0 sm:text-sm">{t("noReportsYet")}</p>
      ) : (
        <div className="border-y border-unjong-border bg-unjong-surface px-4 sm:rounded-2xl sm:border">
          {feed.items.map((r, i) => (
            <ReportRow key={`${r.symbol}-${r.report_date}-${r.broker}-${i}`} item={r} loc={loc} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
