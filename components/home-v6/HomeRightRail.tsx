"use client";

import Link from "next/link";
import { Bell, Star, Briefcase, Clock } from "lucide-react";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";

export default function HomeRightRail() {
  const nav = [
    { icon: Bell, label: "알림", href: "/mypage" },
    { icon: Star, label: "관심종목", href: "/" },
    { icon: Briefcase, label: "보유종목", href: "/mypage" },
    { icon: Clock, label: "최근 본", href: "/" },
  ];
  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-5 self-start h-[calc(100vh-6rem)]">
      {/* 아이콘 nav */}
      <div className="flex items-center justify-around bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft py-3 flex-shrink-0">
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <Link key={n.label} href={n.href} title={n.label} className="flex flex-col items-center gap-1 text-unjong-muted hover:text-unjong-primary transition-colors">
              <Icon size={18} />
              <span className="text-[10px]">{n.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 관심 종목 (남은 높이 가득) — 추후 이 컬럼에 채팅 탭 추가 예정 */}
      <div className="flex-1 min-h-0">
        <WatchlistPanel />
      </div>
    </aside>
  );
}
