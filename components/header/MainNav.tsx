"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Calendar } from "lucide-react";

const PRIMARY_WINDOWS = [
  { href: "/scalper", label: "단타창", emoji: "⚡" },
  { href: "/longterm", label: "장타창", emoji: "🌳" },
  { href: "/us", label: "미국주식창", emoji: "🌙" },
] as const;

const SECONDARY_LINKS = [
  { href: "/screener", label: "스크리너", icon: Search },
  { href: "/calendar", label: "캘린더", icon: Calendar },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center justify-between border-b border-unjong-border bg-unjong-background px-4 py-2"
      aria-label="메인 네비"
    >
      {/* 좌측: 운종 3창 */}
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

      {/* 우측: 보조 링크 */}
      <div className="flex items-center gap-3">
        {SECONDARY_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary"
          >
            <Icon size={14} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
