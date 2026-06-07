"use client";

import Link from "next/link";
import { Bell, Star, Briefcase, Clock } from "lucide-react";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import HomeLiveChat from "./HomeLiveChat";

export default function HomeRightRail() {
  const nav = [
    { icon: Bell, label: "알림", href: "/mypage" },
    { icon: Star, label: "관심", href: "/" },
    { icon: Briefcase, label: "보유", href: "/mypage" },
    { icon: Clock, label: "최근", href: "/" },
  ];
  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-6rem)] gap-3 self-start lg:flex">
      {/* 위=실시간채팅(~반화면) / 아래=관심종목 */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <HomeLiveChat />
        <div className="min-h-0 flex-1 overflow-hidden">
          <WatchlistPanel />
        </div>
      </div>

      {/* 오른쪽 끝 세로 아이콘 탭 (토스식) */}
      <nav
        className="flex w-12 shrink-0 flex-col items-center gap-5 rounded-2xl border border-unjong-border bg-unjong-surface py-4 shadow-soft"
        aria-label="우측 바로가기"
      >
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.label}
              href={n.href}
              title={n.label}
              className="flex flex-col items-center gap-1 text-unjong-muted transition-colors hover:text-unjong-primary"
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
