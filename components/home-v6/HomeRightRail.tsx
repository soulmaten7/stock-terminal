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
    <aside className="hidden lg:block space-y-5 sticky top-5 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* 아이콘 nav */}
      <div className="flex items-center justify-around bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft py-3">
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

      {/* 관심 종목 */}
      <div className="h-[420px]">
        <WatchlistPanel />
      </div>

      {/* 숏컷/머니스토리 placeholder */}
      <div className="bg-unjong-surface rounded-2xl border border-dashed border-unjong-border p-5">
        <h3 className="text-sm font-bold text-unjong-primary mb-1">숏컷 · 머니스토리</h3>
        <p className="text-xs text-unjong-muted">콘텐츠 영역 — 운종 방향으로 추후 채움</p>
        <div className="mt-3 h-20 rounded-xl bg-unjong-background flex items-center justify-center text-xs text-unjong-muted">placeholder</div>
      </div>
    </aside>
  );
}
