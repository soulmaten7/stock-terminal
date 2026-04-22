'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Filter, Star, LineChart, TrendingUp, Flame, BarChart3, Newspaper,
  FileText, Calendar, Sun, Globe, PieChart, BookMarked,
  ListOrdered, Activity,
} from 'lucide-react';

type LucideIcon = typeof Star;

interface NavItem { icon: LucideIcon; label: string; href: string; }

const GROUPS: NavItem[][] = [
  // 핵심
  [
    { icon: Star,   label: '관심종목',  href: '/watchlist' },
    { icon: Filter, label: '종목 발굴', href: '/screener' },
  ],
  // 분석
  [
    { icon: LineChart,   label: '차트',   href: '/chart' },
    { icon: ListOrdered, label: '호가창', href: '/orderbook' },
    { icon: Activity,    label: '체결창', href: '/ticks' },
  ],
  // 시장 흐름
  [
    { icon: TrendingUp, label: '급등락',      href: '/movers/price' },
    { icon: Flame,      label: '거래량',      href: '/movers/volume' },
    { icon: BarChart3,  label: '수급',        href: '/net-buy' },
    { icon: Globe,      label: '글로벌 지수', href: '/global' },
    { icon: PieChart,   label: '시장 지도',   href: '/analysis' },
  ],
  // 정보
  [
    { icon: Newspaper, label: '뉴스 속보',   href: '/news' },
    { icon: FileText,  label: '공시',        href: '/disclosures' },
    { icon: Calendar,  label: '경제 캘린더', href: '/calendar' },
    { icon: Sun,       label: '장전 브리핑', href: '/briefing' },
  ],
  // 도구
  [
    { icon: BookMarked, label: '참고 사이트', href: '/toolbox' },
  ],
];

export default function TopNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isActive = (href: string) => {
    if (!mounted) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
      <div className="px-6 h-11 flex items-center overflow-x-auto">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center shrink-0">
            {gi > 0 && <div aria-hidden="true" className="w-px h-5 bg-[#E5E7EB] mx-3 shrink-0" />}
            {group.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-3 h-11 text-xs whitespace-nowrap transition-colors shrink-0 ${
                    active ? 'text-[#0ABAB5] font-bold' : 'text-[#444] hover:text-black'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0ABAB5]' : ''}`} />
                  <span>{item.label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#0ABAB5] rounded-t"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
