"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WINDOWS = [
  { href: "/scalper", label: "단타창", time: "09:00~15:30", emoji: "⚡" },
  { href: "/longterm", label: "장타창", time: "저녁·주말", emoji: "🌳" },
  { href: "/us", label: "미국주식창", time: "22:30~05:00", emoji: "🌙" },
] as const;

export function WindowSwitcher() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2" aria-label="3창 전환">
      {WINDOWS.map((w) => {
        const isActive = pathname?.startsWith(w.href);
        return (
          <Link
            key={w.href}
            href={w.href}
            className={
              isActive
                ? "flex items-center gap-1.5 rounded-md border-2 border-unjong-accent bg-unjong-surface px-4 py-1.5 text-sm font-semibold text-unjong-primary shadow-sm"
                : "flex items-center gap-1.5 rounded-md border-2 border-transparent px-4 py-1.5 text-sm font-medium text-unjong-muted hover:bg-unjong-background hover:text-unjong-primary transition-colors"
            }
            aria-current={isActive ? "page" : undefined}
          >
            <span aria-hidden>{w.emoji}</span>
            <span>{w.label}</span>
            <span className="hidden lg:inline text-[10px] text-unjong-muted ml-1">
              {w.time}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
