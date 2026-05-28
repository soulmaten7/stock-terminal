"use client";

import { usePathname } from "next/navigation";

type ContextMenu = { id: string; label: string; emoji: string };

const CONTEXT_MENUS: Record<string, ContextMenu[]> = {
  "/scalper": [
    { id: "card-movers",    label: "Movers",   emoji: "🚀" },
    { id: "card-volume",    label: "Volume",   emoji: "🔥" },
    { id: "card-vi",        label: "VI",       emoji: "🚨" },
    { id: "card-netbuy",    label: "NetBuy",   emoji: "💰" },
    { id: "card-disclosure",label: "공시",     emoji: "📄" },
    { id: "card-theme",     label: "테마",     emoji: "🎯" },
    { id: "card-short",     label: "공매도",   emoji: "⚠️" },
  ],
  "/longterm": [
    { id: "card-disclosure",label: "공시",       emoji: "📊" },
    { id: "card-earnings",  label: "분기실적",   emoji: "📅" },
    { id: "card-value",     label: "저평가",     emoji: "💎" },
    { id: "card-dividend",  label: "배당TOP",    emoji: "💰" },
    { id: "card-lows",      label: "52주신저가", emoji: "📉" },
    { id: "card-sector",    label: "섹터",       emoji: "🗺️" },
    { id: "card-warning",   label: "관리종목",   emoji: "⚠️" },
  ],
  "/us": [
    { id: "card-indices",   label: "지수+VIX",  emoji: "🌐" },
    { id: "card-prepost",   label: "Pre/After", emoji: "🌅" },
    { id: "card-m7",        label: "M7",        emoji: "⭐" },
    { id: "card-movers",    label: "Movers",    emoji: "🇺🇸" },
    { id: "card-forex",     label: "환율+시계", emoji: "💱" },
    { id: "card-news",      label: "뉴스+8K",   emoji: "📰" },
    { id: "card-fomc",      label: "FOMC",      emoji: "📅" },
  ],
};

export function ContextNav() {
  const pathname = usePathname();
  const menus = pathname ? CONTEXT_MENUS[pathname] : undefined;

  if (!menus || menus.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("unjong-card-highlight");
    setTimeout(() => el.classList.remove("unjong-card-highlight"), 1500);
  };

  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto border-b border-unjong-border bg-unjong-surface px-4 py-1.5"
      aria-label="창별 컨텍스트 네비"
    >
      {menus.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => handleClick(m.id)}
          className="flex items-center gap-1 rounded px-2.5 py-1 text-xs text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background whitespace-nowrap"
        >
          <span aria-hidden>{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </nav>
  );
}
