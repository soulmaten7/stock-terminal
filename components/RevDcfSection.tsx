"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// STEP 853 — 역DCF 종목페이지 섹션. US 전용(데이터 자체가 US뿐이라 KR/타국은 result=null → 미노출).
// 5분기 헤드라인 + 밴드(극단 규칙) + method-dependent + 드라이버 공개. 다크·모바일·ko/en.

type Band = { minus1: number | null; plus1: number | null };
type Drivers = { salesGrowth: number; operatingMargin: number; startingMargin: number; taxRate: number; fixedCapitalRate: number; fixedCapitalRateLevel: number | null; fixedCapitalRateMarginal: number | null; workingCapitalRate: number; wacc: number };
type Result = {
  symbol: string; asOf: string; verdict: string; gapYears: number | null; band: Band;
  explainedPct: number | null; thresholdMargin: number | null; monotonic: string;
  drivers: Drivers; verdictMarginal: string | null; gapYearsMarginal: number | null; skipReason: string | null;
  flags: { revenueCheck?: string; ebitSource?: string; growthIsHistorical?: boolean; industry?: string; damodaranAsOf?: string };
  sampleTotal: number | null; expectationTopPct: number | null;
};

const pct = (x: number | null | undefined, d = 1) => (x == null ? "—" : `${(x * 100).toFixed(d)}%`);

export default function RevDcfSection({ symbol }: { symbol: string }) {
  const t = useTranslations("RevDcf");
  const [r, setR] = useState<Result | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/api/revdcf?symbol=${encodeURIComponent(symbol)}`)
      .then((res) => res.json())
      .then((j) => { if (alive) { setR(j.result ?? null); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [symbol]);

  if (!loaded || !r) return null; // 로딩 중이거나 US 아님 → 미노출

  const v = r.verdict;
  const methodDependent = r.verdictMarginal != null && r.verdictMarginal !== v;
  const band = r.band;
  const bandExtreme = v === "years" && (band.minus1 === 0 || band.plus1 === 100 || (band.plus1 != null && band.minus1 != null && band.plus1 - band.minus1 > 10));
  const bandText = (n: number | null) => (n == null ? "—" : n === 0 ? t("belowOneShort") : n === 100 ? t("overCapShort") : `${n}${t("yUnit")}`);

  const badgeClass: Record<string, string> = {
    years: "bg-unjong-primary/15 text-unjong-primary",
    value_destroying: "bg-unjong-danger/15 text-unjong-danger",
    below_one: "bg-unjong-muted/15 text-unjong-muted",
    over_cap: "bg-unjong-accent/15 text-unjong-accent",
    skipped: "bg-unjong-muted/10 text-unjong-muted",
  };
  const badgeLabel = t(`badge.${v === "value_destroying" ? "valueDestroying" : v === "below_one" ? "belowOne" : v === "over_cap" ? "overCap" : v}`);

  const skipKey = r.skipReason === "INSUFFICIENT_HISTORY" ? "insufficientHistory" : r.skipReason === "NOT_APPLICABLE_SECTOR" ? "notApplicableSector" : r.skipReason === "NO_INDUSTRY" ? "noIndustry" : "missingTag";

  return (
    <section className="mt-6 rounded-2xl border border-unjong-border bg-unjong-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-unjong-muted">{t("sectionTitle")}</h2>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass[v] ?? ""}`}>{badgeLabel}</span>
      </div>

      {v === "years" && (
        <>
          <p className="text-lg font-bold text-unjong-primary">{t("headline.years", { n: r.gapYears ?? 0 })}</p>
          {bandExtreme ? (
            <>
              <div className="my-3 rounded-lg border border-unjong-accent/30 bg-unjong-accent/5 p-3 text-[13px] text-unjong-accent">{t("headline.wideBand")}</div>
              <table className="w-full text-[13px]">
                <tbody>
                  <tr className="border-b border-unjong-border"><td className="py-1.5 text-unjong-muted">{t("waccLow")}</td><td className="py-1.5 text-right tabular-nums">{bandText(band.minus1)}</td></tr>
                  <tr className="border-b border-unjong-border"><td className="py-1.5 text-unjong-muted">{t("waccBase")}</td><td className="py-1.5 text-right tabular-nums">{r.gapYears}{t("yUnit")}</td></tr>
                  <tr><td className="py-1.5 text-unjong-muted">{t("waccHigh")}</td><td className="py-1.5 text-right tabular-nums">{bandText(band.plus1)}</td></tr>
                </tbody>
              </table>
            </>
          ) : (
            <p className="mt-1 text-sm text-unjong-muted">{t("band.range", { lo: Math.min(band.minus1 ?? 0, band.plus1 ?? 0), hi: Math.max(band.minus1 ?? 0, band.plus1 ?? 0) })}</p>
          )}
          {r.expectationTopPct != null && r.sampleTotal != null && (
            <p className="mt-2 text-[13px] text-unjong-muted">{t("position", { n: r.gapYears ?? 0, pct: r.expectationTopPct, total: r.sampleTotal })}</p>
          )}
        </>
      )}

      {v === "value_destroying" && (
        <>
          <p className="text-lg font-bold text-unjong-danger">{t("headline.valueDestroying")}</p>
          <p className="mt-1 text-sm text-unjong-muted">{t("marginVsThreshold", { margin: pct(r.drivers.operatingMargin), threshold: pct(r.thresholdMargin) })}</p>
        </>
      )}
      {v === "below_one" && <p className="text-lg font-bold text-unjong-primary">{t("headline.belowOne")}</p>}
      {v === "over_cap" && (
        <>
          <p className="text-lg font-bold text-unjong-accent">{t("headline.overCap")}</p>
          {r.explainedPct != null && <p className="mt-1 text-sm text-unjong-muted">{t("overCapExplained", { pct: Math.round((r.explainedPct as number) * 100) })}</p>}
        </>
      )}
      {v === "skipped" && <p className="text-lg font-bold text-unjong-muted">{t(`skip.${skipKey}`)}</p>}

      {methodDependent && v !== "skipped" && (
        <div className="my-3 rounded-lg border border-unjong-border bg-unjong-background/40 p-3 text-[13px] text-unjong-muted">{t("methodDependent")}</div>
      )}

      {(v === "years" || v === "value_destroying" || v === "below_one") && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 border-t border-unjong-border pt-3 text-[13px] sm:grid-cols-2">
            <Row k={t("driver.growth")} val={pct(r.drivers.salesGrowth)} />
            <Row k={t("driver.margin")} val={pct(r.drivers.operatingMargin)} />
            <Row k={t("driver.threshold")} val={pct(r.thresholdMargin)} />
            <Row k={t("driver.wcRate")} val={pct(r.drivers.workingCapitalRate)} />
            <Row k={t("driver.capIntensity")} val={pct(r.drivers.fixedCapitalRate)} />
            <Row k={t("driver.wacc")} val={pct(r.drivers.wacc, 2)} />
          </div>
          <p className="mt-3 border-t border-unjong-border pt-2.5 text-[12px] text-unjong-muted">{t("growthNote")}</p>
          {r.flags.damodaranAsOf && <p className="mt-1 text-[12px] text-unjong-muted">{t("asOfNote", { date: String(r.flags.damodaranAsOf) })}</p>}
        </>
      )}
      <Link href="/revdcf" className="mt-2 block text-[12px] text-unjong-primary underline underline-offset-2">{t("methodologyLink")}</Link>
    </section>
  );
}

function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-unjong-muted">{k}</span>
      <span className="tabular-nums">{val}</span>
    </div>
  );
}
