"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import UsIpoFeed from "./UsIpoFeed";
import UsDividendFeed from "./UsDividendFeed";

export default function UsOfferingsFeed() {
  const t = useTranslations("Feed");
  const [view, setView] = useState<"ipo" | "div">("ipo");
  return (
    <div>
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setView("ipo")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${view === "ipo" ? "bg-unjong-strong text-white" : "text-unjong-muted hover:bg-unjong-background"}`}
        >
          {t("offerings.ipo")}
        </button>
        <button
          type="button"
          onClick={() => setView("div")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${view === "div" ? "bg-unjong-strong text-white" : "text-unjong-muted hover:bg-unjong-background"}`}
        >
          {t("offerings.dividend")}
        </button>
      </div>
      {view === "ipo" ? <UsIpoFeed /> : <UsDividendFeed />}
    </div>
  );
}
