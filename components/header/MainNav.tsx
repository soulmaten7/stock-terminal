"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderSearch } from "./HeaderSearch";

// 네이버 증권식 상단 6메뉴 (운종). 코인·거래 제외, 평가·검증 = 운종 차별점.
const MENU = [
  { href: "/", label: "홈", match: (p: string) => p === "/" },
  { href: "/market", label: "마켓", match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: "/discussion", label: "토론", match: (p: string) => p.startsWith("/discussion") },
  { href: "/news", label: "뉴스", match: (p: string) => p.startsWith("/news") },
  { href: "/products", label: "평가·검증", match: (p: string) => /^\/(product|room|reviews)/.test(p) },
  { href: "/mypage", label: "MY", match: (p: string) => p.startsWith("/mypage") },
] as const;

export function MainNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="flex items-center gap-4 border-b border-unjong-border bg-unjong-background px-4"
      aria-label="메인 네비"
    >
      {/* 좌측: 네이버식 6메뉴 (active = 하단 굵은 밑줄) */}
      <div className="flex items-center shrink-0">
        {MENU.map((m) => {
          const isActive = m.match(pathname);
          return (
            <Link
              key={m.label}
              href={m.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "px-3 py-3 text-sm font-bold text-unjong-primary border-b-2 border-unjong-primary -mb-px transition-colors"
                  : "px-3 py-3 text-sm font-medium text-unjong-muted hover:text-unjong-primary border-b-2 border-transparent -mb-px transition-colors"
              }
            >
              {m.label}
            </Link>
          );
        })}
      </div>

      {/* 우측: 검색 (남은 폭 채움) */}
      <div className="flex-1 min-w-0 py-1.5">
        <HeaderSearch />
      </div>
    </nav>
  );
}
