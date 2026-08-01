"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// STEP 853/855 — 역DCF 종목페이지 섹션. US 전용(데이터 자체가 US뿐이라 KR/타국은 result=null → 미노출).
// 5분기 헤드라인 + 자본비용 시나리오(3점·기본 표시) + 순위(방향 명시) + 적자 분기 + 드라이버 설명 + 판정 분기. 다크·모바일·ko/en.

type Band = { minus1: number | null; plus1: number | null };
type Drivers = { salesGrowth: number; operatingMargin: number; startingMargin: number; taxRate: number; fixedCapitalRate: number; fixedCapitalRateLevel: number | null; fixedCapitalRateMarginal: number | null; workingCapitalRate: number; wacc: number };
type Result = {
  symbol: string; asOf: string; verdict: string; gapYears: number | null; band: Band;
  explainedPct: number | null; thresholdMargin: number | null; monotonic: string;
  drivers: Drivers; verdictMarginal: string | null; gapYearsMarginal: number | null; skipReason: string | null;
  flags: { revenueCheck?: string; ebitSource?: string; growthIsHistorical?: boolean; industry?: string; damodaranAsOf?: string };
  sampleTotal: number | null; rankFromLongest: number | null; expectationLevel: "low" | "mid" | "high" | null;
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
  const d = r.drivers;
  // 🔴 856 §1 — 영업적자(마진 ≤ 0)는 verdict 무관 "적용 밖"(표시 계층 분기 · 엔진·DB 불변).
  //   years 4·over_cap 11·value_destroying 63 전부 여기 걸림 → 적자에 "N년 성장 요구"·"설명 불가" 문구가 뜨던 것 차단.
  const lossMaking = d.operatingMargin != null && d.operatingMargin <= 0;
  // §6 — 판정(verdict)이 방법에 따라 갈리는 경우만(숫자만 다른 건 제외).
  const methodDependent = r.verdictMarginal != null && r.verdictMarginal !== v;

  // §3 — 자본비용 3점 시나리오(항상 표시). 낮은 자본비용(−1%p) ↔ band.minus1, 높은(+1%p) ↔ band.plus1.
  const wpct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const wBase = d.wacc, wLow = d.wacc - 0.01, wHigh = d.wacc + 0.01;
  const gapText = (n: number | null) => (n == null ? "—" : n === 0 ? t("belowOneShort") : n === 100 ? t("overCapShort") : `${n}${t("yUnit")}`);
  const bandCross = v === "years" && (r.band.minus1 === 0 || r.band.plus1 === 100);
  const verdictShort = (vd: string | null, gap: number | null) =>
    vd === "years" ? (gap != null ? `${gap}${t("yUnit")}` : "—")
    : vd === "value_destroying" ? t("boardBadge.valueDestroying")
    : vd === "below_one" ? t("boardBadge.belowOne")
    : vd === "over_cap" ? t("boardBadge.overCap") : "—";

  const badgeClass: Record<string, string> = {
    years: "bg-unjong-primary/15 text-unjong-primary",
    value_destroying: "bg-unjong-danger/15 text-unjong-danger",
    below_one: "bg-unjong-muted/15 text-unjong-muted",
    over_cap: "bg-unjong-accent/15 text-unjong-accent",
    skipped: "bg-unjong-muted/10 text-unjong-muted",
  };
  // 🔴 856 §2 — 배지도 lossMaking을 봐야 본문과 같은 말을 한다. 적자 = 중립(muted)·위험색 금지(우리 판정 아님·적용 밖).
  const badgeKey = lossMaking ? "skipped" : v;
  const badgeLabel = lossMaking ? t("outOfScope") : t(`badge.${v === "value_destroying" ? "valueDestroying" : v === "below_one" ? "belowOne" : v === "over_cap" ? "overCap" : v}`);
  const skipKey = r.skipReason === "INSUFFICIENT_HISTORY" ? "insufficientHistory" : r.skipReason === "NOT_APPLICABLE_SECTOR" ? "notApplicableSector" : r.skipReason === "NO_INDUSTRY" ? "noIndustry" : "missingTag";

  return (
    <section className="mt-6 rounded-2xl border border-unjong-border bg-unjong-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-unjong-muted">{t("sectionTitle")}</h2>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass[badgeKey] ?? ""}`}>{badgeLabel}</span>
      </div>

      {/* 🔴 856 §1 — 적자면 verdict 무관 "적용 밖" 문구(중립색). 아래 verdict 헤드라인은 전부 !lossMaking 게이트. */}
      {lossMaking && <p className="text-lg font-bold text-unjong-muted">{t("lossMaking")}</p>}

      {!lossMaking && v === "years" && (
        <>
          <p className="text-lg font-bold text-unjong-primary">{t("headline.years", { n: r.gapYears ?? 0 })}</p>
          {bandCross && <div className="my-3 rounded-lg border border-unjong-accent/30 bg-unjong-accent/5 p-3 text-[13px] text-unjong-accent">{t("bandCrossWarning")}</div>}
          {/* §3 자본비용 시나리오 — 좁든 넓든 동일 형식·실제 WACC 수치 노출 */}
          <p className="mt-3 text-[12px] font-medium text-unjong-muted">{t("scenarioTitle")}</p>
          <table className="mt-1 w-full text-[13px]">
            <tbody>
              <tr className="border-b border-unjong-border"><td className="py-1.5 text-unjong-muted">{t("driver.wacc")} {wpct(wLow)}</td><td className="py-1.5 text-right tabular-nums">{gapText(r.band.minus1)}</td></tr>
              <tr className="border-b border-unjong-border"><td className="py-1.5 text-unjong-muted">{t("driver.wacc")} {wpct(wBase)} · {t("waccBase")}</td><td className="py-1.5 text-right font-semibold tabular-nums">{r.gapYears}{t("yUnit")}</td></tr>
              <tr><td className="py-1.5 text-unjong-muted">{t("driver.wacc")} {wpct(wHigh)}</td><td className="py-1.5 text-right tabular-nums">{gapText(r.band.plus1)}</td></tr>
            </tbody>
          </table>
          {/* §2 순위 — "상위 x%" 폐기·방향 명시(긴 것=기대 높음) */}
          {r.sampleTotal != null && r.rankFromLongest != null && r.expectationLevel && (
            <p className="mt-2.5 text-[13px] text-unjong-muted">
              <span className="font-medium text-unjong-primary">{t(`expectationLevel.${r.expectationLevel}`)}</span>
              {" · "}{t("rankLine", { rank: r.rankFromLongest, total: r.sampleTotal })}
            </p>
          )}
          {r.sampleTotal != null && <p className="mt-0.5 text-[12px] text-unjong-muted">{t("sampleNote", { total: r.sampleTotal })}</p>}
        </>
      )}

      {!lossMaking && v === "value_destroying" && (
        <>
          <p className="text-lg font-bold text-unjong-danger">{t("headline.valueDestroying")}</p>
          <p className="mt-1 text-sm text-unjong-muted">{t("marginVsThreshold", { margin: pct(d.operatingMargin), threshold: pct(r.thresholdMargin) })}</p>
        </>
      )}
      {!lossMaking && v === "below_one" && <p className="text-lg font-bold text-unjong-primary">{t("headline.belowOne")}</p>}
      {!lossMaking && v === "over_cap" && (
        <>
          <p className="text-lg font-bold text-unjong-accent">{t("headline.overCap")}</p>
          {r.explainedPct != null && <p className="mt-1 text-sm text-unjong-muted">{t("overCapExplained", { pct: Math.round((r.explainedPct as number) * 100) })}</p>}
        </>
      )}
      {v === "skipped" && <p className="text-lg font-bold text-unjong-muted">{t(`skip.${skipKey}`)}</p>}

      {/* §6 판정 분기 — 무엇이 어떻게 갈리는지 실제 값으로 */}
      {methodDependent && v !== "skipped" && !lossMaking && (
        <div className="my-3 rounded-lg border border-unjong-border bg-unjong-background/40 p-3 text-[13px]">
          <p className="font-medium text-unjong-primary">{t("methodSplitTitle")}</p>
          <div className="mt-1.5 flex justify-between text-unjong-muted"><span>{t("methodLevel")}</span><span className="tabular-nums">{verdictShort(v, r.gapYears)}</span></div>
          <div className="mt-0.5 flex justify-between text-unjong-muted"><span>{t("methodMarginal")}</span><span className="tabular-nums">{verdictShort(r.verdictMarginal, r.gapYearsMarginal)}</span></div>
        </div>
      )}

      {(lossMaking || v === "years" || v === "value_destroying" || v === "below_one") && (
        <>
          {/* §5 드라이버 — 라벨 + 한 줄 설명(툴팁 아님·모바일 대응). 🔴 856 §3: 적자면 사유(영업이익률)만 남기고 숨김. */}
          {lossMaking ? (
            <div className="mt-4 border-t border-unjong-border pt-3">
              <DriverRow k={t("driver.margin")} desc={t("driverDesc.margin")} val={pct(d.operatingMargin)} />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2.5 border-t border-unjong-border pt-3 sm:grid-cols-2">
              <DriverRow k={t("driver.growth")} desc={t("driverDesc.growth")} val={pct(d.salesGrowth)} />
              <DriverRow k={t("driver.margin")} desc={t("driverDesc.margin")} val={pct(d.operatingMargin)} />
              <DriverRow k={t("driver.threshold")} desc={t("driverDesc.threshold")} val={pct(r.thresholdMargin)} />
              <DriverRow k={t("driver.wcRate")} desc={t("driverDesc.wcRate")} val={pct(d.workingCapitalRate)} />
              <DriverRow k={t("driver.capIntensity")} desc={t("driverDesc.capIntensity")} val={pct(d.fixedCapitalRate)} />
              <DriverRow k={t("driver.wacc")} desc={t("driverDesc.wacc")} val={pct(d.wacc, 2)} />
            </div>
          )}
          {/* 적용 밖이어도 우리가 무엇을 봤는지는 밝힌다(growthIsHistorical·기준일·방법론 링크 유지) */}
          <p className="mt-3 border-t border-unjong-border pt-2.5 text-[12px] text-unjong-muted">{t("growthNote")}</p>
          {r.flags.damodaranAsOf && <p className="mt-1 text-[12px] text-unjong-muted">{t("asOfNote", { date: String(r.flags.damodaranAsOf) })}</p>}
        </>
      )}
      <Link href="/revdcf" className="mt-2 block text-[12px] text-unjong-primary underline underline-offset-2">{t("methodologyLink")}</Link>
    </section>
  );
}

function DriverRow({ k, desc, val }: { k: string; desc: string; val: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-unjong-primary">{k}</div>
        <div className="text-[11px] leading-snug text-unjong-muted">{desc}</div>
      </div>
      <span className="shrink-0 tabular-nums text-unjong-primary">{val}</span>
    </div>
  );
}
