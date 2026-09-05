"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCache, setCache } from "@/lib/clientCache";

type UsDivItem = { symbol: string; name: string; exDate: string; payDate: string; amount: string };

const SRC = "https://www.nasdaq.com/market-activity/dividends";

export default function UsDividendFeed() {
  const t = useTranslations("Feed");
  const [items, setItems] = useState<UsDivItem[]>(() => getCache<UsDivItem[]>("usdiv") ?? []);
  const [loading, setLoading] = useState(() => getCache("usdiv") === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dividends/us-feed")
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache("usdiv", list); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading)
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-unjong-background" />)}
      </div>
    );
  if (items.length === 0)
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-unjong-muted">{t("usDiv.empty")}</p>
        <a href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-xs text-unjong-mint">{t("usDiv.direct")}</a>
      </div>
    );

  const amt = (a: string) => (a ? (a.startsWith("$") ? a : `$${a}`) : "");
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">{t("usDiv.title")}</p>
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {items.map((it) => (
          <Link key={it.symbol + it.exDate} href={`/stock/${it.symbol}`} className="group block border-b border-unjong-border py-2.5 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-unjong-primary group-hover:text-unjong-mint">
                {it.name} <span className="text-unjong-muted">{it.symbol}</span>
              </p>
              <span className="shrink-0 text-[11px] font-medium text-unjong-primary">{t("usDiv.ex", { d: it.exDate })}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-unjong-muted">
              {[amt(it.amount) && t("usDiv.amount", { v: amt(it.amount) }), it.payDate && t("usDiv.pay", { d: it.payDate })].filter(Boolean).join(" · ")}
            </p>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{t("usDiv.source")}</p>
    </div>
  );
}
