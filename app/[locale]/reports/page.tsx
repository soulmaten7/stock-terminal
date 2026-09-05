import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { ReportRow } from "@/components/reports/ReportRow";
import { getHomeReportFeed } from "@/lib/channelReports";
import { pickLocale } from "@/lib/lensCopy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 홈 리포트 피드의 "더 보기" 대상(ORDER_트릴리언홈피드_0905 STEP2) — 국가별 전체 목록, 디자인 최소.
// 상세는 종목 페이지에서 보므로 여기는 카드 나열뿐(홈 카드와 같은 컴포넌트 재사용).
export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string }>;
}) {
  const { locale } = await params;
  const { country: countryParam } = await searchParams;
  const country = countryParam === "US" ? "US" : "KR";
  setRequestLocale(locale);
  const loc = pickLocale(locale);
  const t = await getTranslations({ locale, namespace: "Today" });
  const tExplore = await getTranslations({ locale, namespace: "Explore" });

  const feed = await getHomeReportFeed({ country, limit: 50 });
  const title = t(country === "KR" ? "krReportsTitle" : "usReportsTitle");

  return (
    <PageShell>
      <div className="mb-4 px-4 sm:px-0">
        <h1 className="text-[22px] font-bold text-unjong-primary lg:text-[26px]">{title}</h1>
        <div className="mt-3 flex gap-2">
          <Link
            href="/reports?country=KR"
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${country === "KR" ? "bg-unjong-accent text-white" : "bg-unjong-surface text-unjong-muted"}`}
          >
            {tExplore("countryKr")}
          </Link>
          <Link
            href="/reports?country=US"
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${country === "US" ? "bg-unjong-accent text-white" : "bg-unjong-surface text-unjong-muted"}`}
          >
            {tExplore("countryUs")}
          </Link>
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
