"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { gicsLabel } from "@/lib/sectorLabel";

// STEP 957 §3 — Q1 카드 골격. RevDcfSection.tsx와 같은 구조(로딩·에러·빈 상태)를 따르되 복붙하지 않는다.
// 🔴 US 전용(API가 KR 6자리 심볼·플래그 OFF를 404로 막음 — 이 컴포넌트는 그 404를 미노출로 처리할 뿐 자체 분기 없음).
// 🔴 역DCF는 API에는 실려 오지만 이번 골격에는 그리지 않는다(C안의 「심층」 배치는 별도 판정, §3-4).

type Axis = "per" | "pbr" | "psr" | "evEbitda";
const AXES: Axis[] = ["per", "pbr", "psr", "evEbitda"];
type AxisData = { value: number | null; pct: number | null; n: number | null; unavailable: string | null };
type Result = {
  symbol: string; asOf: string; sector: string | null; sectorSource: string | null;
  axes: Record<Axis, AxisData>;
  fiscalYear: number | null; perBasis: string | null;
  revdcf: { verdict: string; gapYears: number | null } | null;
  yearWindow: number[] | null;
};

const fmtValue = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}x`);
const fmtPct = (p: number | null) => (p == null ? "—" : `${Math.round(p * 100)}%`);

export default function Q1Section({ symbol }: { symbol: string }) {
  const t = useTranslations("Q1");
  const tEtf = useTranslations("EtfLens");
  const [r, setR] = useState<Result | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/api/q1/${encodeURIComponent(symbol)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((j) => { if (alive) { setR(j); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [symbol]);

  if (!loaded || !r) return null; // 로딩 중이거나 플래그 OFF·US 아님·데이터 없음 → 미노출

  const per = r.axes.per;
  const sectorLabelText = r.sector ? gicsLabel(r.sector, tEtf) : null;

  // 🔴 §3-3 — 미성립 세 가지를 같은 문구로 덮지 않는다. NO_SECTOR/NO_VALUE/SAMPLE_TOO_SMALL 각각 다른 키.
  const unavailableText = (code: string | null) =>
    code === "NO_SECTOR" ? t("unavailable.noSector")
    : code === "NO_VALUE" ? t("unavailable.noValue")
    : code === "SAMPLE_TOO_SMALL" ? t("unavailable.sampleTooSmall")
    : null;

  return (
    <section className="mt-6 rounded-2xl border border-unjong-border bg-unjong-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-unjong-muted">{t("sectionTitle")}</h2>
      </div>

      {per.unavailable == null ? (
        <p className="text-lg font-bold text-unjong-primary">{t("headline", { pct: Math.round((per.pct ?? 0) * 100), n: per.n ?? 0 })}</p>
      ) : (
        <p className="text-lg font-bold text-unjong-muted">{unavailableText(per.unavailable)}</p>
      )}

      {/* §3-2 — 4축을 나란히: 축 이름 · 값 · 업종 내 백분위 · 표본 수(n). 값에 출처(n)를 실어 보낸다. */}
      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2.5 border-t border-unjong-border pt-3 sm:grid-cols-2">
        {AXES.map((axis) => {
          const a = r.axes[axis];
          const reason = unavailableText(a.unavailable);
          return (
            <div key={axis} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-unjong-primary">{t(`axis.${axis}`)}</div>
                <div className="text-[11px] leading-snug text-unjong-muted">
                  {reason ?? (a.n != null ? t("sampleNote", { n: a.n }) : "—")}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="tabular-nums text-unjong-primary">{fmtValue(a.value)}</div>
                <div className="tabular-nums text-[11px] text-unjong-muted">{reason ? "—" : fmtPct(a.pct)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 맨 아래 — 어느 회계연도 기준인지 + 섹터 출처. 규칙 5-2 ④ 결과에 출처를 실어 보낸다. */}
      <p className="mt-3 border-t border-unjong-border pt-2.5 text-[12px] text-unjong-muted">
        {r.fiscalYear != null && t("fiscalYearNote", { year: r.fiscalYear })}
        {r.fiscalYear != null && sectorLabelText && " · "}
        {sectorLabelText && r.sectorSource && t("sectorSourceNote", { sector: sectorLabelText, source: r.sectorSource })}
      </p>
    </section>
  );
}
