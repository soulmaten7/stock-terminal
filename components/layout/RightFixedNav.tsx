"use client";

import Link from "next/link";
import { Bell, Star, Briefcase, Clock } from "lucide-react";

export default function RightFixedNav() {
  return (
    <nav className="fixed right-0 top-1/2 -translate-y-1/2 w-12 bg-unjong-surface border border-unjong-border rounded-l-xl shadow-soft py-2 flex flex-col items-center gap-1 z-40">
      <Link href="/mypage" className="p-2 rounded-lg text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background transition-colors" title="알림">
        <Bell size={18} />
      </Link>
      <Link href="/" className="p-2 rounded-lg text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background transition-colors" title="관심 종목">
        <Star size={18} />
      </Link>
      <Link href="/mypage" className="p-2 rounded-lg text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background transition-colors" title="내 종목">
        <Briefcase size={18} />
      </Link>
      <Link href="/" className="p-2 rounded-lg text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background transition-colors" title="최근 본">
        <Clock size={18} />
      </Link>
    </nav>
  );
}
