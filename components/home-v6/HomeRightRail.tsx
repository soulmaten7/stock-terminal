"use client";

import Link from "next/link";
import { Bell, Star, Briefcase, Clock } from "lucide-react";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";

export default function HomeRightRail() {
  const nav = [
    { icon: Bell, label: "알림", href: "/mypage" },
    { icon: Star, label: "관심", href: "/" },
    { icon: Briefcase, label: "보유", href: "/mypage" },
    { icon: Clock, label: "최근", href: "/" },
  ];
  return (
    <aside className="hidden lg:flex gap-3 sticky top-5 self-start h-[calc(100vh-6rem)]">
      {/* 관심종목 (왼쪽, 남은 폭 가득) — 추후 채팅 탭도 이 영역 */}
      <div className="flex-1 min-w-0">
        <WatchlistPanel />
      </div>

      {/* 오른쪽 끝 세로 아이콘 탭 (토스식) */}
      <nav
        className="flex flex-col items-center gap-5 shrink-0 w-12 bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft py-4"
        aria-label="우측 바로가기"
      >
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.label}
              href={n.href}
              title={n.label}
              className="flex flex-col items-center gap-1 text-unjong-muted hover:text-unjong-primary transition-colors"
            >
              <Icon size={18} />
              <span className="text-[9px]">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
