import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { revdcfEnabled } from "@/lib/revdcf/flag";
import { createAdminClient } from "@/lib/supabase/admin";

// STEP 853 §4 — 역DCF 방법론 페이지 (차이 원장 공개 · 빌린 권위 금지). ko/en · 다크.
// 🔴 STEP 854: 플래그 OFF면 404(장은태 육안 승인 전 미노출).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "RevDcfMethod" });
  return { title: `${t("title")} · Trillion`, description: t("intro"), robots: { index: true } };
}

// 🔴 STEP 919(#17·#29): 화면에 숫자를 박지 않고 매 요청 DB에서 읽는다(CLAUDE.md §12 B분류 — 남이 주기적으로
//   갱신하는 값은 좌표만 코드에 두고 숫자는 안 적는다). 실패해도 페이지는 뜬다(값 없으면 "—").
async function loadLedgerFigures() {
  const sb = createAdminClient();
  const fallback = { wcPct: "—", wcTotal: "—", taxEffMoney: "—", taxEffAgg: "—", taxMarginal: "—" };
  try {
    const asOfRow = (await sb.from("revdcf_results").select("as_of").order("as_of", { ascending: false }).limit(1).maybeSingle()).data as { as_of: string } | null;
    if (!asOfRow?.as_of) return fallback;
    const { count: wcHas } = await sb.from("revdcf_results").select("symbol", { count: "exact", head: true }).eq("as_of", asOfRow.as_of).not("working_capital_rate", "is", null);
    const { count: wcNeg } = await sb.from("revdcf_results").select("symbol", { count: "exact", head: true }).eq("as_of", asOfRow.as_of).not("working_capital_rate", "is", null).lt("working_capital_rate", 0);
    const taxRow = (await sb.from("damodaran_tax_rate").select("eff_money,eff_agg").eq("industry", "Total Market (without financials)").maybeSingle()).data as { eff_money: number; eff_agg: number } | null;
    const taxCountry = (await sb.from("damodaran_country_tax").select("marginal_rate").eq("country", "United States of America").maybeSingle()).data as { marginal_rate: number } | null;
    return {
      wcPct: wcHas ? String(Math.round((1000 * (wcNeg ?? 0)) / wcHas) / 10) : "—",
      wcTotal: wcHas != null ? String(wcHas) : "—",
      taxEffMoney: taxRow ? String(Math.round(Number(taxRow.eff_money) * 1000) / 10) : "—",
      taxEffAgg: taxRow ? String(Math.round(Number(taxRow.eff_agg) * 1000) / 10) : "—",
      taxMarginal: taxCountry ? String(Math.round(Number(taxCountry.marginal_rate) * 1000) / 10) : "—",
    };
  } catch {
    return fallback; // 계측 실패가 방법론 페이지를 죽이면 안 됨(917과 같은 원칙)
  }
}

export default async function RevDcfMethodPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!revdcfEnabled()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("RevDcfMethod");
  // STEP 859: 예측 지평(horizon)은 원전 T8과 동일(25년)로 맞춰 차이 원장에서 제거 — 차이만 남긴다.
  const rows = ["growth", "tax", "wc", "cap", "wacc", "term", "sensitivity", "distribution"] as const;
  const figures = await loadLedgerFigures();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-unjong-primary">{t("title")}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-unjong-strong dark:text-unjong-muted">{t("intro")}</p>
      <p className="mt-3 text-sm leading-relaxed text-unjong-muted">{t("structure")}</p>

      <section className="mt-8">
        <h2 className="text-base font-semibold">{t("reproTitle")}</h2>
        <p className="mt-2 rounded-xl border border-unjong-border bg-unjong-surface p-4 text-sm leading-relaxed text-unjong-muted">{t("repro")}</p>
        <p className="mt-2 rounded-xl border border-unjong-accent/30 bg-unjong-accent/5 p-4 text-sm leading-relaxed text-unjong-accent">{t("verificationCaveat")}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">{t("ledgerTitle")}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-unjong-border text-left text-unjong-muted">
                <th className="py-2 pr-3 font-medium whitespace-nowrap">{t("col.item")}</th>
                <th className="py-2 pr-3 font-medium">{t("col.source")}</th>
                <th className="py-2 pr-3 font-medium">{t("col.ours")}</th>
                <th className="py-2 font-medium">{t("col.why")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r} className="border-b border-unjong-border align-top">
                  <td className="py-2 pr-3 font-medium whitespace-nowrap">{t(`row.${r}.i`)}</td>
                  <td className="py-2 pr-3 text-unjong-muted">{t(`row.${r}.s`)}</td>
                  <td className="py-2 pr-3">{t(`row.${r}.o`)}</td>
                  <td className="py-2 text-unjong-muted">{t(`row.${r}.w`, figures)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-8 rounded-xl border border-unjong-accent/30 bg-unjong-accent/5 p-4 text-sm leading-relaxed text-unjong-accent">{t("betaCaveat")}</p>
      <p className="mt-4 rounded-xl border border-unjong-accent/30 bg-unjong-accent/5 p-4 text-sm leading-relaxed text-unjong-accent">{t("universeCaveat")}</p>
      <p className="mt-4 text-sm font-medium text-unjong-muted">{t("notInvestmentAdvice")}</p>
    </main>
  );
}
