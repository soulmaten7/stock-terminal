"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderSearch } from "./HeaderSearch";

// 토스식 상단 4탭 (트릴리언). 뉴스는 종목 안+홈으로, 평가·검증은 토론·평가 탭으로 통합. 거래·코인 제외.
const MENU = [
  { href: "/", label: "홈", match: (p: string) => p === "/" },
  { href: "/market", label: "마켓", match: (p: string) => /^\/(market|kr|us|stock)/.test(p) },
  { href: "/discussion", label: "토론·평가", match: (p: string) => /^\/(discussion|product|room|reviews)/.test(p) },
  { href: "/mypage", label: "MY", match: (p: string) => p.startsWith("/mypage") },
] as const;

export function MainNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="flex items-center gap-4 border-b border-unjong-border bg-unjong-background px-4"
      aria-label="메인 네비"
    >
      {/* 좌측: 토스식 4탭 (active = 하단 굵은 밑줄) */}
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
