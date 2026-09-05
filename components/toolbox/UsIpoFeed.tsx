"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCache, setCache } from "@/lib/clientCache";

type UsIpoItem = { ticker: string; name: string; exchange: string; price: string; date: string; dealSize: string; status: "upcoming" | "priced" };

const SRC = "https://www.nasdaq.com/market-activity/ipos";

export default function UsIpoFeed() {
  const t = useTranslations("Feed");
  const [items, setItems] = useState<UsIpoItem[]>(() => getCache<UsIpoItem[]>("usipo") ?? []);
  const [loading, setLoading] = useState(() => getCache("usipo") === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ipo/us-feed")
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache("usipo", list); setLoading(false); } })
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
        <p className="text-sm text-unjong-muted">{t("usIpo.empty")}</p>
        <a href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-xs text-unjong-mint">{t("usIpo.direct")}</a>
      </div>
    );

  const price = (p: string) => (p ? (p.startsWith("$") ? p : `$${p}`) : "");
  const upcoming = items.filter((i) => i.status === "upcoming");
  const priced = items.filter((i) => i.status === "priced");

  const inner = (it: UsIpoItem) => (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-unjong-primary group-hover:text-unjong-mint">
          {it.name} <span className="text-unjong-muted">{it.ticker}</span>
        </p>
        <span className="shrink-0 text-[11px] font-medium text-unjong-primary">{it.date}</span>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-unjong-muted">
        {[it.exchange, price(it.price), it.dealSize].filter(Boolean).join(" · ")}
      </p>
    </>
  );
  // priced=상장 완료 → 내부 종목상세(TR-AI 렌즈), upcoming=미상장 → Nasdaq 외부
  const Row = (it: UsIpoItem) =>
    it.status === "priced" ? (
      <Link key={"p" + it.ticker} href={`/stock/${it.ticker}`} className="group block border-b border-unjong-border py-2.5 last:border-0">{inner(it)}</Link>
    ) : (
      <a key={"u" + it.ticker} href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="group block border-b border-unjong-border py-2.5 last:border-0">{inner(it)}</a>
    );

  return (
    <div>
      {upcoming.length > 0 && (
        <>
          <p className="mb-2 text-sm font-bold text-unjong-primary">{t("usIpo.upcoming")}</p>
          <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-surface px-3">{upcoming.map(Row)}</div>
        </>
      )}
      {priced.length > 0 && (
        <>
          <p className="mb-2 text-sm font-bold text-unjong-primary">{t("usIpo.priced")}</p>
          <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">{priced.map(Row)}</div>
        </>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{t("usIpo.source")}</p>
    </div>
  );
}
