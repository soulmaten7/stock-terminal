'use client';

import Link from 'next/link';
import {
  Home,
  Star,
  BarChart3,
  Flame,
  LineChart,
  Newspaper,
  Calendar,
  Rocket,
  DollarSign,
  Cpu,
  Globe,
  AlertTriangle,
} from 'lucide-react';

const ITEMS = [
  { icon: Home, label: '홈', href: '/' },
  { icon: Star, label: '관심종목', href: '/#section-watchlist' },
  { icon: BarChart3, label: '수급', href: '/#section-flow' },
  { icon: Flame, label: '거래량 급등', href: '/#section-volume' },
  { icon: LineChart, label: '코스피·코스닥', href: '/#section-market-charts' },
  { icon: Newspaper, label: '속보', href: '/#section-news' },
  { icon: Calendar, label: '경제지표', href: '/#section-economic' },
  { icon: Rocket, label: 'IPO', href: '/#section-ipo' },
  { icon: DollarSign, label: '실적', href: '/#section-earnings' },
  { icon: Cpu, label: '프로그램매매', href: '/#section-program' },
  { icon: Globe, label: '글로벌 선물', href: '/#section-global' },
  { icon: AlertTriangle, label: '경고종목', href: '/#section-warning' },
];

export default function VerticalNav() {
  return (
    <nav className="hidden md:flex flex-col items-center w-12 bg-white border-r border-[#E5E7EB] py-3 sticky top-0 h-screen shrink-0">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            className="group relative flex items-center justify-center w-10 h-10 mb-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Icon className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
