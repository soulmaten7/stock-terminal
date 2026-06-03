"use client";

import Link from "next/link";
import { ArrowLeftRight, MessageSquare, FileText } from "lucide-react";

export default function HomeQuickLinks() {
  const pills = [
    { label: "오늘의 환율", href: "/calendar", icon: ArrowLeftRight, note: "" },
    { label: "오늘의 토론", href: "/", icon: MessageSquare, note: "" },
    { label: "많이 보는 리포트", href: "#", icon: FileText, note: "준비 중" },
  ];
  return (
    <section className="flex flex-wrap gap-3">
      {pills.map((p) => {
        const Icon = p.icon;
        return (
          <Link
            key={p.label}
            href={p.href}
            className="flex items-center gap-2 rounded-full bg-unjong-surface border border-unjong-border shadow-soft px-4 py-2.5 text-sm font-medium text-unjong-primary hover:border-unjong-accent transition-colors"
          >
            <Icon size={15} className="text-unjong-accent" />
            {p.label}
            {p.note && <span className="text-xs text-unjong-muted">· {p.note}</span>}
          </Link>
        );
      })}
    </section>
  );
}
