"use client";
import { useTranslations } from "next-intl";

// STEP 854 §2 — 보드 배지 (순수 표시). verdict → 배지 1개. 정렬·필터 없음(851 §4 오해 미해결).
export default function RevDcfBadge({ verdict, gapYears }: { verdict: string | null | undefined; gapYears: number | null | undefined }) {
  const t = useTranslations("RevDcf");
  if (!verdict) return <span className="text-unjong-muted">—</span>;
  if (verdict === "years") return <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums bg-unjong-primary/15 text-unjong-primary">{gapYears}{t("yUnit")}</span>;
  if (verdict === "value_destroying") return <span className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-unjong-danger/15 text-unjong-danger">{t("boardBadge.valueDestroying")}</span>;
  if (verdict === "below_one") return <span className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-unjong-muted/15 text-unjong-muted">{t("boardBadge.belowOne")}</span>;
  if (verdict === "over_cap") return <span className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-unjong-accent/15 text-unjong-accent">{t("boardBadge.overCap")}</span>;
  return <span className="text-unjong-muted">—</span>; // skipped
}
