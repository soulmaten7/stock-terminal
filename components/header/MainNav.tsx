"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays } from "lucide-react";
import { HeaderSearch } from "./HeaderSearch";

const PRIMARY_WINDOWS = [
  { href: "/kr", label: "한국주식", emoji: "🇰🇷" },
  { href: "/us", label: "미국주식", emoji: "🇺🇸" },
] as const;

const SECONDARY_LINKS = [
  { href: "/screener", label: "종목발굴", englishLabel: "Screener", icon: BarChart3 },
  { href: "/calendar", label: "경제 캘린더", englishLabel: "Calendar", icon: CalendarDays },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      className="grid grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-unjong-border bg-unjong-background px-4 py-2"
      aria-label="메인 네비"
    >
      {/* 좌측: 운종 2창 (한국/미국) */}
      <div className="flex items-center gap-2">
        {PRIMARY_WINDOWS.map((w) => {
          const isActive = pathname?.startsWith(w.href);
          return (
            <Link
              key={w.href}
              href={w.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "flex items-center gap-1 rounded-md border-2 border-unjong-accent bg-unjong-surface px-3 py-1 text-sm font-semibold text-unjong-primary shadow-sm"
                  : "flex items-center gap-1 rounded-md border-2 border-transparent px-3 py-1 text-sm font-medium text-unjong-muted hover:bg-unjong-surface hover:text-unjong-primary"
              }
            >
              <span aria-hidden>{w.emoji}</span>
              <span>{w.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 가운데: 검색 (flex-1) */}
      <HeaderSearch />

      {/* 우측: 보조 링크 */}
      <div className="flex items-center gap-3 justify-self-end">
        {SECONDARY_LINKS.map(({ href, label, englishLabel, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-primary transition-colors"
          >
            <Icon size={14} />
            <span className="font-medium">{label}</span>
            <span className="text-xs text-unjong-muted">({englishLabel})</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
