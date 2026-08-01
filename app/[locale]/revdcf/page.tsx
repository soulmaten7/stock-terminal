import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { revdcfEnabled } from "@/lib/revdcf/flag";

// STEP 853 §4 — 역DCF 방법론 페이지 (차이 원장 공개 · 빌린 권위 금지). ko/en · 다크.
// 🔴 STEP 854: 플래그 OFF면 404(장은태 육안 승인 전 미노출).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RevDcfMethod" });
  return { title: `${t("title")} · Trillion`, description: t("intro"), robots: { index: true } };
}

export default async function RevDcfMethodPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!revdcfEnabled()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("RevDcfMethod");
  const rows = ["growth", "tax", "wc", "cap", "term", "horizon"] as const;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-unjong-primary">{t("title")}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-unjong-strong dark:text-unjong-muted">{t("intro")}</p>
      <p className="mt-3 text-sm leading-relaxed text-unjong-muted">{t("structure")}</p>

      <section className="mt-8">
        <h2 className="text-base font-semibold">{t("reproTitle")}</h2>
        <p className="mt-2 rounded-xl border border-unjong-border bg-unjong-surface p-4 text-sm leading-relaxed text-unjong-muted">{t("repro")}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">{t("ledgerTitle")}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-unjong-border text-left text-unjong-muted">
                <th className="py-2 pr-3 font-medium">{t("col.item")}</th>
                <th className="py-2 pr-3 font-medium">{t("col.source")}</th>
                <th className="py-2 pr-3 font-medium">{t("col.ours")}</th>
                <th className="py-2 font-medium">{t("col.why")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r} className="border-b border-unjong-border align-top">
                  <td className="py-2 pr-3 font-medium">{t(`row.${r}.i`)}</td>
                  <td className="py-2 pr-3 text-unjong-muted">{t(`row.${r}.s`)}</td>
                  <td className="py-2 pr-3">{t(`row.${r}.o`)}</td>
                  <td className="py-2 text-unjong-muted">{t(`row.${r}.w`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-8 rounded-xl border border-unjong-accent/30 bg-unjong-accent/5 p-4 text-sm leading-relaxed text-unjong-accent">{t("betaCaveat")}</p>
      <p className="mt-4 text-sm font-medium text-unjong-muted">{t("notInvestmentAdvice")}</p>
    </main>
  );
}
